/**
 * Created by Administrator on 2017/6/16.
 */

let express = require('express');
let router = express.Router();
let URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    let unSubscribeReq = URL.parse(req.url, true).query;
    let contractName=unSubscribeReq.contractName.replace(" ","+");

    let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
    global.NodeQuant.MainEngine.UnSubscribe(lastTick.clientName,contractName,function (clientName,ret) {
        if(ret===-99)
            res.render('index', { title: clientName+' UnSubscribe Failed.Error: Market client have not logined' });
        else if(ret!==0)
            res.render('index', { title: clientName+' UnSubscribe Failed.Error: '+ret });
        else
            res.render('index', { title: clientName+' UnSubscribe successfully'});
    });
});

module.exports = router;