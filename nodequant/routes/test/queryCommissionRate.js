/**
 * Created by Administrator on 2017/6/6.
 */
let express = require('express');
let router = express.Router();

let URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {
    let request = URL.parse(req.url, true).query;
    let contractName=request.contractName.replace(" ","+");
    let clientName=request.clientName;

    global.NodeQuant.MainEngine.QueryCommissionRate(clientName,contractName);

    //查询合约手续费
    global.AppEventEmitter.once(EVENT.OnQueryCommissionRate,function (commissionRateInfo) {
        res.end(JSON.stringify(commissionRateInfo));
    });
});

module.exports = router;