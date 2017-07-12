/**
 * Created by Administrator on 2017/7/11.
 */
let db = require('./SystemDB'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;
let LogSchema = new Schema({
    Source:String,
    Type:String,
    Message:String,
    Datetime:String
},{collection:"Log"});

module.exports = db.model('Log',LogSchema);