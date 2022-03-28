import { createClient } from 'redis';
import { Ticket } from './utils';

export class Top {
  private redis = createClient();

  public async init() {
    this.redis.on('error', (err) => console.log('Redis Client Error', err));

    await this.redis.connect();
  }

  public async update(tick: Ticket) {
    await this.redis.zAdd('volume', { value: tick.symbol, score: tick.volume });

    if (tick.preClosePrice === 0 || tick.closePrice === 0) return;

    const change = (tick.closePrice - tick.preClosePrice) / tick.preClosePrice;

    await this.redis.zAdd('change', { value: tick.symbol, score: change });
  }

  public async volume(n: number): Promise<Partial<Ticket>[]> {
    let count = await this.redis.zCard('volume');

    if (count < n) count = n;

    const result = await this.redis.zRangeWithScores('volume', count - n, count - 1);

    return result.reverse().map((r) => ({ symbol: r.value, volume: r.score }));
  }

  public async increase(n: number): Promise<Partial<Ticket>[]> {
    let count = await this.redis.zCard('change');

    if (count < n) count = n;

    const result = await this.redis.zRangeWithScores('change', count - n, count - 1);

    return result
      .reverse()
      .filter((r) => r.score > 0)
      .map((r) => ({ symbol: r.value, increase: r.score }));
  }

  public async decrease(n: number): Promise<Partial<Ticket>[]> {
    const result = await this.redis.zRangeWithScores('change', 0, n - 1);

    return result.filter((r) => r.score < 0).map((r) => ({ symbol: r.value, decrease: -r.score }));
  }

  public async clear() {
    await this.redis.del('volume');
    await this.redis.del('change');
  }
}
