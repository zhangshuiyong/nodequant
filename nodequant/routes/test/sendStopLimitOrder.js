/**
 * Created by Administrator on 2017/5/31.
 */
let express = require('express');
let router = express.Router();
let URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    let stopLimitOrderReq = URL.parse(req.url, true).query;
    let contractName=stopLimitOrderReq.contractName.replace(" ","+");
    let direction=stopLimitOrderReq.direction;
    if(direction==="buy")
        direction=Direction.Buy;
    else if(direction==="sell")
        direction=Direction.Sell;

    let openclose=stopLimitOrderReq.openclose;
    if(openclose==="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose==="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose==="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose==="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    let volume=parseInt(stopLimitOrderReq.volume);
    let limitPrice=parseFloat(stopLimitOrderReq.limitPrice);

    let stopPriceCondition=stopLimitOrderReq.stopPriceCondition;
    if(stopPriceCondition==="gt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterThanStopPrice;
    }else if(stopPriceCondition==="gte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterEqualStopPrice;
    }else if(stopPriceCondition==="lt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserThanStopPrice;
    }else if(stopPriceCondition==="lte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserEqualStopPrice;
    }else
    {
        res.render('index', { title: 'SendStopLimitOrder Failed.Error: Trader client is not yet support this stopPriceCondition' });
        return;
    }

    let stopPrice=parseFloat(stopLimitOrderReq.stopPrice);


    let DemoStrategy=global.NodeQuant.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
        DemoStrategy.SendOrder(lastTick.clientName,contractName,limitPrice,volume,direction,openclose,OrderType.Condition,undefined,stopPriceCondition,stopPrice);
    }

    res.render('index', { title: 'FiveMAStrategy Send Stop Limit Order'});

});

module.exports = router;