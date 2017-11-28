/**
 * Created by Administrator on 2017/6/6.
 */
var express = require('express');
var router = express.Router();

require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    let tradingDay=global.NodeQuant.MainEngine.GetTradingDay();

    res.end(JSON.stringify({ TradingDay: tradingDay}));
});

module.exports = router;