import { describe, expect, it } from 'vitest';
import { makeRng } from '@/lib/rng';
import { gspOutcome, vcgOutcome, type Bidder } from '@/features/simulators/ads';
import { bm25Score } from '@/features/simulators/retrieval';
import { selectArm } from '@/features/simulators/bandits';

const SLOTS = [0.08, 0.045, 0.03];

function bidder(id: string, bid: number, quality: number): Bidder {
  return { id, bid, quality, value: bid };
}

describe('ad auctions', () => {
  it('ranks by bid times quality, not by bid', () => {
    const ads = [bidder('rich', 50, 0.01), bidder('good', 20, 0.05)];
    expect(gspOutcome(ads, SLOTS)[0].ad.id).toBe('good');
  });

  it('charges the next bid in the winner own quality units', () => {
    const ads = [bidder('A', 30, 0.2), bidder('B', 20, 0.1)];
    const [first] = gspOutcome(ads, [0.08]);
    expect(first.price).toBeCloseTo((20 * 0.1) / 0.2, 9);
  });

  it('never charges more than the bid', () => {
    const rng = makeRng(11);
    for (let t = 0; t < 200; t += 1) {
      const ads = Array.from({ length: 2 + rng.int(5) }, (_, i) =>
        bidder(`a${i}`, 1 + rng.next() * 80, 0.01 + rng.next() * 0.2),
      );
      for (const row of gspOutcome(ads, SLOTS)) {
        expect(row.price).toBeLessThanOrEqual(row.ad.bid + 1e-9);
        expect(row.price).toBeGreaterThanOrEqual(0);
      }
      for (const row of vcgOutcome(ads, SLOTS)) {
        expect(row.price).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('charges nothing to a lone bidder with nobody below', () => {
    const [only] = gspOutcome([bidder('A', 10, 0.1)], [0.08]);
    expect(only.price).toBe(0);
  });

  it('makes truthful bidding optimal under VCG but not under GSP', () => {
    // The same line-up the simulator uses: a close rival above, cheap ads below.
    const others = [bidder('B', 28, 0.09), bidder('C', 45, 0.04), bidder('D', 12, 0.09)];
    const VALUE = 30;

    const profit = (bid: number, mechanism: 'gsp' | 'vcg') => {
      const ads = [{ ...bidder('A', bid, 0.09), value: VALUE }, ...others];
      const outcome = (mechanism === 'gsp' ? gspOutcome : vcgOutcome)(ads, SLOTS);
      const mine = outcome.find((o) => o.ad.id === 'A');
      return mine ? (VALUE - mine.price) * mine.clicks : 0;
    };

    const bids: number[] = [];
    for (let b = 5; b <= 70; b += 1) bids.push(b);
    const bestVcg = bids.reduce((b, x) => (profit(x, 'vcg') > profit(b, 'vcg') ? x : b), bids[0]);

    // Under VCG no bid beats the truth by any meaningful margin.
    const truthful = profit(VALUE, 'vcg');
    expect(profit(bestVcg, 'vcg')).toBeLessThanOrEqual(truthful + 1e-9);

    // Under GSP some bid does strictly better than bidding the value: shading
    // drops the ad to a cheaper slot that loses few clicks.
    const bestGsp = bids.reduce((b, x) => (profit(x, 'gsp') > profit(b, 'gsp') ? x : b), bids[0]);
    expect(profit(bestGsp, 'gsp')).toBeGreaterThan(profit(VALUE, 'gsp') + 1e-9);
    expect(bestGsp).toBeLessThan(VALUE);
  });
});

type TestDoc = { id: string; terms: Record<string, number>; length: number };

describe('BM25', () => {
  const corpus: TestDoc[] = [
    { id: 'd1', terms: { a: 1 }, length: 10 },
    { id: 'd2', terms: { a: 1, b: 1 }, length: 10 },
    { id: 'd3', terms: { b: 1 }, length: 10 },
    { id: 'd4', terms: { c: 1 }, length: 10 },
  ];

  it('saturates with term frequency', () => {
    const one = bm25Score({ id: 'x', terms: { a: 1 }, length: 10 } satisfies TestDoc, ['a'], corpus, 1.2, 0.75);
    const two = bm25Score({ id: 'x', terms: { a: 2 }, length: 10 } satisfies TestDoc, ['a'], corpus, 1.2, 0.75);
    const four = bm25Score({ id: 'x', terms: { a: 4 }, length: 10 } satisfies TestDoc, ['a'], corpus, 1.2, 0.75);
    expect(two).toBeGreaterThan(one);
    expect(four).toBeGreaterThan(two);
    expect(four - two).toBeLessThan(two - one);
  });

  it('ignores frequency entirely at k1 = 0', () => {
    const one = bm25Score({ id: 'x', terms: { a: 1 }, length: 10 } satisfies TestDoc, ['a'], corpus, 0, 0.75);
    const many = bm25Score({ id: 'x', terms: { a: 9 }, length: 10 } satisfies TestDoc, ['a'], corpus, 0, 0.75);
    expect(many).toBeCloseTo(one, 12);
  });

  it('ignores document length at b = 0 and punishes it at b > 0', () => {
    const short: TestDoc = { id: 'x', terms: { a: 1 }, length: 10 };
    const long: TestDoc = { id: 'y', terms: { a: 1 }, length: 200 };
    expect(bm25Score(long, ['a'], corpus, 1.2, 0)).toBeCloseTo(
      bm25Score(short, ['a'], corpus, 1.2, 0),
      12,
    );
    expect(bm25Score(long, ['a'], corpus, 1.2, 0.75)).toBeLessThan(
      bm25Score(short, ['a'], corpus, 1.2, 0.75),
    );
  });

  it('scores a rarer term higher', () => {
    const doc: TestDoc = { id: 'x', terms: { a: 1, c: 1 }, length: 10 };
    // 'a' is in two documents, 'c' in one.
    expect(bm25Score(doc, ['c'], corpus, 1.2, 0.75)).toBeGreaterThan(
      bm25Score(doc, ['a'], corpus, 1.2, 0.75),
    );
  });

  it('gives zero when no query term is present', () => {
    expect(bm25Score({ id: 'x', terms: { z: 5 }, length: 10 } satisfies TestDoc, ['a'], corpus, 1.2, 0.75)).toBe(0);
  });
});

describe('bandit policies', () => {
  const rng = makeRng(5);

  it('tries every untouched arm before comparing means', () => {
    const arms = [
      { pulls: 3, wins: 3 },
      { pulls: 0, wins: 0 },
    ];
    expect(selectArm('greedy', arms, 10, 0.1, rng)).toBe(1);
    expect(selectArm('ucb', arms, 10, 0.1, rng)).toBe(1);
  });

  it('greedy follows the best observed mean', () => {
    const arms = [
      { pulls: 10, wins: 2 },
      { pulls: 10, wins: 7 },
    ];
    expect(selectArm('greedy', arms, 20, 0, rng)).toBe(1);
  });

  it('UCB prefers the less explored arm when means are equal', () => {
    const arms = [
      { pulls: 100, wins: 20 },
      { pulls: 10, wins: 2 },
    ];
    expect(selectArm('ucb', arms, 110, 0, rng)).toBe(1);
  });

  it('UCB returns to the leader once the rare arm is explored enough', () => {
    const arms = [
      { pulls: 5000, wins: 2000 },
      { pulls: 4000, wins: 800 },
    ];
    expect(selectArm('ucb', arms, 9000, 0, rng)).toBe(0);
  });

  it('Thompson picks the better arm most of the time but not always', () => {
    const arms = [
      { pulls: 60, wins: 12 },
      { pulls: 60, wins: 24 },
    ];
    let better = 0;
    const draws = 400;
    const r = makeRng(99);
    for (let i = 0; i < draws; i += 1) {
      if (selectArm('thompson', arms, 120, 0, r) === 1) better += 1;
    }
    expect(better / draws).toBeGreaterThan(0.75);
    expect(better / draws).toBeLessThan(1);
  });

  it('eps-greedy explores roughly epsilon of the time', () => {
    const arms = [
      { pulls: 50, wins: 1 },
      { pulls: 50, wins: 40 },
    ];
    const r = makeRng(7);
    let explored = 0;
    const draws = 4000;
    for (let i = 0; i < draws; i += 1) {
      if (selectArm('epsilon', arms, 100, 0.2, r) === 0) explored += 1;
    }
    // Arm 0 is only chosen by the random branch, i.e. epsilon / 2 of the time.
    expect(explored / draws).toBeGreaterThan(0.07);
    expect(explored / draws).toBeLessThan(0.13);
  });
});
