/**
 * The statistics the trainer itself needs: tests, intervals, power.
 * Implemented here rather than pulled from a library so the simulators,
 * the write-ups and the reference solutions all agree to the last digit.
 */

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Unbiased (n-1) variance. */
export function variance(xs: readonly number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (n - 1);
}

export function sd(xs: readonly number[]): number {
  return Math.sqrt(variance(xs));
}

export function quantile(sorted: readonly number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

/** Abramowitz & Stegun 7.1.26 style erf, ~1e-7 absolute error. */
export function erf(x: number): number {
  const sign = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.5 * a);
  const y =
    t *
    Math.exp(
      -a * a -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return sign * (1 - y);
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Inverse normal CDF (Acklam's rational approximation, ~1e-9). */
export function normalQuantile(p: number): number {
  if (p <= 0) return Number.NEGATIVE_INFINITY;
  if (p >= 1) return Number.POSITIVE_INFINITY;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416];
  const pLow = 0.02425;
  let q: number;
  let r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= 1 - pLow) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/** Two-sided p-value for a z statistic. */
export function zTestPValue(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

export function logGamma(x: number): number {
  // Lanczos approximation.
  const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let a = 0.99999999999980993;
  const t = z + 7.5;
  for (let i = 0; i < g.length; i += 1) a += g[i] / (z + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularized incomplete beta, continued fraction (Numerical Recipes). */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a + b) - logGamma(a) - logGamma(b);
  const front = Math.exp(lbeta + a * Math.log(x) + b * Math.log(1 - x));
  const useComplement = x > (a + 1) / (a + b + 2);
  if (useComplement) return 1 - incompleteBeta(b, a, 1 - x);

  let f = 1;
  let c = 1;
  let d = 0;
  const tiny = 1e-30;
  for (let i = 0; i <= 300; i += 1) {
    const m = Math.floor(i / 2);
    let numerator: number;
    if (i === 0) numerator = 1;
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));

    d = 1 + numerator * d;
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < tiny) c = tiny;
    f *= c * d;
    if (Math.abs(1 - c * d) < 1e-12) break;
  }
  return (front * (f - 1)) / a;
}

/** Two-sided p-value for Student's t with df degrees of freedom. */
export function tTestPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return incompleteBeta(df / 2, 0.5, x);
}

export type TestResult = {
  statistic: number;
  pValue: number;
  df?: number;
  diff: number;
  ciLow: number;
  ciHigh: number;
};

/** Welch two-sample t-test on raw observations. */
export function welchTTest(a: readonly number[], b: readonly number[], alpha = 0.05): TestResult {
  const na = a.length;
  const nb = b.length;
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a) / na;
  const vb = variance(b) / nb;
  const se = Math.sqrt(va + vb);
  const t = (mb - ma) / se;
  const df = (va + vb) ** 2 / (va ** 2 / (na - 1) + vb ** 2 / (nb - 1));
  const crit = Math.abs(normalQuantile(1 - alpha / 2));
  return {
    statistic: t,
    pValue: tTestPValue(t, df),
    df,
    diff: mb - ma,
    ciLow: mb - ma - crit * se,
    ciHigh: mb - ma + crit * se,
  };
}

/** Two-proportion z-test with a pooled standard error, as used for CR/CTR. */
export function twoProportionZTest(
  xa: number,
  na: number,
  xb: number,
  nb: number,
  alpha = 0.05,
): TestResult {
  const pa = xa / na;
  const pb = xb / nb;
  const pooled = (xa + xb) / (na + nb);
  const sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb));
  const z = sePooled === 0 ? 0 : (pb - pa) / sePooled;
  const seUnpooled = Math.sqrt((pa * (1 - pa)) / na + (pb * (1 - pb)) / nb);
  const crit = Math.abs(normalQuantile(1 - alpha / 2));
  return {
    statistic: z,
    pValue: zTestPValue(z),
    diff: pb - pa,
    ciLow: pb - pa - crit * seUnpooled,
    ciHigh: pb - pa + crit * seUnpooled,
  };
}

/** Normal-approximation ("Wald") interval for a proportion. */
export function waldInterval(x: number, n: number, alpha = 0.05): [number, number] {
  const p = x / n;
  const z = Math.abs(normalQuantile(1 - alpha / 2));
  const half = z * Math.sqrt((p * (1 - p)) / n);
  return [p - half, p + half];
}

/** Wilson score interval, the one that actually keeps its coverage promise. */
export function wilsonInterval(x: number, n: number, alpha = 0.05): [number, number] {
  const z = Math.abs(normalQuantile(1 - alpha / 2));
  const p = x / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  // At the edges the bounds are exactly 0 and 1; floating point lands a
  // fraction of 1e-18 off, which looks like noise in a coverage plot.
  const lo = x === 0 ? 0 : Math.max(0, center - half);
  const hi = x === n ? 1 : Math.min(1, center + half);
  return [lo, hi];
}

/** t-interval for a mean. */
export function meanInterval(xs: readonly number[], alpha = 0.05): [number, number] {
  const m = mean(xs);
  const se = sd(xs) / Math.sqrt(xs.length);
  const z = Math.abs(normalQuantile(1 - alpha / 2));
  return [m - z * se, m + z * se];
}

/**
 * Power of a two-sided two-proportion test.
 * Uses the pooled-variance form, which matches what the A/B calculators do.
 */
export function proportionPower(
  p1: number,
  p2: number,
  nPerGroup: number,
  alpha = 0.05,
): number {
  if (nPerGroup <= 0) return 0;
  const pBar = (p1 + p2) / 2;
  const se0 = Math.sqrt(2 * pBar * (1 - pBar) / nPerGroup);
  const se1 = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / nPerGroup);
  const zAlpha = Math.abs(normalQuantile(1 - alpha / 2));
  const delta = Math.abs(p2 - p1);
  if (delta === 0) return alpha;
  const upper = (delta - zAlpha * se0) / se1;
  const lower = (-delta - zAlpha * se0) / se1;
  return normalCdf(upper) + normalCdf(lower);
}

/** Minimum detectable effect in absolute terms, for a given power. */
export function proportionMde(
  p1: number,
  nPerGroup: number,
  alpha = 0.05,
  power = 0.8,
): number {
  if (nPerGroup <= 0) return NaN;
  const zAlpha = Math.abs(normalQuantile(1 - alpha / 2));
  const zBeta = Math.abs(normalQuantile(power));
  // Solve with the pooled variance at p1, then refine once with p2.
  const rough = (zAlpha + zBeta) * Math.sqrt((2 * p1 * (1 - p1)) / nPerGroup);
  const p2 = Math.min(0.999999, p1 + rough);
  const pBar = (p1 + p2) / 2;
  return (zAlpha + zBeta) * Math.sqrt((2 * pBar * (1 - pBar)) / nPerGroup);
}

/** Sample size per group for a target absolute lift. */
export function proportionSampleSize(
  p1: number,
  absoluteLift: number,
  alpha = 0.05,
  power = 0.8,
): number {
  const p2 = p1 + absoluteLift;
  const zAlpha = Math.abs(normalQuantile(1 - alpha / 2));
  const zBeta = Math.abs(normalQuantile(power));
  const pBar = (p1 + p2) / 2;
  const n =
    ((zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) **
      2) /
    (absoluteLift * absoluteLift);
  return Math.ceil(n);
}

/** Equal-width histogram. Returns bin centers and counts. */
export function histogram(
  xs: readonly number[],
  bins: number,
  range?: [number, number],
): { centers: number[]; counts: number[]; width: number; lo: number; hi: number } {
  const lo = range ? range[0] : Math.min(...xs);
  const hi = range ? range[1] : Math.max(...xs);
  const span = hi - lo || 1;
  const width = span / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const x of xs) {
    if (x < lo || x > hi) continue;
    const idx = Math.min(bins - 1, Math.floor((x - lo) / width));
    counts[idx] += 1;
  }
  const centers = counts.map((_, i) => lo + width * (i + 0.5));
  return { centers, counts, width, lo, hi };
}

/**
 * Mann-Whitney U with the normal approximation and a tie correction.
 * This is the test to reach for when the data is skewed and the question is
 * "does one group tend to be larger", not "are the means equal".
 */
export function mannWhitneyU(
  a: readonly number[],
  b: readonly number[],
): { u: number; z: number; pValue: number } {
  const na = a.length;
  const nb = b.length;
  if (na === 0 || nb === 0) return { u: NaN, z: NaN, pValue: NaN };

  const combined = [
    ...a.map((v) => ({ v, group: 0 })),
    ...b.map((v) => ({ v, group: 1 })),
  ].sort((x, y) => x.v - y.v);

  // Average ranks within ties, and collect tie group sizes for the correction.
  const ranks = new Array<number>(combined.length);
  const tieSizes: number[] = [];
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j + 1 < combined.length && combined[j + 1].v === combined[i].v) j += 1;
    const avg = (i + j + 2) / 2; // ranks are 1-based
    for (let k = i; k <= j; k += 1) ranks[k] = avg;
    if (j > i) tieSizes.push(j - i + 1);
    i = j + 1;
  }

  let rankSumA = 0;
  combined.forEach((item, idx) => {
    if (item.group === 0) rankSumA += ranks[idx];
  });

  const uA = rankSumA - (na * (na + 1)) / 2;
  const n = na + nb;
  const meanU = (na * nb) / 2;
  const tieTerm = tieSizes.reduce((acc, t) => acc + (t * t * t - t), 0);
  const varU = ((na * nb) / 12) * (n + 1 - tieTerm / (n * (n - 1)));
  const z = varU > 0 ? (uA - meanU) / Math.sqrt(varU) : 0;
  return { u: uA, z, pValue: zTestPValue(z) };
}

/**
 * Percentile bootstrap confidence interval for an arbitrary statistic.
 * Deterministic: the caller supplies the generator, so a write-up and the
 * picture next to it always show the same numbers.
 */
export function bootstrapCi(
  data: readonly number[],
  statistic: (sample: readonly number[]) => number,
  options: { b: number; alpha?: number; next: () => number },
): { lo: number; hi: number; estimates: number[]; point: number } {
  const { b, alpha = 0.05, next } = options;
  const n = data.length;
  const estimates: number[] = [];
  const sample = new Array<number>(n);
  for (let r = 0; r < b; r += 1) {
    for (let i = 0; i < n; i += 1) sample[i] = data[Math.floor(next() * n)];
    estimates.push(statistic(sample));
  }
  const sorted = [...estimates].sort((x, y) => x - y);
  return {
    lo: quantile(sorted, alpha / 2),
    hi: quantile(sorted, 1 - alpha / 2),
    estimates,
    point: statistic(data),
  };
}

/**
 * Delta-method standard error of a ratio of sums, clustered by user.
 * This is what an experiment platform computes for CTR when randomisation is
 * by user: each user contributes one (numerator, denominator) pair.
 */
export function ratioDeltaSe(
  numerators: readonly number[],
  denominators: readonly number[],
): { ratio: number; se: number } {
  const n = numerators.length;
  if (n < 2) return { ratio: NaN, se: NaN };
  const mx = mean(numerators);
  const my = mean(denominators);
  const ratio = mx / my;
  let vx = 0;
  let vy = 0;
  let cxy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = numerators[i] - mx;
    const dy = denominators[i] - my;
    vx += dx * dx;
    vy += dy * dy;
    cxy += dx * dy;
  }
  vx /= n - 1;
  vy /= n - 1;
  cxy /= n - 1;
  const varRatio =
    (vx / (my * my) - (2 * mx * cxy) / (my * my * my) + (mx * mx * vy) / (my * my * my * my)) / n;
  return { ratio, se: Math.sqrt(Math.max(0, varRatio)) };
}

/** Benjamini-Hochberg: returns the indices of the rejected hypotheses. */
export function benjaminiHochberg(pValues: readonly number[], alpha = 0.05): number[] {
  const m = pValues.length;
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  let kMax = -1;
  for (let k = 0; k < m; k += 1) {
    if (order[k].p <= ((k + 1) / m) * alpha) kMax = k;
  }
  if (kMax < 0) return [];
  return order.slice(0, kMax + 1).map((o) => o.i);
}

/** CUPED-adjusted values: y - theta * (x - mean(x)), with the optimal theta. */
export function cuped(
  y: readonly number[],
  x: readonly number[],
): { adjusted: number[]; theta: number; varianceRatio: number } {
  const n = y.length;
  const my = mean(y);
  const mx = mean(x);
  let cov = 0;
  let varX = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (y[i] - my) * (x[i] - mx);
    varX += (x[i] - mx) * (x[i] - mx);
  }
  cov /= n - 1;
  varX /= n - 1;
  const theta = varX === 0 ? 0 : cov / varX;
  const adjusted = y.map((v, i) => v - theta * (x[i] - mx));
  return { adjusted, theta, varianceRatio: variance(adjusted) / variance(y) };
}
