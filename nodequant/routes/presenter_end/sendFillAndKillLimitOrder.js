/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();
var URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    var FAKLimitOrderReq = URL.parse(req.url, true).query;
    var contractName=FAKLimitOrderReq.contractName;
    var direction=FAKLimitOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=FAKLimitOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(FAKLimitOrderReq.volume);

    var limitPrice=parseFloat(FAKLimitOrderReq.limitPrice);

    /*
     global.Application.MainEngine.SendFillAndKillLimitOrder("CTP",contractName,direction,openclose,volume,limitPricefunction,function(clientName,ret){
     if(ret==-99)
     res.render('index', { title: 'SendFillAndKillLimitOrder Failed.Error: Trader client have not logined' });
     else if(ret!=0)
     res.render('index', { title: 'SendFillAndKillLimitOrder failed, err:'+ret });
     else
     res.render('index', { title: 'SendFillAndKillLimitOrder successfully'});
     });*/

    let FiveMAStrategy=global.Application.StrategyEngine.GetStrategy("FiveMA");
    if(FiveMAStrategy)
    {
        FiveMAStrategy.SendOrder(contractName,limitPrice,volume,direction,openclose,OrderType.FAK);
    }

    res.render('index', { title: 'FiveMAStrategy Send FAK Order'});

});

module.exports = router;