class DateTimeUtil
{
    constructor()
    {

    }

   //js Date对象从0开始的月份
    static StrToDatetime(dateStr,timeStr)
    {
        let nowDate=new Date();
        let year= nowDate.getFullYear();
        let month = nowDate.getMonth();
        let day= nowDate.getDate();

        let hour=0;
        let minute=0;
        let second=0;

        if(dateStr!==undefined)
        {
            year=parseInt(dateStr.substring(0,4));
            month=parseInt(dateStr.substring(4,6));
            day=parseInt(dateStr.substring(6,8));
        }

        if(timeStr!==undefined)
        {
            hour=parseInt(timeStr.substring(0,2));
            minute=parseInt(timeStr.substring(3,5));
            second=parseInt(timeStr.substring(6,8));
        }

        let toDateTime = new Date(year,month-1,day,hour,minute,second);

        return toDateTime;
    }
}

module.exports=DateTimeUtil;