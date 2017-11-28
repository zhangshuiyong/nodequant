/**
 * Created by Administrator on 2017/5/31.
 */
let express = require('express');
let router = express.Router();
let URL = require('url');
/* GET home page. */
router.get('/', function(req, res, next) {

    let marketIfTouchedOrderReq = URL.parse(req.url, true).query;
    let contractName=marketIfTouchedOrderReq.contractName.replace(" ","+");
    let direction=marketIfTouchedOrderReq.direction;
    if(direction==="buy")
        direction=Direction.Buy;
    else if(direction==="sell")
        direction=Direction.Sell;

    let openclose=marketIfTouchedOrderReq.openclose;
    if(openclose==="open")
        openclose=OpenCloseFlagType.Open;
    else if(openclose==="close")
        openclose=OpenCloseFlagType.Close;
    else if(openclose==="closeToday")
        openclose=OpenCloseFlagType.CloseToday;
    else if(openclose==="closeYesterday")
        openclose=OpenCloseFlagType.CloseYesterday;

    let volume=parseInt(marketIfTouchedOrderReq.volume);

    let stopPriceCondition=marketIfTouchedOrderReq.stopPriceCondition;
    if(stopPriceCondition==="gt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterThanStopPrice;
    }else if(stopPriceCondition==="gte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceGreaterEqualStopPrice;
    }else if(stopPriceCondition==="lt")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserThanStopPrice;
    }else if(stopPriceCondition==="lte")
    {
        stopPriceCondition=ContingentConditionType.LastPriceLesserEqualStopPrice;
    }

    let stopPrice=parseFloat(marketIfTouchedOrderReq.stopPrice);

    let lastTick = global.NodeQuant.StrategyEngine.Symbol_LastTickDic[contractName];
    global.NodeQuant.MainEngine.SendMarketIfTouchedOrder(lastTick.clientName,contractName,direction,openclose,volume,stopPriceCondition,stopPrice,function (clientName,ret) {

        if(ret===-99)
            res.render('index', { title: 'SendMarketIfTouchedOrder Failed.Error: Trader client have not logined' });
        else if(ret!==0)
            res.render('index', { title: 'SendMarketIfTouchedOrder failed, err:'+ret });
        else
            res.render('index', { title: 'SendMarketIfTouchedOrder successfully'});
    });

});

module.exports = router;