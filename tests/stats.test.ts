import { describe, expect, it } from 'vitest';
import { makeRng } from '@/lib/rng';
import {
  benjaminiHochberg,
  bootstrapCi,
  cuped,
  mannWhitneyU,
  mean,
  normalCdf,
  normalQuantile,
  proportionMde,
  proportionPower,
  proportionSampleSize,
  ratioDeltaSe,
  tTestPValue,
  variance,
  wilsonInterval,
  zTestPValue,
} from '@/lib/stats';

describe('normal distribution helpers', () => {
  it('agrees with the textbook quantiles', () => {
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.95)).toBeCloseTo(1.644854, 5);
    expect(normalQuantile(0.5)).toBeCloseTo(0, 9);
  });

  it('is its own inverse', () => {
    for (const p of [0.01, 0.1, 0.33, 0.5, 0.8, 0.99]) {
      expect(normalCdf(normalQuantile(p))).toBeCloseTo(p, 6);
    }
  });

  it('turns a z of 1.96 into a p-value of 0.05', () => {
    expect(zTestPValue(1.959964)).toBeCloseTo(0.05, 5);
  });
});

describe("Student's t", () => {
  it('matches known two-sided p-values', () => {
    // t = 2.228 at 10 df is the 0.05 critical value.
    expect(tTestPValue(2.228139, 10)).toBeCloseTo(0.05, 4);
    // With many degrees of freedom it converges to the normal.
    expect(tTestPValue(1.959964, 100000)).toBeCloseTo(0.05, 3);
  });
});

describe('Mann-Whitney U', () => {
  it('reproduces a hand-computable example', () => {
    // a is uniformly below b, so U for a is 0.
    const res = mannWhitneyU([1, 2, 3], [4, 5, 6]);
    expect(res.u).toBe(0);
    expect(res.pValue).toBeLessThan(0.15);
  });

  it('finds no difference between identical groups', () => {
    const res = mannWhitneyU([1, 2, 3, 4], [1, 2, 3, 4]);
    expect(res.z).toBeCloseTo(0, 9);
    expect(res.pValue).toBeCloseTo(1, 9);
  });

  it('keeps its false positive rate on skewed data', () => {
    const rng = makeRng(42);
    let hits = 0;
    const REPS = 400;
    for (let r = 0; r < REPS; r += 1) {
      const a: number[] = [];
      const b: number[] = [];
      for (let i = 0; i < 60; i += 1) {
        a.push(rng.lognormal(0, 1.2));
        b.push(rng.lognormal(0, 1.2));
      }
      if (mannWhitneyU(a, b).pValue < 0.05) hits += 1;
    }
    expect(hits / REPS).toBeGreaterThan(0.02);
    expect(hits / REPS).toBeLessThan(0.09);
  });
});

describe('ratio metrics', () => {
  it('collapses to the binomial standard error with one event per user', () => {
    const rng = makeRng(7);
    const clicks: number[] = [];
    const ones: number[] = [];
    for (let i = 0; i < 4000; i += 1) {
      clicks.push(rng.bernoulli(0.25));
      ones.push(1);
    }
    const { ratio, se } = ratioDeltaSe(clicks, ones);
    const binomial = Math.sqrt((ratio * (1 - ratio)) / clicks.length);
    expect(se).toBeCloseTo(binomial, 5);
  });

  it('reports a larger error when users differ from each other', () => {
    const build = (spread: number) => {
      const rng = makeRng(99);
      const num: number[] = [];
      const den: number[] = [];
      for (let u = 0; u < 1500; u += 1) {
        const shows = 5 + rng.int(30);
        const p = Math.min(0.9, Math.max(0.01, 0.2 * (1 + rng.normal(0, spread))));
        let c = 0;
        for (let i = 0; i < shows; i += 1) if (rng.next() < p) c += 1;
        num.push(c);
        den.push(shows);
      }
      return ratioDeltaSe(num, den).se;
    };
    expect(build(0.9)).toBeGreaterThan(build(0) * 1.2);
  });

  it('keeps its promised coverage where the naive formula fails', () => {
    const rng = makeRng(2026);
    const trueCtr = 0.15;
    let deltaCovered = 0;
    let naiveCovered = 0;
    const REPS = 120;
    for (let r = 0; r < REPS; r += 1) {
      const num: number[] = [];
      const den: number[] = [];
      let totalC = 0;
      let totalS = 0;
      for (let u = 0; u < 400; u += 1) {
        const shows = 3 + rng.int(28);
        const p = Math.min(0.9, Math.max(0.005, trueCtr * (1 + rng.normal(0, 0.6))));
        let c = 0;
        for (let i = 0; i < shows; i += 1) if (rng.next() < p) c += 1;
        num.push(c);
        den.push(shows);
        totalC += c;
        totalS += shows;
      }
      const { ratio, se } = ratioDeltaSe(num, den);
      if (Math.abs(ratio - trueCtr) <= 1.96 * se) deltaCovered += 1;
      const naiveSe = Math.sqrt((ratio * (1 - ratio)) / totalS);
      if (Math.abs(ratio - trueCtr) <= 1.96 * naiveSe) naiveCovered += 1;
    }
    expect(deltaCovered / REPS).toBeGreaterThan(0.88);
    expect(naiveCovered / REPS).toBeLessThan(deltaCovered / REPS);
  });
});

describe('Benjamini-Hochberg', () => {
  it('rejects nothing when every p-value is large', () => {
    expect(benjaminiHochberg([0.4, 0.6, 0.9])).toEqual([]);
  });

  it('is at least as permissive as Bonferroni', () => {
    const ps = [0.001, 0.008, 0.02, 0.04, 0.3, 0.7];
    const bh = benjaminiHochberg(ps, 0.05);
    const bonf = ps.map((p, i) => ({ p, i })).filter((x) => x.p < 0.05 / ps.length).map((x) => x.i);
    for (const i of bonf) expect(bh).toContain(i);
    expect(bh.length).toBeGreaterThanOrEqual(bonf.length);
  });

  it('returns original indices, not sorted positions', () => {
    const rejected = benjaminiHochberg([0.9, 0.0001, 0.8], 0.05);
    expect(rejected).toEqual([1]);
  });
});

describe('CUPED', () => {
  it('removes the share of variance the correlation predicts', () => {
    for (const rho of [0.3, 0.6, 0.9]) {
      const rng = makeRng(13);
      const pre: number[] = [];
      const post: number[] = [];
      for (let i = 0; i < 20000; i += 1) {
        const base = rng.normal(0, 1);
        pre.push(base);
        post.push(rho * base + Math.sqrt(1 - rho * rho) * rng.normal(0, 1));
      }
      const { varianceRatio } = cuped(post, pre);
      expect(varianceRatio).toBeCloseTo(1 - rho * rho, 1);
    }
  });

  it('does not move the mean, so the effect estimate stays unbiased', () => {
    const rng = makeRng(5);
    const pre: number[] = [];
    const post: number[] = [];
    for (let i = 0; i < 5000; i += 1) {
      const base = rng.normal(0, 1);
      pre.push(base);
      post.push(2 + 0.7 * base + rng.normal(0, 1));
    }
    const { adjusted } = cuped(post, pre);
    expect(mean(adjusted)).toBeCloseTo(mean(post), 9);
    expect(variance(adjusted)).toBeLessThan(variance(post));
  });
});

describe('power and sample size', () => {
  it('is self-consistent: the MDE is detected with the target power', () => {
    const baseline = 0.2;
    const n = 50000;
    const mde = proportionMde(baseline, n, 0.05, 0.8);
    expect(proportionPower(baseline, baseline + mde, n, 0.05)).toBeCloseTo(0.8, 1);
  });

  it('needs four times the traffic for half the effect', () => {
    const small = proportionSampleSize(0.2, 0.002);
    const big = proportionSampleSize(0.2, 0.004);
    expect(small / big).toBeCloseTo(4, 0);
  });

  it('degenerates to alpha when there is no effect', () => {
    expect(proportionPower(0.2, 0.2, 10000, 0.05)).toBeCloseTo(0.05, 6);
  });
});

describe('bootstrap', () => {
  it('brackets the statistic and narrows with more data', () => {
    const rng = makeRng(3);
    const small: number[] = [];
    const big: number[] = [];
    for (let i = 0; i < 50; i += 1) small.push(rng.lognormal(0, 1));
    for (let i = 0; i < 2000; i += 1) big.push(rng.lognormal(0, 1));

    const a = bootstrapCi(small, mean, { b: 400, next: rng.next });
    const b = bootstrapCi(big, mean, { b: 400, next: rng.next });
    expect(a.lo).toBeLessThan(a.point);
    expect(a.point).toBeLessThan(a.hi);
    expect(b.hi - b.lo).toBeLessThan(a.hi - a.lo);
  });

  it('works for a statistic with no standard error formula', () => {
    const rng = makeRng(8);
    const data: number[] = [];
    for (let i = 0; i < 400; i += 1) data.push(rng.lognormal(0, 1));
    const median = (xs: readonly number[]) => {
      const sorted = [...xs].sort((x, y) => x - y);
      return sorted[Math.floor(sorted.length / 2)];
    };
    const ci = bootstrapCi(data, median, { b: 300, next: rng.next });
    expect(ci.lo).toBeLessThan(ci.hi);
    expect(ci.lo).toBeLessThan(ci.point);
  });
});

describe('Wilson interval', () => {
  it('does not collapse at zero successes', () => {
    const [lo, hi] = wilsonInterval(0, 500);
    expect(lo).toBe(0);
    expect(hi).toBeGreaterThan(0);
    expect(hi).toBeLessThan(0.02);
  });

  it('is symmetric under swapping successes and failures', () => {
    const [lo, hi] = wilsonInterval(7, 40);
    const [mlo, mhi] = wilsonInterval(33, 40);
    expect(lo).toBeCloseTo(1 - mhi, 12);
    expect(hi).toBeCloseTo(1 - mlo, 12);
  });
});
