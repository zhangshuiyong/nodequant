require("./common");
require("./systemConfig");

//系统数据库配置
System_DBConfig={
    Host:"127.0.0.1",
    Port:6379
};


//行情数据库配置

MarketData_DBConfig={
/*
               Host:"127.0.0.1",
               Port:8888,
               Password:""
*/
};

//配置客户端,NodeQuant启动,会连接已经配置的交易客户端
ClientConfig={

    CTP:{
        userID:"0",
        password:"0",
        brokerID:"0",
        AppID:"client_nodequant_2.0.0",
        AuthCode:"0",
        mdAddress:"tcp://ip:port",
        tdAddress:"tcp://ip:port"
    }
};

StrategyConfig={
    Strategys:[
        {
            name:"Demo",
            className:"DemoStrategy",
            symbols: {
                "au1912":{
                    //要配置在哪个交易客户端订阅该合约，因为上期CTP和飞鼠Sgit都可以交易商品期货
                    clientName:SupportClients.CTP
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
