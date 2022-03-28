export enum STATUS_OF_CONTRACT {
  NORMAL = 'normal',
  EDITTING = 'editting',
}
export interface Ticket {
  symbol: string;
  closePrice: number;
  highPrice: number;
  openPrice: number;
  lowPrice: number;
  preClosePrice: number;
  lastPrice: number;
  increase: number;
  decrease: number;
  volume: number;
}
export interface Contract {
  status?: STATUS_OF_CONTRACT;
  ticket?: Ticket;
  symbol: string;
  exchange?: string;
  name?: string;
  futureName?: string;
  size?: number;
  priceTick?: number;
  productClass?: string;
  strikePrice?: number;
  clientName?: string;
  sar?: number;
  sarTools?: {
    SAR: (tick: Ticket) => number;
    isUpCross: () => boolean;
    isDownCross: () => boolean;
  };
}
const OPEN_TIME_MORNING = {
  hour: 9,
  minute: 30,
};
const OPEN_TIME_NIGHT = {
  hour: 21,
  minute: 0,
};
const BEGIN_MINUTES = 15;
const openedFifteen = () => {
  const now = new Date();
  const nowHour = now.getHours();
  const nowTime = now.getTime();
  const todayStart = new Date(now.toDateString()).getTime();
  const openTime = nowHour < 12 ? OPEN_TIME_MORNING : OPEN_TIME_NIGHT;
  return nowTime - todayStart - (openTime.hour * 3600 + openTime.minute * 60) * 1000 > BEGIN_MINUTES * 60 * 1000;
};

const upThreePrecent = (tick: Ticket) => {
  return tick.closePrice > tick.preClosePrice * 1.03;
};
const downThreePrecent = (tick: Ticket) => {
  return tick.closePrice < tick.preClosePrice * 0.97;
};

function notifyMe(message: string) {
  // 检查浏览器是否支持 Notification
  if (!('Notification' in window)) {
    alert('你的不支持 Notification!  TAT');
  }

  // 检查用户是否已经允许使用通知
  else if (Notification.permission === 'granted') {
    // 创建 Notification
    var notification = new Notification(message, {
      silent: false,
    });
    (document.querySelector('#audio') as any).play();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // 用户同意使用通知
      if (!('permission' in Notification)) {
        (Notification as any).permission = permission;
      }

      if (permission === 'granted') {
        // 创建 Notification
        var notification = new Notification(message);
      }
    });
  }
}

export const SarTools = () => {
  let AF = 0.02;
  let preSAR: number,
    preTick: Ticket,
    isUpCross = false,
    isDownCross = false;
  let isUp: boolean;
  let isDown: boolean;
  const SAR = (tick: Ticket) => {
    if (!openedFifteen()) {
      return -1;
    }
    let _SAR;
    if (isUp === undefined) {
      isUp = upThreePrecent(tick);
    }
    if (isDown === undefined) {
      isDown = downThreePrecent(tick);
    }
    if (!preTick) {
      preTick = tick;
    }

    if (!preSAR) {
      preSAR = _SAR = isUp ? tick.lowPrice : tick.highPrice;
    } else {
      if ((isUp && tick.highPrice > preTick.highPrice) || (!isUp && tick.lowPrice < preTick.lowPrice)) {
        AF = Math.min(0.2, AF + 0.02);
      }
      _SAR = preSAR + AF * ((isUp ? preTick.highPrice : preTick.lowPrice) - preSAR);
      if (isUp) {
        _SAR = Math.min(_SAR, tick.lowPrice, preTick.lowPrice);
      } else {
        _SAR = Math.max(_SAR, tick.highPrice, preTick.highPrice);
      }
    }
    isUpCross = preTick.closePrice <= preSAR && tick.closePrice > _SAR;
    isDownCross = preTick.closePrice >= preSAR && tick.closePrice < _SAR;
    isUpCross && console.log('isUpCross', tick, isUpCross);
    isUpCross && notifyMe('发生SAR穿越，买入价格' + _SAR);
    preTick = tick;
    preSAR = _SAR;
    // console.log(new Date().toISOString(), tick, isUpCross, isDownCross)
    return _SAR;
  };
  const getIsUpCross = () => isUpCross;
  const getIsDownCross = () => isDownCross;
  return {
    SAR: SAR,
    isUpCross: getIsUpCross,
    isDownCross: getIsDownCross,
  };
};
