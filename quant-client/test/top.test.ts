import { Ticket } from '../src/utils';
import { Top } from '../src/Top';

const top = new Top();

const createTick = (symbol: string, volume: number, closePrice: number): Ticket => {
  return {
    symbol,
    volume,
    closePrice,
    preClosePrice: 100,
    lastPrice: 0,
    openPrice: 0,
    highPrice: 0,
    lowPrice: 0,
    increase: 0,
    decrease: 0,
  };
};

beforeAll(async () => {
  await top.init();
});

beforeEach(async () => {
  await top.clear();
});

it('gets volume top 5', async () => {
  await top.update(createTick('a', 1, 100));
  await top.update(createTick('b', 2, 100));
  await top.update(createTick('c', 3, 100));
  await top.update(createTick('d', 4, 100));

  const result = await top.volume(5);

  expect(result.length).toBe(4);
  expect(result[0].symbol).toBe('d');
});

it('gets increase/decrease top 5', async () => {
  await top.update(createTick('a', 1, 98));
  await top.update(createTick('b', 2, 99));
  await top.update(createTick('c', 3, 100));
  await top.update(createTick('d', 4, 101));

  const inc = await top.increase(5);
  expect(inc.length).toBe(1);
  expect(inc[0].symbol).toBe('d');

  const dec = await top.decrease(5);
  expect(dec.length).toBe(2);
  expect(dec[0].symbol).toBe('a');
});
