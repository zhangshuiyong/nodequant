/**
 * Created by Administrator on 2017/5/31.
 */
var express = require('express');
var router = express.Router();
var URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    var marketIfTouchedOrderReq = URL.parse(req.url, true).query;
    var contractName=marketIfTouchedOrderReq.contractName;
    var direction=marketIfTouchedOrderReq.direction;
    if(direction=="buy")
        direction=Direction.Buy;
    else if(direction=="sell")
        direction=Direction.Sell;

    var openclose=marketIfTouchedOrderReq.openclose;
    if(openclose=="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose=="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose=="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose=="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    var volume=parseInt(marketIfTouchedOrderReq.volume);

    var stopPriceCondition=marketIfTouchedOrderReq.stopPriceCondition;
    if(stopPriceCondition=="gt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterThanStopPrice;
    }else if(stopPriceCondition=="gte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterEqualStopPrice;
    }else if(stopPriceCondition=="lt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserThanStopPrice;
    }else if(stopPriceCondition=="lte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserEqualStopPrice;
    }

    var stopPrice=parseFloat(marketIfTouchedOrderReq.stopPrice);

    global.Application.MainEngine.SendMarketIfTouchedOrder("CTP",contractName,direction,openclose,volume,stopPriceCondition,stopPrice,function (clientName,ret) {

        if(ret==-99)
            res.render('index', { title: 'SendMarketIfTouchedOrder Failed.Error: Trader client have not logined' });
        else if(ret!=0)
            res.render('index', { title: 'SendMarketIfTouchedOrder failed, err:'+ret });
        else
            res.render('index', { title: 'SendMarketIfTouchedOrder successfully'});
    });

});

module.exports = router;