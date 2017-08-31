/**
 * Created by Administrator on 2017/6/6.
 */
var express = require('express');
var router = express.Router();

require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {
    /*
    global.Application.MainEngine.CancelOrder("CTP",function (clientName,ret) {
        if(ret==-99)
            res.render('index', { title: 'CancelOrder Failed.Error: Trader client have not logined' });
        else if(ret!=0)
            res.render('index', { title: 'CancelOrder Failed.Error: '+ret });
        else
            res.render('index', { title: 'CancelOrder successfully'});
    });*/

    //global.Application.StrategyEngine.Stop(MainEngineStatus.Stop);
    //global.Application.MainEngine.QueryTradingAccount("CTP");

    let DemoStrategy=global.Application.StrategyEngine.GetStrategy("Demo");
    if(DemoStrategy)
    {
        let lastTick = global.Application.StrategyEngine.Symbol_LastTickDic["Ag(T+D)"];
        //DemoStrategy.QueryTradingAccount(lastTick.clientName);
        //global.Application.MainEngine.QueryCommissionRate(lastTick.clientName,"Ag(T+D)");
        global.Application.MainEngine.QueryDeferFeeRate("Sgit","Ag(T+D)");
    }

    res.render('index', { title: 'CancelOrder successfully'});
});

module.exports = router;