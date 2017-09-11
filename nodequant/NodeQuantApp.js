/**
 * Created by majc_tom on 2017/6/11.
 */

require("./common");
require("./systemConfig");
require("./userConfig");

let EventEmitter = require('events').EventEmitter;
let MainEngine=require("./engine/mainEngine");
let StrategyEngine=require("./engine/strategyEngine");

//事件触发器
global.AppEventEmitter = new EventEmitter();

class NodeQuantApp{
    constructor(application){

        console.log(">>>>>>>>>>  "+AppName+" <<<<<<<<<<");
        console.log("Date :" + new Date(Date.now()).toLocaleTimeString());

        let sendMarketOrder = require('./routes/test/sendMarketOrder');
        let sendLimitOrder = require('./routes/test/sendLimitOrder');
        let sendStopLimitOrder = require('./routes/test/sendStopLimitOrder');
        let sendMarketIfTouchedOrder = require('./routes/test/sendMarketIfTouchedOrder');
        let sendFillOrKillLimitOrder = require('./routes/test/sendFillOrKillLimitOrder');
        let sendFillAndKillLimitOrder = require('./routes/test/sendFillAndKillLimitOrder');
        let cancelOrder = require('./routes/test/cancelOrder');
        let subscribeContract = require('./routes/test/subscribeContract');
        let unSubscribeContract = require('./routes/test/unSubscribeContract');
        let queryCommissionRate=require('./routes/test/queryCommissionRate');
        let queryInvestorPosition = require('./routes/test/queryInvestorPosition');
        let queryTradingAccount = require('./routes/test/queryTradingAccount');

        application.use('/sendMarketOrder',sendMarketOrder);
        application.use('/sendLimitOrder',sendLimitOrder);
        application.use('/sendStopLimitOrder',sendStopLimitOrder);
        application.use('/sendMarketIfTouchedOrder',sendMarketIfTouchedOrder);
        application.use('/sendFillOrKillLimitOrder',sendFillOrKillLimitOrder);
        application.use('/sendFillAndKillLimitOrder',sendFillAndKillLimitOrder);

        application.use('/cancelOrder',cancelOrder);

        application.use('/subscribeContract',subscribeContract);
        application.use('/unSubscribeContract',unSubscribeContract);

        application.use('/queryCommissionRate',queryCommissionRate);
        application.use('/queryInvestorPosition',queryInvestorPosition);
        application.use('/queryTradingAccount',queryTradingAccount);

        let redis =require("redis");
        //初始化配置系统数据库
        this.SystemDBClient = redis.createClient(System_DBConfig.Port,System_DBConfig.Host);
        if(System_DBConfig.Password!=undefined && System_DBConfig.Password!="")
        {
            this.SystemDBClient.auth(System_DBConfig.Password);
        }

        this.SystemDBClient.on("error", function (err) {
            console.log("系统数据库出错,SystemDBClient Error " + err);
        });

        //初始化配置行情数据库
        try
        {
            if(MarketData_DBConfig!=undefined && MarketData_DBConfig.Port!=undefined && MarketData_DBConfig.Host != undefined)
            {
                this.MarketDataDBClient = redis.createClient(MarketData_DBConfig.Port,MarketData_DBConfig.Host);
                if(MarketData_DBConfig.Password!=undefined && MarketData_DBConfig.Password!="")
                {
                    this.MarketDataDBClient.auth(MarketData_DBConfig.Password);
                }

                this.MarketDataDBClient.on("error", function (err) {
                    console.log("行情数据库出错,MarketDataDBClient Error " + err);
                });
            }
        }catch(err)
        {
            console.log("初始化行情数据库出错:" + err);
        }

        this.StrategyEngine=new StrategyEngine();

        //上层引擎先实例化
        //主引擎负责启动底层各个客户端，还有启动上层的引擎
        //用于实现多策略，多品种。一个策略实例---只能交易一个品种？mq可以一个策略接收多个品种的Tick
        this.MainEngine=new MainEngine();
    }

    Start()
    {
        this.MainEngine.Start();
    }

    Exit()
    {
        console.log('NodeQuant Exit');
        global.Application.MainEngine.Stop(MainEngineStatus.Stop);

        // 关闭数据库连接
        this.SystemDBClient.quit();
    }
}

module.exports = NodeQuantApp;