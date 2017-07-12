/**
 * Created by Administrator on 2017/7/11.
 */
/**
 * Created by Administrator on 2017/7/11.
 */
require("../../common");
let NodeQuantError=require("../../util/NodeQuantError");
let mongoose = require('mongoose'),
    DB_URL ="mongodb://"+MongoDBConfig.Host+":"+MongoDBConfig.Port+"/"+System_DB_Name+"?connectTimeoutMS="+DB_Connection_TimeOut;

/**
 * 连接
 */
mongoose.Promise = global.Promise;
let db = mongoose.createConnection(DB_URL);

/**
 * 连接成功
 */
db.on('connected', function () {

});

/**
 * 连接异常
 */
db.on('error',function (err) {

    let message='Mongoose connection error: ' + err;
    let error=new NodeQuantError(System_DB_Name,ErrorType.DBError,message);
    global.AppEventEmitter.OnError(error);
});

/**
 * 连接断开
 */
db.on('disconnected', function () {
    let message='Mongoose connection disconnected';
    let error=new NodeQuantError(System_DB_Name,ErrorType.DBError,message);
    global.AppEventEmitter.OnError(error);
});

module.exports = db;