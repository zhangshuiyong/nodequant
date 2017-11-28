/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy=require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class Open_CloseStrategy extends BaseStrategy{

    //初始化
    constructor(strategyConfig)
    {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);

        this.OpenTime=strategyConfig.OpenTime;
        this.isOpen=false;
        this.CloseTime=strategyConfig.CloseTime;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar)
    {

    }

    OnNewBar(newBar)
    {

    }

    OnTick(tick)
    {
        super.OnTick(tick);

        let currentTime=new Date().toTimeString();

        if(currentTime>this.OpenTime)
        {
            //开仓
            //是否有未完成的Order
            let unFinishOrderList=this.GetUnFinishOrderList();
            if(unFinishOrderList.length===0)
            {
                //多仓是否存在
                let position = this.GetPosition(tick.symbol);
                if(position===undefined || position.longPosition===0)
                {
                    if(this.isOpen===false)
                    {
                        this.isOpen=true;
                        let price=this.PriceUp(tick.symbol,tick.lastPrice,Direction.Buy,2);
                        this.SendOrder(tick.clientName,tick.symbol,price,1,Direction.Buy,OpenCloseFlagType.Open);
                    }
                }
            }else
            {
                for(let index in unFinishOrderList)
                {
                    let unFinishOrder=unFinishOrderList[index];
                    global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                    //再次开仓
                    this.isOpen=false;
                }
            }
        }

        if(currentTime>this.CloseTime)
        {
            //平仓
            //是否有未完成的Order
            let unFinishOrderList=this.GetUnFinishOrderList();
            if(unFinishOrderList.length===0)
            {
                let unlockPosition = this.GetTodayUnLockLongPosition(tick.symbol);
                if (unlockPosition > 0)
                {
                    let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 2);
                    this.SendOrder(tick.clientName,tick.symbol, tick.lastPrice, unlockPosition, Direction.Sell, OpenCloseFlagType.CloseToday);
                }
            }
        }
    }

    Stop(){
        //调用基类方法
        super.Stop();
    }
}

module.exports=Open_CloseStrategy;