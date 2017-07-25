let BaseStrategy=require("./baseStrategy");
class DemoStrategy extends BaseStrategy{
    constructor(strategyConfig)
    {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
    }

    OnClosedBar(closedBar)
    {
       console.log(closedBar.symbol+"K线结束,结束时间:"+closedBar.endDateTime.toLocaleString()+",Close价:"+closedBar.close);
    }

    OnNewBar(newBar)
    {
        console.log(newBar.symbol+"K线开始,开始时间"+newBar.startDateTime.toLocaleString()+",Open价:"+newBar.open);
    }

    OnTick(tick)
    {
        //一定要调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        super.OnTick(tick);
        console.log(tick.symbol+"的Tick,时间:"+tick.date+" "+tick.time+",价格:"+tick.lastPrice);

        let position=this.GetPosition(tick.symbol);

        //position为undefined意思为还没有持仓
        if(position!=undefined)
        {
            console.log("空仓:"+position.GetShortPosition());
            console.log("空仓均价:"+position.GetShortPositionAveragePrice());
            console.log("今空仓:"+position.GetShortTodayPosition());
            console.log("昨空仓:"+position.GetShortYesterdayPosition());

            console.log("多仓:"+position.GetLongPosition());
            console.log("多仓均价:"+position.GetLongPostionAveragePrice());
            console.log("今多仓:"+position.GetLongTodayPosition());
            console.log("昨多仓:"+position.GetLongYesterdayPosition());

            console.log("锁仓:"+position.GetLockedPosition());
            console.log("昨锁仓:"+position.GetLockedYesterdayPosition());
            console.log("今锁仓:"+position.GetLockedTodayPosition());

            console.log("非锁空仓:"+position.GetUnLockShortPosition());
            console.log("非锁今空仓:"+position.GetUnLockShortTodayPosition());
            console.log("非锁昨空仓:"+position.GetUnLockShortYesterdayPosition());

            console.log("非锁多仓:"+position.GetUnLockLongPosition());
            console.log("非锁今多仓:"+position.GetUnLockLongTodayPosition());
            console.log("非锁昨多仓:"+position.GetUnLockLongYesterdayPosition());

        }
    }

    Stop(){
        super.Stop();
    }
}
module.exports=DemoStrategy;