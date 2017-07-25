/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();

var URL = require('url');

/* GET home page. */
router.get('/', function(req, res, next) {

    var marketOrderReq = URL.parse(req.url, true).query;
    var contractName=marketOrderReq.contractName;
    var direction=marketOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=marketOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(marketOrderReq.volume);

    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        let lastTick = global.Application.StrategyEngine.Symbol_LastTickDic[contractName];
        DemoStrategy.SendOrder(contractName,undefined,volume,direction,openclose,OrderType.Market,lastTick);
    }

    res.render('index', { title: 'FiveMAStrategy Send Market Order'});
});

module.exports = router;
