import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { makeRng, type Rng } from '@/lib/rng';
import {
  histogram,
  mean,
  normalPdf,
  normalQuantile,
  sd,
  waldInterval,
  wilsonInterval,
} from '@/lib/stats';
import { Area, Bars, Dots, HLine, Intervals, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ---------------------------------------------------------- distributions -- */

type DistId = 'normal' | 'uniform' | 'exponential' | 'bernoulli' | 'lognormal' | 'poisson';

type DistSpec = {
  label: ReturnType<typeof l>;
  sample: (rng: Rng, p: number) => number;
  /** Theoretical density, where a density exists. */
  pdf?: (x: number, p: number) => number;
  mean: (p: number) => number;
  sd: (p: number) => number;
  domain: (p: number) => [number, number];
  paramLabel: ReturnType<typeof l>;
  paramRange: [number, number, number];
  discrete?: boolean;
};

const DISTS: Record<DistId, DistSpec> = {
  normal: {
    label: l('Нормальное', 'Normal'),
    sample: (rng, s) => rng.normal(0, s),
    pdf: (x, s) => normalPdf(x, 0, s),
    mean: () => 0,
    sd: (s) => s,
    domain: (s) => [-4 * s, 4 * s],
    paramLabel: l('Сигма', 'Sigma'),
    paramRange: [0.5, 3, 0.1],
  },
  uniform: {
    label: l('Равномерное', 'Uniform'),
    sample: (rng, b) => rng.next() * b,
    pdf: (x, b) => (x >= 0 && x <= b ? 1 / b : 0),
    mean: (b) => b / 2,
    sd: (b) => b / Math.sqrt(12),
    domain: (b) => [-0.1 * b, 1.1 * b],
    paramLabel: l('Правый конец', 'Upper bound'),
    paramRange: [1, 10, 0.5],
  },
  exponential: {
    label: l('Экспоненциальное', 'Exponential'),
    sample: (rng, rate) => rng.exponential(rate),
    pdf: (x, rate) => (x >= 0 ? rate * Math.exp(-rate * x) : 0),
    mean: (rate) => 1 / rate,
    sd: (rate) => 1 / rate,
    domain: (rate) => [0, 6 / rate],
    paramLabel: l('Интенсивность', 'Rate'),
    paramRange: [0.2, 3, 0.1],
  },
  bernoulli: {
    label: l('Бернулли (клик / не клик)', 'Bernoulli (click / no click)'),
    sample: (rng, p) => rng.bernoulli(p),
    mean: (p) => p,
    sd: (p) => Math.sqrt(p * (1 - p)),
    domain: () => [-0.5, 1.5],
    paramLabel: l('Вероятность p', 'Probability p'),
    paramRange: [0.02, 0.9, 0.01],
    discrete: true,
  },
  lognormal: {
    label: l('Логнормальное (выручка)', 'Lognormal (revenue)'),
    sample: (rng, s) => rng.lognormal(0, s),
    pdf: (x, s) => (x > 0 ? normalPdf(Math.log(x), 0, s) / x : 0),
    mean: (s) => Math.exp((s * s) / 2),
    sd: (s) => Math.sqrt((Math.exp(s * s) - 1) * Math.exp(s * s)),
    domain: (s) => [0, Math.exp(2 * s) * 3],
    paramLabel: l('Сигма логарифма', 'Log sigma'),
    paramRange: [0.3, 1.5, 0.05],
  },
  poisson: {
    label: l('Пуассона (заказы за день)', 'Poisson (orders per day)'),
    sample: (rng, lam) => rng.poisson(lam),
    mean: (lam) => lam,
    sd: (lam) => Math.sqrt(lam),
    domain: (lam) => [-0.5, lam + 4 * Math.sqrt(lam) + 1],
    paramLabel: l('Лямбда', 'Lambda'),
    paramRange: [0.5, 12, 0.5],
    discrete: true,
  },
};

const DIST_OPTIONS = (Object.keys(DISTS) as DistId[]).map((id) => ({
  value: id,
  label: DISTS[id].label,
}));

export function DistributionExplorer() {
  const [dist, setDist] = useState<DistId>('normal');
  const [param, setParam] = useState(1);
  const [n, setN] = useState(500);
  const [seed, setSeed] = useState(1);

  const spec = DISTS[dist];
  // Keep the parameter inside the range of the distribution just picked.
  const [lo, hi, step] = spec.paramRange;
  const p = Math.min(hi, Math.max(lo, param));

  const data = useMemo(() => {
    const rng = makeRng(seed * 7919 + n);
    const xs: number[] = [];
    for (let i = 0; i < n; i += 1) xs.push(spec.sample(rng, p));
    const domain = spec.domain(p);
    const bins = spec.discrete ? Math.max(2, Math.round(domain[1] - domain[0])) : 28;
    const h = histogram(xs, bins, domain);
    const total = xs.length * h.width;
    const density = h.counts.map((c) => c / total);
    const curve: Array<[number, number]> = [];
    if (spec.pdf) {
      for (let i = 0; i <= 160; i += 1) {
        const x = domain[0] + ((domain[1] - domain[0]) * i) / 160;
        curve.push([x, spec.pdf(x, p)]);
      }
    }
    const yMax = Math.max(...density, ...curve.map((c) => c[1]), 1e-6) * 1.15;
    return { xs, h, density, curve, domain, yMax };
  }, [dist, p, n, seed, spec]);

  return (
    <>
      <div className="controls">
        <Select label={l('Распределение', 'Distribution')} value={dist} options={DIST_OPTIONS}
          onChange={(v) => { setDist(v); setParam(Math.min(DISTS[v].paramRange[1], Math.max(DISTS[v].paramRange[0], param))); }} />
        <Slider label={spec.paramLabel} value={p} min={lo} max={hi} step={step}
          onChange={setParam} format={(v) => v.toFixed(2)} />
        <Slider label={l('Размер выборки', 'Sample size')} value={n} min={20} max={5000} step={20}
          onChange={setN} format={(v) => String(v)} />
      </div>

      <Plot
        xDomain={data.domain}
        yDomain={[0, data.yMax]}
        xLabel="x"
        yLabel="density"
        ariaLabel="distribution histogram"
      >
        {(s) => (
          <>
            <Bars centers={data.h.centers} values={data.density} binWidth={data.h.width} s={s}
              color="var(--series-1)" opacity={0.55} />
            {data.curve.length > 0 && <Line points={data.curve} s={s} color="var(--series-2)" width={2} />}
            <VLine at={mean(data.xs)} s={s} color="var(--series-4)" dashed={false} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'histogram' },
          { color: 'var(--series-2)', label: 'true density' },
          { color: 'var(--series-4)', label: 'sample mean' },
        ]}
      />

      <div className="readouts">
        <Readout label={l('Среднее выборки', 'Sample mean')} value={mean(data.xs).toFixed(3)} />
        <Readout label={l('Истинное среднее', 'True mean')} value={spec.mean(p).toFixed(3)} />
        <Readout label={l('SD выборки', 'Sample SD')} value={sd(data.xs).toFixed(3)} />
        <Readout label={l('Истинное SD', 'True SD')} value={spec.sd(p).toFixed(3)} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ----------------------------------------------------------- sampling noise -- */

export function SamplingNoise() {
  const [pTrue, setPTrue] = useState(0.2);
  const [seed, setSeed] = useState(3);
  const N = 3000;

  const data = useMemo(() => {
    const rng = makeRng(seed * 104729);
    const path: Array<[number, number]> = [];
    const upper: Array<[number, number]> = [];
    const lower: Array<[number, number]> = [];
    let hits = 0;
    const sigma = Math.sqrt(pTrue * (1 - pTrue));
    for (let i = 1; i <= N; i += 1) {
      hits += rng.bernoulli(pTrue);
      if (i % 5 === 0 || i < 40) {
        path.push([i, hits / i]);
        const half = (2 * sigma) / Math.sqrt(i);
        upper.push([i, pTrue + half]);
        lower.push([i, pTrue - half]);
      }
    }
    const final = hits / N;
    return { path, upper, lower, final };
  }, [pTrue, seed]);

  // Frame the chart around the band at small n, where the wobble actually lives.
  const yPad = Math.max(0.02, (2.6 * Math.sqrt(pTrue * (1 - pTrue))) / Math.sqrt(25));
  return (
    <>
      <div className="controls">
        <Slider label={l('Истинная конверсия p', 'True conversion p')} value={pTrue} min={0.02} max={0.6}
          step={0.01} onChange={setPTrue} format={(v) => `${(v * 100).toFixed(0)}%`} />
      </div>
      <Plot
        xDomain={[1, N]}
        yDomain={[Math.max(0, pTrue - yPad), pTrue + yPad]}
        xLabel="n"
        yLabel="p̂"
        formatY={(v) => `${(v * 100).toFixed(1)}%`}
        ariaLabel="running conversion estimate"
      >
        {(s) => (
          <>
            <Line points={data.upper} s={s} color="var(--text-faint)" width={1} dashed />
            <Line points={data.lower} s={s} color="var(--text-faint)" width={1} dashed />
            <HLine at={pTrue} s={s} color="var(--series-2)" dashed={false} />
            <Line points={data.path} s={s} color="var(--series-1)" width={1.6} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'running estimate' },
          { color: 'var(--series-2)', label: 'true p' },
          { color: 'var(--text-faint)', label: '±2σ/√n' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Оценка на n=100', 'Estimate at n=100')}
          value={`${((data.path.find((pt) => pt[0] >= 100)?.[1] ?? 0) * 100).toFixed(2)}%`} />
        <Readout label={l('Оценка на n=3000', 'Estimate at n=3000')} value={`${(data.final * 100).toFixed(2)}%`} />
        <Readout label={l('Ширина коридора на n=100', 'Band width at n=100')}
          value={`±${((2 * Math.sqrt(pTrue * (1 - pTrue))) / 10 * 100).toFixed(2)} pp`} />
        <Readout label={l('На n=3000', 'At n=3000')}
          value={`±${((2 * Math.sqrt(pTrue * (1 - pTrue))) / Math.sqrt(3000) * 100).toFixed(2)} pp`} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* --------------------------------------------------------------------- CLT -- */

export function Clt() {
  const [dist, setDist] = useState<DistId>('exponential');
  const [n, setN] = useState(5);
  const [seed, setSeed] = useState(11);
  const REPS = 1500;

  const spec = DISTS[dist];
  const param = (spec.paramRange[0] + spec.paramRange[1]) / 2;

  const data = useMemo(() => {
    const rng = makeRng(seed * 7717 + n);
    const means: number[] = [];
    for (let r = 0; r < REPS; r += 1) {
      let acc = 0;
      for (let i = 0; i < n; i += 1) acc += spec.sample(rng, param);
      means.push(acc / n);
    }
    const mu = spec.mean(param);
    const se = spec.sd(param) / Math.sqrt(n);
    const domain: [number, number] = [mu - 4.2 * se, mu + 4.2 * se];
    const h = histogram(means, 34, domain);
    const total = means.length * h.width;
    const density = h.counts.map((c) => c / total);
    const curve: Array<[number, number]> = [];
    for (let i = 0; i <= 160; i += 1) {
      const x = domain[0] + ((domain[1] - domain[0]) * i) / 160;
      curve.push([x, normalPdf(x, mu, se)]);
    }
    const yMax = Math.max(...density, ...curve.map((c) => c[1])) * 1.15;
    return { means, h, density, curve, domain, yMax, mu, se };
  }, [dist, n, seed, spec, param]);

  return (
    <>
      <div className="controls">
        <Select label={l('Распределение одного наблюдения', 'Distribution of one observation')}
          value={dist} options={DIST_OPTIONS} onChange={setDist} />
        <Slider label={l('Размер выборки n', 'Sample size n')} value={n} min={1} max={120} step={1}
          onChange={setN} format={(v) => String(v)} />
      </div>
      <Plot xDomain={data.domain} yDomain={[0, data.yMax]} xLabel="mean of n observations" yLabel="density"
        ariaLabel="distribution of sample means">
        {(s) => (
          <>
            <Bars centers={data.h.centers} values={data.density} binWidth={data.h.width} s={s}
              color="var(--series-1)" opacity={0.55} />
            <Line points={data.curve} s={s} color="var(--series-2)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: `means of n=${n}` },
          { color: 'var(--series-2)', label: 'normal(mu, sigma/sqrt(n))' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('SD средних (симуляция)', 'SD of means (simulated)')} value={sd(data.means).toFixed(4)} />
        <Readout label={l('sigma/sqrt(n) (теория)', 'sigma/sqrt(n) (theory)')} value={data.se.toFixed(4)} />
        <Readout label={l('Среднее средних', 'Mean of means')} value={mean(data.means).toFixed(4)} />
        <Readout label={l('Истинное среднее', 'True mean')} value={data.mu.toFixed(4)} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** How fast the error of the mean actually shrinks: the 1/sqrt(n) law, measured. */
export function CltErrorDecay() {
  const [dist, setDist] = useState<DistId>('lognormal');
  const [seed, setSeed] = useState(5);
  const REPS = 300;
  const NS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

  const spec = DISTS[dist];
  const param = (spec.paramRange[0] + spec.paramRange[1]) / 2;

  const data = useMemo(() => {
    const rng = makeRng(seed * 31337);
    const mu = spec.mean(param);
    const points: Array<[number, number]> = [];
    for (const n of NS) {
      let sq = 0;
      for (let r = 0; r < REPS; r += 1) {
        let acc = 0;
        for (let i = 0; i < n; i += 1) acc += spec.sample(rng, param);
        const err = acc / n - mu;
        sq += err * err;
      }
      points.push([Math.log10(n), Math.log10(Math.sqrt(sq / REPS))]);
    }
    // Least squares slope: the measured exponent of the decay.
    const xs = points.map((pt) => pt[0]);
    const ys = points.map((pt) => pt[1]);
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i += 1) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    const slope = num / den;
    const ref: Array<[number, number]> = points.map(([lx]) => [
      lx,
      my - 0.5 * (lx - mx),
    ]);
    return { points, slope, ref };
  }, [dist, seed, spec, param]);

  const yVals = data.points.map((pt) => pt[1]);
  return (
    <>
      <div className="controls">
        <Select label={l('Распределение', 'Distribution')} value={dist} options={DIST_OPTIONS} onChange={setDist} />
      </div>
      <Plot
        xDomain={[Math.log10(2) - 0.15, Math.log10(1024) + 0.15]}
        yDomain={[Math.min(...yVals) - 0.2, Math.max(...yVals) + 0.2]}
        xLabel="log10 n"
        yLabel="log10 RMSE"
        ariaLabel="error of the mean versus sample size, log-log"
      >
        {(s) => (
          <>
            <Line points={data.ref} s={s} color="var(--text-faint)" dashed width={1.5} />
            <Line points={data.points} s={s} color="var(--series-1)" width={2} />
            <Dots points={data.points} s={s} color="var(--series-1)" r={3} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'measured RMSE' },
          { color: 'var(--text-faint)', label: 'slope -1/2 reference' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Измеренный наклон', 'Measured slope')} value={data.slope.toFixed(3)} />
        <Readout label={l('Теоретический наклон', 'Theoretical slope')} value="-0.500" />
        <Readout label={l('Во сколько раз точнее при n×100', 'Accuracy gain at n×100')}
          value={`${(100 ** -data.slope).toFixed(1)}x`} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ----------------------------------------------------- confidence intervals -- */

type CiMethod = 'wald' | 'wilson';

export function CiCoverage() {
  const [pTrue, setPTrue] = useState(0.1);
  const [n, setN] = useState(100);
  const [conf, setConf] = useState(0.95);
  const [method, setMethod] = useState<CiMethod>('wald');
  const [seed, setSeed] = useState(2);
  const ROWS = 100;

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863 + n);
    const alpha = 1 - conf;
    const items: Array<{ lo: number; hi: number; center: number; row: number; ok: boolean }> = [];
    let covered = 0;
    for (let r = 0; r < ROWS; r += 1) {
      let x = 0;
      for (let i = 0; i < n; i += 1) x += rng.bernoulli(pTrue);
      const [lo, hi] = method === 'wald' ? waldInterval(x, n, alpha) : wilsonInterval(x, n, alpha);
      const ok = lo <= pTrue && pTrue <= hi;
      if (ok) covered += 1;
      items.push({ lo, hi, center: x / n, row: r, ok });
    }
    return { items, coverage: covered / ROWS };
  }, [pTrue, n, conf, method, seed]);

  const span = Math.max(0.08, 3.5 * Math.sqrt((pTrue * (1 - pTrue)) / n));
  return (
    <>
      <div className="controls">
        <Slider label={l('Истинное p', 'True p')} value={pTrue} min={0.01} max={0.5} step={0.01}
          onChange={setPTrue} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label={l('Размер выборки n', 'Sample size n')} value={n} min={10} max={1000} step={10}
          onChange={setN} format={(v) => String(v)} />
        <Slider label={l('Уровень доверия', 'Confidence level')} value={conf} min={0.8} max={0.99} step={0.01}
          onChange={setConf} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Select label={l('Метод интервала', 'Interval method')} value={method}
          options={[
            { value: 'wald', label: l('Нормальное приближение (Wald)', 'Normal approximation (Wald)') },
            { value: 'wilson', label: l('Вильсона (Wilson)', 'Wilson score') },
          ]}
          onChange={setMethod} />
      </div>
      <Plot
        xDomain={[Math.max(-0.02, pTrue - span), pTrue + span]}
        yDomain={[-1, ROWS]}
        yTicks={[0, 25, 50, 75, 100]}
        xLabel="p"
        yLabel="experiment"
        formatX={(v) => `${(v * 100).toFixed(1)}%`}
        ariaLabel="one hundred confidence intervals"
        height={260}
      >
        {(s) => (
          <>
            <Intervals items={data.items} s={s} />
            <VLine at={pTrue} s={s} color="var(--text)" dashed={false} width={1} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Фактическое покрытие', 'Actual coverage')} value={`${(data.coverage * 100).toFixed(0)}%`}
          tone={Math.abs(data.coverage - conf) <= 0.04 ? 'ok' : 'bad'} />
        <Readout label={l('Обещанное покрытие', 'Nominal coverage')} value={`${(conf * 100).toFixed(0)}%`} />
        <Readout label={l('Промахов из 100', 'Misses out of 100')}
          value={String(Math.round((1 - data.coverage) * ROWS))} />
        <Readout label={l('n·p (правило ≥ 10)', 'n·p (rule of thumb ≥ 10)')} value={(n * pTrue).toFixed(1)}
          tone={n * pTrue >= 10 ? 'ok' : 'bad'} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

export function CiWidth() {
  const [pTrue, setPTrue] = useState(0.05);
  const levels = [0.9, 0.95, 0.99];
  const colors = ['var(--series-3)', 'var(--series-1)', 'var(--series-2)'];

  const curves = useMemo(
    () =>
      levels.map((conf) => {
        const z = Math.abs(normalQuantile(1 - (1 - conf) / 2));
        const pts: Array<[number, number]> = [];
        for (let i = 0; i <= 120; i += 1) {
          const n = 50 * 1.08 ** i;
          if (n > 200000) break;
          pts.push([Math.log10(n), 2 * z * Math.sqrt((pTrue * (1 - pTrue)) / n) * 100]);
        }
        return pts;
      }),
    [pTrue],
  );

  const nFor = (targetPp: number, conf: number) => {
    const z = Math.abs(normalQuantile(1 - (1 - conf) / 2));
    return Math.ceil((4 * z * z * pTrue * (1 - pTrue)) / (targetPp / 100) ** 2);
  };

  return (
    <>
      <div className="controls">
        <Slider label={l('Конверсия p', 'Conversion p')} value={pTrue} min={0.005} max={0.5} step={0.005}
          onChange={setPTrue} format={(v) => `${(v * 100).toFixed(1)}%`} />
      </div>
      <Plot
        xDomain={[Math.log10(50), Math.log10(200000)]}
        yDomain={[0, 2 * 2.58 * Math.sqrt((pTrue * (1 - pTrue)) / 50) * 100]}
        xLabel="log10 n"
        yLabel="CI width, pp"
        ariaLabel="confidence interval width versus sample size"
      >
        {(s) => (
          <>
            {curves.map((pts, i) => (
              <Line key={i} points={pts} s={s} color={colors[i]} width={2} />
            ))}
          </>
        )}
      </Plot>
      <Legend items={levels.map((conf, i) => ({ color: colors[i], label: `${conf * 100}%` }))} />
      <div className="readouts">
        <Readout label={l('n для ширины 1 пп, 95%', 'n for 1 pp width, 95%')}
          value={nFor(1, 0.95).toLocaleString('en-US')} />
        <Readout label={l('n для 0.5 пп, 95%', 'n for 0.5 pp, 95%')}
          value={nFor(0.5, 0.95).toLocaleString('en-US')} />
        <Readout label={l('Во сколько раз дороже 0.5 пп', 'Cost ratio of halving')}
          value={`${(nFor(0.5, 0.95) / nFor(1, 0.95)).toFixed(1)}x`} />
      </div>
    </>
  );
}

/** Where the normal approximation quietly breaks: small n, small p. */
export function CiWaldVsWilson() {
  const [n, setN] = useState(60);
  const [seed, setSeed] = useState(4);
  const REPS = 1200;
  const conf = 0.95;

  const data = useMemo(() => {
    const rng = makeRng(seed * 2654435761 + n);
    const ps: number[] = [];
    for (let i = 1; i <= 25; i += 1) ps.push(i / 50); // 0.02 .. 0.5
    const wald: Array<[number, number]> = [];
    const wilson: Array<[number, number]> = [];
    for (const p of ps) {
      let cw = 0;
      let cs = 0;
      for (let r = 0; r < REPS; r += 1) {
        let x = 0;
        for (let i = 0; i < n; i += 1) x += rng.bernoulli(p);
        const [wl, wh] = waldInterval(x, n, 1 - conf);
        const [sl, sh] = wilsonInterval(x, n, 1 - conf);
        if (wl <= p && p <= wh) cw += 1;
        if (sl <= p && p <= sh) cs += 1;
      }
      wald.push([p, cw / REPS]);
      wilson.push([p, cs / REPS]);
    }
    const worstWald = wald.reduce((m, pt) => Math.min(m, pt[1]), 1);
    const worstWilson = wilson.reduce((m, pt) => Math.min(m, pt[1]), 1);
    return { wald, wilson, worstWald, worstWilson };
  }, [n, seed]);

  return (
    <>
      <div className="controls">
        <Slider label={l('Размер выборки n', 'Sample size n')} value={n} min={10} max={200} step={5}
          onChange={setN} format={(v) => String(v)} />
      </div>
      <Plot
        xDomain={[0, 0.52]}
        yDomain={[0.6, 1.0]}
        xLabel="true p"
        yLabel="coverage"
        formatX={(v) => `${(v * 100).toFixed(0)}%`}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="coverage of Wald and Wilson intervals"
      >
        {(s) => (
          <>
            <HLine at={0.95} s={s} color="var(--text)" label="95%" />
            <Line points={data.wald} s={s} color="var(--series-2)" width={2} />
            <Line points={data.wilson} s={s} color="var(--series-3)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'Wald' },
          { color: 'var(--series-3)', label: 'Wilson' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Худшее покрытие, Wald', 'Worst coverage, Wald')}
          value={`${(data.worstWald * 100).toFixed(0)}%`} tone={data.worstWald >= 0.93 ? 'ok' : 'bad'} />
        <Readout label={l('Худшее покрытие, Wilson', 'Worst coverage, Wilson')}
          value={`${(data.worstWilson * 100).toFixed(0)}%`} tone={data.worstWilson >= 0.93 ? 'ok' : 'bad'} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* Shared by the A/B simulators: shaded tails of a normal density. */
export function NormalTail({
  mu,
  sigma,
  from,
  to,
  s,
  color,
  opacity = 0.3,
}: {
  mu: number;
  sigma: number;
  from: number;
  to: number;
  s: Parameters<typeof Area>[0]['s'];
  color: string;
  opacity?: number;
}) {
  const pts: Array<[number, number]> = [];
  const steps = 60;
  for (let i = 0; i <= steps; i += 1) {
    const x = from + ((to - from) * i) / steps;
    pts.push([x, normalPdf(x, mu, sigma)]);
  }
  return <Area points={pts} s={s} color={color} opacity={opacity} baseline={0} />;
}
