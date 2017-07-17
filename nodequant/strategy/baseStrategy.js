/**
 * Created by Administrator on 2017/6/12.
 */

require("../common");

let NodeQuantError=require("../util/NodeQuantError");

class KBar{
    constructor(BarId,StartDatetime,EndDatetime,Symbol,Open,High,Low,Close,Volume){
        this.barId = BarId;
        this.startDateTime = StartDatetime;
        this.endDateTime = EndDatetime;
        this.symbol=Symbol;
        this.open=Open;
        this.high=High;
        this.low=Low;
        this.close=Close;
        this.volume=Volume;
    }
}
//////////////////////////////// Private Method ////////////////////////////////////////////
function _createBar(myStrategy,tick) {

    if(myStrategy.Symbol_KBarId_TickListDic[tick.symbol]==undefined)
    {
        myStrategy.Symbol_KBarId_TickListDic[tick.symbol]={};
    }

    //分钟线结束事件
    if(myStrategy.KBarMillSecondInterval)
    {
        let KBarId = parseInt(tick.timeStamp/myStrategy.KBarMillSecondInterval);

        //不存在KBarId,说明有一个新K线产生
        if(myStrategy.Symbol_KBarId_TickListDic[tick.symbol][KBarId]==undefined)
        {
            //创建新K线包含的TickList缓存数组
            _createNewBar(myStrategy,KBarId,tick);

            //创建上一个完整K线,加入到策略订阅合约的K线列表
            for(let barId in myStrategy.Symbol_KBarId_TickListDic[tick.symbol])
            {
                if(barId!=KBarId)
                {
                    //创建上一个完整K线,加入到策略订阅合约的K线列表
                    _createClosedBar(myStrategy,barId,tick);
                    //创建完删除上一个完整K线的TickList缓存
                    delete myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId];
                }

                break;
            }
        }else
        {
            myStrategy.Symbol_KBarId_TickListDic[tick.symbol][KBarId].push(tick);
        }
    }
}

function _createNewBar(myStrategy,barId,tick) {

    let KBarTickList=[];
    KBarTickList.push(tick);
    myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId]=KBarTickList;
    //通知策略产生了一个新Bar
    let bar_StartDatetime=KBarTickList[0].datetime;
    let bar_EndDatetime=KBarTickList[KBarTickList.length-1].datetime;
    let newBar=new KBar(barId,bar_StartDatetime,bar_EndDatetime,tick.symbol,tick.lastPrice,tick.lastPrice,tick.lastPrice,tick.lastPrice,tick.volume);
    myStrategy.OnNewBar(newBar);
}

function _createClosedBar(myStrategy,barId,tick) {
    let bar_TickList = myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId];

    if(bar_TickList.length>0)
    {
        let bar_StartDatetime=bar_TickList[0].datetime;
        let bar_EndDatetime=bar_TickList[bar_TickList.length-1].datetime;
        let bar_Open=bar_TickList[0].lastPrice;
        let bar_Close=bar_TickList[bar_TickList.length-1].lastPrice;
        let bar_High = bar_TickList[0].lastPrice;
        let bar_Low = bar_TickList[0].lastPrice;
        let volume=0;
        for(let i=0;i< bar_TickList.length;i++)
        {
            bar_High = Math.max(bar_High,bar_TickList[i].lastPrice);
            bar_Low = Math.min(bar_Low,bar_TickList[i].lastPrice);
            volume += bar_TickList[i].volume;
        }

        let bar=new KBar(barId,bar_StartDatetime,bar_EndDatetime,tick.symbol,bar_Open,bar_High,bar_Low,bar_Close,volume);

        if(myStrategy.Symbol_KBarListDic[tick.symbol]==undefined)
        {
            let KBarList=[];
            myStrategy.Symbol_KBarListDic[tick.symbol]=KBarList;
        }

        myStrategy.Symbol_KBarListDic[tick.symbol].push(bar);
        //通知策略产生了一个完整Bar
        myStrategy.OnClosedBar(bar);
    }
}

class BaseStrategy{
    constructor(strategyConfig){
        this.name=strategyConfig.name;
        this.symbols=strategyConfig.symbols;
        this.KBarType=strategyConfig.BarType;
        this.KBarInterval=strategyConfig.BarInterval;
        this.Symbol_KBarListDic={};
        this.KBarMillSecondInterval=undefined;

        this.Symbol_KBarId_TickListDic={};

        if(this.KBarType!=undefined && this.KBarInterval!=undefined)
        {
            switch(this.KBarType)
            {
                case KBarType.Second:
                    this.KBarMillSecondInterval=this.KBarInterval*1000;
                    break;
                case KBarType.Minute:
                    this.KBarMillSecondInterval=this.KBarInterval*60*1000;
                    break;
                case KBarType.Hour:
                    this.KBarMillSecondInterval=this.KBarInterval*60*60*1000;
                    break;
                default:
                    break;
            }
        }
    }

    ////////////////////////////////////////////////////////////// Public Method ///////////////////////////////////////////////////////////////////////////

    /// <summary>
    /// 策略退出
    /// </summary>
    Stop(){

    }

    OnTick(tick){

        _createBar(this,tick);
    }

    OnClosedBar(closedBar)
    {

    }

    OnNewBar(newBar)
    {

    }


    OnOrder(order){

    }

    OnTrade(trade){

    }

    GetUnFinishOrderList()
    {
        let unFinishOrderList=global.Application.StrategyEngine.GetUnFinishOrderList(this.name);
        return unFinishOrderList;
    }


    /// <summary>
    /// 获取合约的仓位对象
    /// </summary>
    /// <returns>仓位对象</returns>
    GetPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        return position;
    }

    /// <summary>
    /// 获取合约的今天非锁多仓
    /// </summary>
    /// <returns>今天非锁多仓数量</returns>
    GetTodayUnLockLongPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let unLockTodayLongPosition=0;
        if(position!=undefined && position.longTdPosition>position.shortTdPosition)
        {
            unLockTodayLongPosition = position.longTdPosition - position.shortTdPosition;
        }
        return unLockTodayLongPosition;
    }

    /// <summary>
    /// 获取合约的今天非锁空仓数量
    /// </summary>
    /// <returns>今天非锁空仓数量</returns>
    GetTodayUnLockShortPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let unLockTodayShortPosition=0;
        if(position!=undefined && position.shortTdPosition > position.longTdPosition)
        {
            unLockTodayShortPosition =  position.shortTdPosition - position.longTdPosition;
        }
        return unLockTodayShortPosition;
    }

    /// <summary>
    /// 获取合约的今天锁仓数量
    /// </summary>
    /// <returns>今天锁仓数量</returns>
    GetTodayLockedPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let tdLockedPostion=0;

        if(position!=undefined && position.shortTdPosition>0 && position.longTdPosition>0)
        {
            tdLockedPostion=Math.min(position.shortTdPosition,position.longTdPosition);
        }

        return tdLockedPostion;
    }

    /// <summary>
    /// 获取合约的昨非锁多仓
    /// </summary>
    /// <returns>昨非锁多仓数量</returns>
    GetYesterdayUnLockLongPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let unLockYdLongPosition=0;
        if(position!=undefined && position.longYdPosition > position.shortYdPosition)
        {
            unLockYdLongPosition =  position.longYdPosition - position.shortYdPosition;
        }
        return unLockYdLongPosition;
    }

    /// <summary>
    /// 获取合约的昨非锁空仓数量
    /// </summary>
    /// <returns>昨非锁空仓数量</returns>
    GetYesterdayUnLockShortPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let unLockYdShortPosition=0;
        if(position!=undefined && position.shortYdPosition > position.longYdPosition)
        {
            unLockYdShortPosition =  position.shortYdPosition - position.longYdPosition;
        }

        return unLockYdShortPosition;
    }

    /// <summary>
    /// 获取合约的昨锁仓数量
    /// </summary>
    /// <returns>昨锁仓数量</returns>
    GetYesterdayLockedPosition(symbol)
    {
        if(symbol==undefined)
            return undefined;

        let position = global.Application.StrategyEngine.GetPosition(this.name,symbol);
        let ydLockedPostion=0;

        if(position!=undefined && position.longYdPosition>0 && position.shortYdPosition>0)
        {
            ydLockedPostion=Math.min(position.shortTdPosition,position.longYdPosition);
        }

        return ydLockedPostion;
    }

    /// <summary>
    /// 下单接口
    /// </summary>
    /// <param name="symbol">目标合约</param>
    /// <param name="limitePrice">限定价格</param>
    /// <param name="volume">下单手数</param>
    /// <param name="direction">方向</param>
    /// <param name="openClose">开平类型</param>
    ///以上是限价单必须的参数,如果要下FAK、FOK单需要加多以下参数
    ///<param name="orderType">订单类型</param>
    //以上是FAK、FOK单必须的参数,如果要下 市价单 需要加多以下参数
    ///<param name="tick">市价单需要的tick信息,为了知道涨停、跌停价</param>
    //以上是市价单必须的参数,如果要下 条件单 需要加多以下参数
    //<param name="contingentCondition"> 条件单的价格条件</param>
    //<param name="stopPrice"> 条件单的触发价格，可与limitePrice对比以触发contingentCondition</param>
    /// <returns></returns>
    SendOrder(symbol,limitePrice,volume,direction,openClose,orderType,tick,contingentCondition,stopPrice)
    {
        if(arguments.length<5)
        {
            let message= "Send Order Failed.Reason:Not Valid Parameters";
            let error=new NodeQuantError(this.name,ErrorType.StrategyError,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);
            return;
        }

        let sendOrderType= arguments[5] ? orderType : OrderType.Limit;

        let contract = global.Application.MainEngine.GetContract(symbol);
        let clientname=contract.clientName;

        switch(sendOrderType)
        {
            case OrderType.Limit:
                global.Application.StrategyEngine.SendLimitOrder(this,symbol,direction,openClose,volume,limitePrice);

                //记录发出订单
                var orderRecord={};
                orderRecord.dateTime = new Date().toLocaleString();
                orderRecord.Type= OrderReverseType[OrderType.Limit];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;

                global.Application.StrategyEngine.RecordOrder(this.name,orderRecord);
                break;
            case OrderType.FAK:
                global.Application.StrategyEngine.SendFillAndKillLimitOrder(this,symbol,direction,openClose,volume,limitePrice);

                //记录发出订单
                var orderRecord={};
                orderRecord.dateTime = new Date().toLocaleString();
                orderRecord.Type= OrderReverseType[OrderType.FAK];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;

                global.Application.StrategyEngine.RecordOrder(this.name,orderRecord);
                break;
            case OrderType.FOK:
                global.Application.StrategyEngine.SendFillOrKillLimitOrder(this,symbol,direction,openClose,volume,limitePrice);

                //记录发出订单
                var orderRecord={};
                orderRecord.dateTime = new Date().toLocaleString();
                orderRecord.Type= OrderReverseType[OrderType.FOK];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;

                global.Application.StrategyEngine.RecordOrder(this.name,orderRecord);

                break;
            case OrderType.Market:
                if(arguments[6]!=undefined && tick.upperLimit!=undefined && tick.lowerLimit!=undefined)
                {
                    if(direction==Direction.Buy)
                        limitePrice=tick.upperLimit;
                    else if(direction==Direction.Sell)
                        limitePrice=tick.lowerLimit;

                    global.Application.StrategyEngine.SendLimitOrder(this,symbol,direction,openClose,volume,limitePrice);

                    //记录发出订单
                    var orderRecord={};
                    orderRecord.dateTime = new Date().toLocaleString();
                    orderRecord.Type= OrderReverseType[OrderType.Market];
                    orderRecord.symbol = symbol;
                    orderRecord.direction = DirectionReverse[direction];
                    orderRecord.offset = OpenCloseFlagReverseType[openClose];
                    orderRecord.price = limitePrice;
                    orderRecord.volume = volume;
                    orderRecord.contingentCondition = undefined;
                    orderRecord.stopPrice = undefined;

                    global.Application.StrategyEngine.RecordOrder(this.name,orderRecord);

                }else
                {
                    let message="Send Market Order Failed.Reason:Miss Market Tick INFO";
                    let error=new NodeQuantError(this.name,ErrorType.StrategyError,message);

                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }
                break;
            case OrderType.Condition:
                if(arguments[7]==undefined)
                {

                    let message= "Send Condition Order Failed.Reason:Miss ContingentCondition Type";
                    let error=new NodeQuantError(this.name,ErrorType.StrategyError,message);
                    global.AppEventEmitter.emit(EVENT.OnError,error);

                }else if(arguments[8]==undefined)
                {
                    let message="Send Condition Order Failed.Reason:Miss StopPrice";
                    let error=new NodeQuantError(this.name,ErrorType.StrategyError,message);
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }else{
                    global.Application.StrategyEngine.SendStopLimitOrder(this,symbol,direction,openClose,volume,limitePrice,contingentCondition,stopPrice);

                    //记录发出订单
                    var orderRecord={};
                    orderRecord.dateTime = new Date().toLocaleString();
                    orderRecord.Type= OrderReverseType[OrderType.Condition];
                    orderRecord.symbol = symbol;
                    orderRecord.direction = DirectionReverse[direction];
                    orderRecord.offset = OpenCloseFlagReverseType[openClose];
                    orderRecord.price = limitePrice;
                    orderRecord.volume = volume;
                    orderRecord.contingentCondition=ContingentConditionReverseType[contingentCondition];
                    orderRecord.stopPrice=stopPrice;

                    global.Application.StrategyEngine.RecordOrder(this.name,orderRecord);
                }
                break;
            default:
                break;
        }
    }

    /// <summary>
    /// 劣势下单价格，在指定的交易方向进行加跳,以达到更好地成交成功率
    /// </summary>
    /// <param name="symbol">目标合约</param>
    /// <param name="price">指定价格</param>
    /// <param name="direction">交易方向</param>
    /// <param name="priceTickCount">加跳数，默认2跳</param>
    /// <returns>加了条数的价格</returns>
    PriceUp(symbol,price,direction,priceTickCount){
        if(arguments.length<3)
        {
            return undefined;
        }

        let tickCount= arguments[4] ? priceTickCount:2;
        let contract = global.Application.MainEngine.GetContract(symbol);
        let priceTick=contract.priceTick;

        let orderPrice= this.TrimPriceByPriceTick(price,priceTick);

        let worsePrice=undefined;
        if(direction==Direction.Buy)
            worsePrice=orderPrice+tickCount*priceTick;
        else if(direction==Direction.Sell)
            worsePrice=orderPrice-tickCount*priceTick;

        return worsePrice;
    }

    /// <summary>
    /// 优势下单价格，在指定的交易方向进行减跳,以达到更好地成交价格。( 注意：优势价格限价单可能不会立即成交 )
    /// </summary>
    /// <param name="symbol">目标合约</param>
    /// <param name="price">指定价格</param>
    /// <param name="direction">交易方向</param>
    /// <param name="n">加跳数，默认2跳</param>
    /// <returns>减了条数的价格</returns>
    PriceDown(symbol,price,direction,priceTickCount){
        if(arguments.length<3)
        {
            return undefined;
        }

        let tickCount= arguments[4] ? priceTickCount:2;
        let contract = global.Application.MainEngine.GetContract(symbol);
        let priceTick=contract.priceTick;

        let orderPrice= this.TrimPriceByPriceTick(price,priceTick);

        let betterPrice=undefined;
        if(direction==Direction.Buy)
            betterPrice=orderPrice-tickCount*priceTick;
        else if(direction==Direction.Sell)
            betterPrice=orderPrice+tickCount*priceTick;

        return betterPrice;
    }

    /// <summary>
    /// 对期货价格进行整理。如果价格不是最小单位的整数倍,则调整为最小价格的整数倍。
    /// </summary>
    /// <param name="price">原下单价格</param>
    /// <param name="priceTick">每跳价格</param>
    /// <returns name="trimPrice">price相对priceTick进行下舍入的价格</returns>
    TrimPriceByPriceTick(price,priceTick){
        let tickTime=price/priceTick;
        let trimPrice=tickTime*priceTick;
        return trimPrice;
    }

}

module.exports=BaseStrategy;

