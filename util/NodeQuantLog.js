/**
 * Created by Administrator on 2017/7/10.
 */
class NodeQuantLog{
    constructor(source,type,datetimestr,message){
        this.Source=source;
        this.Type=type;
        this.Message=message;
        this.Datetime=datetimestr;
    }
}

module.exports=NodeQuantLog;