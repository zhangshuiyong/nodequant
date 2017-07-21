/**
 * Created by Administrator on 2017/6/12.
 */
let fs=require("fs");
require("../userConfig");

let MongoClient = require('mongodb').MongoClient;

let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

//策略仓位管理器
class Position{
    constructor(){
        this.strategyName="";
        this.symbol="";

        this.longPosition = 0;
        this.longTdPosition = 0;
        this.longYdPosition = 0;

        this.shortPosition = 0;
        this.shortTdPosition = 0;
        this.shortYdPosition = 0;
    }

    UpdatePositionByTradeData(trade) {
        //""更新成交数据"""
        if(trade.direction == Direction.Buy)
        {
            //多方开仓，则对应多头的持仓和今仓增加
            if(trade.offset == OpenCloseFlagType.Open)
            {
                this.longPosition += trade.volume;
                this.longTdPosition += trade.volume;
            }else if(trade.offset == OpenCloseFlagType.CloseToday){
                //买入平今，对应空头的持仓和今仓减少
                if(this.shortPosition>0) {
                    this.shortPosition -= trade.volume;
                }

                if(this.shortTdPosition>0){
                    this.shortTdPosition -= trade.volume;
                }

            }else if(trade.offset == OpenCloseFlagType.CloseYesterday)
            {
                //买入平昨，对应空头的持仓和昨仓减少
                if(this.shortPosition>0){
                    this.shortPosition -= trade.volume;
                }

                if(this.shortYdPosition>0)
                {
                    this.shortYdPosition -= trade.volume;
                }
            }else if(trade.offset == OpenCloseFlagType.Close)
            {
                //买入平仓,默认先平昨天空仓,再平今空仓
                if(this.shortPosition>0){
                    this.shortPosition -= trade.volume;
                }

                if(this.shortYdPosition>0)
                {
                    this.shortYdPosition -= trade.volume;
                }else if(this.shortTdPosition>0)
                {
                    this.shortTdPosition -= trade.volume;
                }
            }
        }else{
           // 空头,和多头相同
            if(trade.offset == OpenCloseFlagType.Open){
                //卖出开仓
                this.shortPosition += trade.volume;
                this.shortTdPosition += trade.volume;
            }else if(trade.offset == OpenCloseFlagType.CloseToday)
            {
                //卖出平今
                if(this.longPosition){
                    this.longPosition -= trade.volume;
                }

                if(this.longTdPosition){
                    this.longTdPosition -= trade.volume;
                }
            }else if(trade.offset == OpenCloseFlagType.CloseYesterday){
                //卖出平昨
                if(this.longPosition>0){
                    this.longPosition -= trade.volume;
                }

                if(this.longYdPosition>0){
                    this.longYdPosition -= trade.volume;
                }
            }else if(trade.offset == OpenCloseFlagType.Close){
                //卖出平仓,默认先平昨天多仓,再平今多仓
                if(this.longPosition>0)
                {
                    this.longPosition -= trade.volume;
                }

                //有昨仓先平昨仓
                if(this.longYdPosition>0)
                {
                    this.longYdPosition -= trade.volume;
                }else if(this.longTdPosition>0)
                {
                    this.longTdPosition -= trade.volume;
                }
            }
        }
    }
}

//////////////////////////////////////////////////////////////Private Method////////////////////////////////

function _registerEvent(myEngine) {


    global.AppEventEmitter.on(EVENT.OnCreateStrategyFailed,function (strategyName) {
        let error=new NodeQuantError("StrategyEngine",ErrorType.StrategyError,new Date().toLocaleString(),strategyName+"策略运行环境出错");
        global.AppEventEmitter.emit(EVENT.OnError,error);

        myEngine.StopStrategy(strategyName);
    });

    global.AppEventEmitter.on(EVENT.OnTick,function (tick) {
        for(let strategyName in myEngine.StrategyDic)
        {
            let strategy = myEngine.StrategyDic[strategyName];

            if(strategy!=undefined)
            {
                let strategySymbolDic = strategy.symbols;
                for(let symbol in strategySymbolDic)
                {
                    if(tick.symbol==symbol)
                    {
                        //更新策略-合约中的最新Tick
                        myEngine.Symbol_LastTickDic[symbol]=tick;

                        //推送最新Tick
                        strategy.OnTick(tick);
                    }
                }
            }
        }
    });


    global.AppEventEmitter.on(EVENT.OnOrder,function (order) {

        let strategyName = myEngine.StrategyOrderID_StrategyNameDic[order.strategyOrderID];
        let strategy= myEngine.StrategyDic[strategyName];

        if(strategy!=undefined)
        {
            //推送到下单策略
            strategy.OnOrder(order);

            //记录策略的所有Order
            let orderDic=myEngine.StrategyName_OrderDic[strategy.name];
            if(orderDic==undefined)
            {
                orderDic={};
                myEngine.StrategyName_OrderDic[strategy.name]=orderDic;
            }

            orderDic[order.strategyOrderID]=order;
        }
    });


    global.AppEventEmitter.on(EVENT.OnTrade,function (trade) {

        //推送到下单策略
        let strategyName = myEngine.StrategyOrderID_StrategyNameDic[trade.strategyOrderID];
        let strategy= myEngine.StrategyDic[strategyName];

        if(strategy!=undefined)
        {
            strategy.OnTrade(trade);

            //记录策略的所有成交
            let tradeDic=myEngine.StrategyName_TradeDic[strategy.name];
            if(tradeDic==undefined)
            {
                tradeDic={};
                myEngine.StrategyName_TradeDic[strategy.name]=tradeDic;
            }
            tradeDic[trade.strategyOrderID]=trade;

            myEngine.UpdateStrategyPosition(strategy.name,trade);
            myEngine.RecordTrade(strategy.name,trade);
        }

    });
}

class StrategyEngine {

    constructor() {

        this.IsWorking=false;

        //事件推送策略字典,策略名字—策略实例字典
        this.StrategyDic = {};

        //order与策略实例的字典
        this.StrategyOrderID_StrategyNameDic = {};

        //策略-成交字典
        this.StrategyName_OrderDic = {};

        this.StrategyName_TradeDic = {};
        //策略-持仓字典
        this.StrategyName_PositionDic = {};
        this.StrategyName_ExceptionListDic = {};

        //策略-订阅的合约-最新Tick
        this.Symbol_LastTickDic={};

        _registerEvent(this);
    }

    ////////////////////////////////////////////////////////////// Public Method //////////////////////////////////////////////////////////

    Start() {

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"StrategyEngine Start");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //启动
        let strategyConfigs = StrategyConfig.Strategys;
        for (let index in strategyConfigs) {
            let strategyConfig = strategyConfigs[index];
            this.StartStrategy(strategyConfig);
        }

        this.IsWorking=true;

    }

    Stop(){

        //1.停止所有策略
        for(let strategyName in this.StrategyDic)
        {
            this.StrategyDic[strategyName].Stop();
        }

        //2.结算各个策略的当天净值
        for(let strategyName in this.StrategyDic)
        {
            let strategy = this.StrategyDic[strategyName];

            //每个策略一个结算纪录
            this.SettleStrategyAccount(strategy);

        }

        //3.清空策略列表
        this.StrategyDic={};

        this.IsWorking=false;

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"StrategyEngine Stop");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    StartStrategy(strategyConfig) {
        let strategyInstance = this.CreateStrategy(strategyConfig);
        if (strategyInstance != undefined) {
            //加入事件推送策略字典
            this.StrategyDic[strategyConfig.name] = strategyInstance;

            //加载策略的持仓数据,准备交易
            this.LoadPosition(strategyConfig.name);

            //订阅合约
            this.SubscribeStrategySymbols(strategyInstance.name, strategyInstance.symbols);

            //策略启动成功,(由于策略订阅合约是否成功是异步的,而且可能多品种订阅,所以如果订阅失败,会报告策略运行错误)
            let message=strategyConfig.name+"策略启动成功";
            let log=new NodeQuantLog(strategyConfig.name,LogType.INFO,new Date().toLocaleString(),message);
            global.AppEventEmitter.emit(EVENT.OnLog,log);
        }
    }

    CreateStrategy(strategyConfig) {
        let strategyInstance = undefined;
        let strategyClassPath = StrategyConfig.StrategyDir + strategyConfig.className;

        try {
            let StrategyClass = require(strategyClassPath);
            //创建策略实例
            strategyInstance = new StrategyClass(strategyConfig);
        } catch (ex) {
            strategyInstance = undefined;

            let message= "New Strategy Instance Failed.Strategy Name:" + strategyConfig.name + ",Error Msg:" + ex.message;
            let error=new NodeQuantError(strategyConfig.name,ErrorType.StrategyError,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);
        }

        return strategyInstance;
    }

    GetStrategy(strategyName){
        return this.StrategyDic[strategyName];
    }

    SubscribeStrategySymbolsOfClient(clientName)
    {
        let strategyConfigs = StrategyConfig.Strategys;
        for (let index in strategyConfigs) {
            let strategyConfig = strategyConfigs[index];
            //策略的订阅的品种是否在这个client
            for (let symbol in strategyConfig.symbols) {
                let contract = global.Application.MainEngine.GetContract(symbol);
                if (contract != undefined && contract.clientName==clientName) {

                    let message= clientName+"发出重新订阅" + strategyConfig.name + "策略的品种:" + symbol+"的请求";
                    let log=new NodeQuantLog(strategyConfig.name,LogType.INFO,message);
                    global.AppEventEmitter.emit(EVENT.OnLog, log);

                    global.Application.MainEngine.Subscribe(contract.clientName, symbol, function (contractName,clientName, ret) {
                        if (ret != 0) {

                            let message = strategyName + "在" + clientName + "客户端订阅" + symbol + "请求发送失败,错误码：" + ret;
                            let error = new NodeQuantError(strategyName, ErrorType.StrategyError, message);
                            global.AppEventEmitter.emit(EVENT.OnError, error);

                        }
                    });
                }
            }
        }
    }

    SubscribeStrategySymbols(strategyName, strategySymbolDic) {
        for (let symbol in strategySymbolDic) {
            let contract = global.Application.MainEngine.GetContract(symbol);
            if (contract != undefined) {
                global.Application.MainEngine.Subscribe(contract.clientName, symbol, function (contractName,clientName, ret) {
                    if (ret != 0) {

                        let message=strategyName + "在" + clientName + "客户端订阅" + contractName + "请求发送失败,错误码：" + ret;
                        let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);
                        global.AppEventEmitter.emit(EVENT.OnError, error);

                        global.AppEventEmitter.emit(EVENT.OnCreateStrategyFailed, strategyName);
                    }
                });
            } else {

                let message= strategyName + "订阅失败:" + symbol + "不存在";
                let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);

                global.AppEventEmitter.emit(EVENT.OnError, error);

                global.AppEventEmitter.emit(EVENT.OnCreateStrategyFailed, strategyName);
            }
        }
    }

    StopStrategy(strategyName) {
        //停止策略,策略引擎的order,trade,tick都不会推送
        delete this.StrategyDic[strategyName];

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),strategyName+"停止策略");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    SendLimitOrder(strategy, contractName, direction, openclose, volume, limitPrice) {
        let strategyEngine=this;
        let contract = global.Application.MainEngine.GetContract(contractName);

        global.Application.MainEngine.SendLimitOrder(contract.clientName, contractName, direction, openclose, volume, limitPrice, function (clientName, ret) {
            if (ret > 0) {
                //如果下单成功,ret返回码等于orderRefId
                let orderRefId = ret;
                // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
                let strategyOrderID = clientName + "." + orderRefId;

                strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
            }
        });
    }

    SendFillAndKillLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine=this;
        let contract = global.Application.MainEngine.GetContract(contractName);

        global.Application.MainEngine.SendFillAndKillLimitOrder(contract.clientName,contractName,direction,openclose,volume,limitPrice,function (clientName, ret) {
            if (ret > 0) {
                //如果下单成功,ret返回码等于orderRefId
                let orderRefId = ret;
                // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
                let strategyOrderID = clientName + "." + orderRefId;

                strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
            }
        });
    }

    SendFillOrKillLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine = this;
        let contract = global.Application.MainEngine.GetContract(contractName);
        global.Application.MainEngine.SendFillOrKillLimitOrder(contract.clientName, contractName, direction, openclose, volume, limitPrice, function (clientName, ret) {
            if (ret > 0) {
                //如果下单成功,ret返回码等于orderRefId
                let orderRefId = ret;
                // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
                let strategyOrderID = clientName + "." + orderRefId;

                strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
            }
        });
    }

    SendStopLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice){
        let strategyEngine = this;
        let contract = global.Application.MainEngine.GetContract(contractName);
        global.Application.MainEngine.SendStopLimitOrder(contract.clientName,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice,function (clientName, ret) {
            if (ret > 0) {
                //如果下单成功,ret返回码等于orderRefId
                let orderRefId = ret;
                // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
                let strategyOrderID = clientName + "." + orderRefId;

                strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
            }
        });
    }

    //策略未结束订单
    GetUnFinishOrderList(strategyName)
    {
        let orderDic=this.StrategyName_OrderDic[strategyName];
        let unFinishOrderList=[];
        for(let strategyOrderId in orderDic)
        {
            let order = orderDic[strategyOrderId];
            let isOrderFinish = (order.status == OrderStatusType.Canceled || order.status == OrderStatusType.AllTraded);
            if (isOrderFinish == false) {
                unFinishOrderList.push(order);
            }
        }

        return unFinishOrderList;
    }

    CancelOrder(order)
    {
        global.Application.MainEngine.CancelOrder(order.clientName,order);
    }

    GetPosition(strategyName, symbol) {
        let strategy=this.StrategyName_PositionDic[strategyName];
        let Position=undefined;

        if(strategy)
        {
            Position = this.StrategyName_PositionDic[strategyName][symbol];
        }

        return Position;
    }

    UpdateStrategyPosition(strategyName, trade) {
        let PositionDic = this.StrategyName_PositionDic[strategyName];
        if (PositionDic == undefined) {
            PositionDic = {};
            this.StrategyName_PositionDic[strategyName] = PositionDic;
        }

        //position对象键值是合约名字,凡是该合约，都要更新这个position对象
        let position = PositionDic[trade.symbol];

        if (position == undefined) {
            position = new Position();
            PositionDic[trade.symbol] = position;
            position.symbol = trade.symbol;
            position.strategyName = strategyName;
        }

        position.UpdatePositionByTradeData(trade);
        this.RecordPosition(strategyName,position);
    }

    SettleCommission(feeInfo,tradeRecord)
    {
        let symbolFee=0;
        //确定费率
        if(tradeRecord.offset==OpenCloseFlagType.CloseToday)
        {
            symbolFee=feeInfo.closeTodayFee;
        }else
        {
            symbolFee=feeInfo.fee;
        }

        let tradeRecordCommission = undefined ;
        //确定手续费计算方法
        if(feeInfo.feeType==FeeType.TradeAmount)
        {
            let contract=global.Application.MainEngine.GetContract(tradeRecord.symbol);
            tradeRecordCommission= symbolFee * tradeRecord.volume * tradeRecord.price * contract.size;
        }else if(feeInfo.feeType==FeeType.TradeVolume){
            tradeRecordCommission = symbolFee * tradeRecord.volume ;
        }

        return tradeRecordCommission;
    }

    SettleTradeRecordValue(tradeRecord){
        let tradeRecordValue = undefined;
        let contract=global.Application.MainEngine.GetContract(tradeRecord.symbol);
        if(tradeRecord.direction==Direction.Buy)
        {
            tradeRecordValue = tradeRecord.volume * tradeRecord.price * contract.size;
        }else if(tradeRecord.direction==Direction.Sell)
        {
            tradeRecordValue= tradeRecord.volume * tradeRecord.price * contract.size;
            tradeRecordValue = -tradeRecordValue;
        }

        return tradeRecordValue;
    }

    //当天收盘的合约持仓价值
    SettleCurrentTradingDay_Exit_SymbolPositionValue(symbol_position)
    {
        let contract=global.Application.MainEngine.GetContract(symbol_position.symbol);

        let symbol_lastTick= this.Symbol_LastTickDic[symbol_position.symbol];

        let currentTradingDay_Exit_Symbol_PositionValue = symbol_position.longPosition * symbol_lastTick.lastPrice * contract.size;
        currentTradingDay_Exit_Symbol_PositionValue -= symbol_position.shortPosition * symbol_lastTick.lastPrice * contract.size;

        return currentTradingDay_Exit_Symbol_PositionValue;
    }

    GetTradingDay()
    {
        let currentTradingDate=new Date();
        let currentTradingDayStr=currentTradingDate.toLocaleDateString();
        let dateArray=currentTradingDayStr.split("-");
        if(dateArray[1].length==1)
        {
            dateArray[1]="0"+dateArray[1];
        }

        if(dateArray[2].length==1)
        {
            dateArray[2]="0"+dateArray[2];
        }
        let currentTradingDay=dateArray[0]+dateArray[1]+dateArray[2];
        return currentTradingDay;
    }

    SettleStrategyAccount(strategyInstance){
        let strategyEngine=this;
        //每个策略的净值对象,日期,策略名字,交易品种,盈利,手续费,当日盈利

        let currentTradingDay=strategyEngine.GetTradingDay();

        //获得上一天的持仓结算价值
        this.GetLastTradingDayStrategySettlement(strategyInstance.name,function (lastSettlement) {

            let lastTradingDay_Exit_PositionValue = 0;
            if(lastSettlement!=undefined)
            {
                lastTradingDay_Exit_PositionValue= lastSettlement.exitPositionValue;
            }

            //每天的数据库成交纪录
            strategyEngine.GetTradeRecord(strategyInstance.name,currentTradingDay,function (tradeRecordList) {
                let currentTradingDay_Commission=0;
                let currentTradingDay_TradeValue=0;
                let currentTradingDay_Exit_PositionValue = 0;
                let currentTradingDay_StrategyProfit = 0;
                let currentTradingDay_Profit = 0;

                for(let index in tradeRecordList)
                {
                    let tradeRecord=tradeRecordList[index];
                    let feeInfo=strategyInstance.symbols[tradeRecord.symbol];

                    let tradeRecordValue=strategyEngine.SettleTradeRecordValue(tradeRecord);
                    currentTradingDay_TradeValue += tradeRecordValue;

                    let tradeRecordCommission = strategyEngine.SettleCommission(feeInfo,tradeRecord);
                    currentTradingDay_Commission += tradeRecordCommission;
                }

                //策略收盘的持仓价值
                let PositionDic = strategyEngine.StrategyName_PositionDic[strategyInstance.name];

                for(let symbol in PositionDic)
                {
                    //策略中每个品种的收盘持仓价值= 品种的收盘点数 * 合约点数乘数 * 手数
                    let symbol_position = PositionDic[symbol];
                    let currentTradingDay_Exit_Symbol_PositionValue=strategyEngine.SettleCurrentTradingDay_Exit_SymbolPositionValue(symbol_position);
                    currentTradingDay_Exit_PositionValue+=currentTradingDay_Exit_Symbol_PositionValue;
                }

                let DaySettlement={};
                DaySettlement.datetime=new Date().toLocaleString();
                DaySettlement.strategyName=strategyInstance.name;
                DaySettlement.exitPositionValue = currentTradingDay_Exit_PositionValue;
                DaySettlement.commission = currentTradingDay_Commission;
                DaySettlement.strategyProfit = currentTradingDay_Exit_PositionValue -  currentTradingDay_TradeValue - lastTradingDay_Exit_PositionValue;
                DaySettlement.dayProfit = DaySettlement.strategyProfit - DaySettlement.commission;

                strategyEngine.RecordSettlement(strategyInstance.name,DaySettlement);
            });
        });

    }

    //仓位是一个策略,一个合约，对应一个仓位,仓位变化要更新数据库，有成交不一定有新的仓位,只会更新之前的仓位
    RecordPosition(strategyName,position)
    {
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {

            if (err == null) {
                db.collection("PositionBook").updateOne({strategyName:position.strategyName,symbol:position.symbol},position,{upsert:true}, function (err, result) {
                    db.close();
                });
            } else {
                throw new Error("记录Position失败，原因是打开数据库失败.");
            }
        });
    }

    LoadPosition(strategyName)
    {
        let strategyEngine=this;
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {
            if (err == null) {

                db.collection("PositionBook").find({strategyName:strategyName},function (err, positionsCursor) {

                    positionsCursor.forEach(function(position) {
                        //把仓位加入到策略仓位中
                        let PositionDic = strategyEngine.StrategyName_PositionDic[strategyName];
                        if (PositionDic == undefined) {
                            PositionDic = {};
                            strategyEngine.StrategyName_PositionDic[strategyName] = PositionDic;
                        }

                        let positionObj=new Position();
                        positionObj.strategyName=position.strategyName;
                        positionObj.symbol=position.symbol;
                        positionObj.longPosition=position.longPosition;
                        positionObj.longTdPosition=position.longTdPosition;
                        positionObj.longYdPosition=position.longYdPosition;
                        positionObj.shortPosition=position.shortPosition;
                        positionObj.shortTdPosition=position.shortTdPosition;
                        positionObj.shortYdPosition=position.shortYdPosition;

                        PositionDic[position.symbol] = positionObj;
                    });

                    db.close();
                });
            } else {
                throw new Error(strategyName+"策略加载Position失败，原因是打开数据库失败.");
            }
        });
    }

    //记录策略完成订单
    RecordOrder(strategyName, orderRecord) {
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {

            if (err == null) {
                db.collection("OrderBook").insertOne(orderRecord, function (err, result) {
                    db.close();
                });
            } else {
                throw new Error("记录Order失败，原因是打开数据库失败.");
            }
        });
    }

    //记录策略成交
    RecordTrade(strategyName, trade) {
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        trade.directionName=DirectionReverse[trade.direction];
        trade.offsetName=OpenCloseFlagReverseType[trade.offset];

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {

            if (err == null) {
                db.collection("TradeBook").insertOne(trade, function (err, result) {
                    db.close();
                });
            } else {
                throw new Error("记录trade失败，原因是打开数据库失败.");
            }
        });
    }


    GetTradeRecord(strategyName,currentDay,getTradeRecordCallback)
    {
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {
            if (err == null) {
                db.collection("TradeBook").find({tradeDay:currentDay}).toArray(function(err,tradeRecordList) {
                    if(err==null)
                    {
                        getTradeRecordCallback(tradeRecordList);
                    }else
                    {
                        let message="获取trade record失败，原因:"+err.message;
                        let error=new NodeQuantError("StrategyEngine",ErrorType.StrategyError,message);

                        global.AppEventEmitter.emit(EVENT.OnError,error);
                    }

                    db.close();
                });

            } else {
                throw new Error(strategyName+"策略加载Position失败，原因是打开数据库失败.");
            }
        });
    }

    RecordSettlement(strategyName,settlement){
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {

            if (err == null) {
                db.collection("SettlementBook").insertOne(settlement, function (err, result) {
                    db.close();
                });
            } else {
                throw new Error("记录Settlement失败，原因是打开数据库失败.");
            }
        });
    }

    GetLastTradingDayStrategySettlement(strategyName,callback){
        let strategyStatusDBName = strategyName + "_Status_DB";
        let strategyStatusDBAddress = "mongodb://" + MongoDBConfig.Host + ":" + MongoDBConfig.Port + "/" + strategyStatusDBName+"?connectTimeoutMS="+DB_Connection_TimeOut;

        MongoClient.connect(strategyStatusDBAddress, function (err, db) {
            if (err == null) {
                db.collection("SettlementBook").find({}).toArray(function(err,settlementList) {
                    if(err==null)
                    {
                        if(settlementList.length>0)
                        {
                            let lastSettlement = settlementList[settlementList.length-1];
                            callback(lastSettlement);
                        }else if(settlementList.length==0)
                        {
                            callback(undefined);
                        }
                    }else
                    {
                        let message= "获取LastTradingDayStrategySettlement失败，原因:"+err.message;
                        let error=new NodeQuantError("StrategyEngine",ErrorType.StrategyError,message);
                        global.AppEventEmitter.emit(EVENT.OnError,error);
                    }

                    db.close();
                });

            } else {
                console.log(strategyName+"策略获取上一天策略的结算数据失败，原因是打开数据库失败.");
            }
        });
    }

    //记录策略异常
    RecordException(strategyName, exception) {

    }
}

module.exports=StrategyEngine;