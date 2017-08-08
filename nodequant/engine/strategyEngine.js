/**
 * Created by Administrator on 2017/6/12.
 */
let fs=require("fs");
require("../common");
require("../userConfig");

let DateTimeUtil=require("../util/DateTimeUtil");
let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

//策略仓位管理器
//一个合约一个仓位对象
class Position {
    constructor() {
        this.strategyName = "";
        this.symbol = "";
        this.longPositionTradeRecordList = [];
        this.shortPositionTradeRecordList = [];
    }

    //获取总的 锁仓
    GetLockedPosition()
    {
        let longPosition=this.GetLongPosition();
        let shortPosition=this.GetShortPosition();

        let lockedPostion=Math.min(longPosition,shortPosition);

        return lockedPostion;
    }

    //获取总的 非锁 多仓
    GetUnLockLongPosition()
    {
        let unLockLongPosition=0;
        let longPosition=this.GetLongPosition();
        let shortPosition=this.GetShortPosition();

        if (longPosition > shortPosition) {
            unLockLongPosition = longPosition - shortPosition;
        }

        return unLockLongPosition;
    }

    //获取总的 非锁 空仓
    GetUnLockShortPosition()
    {
        let unLockShortPosition=0;
        let longPosition=this.GetLongPosition();
        let shortPosition=this.GetShortPosition();

        if (shortPosition > longPosition) {
            unLockShortPosition = shortPosition - longPosition;
        }

        return unLockShortPosition;
    }

    //获取总的多仓位
    GetLongPosition()
    {
        let longPosition=0;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            longPosition+=tradeRecord.volume;
        }

        return longPosition;
    }

    //获取总的空仓位
    GetShortPosition()
    {
        let shortPosition=0;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            shortPosition+=tradeRecord.volume;
        }

        return shortPosition;
    }

    //获取 多仓 持仓均价
    GetLongPostionAveragePrice()
    {
        let longPositionSumAmount=0;
        let longPositionSumVolume=0;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            longPositionSumVolume += tradeRecord.volume;
            longPositionSumAmount += tradeRecord.price*tradeRecord.volume;
        }
        let longPositionAveragePrice=0;
        if(longPositionSumVolume!=0)
        {
            longPositionAveragePrice = longPositionSumAmount/longPositionSumVolume;
        }
        return longPositionAveragePrice;
    }

    //获取 空仓 持仓 均价
    GetShortPositionAveragePrice()
    {
        let shortPositionSumAmount=0;
        let shortPositionSumVolume=0;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            shortPositionSumVolume += tradeRecord.volume;
            shortPositionSumAmount += tradeRecord.price*tradeRecord.volume;
        }
        let shortPositionAveragePrice=0;
        if(shortPositionSumVolume!=0)
        {
            shortPositionAveragePrice = shortPositionSumAmount/shortPositionSumVolume;
        }
        return shortPositionAveragePrice;
    }


    /// <summary>
    /// 获取合约的今天锁仓数量
    /// </summary>
    /// <returns>今天锁仓数量</returns>
    GetLockedTodayPosition()
    {
        let longTdPosition = this.GetLongTodayPosition();
        let shortTdPosition = this.GetShortTodayPosition();

        let tdLockedPostion=Math.min(longTdPosition,shortTdPosition);

        return tdLockedPostion;
    }

    /// <summary>
    /// 获取非锁,多仓,今仓
    /// </summary>
    /// <returns> 获取非锁,多仓,今仓 数量</returns>
    GetUnLockLongTodayPosition() {
        let unLockLongTodayPosition = 0;

        let longTdPosition = this.GetLongTodayPosition();
        let shortTdPosition = this.GetShortTodayPosition();

        if (longTdPosition > shortTdPosition) {
            unLockLongTodayPosition = longTdPosition - shortTdPosition;
        }

        return unLockLongTodayPosition;
    }

    /// <summary>
    /// 获取非锁,空仓,今仓
    /// </summary>
    /// <returns>获取非锁,空仓,今仓 数量</returns>
    GetUnLockShortTodayPosition()
    {
        let unLockShortTodayPosition = 0;

        let longTdPosition = this.GetLongTodayPosition();
        let shortTdPosition = this.GetShortTodayPosition();

        if (shortTdPosition > longTdPosition) {
            unLockShortTodayPosition = shortTdPosition - longTdPosition;
        }

        return unLockShortTodayPosition;
    }

    /// <summary>
    /// 获取多仓,今仓
    /// </summary>
    /// <returns> 获取多仓,今仓 数量</returns>
    GetLongTodayPosition()
    {
        let longTdPosition=0;
        let TodayTradingDay=global.Application.StrategyEngine.TradingDay;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            if(tradeRecord.tradingDay==TodayTradingDay)
            {
                longTdPosition+=tradeRecord.volume;
            }
        }

        return longTdPosition;
    }

    /// <summary>
    /// 获取空仓,今仓
    /// </summary>
    /// <returns> 获取空仓,今仓 数量</returns>
    GetShortTodayPosition()
    {
        let shortTdPosition=0;
        let TodayTradingDay=global.Application.StrategyEngine.TradingDay;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            if(tradeRecord.tradingDay==TodayTradingDay)
            {
                shortTdPosition+=tradeRecord.volume;
            }
        }
        return shortTdPosition;
    }

    /// <summary>
    /// 获取合约的 昨 锁仓 数量
    /// </summary>
    /// <returns>昨 锁仓 数量</returns>
    GetLockedYesterdayPosition()
    {
        let longYdPosition = this.GetLongYesterdayPosition();
        let shortYdPosition = this.GetShortYesterdayPosition();

        let ydLockedPostion=Math.min(longYdPosition,shortYdPosition);

        return ydLockedPostion;
    }

    /// <summary>
    /// 获取合约的 昨 非锁 多仓
    /// </summary>
    /// <returns>昨 非锁 多仓 数量</returns>
    GetUnLockLongYesterdayPosition()
    {
        let unLockLongYesterdayPosition = 0;

        let longYdPosition = this.GetLongYesterdayPosition();
        let shortYdPosition = this.GetShortYesterdayPosition();

        if (longYdPosition > shortYdPosition) {
            unLockLongYesterdayPosition = longYdPosition - shortYdPosition;
        }

        return unLockLongYesterdayPosition;
    }


    /// <summary>
    /// 获取合约的 昨 非锁 空仓 数量
    /// </summary>
    /// <returns>昨 非锁 空仓 数量</returns>
    GetUnLockShortYesterdayPosition()
    {
        let unLockShortYesterdayPosition = 0;

        let longYdPosition = this.GetLongYesterdayPosition();
        let shortYdPosition = this.GetShortYesterdayPosition();

        if (shortYdPosition > longYdPosition) {
            unLockShortYesterdayPosition = shortYdPosition - longYdPosition;
        }

        return unLockShortYesterdayPosition;
    }

    /// <summary>
    /// 获取多仓,昨仓
    /// </summary>
    /// <returns> 获取多仓,昨仓 数量</returns>
    GetLongYesterdayPosition()
    {
        let longYdPosition=0;
        let TodayTradingDay=global.Application.StrategyEngine.TradingDay;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            if(tradeRecord.tradingDay!=TodayTradingDay)
            {
                longYdPosition+=tradeRecord.volume;
            }
        }
        return longYdPosition;
    }

    /// <summary>
    /// 获取空仓,昨仓
    /// </summary>
    /// <returns> 获取空仓,昨仓 数量</returns>
    GetShortYesterdayPosition()
    {
        let shortYdPosition=0;
        let TodayTradingDay=global.Application.StrategyEngine.TradingDay;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            if(tradeRecord.tradingDay!=TodayTradingDay)
            {
                shortYdPosition+=tradeRecord.volume;
            }
        }
        return shortYdPosition;
    }

    UpdatePosition(trade) {
        if (this.symbol != trade.symbol) {
            let error = new NodeQuantError("StrategyEngine", ErrorType.StrategyError, "UpdatePosition not contain this symbol:" + trade.symbol);
            global.AppEventEmitter.emit(EVENT.OnError, error);
            return;
        }

        if (trade.direction == Direction.Buy) {
            //多方开仓，则对应多头的持仓和今仓增加
            if (trade.offset == OpenCloseFlagType.Open) {
                this.longPositionTradeRecordList.push(trade);
            } else if (trade.offset == OpenCloseFlagType.CloseToday) {
                this.CloseBuyTodayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的 (平今仓买入 CloseToday Buy)手数多于"+trade.strategyName+"策略的( 今空仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            } else if (trade.offset == OpenCloseFlagType.CloseYesterday) {

                //买入平昨，对应空头的持仓和昨仓减少
                this.CloseBuyYesterDayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的 (平昨仓买入 CloseYesterday Buy)手数多于"+trade.strategyName+"策略的( 昨空仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            } else if (trade.offset == OpenCloseFlagType.Close) {
                //买入平仓,默认先平昨天空仓,再平今空仓
                //有昨仓先平昨仓
                this.CloseBuyYesterDayPosition(trade);
                //再平今空仓
                this.CloseBuyTodayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的平仓买入(Close Buy)手数多于"+trade.strategyName+"策略的( 空仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            }
        }else{
            // 空头,和多头相同
            if(trade.offset == OpenCloseFlagType.Open){
                //卖出开仓
                //计算开仓均价
                this.shortPositionTradeRecordList.push(trade);
            }else if(trade.offset == OpenCloseFlagType.CloseToday)
            {
                //卖出平今
                this.CloseSellTodayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的( 平今仓卖出 CloseToday Sell )手数多于"+trade.strategyName+"策略的( 今多仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            }else if(trade.offset == OpenCloseFlagType.CloseYesterday){
                //卖出平昨
                this.CloseSellYesterDayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的( 平昨仓卖出 CloseYesterday Sell )手数多于"+trade.strategyName+"策略的( 昨多仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            }else if(trade.offset == OpenCloseFlagType.Close){
                //卖出平仓,默认先平昨天多仓,再平今多仓
                this.CloseSellYesterDayPosition(trade);
                //再平今空仓
                this.CloseSellTodayPosition(trade);
                //更新仓位后,trade.volume还不变为0,代表平仓多于策略持仓,平了账户别人的仓位!!!
                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的( 平仓卖出 Close Sell )手数多于"+trade.strategyName+"策略的( 多仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }
            }
        }
    }

    //今仓: 平仓买入->开仓卖出(空仓)的成交记录要更新
    CloseBuyTodayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade==undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];

            //非当天的空仓不做处理
            if(tradeRecord.tradingDay != trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume==0)
            {
                delete this.shortPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume==0)
            {
                break;
            }
        }
    }

    //昨仓: 平仓买入->开仓卖出(空仓)的成交记录要更新
    CloseBuyYesterDayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade==undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord = this.shortPositionTradeRecordList[index];

            //当天的空仓不做处理
            if(tradeRecord.tradingDay == trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume==0)
            {
                delete this.shortPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume == 0)
            {
                break;
            }
        }
    }

    //今仓：平仓卖出 -> 开仓买入(多仓)的成交记录要更新
    CloseSellTodayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade==undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];

            //非当天的空仓不做处理
            if(tradeRecord.tradingDay != trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume==0)
            {
                delete this.longPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume==0)
            {
                break;
            }
        }
    }

    CloseSellYesterDayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade==undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];

            //当天的多仓不做处理
            if(tradeRecord.tradingDay == trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume==0)
            {
                delete this.longPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume==0)
            {
                break;
            }
        }
    }
}

//////////////////////////////////////////////////////////////Private Method////////////////////////////////

function _registerEvent(myEngine) {

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

        //交易日
        this.TradingDay="";

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
        //获取交易日
        this.TradingDay = this.GetTradingDay();
    }

    Stop(mainEngineStatus){

        //1.停止所有策略
        for(let strategyName in this.StrategyDic)
        {
            this.StrategyDic[strategyName].Stop();
        }

        //2.白天收盘当做一天的结束(3:00 or 3.15), 结算各个策略的当天净值
        if(mainEngineStatus==MainEngineStatus.DayStop)
        {
            for(let strategyName in this.StrategyDic)
            {
                let strategy = this.StrategyDic[strategyName];

                //每个策略一个结算纪录
                this.SettleStrategyAccount(strategy);

            }
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
        let strategyClassPath = __dirname+"/../strategy/" + strategyConfig.className;

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

                    let ret = global.Application.MainEngine.Subscribe(contract.clientName, symbol);

                    if (ret != 0) {
                        let message = strategyConfig.name + "在" + contract.clientName + "客户端订阅" + symbol + "请求发送失败,错误码：" + ret;
                        let error = new NodeQuantError(strategyConfig.name, ErrorType.StrategyError, message);
                        global.AppEventEmitter.emit(EVENT.OnError, error);

                    }
                }
            }
        }
    }

    SubscribeStrategySymbols(strategyName, strategySymbolDic) {
        for (let symbol in strategySymbolDic) {
            let contract = global.Application.MainEngine.GetContract(symbol);
            if (contract != undefined) {
               let ret = global.Application.MainEngine.Subscribe(contract.clientName, symbol);
                if (ret != 0) {
                    let message=strategyName + "在" + contract.clientName + "客户端订阅" + symbol + "请求发送失败,错误码：" + ret;
                    let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);
                    global.AppEventEmitter.emit(EVENT.OnError, error);
                }
            } else {

                let message= strategyName + "订阅失败:" + symbol + "不存在";
                let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);

                global.AppEventEmitter.emit(EVENT.OnError, error);

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

        let ret = global.Application.MainEngine.SendLimitOrder(contract.clientName, contractName, direction, openclose, volume, limitPrice);
        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = contract.clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendFillAndKillLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine=this;
        let contract = global.Application.MainEngine.GetContract(contractName);

        let ret = global.Application.MainEngine.SendFillAndKillLimitOrder(contract.clientName,contractName,direction,openclose,volume,limitPrice);
        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = contract.clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendFillOrKillLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine = this;
        let contract = global.Application.MainEngine.GetContract(contractName);
        let ret = global.Application.MainEngine.SendFillOrKillLimitOrder(contract.clientName, contractName, direction, openclose, volume, limitPrice);

        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = contract.clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendStopLimitOrder(strategy,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice){
        let strategyEngine = this;
        let contract = global.Application.MainEngine.GetContract(contractName);
        let ret = global.Application.MainEngine.SendStopLimitOrder(contract.clientName,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice);

        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = contract.clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
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
        //成交记录，记录策略名字
        trade.strategyName= strategyName;
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

        position.UpdatePosition(trade);
        this.RecordPosition(strategyName,position);
    }

    SettleCommission(feeInfo,tradeRecord)
    {
        let symbolFee=0;
        let tradeRecordCommission = 0 ;

        if(feeInfo!=undefined)
        {
            //确定费率
            if(tradeRecord.offset==OpenCloseFlagType.CloseToday)
            {
                symbolFee = feeInfo.closeTodayFee;
            }else
            {
                symbolFee = feeInfo.fee;
            }

            //是否有设置fee,closeTodayFee字段

            if(symbolFee!=undefined)
            {
                //确定手续费计算方法
                if(feeInfo.feeType==FeeType.TradeAmount)
                {
                    let contract=global.Application.MainEngine.GetContract(tradeRecord.symbol);
                    tradeRecordCommission= symbolFee * tradeRecord.volume * tradeRecord.price * contract.size;
                }else if(feeInfo.feeType==FeeType.TradeVolume){
                    tradeRecordCommission = symbolFee * tradeRecord.volume;
                }else
                {

                    let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"无法正确计算交易记录的手续费,策略没有正确设置feeType字段");
                    global.AppEventEmitter.emit(EVENT.OnLog,log);
                }
            }else
            {
                let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"无法正确计算交易记录的手续费,策略没有设置fee,closeTodayFee字段");
                global.AppEventEmitter.emit(EVENT.OnLog,log);
            }
        }else
        {
            let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"无法正确计算交易记录的手续费,策略没有"+tradeRecord.symbol+"品种的手续费信息");
            global.AppEventEmitter.emit(EVENT.OnLog,log);
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
        let currentTradingDay_Exit_Symbol_PositionValue = 0;
        if(symbol_lastTick!=undefined)
        {
            let longPosition = symbol_position.GetLongPosition();
            let shortPosition = symbol_position.GetShortPosition();
            currentTradingDay_Exit_Symbol_PositionValue =  longPosition  * symbol_lastTick.lastPrice * contract.size;
            currentTradingDay_Exit_Symbol_PositionValue -= shortPosition * symbol_lastTick.lastPrice * contract.size;
        }else
        {
            let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"无法正确计算当前品种持仓价值,策略没有订阅"+symbol_position.symbol+"品种,却有持仓");
            global.AppEventEmitter.emit(EVENT.OnLog,log);
        }

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
                    tradeRecord=JSON.parse(tradeRecord);

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
        //记录策略所有品种的key,可以根据这个Key表获得一共有多少个品种的仓位
        let strategyPositionKey = strategyName+".Position";
        global.Application.SystemDBClient.sadd(strategyPositionKey,position.symbol);


        let strategyPositionSymbolKey = strategyName+".Position."+position.symbol;

        global.Application.SystemDBClient.del(strategyPositionSymbolKey, function(err, response) {
            if (err) {
                throw new Error(strategyName+"清空Position失败，原因:"+err.message);
            } else{
                //清空策略数据库的Position表成功
                //遍历多仓，记录到数据库

                for(let index in position.longPositionTradeRecordList)
                {
                    let tradeRecord = position.longPositionTradeRecordList[index];
                    global.Application.StrategyEngine.RecordPositionItem(strategyPositionSymbolKey,tradeRecord);
                }
                //遍历空仓,记录到数据库
                for(let index in position.shortPositionTradeRecordList)
                {
                    let tradeRecord = position.shortPositionTradeRecordList[index];
                    global.Application.StrategyEngine.RecordPositionItem(strategyPositionSymbolKey,tradeRecord);
                }
            }
        });

    }

    //将持仓的成交记录到持仓列表当中
    RecordPositionItem(positionBookDBAddress,tradeRecord)
    {
        global.Application.SystemDBClient.rpush(positionBookDBAddress,JSON.stringify(tradeRecord),function (err,reply) {
            if(err) {

                let message="记录Position失败，原因:"+err.message;
                let error=new NodeQuantError("MainEngine",ErrorType.DBError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);

                throw new Error("记录Position失败，原因:"+err.message);
            }
        });
    }

    LoadPosition(strategyName)
    {
        let strategyPositionKey = strategyName+".Position";
        global.Application.SystemDBClient.smembers(strategyPositionKey,function (err,symbolSet) {
            if(err)
            {
                throw new Error("LoadPosition失败，原因:"+err.message);
            }else{
                let PositionDic = global.Application.StrategyEngine.StrategyName_PositionDic[strategyName];
                if (PositionDic == undefined) {
                    PositionDic = {};
                    global.Application.StrategyEngine.StrategyName_PositionDic[strategyName] = PositionDic;
                }

                for(let index in symbolSet)
                {
                    let symbol= symbolSet[index];
                    if(PositionDic[symbol]==undefined)
                    {
                        //加载仓位列表的时候没有这个仓位,要查询列表
                        let positionObj=new Position();
                        positionObj.symbol=symbol;
                        positionObj.strategyName=strategyName;
                        PositionDic[positionObj.symbol] = positionObj;
                    }

                    //查找Position.Symbol所有仓位成交记录
                    let strategyPositionSymbolKey = strategyName+".Position."+symbol;
                    global.Application.SystemDBClient.lrange(strategyPositionSymbolKey, 0, -1, function(err, tradeRecordStrList) {
                        if(err)
                        {
                            throw new Error(strategyPositionSymbolKey+"表LoadPosition失败，原因:"+err.message);
                        }else
                        {
                            for(let index in tradeRecordStrList)
                            {
                                let tradeRecordStr=tradeRecordStrList[index];
                                let tradeRecord=JSON.parse(tradeRecordStr);
                                if (tradeRecord.offset == OpenCloseFlagType.Open && tradeRecord.direction == Direction.Buy) {
                                    //多方开仓,持仓
                                    PositionDic[tradeRecord.symbol].longPositionTradeRecordList.push(tradeRecord);
                                }else if(tradeRecord.offset == OpenCloseFlagType.Open && tradeRecord.direction == Direction.Sell)
                                {
                                    //空方开仓，持仓
                                    PositionDic[tradeRecord.symbol].shortPositionTradeRecordList.push(tradeRecord);
                                }
                            }
                        }
                    });

                }
            }
        });
    }


    LoadTickFromDB(strategy,symbol,LookBackCount,OnFinishLoadTick)
    {
        if(global.Application.MarketDataDBClient!=undefined)
        {
            global.Application.MarketDataDBClient.zrange(symbol,-LookBackCount,-1,function (err,TickStrList) {
                if (err){
                    throw new Error("从"+symbol+"的行情数据库LoadTick失败原因:"+err.message);

                    OnFinishLoadTick(strategy,symbol,undefined);
                }

                console.log("从行情数据库加载Tick成功,如下:");
                console.log(TickStrList);

                let TickList=[];
                for(let index in TickStrList)
                {
                    let TickStr=TickStrList[index];
                    let tick=JSON.parse(TickStr);
                    TickList.push(tick);
                }

                OnFinishLoadTick(strategy,symbol,TickList);
            });
        }else
        {
            OnFinishLoadTick(strategy,symbol,undefined);
        }
    }

    LoadBarFromDB(strategy,symbol,LookBackCount,BarDBType,OnFinishLoadBar)
    {
        if(global.Application.MarketDataDBClient!=undefined)
        {
            let symbolBarDBForm = symbol + "_" + BarDBType;

            global.Application.MarketDataDBClient.zrange(symbolBarDBForm, -LookBackCount, -1, function (err, BarStrList) {
                if (err) {
                    throw new Error("从" + symbolBarDBForm + "的行情数据库LoadBar失败原因:" + err.message);

                    OnFinishLoadBar(strategy, symbol, undefined);
                }

                let BarList = [];
                for (let index in BarStrList) {
                    let BarStr = BarStrList[index];
                    let bar = JSON.parse(BarStr);
                    BarList.push(bar);
                }

                OnFinishLoadBar(strategy, symbol, BarList);
            });
        }else
        {
            OnFinishLoadBar(strategy,symbol,undefined);
        }
    }

    //记录策略完成订单
    RecordOrder(strategyName, orderRecord) {

        let strategyOrderBook = strategyName + ".Order";

        global.Application.SystemDBClient.zadd(strategyOrderBook,orderRecord.datetime.getTime(),JSON.stringify(orderRecord), function (err, response) {
            if (err){
                throw new Error("记录Order失败，原因:"+err.message);
            }
        });
    }

    //记录策略成交
    RecordTrade(strategyName, trade) {

        let strategyTradeBook = strategyName + ".Trade";

        global.Application.SystemDBClient.zadd(strategyTradeBook,trade.tradingDateTimeStamp,JSON.stringify(trade), function (err, response) {
            if (err){
                throw new Error("记录Order失败，原因:"+err.message);
            }
        });

    }


    GetTradeRecord(strategyName,currentTradingDay,getTradeRecordCallback)
    {
        let strategyTradeBook = strategyName + ".Trade";

        //获取某一天的TradingDay的成交
        let currentTradingDatetime=DateTimeUtil.StrToDatetime(currentTradingDay);

        let nextTradingDatetime=new Date(currentTradingDatetime.getFullYear(),currentTradingDatetime.getMonth(),currentTradingDatetime.getDate()+1);
        let currentTradingDayQuaryArg = [ strategyTradeBook,currentTradingDatetime.getTime(),nextTradingDatetime.getTime()];
        global.Application.SystemDBClient.zrangebyscore(currentTradingDayQuaryArg,function (err, tradeRecordList) {
            if (err)
            {
                throw new Error("GetTradeRecord失败，原因:"+err.message);
            }else
            {
                getTradeRecordCallback(tradeRecordList);
            }
        });

    }

    RecordSettlement(strategyName,settlement){
        let strategySettlementKey = strategyName+".Settlement";
        //时间序列的结算最好是rpush
        global.Application.SystemDBClient.rpush(strategySettlementKey,JSON.stringify(settlement),function (err,response) {
           if(err)
           {
               throw new Error("记录Settlement失败，原因是:"+err.message);
           }
        });
    }

    GetLastTradingDayStrategySettlement(strategyName,callback){
        let strategySettlementKey = strategyName+".Settlement";
        //返回最后一条结算记录
        global.Application.SystemDBClient.lrange(strategySettlementKey,-1,-1,function (err,settlementList) {
            if(err)
            {
                throw new Error("获取前一个Settlement失败，原因是:"+err.message);
            }else
            {
                if(settlementList.length>0)
                {
                    let lastSettlementJsonStr = settlementList[settlementList.length-1];
                    let lastSettlement=JSON.parse(lastSettlementJsonStr);
                    callback(lastSettlement);
                }else if(settlementList.length==0)
                {
                    callback(undefined);
                }
            }
        });

    }

    //记录策略异常
    RecordException(strategyName, exception) {

    }
}

module.exports=StrategyEngine;