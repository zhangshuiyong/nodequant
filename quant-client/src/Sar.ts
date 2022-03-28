import { Ticket } from './utils';

export class Sar {
  private acc: number;
  private extreme: number;
  private trend: 'falling' | 'rising';
  private lastTick: Ticket;
  public value: number;
  public isUpCross = false;
  public isDownCross = false;

  public constructor(tick: Ticket) {
    this.trend = 'falling';
    this.extreme = tick.lowPrice;
    this.acc = 0.02;

    const initial = tick.highPrice;
    const sar = initial - (initial - this.extreme) * this.acc;
    this.value = Math.max(sar, tick.highPrice);
    this.lastTick = { ...tick };
  }

  public update(tick: Ticket) {
    this.isUpCross = this.trend === 'falling' && tick.highPrice >= this.value;
    this.isDownCross = this.trend === 'rising' && tick.lowPrice <= this.value;

    const initial = this.isUpCross || this.isDownCross ? this.extreme : this.value;

    const newTrend = initial > tick.closePrice ? 'falling' : 'rising';

    const newExtreme =
      newTrend === 'falling' ? Math.min(this.extreme, tick.lowPrice) : Math.max(this.extreme, tick.highPrice);

    this.acc = newTrend !== this.trend ? 0.02 : newExtreme === this.extreme ? this.acc : Math.min(this.acc + 0.02, 0.2);

    this.trend = newTrend;
    this.extreme = newExtreme;

    const sar = initial - (initial - this.extreme) * this.acc;

    this.value =
      this.trend === 'falling'
        ? Math.max(sar, tick.highPrice, this.lastTick.highPrice)
        : Math.min(sar, tick.lowPrice, this.lastTick.lowPrice);

    this.lastTick = { ...tick };
  }
}
