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

    }

    Stop(){
        super.Stop();
    }
}
module.exports=DemoStrategy;