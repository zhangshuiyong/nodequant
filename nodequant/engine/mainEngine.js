/**
 * Created by Administrator on 2017/6/12.
 */
require("../common.js");
require("../systemConfig");
require("../userConfig.js");

let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

let CtpClient=require("../model/client/CTPClient");

let Log=require("../model/db/LogModel");

function _isTimeToWork() {
    let NowDateTime=new Date();
    //自然馹,的周末一定不需要工作!
    let weekDay=NowDateTime.getDay();
    if(weekDay<1 || weekDay>5)
    {
        return false;
    }

    let NowDateStr=NowDateTime.toLocaleDateString();

    let DayStartDateTimeStr=NowDateStr+" "+SystemConfig.DayStartTime;
    let DayStartDateTime=new Date(DayStartDateTimeStr);

    let DayStopDateTimeStr= NowDateStr +" "+ SystemConfig.DayStopTime;
    let DayStopDateTime=new Date(DayStopDateTimeStr);

    let NightStartDateTimeStr= NowDateStr +" "+ SystemConfig.NightStartTime;
    let NightStartDateTime=new Date(NightStartDateTimeStr);

    let NextDateTime=new Date();
    NextDateTime.setDate(NextDateTime.getDate()+1);
    let NextDateStr=NextDateTime.toLocaleDateString();
    let NightStopDateTimeStr= NextDateStr +" "+ SystemConfig.NightStopTime;
    let NightStopDateTime=new Date(NightStopDateTimeStr);


    if(DayStartDateTime<NowDateTime && NowDateTime<DayStopDateTime)
    {
        return true;
    }else if(NightStartDateTime<NowDateTime && NowDateTime<NightStopDateTime)
    {
        return true;
    }

    return false;
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

        let log=new NodeQuantLog(error.Source,LogType.ERROR,new Date().toLocaleString(),error.Message);
        global.AppEventEmitter.emit(EVENT.OnLog,log);

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

    RecordLog(log){

        let logObj=new Log(log);
        logObj.save(function (err,doc) {
            if(err){
                throw err;
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
