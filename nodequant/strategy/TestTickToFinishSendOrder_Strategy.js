let BaseStrategy=require("./baseStrategy");
class TestTickToFinishSendOrder_Strategy extends BaseStrategy{
    constructor(strategyConfig)
    {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        this.TickCount=0;
    }

    OnClosedBar(closedBar)
    {
        console.log(closedBar.symbol+"K线结束,结束时间:"+closedBar.endDatetime.toLocaleString()+",Close价:"+closedBar.closePrice);
    }

    OnNewBar(newBar)
    {
        console.log(newBar.symbol+"K线开始,开始时间"+newBar.startDatetime.toLocaleString()+",Open价:"+newBar.openPrice);
    }

    OnTick(tick)
    {
        if(this.TickCount==30)
        {
            console.time("NodeQuant-Sgit-TickToFinishSendOrder");
            this.SendOrder(tick.clientName,tick.symbol,tick.lastPrice,1,Direction.Buy,OpenCloseFlagType.Open);
        }
        this.TickCount++;
    }

    Stop(){
        super.Stop();
    }
}
module.exports=TestTickToFinishSendOrder_Strategy;