/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();
var URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    var limitOrderReq = URL.parse(req.url, true).query;
    var contractName=limitOrderReq.contractName;
    var direction=limitOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=limitOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(limitOrderReq.volume);

    var limitPrice=parseFloat(limitOrderReq.limitPrice);


    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        DemoStrategy.SendOrder(contractName,limitPrice,volume,direction,openclose);
    }

    res.render('index', { title: 'FiveMAStrategy SendOrder'});
});

module.exports = router;