/**
 * Created by Administrator on 2017/6/16.
 */

var express = require('express');
var router = express.Router();
var URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    var SubscribeReq = URL.parse(req.url, true).query;
    var contractName=SubscribeReq.contractName;
    global.Application.MainEngine.Subscribe("CTP",contractName,function (contractName,clientName,ret) {

        if(ret==-99)
            res.render('index', { title: clientName+' Subscribe Failed.Error: Trader client have not logined' });
        else if(ret!=0)
            res.render('index', { title: clientName+' Subscribe Failed.Error: '+ret });
        else
            res.render('index', { title: clientName+' Subscribe successfully'});
    });
});

module.exports = router;