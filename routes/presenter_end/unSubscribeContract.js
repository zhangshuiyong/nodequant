/**
 * Created by Administrator on 2017/6/16.
 */

var express = require('express');
var router = express.Router();
var URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    var unSubscribeReq = URL.parse(req.url, true).query;
    var contractName=unSubscribeReq.contractName;
    global.Application.MainEngine.UnSubscribe("CTP",contractName,function (clientName,ret) {
        if(ret==-99)
            res.render('index', { title: clientName+' UnSubscribe Failed.Error: Market client have not logined' });
        else if(ret!=0)
            res.render('index', { title: clientName+' UnSubscribe Failed.Error: '+ret });
        else
            res.render('index', { title: clientName+' UnSubscribe successfully'});
    });
});

module.exports = router;