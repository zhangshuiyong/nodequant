/**
 * Created by Administrator on 2017/6/12.
 */
require("../common.js");
require("../systemConfig");
require("../userConfig.js");



//let MongoClient = require('mongodb').MongoClient;

let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

let CtpClient=require("../model/client/CTPClient");

//let Log=require("../model/db/LogModel");

function _isTimeToWork() {

    let NowDateTime=new Date();
    let NowDateStr=NowDateTime.toLocaleDateString();

    //夜盘结束时间
    let NightStopTimeStr=NowDateStr+" "+ SystemConfig.NightStopTime;
    let NightStopDateTime=new Date(NightStopTimeStr);


    //自然日的周末,周六的凌晨停止时间以后不用工作
    let weekDay=NowDateTime.getDay();
    if(weekDay<1)
    {
        return false;
    }else if(weekDay==6)
    {
        //周六凌晨03:00以后就不工作
        if(NightStopDateTime<NowDateTime)
        {
            return false;
        }
    }

    //工作日的工作时间
    let DayStartDateTimeStr=NowDateStr+" "+SystemConfig.DayStartTime;
    let DayStartDateTime=new Date(DayStartDateTimeStr);

    let DayStopDateTimeStr= NowDateStr +" "+ SystemConfig.DayStopTime;
    let DayStopDateTime=new Date(DayStopDateTimeStr);

    let NightStartDateTimeStr= NowDateStr +" "+ SystemConfig.NightStartTime;
    let NightStartDateTime=new Date(NightStartDateTimeStr);

    if(NightStopDateTime<NowDateTime && NowDateTime<DayStartDateTime)
    {
        //在当天凌晨3:00 ~ 早上9:00是不需要打开的
        return false;
    }else if(DayStopDateTime<NowDateTime && NowDateTime<NightStartDateTime)
    {
        //在当天下午15:30:00 ~ 晚上20:00是不需要打开的
        return false;
    }

    return true;
}

function _registerEvent(myEngine) {

    //每隔1分钟检查是否需要自动退出交易客户端

    setInterval(function () {

        if(false==_isTimeToWork())
        {
            if(myEngine.isWorking)
            {
                myEngine.Stop();
            }
        }else
        {
            if(false==myEngine.isWorking)
            {
                myEngine.ReStart();
            }
        }
    },5*60*1000);


    global.AppEventEmitter.on(EVENT.OnReceivedAllContract,function (clientName) {

        //策略引擎是否已经启动
        if(global.Application.StrategyEngine.IsWorking == false)
        {
            //策略引擎还没启动,检查所有策略引擎所需要的交易客户端是否已经都启动了
            //检查所有交易客户端是否已经都连接上
            for (let clientNameInstance in myEngine.clientDic) {
                if (myEngine.clientDic[clientNameInstance].IsGetAllContract() == false) {
                    return;
                }
            }

            global.AppEventEmitter.emit(EVENT.OnAllConfigClientReadyed, "AllConfigClientReadyed");
        }
    });


    global.AppEventEmitter.on(EVENT.OnAllConfigClientReadyed,function (msg) {

        //所有配置的客户端，启动策略引擎

        if(global.Application.StrategyEngine.IsWorking==false)
        {
            //没有启动过,但是所有客户端已经连接成功,策略引擎启动过，策略启动过
            global.Application.StrategyEngine.Start();
        }

    });

    global.AppEventEmitter.on(EVENT.OnContract,function (contract) {
        myEngine.contractDic[contract.symbol]=contract;

    });

    global.AppEventEmitter.on(EVENT.OnDisconnected,function (clientName) {
        //响应连接断开
        let message=clientName+"  Disconnected";
        let log = new NodeQuantLog(clientName,LogType.INFO,new Date().toLocaleString(),message);

        global.AppEventEmitter.emit(EVENT.OnLog,log);
    });

    //绑定事件多次,会有多次回调
    global.AppEventEmitter.on(EVENT.OnSubscribeContract,function (contractName,clientName,error) {
        let message="";
        if(error.ErrorID!=0)
        {
            message="Subscribe "+contractName+" Error,errorID:"+error.ErrorID+",errorMsg:"+error.Message;
        }else
        {
            message="Subscribe "+contractName+",Successful";
        }

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),message);

        global.AppEventEmitter.emit(EVENT.OnLog,log);
    });

    global.AppEventEmitter.on(EVENT.OnUnSubscribeContract,function (contractName,error) {

        let message="UnSubscribe "+contractName+",errorID:"+error.ErrorID+",errorMsg:"+error.Message;
        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),message);

        global.AppEventEmitter.emit(EVENT.OnLog,log);
    });

    global.AppEventEmitter.on(EVENT.OnError,function (error) {

        myEngine.RecordError(error);

        console.log("出现错误来源"+error.Source+" ,Msg:"+error.Message);
    });

    global.AppEventEmitter.on(EVENT.OnLog,function (log) {
        //汇总打印Log到数据库
        myEngine.RecordLog(log);
        console.log(log.Datetime+",信息来源"+log.Source+" ,Msg:"+log.Message);
    });
};

class MainEngine{

    constructor(){
        this.isWorking = false;

        this.clientDic = {};

        this.contractDic={};

        for(let clientName in ClientConfig)
        {
            if(SystemConfig.SupportClients[clientName]!=undefined)
            {
                switch(clientName)
                {
                    case "CTP":
                        if(ClientConfig[clientName].PowerOn)
                        {
                            this.clientDic[clientName] = new CtpClient();
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        _registerEvent(this);
    }

    Start(){

        if(false==_isTimeToWork())
            return;

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine Start");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //重置主引擎变量
        this.Reset();

        //连接所有客户端
        this.ConnectAllClient();
    }

    Reset()
    {
        //重置开关
        this.isWorking = true;
        //重置合约字典
        this.contractDic={};
    }


    ReStart() {

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine ReStart");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //重置主引擎变量
        this.Reset();

        //连接Clients
        this.ConnectAllClient();

    }

    Stop() {

        //1.停止策略引擎
        global.Application.StrategyEngine.Stop();

        //2.断开Clients
        for(let key in this.clientDic)
        {
            this.clientDic[key].Exit();
        }

        //设置主引擎停止工作标志
        this.isWorking = false;

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine Stop");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    RecordError(error)
    {
        global.Application.RedisDBClient.lpush(System_Log_DB,JSON.stringify(error),function (err,reply) {
            if(err) {

                let message="记录System_Error失败，原因:"+err.message;
                let error=new NodeQuantError("MainEngine",ErrorType.DBError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);

                throw new Error("记录System_Log失败，原因:"+err.message);
            }
        });
    }

    RecordLog(log){

        global.Application.RedisDBClient.lpush(System_Log_DB,JSON.stringify(log),function (err,reply) {
            if(err) {

                let message="记录System_Log失败，原因:"+err.message;
                let error=new NodeQuantError("MainEngine",ErrorType.DBError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);

                throw new Error("记录System_Log失败，原因:"+err.message);
            }
        });

    }

    ConnectAllClient()
    {
        for(let clientName in this.clientDic)
        {
            this.Connect(clientName);
        }
    }

    //主引擎进程可以启动多个交易客户端
    Connect(clientName) {
        this.clientDic[clientName].Connect();
    }


    GetClient(clientName) {
        return this.clientDic[clientName];
    }

    GetAllClient() {
        return this.clientDic;
    };

    GetContract(contractName){
        return this.contractDic[contractName];
    };

    GetAllContract() {
        return this.contractDic;
    };

    Subscribe(clientName,contractName) {
       let ret = this.clientDic[clientName].Subscribe(contractName);
       return ret;
    }

    UnSubscribe(clientName,contractName) {
        let ret = this.clientDic[clientName].UnSubscribe(contractName);
        return ret;
    }

    SendMarketOrder(clientName,contractName,direction,openclose,volume) {
        let ret = this.clientDic[clientName].SendMarketOrder(contractName,direction,openclose,volume);
        return ret;
    }

    SendLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice) {
        let ret = this.clientDic[clientName].SendLimitOrder(contractName,direction,openclose,volume,limitPrice);
        return ret;
    }

    SendMarketIfTouchedOrder(clientName,contractName,direction,openclose,volume,stopPriceCondition,stopPrice) {
        let ret = this.clientDic[clientName].SendMarketIfTouchedOrder(contractName,direction,openclose,volume,stopPriceCondition,stopPrice);
        return ret;
    }

    SendStopLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice,stopPriceCondition,stopPrice) {
        let ret = this.clientDic[clientName].SendStopLimitOrder(contractName,direction,openclose,volume,limitPrice,stopPriceCondition,stopPrice)
        return ret;
    }

    SendFillAndKillLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice) {
       let ret = this.clientDic[clientName].SendFillAndKillLimitOrder(contractName,direction,openclose,volume,limitPrice);
       return ret;
    }

    SendFillOrKillLimitOrder(clientName,contractName,direction,openclose,volume,limitPrice) {
       let ret = this.clientDic[clientName].SendFillOrKillLimitOrder(contractName,direction,openclose,volume,limitPrice);
       return ret;
    }


    QueryInvestorPosition(clientName) {
        let ret = this.clientDic[clientName].QueryInvestorPosition();
        return ret;
    }

    CancelOrder(clientName,order) {
        let ret = this.clientDic[clientName].CancelOrder(order);
        return ret;
    }
}

module.exports=MainEngine;
