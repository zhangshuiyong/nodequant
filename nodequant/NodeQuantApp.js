/**
 * Created by majc_tom on 2017/6/11.
 */

let EventEmitter = require('events').EventEmitter;
let MainEngine=require("./engine/mainEngine");
let StrategyEngine=require("./engine/strategyEngine");

//事件触发器
global.AppEventEmitter = new EventEmitter();

class NodeQuantApp{
    constructor(application){

        console.log(">>>>>>>>>>  NodeQuant <<<<<<<<<<");
        console.log("Date :" + new Date(Date.now()).toLocaleTimeString());

        var connectTdClient = require('./routes/presenter_end/connectTdClient');
        var sendMarketOrder = require('./routes/presenter_end/sendMarketOrder');
        var sendLimitOrder = require('./routes/presenter_end/sendLimitOrder');
        var sendStopLimitOrder = require('./routes/presenter_end/sendStopLimitOrder');
        var sendMarketIfTouchedOrder = require('./routes/presenter_end/sendMarketIfTouchedOrder');
        var sendFillOrKillLimitOrder = require('./routes/presenter_end/sendFillOrKillLimitOrder');
        var sendFillAndKillLimitOrder = require('./routes/presenter_end/sendFillAndKillLimitOrder');
        var queryInvestorPosition = require('./routes/presenter_end/queryInvestorPosition');
        var cancelOrder = require('./routes/presenter_end/cancelOrder');
        var subscribeContract = require('./routes/presenter_end/subscribeContract');
        var unSubscribeContract = require('./routes/presenter_end/unSubscribeContract');

        application.use('/connectTdClient', connectTdClient);
        application.use('/sendMarketOrder',sendMarketOrder);
        application.use('/sendLimitOrder',sendLimitOrder);
        application.use('/sendStopLimitOrder',sendStopLimitOrder);
        application.use('/sendMarketIfTouchedOrder',sendMarketIfTouchedOrder);
        application.use('/sendFillOrKillLimitOrder',sendFillOrKillLimitOrder);
        application.use('/sendFillAndKillLimitOrder',sendFillAndKillLimitOrder);
        application.use('/queryInvestorPosition',queryInvestorPosition);
        application.use('/cancelOrder',cancelOrder);
        application.use('/subscribeContract',subscribeContract);
        application.use('/unSubscribeContract',unSubscribeContract);

        this.StrategyEngine=new StrategyEngine();

        //上层引擎先实例化
        //主引擎负责启动底层各个客户端，还有启动上层的引擎
        //用于实现多策略，多品种。一个策略实例---只能交易一个品种？mq可以一个策略接收多个品种的Tick
        this.MainEngine=new MainEngine();
    }
}

module.exports = NodeQuantApp;