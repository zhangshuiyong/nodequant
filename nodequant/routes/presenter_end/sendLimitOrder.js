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

    /*
    global.Application.MainEngine.SendLimitOrder("CTP",contractName,direction,openclose,volume,limitPrice,function (clientName,ret) {
        if(ret==-99)
            res.render('index', { title: 'sendLimitOrder Failed.Error: Trader client have not logined' });
        else if(ret!=0)
            res.render('index', { title: 'sendLimitOrder failed, err:'+ret });
        else
            res.render('index', { title: 'sendLimitOrder successfully'});
    });*/

    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        DemoStrategy.SendOrder("m1709","2860",volume,direction,openclose);
        DemoStrategy.SendOrder("RM709","2400",volume,direction,openclose);
    }

    res.render('index', { title: 'FiveMAStrategy SendOrder'});
});

module.exports = router;