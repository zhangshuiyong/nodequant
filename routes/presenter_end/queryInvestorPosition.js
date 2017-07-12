/**
 * Created by Administrator on 2017/6/2.
 */
var express = require('express');
var router = express.Router();

var URL = require('url');

/* GET home page. */
router.get('/', function(req, res, next) {
    global.Application.MainEngine.QueryInvestorPosition("CTP",function (clientName,ret) {
        if(ret==-99)
            res.render('index', { title: 'QueryInvestorPosition Failed.Error: Trader client have not logined' });
        else if(ret!=0)
            res.render('index', { title: 'QueryInvestorPosition Failed.Error: '+ret });
        else
            res.render('index', { title: 'QueryInvestorPosition successfully'});
    });

});

module.exports = router;

