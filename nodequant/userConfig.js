require("./common");
//配置客户端,NodeQuant启动,会连接已经配置打开的交易客户端

/*
 userID:"073572",
 password: "qq632386504",
 brokerID:"9999",
 mdAddress: "tcp://218.202.237.33:10012",
 tdAddress: "tcp://218.202.237.33:10002"
 */
/*      userID:"809008378",
        password:"233717",
        brokerID:"5010",
        mdAddress:"tcp://180.169.68.3:11213",
        tdAddress:"tcp://180.169.68.3:11205"
 */

ClientConfig={
    CTP:{
        PowerOn:true,
        userID:"809008378",
        password:"233717",
        brokerID:"5010",
        mdAddress:"tcp://180.169.68.3:11213",
        tdAddress:"tcp://180.169.68.3:11205"
    }
};
StrategyConfig={
    Strategys:[
        {
            name:"Demo",
            className:"DemoStrategy",
            symbols: {
                "i1709":{
                    fee:0.00006,
                    closeTodayFee:0.00024,
                    feeType:FeeType.TradeAmount
                }
            },
            BarType:KBarType.Minute,  //K线类型是: 分钟
            BarInterval:1,             //1分钟K线
        }
    ]
};

//MongoDB数据库配置
MongoDBConfig={
    Host:"localhost",
    Port:"27017",
    TimeOut:30*60*1000
};

//该设置配合NodeQuant通知服务可以通过声音,邮件通知用户策略发生的异常
NotifyExceptionConfig={
    ExceptionType:[
        ErrorType.Disconnected,
        ErrorType.OperationAfterDisconnected,
    ]
};
