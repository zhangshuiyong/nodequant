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
//Simnow 非交易时间可用(交易日下午4:00开始可用或者周末可用)
//mdAddress:"tcp://180.168.146.187:10131"
//tdAddress:"tcp://180.168.146.187:10130"

//Simnow 交易时间可用
//mdAddress:"tcp://180.168.146.187:10212"
//tdAddress:"tcp://180.168.146.187:10202"
ClientConfig={

    CTP:{
        userID:"simnow user",
        password:"simnow password",
        brokerID:"9999",
        AppID:"simnow_client_test",
        AuthCode:"0000000000000000",
	mdAddress:"tcp://180.168.146.187:10131",
        tdAddress:"tcp://180.168.146.187:10130"
    },
};

StrategyConfig={
    Strategys:[
        {
            name:"Demo",
            className:"DemoStrategy",
            symbols: {
                "au2112":{
                    //要配置在哪个交易客户端订阅该合约
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
