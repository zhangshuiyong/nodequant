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
    let clientName=request.clientName;

    global.NodeQuant.MainEngine.QueryTradingAccount(clientName);

    //查询资金账户
    global.AppEventEmitter.once(EVENT.OnQueryTradingAccount,function (tradingAccountInfo) {
        res.end(JSON.stringify(tradingAccountInfo));
    });
});

module.exports = router;