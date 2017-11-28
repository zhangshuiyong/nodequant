/**
 * Created by Administrator on 2017/5/31.
 */
let express = require('express');
let router = express.Router();
let URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    let limitOrderReq = URL.parse(req.url, true).query;
    let contractName=limitOrderReq.contractName.replace(" ","+");
    let direction=limitOrderReq.direction;
    if(direction==="buy")
        direction=Direction.Buy;
    else if(direction==="sell")
        direction=Direction.Sell;

    let openclose=limitOrderReq.openclose;
    if(openclose==="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose==="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose==="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose==="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    let volume=parseInt(limitOrderReq.volume);

    let limitPrice=parseFloat(limitOrderReq.limitPrice);

    let DemoStrategy=global.NodeQuant.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
        DemoStrategy.SendOrder(lastTick.clientName,contractName,limitPrice,volume,direction,openclose);

        //test 1
        //DemoStrategy.SendOrder("T1709","94.710",volume,direction,openclose);
        //test 2
        /*
        DemoStrategy.SendOrder("T1709","94.710",volume,direction,openclose);
        DemoStrategy.SendOrder("TF1709","97.330",volume,direction,openclose);
        */

        //test 3

        //DemoStrategy.SendOrder("bu1801",2740,volume,direction,openclose);
        //DemoStrategy.SendOrder("rb1801",3840,volume,direction,openclose);

        //DemoStrategy.SendOrder("bu1801",2580,volume,direction,openclose);
        //DemoStrategy.SendOrder("rb1801",3840,volume,direction,openclose);

    }

    res.render('index', { title: 'FiveMAStrategy SendOrder'});
});

module.exports = router;