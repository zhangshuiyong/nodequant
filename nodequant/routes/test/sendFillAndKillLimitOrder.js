/**
 * Created by Administrator on 2017/5/31.
 */
let express = require('express');
let router = express.Router();
let URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    let FAKLimitOrderReq = URL.parse(req.url, true).query;
    let contractName=FAKLimitOrderReq.contractName.replace(" ","+");
    let direction=FAKLimitOrderReq.direction;
    if(direction==="buy")
        direction=Direction.Buy;
    else if(direction==="sell")
        direction=Direction.Sell;

    let openclose=FAKLimitOrderReq.openclose;
    if(openclose==="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose==="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose==="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose==="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    let volume=parseInt(FAKLimitOrderReq.volume);

    let limitPrice=parseFloat(FAKLimitOrderReq.limitPrice);

    let DemoStrategy=global.NodeQuant.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
        DemoStrategy.SendOrder(lastTick.clientName,contractName,limitPrice,volume,direction,openclose,OrderType.FAK);
    }

    res.render('index', { title: 'FiveMAStrategy Send FAK Order'});

});

module.exports = router;