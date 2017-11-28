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
        if(longPositionSumVolume!==0)
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
        if(shortPositionSumVolume!==0)
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
        let TodayTradingDay=global.NodeQuant.MainEngine.TradingDay;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            if(tradeRecord.tradingDay===TodayTradingDay)
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
        let TodayTradingDay=global.NodeQuant.MainEngine.TradingDay;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            if(tradeRecord.tradingDay===TodayTradingDay)
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
        let TodayTradingDay=global.NodeQuant.MainEngine.TradingDay;
        for(let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];
            if(tradeRecord.tradingDay!==TodayTradingDay)
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
        let TodayTradingDay=global.NodeQuant.MainEngine.TradingDay;
        for(let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];
            if(tradeRecord.tradingDay!==TodayTradingDay)
            {
                shortYdPosition+=tradeRecord.volume;
            }
        }
        return shortYdPosition;
    }

    UpdatePosition(trade) {
        if (this.symbol !== trade.symbol) {
            let error = new NodeQuantError("StrategyEngine", ErrorType.StrategyError, "UpdatePosition not contain this symbol:" + trade.symbol);
            global.AppEventEmitter.emit(EVENT.OnError, error);
            return;
        }

        if (trade.direction === Direction.Buy) {
            //多方开仓，则对应多头的持仓和今仓增加
            if (trade.offset === OpenCloseFlagType.Open) {
                this.longPositionTradeRecordList.push(trade);
            } else if (trade.offset === OpenCloseFlagType.CloseToday) {
                this.CloseBuyTodayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的 (平今仓买入 CloseToday Buy)手数多于"+trade.strategyName+"策略的( 今空仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            } else if (trade.offset === OpenCloseFlagType.CloseYesterday) {

                //买入平昨，对应空头的持仓和昨仓减少
                this.CloseBuyYesterDayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的 (平昨仓买入 CloseYesterday Buy)手数多于"+trade.strategyName+"策略的( 昨空仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            } else if (trade.offset === OpenCloseFlagType.Close) {
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
            if(trade.offset === OpenCloseFlagType.Open){
                //卖出开仓
                //计算开仓均价
                this.shortPositionTradeRecordList.push(trade);
            }else if(trade.offset === OpenCloseFlagType.CloseToday)
            {
                //卖出平今
                this.CloseSellTodayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的( 平今仓卖出 CloseToday Sell )手数多于"+trade.strategyName+"策略的( 今多仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            }else if(trade.offset === OpenCloseFlagType.CloseYesterday){
                //卖出平昨
                this.CloseSellYesterDayPosition(trade);

                if(trade.volume>0)
                {
                    let error=new NodeQuantError(trade.strategyName,ErrorType.StrategyError,trade.symbol+"的( 平昨仓卖出 CloseYesterday Sell )手数多于"+trade.strategyName+"策略的( 昨多仓 )持仓手数,平了账户其他策略仓位,请检查！！！")
                    global.AppEventEmitter.emit(EVENT.OnError,error);
                }

            }else if(trade.offset === OpenCloseFlagType.Close){
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
        if(trade===undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord=this.shortPositionTradeRecordList[index];

            //非当天的空仓不做处理
            if(tradeRecord.tradingDay !== trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume===0)
            {
                delete this.shortPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume===0)
            {
                break;
            }
        }
    }

    //昨仓: 平仓买入->开仓卖出(空仓)的成交记录要更新
    CloseBuyYesterDayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade===undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.shortPositionTradeRecordList)
        {
            let tradeRecord = this.shortPositionTradeRecordList[index];

            //当天的空仓不做处理
            if(tradeRecord.tradingDay === trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume===0)
            {
                delete this.shortPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume === 0)
            {
                break;
            }
        }
    }

    //今仓：平仓卖出 -> 开仓买入(多仓)的成交记录要更新
    CloseSellTodayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade===undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];

            //非当天的空仓不做处理
            if(tradeRecord.tradingDay !== trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume===0)
            {
                delete this.longPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume===0)
            {
                break;
            }
        }
    }

    CloseSellYesterDayPosition(trade)
    {
        //一共要更新多少手,平今仓的仓位,空仓记录可能有多条今仓记录，需要一直减
        if(trade===undefined || trade.volume<=0)
        {
            return;
        }

        for (let index in this.longPositionTradeRecordList)
        {
            let tradeRecord=this.longPositionTradeRecordList[index];

            //当天的多仓不做处理
            if(tradeRecord.tradingDay === trade.tradingDay)
            {
                continue;
            }

            let AvaVolume = tradeRecord.volume;

            let CloseVolume= Math.min(AvaVolume, trade.volume);

            tradeRecord.volume -= CloseVolume;
            //手数目为0的成交记录,要删除掉
            if(tradeRecord.volume===0)
            {
                delete this.longPositionTradeRecordList[index];
            }

            //判断是否更新完
            trade.volume -= CloseVolume;

            if (trade.volume===0)
            {
                break;
            }
        }
    }
}

module.exports=Position;