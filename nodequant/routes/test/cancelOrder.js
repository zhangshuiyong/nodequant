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
        if(ret===-99)
            res.render('index', { title: 'CancelOrder Failed.Error: Trader client have not logined' });
        else if(ret!==0)
            res.render('index', { title: 'CancelOrder Failed.Error: '+ret });
        else
            res.render('index', { title: 'CancelOrder successfully'});
    });*/

    //global.Application.StrategyEngine.LoadTickFromDB("Demo","Au(T+D)",30,undefined);
    global.Application.StrategyEngine.LoadBarFromDB("Demo","Au(T+D)",5,KBarType.Minute,5,undefined);

    res.render('index', { title: 'CancelOrder successfully'});
});

module.exports = router;