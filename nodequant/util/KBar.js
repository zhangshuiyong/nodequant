
class KBar{
    constructor(BarId,StartDatetime,EndDatetime,Symbol,Open,High,Low,Close,Volume,OpenInterest){
        this.Id = BarId;
        this.startDatetime = StartDatetime;
        this.endDatetime = EndDatetime;
        this.date=EndDatetime.toLocaleDateString();//Kbar的时刻为结束时间
        this.timeStr=StartDatetime.toLocaleTimeString();//Kbar的时刻为开始时间
        this.symbol=Symbol;
        this.openPrice=Open;
        this.highPrice=High;
        this.lowPrice=Low;
        this.closePrice=Close;
        this.volume=Volume;
        this.openInterest=OpenInterest;
    }
}

module.exports=KBar;