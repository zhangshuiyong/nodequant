/**
 * Created by Administrator on 2017/6/19.
 */
require("./common");

MongoDBConfig={
    Host:"localhost",
    Port:"27017"
};

//Tick数据记录引擎,设计上原则上不允许主引擎开启后再打开,可配置与主引擎开启时打开或者关闭
TickRecordEngineConfig={
    PowerOn:false
};

//策略引擎负责启动和运行策略,可以配置开关
StrategyEngineConfig={
    PowerOn:true
};

//配置客户端,主引擎启动,都会连接,获取合约
ClientConfig={
    CTP:{
        isPowerOn:true,
        userID:"073572",
        password: "*********",
        brokerID:"9999",
        mdAddress: "tcp://218.202.237.33:10012",
        tdAddress: "tcp://218.202.237.33:10002"
    }
};

StrategyConfig={
    //策略所在的文件夹的绝对地址
    StrategyDir:"F:/nodequant/nodequant/strategy/",
    Strategys:[
        {
            name:"Demo",
            className:"DemoStrategy",
            symbols:{"m1709":{
                fee:0.00006,
                closeTodayFee:0.00024,
                feeType:FeeType.TradeAmount
            }
            },
            //K线类型是: 分钟
            BarType:KBarType.Minute,
            //5分钟K线
            BarInterval:1,
        }/*,
        {
            name:"Open_Close_Stgy",
            className:"Open_CloseStrategy",
            symbols:{"c1709":{
                fee:0.00004,
                closeTodayFee:0.0002,
                feeType:FeeType.TradeAmount
            }},
            //K线类型是: 分钟
            BarType:KBarType.Minute,
            //5分钟K线
            BarInterval:1,
            OpenTime:"13:30:00",
            CloseTime:"14:55:00"
        }*/
    ]
};

//该设置配合NodeQuant通知服务可以通过声音,邮件通知用户策略发生的异常
NotifyExceptionConfig={
    ExceptionType:[
        ErrorType.Disconnected,
        ErrorType.OperationAfterDisconnected,
    ]
};