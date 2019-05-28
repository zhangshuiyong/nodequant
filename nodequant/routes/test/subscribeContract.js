/**
 * Created by Administrator on 2017/6/16.
 */

let express = require('express');
let router = express.Router();
let URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    let SubscribeReq = URL.parse(req.url, true).query;
    let contractName=SubscribeReq.contractName.replace(" ","+");

    let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
    global.NodeQuant.MainEngine.Subscribe("CTP",contractName,function (contractName,clientName,ret) {

        if(ret===-99)
            res.render('index', { title: clientName+' Subscribe Failed.Error: Trader client have not logined' });
        else if(ret!==0)
            res.render('index', { title: clientName+' Subscribe Failed.Error: '+ret });
        else
            res.render('index', { title: clientName+' Subscribe successfully'});
    });
});

module.exports = router;