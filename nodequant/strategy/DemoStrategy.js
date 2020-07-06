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
       console.log(this.name+"策略的"+closedBar.symbol+"K线结束,结束时间:"+closedBar.endDatetime.toLocaleString()+",Close价:"+closedBar.closePrice);
    }

    OnNewBar(newBar)
    {
        console.log(this.name+"策略的"+newBar.symbol+"K线开始,开始时间"+newBar.startDatetime.toLocaleString()+",Open价:"+newBar.openPrice);
    }

    OnTick(tick)
    {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
        console.log(this.name+"策略的"+tick.symbol+"的Tick,时间:"+tick.date+" "+tick.timeStr+",详情:"+JSON.stringify(tick));
    }

    Stop(){
        super.Stop();
    }
}
module.exports=DemoStrategy;