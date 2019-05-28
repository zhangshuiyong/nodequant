/**
 * Created by Administrator on 2017/6/12.
 */
let path=require("path");
require("../common.js");
require("../systemConfig");
require("../userConfig.js");

let NodeQuantLog=require("../util/NodeQuantLog");
let NodeQuantError=require("../util/NodeQuantError");

let ClientFactory=require("../model/client/ClientFactory");

function _isTimeToWork() {
    let systemConfigPath=path.resolve(__dirname+"/../systemConfig.js");
    require.cache[systemConfigPath]=null;
    require("../systemConfig");

    let NowDateTime=new Date();
    let NowDateStr=NowDateTime.toLocaleDateString();

    //夜盘结束时间
    let NightStopTimeStr=NowDateStr+" "+ SystemConfig.NightStopTime;
    let NightStopDateTime=new Date(NightStopTimeStr);


    //自然日的周末,周六的凌晨停止时间以后不用工作
    let weekDay=NowDateTime.getDay();
    if(weekDay<1)
    {
        return MainEngineStatus.Stop;
    }else if(weekDay===6)
    {
        //周六凌晨03:00以后就不工作
        if(NightStopDateTime<NowDateTime)
        {
            return MainEngineStatus.NightStop;
        }
    }

    //工作日的工作时间
    let DayStartDateTimeStr=NowDateStr+" "+SystemConfig.DayStartTime;
    let DayStartDateTime=new Date(DayStartDateTimeStr);

    let DayStopDateTimeStr= NowDateStr +" "+ SystemConfig.DayStopTime;
    let DayStopDateTime=new Date(DayStopDateTimeStr);

    let NightStartDateTimeStr= NowDateStr +" "+ SystemConfig.NightStartTime;
    let NightStartDateTime=new Date(NightStartDateTimeStr);

    if(NightStopDateTime<DayStartDateTime && NightStopDateTime<NowDateTime && NowDateTime<DayStartDateTime)
    {
        //在当天凌晨3:00 ~ 早上9:00是不需要打开的
        return MainEngineStatus.NightStop;
    }else if(NightStopDateTime>DayStartDateTime && NightStopDateTime<NowDateTime)
    {
        //现在时间大于结束时间23:00
        return MainEngineStatus.NightStop;
    }else if(DayStopDateTime<NowDateTime && NowDateTime<NightStartDateTime)
    {
        //在当天下午15:30:00 ~ 晚上20:00是不需要打开的
        return MainEngineStatus.DayStop;
    }

    return MainEngineStatus.Start;
}

function _registerEvent(myEngine) {

    //每隔5分钟检查是否需要自动退出交易客户端

    setInterval(function () {
        let enginStatus=_isTimeToWork();
        if(MainEngineStatus.Start!==enginStatus)
        {
            if(myEngine.isWorking)
            {
                myEngine.Stop(enginStatus);
            }
        }else
        {
            if(false===myEngine.isWorking)
            {
                myEngine.ReStart();
            }
        }
    },2*60*1000);


    global.AppEventEmitter.on(EVENT.OnReceivedAllContract,function (clientName) {

        //策略引擎是否已经启动
        if(global.NodeQuant.StrategyEngine.IsWorking === false)
        {
            //策略引擎还没启动,检查所有策略引擎所需要的交易客户端是否已经都启动了
            //检查所有交易客户端是否已经都连接上
            for (let clientNameInstance in myEngine.clientDic) {
                if (myEngine.clientDic[clientNameInstance].IsGetAllContract() === false) {
                    return;
                }

                //获得所有合约是交易端,市场端与交易端相互独立,订阅要市场端订阅
                //发生过交易端登录了，返回所有合约列表，但是市场端没有登录成功情况
                if(myEngine.clientDic[clientNameInstance].IsMdConnected() === false)
                {
                    let message="获得"+clientNameInstance+"所有市场合约,但是其市场前置没登录成功,不会启动StrategyEngine.";
                    let error=new NodeQuantError("MainEngine",ErrorType.DBError,message);

                    global.AppEventEmitter.emit(EVENT.OnError,error);

                    return;
                }
            }

            if(myEngine.contractDic==={})
            {
                console.log("Received all contract But contract dictionnary is empty.Will not start strategy engine.please check");
                return;
            }

            global.AppEventEmitter.emit(EVENT.OnAllConfigClientReadyed, "AllConfigClientReadyed");
        }
    });


    global.AppEventEmitter.on(EVENT.OnAllConfigClientReadyed,function (msg) {

        //所有配置的客户端，启动策略引擎

        if(global.NodeQuant.StrategyEngine.IsWorking===false)
        {
            //没有启动过,但是所有客户端已经连接成功,策略引擎启动过，策略启动过
            global.NodeQuant.StrategyEngine.Start();
        }

    });

    global.AppEventEmitter.on(EVENT.OnContract,function (contract) {
        if(myEngine.contractDic[contract.clientName]===undefined)
        {
            myEngine.contractDic[contract.clientName]={};
        }

        myEngine.contractDic[contract.clientName][contract.symbol]=contract;

        //交易合约点数对应价值
        myEngine.contractSizeDic[contract.symbol]=contract.size;
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
        if(error.ErrorID!==0)
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

        //交易日
        this.TradingDay="";

        this.clientDic = {};

        this.contractDic={};

        //合约每点的价值字典,用于计算净值,而且与交易客户端无关
        this.contractSizeDic={};

        _registerEvent(this);
    }

    Start(){

        let enginStatus=_isTimeToWork();
        if(MainEngineStatus.Start!==enginStatus)
            return;

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine Start");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //重置主引擎变量
        this.Reset();

        //创建所有客户端
        this.CreateAllClient();

        //连接所有客户端
        this.ConnectAllClient();
    }

    CreateAllClient()
    {
        for(let clientName in ClientConfig)
        {
            if(SupportClients[clientName]!==undefined)
            {
                this.clientDic[clientName]=ClientFactory.Create(clientName);
            }
        }
    }

    Reset()
    {
        //重置开关
        this.isWorking = true;
        //重置合约字典
        this.contractDic={};

        //重置交易客户端
        this.clientDic={};
    }


    ReStart() {

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine ReStart");
        global.AppEventEmitter.emit(EVENT.OnLog,log);

        //重置主引擎变量
        this.Reset();

        //创建所有客户端
        this.CreateAllClient();

        //连接Clients
        this.ConnectAllClient();

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

    Stop(mainEngineStatus) {

        //1.停止策略引擎
        global.NodeQuant.StrategyEngine.Stop(mainEngineStatus);

        //2.断开Clients
        for(let key in this.clientDic)
        {
            if(this.clientDic[key]!==undefined)
            {
                //已经连接上交易前端,断开
                if(this.clientDic[key].IsMdConnected()){
                    this.clientDic[key].Exit();

                    //删除pointer
                    this.clientDic[key]=null;
                }
            }
        }

        this.clientDic=null;
        //释放交易客户端
        this.clientDic={};

        //设置主引擎停止工作标志
        this.isWorking = false;

        let log=new NodeQuantLog("MainEngine",LogType.INFO,new Date().toLocaleString(),"MainEngine Stop");
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    RecordError(error)
    {
        global.NodeQuant.SystemDBClient.lpush(System_Error_DB,JSON.stringify(error),function (err,reply) {
            if(err) {

                throw new Error("记录System_Error失败，原因:"+err);
            }
        });
    }

    RecordLog(log){
        global.NodeQuant.SystemDBClient.lpush(System_Log_DB,JSON.stringify(log),function (err,reply) {
            if(err) {

                let message="记录System_Log失败，原因:"+err;
                let error=new NodeQuantError("MainEngine",ErrorType.DBError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);

                throw new Error(message);
            }
        });
    }




    GetClient(clientName) {
        return this.clientDic[clientName];
    }

    GetAllClient() {
        return this.clientDic;
    };

    GetTradingDay()
    {
        for(let clientName in this.clientDic)
        {
            return this.clientDic[clientName].GetTradingDay();
        }

        return undefined;
    }

    GetMdApiVersion()
    {
        for(let clientName in this.clientDic)
        {
            return this.clientDic[clientName].GetMdApiVersion();
        }

        return undefined;
    }

    GetTdApiVersion()
    {
        for(let clientName in this.clientDic)
        {
            return this.clientDic[clientName].GetTdApiVersion();
        }

        return undefined;
    }

    GetContract(clientName,contractName){
        if(this.contractDic[clientName])
        {
            return this.contractDic[clientName][contractName];
        }else
        {
            return undefined;
        }
    };

    GetAllContract(){
        return this.contractDic;
    };

    //获取交易合约每点价值
    GetContractSize(contractName)
    {
        return this.contractSizeDic[contractName];
    }

    Subscribe(clientName,contractName) {
        let client=this.clientDic[clientName];
        let ret =-1;
        if(client)
        {
            ret = client.Subscribe(contractName);
        }

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
        //console.timeEnd("NodeQuant-TickToFinishSendOrder");
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

    QueryTradingAccount(clientName)
    {
        let ret = this.clientDic[clientName].QueryTradingAccount();
        return ret;
    }

    QuerySettlementInfo(clientName){
        let ret = this.clientDic[clientName].QuerySettlementInfo();
        return ret;
    }

    QueryCommissionRate(clientName,contractSymbol)
    {
        let ret = this.clientDic[clientName].QueryCommissionRate(contractSymbol);
        return ret;
    }

    QueryDeferFeeRate(clientName,contractSymbol)
    {
        let ret = this.clientDic[clientName].QueryDeferFeeRate(contractSymbol);
        return ret;
    }

    CancelOrder(clientName,order) {
        let ret = this.clientDic[clientName].CancelOrder(order);
        return ret;
    }
}

module.exports=MainEngine;
