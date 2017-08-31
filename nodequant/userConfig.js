require("./common");

//系统数据库配置
System_DBConfig={
    Host:"127.0.0.1",
    Port:6379
};


//行情数据库配置

MarketData_DBConfig={
        /*
               Host:"127.0.0.1",
               Port:6379,
               Password:"123456"
       */
};

//配置客户端,NodeQuant启动,会连接已经配置打开的交易客户端
ClientConfig={
    /*
    CTP:{
        userID:"888888",
        password: "888888",
        brokerID:"9999",
        mdAddress: "tcp://218.202.237.33:10012",
        tdAddress: "tcp://218.202.237.33:10002"

    },*/
    Sgit:{
       userID:"888888",
       password: "888888",
       brokerID:"",
       mdAddress: "tcp://116.228.215.210:10004",
       tdAddress: "tcp://116.228.215.210:10003"
    }
};

StrategyConfig={
    Strategys:[
        {
            name:"Demo",
            className:"DemoStrategy",
            symbols: {
                "Ag(T+D)":{
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

//该设置配合NodeQuant通知服务可以通过声音,邮件通知用户策略发生的异常
NotifyExceptionConfig={
    ExceptionType:[
        ErrorType.Disconnected,
        ErrorType.OperationAfterDisconnected,
    ]
};
