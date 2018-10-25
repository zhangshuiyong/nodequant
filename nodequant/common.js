/**
 * Created by Administrator on 2017/5/21.
 */



/////////////////////////////////////////////////////////////////////////
///TFtdcDirectionType是一个买卖方向类型
/////////////////////////////////////////////////////////////////////////
///买
//#define THOST_FTDC_D_Buy '0'
///卖
//#define THOST_FTDC_D_Sell '1'

Direction={Buy:'0',Sell:'1'};
DirectionReverse={'0':"Buy",'1':"Sell"};

/////////////////////////////////////////////////////////////////////////
///TFtdcOffsetFlagType是一个开平标志类型
/////////////////////////////////////////////////////////////////////////
///开仓
//#define THOST_FTDC_OF_Open '0'
///平仓
//#define THOST_FTDC_OF_Close '1'
///强平
//#define THOST_FTDC_OF_ForceClose '2'
///平今
//#define THOST_FTDC_OF_CloseToday '3'
///平昨
//#define THOST_FTDC_OF_CloseYesterday '4'
///强减
//#define THOST_FTDC_OF_ForceOff '5'
///本地强平
//#define THOST_FTDC_OF_LocalForceClose '6'

//客户端只有4 种开平类型
OpenCloseFlagType={Open:'0',Close:'1',CloseToday:'3',CloseYesterday:'4'};
OpenCloseFlagReverseType={'0':"Open",'1':"Close",'3':"CloseToday",'4':"CloseYesterday"};
/////////////////////////////////////////////////////////////////////////
///TFtdcHedgeFlagType是一个投机套保标志类型
/////////////////////////////////////////////////////////////////////////
///投机
//#define THOST_FTDC_HF_Speculation '1'
///套利
//#define THOST_FTDC_HF_Arbitrage '2'
///套保
//#define THOST_FTDC_HF_Hedge '3'
///做市商
//#define THOST_FTDC_HF_MarketMaker '5'

HedgeFlagType = {Speculation:'1',Arbitrage:'2',Hedge:'3',MarketMaker:'5'};



/////////////////////////////////////////////////////////////////////////
///TFtdcOrderPriceTypeType是一个报单价格条件类型
/////////////////////////////////////////////////////////////////////////
///任意价
//#define THOST_FTDC_OPT_AnyPrice '1'
///限价
//#define THOST_FTDC_OPT_LimitPrice '2'
///最优价
//#define THOST_FTDC_OPT_BestPrice '3'
///最新价
//#define THOST_FTDC_OPT_LastPrice '4'
///最新价浮动上浮1个ticks
//#define THOST_FTDC_OPT_LastPricePlusOneTicks '5'
///最新价浮动上浮2个ticks
//#define THOST_FTDC_OPT_LastPricePlusTwoTicks '6'
///最新价浮动上浮3个ticks
//#define THOST_FTDC_OPT_LastPricePlusThreeTicks '7'
///卖一价
//#define THOST_FTDC_OPT_AskPrice1 '8'
///卖一价浮动上浮1个ticks
//#define THOST_FTDC_OPT_AskPrice1PlusOneTicks '9'
///卖一价浮动上浮2个ticks
//#define THOST_FTDC_OPT_AskPrice1PlusTwoTicks 'A'
///卖一价浮动上浮3个ticks
//#define THOST_FTDC_OPT_AskPrice1PlusThreeTicks 'B'
///买一价
//#define THOST_FTDC_OPT_BidPrice1 'C'
///买一价浮动上浮1个ticks
//#define THOST_FTDC_OPT_BidPrice1PlusOneTicks 'D'
///买一价浮动上浮2个ticks
//#define THOST_FTDC_OPT_BidPrice1PlusTwoTicks 'E'
///买一价浮动上浮3个ticks
//#define THOST_FTDC_OPT_BidPrice1PlusThreeTicks 'F'
///五档价
//#define THOST_FTDC_OPT_FiveLevelPrice 'G'

OrderPriceType={
    AnyPrice:'1',
    LimitPrice:'2',
    BestPrice:'3',
    LastPrice:'4',
    LastPricePlusOneTicks:'5',
    LastPricePlusTwoTicks:'6',
    LastPricePlusThreeTicks:'7',
    AskPrice1:'8',
    AskPrice1PlusOneTicks:'9',
    AskPrice1PlusTwoTicks:'A',
    AskPrice1PlusThreeTicks:'B',
    BidPrice1:'C',
    BidPrice1PlusOneTicks:'D',
    BidPrice1PlusTwoTicks:'E',
    BidPrice1PlusThreeTicks:'F',
    FiveLevelPrice:'G'
};


/////////////////////////////////////////////////////////////////////////
///TFtdcTimeConditionType是一个有效期类型类型
/////////////////////////////////////////////////////////////////////////
///立即完成，否则撤销
//#define THOST_FTDC_TC_IOC '1'
///本节有效
//#define THOST_FTDC_TC_GFS '2'
///当日有效
//#define THOST_FTDC_TC_GFD '3'
///指定日期前有效
//#define THOST_FTDC_TC_GTD '4'
///撤销前有效
//#define THOST_FTDC_TC_GTC '5'
///集合竞价有效
//#define THOST_FTDC_TC_GFA '6'

TimeConditionType={
    ImmediatelyOrCancel:'1',
    GoodForSection:'2',
    GoodForDay:'3',
    GoodTillDate:'4',
    GoodTillCancel:'5',
    GoodForAuction:'6'};



/////////////////////////////////////////////////////////////////////////
///TFtdcContingentConditionType是一个触发条件类型
/////////////////////////////////////////////////////////////////////////
///立即
//#define THOST_FTDC_CC_Immediately '1'
///止损
//#define THOST_FTDC_CC_Touch '2'
///止赢
//#define THOST_FTDC_CC_TouchProfit '3'
///预埋单
//#define THOST_FTDC_CC_ParkedOrder '4'
///最新价大于条件价
//#define THOST_FTDC_CC_LastPriceGreaterThanStopPrice '5'
///最新价大于等于条件价
//#define THOST_FTDC_CC_LastPriceGreaterEqualStopPrice '6'
///最新价小于条件价
//#define THOST_FTDC_CC_LastPriceLesserThanStopPrice '7'
///最新价小于等于条件价
//#define THOST_FTDC_CC_LastPriceLesserEqualStopPrice '8'
///卖一价大于条件价
//#define THOST_FTDC_CC_AskPriceGreaterThanStopPrice '9'
///卖一价大于等于条件价
//#define THOST_FTDC_CC_AskPriceGreaterEqualStopPrice 'A'
///卖一价小于条件价
//#define THOST_FTDC_CC_AskPriceLesserThanStopPrice 'B'
///卖一价小于等于条件价
//#define THOST_FTDC_CC_AskPriceLesserEqualStopPrice 'C'
///买一价大于条件价
//#define THOST_FTDC_CC_BidPriceGreaterThanStopPrice 'D'
///买一价大于等于条件价
//#define THOST_FTDC_CC_BidPriceGreaterEqualStopPrice 'E'
///买一价小于条件价
//#define THOST_FTDC_CC_BidPriceLesserThanStopPrice 'F'
///买一价小于等于条件价
//#define THOST_FTDC_CC_BidPriceLesserEqualStopPrice 'H'
ContingentConditionType={
    Immediately:'1',
    Touch:'2',
    TouchProfit:'3',
    ParkedOrder:'4',
    LastPriceGreaterThanStopPrice:'5',
    LastPriceGreaterEqualStopPrice:'6',
    LastPriceLesserThanStopPrice:'7',
    LastPriceLesserEqualStopPrice:'8',
    AskPriceGreaterThanStopPrice:'9',
    AskPriceGreaterEqualStopPrice:'A',
    AskPriceLesserThanStopPrice:'B',
    AskPriceLesserEqualStopPrice:'C',
    BidPriceGreaterThanStopPrice:'D',
    BidPriceGreaterEqualStopPrice:'E',
    BidPriceLesserThanStopPrice:'F',
    BidPriceLesserEqualStopPrice:'H'};

ContingentConditionReverseType={
    '1':"Immediately",
    '2':"Touch",
    '3':"TouchProfit",
    '4':"ParkedOrder",
    '5':"LastPriceGreaterThanStopPrice",
    '6':"LastPriceGreaterEqualStopPrice",
    '7':"LastPriceLesserThanStopPrice",
    '8':"LastPriceLesserEqualStopPrice",
    '9':"AskPriceGreaterThanStopPrice",
    'A':"AskPriceGreaterEqualStopPrice",
    'B':"AskPriceLesserThanStopPrice",
    'C':"AskPriceLesserEqualStopPrice",
    'D':"BidPriceGreaterThanStopPrice",
    'E':"BidPriceGreaterEqualStopPrice",
    'F':"BidPriceLesserThanStopPrice",
    'H':"BidPriceLesserEqualStopPrice"
};

/////////////////////////////////////////////////////////////////////////
///TFtdcVolumeConditionType是一个成交量类型类型
/////////////////////////////////////////////////////////////////////////
///任何数量
//#define THOST_FTDC_VC_AV '1'
///最小数量
//#define THOST_FTDC_VC_MV '2'
///全部数量
//#define THOST_FTDC_VC_CV '3'

VolumeConditionType={AnyVolume:'1',MinVolume:'2',CompleteVolume:'3'};


/////////////////////////////////////////////////////////////////////////
///TFtdcForceCloseReasonType是一个强平原因类型
/////////////////////////////////////////////////////////////////////////
///非强平
//#define THOST_FTDC_FCC_NotForceClose '0'
///资金不足
//#define THOST_FTDC_FCC_LackDeposit '1'
///客户超仓
//#define THOST_FTDC_FCC_ClientOverPositionLimit '2'
///会员超仓
//#define THOST_FTDC_FCC_MemberOverPositionLimit '3'
///持仓非整数倍
//#define THOST_FTDC_FCC_NotMultiple '4'
///违规
//#define THOST_FTDC_FCC_Violation '5'
///其它
//#define THOST_FTDC_FCC_Other '6'
///自然人临近交割
//#define THOST_FTDC_FCC_PersonDeliv '7'
ForceCloseReasonType={
    NotForceClose:'0',
    LackDeposit:'1',
    ClientOverPositionLimit:'2',
    MemberOverPositionLimit:'3',
    NotMultiple:'4',
    Violation:'5',
    Other:'6',
    PersonDeliv:'7'
};


/////////////////////////////////////////////////////////////////////////
///TFtdcProductClassType是一个产品类型类型
/////////////////////////////////////////////////////////////////////////
///期货
//#define THOST_FTDC_PC_Futures '1'
///期货期权
//#define THOST_FTDC_PC_Options '2'
///组合
//#define THOST_FTDC_PC_Combination '3'
///即期
//#define THOST_FTDC_PC_Spot '4'
///期转现
//#define THOST_FTDC_PC_EFP '5'
///现货期权
//#define THOST_FTDC_PC_SOrpotOption '6'
ProductClassType={Futures:'1',Options:'2',Combination:'3',Spot:'4',EFP:'5',SpotOption:'6'};
ProductClassReverseType={'1':'Futures','2':'Options','3':'Combination','4':'Spot','5':'EFP','6':'SpotOption'};
//交易所类型
ExchangeType = {
    EXCHANGE_CFFEX:'CFFEX',
    EXCHANGE_SHFE: 'SHFE',
    EXCHANGE_CZCE:'CZCE',
    EXCHANGE_DCE:'DCE',
    EXCHANGE_SSE:'SSE',
    EXCHANGE_INE:'INE',
    EXCHANGE_UNKNOWN:''};



/////////////////////////////////////////////////////////////////////////
///TFtdcOrderStatusType是一个报单状态类型
/////////////////////////////////////////////////////////////////////////
///全部成交
//#define THOST_FTDC_OST_AllTraded '0'
///部分成交还在队列中
//#define THOST_FTDC_OST_PartTradedQueueing '1'
///部分成交不在队列中
//#define THOST_FTDC_OST_PartTradedNotQueueing '2'
///未成交还在队列中
//#define THOST_FTDC_OST_NoTradeQueueing '3'
///未成交不在队列中
//#define THOST_FTDC_OST_NoTradeNotQueueing '4'
///撤单
//#define THOST_FTDC_OST_Canceled '5'
///未知
//#define THOST_FTDC_OST_Unknown 'a'
///尚未触发
//#define THOST_FTDC_OST_NotTouched 'b'
///已触发
//#define THOST_FTDC_OST_Touched 'c'

OrderStatusReverseType={
    "0":"AllTraded",
    "1":"PartTradedQueueing",
    "2":"PartTradedNotQueueing",
    "3":"NoTradeQueueing",
    "4":"NoTradeNotQueueing",
    "5":"Canceled",
    "a":"Unknown",
    "b":'NotTouched',
    "c":'Touched'
};

OrderStatusType={
    AllTraded:'0',
    PartTradedQueueing:'1',
    PartTradedNotQueueing:'2',
    NoTradeQueueing:'3',
    NoTradeNotQueueing:'4',
    Canceled:'5',
    Unknown:'a',
    NotTouched:'b',
    Touched:'c'
};


/////////////////////////////////////////////////////////////////////////
///TFtdcOrderActionStatusType是一个报单操作状态类型
/////////////////////////////////////////////////////////////////////////
///已经提交
//#define THOST_FTDC_OAS_Submitted 'a'
///已经接受
//#define THOST_FTDC_OAS_Accepted 'b'
///已经被拒绝
//#define THOST_FTDC_OAS_Rejected 'c'
//撤单的状态
CancelOrderActionStatusType={
    Submitted:'a',
    Accepted:'b',
    Rejected:'c'
};

/////////////////////////////////////////////////////////////////////////
///TFtdcPosiDirectionType是一个持仓多空方向类型
/////////////////////////////////////////////////////////////////////////
///净
//#define THOST_FTDC_PD_Net '1'
///多头
//#define THOST_FTDC_PD_Long '2'
///空头
//#define THOST_FTDC_PD_Short '3'

PosiDirectionReverseType={
    '1':"Net",
    '2':"Long",
    '3':"Short"
};

//6种订单类型
OrderType={
    Limit:"0",
    Condition:"1",
    FOK:"2",
    FAK:"3",
    Market:"4",
    MarketIfTouched:"5"
};

OrderReverseType={
    "0":"Limit",
    "1":"Condition",
    "2":"FOK",
    "3":"FAK",
    "4":"Market",
    "5":"MarketIfTouched"
};

//事件定义
EVENT={
    OnLog:"EventLog",
    OnError:"EventError",
    OnContract:"EventContract",
    OnTick:"EventTick",
    OnOrder:"EventOrder",
    OnTrade:"EventTraded",
    OnCreateStrategyFailed:"EventCreateStrategyFailed",

    OnQueryPosition:"EventQueryPosition",
    OnQueryTradingAccount:"EventQueryTradingAccount",
    OnQueryCommissionRate:"EventQueryCommissionRate",
    OnQueryDeferFeeRate:"EventQueryDeferFeeRate",

    //连接
    OnDisconnected:"EventDisconnected",
    OnConnected:"EventConnected",
    //所有配置的交易客户端都连接上的事件
    OnAllConfigClientReadyed:"OnAllConfigClientReadyed",


    //是否订阅合约成功
    OnSubscribeContract:"EventSubscribeContract",
    OnUnSubscribeContract:"EventUnSubscribeContract",

    //合约查询后，所有合约接收完成
    OnReceivedAllContract:"EventReceivedAllContract",

    //重新连接客户端事件
    OnReconnected:"EventReconnectedClient",

    //结算信息
    OnQuerySettlementInfo:"EventQuerySettlementInfo",
};

//Disconnect ReasonID
///        0x1001 4097 网络读失败
///        0x1002 4098 网络写失败
///        0x2001 8193 接收心跳超时
///        0x2002 8194 发送心跳失败
///        0x2003 8195 收到错误报文
DisconnectReason={
    NetworkWriteError:4097,
    NetworkReadError:4098,
    HeartBeatTimeout:8193,
    HeartBeatSendFailed:8194,
    ErrorMessage:8195
};

//K线类型
KBarType={
    Tick:"TickKBar",
    Second:"SecondKBar",
    Minute:"MinuteKBar",
    Hour:"HourKBar",
    Day:"DayKBar"
};

//手续费类型
FeeType={
    //成交手数
    ByVolume:"TradeByVolume",
    //成交金额
    ByMoney:"TradeByMoney"
};

//出现错误的类型
ErrorType={
    Disconnected:"Disconnected with trade client",
    OperationAfterDisconnected:"Operation After Disconnected.Such as SendOrder after Disconnected",
    ClientRspError:"Error from the trade client response",
    RejectedOrder:"The order is rejected for some reason",
    StrategyError:"Strategy error happended",
    DBError:"MongoDB error happended"
};

//日志Log的级别,只有两个Info,Error
LogType={
    INFO:"Info",
    ERROR:"Error"
};

//主引擎的状态类型,开启，晚上收盘,白天收盘(要计算净值)
MainEngineStatus={
    Start:0,
    DayStop:1,
    NightStop:2,
    Stop:3
};

AppName="NodeQuant";

Tick_DB_Name=AppName+"_Tick_DB";
System_Log_DB=AppName+"_System_Log";
System_Error_DB=AppName+"_System_Error";
