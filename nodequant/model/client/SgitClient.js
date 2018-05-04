/**
 * Created by Administrator on 2017/6/8.
 */
let NodeAddOnPath="./Sgit/"+process.platform+"/"+process.arch+"/NodeQuant.node";
console.log("SgitClient Node AddOn Path:"+NodeAddOnPath);
let TradingClientSingleton= require(NodeAddOnPath);

let fs = require("fs");
require("../../common.js");
require("../../userConfig.js");

let DateTimeUtil=require("../../util/DateTimeUtil");
let NodeQuantError=require("../../util/NodeQuantError");
let NodeQuantLog=require("../../util/NodeQuantLog");

class TradingClient{

    constructor(clientName){

        this.ClientName=clientName;

        this.userID= ClientConfig[this.ClientName].userID;
        this.password= ClientConfig[this.ClientName].password;
        this.brokerID= ClientConfig[this.ClientName].brokerID;
        this.mdAddress= ClientConfig[this.ClientName].mdAddress;
        this.tdAddress= ClientConfig[this.ClientName].tdAddress;

        this.mdClient = new MdClient(this.userID,this.password,this.brokerID,this.mdAddress);
        this.tdClient=new TdClient(this.userID,this.password,this.brokerID,this.tdAddress);
    }

    IsGetAllContract()
    {
        return this.tdClient.isGetAllContract;
    }

    IsMdConnected()
    {
        return this.mdClient.isLogined;
    }

    IsTdConnected()
    {
        return this.tdClient.isLogined;
    }

    Exit() {

        this.tdClient.exit();
        this.mdClient.exit();

        //清空pointer
        this.tdClient=null;
        this.mdClient=null;
    }

    Connect() {
        //创建行情和交易接口对象
        //先登录行情接口，行情接口连接上，再登录
        let ret = this.mdClient.connect();
        if(ret!==0)
        {
            let message="启动连接"+this.ClientName+"的mdClient失败.错误号:"+ret;
            let error=new NodeQuantError(this.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        }

        ret = this.tdClient.connect();

        if(ret!==0)
        {
            let message="启动连接"+this.ClientName+"的tdClient失败.错误号:"+ret;
            let error=new NodeQuantError(this.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        }
    }

    GetTradingDay()
    {
        let tradingDay=this.mdClient.getTradingDay();
        return tradingDay;
    }

    //订阅合约
    Subscribe(contractName) {
        return this.mdClient.subscribe(contractName);
    }

    UnSubscribe(contractName) {

        return this.mdClient.unSubscribe(contractName);
    }

    //市价单,不支持
    SendMarketOrder(contractName,direction,openClose,volume) {

        let sendOrderReq={};
        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //6项
        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：立即触发一个报单
        sendOrderReq.ContingentCondition= ContingentConditionType.Immediately;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=0;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：限价单
        sendOrderReq.OrderPriceType = OrderPriceType.AnyPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=0;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.AnyVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量立即自动撤单
        sendOrderReq.TimeCondition=TimeConditionType.ImmediatelyOrCancel;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);

    }


    //条件单
    //Stop-and-Limit order的意思是：有一个区间不成交，区间就是StopPrice和LimitPrice的区间
    SendStopLimitOrder(contractName,direction,openClose,volume,limitPrice,stopPriceCondition,stopPrice) {

        let sendOrderReq={};
        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：通过对比StopPrice条件触发一个报单
        sendOrderReq.ContingentCondition= stopPriceCondition;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=stopPrice;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：限价单
        sendOrderReq.OrderPriceType= OrderPriceType.LimitPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=limitPrice;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.AnyVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量当日还有效
        sendOrderReq.TimeCondition=TimeConditionType.GoodForDay;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);

    }

    //Market-If-Touched order
    //触价单
    SendMarketIfTouchedOrder(contractName,direction,openClose,volume,stopPriceCondition,stopPrice) {

        let sendOrderReq={};

        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：通过对比StopPrice条件触发一个报单
        sendOrderReq.ContingentCondition= stopPriceCondition;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=stopPrice;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：市价单
        sendOrderReq.OrderPriceType= OrderPriceType.AnyPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=0;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.AnyVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量当日还有效
        sendOrderReq.TimeCondition=TimeConditionType.GoodForDay;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);
    };


    //限价单
    SendLimitOrder(contractName,direction,openClose,volume,limitPrice) {

        //需要设置10项
        let sendOrderReq={};
        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //6项
        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：立即触发一个报单
        sendOrderReq.ContingentCondition= ContingentConditionType.Immediately;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=0;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：限价单
        sendOrderReq.OrderPriceType= OrderPriceType.LimitPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=limitPrice;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.AnyVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量当日还有效
        sendOrderReq.TimeCondition=TimeConditionType.GoodForDay;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);
    }


    //FAK单
    SendFillAndKillLimitOrder(contractName,direction,openClose,volume,limitPrice) {

        let sendOrderReq={};

        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //6项
        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：通过对比StopPrice条件触发一个报单
        sendOrderReq.ContingentCondition= ContingentConditionType.Immediately;;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=0;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：限价单
        sendOrderReq.OrderPriceType= OrderPriceType.LimitPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=limitPrice;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.AnyVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量当日还有效
        sendOrderReq.TimeCondition=TimeConditionType.ImmediatelyOrCancel;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);
    }

    //FOK单
    SendFillOrKillLimitOrder(contractName,direction,openClose,volume,limitPrice) {

        let sendOrderReq={};

        //4项
        sendOrderReq.InstrumentID=contractName;
        sendOrderReq.Direction=direction;
        sendOrderReq.CombOffsetFlag=openClose;
        sendOrderReq.VolumeTotalOriginal=volume;

        //6项
        //1.最高优先级：报单进入交易所触发条件
        //2.触发条件：通过对比StopPrice条件触发一个报单
        sendOrderReq.ContingentCondition= ContingentConditionType.Immediately;
        //3.触发条件对比价格：0代表不需要对比该价格
        sendOrderReq.StopPrice=0;

        //4.满足触发条件后，CTP会给交易所报下一个价格类型的单

        //5.设置该报单价格类型：限价单
        sendOrderReq.OrderPriceType= OrderPriceType.LimitPrice;

        //6.设定初始化价格：任意价
        sendOrderReq.LimitPrice=limitPrice;

        //7.交易所根据该价格立即撮合成交，将要成交的量条件：可以是任意(可能当时，没有量成交，部分量成交，全部量成交)
        sendOrderReq.VolumeCondition=VolumeConditionType.CompleteVolume;

        //8.一次成交流程过后，这张单是否要撤销（ImmediatelyOrCancel），还是继续保留当日有效（GFD）

        //9.撮合后，报单有效性设置：一次成交流程后，可成交量立即完成，剩余量当日还有效
        sendOrderReq.TimeCondition=TimeConditionType.ImmediatelyOrCancel;

        //发送下单命令（参数为10项重要下单属性）
        return this.tdClient.sendOrder(sendOrderReq);
    }

    //撤单
    CancelOrder(order) {

        let cancelOrderReq={};
        cancelOrderReq.BrokerID=this.brokerID;
        cancelOrderReq.InvestorID=order.userID;
        cancelOrderReq.InstrumentID=order.symbol;
        cancelOrderReq.ExchangeID=order.exchange;
        cancelOrderReq.OrderRef=order.orderID;
        cancelOrderReq.FrontID=order.frontID;
        cancelOrderReq.SessionID=order.sessionID;
        cancelOrderReq.OrderSysID=order.orderSysID;

        return this.tdClient.cancelOrder(cancelOrderReq);

    }

    //查询持仓
    QueryInvestorPosition() {

        return this.tdClient.queryInvestorPosition();
    }

    //查询资金情况
    QueryTradingAccount()
    {
        return this.tdClient.queryTradingAccount();
    }


    //查询合约手续费
    QueryCommissionRate(contractSymbol)
    {
        return this.tdClient.queryCommissionRate(contractSymbol);
    }

    /*
    //查询递延费
    QueryDeferFeeRate(contractSymbol)
    {
        return this.tdClient.queryDeferFeeRate(contractSymbol);
    }*/

    //////////////////////////////////////////////响应函数/////////////////////////////////////////////////////////

    OnQueryTradingAccount(tradingAccountInfo)
    {
        global.AppEventEmitter.emit(EVENT.OnQueryTradingAccount,tradingAccountInfo);
    }

    OnQueryCommissionRate(commissionRateInfo)
    {
        global.AppEventEmitter.emit(EVENT.OnQueryCommissionRate,commissionRateInfo);
    }

    /*
    OnQueryDeferFeeRate(deferFeeRateInfo)
    {
        global.AppEventEmitter.emit(EVENT.OnQueryDeferFeeRate,deferFeeRateInfo);
    }*/

    OnInfo(msg) {
        let log=new NodeQuantLog(this.ClientName,LogType.INFO,new Date().toLocaleString(),msg);
        global.AppEventEmitter.emit(EVENT.OnLog,log);
    }

    OnPosition(position) {
        global.AppEventEmitter.emit(EVENT.OnQueryPosition,position);
    }

    OnTick(tick) {
        global.AppEventEmitter.emit(EVENT.OnTick,tick);
    }

    OnOrder(order) {

        global.AppEventEmitter.emit(EVENT.OnOrder,order);
    }

    OnTrade(trade) {
        global.AppEventEmitter.emit(EVENT.OnTrade,trade);
    }

    OnContract(contract) {

        contract.clientName = this.ClientName;
        global.AppEventEmitter.emit(EVENT.OnContract,contract);
    }
}


class MdClient{

    constructor(userID,password,brokerID,address){

        this.userID=userID;
        this.password=password;
        this.brokerID=brokerID;
        this.address=address;

        this.MdApi = TradingClientSingleton.CreateMdApi();

        //ctp的市场信息客户端，需要有的状态：
        // 1.是否已经连接：isConnected
        //2.是否已经登录：isLogined
        this.isConnected=false;
        this.isLogined=false;

        //曾经订阅合约列表,(订阅命令都是由上层触发),用于与上层解耦,CTPClient自动重新连接
        this.subscribedContractSymbolDic={};
    }

    //监控登录过程是否结束
    //因为如果网络不好,TdApi 和 MdApi的OnFrontDisconnectd方法和OnFrontConnected方法就会很快来回切换,由于OnFrontConnected要重新登录
    // 所有如果登录过程没完成,而OnFrontConnected频繁调用,就会向CTP发出很多Login请求!!!
    //这里设置登录过程是否完成标志,每次OnFrontConnected只会重新登录一次,登录过程完成后,接收到OnFrontConnected才继续登录

    connect(){

        this.MdApi.on("FrontConnected",function () {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(tradingClient)
            {
                tradingClient.OnInfo("Market Front connected. --> Then Login");

                tradingClient.mdClient.isConnected = true;

                //FrontConnected事件都要重新登录,前面是connect或者FrontDisconnected
                tradingClient.mdClient.login();
            }
        });

        this.MdApi.on("FrontDisconnected", function (reasonId) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(tradingClient)
            {
                tradingClient.mdClient.isConnected = false;
                tradingClient.mdClient.isLogined = false;

                //市场行情接口没有连接上
                let message = "Market Front Disconnected.";
                let error = new NodeQuantError(tradingClient.ClientName, ErrorType.Disconnected, message);
                global.AppEventEmitter.emit(EVENT.OnError, error);
            }
        });

        this.MdApi.on("RspError",function (err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err===undefined)
            {
                err={};
            }

            err.ErrorMsg="Market Front Response Error. ErrorId:"+err.ErrorID+",ErrorMsg:"+err.Message;
            let error = new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError, err.ErrorMsg);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //mdFlowPath参数是本地流文件生成的目录
        //流文件是行情接口或交易接口在本地生成的流文件，后缀名为.con。流文件中记录着客户端收到的所有的数据流的数量。
        let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
        let mdFlowPath=__dirname+"/"+tradingClient.ClientName+"/mdFlowPath/";
        if(!fs.existsSync(mdFlowPath))
        {
            fs.mkdirSync(mdFlowPath);
        }

        if(this.isConnected===false)
        {
            return this.MdApi.connect(this.address,mdFlowPath);
        }else
        {
            if(this.isLogined===false)
            {
                tradingClient.OnInfo("Market Fornt have connected. -->Not Login --> Then Login");

                this.login();
            }else
            {
                tradingClient.OnInfo("Market Fornt have connected. --> And have Logined");
            }

            return 0;
        }
    }


    login() {

        //login的回调函数，先绑定登录的回调函数，再调用主动函数
        this.MdApi.on("RspUserLogin",function (response,err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err.ErrorID===0)
            {
                tradingClient.OnInfo("Market Front login successfully");

                tradingClient.mdClient.isLogined=true;

                //登录成功才认为市场行情已经连接
                tradingClient.isMdConnected=true;

                //重新登录成功，重新订阅
                for(let contractSymbol in tradingClient.mdClient.subscribedContractSymbolDic)
                {
                    tradingClient.mdClient.subscribe(contractSymbol);
                }

            }else{
                //行情接口登录失败
                let message="Market Front Login Failed.";
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.StrategyError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
        let ret = this.MdApi.login(this.userID,this.password,this.brokerID);
        tradingClient.OnInfo("Market Front login request sended. return:"+ret);
    }

    subscribe(contractSymbol) {

        //曾经订阅
        this.subscribedContractSymbolDic[contractSymbol]=contractSymbol;

        //登录成功才可以订阅
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            let message="Subscribe "+contractSymbol+" Failed,Error: Market Front have not Login";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.MdApi.on("RspSubMarketData",function (contractSymbol,err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            if(err.ErrorID===0)
            {
                tradingClient.OnInfo("Market Subscribe "+ contractSymbol+" Successfully.RequestId:"+requestId);
            }else
            {
                let message="Subscribe "+contractSymbol+" Failed,Error Id:"+err.ErrorID+",Error Msg:"+err.Message;
                //没订阅成功是一个策略级别错误
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.StrategyError,message);

                global.AppEventEmitter.emit(EVENT.OnError,error);
            }

            global.AppEventEmitter.emit(EVENT.OnSubscribeContract,contractSymbol,tradingClient.ClientName,err);
        });

        this.MdApi.on("RtnDepthMarketData",function (marketData) {
            /*
            if(global.TickCount===30)
            {
                console.time("NodeQuant-TickToFinishSendOrder");
            }*/

            //行情推送
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let tick={};
            tick.symbol = marketData.InstrumentID;
            tick.exchange = marketData.ExchangeID;

            tick.lastPrice = marketData.LastPrice;          //Tick的最新价

            tick.closePrice = marketData.LastPrice;          //Tick收盘价等于Tick的最新价
            tick.openPrice = marketData.OpenPrice;            //Tick开盘价等于1天的开盘价
            tick.highPrice = marketData.HighestPrice;         //Tick最高价是目前为止的行情的最高价
            tick.lowPrice = marketData.LowestPrice;           //Tick最低价是目前为止的行情的最低价
            tick.preClosePrice = marketData.PreClosePrice;   //Tick前一天的收盘价

            tick.volume = marketData.Volume;
            tick.openInterest = marketData.OpenInterest;

            tick.upperLimit = marketData.UpperLimitPrice;
            tick.lowerLimit = marketData.LowerLimitPrice;

            //自定义数据
            tick.clientName = tradingClient.ClientName;

            //由于存在黄金等跨交易日的品种,所以必须动态设置Tick的交易日!
            tick.date = marketData.TradingDay;
            tick.actionDate=marketData.ActionDay;

            //有可能ctp返回的tradingDay为空
            if(tick.date===undefined || tick.date.length!==8)
            {
                tick.date= global.NodeQuant.MainEngine.TradingDay;
            }

            tick.timeStr =marketData.UpdateTime+'.'+marketData.UpdateMillisec;

            //市场前置登录上,获取统一的交易日
            let year=parseInt(tick.date.substring(0,4));
            let month=parseInt(tick.date.substring(4,6));
            let day=parseInt(tick.date.substring(6,8));

            let hour=parseInt(marketData.UpdateTime.substring(0,2));
            let minute=parseInt(marketData.UpdateTime.substring(3,5));
            let second=parseInt(marketData.UpdateTime.substring(6,8));
            //js Date对象从0开始的月份
            tick.datetime = new Date(year,month-1,day,hour,minute,second,marketData.UpdateMillisec);

            //自然日
            let actionDay=0;
            if(tick.actionDate==="")
            {
                let NightSectionStartTime=new Date(year,month-1,day,16,0,0,0);
                let NightSectionEndTime=new Date(year,month-1,day,23,59,59,999);
                //服务器时间的Tick处于夜盘,自然日要以本地自然日
                if(NightSectionStartTime<tick.datetime && tick.datetime<NightSectionEndTime)
                {
                    tick.datetime.setDate(tick.datetime.getDate()-1);
                    tick.actionDate=tick.datetime.getFullYear()+"-"+(tick.datetime.getMonth()+1)+"-"+tick.datetime.getDate();
                    actionDay=tick.datetime.getDate();
                }else{
                    actionDay=day;
                }
            }else{
                actionDay=parseInt(tick.actionDate.substring(6,8));
            }

            tick.actionDatetime = new Date(year,month-1,actionDay,hour,minute,second,marketData.UpdateMillisec);
            tick.datetime = new Date(year,month-1,day,hour,minute,second,marketData.UpdateMillisec);
            tick.timeStamp=tick.datetime.getTime();
            tick.Id = tick.actionDatetime.getTime();
            //五档价格无效值Double的最大值转换为0
            //五档买价
            tick.bidPrice1 = marketData.BidPrice1===Number.MAX_VALUE?0:marketData.BidPrice1;
            tick.bidVolume1 = marketData.BidVolume1;

            tick.bidPrice2 = marketData.BidPrice2===Number.MAX_VALUE?0:marketData.BidPrice2;
            tick.bidVolume2 = marketData.BidVolume2;

            tick.bidPrice3 = marketData.BidPrice3===Number.MAX_VALUE?0:marketData.BidPrice3;
            tick.bidVolume3 = marketData.BidVolume3;

            tick.bidPrice4 = marketData.BidPrice4===Number.MAX_VALUE?0:marketData.BidPrice4;
            tick.bidVolume4 = marketData.BidVolume4;

            tick.bidPrice5 = marketData.BidPrice5===Number.MAX_VALUE?0:marketData.BidPrice5;
            tick.bidVolume5 = marketData.BidVolume5;

            //五档卖价格
            tick.askPrice1 = marketData.AskPrice1===Number.MAX_VALUE?0:marketData.AskPrice1;
            tick.askVolume1 = marketData.AskVolume1;

            tick.askPrice2 = marketData.AskPrice2===Number.MAX_VALUE?0:marketData.AskPrice2;
            tick.askVolume2 = marketData.AskVolume2;

            tick.askPrice3 = marketData.AskPrice3===Number.MAX_VALUE?0:marketData.AskPrice3;
            tick.askVolume3 = marketData.AskVolume3;

            tick.askPrice4 = marketData.AskPrice4===Number.MAX_VALUE?0:marketData.AskPrice4;
            tick.askVolume4 = marketData.AskVolume4;

            tick.askPrice5 = marketData.AskPrice5===Number.MAX_VALUE?0:marketData.AskPrice5;
            tick.askVolume5 = marketData.AskVolume5;

            tradingClient.OnTick(tick);
        });

        return this.MdApi.subscribeMarketData(contractSymbol);

    }

    unSubscribe(contractName) {
        //曾经订阅
        this.subscribedContractSymbolDic[contractName]=null;

        //登录成功才可以取消订阅
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="UnSubscribe "+contractName+" Failed,Error: Market Font have not Login";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.MdApi.on("RspUnSubMarketData",function (contractName,err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err.ErrorID===0)
            {
                tradingClient.OnInfo("Market UnSubscribe "+ contractName+" Successfully.RequestId:"+requestId);
            }else
            {
                err.ErrorMsg="UnSubscribe "+contractName+" Failed,ErrorId:"+err.ErrorID+",ErrorMsg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
            global.AppEventEmitter.emit(EVENT.OnUnSubscribeContract,contractName,err);
        });

        return this.MdApi.unSubscribeMarketData(contractName);
    }

    getTradingDay() {

        if(this.isLogined)
        {
            return this.MdApi.getTradingDay();
        }
        else
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="GetTradingDay Failed,Error: Market Font have not Login";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            tradingClient.OnError(error);

            return undefined;
        }
    }

    exit() {
        this.subscribedContractSymbolDic={};
        this.isConnected=false;
        this.isLogined=false;
        this.MdApi.exit();

        //清空pointer
        this.MdApi=null;
    }
}

class TdClient{

    constructor(userID,password,brokerID,address,authCode,userProductInfo){

        this.userID=userID;
        this.password=password;
        this.brokerID=brokerID;
        this.address=address;

        this.TdApi = TradingClientSingleton.CreateTdApi();
        this.isConnected=false;
        this.isLogined=false;
        this.isGetAllContract=false;

        this.orderRefID = 0;  //报单引用ID,必须是阿拉伯数字字符,数字要递增

        //持仓的缓存
        this.posDic={};


        //本来SendOrder Callbacks是放在sendOrder函数中,这里牺牲可读性,提前绑定发送订单事件，可以优化增加下单速度
        ///////////////////////////////////SendOrder Callbacks////////////////////////////////////////////////
        ///报单录入错误信息响应
        //交易核心对收到的交易序列报文做合法性检查，检查出错误的交易申请报文后就会返回给交易前置一个
        //包含错误信息的报单响应报文，交易前置立即将该报文信息转发给交易终端。
        this.TdApi.on("RspOrderInsert",function (response,error,requestId,isLast) {

            //订单被拒绝,不算错误,只是订单的一个状态
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            let order = {};
            order.clientName = tradingClient.ClientName;
            order.symbol = response.InstrumentID;
            order.exchange = response.ExchangeID;
            order.userID=response.InvestorID;
            order.orderSysID=response.OrderSysID;
            order.orderID = response.OrderRef;
            order.direction = response.Direction;
            order.offset = response.CombOffsetFlag;
            order.status = OrderStatusType.Canceled;
            order.statusName=OrderStatusReverseType[order.status];
            order.statusMsg = "Rejected";
            order.price = response.LimitPrice;
            order.totalVolume = response.VolumeTotalOriginal;

            tradingClient.OnOrder(order);

        });

        //此接口仅在报单被 CTP 端拒绝时被调用用来进行报错。
        this.TdApi.on("ErrRtnOrderInsert",function (response,error) {

            //订单被拒绝,不算错误,只是订单的一个状态
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            let order = {};
            order.clientName = tradingClient.ClientName;
            order.symbol = response.InstrumentID;
            order.exchange = response.ExchangeID;
            order.userID=response.InvestorID;
            order.orderSysID=response.OrderSysID;
            order.orderID = response.OrderRef;
            order.direction = response.Direction;
            order.offset = response.CombOffsetFlag;
            order.status = OrderStatusType.Canceled;
            order.statusName=OrderStatusReverseType[order.status];
            order.statusMsg = "Rejected";
            order.price = response.LimitPrice;
            order.totalVolume = response.VolumeTotalOriginal;
            tradingClient.OnOrder(order);

        });

        //交易核心向交易所申请该报单插入的申请报文，会被调用多次
        //1.交易所撤销 2.接受该报单时 3.该报单成交时 4.交易所端校验失败OrderStatusMsg
        this.TdApi.on("RtnOrder",function (orderInfo) {

            // ""报单回报"""
            //更新最大报单编号
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let newOrderRefID = parseInt(orderInfo.OrderRef);
            tradingClient.tdClient.orderRefID = Math.max(tradingClient.tdClient.orderRefID, newOrderRefID);

            let order = {};

            order.symbol = orderInfo.InstrumentID;
            //交易所ID
            order.exchange = orderInfo.ExchangeID;
            order.userID=orderInfo.InvestorID;
            order.orderSysID=response.OrderSysID;

            //报单号一致性维护需要基于frontID, sessionID, orderID三个字段
            order.frontID = orderInfo.FrontID;
            order.sessionID = orderInfo.SessionID;
            order.orderID = orderInfo.OrderRef;

            //多空方向
            order.direction = orderInfo.Direction;
            //开平
            order.offset = orderInfo.CombOffsetFlag;
            //订单状态
            order.status = orderInfo.OrderStatus;
            order.statusName = OrderStatusReverseType[order.status];
            order.statusMsg=orderInfo.StatusMsg;

            //价格、报单量
            order.price = orderInfo.LimitPrice;
            order.totalVolume = orderInfo.VolumeTotalOriginal;
            order.tradedVolume = orderInfo.VolumeTraded;

            //时间
            order.orderTime = orderInfo.InsertTime;
            order.cancelTime = orderInfo.CancelTime;

            //自定义Order属性
            order.clientName = tradingClient.ClientName;
            order.strategyOrderID = order.clientName + "." + order.orderID;

            tradingClient.OnOrder(order);

        });

        //交易所中报单成交之后，一个报单回报（OnRtnOrder）和一个成交回报（OnRtnTrade）会被发送到客户端，报单回报
        //中报单的状态为“已成交”。但是仍然建议客户端将成交回报作为报单成交的标志，因为 CTP 的交易核心在收到 OnRtnTrade 之后才会更新该报单的状态。

        this.TdApi.on("RtnTrade",function (tradeInfo) {
            //成交回报
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let trade = {};

            //保存代码和报单号
            trade.symbol = tradeInfo.InstrumentID;
            trade.exchange = tradeInfo.ExchangeID;

            trade.tradeID = tradeInfo.TradeID;
            trade.orderID = tradeInfo.OrderRef;

            //方向
            trade.direction = tradeInfo.Direction;

            //开平
            trade.offset = tradeInfo.OffsetFlag;

            //价格、报单量等数值
            trade.price = tradeInfo.Price;
            trade.volume = tradeInfo.Volume;
            trade.tradingDay=tradeInfo.TradingDay;
            trade.tradeTime = tradeInfo.TradeTime;

            //自定义 Trade属性
            trade.clientName =tradingClient.ClientName;
            trade.strategyOrderID=trade.clientName+"."+ trade.orderID;
            trade.strategyTradeID = trade.clientName+"."+ trade.tradeID;
            trade.directionName=DirectionReverse[trade.direction];
            trade.offsetName=OpenCloseFlagReverseType[trade.offset];

            //转换时间

            let tradeDateTime = DateTimeUtil.StrToDatetime(trade.tradingDay,trade.tradeTime);
            trade.tradingDateTimeStamp = tradeDateTime.getTime();

            tradingClient.OnTrade(trade);
        });
        ///////////////////////////////////SendOrder Callbacks////////////////////////////////////////////////

    }

    exit() {
        this.isConnected = false;
        this.isLogined = false;
        this.isGetAllContract=false;

        this.orderRefID = 0;
        //持仓的缓存
        this.posDic={};

        this.TdApi.exit();

        //清空pointer
        this.TdApi=null;
    }

    connect() {

        this.TdApi.on("FrontConnected",function () {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            tradingClient.OnInfo("Trade Front connected.--> The Login");
            tradingClient.tdClient.isConnected = true;

            //如果断线重新连上,不用等Market Front再次连上再登录Trade Front,因为如果Market Front没有连上,也就没有tick驱动,就不会交易
            tradingClient.tdClient.login();
        });

        this.TdApi.on("FrontDisconnected",function (reasonId) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            tradingClient.tdClient.isConnected = false;
            tradingClient.tdClient.isLogined = false;
            tradingClient.tdClient.isGetAllContract = false;

            //交易前端断线
            let message= "Trader Front Disconnected.";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);

        });

        this.TdApi.on("RspError",function (err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err===undefined)
            {
                err={};
            }

            err.ErrorMsg="Trade Front Respond Error.ErrorId:"+err.ErrorID+",ErrorMsg:"+err.ErrorMsg;
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //tdFlowPath参数是本地流文件生成的目录
        //流文件是行情接口或交易接口在本地生成的流文件，后缀名为.con。流文件中记录着客户端收到的所有的数据流的数量。
        let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

        let tdFlowPath=__dirname+"/"+tradingClient.ClientName+"/tdFlowPath/";
        if(!fs.existsSync(tdFlowPath))
        {
            fs.mkdirSync(tdFlowPath);
        }

        if(this.isConnected===false)
        {
            return this.TdApi.connect(this.address,tdFlowPath);
        }else
        {
            if(this.isLogined === false)
            {
                //如果交易客户端是Connected,说明交易前置没问题
                tradingClient.OnInfo("Trader Font have connected. -->Not Login, Then Login");

                this.login();
            }

            return 0;
        }
    }

    login() {
        //login的回调函数，登录的回调函数
        this.TdApi.on("RspUserLogin",function (response,err,requestId,isLast) {

            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err.ErrorID===0)
            {
                //由于飞鼠win Sgit 4.2只有交易端口的交易日是确定正常的,行情的Tick的TradingDay经常不同交易所有问题,getTradingDay接口也没有维护,所以交易日初始化CTPClient和SgitClient统一在登录成功接口初始化!!!
                global.NodeQuant.MainEngine.TradingDay=response.TradingDay;

                //每次登陆会返回当前的最大报单号
                //下单中的orderref必须在MaxOrderRef基础上12位递增
                if(response.MaxOrderRef!=="")
                {
                    tradingClient.tdClient.orderRefID=parseInt(response.MaxOrderRef);
                }

                tradingClient.OnInfo(tradingClient.ClientName+" Trade Front login successfully");

                tradingClient.tdClient.isLogined = true;

                //登录完成，进行结算单确认
                tradingClient.tdClient.confirmSettlement();

            }else{

                let message="Trader Front Login Failed.Msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.Disconnected,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
        let ret = this.TdApi.login(this.userID,this.password,this.brokerID);
        tradingClient.OnInfo("Trade Front login request sended. Return:"+ret);
    }

    confirmSettlement() {

        this.TdApi.on("RspSettlementInfoConfirm",function (response,err,requestId,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err.ErrorID===0)
            {
                tradingClient.OnInfo("Trade Front confirm settlementInfo successfully. --> Then query all contracts.");
                //查询所有合约
                tradingClient.tdClient.queryContracts();
            }else{

                err.ErrorMsg="Confirm Settlement Failed. Error Id:"+err.ErrorID+"，Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
        let ret = this.TdApi.confirmSettlementInfo(this.userID,this.brokerID);
        tradingClient.OnInfo("Trade Front confirm settlementInfo request sended. Return:"+ret);
    }

    //查询合约
    queryContracts() {

        //没等登录不能查询
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            let message="Query All Contract Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.TdApi.on("RspQryInstrument",function (instrument,err,requestId,isLast) {
            //"""查询合约回应"""
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err!==undefined && err.ErrorID!==0)
            {
                err.ErrorMsg="Query All Contract Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
                return;
            }

            let contract = {};

            contract.symbol = instrument.InstrumentID;
            contract.exchange = instrument.ExchangeID;
            contract.name =instrument.InstrumentName;
            //合约的所属期货名字
            contract.futureName=instrument.ProductID;

            //合约数值
            contract.size = instrument.VolumeMultiple;
            contract.priceTick = instrument.PriceTick;


            contract.productClass = ProductClassReverseType[instrument.ProductClass];

            //期权类型
            if(instrument.ProductClass===ProductClassType.Options)
            {
                if(instrument.OptionsType === '1')
                    contract.optionType = "CALL";
                else(instrument.OptionsType === '2')
                contract.optionType =  "PUT";
            }else
            {
                contract.optionType=undefined;
            }
            //期权执行价
            contract.strikePrice = instrument.StrikePrice;

            //推送
            tradingClient.OnContract(contract);

            if(isLast){
                tradingClient.OnInfo("Trade Front query all contract: Received all contracts.");
                tradingClient.tdClient.isGetAllContract = true;
                global.AppEventEmitter.emit(EVENT.OnReceivedAllContract,tradingClient.ClientName);
            }
        });

        return this.TdApi.queryInstrument();
    }


    //暂时不支持查询账号总持仓,需要查询账号总持仓,请到文华或者其他证券商的交易软件查询
    queryInvestorPosition() {

        //没等登录不能查询
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Query Investor Position Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }


        this.TdApi.on("RspQryInvestorPosition",function (positionInfo,error,requestID,isLast) {
            // """持仓查询回报"""
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(positionInfo.InstrumentID===undefined ||positionInfo.InstrumentID===0 )
            {
                return;
            }

            //获取持仓缓存对象
            //唯一定义一条记录的仓位
            //一个合约的开仓，可能有多条持仓记录
            let posName = positionInfo.InstrumentID+"."+ PosiDirectionReverseType[positionInfo.PosiDirection];

            let pos;
            if(tradingClient.tdClient.posDic.posName===undefined) {
                pos = {};

                pos.clientName = tradingClient.ClientName;
                pos.symbol = positionInfo.InstrumentID;
                pos.direction = positionInfo.PosiDirection;
                pos.positionName = pos.symbol + "." + PosiDirectionReverseType[positionInfo.PosiDirection];
                pos.price=0;
                pos.position=0;
                pos.ydPosition=0;
                pos.positionProfit=0;
                pos.frozen=0;
                tradingClient.tdClient.posDic[posName] = pos;
            }else
            {
                pos=tradingClient.tdClient.posDic[posName];
            }

            //针对上期所持仓的今昨分条返回（有昨仓、无今仓），读取昨仓数据
            //(所以上期所，同一个合约，同一个开仓方向，昨仓和今仓，是返回两条持仓记录)
            //CTP 系统将持仓明细记录按合约，持仓方向，开仓日期（仅针对上期所，区分昨仓、今仓）进行汇总
            //持仓汇总记录中：
            //YdPosition 表示昨日收盘时持仓数量（≠ 当前的昨仓数量，静态，日间不随着开平仓而变化）
            //Position 表示当前持仓数量
            //TodayPosition 表示今新开仓
            //当前的昨仓数量 = ∑Position - ∑TodayPosition
            if(positionInfo.YdPosition && (positionInfo.TodayPosition===undefined || positionInfo.TodayPosition===0))
            {
                pos.ydPosition = positionInfo.Position;
            }

            //计算成本
            let cost = pos.price * pos.position;

            //汇总总仓
            pos.position += positionInfo.Position;
            pos.positionProfit += positionInfo.PositionProfit;

            //计算持仓均价
            if(pos.position>0)
            {
                pos.price = (cost + positionInfo.PositionCost) / pos.position;
            }

            //读取冻结
            if(pos.direction ==="0")
            {
                pos.frozen += positionInfo.LongFrozen;
            } else{
                pos.frozen += positionInfo.ShortFrozen;
            }

            //查询回报结束
            if(isLast)
            {
                tradingClient.OnPosition(tradingClient.tdClient.posDic);
            }

            //清空缓存
            tradingClient.tdClient.posDic={};
        });

        return this.TdApi.queryInvestorPosition(this.userID,this.brokerID);

    }

    queryTradingAccount() {

        //没等登录不能查询
        if(this.isLogined===false) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Query Trading Account Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.TdApi.on("RspQryTradingAccount",function (tradingAccountInfo,err,requestID,isLast) {
            // """账户查询回报"""
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err!==undefined && err.ErrorID!==0)
            {
                err.ErrorMsg="Query Trading Account Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }

            if(tradingAccountInfo)
            {
                //设置客户端名字
                tradingAccountInfo.clientName = tradingClient.ClientName;
                tradingAccountInfo.queryId = tradingAccountInfo.clientName+requestID;
            }

            tradingClient.OnQueryTradingAccount(tradingAccountInfo);
        });

        return this.TdApi.queryTradingAccount(this.userID,this.brokerID);
    }

    queryCommissionRate(contractSymbol)
    {

        //没等登录不能查询
        if(this.isLogined===false) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Query CommissionRate Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.TdApi.on("RspQryInstrumentCommissionRate",function (CommissionRateInfo,err,requestID,isLast) {
            // 查询回报
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err!==undefined && err.ErrorID!==0)
            {
                err.ErrorMsg="Query CommissionRate Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }

            if(CommissionRateInfo)
            {
                //设置客户端名字
                CommissionRateInfo.clientName = tradingClient.ClientName;
            }

            tradingClient.OnQueryCommissionRate(CommissionRateInfo);
        });

        return this.TdApi.queryCommissionRate(this.userID,this.brokerID,contractSymbol);
    }

    /*
    queryDeferFeeRate(contractSymbol)
    {

        //没等登录不能查询
        if(this.isLogined===false) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Query DeferFeeRate Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        this.TdApi.on("RspQryDeferFeeRate",function (DeferFeeRateInfo,err,requestID,isLast) {
            //查询回报
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;
            if(err!==undefined && err.ErrorID!==0)
            {
                err.ErrorMsg="Query DeferFeeRate Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }

            if(DeferFeeRateInfo)
            {
                //设置客户端名字
                DeferFeeRateInfo.clientName = tradingClient.ClientName;
            }

            tradingClient.OnQueryDeferFeeRate(DeferFeeRateInfo);
        });

        return this.TdApi.queryDeferFeeRate(contractSymbol);
    }*/

    sendOrder(orderReq) {
        //没登录不能下订单
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Send Order Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        //订单号增加
        this.orderRefID+=1;

        let sendOrderReq={};
        sendOrderReq.BrokerID=this.brokerID;
        sendOrderReq.InvestorID=this.userID;
        sendOrderReq.InstrumentID=orderReq.InstrumentID;
        sendOrderReq.OrderRef=this.get12OrderRefIDStr(""+this.orderRefID);
        sendOrderReq.UserID=this.userID;
        sendOrderReq.OrderPriceType=orderReq.OrderPriceType;
        sendOrderReq.Direction=orderReq.Direction;
        sendOrderReq.CombOffsetFlag=orderReq.CombOffsetFlag;

        sendOrderReq.CombHedgeFlag=HedgeFlagType.Speculation;
        sendOrderReq.LimitPrice=orderReq.LimitPrice;
        sendOrderReq.VolumeTotalOriginal=orderReq.VolumeTotalOriginal;
        sendOrderReq.TimeCondition=orderReq.TimeCondition;
        sendOrderReq.VolumeCondition=orderReq.VolumeCondition;
        sendOrderReq.ContingentCondition=orderReq.ContingentCondition;
        sendOrderReq.StopPrice = orderReq.StopPrice;
        sendOrderReq.ForceCloseReason= ForceCloseReasonType.NotForceClose;
        sendOrderReq.MinVolume=1;
        sendOrderReq.IsAutoSuspend=0;
        sendOrderReq.UserForceClose=0;


        return this.TdApi.sendOrder(sendOrderReq);

    }

    get12OrderRefIDStr(orderRefIDStr)
    {
        if(orderRefIDStr.length<12)
        {
           let zeroStr="";
           let zeroStrLen=12-orderRefIDStr.length;
           for(let i=0;i<zeroStrLen;i++)
           {
               zeroStr+="0";
           }

            let _12OrderRefIDStr=zeroStr+orderRefIDStr;

           return _12OrderRefIDStr;
        }

        return orderRefIDStr;
    }

    //撤单
    cancelOrder(req) {

        //没登录不能撤订单
        if(this.isLogined===false)
        {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            let message="Cancel Order Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }


        //撤单响应。交易核心返回的含有错误信息的撤单响应
        this.TdApi.on("RspOrderAction",function (response,err,requestID,isLast) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err===undefined)
            {
                err = {};
            }

            err.ErrorMsg="Cancel Order Failed. Error:Order Action Invalide";

            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //交易所会再次验证撤单指令的合法性，如果交易所认为该指令不合法，交易核心通过此函数转发交易所给出的错误。
        this.TdApi.on("ErrRtnOrderAction",function (response,err) {
            let tradingClient=global.NodeQuant.MainEngine.clientDic.Sgit;

            if(err===undefined)
            {
                err = {};
            }

            err.ErrorMsg="Cancel Order Failed. Error:Order Action Return Error";
            let error=new NodeQuantError(tradingClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        return this.TdApi.cancelOrder(req);
    }

}


module.exports = TradingClient;