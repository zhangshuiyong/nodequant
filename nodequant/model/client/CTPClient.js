/**
 * Created by Administrator on 2017/6/8.
 */
let fs = require("fs");
require("../../common.js");
require("../../userConfig.js");

let NodeAddOnPath="./CTP/"+process.platform+"/"+process.arch+"/NodeQuant.node";
console.log("CTP Node Addon Path:"+NodeAddOnPath);
let CTP= require(NodeAddOnPath);


let DateTimeUtil=require("../../util/DateTimeUtil");
let NodeQuantError=require("../../util/NodeQuantError");
let NodeQuantLog=require("../../util/NodeQuantLog");

class ctpClient{

    constructor(clientName){

        this.ClientName=clientName;

        this.userID= ClientConfig[this.ClientName].userID;
        this.password= ClientConfig[this.ClientName].password;
        this.brokerID= ClientConfig[this.ClientName].brokerID;
        this.mdAddress= ClientConfig[this.ClientName].mdAddress;
        this.tdAddress= ClientConfig[this.ClientName].tdAddress;

        this.mdClient = new ctpMdClient(this,this.userID,this.password,this.brokerID,this.mdAddress);
        this.tdClient=new ctpTdClient(this,this.userID,this.password,this.brokerID,this.tdAddress);
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
    }

    Connect() {
        //创建行情和交易接口对象
        //先登录行情接口，行情接口连接上，再登录
        let ret = this.mdClient.connect();
        if(ret!=0)
        {
            let message="启动连接"+this.ClientName+"的mdClient失败.错误号:"+ret;
            let error=new NodeQuantError(this.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        }

        ret = this.tdClient.connect();

        if(ret!=0)
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
        let ctpClient=this;

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
        let ctpClient=this;
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
        let ctpClient=this;
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
        let ctpClient=this;
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
        let ctpClient=this;
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
        let ctpClient=this;
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

    //////////////////////////////////////////////响应函数/////////////////////////////////////////////////////////

    OnQueryTradingAccount(tradingAccountInfo)
    {
        global.AppEventEmitter.emit(EVENT.OnQueryTradingAccount,tradingAccountInfo);
    }

    OnQueryCommissionRate(commissionRateInfo)
    {
        global.AppEventEmitter.emit(EVENT.OnQueryCommissionRate,commissionRateInfo);
    }

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


class ctpMdClient{

    constructor(ctpClient,userID,password,brokerID,address){
        this.ctpClient=ctpClient;
        this.userID=userID;
        this.password=password;
        this.brokerID=brokerID;
        this.address=address;

        this.ctpMdApi = CTP.CreateMdApi();

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
        let ctpMdClient=this;
        ctpMdClient.ctpMdApi.on("FrontConnected",function () {
            ctpMdClient.ctpClient.OnInfo("Market Front connected. --> Then Login");

            ctpMdClient.isConnected = true;

            //FrontConnected事件都要重新登录,前面是connect或者FrontDisconnected
            ctpMdClient.login();
        });

        ctpMdClient.ctpMdApi.on("FrontDisconnected", function (reasonId) {
            ctpMdClient.isConnected = false;
            ctpMdClient.isLogined = false;

            //市场行情接口没有连接上
            let message= "Market Front Disconnected.";
            let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);

        });

        ctpMdClient.ctpMdApi.on("RspError",function (err,requestId,isLast) {
            if(err==undefined)
            {
                err={};
            }

            err.ErrorMsg="Market Front Response Error. ErrorId:"+err.ErrorID+",ErrorMsg:"+err.Message;
            let error = new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.ClientRspError, err.ErrorMsg);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //mdFlowPath参数是本地流文件生成的目录
        //流文件是行情接口或交易接口在本地生成的流文件，后缀名为.con。流文件中记录着客户端收到的所有的数据流的数量。
        let mdFlowPath=__dirname+"/"+ctpMdClient.ctpClient.ClientName+"/mdFlowPath/";
        if(!fs.existsSync(mdFlowPath))
        {
            fs.mkdirSync(mdFlowPath);
        }

        if(ctpMdClient.isConnected==false)
        {
            return ctpMdClient.ctpMdApi.connect(this.address,mdFlowPath);
        }else
        {
            if(ctpMdClient.isLogined==false)
            {
                ctpMdClient.ctpClient.OnInfo("Market Fornt have connected. -->Not Login --> Then Login");

                ctpMdClient.login();
            }else
            {
                ctpMdClient.ctpClient.OnInfo("Market Fornt have connected. --> And have Logined");
            }

            return 0;
        }
    }


    login() {
        let ctpMdClient=this;

        //login的回调函数，先绑定登录的回调函数，再调用主动函数
        ctpMdClient.ctpMdApi.on("RspUserLogin",function (response,err,requestId,isLast) {

            if(err.ErrorID==0)
            {
                ctpMdClient.ctpClient.OnInfo("Market Front login successfully");

                ctpMdClient.isLogined=true;

                //登录成功才认为市场行情已经连接
                ctpMdClient.ctpClient.isMdConnected=true;

                //重新登录成功，重新订阅
                for(let contractSymbol in ctpMdClient.subscribedContractSymbolDic)
                {
                    ctpMdClient.subscribe(contractSymbol);
                }

            }else{
                //行情接口登录失败
                let message="Market Front Login Failed.";
                let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.StrategyError,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let ret = ctpMdClient.ctpMdApi.login(this.userID,this.password,this.brokerID);
        ctpMdClient.ctpClient.OnInfo("Market Front login request sended. return:"+ret);
    }

    subscribe(contractSymbol) {
        let ctpMdClient=this;

        //曾经订阅
        this.subscribedContractSymbolDic[contractSymbol]=contractSymbol;

        //登录成功才可以订阅
        if(ctpMdClient.isLogined==false)
        {

            let message="Subscribe "+contractSymbol+" Failed,Error: Market Front have not Login";
            let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        ctpMdClient.ctpMdApi.on("RspSubMarketData",function (contractSymbol,err,requestId,isLast) {

            if(err.ErrorID==0)
            {
                ctpMdClient.ctpClient.OnInfo("Market Subscribe "+ contractSymbol+" Successfully.RequestId:"+requestId);
            }else
            {
                let message="Subscribe "+contractSymbol+" Failed,Error Id:"+err.ErrorID+",Error Msg:"+err.Message;
                //没订阅成功是一个策略级别错误
                let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.StrategyError,message);

                global.AppEventEmitter.emit(EVENT.OnError,error);
            }

            global.AppEventEmitter.emit(EVENT.OnSubscribeContract,contractSymbol,ctpMdClient.ctpClient.ClientName,err);
        });

        ctpMdClient.ctpMdApi.on("RtnDepthMarketData",function (marketData) {
            //行情推送
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
            tick.clientName = ctpMdClient.ctpClient.ClientName;

            //由于存在黄金等跨交易日的品种,所以必须动态设置Tick的交易日!
            tick.date = marketData.TradingDay;
            tick.actionDate=marketData.ActionDay;

            //有可能ctp返回的tradingDay为空
            if(tick.date=="")
            {
                tick.date= ctpMdClient.getTradingDay();
            }

            tick.time =marketData.UpdateTime+'.'+marketData.UpdateMillisec;

            //市场前置登录上,获取统一的交易日
            let year=parseInt(tick.date.substring(0,4));
            let month=parseInt(tick.date.substring(4,6));
            let day=parseInt(tick.date.substring(6,8));

            //自然日
            let actionDay=parseInt(tick.actionDate.substring(6,8));

            let hour=parseInt(marketData.UpdateTime.substring(0,2));
            let minute=parseInt(marketData.UpdateTime.substring(3,5));
            let second=parseInt(marketData.UpdateTime.substring(6,8));
            //js Date对象从0开始的月份
            tick.datetime = new Date(year,month-1,day,hour,minute,second,marketData.UpdateMillisec);
            tick.actionDatetime = new Date(year,month-1,actionDay,hour,minute,second,marketData.UpdateMillisec);
            tick.timeStamp=tick.datetime.getTime();
            tick.Id = tick.actionDatetime.getTime();
            //五档价格无效值Double的最大值转换为0
            //五档买价
            tick.bidPrice1 = marketData.BidPrice1==Number.MAX_VALUE?0:marketData.BidPrice1;
            tick.bidVolume1 = marketData.BidVolume1;

            tick.bidPrice2 = marketData.BidPrice2==Number.MAX_VALUE?0:marketData.BidPrice2;
            tick.bidVolume2 = marketData.BidVolume2;

            tick.bidPrice3 = marketData.BidPrice3==Number.MAX_VALUE?0:marketData.BidPrice3;
            tick.bidVolume3 = marketData.BidVolume3;

            tick.bidPrice4 = marketData.BidPrice4==Number.MAX_VALUE?0:marketData.BidPrice4;
            tick.bidVolume4 = marketData.BidVolume4;

            tick.bidPrice5 = marketData.BidPrice5==Number.MAX_VALUE?0:marketData.BidPrice5;
            tick.bidVolume5 = marketData.BidVolume5;

            //五档卖价格
            tick.askPrice1 = marketData.AskPrice1==Number.MAX_VALUE?0:marketData.AskPrice1;
            tick.askVolume1 = marketData.AskVolume1;

            tick.askPrice2 = marketData.AskPrice2==Number.MAX_VALUE?0:marketData.AskPrice2;
            tick.askVolume2 = marketData.AskVolume2;

            tick.askPrice3 = marketData.AskPrice3==Number.MAX_VALUE?0:marketData.AskPrice3;
            tick.askVolume3 = marketData.AskVolume3;

            tick.askPrice4 = marketData.AskPrice4==Number.MAX_VALUE?0:marketData.AskPrice4;
            tick.askVolume4 = marketData.AskVolume4;

            tick.askPrice5 = marketData.AskPrice5==Number.MAX_VALUE?0:marketData.AskPrice5;
            tick.askVolume5 = marketData.AskVolume5;

            ctpMdClient.ctpClient.OnTick(tick);
        });

        return ctpMdClient.ctpMdApi.subscribeMarketData(contractSymbol);

    }

    unSubscribe(contractName) {
        let ctpMdClient=this;
        //曾经订阅
        delete this.subscribedContractSymbolDic[contractName];

        //登录成功才可以取消订阅
        if(ctpMdClient.isLogined==false)
        {
            let message="UnSubscribe "+contractName+" Failed,Error: Market Font have not Login";
            let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        ctpMdClient.ctpMdApi.on("RspUnSubMarketData",function (contractName,err,requestId,isLast) {
            if(err.ErrorID==0)
            {
                ctpMdClient.ctpClient.OnInfo("Market UnSubscribe "+ contractName+" Successfully.RequestId:"+requestId);
            }else
            {
                err.ErrorMsg="UnSubscribe "+contractName+" Failed,ErrorId:"+err.ErrorID+",ErrorMsg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
            global.AppEventEmitter.emit(EVENT.OnUnSubscribeContract,contractName,err);
        });

        return ctpMdClient.ctpMdApi.unSubscribeMarketData(contractName);
    }

    getTradingDay() {
        let ctpMdClient=this;
        if(ctpMdClient.isLogined)
        {
            return ctpMdClient.ctpMdApi.getTradingDay();
        }
        else
        {
            let message="GetTradingDay Failed,Error: Market Font have not Login";
            let error=new NodeQuantError(ctpMdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            this.ctpClient.OnError(error);

            return undefined;
        }
    }

    exit() {
        this.subscribedContractSymbolDic={};
        this.isConnected=false;
        this.isLogined=false;
        this.ctpMdApi.exit();
    }
}

class ctpTdClient{

    constructor(ctpClient,userID,password,brokerID,address,authCode,userProductInfo){

        this.ctpClient=ctpClient;
        this.userID=userID;
        this.password=password;
        this.brokerID=brokerID;
        this.address=address;

        this.ctpTdApi = CTP.CreateTdApi();
        this.isConnected=false;
        this.isLogined=false;
        this.isGetAllContract=false;

        this.orderRefID = 0;  //报单引用ID,必须是阿拉伯数字字符,数字要递增

        //持仓的缓存
        this.posDic={};
    }

    exit() {
        this.isConnected = false;
        this.isLogined = false;
        this.isGetAllContract=false;

        this.orderRefID = 0;
        //持仓的缓存
        this.posDic={};

        this.ctpTdApi.exit();
    }

    connect() {

        let ctpTdClient=this;

        ctpTdClient.ctpTdApi.on("FrontConnected",function () {

            ctpTdClient.ctpClient.OnInfo("Trade Front connected.--> The Login");
            ctpTdClient.isConnected = true;

            //如果断线重新连上,不用等Market Front再次连上再登录Trade Front,因为如果Market Front没有连上,也就没有tick驱动,就不会交易
            ctpTdClient.login();
        });

        ctpTdClient.ctpTdApi.on("FrontDisconnected",function (reasonId) {
            ctpTdClient.isConnected = false;
            ctpTdClient.isLogined = false;
            ctpTdClient.isGetAllContract = false;

            //交易前端断线
            let message= "Trader Front Disconnected.";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.Disconnected,message);
            global.AppEventEmitter.emit(EVENT.OnError,error);

        });

        ctpTdClient.ctpTdApi.on("RspError",function (err,requestId,isLast) {
            if(err==undefined)
            {
                err={};
            }

            err.ErrorMsg="Trade Front Respond Error.ErrorId:"+err.ErrorID+",ErrorMsg:"+err.ErrorMsg;
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //tdFlowPath参数是本地流文件生成的目录
        //流文件是行情接口或交易接口在本地生成的流文件，后缀名为.con。流文件中记录着客户端收到的所有的数据流的数量。
        let tdFlowPath=__dirname+"/"+ctpTdClient.ctpClient.ClientName+"/tdFlowPath/";
        if(!fs.existsSync(tdFlowPath))
        {
            fs.mkdirSync(tdFlowPath);
        }

        if(ctpTdClient.isConnected==false)
        {
            return ctpTdClient.ctpTdApi.connect(this.address,tdFlowPath);
        }else
        {
            if(ctpTdClient.isLogined == false)
            {
                //如果交易客户端是Connected,说明交易前置没问题
                ctpTdClient.ctpClient.OnInfo("Trader Font have connected. -->Not Login, Then Login");

                ctpTdClient.login();
            }

            return 0;
        }
    }

    login() {
        let ctpTdClient=this;
        //login的回调函数，登录的回调函数
        ctpTdClient.ctpTdApi.on("RspUserLogin",function (response,err,requestId,isLast) {

            if(err.ErrorID==0)
            {
                ctpTdClient.ctpClient.OnInfo(ctpTdClient.ctpClient.ClientName+" Trade Front login successfully");

                ctpTdClient.isLogined = true;

                //登录完成，进行结算单确认
                ctpTdClient.confirmSettlement();

            }else{

                let message="Trader Front Login Failed.Msg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.Disconnected,message);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let ret = ctpTdClient.ctpTdApi.login(this.userID,this.password,this.brokerID);
        ctpTdClient.ctpClient.OnInfo("Trade Front login request sended. Return:"+ret);
    }

    confirmSettlement() {
        let ctpTdClient=this;
        ctpTdClient.ctpTdApi.on("RspSettlementInfoConfirm",function (response,err,requestId,isLast) {
            if(err.ErrorID==0)
            {
                ctpTdClient.ctpClient.OnInfo("Trade Front confirm settlementInfo successfully. --> Then query all contracts.");
                //查询所有合约
                ctpTdClient.queryContracts();
            }else{

                err.ErrorMsg="Confirm Settlement Failed. Error Id:"+err.ErrorID+"，Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);
            }
        });

        let ret = ctpTdClient.ctpTdApi.confirmSettlementInfo(this.userID,this.brokerID);
        ctpTdClient.ctpClient.OnInfo("Trade Front confirm settlementInfo request sended. Return:"+ret);
    }

    //查询合约
    queryContracts() {

        let ctpTdClient=this;

        //没等登录不能查询
        if(ctpTdClient.isLogined==false)
        {

            let message="Query All Contract Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        ctpTdClient.ctpTdApi.on("RspQryInstrument",function (instrument,err,requestId,isLast) {
            //"""查询合约回应"""
            if(err!=undefined && err.ErrorID!=0)
            {
                err.ErrorMsg="Query All Contract Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
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
            if(instrument.ProductClass==ProductClassType.Options)
            {
                if(instrument.OptionsType == '1')
                    contract.optionType = "CALL";
                else(instrument.OptionsType == '2')
                contract.optionType =  "PUT";
            }else
            {
                contract.optionType=undefined;
            }
            //期权执行价
            contract.strikePrice = instrument.StrikePrice;

            //推送
            ctpTdClient.ctpClient.OnContract(contract);

            if(isLast){
                ctpTdClient.ctpClient.OnInfo("Trade Front query all contract: Received all contracts.");
                ctpTdClient.isGetAllContract = true;
                global.AppEventEmitter.emit(EVENT.OnReceivedAllContract,ctpTdClient.ctpClient.ClientName);
            }
        });

        return ctpTdClient.ctpTdApi.queryInstrument();
    }


    //暂时不支持查询账号总持仓,需要查询账号总持仓,请到文华或者其他证券商的交易软件查询
    queryInvestorPosition() {

        let ctpTdClient=this;

        //没等登录不能查询
        if(ctpTdClient.isLogined==false)
        {

            let message="Query Investor Position Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }


        ctpTdClient.ctpTdApi.on("RspQryInvestorPosition",function (positionInfo,error,requestID,isLast) {
            // """持仓查询回报"""
            if(positionInfo.InstrumentID==undefined ||positionInfo.InstrumentID==0 )
            {
                return;
            }

            //获取持仓缓存对象
            //唯一定义一条记录的仓位
            //一个合约的开仓，可能有多条持仓记录
            let posName = positionInfo.InstrumentID+"."+ PosiDirectionReverseType[positionInfo.PosiDirection];

            let pos;
            if(ctpTdClient.posDic.posName==undefined) {
                pos = {};

                pos.clientName = ctpTdClient.ctpClient.ClientName;
                pos.symbol = positionInfo.InstrumentID;
                pos.direction = positionInfo.PosiDirection;
                pos.positionName = pos.symbol + "." + PosiDirectionReverseType[positionInfo.PosiDirection];
                pos.price=0;
                pos.position=0;
                pos.ydPosition=0;
                pos.positionProfit=0;
                pos.frozen=0;
                ctpTdClient.posDic[posName] = pos;
            }else
            {
                pos=ctpTdClient.posDic[posName];
            }

            //针对上期所持仓的今昨分条返回（有昨仓、无今仓），读取昨仓数据
            //(所以上期所，同一个合约，同一个开仓方向，昨仓和今仓，是返回两条持仓记录)
            //CTP 系统将持仓明细记录按合约，持仓方向，开仓日期（仅针对上期所，区分昨仓、今仓）进行汇总
            //持仓汇总记录中：
            //YdPosition 表示昨日收盘时持仓数量（≠ 当前的昨仓数量，静态，日间不随着开平仓而变化）
            //Position 表示当前持仓数量
            //TodayPosition 表示今新开仓
            //当前的昨仓数量 = ∑Position - ∑TodayPosition
            if(positionInfo.YdPosition && (positionInfo.TodayPosition==undefined || positionInfo.TodayPosition==0))
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
            if(pos.direction =="0")
            {
                pos.frozen += positionInfo.LongFrozen;
            } else{
                pos.frozen += positionInfo.ShortFrozen;
            }

            //查询回报结束
            if(isLast)
            {
                ctpTdClient.ctpClient.OnPosition(ctpTdClient.posDic);
            }

            //清空缓存
            ctpTdClient.posDic={};
        });

        return ctpTdClient.ctpTdApi.queryInvestorPosition(this.userID,this.brokerID);

    }

    queryTradingAccount() {
        let ctpTdClient=this;

        //没等登录不能查询
        if(ctpTdClient.isLogined==false) {
            let message="Query Trading Account Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }


        ctpTdClient.ctpTdApi.on("RspQryTradingAccount",function (tradingAccountInfo,err,requestID,isLast) {
            // """账户查询回报"""
            if(err!=undefined && err.ErrorID!=0)
            {
                err.ErrorMsg="Query Trading Account Failed. Error Id:"+error.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);

            }

            if(tradingAccountInfo)
            {
                //设置客户端名字
                tradingAccountInfo.clientName = ctpTdClient.ctpClient.ClientName;
                tradingAccountInfo.queryId = tradingAccountInfo.clientName+requestID;
            }

            ctpTdClient.ctpClient.OnQueryTradingAccount(tradingAccountInfo);
        });

        return ctpTdClient.ctpTdApi.queryTradingAccount(ctpTdClient.userID,ctpTdClient.brokerID);
    }


    queryCommissionRate(contractSymbol)
    {
        let ctpTdClient=this;

        //没等登录不能查询
        if(ctpTdClient.isLogined==false) {
            let message="Query CommissionRate Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(TdClient.tradingClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        ctpTdClient.ctpTdApi.on("RspQryInstrumentCommissionRate",function (CommissionRateInfo,err,requestID,isLast) {
            // 查询回报
            if(err!=undefined && err.ErrorID!=0)
            {
                err.ErrorMsg="Query CommissionRate Failed. Error Id:"+err.ErrorID+",Error msg:"+err.ErrorMsg;
                let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);
                global.AppEventEmitter.emit(EVENT.OnError,error);


            }

            if(CommissionRateInfo)
            {
                //设置客户端名字
                CommissionRateInfo.clientName = ctpTdClient.ctpClient.ClientName;
            }

            ctpTdClient.ctpClient.OnQueryCommissionRate(CommissionRateInfo);
        });

        return ctpTdClient.ctpTdApi.queryCommissionRate(ctpTdClient.userID,ctpTdClient.brokerID,contractSymbol);
    }

    sendOrder(orderReq) {
        let ctpTdClient=this;
        //没登录不能下订单
        if(ctpTdClient.isLogined==false)
        {
            let message="Send Order Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }

        ///报单录入错误信息响应
        //交易核心对收到的交易序列报文做合法性检查，检查出错误的交易申请报文后就会返回给交易前置一个
        //包含错误信息的报单响应报文，交易前置立即将该报文信息转发给交易终端。
        ctpTdClient.ctpTdApi.on("RspOrderInsert",function (response,error,requestId,isLast) {

            //订单被拒绝,不算错误,只是订单的一个状态

            let order = {};
            order.clientName = ctpTdClient.ctpClient.ClientName;
            order.symbol = response.InstrumentID;
            order.exchange = response.ExchangeID;
            order.vtSymbol = order.symbol;
            order.orderID = response.OrderRef;
            order.vtOrderID = ctpTdClient.ctpClient.Name + order.orderID;
            order.direction = response.Direction;
            order.offset = response.CombOffsetFlag;
            order.status = OrderStatusType.Canceled;
            order.statusName=OrderStatusReverseType[order.status];
            order.statusMsg = "Rejected";
            order.price = response.LimitPrice;
            order.totalVolume = response.VolumeTotalOriginal;

            ctpTdClient.ctpClient.OnOrder(order);

        });

        //此接口仅在报单被 CTP 端拒绝时被调用用来进行报错。
        ctpTdClient.ctpTdApi.on("ErrRtnOrderInsert",function (response,error) {

            //订单被拒绝,不算错误,只是订单的一个状态

            let order = {};
            order.clientName = ctpTdClient.ctpClient.ClientName;
            order.symbol = response.InstrumentID;
            order.exchange = response.ExchangeID;
            order.vtSymbol = order.symbol
            order.orderID = response.OrderRef;
            order.vtOrderID = order.clientName + "." + order.orderID;
            order.direction = response.Direction;
            order.offset = response.CombOffsetFlag;
            order.status = OrderStatusType.Canceled;
            order.statusName=OrderStatusReverseType[order.status];
            order.statusMsg = "Rejected";
            order.price = response.LimitPrice;
            order.totalVolume = response.VolumeTotalOriginal;
            ctpTdClient.ctpClient.OnOrder(order);

        });

        //交易核心向交易所申请该报单插入的申请报文，会被调用多次
        //1.交易所撤销 2.接受该报单时 3.该报单成交时 4.交易所端校验失败OrderStatusMsg
        //获取有用的order数据
        ctpTdClient.ctpTdApi.on("RtnOrder",function (orderInfo) {

            // ""报单回报"""
            //更新最大报单编号
            let newOrderRefID = parseInt(orderInfo.OrderRef);
            ctpTdClient.orderRefID = Math.max(ctpTdClient.orderRefID, newOrderRefID);

            let order = {};

            //CTP Order属性
            order.symbol = orderInfo.InstrumentID;
            //交易所ID
            order.exchange = orderInfo.ExchangeID;

            //CTP的报单号一致性维护需要基于frontID, sessionID, orderID三个字段
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
            order.clientName = ctpTdClient.ctpClient.ClientName;
            order.strategyOrderID = order.clientName + "." + order.orderID;

            ctpTdClient.ctpClient.OnOrder(order);

        });

        //交易所中报单成交之后，一个报单回报（OnRtnOrder）和一个成交回报（OnRtnTrade）会被发送到客户端，报单回报
        //中报单的状态为“已成交”。但是仍然建议客户端将成交回报作为报单成交的标志，因为 CTP 的交易核心在收到 OnRtnTrade 之后才会更新该报单的状态。

        ctpTdClient.ctpTdApi.on("RtnTrade",function (tradeInfo) {
            //成交回报
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
            trade.clientName =ctpTdClient.ctpClient.ClientName;
            trade.strategyOrderID=trade.clientName+"."+ trade.orderID;
            trade.strategyTradeID = trade.clientName+"."+ trade.tradeID;
            trade.directionName=DirectionReverse[trade.direction];
            trade.offsetName=OpenCloseFlagReverseType[trade.offset];

            //转换时间

            let tradeDateTime = DateTimeUtil.StrToDatetime(trade.tradingDay,trade.tradeTime);
            trade.tradingDateTimeStamp = tradeDateTime.getTime();

            ctpTdClient.ctpClient.OnTrade(trade);
        });

        //订单号增加
        ctpTdClient.orderRefID+=1;

        let sendOrderReq={};
        sendOrderReq.BrokerID=this.brokerID;
        sendOrderReq.InvestorID=this.userID;
        sendOrderReq.InstrumentID=orderReq.InstrumentID;
        sendOrderReq.OrderRef=""+ctpTdClient.orderRefID;
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


        return ctpTdClient.ctpTdApi.sendOrder(sendOrderReq);

    }

    //撤单
    cancelOrder(req) {

        let ctpTdClient=this;

        //没登录不能撤订单
        if(ctpTdClient.isLogined==false)
        {
            let message="Cancel Order Failed. Error:Trade Front have not logined";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.OperationAfterDisconnected,message);

            global.AppEventEmitter.emit(EVENT.OnError,error);

            return -99;
        }


        //撤单响应。交易核心返回的含有错误信息的撤单响应
        ctpTdClient.ctpTdApi.on("RspOrderAction",function (response,err,requestID,isLast) {

            if(err==undefined)
            {
                err = {};
            }

            err.ErrorMsg="Cancel Order Failed. Error:Order Action Invalide";

            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        //交易所会再次验证撤单指令的合法性，如果交易所认为该指令不合法，交易核心通过此函数转发交易所给出的错误。
        ctpTdClient.ctpTdApi.on("ErrRtnOrderAction",function (response,err) {
            if(err==undefined)
            {
                err = {};
            }

            err.ErrorMsg="Cancel Order Failed. Error:Order Action Return Error";
            let error=new NodeQuantError(ctpTdClient.ctpClient.ClientName,ErrorType.ClientRspError,err.ErrorMsg);

            global.AppEventEmitter.emit(EVENT.OnError,error);
        });

        return ctpTdClient.ctpTdApi.cancelOrder(req);
    }

}


module.exports = ctpClient;