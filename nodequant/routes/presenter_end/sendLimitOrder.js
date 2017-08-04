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

        //test 1
        //DemoStrategy.SendOrder("T1709","94.710",volume,direction,openclose);
        //test 2
        /*
        DemoStrategy.SendOrder("T1709","94.710",volume,direction,openclose);
        DemoStrategy.SendOrder("TF1709","97.330",volume,direction,openclose);
        */

        //test 3
        //DemoStrategy.SendOrder("bu1709",2670,volume,direction,openclose);
        //DemoStrategy.SendOrder("rb1709",2850,volume,direction,openclose);

        //DemoStrategy.SendOrder("bu1709",2670,volume,direction,openclose);
        //DemoStrategy.SendOrder("rb1709",2850,volume,direction,openclose);
    }

    res.render('index', { title: 'FiveMAStrategy SendOrder'});
});

module.exports = router;