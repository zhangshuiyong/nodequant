/**
 * Created by Administrator on 2017/6/2.
 */
let express = require('express');
let router = express.Router();
let URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    let queryReq = URL.parse(req.url, true).query;
    let clientName=queryReq.clientName;


    global.NodeQuant.MainEngine.QueryInvestorPosition(clientName,function (clientName,ret) {
        if(ret===-99)
           console.log('QueryInvestorPosition Failed.Error: Trader client have not logined');
        else if(ret!==0)
            console.log('QueryInvestorPosition Failed.Error: ');
        else
            console.log('QueryInvestorPosition successfully');
    });


    //查询合约仓位
    global.AppEventEmitter.once(EVENT.OnQueryPosition,function (postionInfo) {
        res.end(JSON.stringify(postionInfo));
    });

});

module.exports = router;

