let express = require('express');
let router = express.Router();

let URL = require('url');
require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {
    let request = URL.parse(req.url, true).query;
    let clientName=request.clientName;

    global.NodeQuant.MainEngine.QuerySettlementInfo(clientName);

    //查询结算信息
    global.AppEventEmitter.once(EVENT.OnQuerySettlementInfo,function (settlementInfo) {
        res.end(JSON.stringify(settlementInfo));
    });
});

module.exports = router;