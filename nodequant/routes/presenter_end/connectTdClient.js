/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    global.Application.MainEngine.Connect("CTP",function (clientName,ret) {
        if(ret==0)
            res.render('index', { title: "Connect"+clientName+"Client Successfully" });
        else
            res.render('index', { title: "Connect"+clientName+"Client Failed:"+ret });
    });

});

module.exports = router;