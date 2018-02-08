/**
 * Created by Administrator on 2017/6/6.
 */
var express = require('express');
var router = express.Router();

require("../../common.js");

/* GET home page. */
router.get('/', function(req, res, next) {

    let orderList=global.NodeQuant.StrategyEngine.GetUnFinishOrderList("Demo");

    for(let index in orderList)
    {
        let order=orderList[index];
        global.NodeQuant.StrategyEngine.CancelOrder(order);
    }

    //global.NodeQuant.StrategyEngine.LoadTickFromDB("Demo","Au(T+D)",30,undefined);
    //global.NodeQuant.StrategyEngine.LoadBarFromDB("Demo","Au(T+D)",5,KBarType.Minute,5,undefined);

    res.render('index', { title: 'CancelOrder successfully'});
});

module.exports = router;