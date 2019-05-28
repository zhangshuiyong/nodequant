/**
 * Created by Administrator on 2017/6/12.
 */
let fs=require("fs");
let async = require('async');

require("../common");
require("../userConfig");

let DateTimeUtil=require("../util/DateTimeUtil");
let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

let KBar = require("../util/KBar");

//策略仓位管理器
let Position=require("../util/Position");
//////////////////////////////////////////////////////////////Private Method////////////////////////////////

//过滤非法的tick
//如何定义非法的tick
//非法的tick----不用录入数据库的Tick
//1.交易日的非法的tick
//1.1. 不在交易时间的Tick

function _isPassCTPFilter(tickFutureConfig,tickDateTime)
{
    if(tickFutureConfig===undefined)
    {
        //没有配置时间,不录入数据库
        return false;
    }

    let tickTradingDate = tickDateTime.toLocaleDateString();
    //早盘开盘时间,用于对比判断,夜盘是否到了凌晨的交易品种,如黄金
    let AMOpenDateTime=undefined;
    if(tickFutureConfig.AMOpen!==undefined)
    {
        let AMOpenDateTimeStr=tickTradingDate+" "+tickFutureConfig.AMOpen;
        AMOpenDateTime=new Date(AMOpenDateTimeStr);
    }else
    {
        //没有开盘时间，全部tick都不能判断!!!
        return false;
    }

    //由于5.2,凌晨夜盘超过到另外一天到另一个交易日的凌晨
    //一个交易日的tick最开始有效时间,可能是凌晨(黄金),也可能是早盘开始!!!
    if(tickFutureConfig.NightClose===undefined)
    {
        //1.没有夜盘,如果tick的时间在当前交易日的AMOpen的之前,就过滤掉
        if(AMOpenDateTime!==undefined)
        {

            if(tickDateTime<AMOpenDateTime)
            {
                return false;
            }
        }
    }else
    {
        //有夜盘,判断夜盘的结束时间是否到凌晨
        let NightCloseDateTimeStr= tickTradingDate +" "+ tickFutureConfig.NightClose;
        let NightCloseDateTime=new Date(NightCloseDateTimeStr);

        if(NightCloseDateTime<AMOpenDateTime)
        {
            //品种的夜盘结束时间是到凌晨的情况,黄金,2:30:00~9:00:00
            if(NightCloseDateTime<tickDateTime && tickDateTime<AMOpenDateTime)
            {
                return false;
            }
        }else if(NightCloseDateTime>AMOpenDateTime)
        {
            //夜盘在0点之前结束,大于早盘9:00时间,在大于夜盘结束时间过滤掉或者小于早盘开盘时间过滤掉
            if(NightCloseDateTime<tickDateTime || tickDateTime<AMOpenDateTime)
            {
                return false;
            }
        }
    }

    //2.如果有早盘停盘时间,早盘重新开盘时间(中金所股指期货没有,商品期货有)。BreakDateTime<Tick的时间<ResumeDateTime是要过滤掉
    if(tickFutureConfig.AMBreak!==undefined && tickFutureConfig.AMResume!==undefined)
    {
        let AMBreakDateTimeStr= tickTradingDate +" "+ tickFutureConfig.AMBreak;
        let AMBreakDateTime=new Date(AMBreakDateTimeStr);

        let AMResumeDateTimeStr= tickTradingDate +" "+ tickFutureConfig.AMResume;
        let AMResumeDateTime=new Date(AMResumeDateTimeStr);

        if(AMBreakDateTime<tickDateTime && tickDateTime<AMResumeDateTime)
        {
            return false;
        }
    }

    //3.上午收盘，到下午开盘（所有CTP国内商品都有）。AMCloseTime<Tick的时间<PMOpenDateTime要过滤掉
    if(tickFutureConfig.AMClose!==undefined && tickFutureConfig.PMOpen!==undefined)
    {
        let AMCloseDateTimeStr= tickTradingDate +" "+ tickFutureConfig.AMClose;
        let AMCloseDateTime=new Date(AMCloseDateTimeStr);

        let PMOpenDateTimeStr= tickTradingDate +" "+ tickFutureConfig.PMOpen;
        let PMOpenDateTime=new Date(PMOpenDateTimeStr);

        if(AMCloseDateTime<tickDateTime && tickDateTime<PMOpenDateTime)
        {
            return false;
        }
    }

    //4.交易日下午收盘.算是一个交易日的结束。但是下午收盘要与在下午收盘到晚上夜盘对比
    let PMCloseDateTimeStr= tickTradingDate +" "+ tickFutureConfig.PMClose;
    let PMCloseDateTime=new Date(PMCloseDateTimeStr);

    //5.有夜盘。夜盘就是当前tick交易日比下午后盘的时间要大.(只是这段时间提前出现，这段时间是存在的!!!)
    if(tickFutureConfig.NightOpen !== undefined && tickFutureConfig.NightClose!==undefined)
    {
        let NightOpenDateTimeStr= tickTradingDate +" "+ tickFutureConfig.NightOpen;
        let NightOpenDateTime=new Date(NightOpenDateTimeStr);

        let NightCloseDateTimeStr= tickTradingDate +" "+ tickFutureConfig.NightClose;
        let NightCloseDateTime=new Date(NightCloseDateTimeStr);

        //5.1 在午盘结束时间<tickDatetime<夜盘开始NightOpenDateTime,这段时间的Tick要过滤
        if(PMCloseDateTime<tickDateTime && tickDateTime<NightOpenDateTime)
        {
            return false;
        }else if(AMOpenDateTime<NightCloseDateTime && NightCloseDateTime<tickDateTime)
        {
            //NightCloseDateTime夜盘结束时间大于在一个交易日的开始,说明夜盘结束时间没有跨交易日

            //5.2 在夜盘结束之后的tick,要过滤。(黄金等夜盘2017/07/12 23:59:59.500, 271.45 2017/07/13 00:00:00.500, 271.45超过当天交易日)如何过滤?
            //黄金Tick在 23:59:59 的交易日是2017/07/12，在00:00:00.500的tick的交易日是2017/07/13

            //黄金的结束时间是2:00:00，那么按23:00的交易日,(2017/07/12) 23:00:00 > (2017/07/12) 2:00:00
            //所以不能用[(2017/07/12) 2:00:00 ]tickPMCloseTime <tickTime [(2017/07/12) 23:00:00], 来判断非法tick,前面是正常tick

            //如果品种的夜盘结束时间在23:59:59之前,可以用（tradingDay+23:59:59）tickPMCloseTime <tickTime,为无效tick
            //如果品种的夜盘结束时间在00:00:1之后，(tradingDay + 00:00:1) tickPMCloseTime < tickTime (tradingDay + 23:59:59),不能认为无效!!
            //如果品种的夜盘结束时间在00:00:1之后, (tradingDay + 02:00:00) NightCloseTime < tickTime <AMOpenTime(tradingDay + 09:00:00), 认为是无效
            return false;
        }

    }else if(PMCloseDateTime<tickDateTime)
    {
        //6.没有夜盘。Tikc的交易日的收盘时间<tick的DateTime。要过滤掉
        return false;
    }

    //最后是合法的Tick,保存到数据库中
    return true;
}

//每个客户端过滤无效Tick的时间不同,有CTP的过滤器就过滤,没有过滤器就不过滤
//以下是ctp的客户端
function _isPassFilter(clientName,TradingDateConfig,tickDateTime) {
    if(clientName==="CTP")
    {
        return _isPassCTPFilter(TradingDateConfig,tickDateTime)
    }else if(clientName==="Sgit")
    {
        return _isPassCTPFilter(TradingDateConfig,tickDateTime);
    }else
    {
        return true;
    }
}

function _isPassTickFilter(tick) {
    let contract= global.NodeQuant.MainEngine.GetContract(tick.clientName,tick.symbol);
    let isPass=false;

    if(contract!==undefined)
    {
        let upperFutureName= contract.futureName.toUpperCase();
        let tickFutureConfig=FuturesConfig[tick.clientName][upperFutureName];
        isPass =_isPassFilter(tick.clientName,tickFutureConfig,tick.datetime);
    }

    return isPass;
}

function _registerEvent(myEngine) {

    global.AppEventEmitter.on(EVENT.OnTick,function (tick) {

        //console.log("OnTick:",tick);
        //先过滤Tick
        let isPass=_isPassTickFilter(tick);
        if(isPass===false)
        {
            return;
        }

        //更新策略-合约中的最新Tick
        myEngine.Symbol_LastTickDic[tick.symbol]=tick;
        //合约-策略推送字典
        let symbol_StrategyArray=myEngine.Symbol_StrategyArrayDic[tick.symbol];
        for(let strategyIndex in symbol_StrategyArray)
        {
            let strategy=symbol_StrategyArray[strategyIndex]
            strategy.OnTick(tick);
        }

    });


    global.AppEventEmitter.on(EVENT.OnOrder,function (order) {

        let strategyName = myEngine.StrategyOrderID_StrategyNameDic[order.strategyOrderID];
        let strategy= myEngine.StrategyDic[strategyName];

        if(strategy!==undefined)
        {
            //推送到下单策略
            strategy.OnOrder(order);

            //记录策略的所有Order
            let orderDic=myEngine.StrategyName_OrderDic[strategy.name];
            if(orderDic===undefined)
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

        if(strategy!==undefined)
        {
            strategy.OnTrade(trade);

            //记录策略的所有成交
            let tradeDic=myEngine.StrategyName_TradeDic[strategy.name];
            if(tradeDic===undefined)
            {
                tradeDic={};
                myEngine.StrategyName_TradeDic[strategy.name]=tradeDic;
            }
            tradeDic[trade.strategyOrderID]=trade;

            //before Update Position to change trade obj
            myEngine.RecordTrade(strategy.name,trade);

            myEngine.UpdateStrategyPosition(strategy.name,trade);

        }
    });

    //查询资金
    global.AppEventEmitter.on(EVENT.OnQueryTradingAccount,function (tradingAccountInfo) {
        let OnQueryTradingAccountCallBack = myEngine.OnQueryTradingAccountCallBackDic[tradingAccountInfo.queryId];

        if(OnQueryTradingAccountCallBack)
        {
            OnQueryTradingAccountCallBack(tradingAccountInfo);
            //不需要调用完清掉,因为Sgit可能有两次返回!Sgit可能有两个资金账号一个期货一个TD账号
        }
    });

    //查询合约手续费
    global.AppEventEmitter.on(EVENT.OnQueryCommissionRate,function (commissionRateInfo) {
        if(myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName]===undefined)
        {
            myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName]={};
        }

        myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName][commissionRateInfo.InstrumentID]={};

        //按手计算
        let feeType=undefined;
        let openFee=undefined;
        let closeFee=undefined;
        let closeTodayFee=undefined;
        //按手开仓费用,不会低于0.1元,否则是按交易金额计算
        if(commissionRateInfo.OpenRatioByVolume<0.1)
        {
            feeType=FeeType.ByMoney;
            openFee=commissionRateInfo.OpenRatioByMoney;
            closeFee=commissionRateInfo.CloseRatioByMoney;
            closeTodayFee=commissionRateInfo.CloseTodayRatioByMoney;
        }else
        {
            feeType=FeeType.ByVolume;
            openFee=commissionRateInfo.OpenRatioByVolume;
            closeFee=commissionRateInfo.CloseRatioByVolume;
            closeTodayFee=commissionRateInfo.CloseTodayRatioByVolume;
        }

        myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName][commissionRateInfo.InstrumentID].feeType=feeType;
        myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName][commissionRateInfo.InstrumentID].openFee=openFee;
        myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName][commissionRateInfo.InstrumentID].closeFee=closeFee;
        myEngine.Client_Symbol_CommissionRateDic[commissionRateInfo.clientName][commissionRateInfo.InstrumentID].closeTodayFee=closeTodayFee;
    });

    //查询递延费
    global.AppEventEmitter.on(EVENT.OnQueryDeferFeeRate,function (deferFeeRateInfo) {
        console.log(deferFeeRateInfo);
    });
}

function _createClosedBar(BarId_TickListDic,tick,KBarId) {
    let bar_TickList = BarId_TickListDic[KBarId];

    if(bar_TickList.length>0)
    {
        let bar_StartDatetime=bar_TickList[0].datetime;
        let bar_EndDatetime=bar_TickList[bar_TickList.length-1].datetime;
        let bar_Open=bar_TickList[0].lastPrice;
        let bar_Close=bar_TickList[bar_TickList.length-1].lastPrice;
        let bar_High = bar_TickList[0].lastPrice;
        let bar_Low = bar_TickList[0].lastPrice;
        let volume=0;
        let openInterest=bar_TickList[bar_TickList.length-1].openInterest;
        for(let i=0;i< bar_TickList.length;i++)
        {
            bar_High = Math.max(bar_High,bar_TickList[i].lastPrice);
            bar_Low = Math.min(bar_Low,bar_TickList[i].lastPrice);
            volume += bar_TickList[i].volume;
        }

        let bar=new KBar(KBarId,bar_StartDatetime,bar_EndDatetime,tick.symbol,bar_Open,bar_High,bar_Low,bar_Close,volume,openInterest);

        //向数据库记录一个完整Bar
        return bar;
    }else
    {
        return undefined;
    }
}

//创建新K线包含的TickList缓存数组
function _createNewBar(BarId_TickListDic,tick,KBarId)
{
    let KBarTickList=[];
    KBarTickList.push(tick);
    BarId_TickListDic[KBarId]=KBarTickList;
}

//从尾部向上生成K线
function _reverseCreateBarByBarId(BarId_TickListDic,ClosedBarList,tick,KBarId)
{
    //如果字典已经有1个KBarID,不存在KBarId,说明有一个新K线产生
    if(BarId_TickListDic[KBarId]===undefined)
    {
        //创建新K线包含的TickList缓存数组
        _createNewBar(BarId_TickListDic,tick,KBarId);

        //创建上一个完整K线,加入到策略订阅合约的K线列表
        for(let barId in BarId_TickListDic)
        {
            //不存在KBarId,说明有一个新K线产生
            if(barId!==KBarId)
            {
                //创建上一个完整K线,加入到策略订阅合约的K线列表
                let closedBar=_createClosedBar(BarId_TickListDic,tick,barId);

                //记录K线
                ClosedBarList.unshift(closedBar);

                //创建完删除上一个完整K线的TickList缓存
                delete BarId_TickListDic[barId];
            }
        }
    }else
    {
        BarId_TickListDic[KBarId].unshift(tick);
    }
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

        //用于定时更新仓位
        this.UpdatePositionTimer=undefined;
        this.UpdateIndex_PositionDic=new Map();

        //策略-成交字典
        this.StrategyName_TradeDic = {};
        //策略-持仓字典
        this.StrategyName_PositionDic = {};
        this.StrategyName_ExceptionListDic = {};

        //策略-订阅的合约-最新Tick
        this.Symbol_LastTickDic={};

        //策略查询资金情况回调函数
        this.OnQueryTradingAccountCallBackDic={};

        //手续费查询结果
        //两个不同交易客户端但是可交易相同的期货,计算两个相同期货的手续费
        this.Client_Symbol_CommissionRateDic={};

        //合约-策略数组推送字典
        this.Symbol_StrategyArrayDic={};

        _registerEvent(this);
    }

    ////////////////////////////////////////////////////////////// Public Method //////////////////////////////////////////////////////////

    Start() {

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"StrategyEngine Start");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //启动
        let strategyConfigs = StrategyConfig.Strategys;
        //查询策略手续费,用于计算净值和其他系统计算
        this.QueryStrategySymbolsCommissionRate(strategyConfigs);

        for (let index in strategyConfigs) {
            let strategyConfig = strategyConfigs[index];
            this.StartStrategy(strategyConfig);
        }

        this.StartPositionUpdator();

        this.IsWorking=true;
    }

    //仓位更新器，仓位不随成交事件更新（瞬间多个成交事件）而阶段频繁写数据数据库
    StartPositionUpdator()
    {
        let myEngine=this;
        this.UpdatePositionTimer = setInterval(function () {

            //每10秒检查1个仓位，是否在之前有过成交
            for(let [positionKey,position] of myEngine.UpdateIndex_PositionDic.entries())
            {
                let KeyArray = positionKey.split(".");
                let strategyName=KeyArray[0];
                if(strategyName){
                    myEngine.RecordPosition(strategyName,position);
                }

                //更新完删除
                myEngine.UpdateIndex_PositionDic.delete(positionKey);

                break;
            }
        },10000);
    }

    Stop(mainEngineStatus){

        //1.停止所有策略
        for(let strategyName in this.StrategyDic)
        {
            this.StrategyDic[strategyName].Stop();
        }

        //2.白天收盘当做一天的结束(3:00 or 3.15), 结算各个策略的当天净值
        if(mainEngineStatus===MainEngineStatus.DayStop)
        {
            for(let strategyName in this.StrategyDic)
            {
                let strategy = this.StrategyDic[strategyName];

                //每个策略一个结算纪录
                this.SettleStrategyAccount(strategy);

            }
        }

        //清空策略字典
        this.StrategyDic={};

        //清空合约-策略数组字典
        this.Symbol_StrategyArrayDic={};

        //清空查询资金账号调用函数
        this.OnQueryTradingAccountCallBackDic={};

        this.IsWorking=false;

        clearInterval(this.UpdatePositionTimer);

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"StrategyEngine Stop");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    StartStrategy(strategyConfig) {
        //订阅合约
        let result=this.SubscribeStrategySymbols(strategyConfig.name, strategyConfig.symbols);

        if(result)
        {
            let strategyInstance = this.CreateStrategy(strategyConfig);
            if (strategyInstance !== undefined) {

                //加载策略的持仓数据,准备交易
                this.LoadPosition(strategyConfig.name);

                //先加载策略持仓
                //创建合约-策略数组推送字典
                for(let symbol in strategyConfig.symbols)
                {
                    if(this.Symbol_StrategyArrayDic[symbol]===undefined)
                    {
                        this.Symbol_StrategyArrayDic[symbol]=[];
                    }

                    this.Symbol_StrategyArrayDic[symbol].push(strategyInstance);
                }

                //再把策略加入策略字典
                this.StrategyDic[strategyConfig.name] = strategyInstance;

                //策略启动成功,(由于策略订阅合约是否成功是异步的,而且可能多品种订阅,所以如果订阅失败,会报告策略运行错误)
                let message=strategyConfig.name+"策略启动成功";
                let log=new NodeQuantLog(strategyConfig.name,LogType.INFO,new Date().toLocaleString(),message);
                global.AppEventEmitter.emit(EVENT.OnLog,log);
            }
        }else
        {
            let message= "New Strategy Instance Failed.Strategy Name:" + strategyConfig.name + ",Error Msg:" + "订阅策略品种失败";
            let error=new NodeQuantError(strategyConfig.name,ErrorType.StrategyError,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);
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

    //查询多个策略,每个策略多品种的手续费
    QueryStrategySymbolsCommissionRate(strategyConfigs)
    {
        let QueryCommissionRateTaskList=[];
        QueryCommissionRateTaskList.push(function (callback) {
            setTimeout(function () {
                callback(null,"Delay QueryCommissionRate After conneted Trade Client");
            },8000);
        });

        for (let index in strategyConfigs) {
            let strategyConfig = strategyConfigs[index];
            for (let symbol in strategyConfig.symbols) {
                let symbolConfig=strategyConfig.symbols[symbol];
                let queryCommissionRateTask=function (callback) {
                    let ret = global.NodeQuant.MainEngine.QueryCommissionRate(symbolConfig.clientName,symbol);
                    //连续查询手续费要相隔1段时间再查
                    setTimeout(function () {
                        if(ret!==0)
                        {
                            let errMessage="在" + symbolConfig.clientName + "查询" + symbol + "手续费发送失败,错误码：" + ret;
                            callback(errMessage,{clientName: symbolConfig.clientName,symbol:symbol});
                        }else
                        {
                            callback(null,{clientName: symbolConfig.clientName,symbol:symbol});
                        }
                    },8000);
                };
                QueryCommissionRateTaskList.push(queryCommissionRateTask);
            }
        }


        async.series(QueryCommissionRateTaskList,function(err,result){
            if (err) {
                let error=new NodeQuantError(result[result.length-1].clientName,ErrorType.StrategyError,err);
                global.AppEventEmitter.emit(EVENT.OnError, error);
            }
        });
    }

    //只有Sgit可以查询递延费
    //1.飞鼠测试服务器该接口是无回报的,要真实连接交易所才有回报
    //2.要在交割申报后15:30分后才能查询到递延费率与方向
    QueryDeferFeeRate(clientName,contractSymbol)
    {
        let ret = global.NodeQuant.MainEngine.QueryDeferFeeRate(clientName,contractSymbol);
        return ret;
    }

    QueryTradingAccount(clientName,strategy)
    {
        if(clientName==="Sgit")
        {
            //最新版本Sgit 4.2未支持此接口
            return -1;
        }

        let requestId = global.NodeQuant.MainEngine.QueryTradingAccount(clientName);

        let queryId = clientName+requestId;

        this.OnQueryTradingAccountCallBackDic[queryId] = strategy.OnQueryTradingAccount;

        return requestId;
    }

    //订阅合约
    SubscribeStrategySymbols(strategyName, strategySymbolCongfigDic) {

        for (let symbol in strategySymbolCongfigDic) {
            let symbolConfig=strategySymbolCongfigDic[symbol];
            let contract = global.NodeQuant.MainEngine.GetContract(symbolConfig.clientName,symbol);
            //交易客户端的合约存在才能订阅!
            if (contract !== undefined) {
                let ret = global.NodeQuant.MainEngine.Subscribe(contract.clientName, symbol);
                if (ret !== 0) {
                    let message=strategyName + "在" + contract.clientName + "客户端订阅" + symbol + "请求发送失败,错误码：" + ret;
                    let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);
                    global.AppEventEmitter.emit(EVENT.OnError, error);

                    //订阅失败,需要再次订阅
                    return false;
                }
            } else {

                let message= strategyName + "订阅失败:"+ symbolConfig.clientName+ "不存在合约:" + symbol ;
                let error=new NodeQuantError(strategyName,ErrorType.StrategyError,message);

                global.AppEventEmitter.emit(EVENT.OnError, error);

                //订阅失败,需要再次订阅
                return false;
            }
        }

        return true;
    }

    StopStrategy(strategyName) {
        //停止策略,策略引擎的order,trade,tick都不会推送
        delete this.StrategyDic[strategyName];

        let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),strategyName+"停止策略");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    SendLimitOrder(strategy,clientName, contractName, direction, openclose, volume, limitPrice) {
        let strategyEngine=this;

        let ret = global.NodeQuant.MainEngine.SendLimitOrder(clientName, contractName, direction, openclose, volume, limitPrice);
        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendFillAndKillLimitOrder(strategy,clientName,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine=this;

        let ret = global.NodeQuant.MainEngine.SendFillAndKillLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice);
        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendFillOrKillLimitOrder(strategy,clientName,contractName,direction,openclose,volume,limitPrice) {
        let strategyEngine = this;

        let ret = global.NodeQuant.MainEngine.SendFillOrKillLimitOrder(clientName, contractName, direction, openclose, volume, limitPrice);

        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = clientName + "." + orderRefId;

            strategyEngine.StrategyOrderID_StrategyNameDic[strategyOrderID] = strategy.name;
        }
    }

    SendStopLimitOrder(strategy,clientName,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice){
        let strategyEngine = this;
        let ret = global.NodeQuant.MainEngine.SendStopLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice,contingentCondition,stopPrice);

        if (ret > 0) {
            //如果下单成功,ret返回码等于orderRefId
            let orderRefId = ret;
            // 策略对应的订单号组成规则, 用于区分不同的策略发送的Order
            let strategyOrderID = clientName + "." + orderRefId;

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
            let isOrderFinish = (order.status === OrderStatusType.Canceled || order.status === OrderStatusType.AllTraded);
            if (isOrderFinish === false) {
                unFinishOrderList.push(order);
            }
        }

        return unFinishOrderList;
    }

    CancelOrder(order)
    {
        global.NodeQuant.MainEngine.CancelOrder(order.clientName,order);
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
        if (PositionDic === undefined) {
            PositionDic = {};
            this.StrategyName_PositionDic[strategyName] = PositionDic;
        }

        //position对象键值是合约名字,凡是该合约，都要更新这个position对象
        let position = PositionDic[trade.symbol];

        if (position === undefined) {
            position = new Position();
            PositionDic[trade.symbol] = position;
            position.symbol = trade.symbol;
            position.strategyName = strategyName;
        }

        position.UpdatePosition(trade);



        //延迟更新数据库仓位
        let UpdatePositionIndex=position.strategyName+"."+position.symbol;
        this.UpdateIndex_PositionDic.set(UpdatePositionIndex,position);
        //this.RecordPosition(strategyName,position);
    }

    SettleCommission(feeInfo,tradeRecord)
    {
        let symbolFee=0;
        let tradeRecordCommission = 0 ;

        if(feeInfo!==undefined)
        {
            //确定开仓/平仓/平今仓费率 3种
            if(tradeRecord.offset===OpenCloseFlagType.CloseToday)
            {
                symbolFee = feeInfo.closeTodayFee;
            }else if(tradeRecord.offset===OpenCloseFlagType.Close)
            {
                symbolFee = feeInfo.closeFee;
            }else if(tradeRecord.offset===OpenCloseFlagType.CloseYesterday)
            {
                symbolFee = feeInfo.closeFee;
            }else if(tradeRecord.offset===OpenCloseFlagType.Open)
            {
                symbolFee = feeInfo.openFee;
            }

            //是否有设置fee,closeTodayFee字段

            if(symbolFee!==undefined)
            {
                //确定手续费计算方法
                if(feeInfo.feeType===FeeType.ByMoney)
                {
                    let contractSize=global.NodeQuant.MainEngine.GetContractSize(tradeRecord.symbol);
                    tradeRecordCommission= symbolFee * tradeRecord.volume * tradeRecord.price * contractSize;
                }else if(feeInfo.feeType===FeeType.ByVolume){
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
        let contractSize=global.NodeQuant.MainEngine.GetContractSize(tradeRecord.symbol);
        if(tradeRecord.direction===Direction.Buy)
        {
            tradeRecordValue = tradeRecord.volume * tradeRecord.price * contractSize;
        }else if(tradeRecord.direction===Direction.Sell)
        {
            tradeRecordValue= tradeRecord.volume * tradeRecord.price * contractSize;
            tradeRecordValue = -tradeRecordValue;
        }

        return tradeRecordValue;
    }

    //当天收盘的合约持仓价值
    SettleCurrentTradingDay_Exit_SymbolPositionValue(symbol_position)
    {
        let contractSize=global.NodeQuant.MainEngine.GetContractSize(symbol_position.symbol);

        let symbol_lastTick= this.Symbol_LastTickDic[symbol_position.symbol];
        let currentTradingDay_Exit_Symbol_PositionValue = 0;

        let longPosition = symbol_position.GetLongPosition();
        let shortPosition = symbol_position.GetShortPosition();

        if(symbol_lastTick!==undefined)
        {
            currentTradingDay_Exit_Symbol_PositionValue =  longPosition  * symbol_lastTick.lastPrice * contractSize;
            currentTradingDay_Exit_Symbol_PositionValue -= shortPosition * symbol_lastTick.lastPrice * contractSize;
        }else
        {
            let log=new NodeQuantLog("StrategyEngine",LogType.INFO,new Date().toLocaleString(),"无法正确计算当前品种持仓价值,原因：策略没有找到"+symbol_position.symbol+"的最新Tick价格。当前多仓："+longPosition+"当前空仓："+shortPosition);
            global.AppEventEmitter.emit(EVENT.OnLog,log);
        }

        return currentTradingDay_Exit_Symbol_PositionValue;
    }


    GetTradingDay()
    {
        //飞鼠返回空字符串,暂时不用此接口
        let currentTradingDate = global.NodeQuant.MainEngine.TradingDay;
        return currentTradingDate;
    }

    SettleStrategyAccount(strategyInstance){
        let strategyEngine=this;
        //每个策略的净值对象,日期,策略名字,交易品种,盈利,手续费,当日盈利

        let currentTradingDay=global.NodeQuant.MainEngine.TradingDay;

        //获得上一天的持仓结算价值
        this.GetLastTradingDayStrategySettlement(strategyInstance.name,function (lastSettlement) {

            let lastTradingDay_Exit_PositionValue = 0;
            if(lastSettlement!==undefined)
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

                    let tradeRecordValue=strategyEngine.SettleTradeRecordValue(tradeRecord);
                    currentTradingDay_TradeValue += tradeRecordValue;

                    let feeInfo=strategyEngine.Client_Symbol_CommissionRateDic[tradeRecord.clientName][tradeRecord.symbol];
                    if(feeInfo===undefined)
                    {
                        //CTP SimNow账号只有futureName的手续费
                        let contract=global.NodeQuant.MainEngine.GetContract(tradeRecord.clientName,tradeRecord.symbol);
                        feeInfo=strategyEngine.Client_Symbol_CommissionRateDic[tradeRecord.clientName][contract.futureName];
                    }

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

    //仓位是一个策略,一个合约，对应一个仓位,仓位变化要更新数据库.
    RecordPosition(strategyName,position)
    {
        //记录策略所有品种的key,可以根据这个Key表获得一共有多少个品种的仓位
        let strategyPositionKey = strategyName+".Position";
        global.NodeQuant.SystemDBClient.sadd(strategyPositionKey,position.symbol);

        let strategyPositionSymbolKey = strategyName+".Position."+position.symbol;

        //由于是nosql,一个成交是1条记录,不能更新到记录中的field,所以只能删除了Symbol-PositionTrade表再写入
        global.NodeQuant.SystemDBClient.del(strategyPositionSymbolKey, function(err, response) {
            if (err) {
                throw new Error(strategyName+"清空Position失败，原因:"+err.message);
            } else{
                //清空策略数据库的Position表成功
                //遍历多仓，记录到数据库

                for(let index in position.longPositionTradeRecordList)
                {
                    let tradeRecord = position.longPositionTradeRecordList[index];
                    global.NodeQuant.StrategyEngine.RecordPositionItem(strategyPositionSymbolKey,tradeRecord);
                }
                //遍历空仓,记录到数据库
                for(let index in position.shortPositionTradeRecordList)
                {
                    let tradeRecord = position.shortPositionTradeRecordList[index];
                    global.NodeQuant.StrategyEngine.RecordPositionItem(strategyPositionSymbolKey,tradeRecord);
                }
            }
        });
    }

    //将持仓的成交记录到持仓列表当中
    RecordPositionItem(positionBookDBAddress,tradeRecord)
    {
        global.NodeQuant.SystemDBClient.rpush(positionBookDBAddress,JSON.stringify(tradeRecord),function (err,reply) {
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
        global.NodeQuant.SystemDBClient.smembers(strategyPositionKey,function (err,symbolSet) {
            if(err)
            {
                throw new Error("LoadPosition失败，原因:"+err.message);
            }else{
                let PositionDic = global.NodeQuant.StrategyEngine.StrategyName_PositionDic[strategyName];
                if (PositionDic === undefined) {
                    PositionDic = {};
                    global.NodeQuant.StrategyEngine.StrategyName_PositionDic[strategyName] = PositionDic;
                }

                for(let index in symbolSet)
                {
                    let symbol= symbolSet[index];
                    if(PositionDic[symbol]===undefined)
                    {
                        //加载仓位列表的时候没有这个仓位,要查询列表
                        let positionObj=new Position();
                        positionObj.symbol=symbol;
                        positionObj.strategyName=strategyName;
                        PositionDic[positionObj.symbol] = positionObj;
                    }

                    //查找Position.Symbol所有仓位成交记录
                    let strategyPositionSymbolKey = strategyName+".Position."+symbol;
                    global.NodeQuant.SystemDBClient.lrange(strategyPositionSymbolKey, 0, -1, function(err, tradeRecordStrList) {
                        if(err)
                        {
                            throw new Error(strategyPositionSymbolKey+"表LoadPosition失败，原因:"+err.message);
                        }else
                        {
                            for(let index in tradeRecordStrList)
                            {
                                let tradeRecordStr=tradeRecordStrList[index];
                                let tradeRecord=JSON.parse(tradeRecordStr);
                                if (tradeRecord.offset === OpenCloseFlagType.Open && tradeRecord.direction === Direction.Buy) {
                                    //多方开仓,持仓
                                    PositionDic[tradeRecord.symbol].longPositionTradeRecordList.push(tradeRecord);
                                }else if(tradeRecord.offset === OpenCloseFlagType.Open && tradeRecord.direction === Direction.Sell)
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


    LoadTickFromDB(strategy,symbol,LookBackDays,OnFinishLoadTick)
    {
        if(global.NodeQuant.MarketDataDBClient!==undefined)
        {
            global.NodeQuant.MarketDataDBClient.LoadTick(symbol,LookBackDays,function (tickList) {
                OnFinishLoadTick(strategy,symbol,tickList);
            });

        }else
        {
            OnFinishLoadTick(strategy,symbol,undefined);
        }
    }

    LoadBarFromDB(strategy,symbol,LookBackCount,BarType,BarInterval,OnFinishLoadBar)
    {
        if(global.NodeQuant.MarketDataDBClient!==undefined)
        {
            //获得Tick数据库
            //K线是根据K线的定义而产生的，根据K的交易策略要注意!回测与实盘交易系统一定要一致
            //1根K线的Tick数组
            //多个K线的字典数组
            //从后往前数Tick


            //默认Tick是准确连续的，获得足够Tick生成足够的K线.
            //如果K线是分钟,认为1秒4个Tick(一般期货1秒2个Tick,为了获得足够生成LookBackCount个数的K线)
            let TickLookBackCount = 0;
            //K线周期默认1分钟=60*1000ms
            let BarMillSecondInterval=60*1000;
            if(BarType===KBarType.Second)
            {
                TickLookBackCount = LookBackCount * BarInterval * 4;
                BarMillSecondInterval=BarInterval*1000;
            }else if(BarType===KBarType.Minute)
            {
                TickLookBackCount = LookBackCount * BarInterval * 60 * 4;
                BarMillSecondInterval=BarInterval*60*1000;
            }else if(BarType===KBarType.Hour)
            {
                TickLookBackCount = LookBackCount * BarInterval * 60 * 60 * 4;
                BarMillSecondInterval=BarInterval*60*60*1000;
            }


            global.NodeQuant.MarketDataDBClient.nrrange([symbol, 0,TickLookBackCount,-1],function (err,TickStrListResults) {
                if (err){
                    console.log("从" + symbol + "的行情数据库LoadBar失败原因:" + err);

                    //没完成收集固定K线个数
                    OnFinishLoadBar(strategy,symbol,BarType,BarInterval,undefined);
                    return;
                }

                //收集K线的数组
                let ClosedBarList=[];
                //每根K线的Tick缓存字典
                let BarId_TickListDic={};

                //ssdb nrrange获取的是[v1,num2,v2,num2]数组
                //从自然日时间大往时间小的收集tick，开始算K线
                let TickStrList_LastIndex=TickStrListResults.length-1;
                for (let i = 0; i <= TickStrList_LastIndex; i += 2)
                {
                    //自然时间最大开始遍历
                    let TickStr = TickStrListResults[i];
                    let Tick = JSON.parse(TickStr);
                    Tick.datetime = new Date(Tick.timeStamp);

                    let KBarId=undefined;
                    if(BarType!==KBarType.Day)
                    {
                        //分钟K线的收集按Tick的timeStamp是否相同KBarId来收集
                        //如5分钟K线,2017/9/7日 23:55:00~2017/9/7 00:00:00,间隔了-1天,间隔为不同的KBarId
                        //如果是2小时线就会有问题,例如黄金期货夜盘21:00-23:00为1个2小时
                        // 23:00-1:00为另一个2小时,但是2017/9/7 23:00 - 2017/9/7 00:00:00,就相隔了不只2小时
                        // 无法将之后00:00:00~1:00:00之间Tick
                        //所以不能用Tick.timeStamp这个非自然时间，而应该要用tick的自然时间!
                        //这段时间会变成2017/9/7 23:00 - 2017/9/8 00:00:00~1:00:00
                        KBarId = parseInt(Tick.Id/BarMillSecondInterval);
                    }else
                    {
                        //日K线BarId生成
                        KBarId = Tick.date;
                    }

                    //生成分钟K线的方法,日K线不能这样生成!
                    _reverseCreateBarByBarId(BarId_TickListDic,ClosedBarList,Tick,KBarId);


                    if(ClosedBarList.length===LookBackCount)
                    {
                        break;
                    }
                }

                //在Tick数组内完成收集K线工作
                if(ClosedBarList.length===LookBackCount)
                {
                    OnFinishLoadBar(strategy,symbol,BarType,BarInterval,ClosedBarList);
                }else
                {
                    //没完成收集固定K线个数
                    OnFinishLoadBar(strategy,symbol,BarType,BarInterval,undefined);
                }
            });
        }else
        {
            OnFinishLoadBar(strategy,symbol,BarType,BarInterval,undefined);
        }
    }



    //记录策略完成订单
    RecordOrder(strategyName, orderRecord) {

        let strategyOrderBook = strategyName + ".Order";

        global.NodeQuant.SystemDBClient.zadd(strategyOrderBook,orderRecord.datetime.getTime(),JSON.stringify(orderRecord), function (err, response) {
            if (err){
                throw new Error("记录Order失败，原因:"+err.message);
            }
        });
    }

    //记录策略成交
    RecordTrade(strategyName, tradeObj) {
        let trade = {};
        Object.assign(trade,tradeObj);

        let strategyTradeBook = strategyName + ".Trade";

        global.NodeQuant.SystemDBClient.zadd(strategyTradeBook,trade.tradingDateTimeStamp,JSON.stringify(trade), function (err, response) {
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
        if(global.NodeQuant.SystemDBClient)
        {
            global.NodeQuant.SystemDBClient.zrangebyscore(currentTradingDayQuaryArg,function (err, tradeRecordList) {
                if (err)
                {
                    throw new Error("GetTradeRecord失败，原因:"+err.message);
                }else
                {
                    getTradeRecordCallback(tradeRecordList);
                }
            });
        }
    }

    RecordSettlement(strategyName,settlement){
        let strategySettlementKey = strategyName+".Settlement";
        //时间序列的结算最好是rpush
        global.NodeQuant.SystemDBClient.rpush(strategySettlementKey,JSON.stringify(settlement),function (err,response) {
            if(err)
            {
                throw new Error("记录Settlement失败，原因是:"+err.message);
            }
        });
    }

    GetLastTradingDayStrategySettlement(strategyName,callback){
        let strategySettlementKey = strategyName+".Settlement";
        //返回最后一条结算记录
        global.NodeQuant.SystemDBClient.lrange(strategySettlementKey,-1,-1,function (err,settlementList) {
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
                }else if(settlementList.length===0)
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