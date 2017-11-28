/**
 * Created by majc_tom on 2017/10/14.
 */
require("../../common");
require("../../userConfig");
const Influx = require('influx');
class InfluxDB{
    constructor()
    {
        this.influx=new Influx.InfluxDB({
            host: MarketData_DBConfig.Host,
            port:MarketData_DBConfig.Port,
            username:MarketData_DBConfig.Username,
            password:MarketData_DBConfig.Password,
            database: "NodeQuant_Recorder_Tick_DB",
            pool:{maxRetries:10,requestTimeout:3*60*1000}  //1个连接失败,重试10次,每次timeout,3分钟
        });

        this.pointsBuffer=[];
        this.BufferSize=1000;
        this.BufferInProgress=false;
    }

    Start(callback)
    {
        this.influx.getDatabaseNames().then(names => {
            if (!names.includes(Tick_DB_Name)) {
                return global.NodeQuant.MarketDataDBClient.influx.createDatabase(Tick_DB_Name);
            }
        }).then(() => {
            callback();
        }).catch(err => {
            console.error(`Error createDatabase to InfluxDB! ${err.stack}`)
        });
    }

    RecordTick(symbol,tick)
    {
        let point={
            measurement: symbol,
            tags: {tradingDay: tick.date},
            fields: {
                symbol: tick.symbol,
                exchange: tick.exchange,
                lastPrice: tick.lastPrice,          //Tick的最新价
                closePrice: tick.closePrice,          //Tick收盘价等于Tick的最新价
                openPrice: tick.openPrice,            //Tick开盘价等于1天的开盘价
                highPrice: tick.highPrice,        //Tick最高价是目前为止的行情的最高价
                lowPrice: tick.lowPrice,           //Tick最低价是目前为止的行情的最低价
                preClosePrice: tick.preClosePrice,   //Tick前一天的收盘价
                volume: tick.volume,
                openInterest: tick.openInterest,
                upperLimit: tick.upperLimit,
                lowerLimit: tick.lowerLimit,
                //自定义数据
                clientName: tick.clientName,
                date: tick.date,
                actionDate: tick.actionDate,
                timeStr: tick.timeStr,
                datetime: tick.datetime.toLocaleString(),
                actionDatetime: tick.actionDatetime.toLocaleString(),
                timeStamp: tick.timeStamp,
                Id: tick.Id,
                //五档买价
                bidPrice1: tick.bidPrice1,
                bidVolume1: tick.bidVolume1,
                bidPrice2: tick.bidPrice2,
                bidVolume2: tick.bidVolume2,
                bidPrice3: tick.bidPrice3,
                bidVolume3: tick.bidVolume3,
                bidPrice4: tick.bidPrice4,
                bidVolume4: tick.bidVolume4,
                bidPrice5: tick.bidPrice5,
                bidVolume5: tick.bidVolume5,
                //五档卖价格
                askPrice1: tick.askPrice1,
                askVolume1: tick.askVolume1,
                askPrice2: tick.askPrice2,
                askVolume2: tick.askVolume2,
                askPrice3: tick.askPrice3,
                askVolume3: tick.askVolume3,
                askPrice4: tick.askPrice4,
                askVolume4: tick.askVolume4,
                askPrice5: tick.askPrice5,
                askVolume5: tick.askVolume5
            },
            timestamp: tick.Id,
        };

        this.pointsBuffer.push(point);

        if(this.BufferInProgress)
            return;

        if(this.pointsBuffer.length>=this.BufferSize) {
            this.BufferInProgress=true;
            this.influx.writePoints(this.pointsBuffer.slice(0,this.BufferSize), {
                precision: 'ms'
            }).then(() => {
                this.BufferInProgress=false;
                this.pointsBuffer.splice(0, this.BufferSize);
            }).catch(err => {
                this.BufferInProgress=false;
                console.error(`Error saving ticks to InfluxDB! ${err.stack}`)
            });
        }
    }

    RecordLog(log)
    {
        this.influx.writePoints([
            {
                measurement:System_Log_DB,
                fields: {
                    Source:log.Source,
                    Type:log.Type,
                    Message:log.Message,
                    Datetime:log.Datetime
                }
            }
        ]).catch(err => {
            console.error(`Error saving log to InfluxDB! ${err.stack}`)
        });
    }

    RecordError(error)
    {
        this.influx.writePoints([
            {
                measurement:System_Error_DB,
                fields: {
                    Source:error.Source,
                    Type:error.Type,
                    Message:error.Message
                }
            }
        ]).catch(err => {
            console.error(`Error saving error to InfluxDB! ${err.stack}`)
        });
    }

    //获取单个合约的交易日列表
    GetTradingDayList(measurment,callback)
    {
        let influxQL="select distinct(date) from \""+measurment+"\"";
        this.influx.query(influxQL).then(dateResult => {
            let allDayCount = dateResult.length;

            let TradingDayList=[];
            for(let i=0;i<allDayCount;i++) {
                let dateStr = dateResult[i].distinct;
                TradingDayList.push(dateStr);
            }
            callback(TradingDayList);
        }).catch(err => {
            console.log("Error: get Trading Days in "+measurment);
            console.log(err);
            callback(undefined);
        });
    }

    //获取最新交易日
    GetLastTradingDay(measurment,callback)
    {
        let influxQL="select last(date) from \""+measurment+"\"";
        this.influx.query(influxQL).then(lastTradingDayResult => {

            if(lastTradingDayResult.length>0)
            {
                callback(lastTradingDayResult[0].last);
            }else
            {
                callback("");
            }
        }).catch(err => {
            console.log("Error: get Trading Days in "+measurment);
            console.log(err);

            callback("");
        });
    }

    //回溯前x天的tick
    //当天:LookBackDays=0
    //前1天:LookBackDays=1
    LoadTick(measurment,LookBackDays,callback)
    {
        let influxClient=this;
        this.GetTradingDayList(measurment,function (tradingDayList) {
            if(tradingDayList===undefined)
            {
                callback(undefined);
                return;
            }

            let allDayCount=tradingDayList.length;

            let influxQL="select *::field from \""+measurment+"\" where";
            if(allDayCount>=LookBackDays) {
                for (let i = allDayCount - LookBackDays - 1; i < allDayCount; i++) {
                    let dateStr = tradingDayList[i];
                    influxQL += " tradingDay='" + dateStr + "'";
                    if (i != allDayCount - 1) {
                        influxQL += " or";
                    }
                }

                influxClient.influx.query(influxQL).then(tickList => {
                    callback(tickList);
                }).catch(err => {
                    console.log("Error:get Tick list in " + measurment);
                    console.log(err);

                    callback(undefined);
                });
            }
        });
    }
}

module.exports=InfluxDB;