/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();
var URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    var stopLimitOrderReq = URL.parse(req.url, true).query;
    var contractName=stopLimitOrderReq.contractName;
    var direction=stopLimitOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=stopLimitOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(stopLimitOrderReq.volume);
    var limitPrice=parseFloat(stopLimitOrderReq.limitPrice);

    var stopPriceCondition=stopLimitOrderReq.stopPriceCondition;
    if(stopPriceCondition=="gt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterThanStopPrice;
    }else if(stopPriceCondition=="gte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterEqualStopPrice;
    }else if(stopPriceCondition=="lt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserThanStopPrice;
    }else if(stopPriceCondition=="lte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserEqualStopPrice;
    }else
    {
        res.render('index', { title: 'SendStopLimitOrder Failed.Error: Trader client is not yet support this stopPriceCondition' });
        return;
    }

    var stopPrice=parseFloat(stopLimitOrderReq.stopPrice);


    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        DemoStrategy.SendOrder(contractName,limitPrice,volume,direction,openclose,OrderType.Condition,undefined,stopPriceCondition,stopPrice);
    }

    res.render('index', { title: 'FiveMAStrategy Send Stop Limit Order'});

});

module.exports = router;