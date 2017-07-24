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

    /*
     global.Application.MainEngine.SendFillOrKillLimitOrder("CTP",contractName,direction,openclose,volume,limitPrice,function (clientName,ret){
     if(ret==-99)
     res.render('index', { title: 'SendFillOrKillLimitOrder Failed.Error: Trader client have not logined' });
     else if(ret!=0)
     res.render('index', { title: 'SendFillOrKillLimitOrder failed, err:'+ret });
     else
     res.render('index', { title: 'SendFillOrKillLimitOrder successfully'});
     });*/

    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        FiveMAStrategy.SendOrder(contractName,limitPrice,volume,direction,openclose,OrderType.FOK);
    }

    res.render('index', { title: 'FiveMAStrategy Send FOK Order'});

});

module.exports = router;