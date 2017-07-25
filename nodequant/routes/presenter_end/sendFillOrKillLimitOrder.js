/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();
var URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    var FOKLimitOrderReq = URL.parse(req.url, true).query;
    var contractName=FOKLimitOrderReq.contractName;
    var direction=FOKLimitOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=FOKLimitOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(FOKLimitOrderReq.volume);

    var limitPrice=parseFloat(FOKLimitOrderReq.limitPrice);

    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        DemoStrategy.SendOrder(contractName,limitPrice,volume,direction,openclose,OrderType.FOK);
    }

    res.render('index', { title: 'FiveMAStrategy Send FOK Order'});

});

module.exports = router;