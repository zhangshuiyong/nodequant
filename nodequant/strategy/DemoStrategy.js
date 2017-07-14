/**
 * Created by Administrator on 2017/6/23.
 */

var BaseStrategy=require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class DemoStrategy extends BaseStrategy{

    //初始化
    constructor(strategyConfig)
    {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
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
    }

    Stop(){
        //调用基类方法
        super.Stop();
    }
}

module.exports=DemoStrategy;