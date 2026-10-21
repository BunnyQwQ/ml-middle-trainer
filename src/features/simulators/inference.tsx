import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import {
  bootstrapCi,
  histogram,
  mannWhitneyU,
  mean,
  meanInterval,
  quantile,
  sd,
  welchTTest,
} from '@/lib/stats';
import { Area, Bars, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------- what a p-value looks like -- */

export function PvalueDistribution() {
  const { t } = useLang();
  const [effect, setEffect] = useState(0);
  const [n, setN] = useState(400);
  const [seed, setSeed] = useState(7);
  const REPS = 1500;

  const data = useMemo(() => {
    const rng = makeRng(seed * 2654435761 + n);
    const ps: number[] = [];
    for (let r = 0; r < REPS; r += 1) {
      const a: number[] = [];
      const b: number[] = [];
      for (let i = 0; i < n; i += 1) {
        a.push(rng.normal(0, 1));
        b.push(rng.normal(effect, 1));
      }
      ps.push(welchTTest(a, b).pValue);
    }
    const h = histogram(ps, 20, [0, 1]);
    const below = ps.filter((p) => p < 0.05).length / REPS;
    return { h, below };
  }, [effect, n, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Истинный эффект, в единицах SD', 'True effect, in SD units')}
          value={effect}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setEffect}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Наблюдений в группе', 'Observations per group')}
          value={n}
          min={50}
          max={2000}
          step={50}
          onChange={setN}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, Math.max(...data.h.counts) * 1.15]}
        xLabel="p-value"
        yLabel="count"
        ariaLabel="distribution of p-values"
      >
        {(s) => (
          <>
            <Bars
              centers={data.h.centers}
              values={data.h.counts}
              binWidth={data.h.width}
              s={s}
              color={effect === 0 ? 'var(--series-1)' : 'var(--series-3)'}
              opacity={0.7}
            />
            <HLine at={REPS / 20} s={s} color="var(--text)" label="uniform" />
            <VLine at={0.05} s={s} color="var(--warn)" label="0.05" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={effect === 0 ? l('Доля значимых (это alpha)', 'Share significant (this is alpha)') : l('Доля значимых (это мощность)', 'Share significant (this is power)')}
          value={`${(data.below * 100).toFixed(1)}%`}
          tone={effect === 0 ? (Math.abs(data.below - 0.05) < 0.02 ? 'ok' : 'bad') : data.below > 0.8 ? 'ok' : 'bad'}
        />
        <Readout label={l('Эффект', 'Effect')} value={effect === 0 ? 'H0' : `${effect.toFixed(2)} SD`} />
      </div>
      <p className="faint">
        {effect === 0
          ? t(
              l(
                'Когда эффекта нет, p-value распределено равномерно: любое значение равновероятно, и ровно 5% экспериментов дадут «значимый» результат на пустом месте.',
                'With no effect the p-value is uniform: every value is equally likely, and exactly 5% of experiments return a "significant" result out of nothing.',
              ),
            )
          : t(
              l(
                'При настоящем эффекте распределение прижимается к нулю. Доля p < 0.05 — это и есть мощность теста.',
                'With a real effect the distribution piles up near zero. The share of p < 0.05 is the power of the test.',
              ),
            )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------ how many significant results are true -- */

export function SignificanceVsTruth() {
  const { t } = useLang();
  const [power, setPower] = useState(0.8);
  const [alpha, setAlpha] = useState(0.05);
  const [prior, setPrior] = useState(0.2);

  const ppv = (pi: number) => (pi * power) / (pi * power + (1 - pi) * alpha);

  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 100; i += 1) {
      const pi = i / 100;
      pts.push([pi, ppv(pi)]);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, alpha]);

  const perHundred = {
    true: Math.round(100 * prior * power),
    false: Math.round(100 * (1 - prior) * alpha),
  };

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Доля гипотез, которые реально работают', 'Share of hypotheses that genuinely work')}
          value={prior}
          min={0.02}
          max={0.8}
          step={0.01}
          onChange={setPrior}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Slider
          label={l('Мощность', 'Power')}
          value={power}
          min={0.2}
          max={0.99}
          step={0.01}
          onChange={setPower}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Slider
          label={l('alpha', 'alpha')}
          value={alpha}
          min={0.01}
          max={0.2}
          step={0.01}
          onChange={setAlpha}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        xLabel="share of hypotheses that work"
        yLabel="share of significant results that are real"
        formatX={(v) => `${(v * 100).toFixed(0)}%`}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="positive predictive value against the prior"
      >
        {(s) => (
          <>
            <Line points={curve} s={s} color="var(--series-1)" width={2} />
            <VLine at={prior} s={s} color="var(--series-4)" dashed={false} />
            <HLine at={ppv(prior)} s={s} color="var(--series-4)" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={l('Из значимых результатов настоящие', 'Of significant results, the real ones')}
          value={`${(ppv(prior) * 100).toFixed(0)}%`}
          tone={ppv(prior) > 0.7 ? 'ok' : 'bad'}
        />
        <Readout
          label={l('На 100 гипотез: верных находок', 'Per 100 hypotheses: true finds')}
          value={String(perHundred.true)}
        />
        <Readout
          label={l('На 100 гипотез: ложных', 'Per 100 hypotheses: false ones')}
          value={String(perHundred.false)}
          tone="bad"
        />
      </div>
      <p className="faint">
        {t(
          l(
            `p < ${alpha.toFixed(2)} не означает «вероятность ошибки ${(alpha * 100).toFixed(0)}%». При доле работающих гипотез ${(prior * 100).toFixed(0)}% ложным оказывается каждый ${Math.max(1, Math.round(1 / Math.max(1e-9, 1 - ppv(prior))))}-й значимый результат.`,
            `p < ${alpha.toFixed(2)} does not mean "a ${(alpha * 100).toFixed(0)}% chance of being wrong". When ${(prior * 100).toFixed(0)}% of hypotheses work, every ${Math.max(1, Math.round(1 / Math.max(1e-9, 1 - ppv(prior))))}th significant result is false.`,
          ),
        )}
      </p>
    </>
  );
}

/* ---------------------------------------------- which test to actually use -- */

type DataShape = 'normal' | 'lognormal' | 'outliers' | 'binary';

export function TestComparison() {
  const [shape, setShape] = useState<DataShape>('lognormal');
  const [n, setN] = useState(80);
  const [mode, setMode] = useState<'aa' | 'ab'>('aa');
  const [seed, setSeed] = useState(5);
  const REPS = 300;
  const BOOT = 150;

  const data = useMemo(() => {
    const rng = makeRng(seed * 982451653 + n);
    const shift = mode === 'ab' ? 1.18 : 1; // multiplicative, so it works for skewed data too

    const draw = (lift: number): number[] => {
      const out: number[] = [];
      for (let i = 0; i < n; i += 1) {
        switch (shape) {
          case 'normal':
            out.push(rng.normal(100, 30) * lift);
            break;
          case 'lognormal':
            out.push(rng.lognormal(4, 1.1) * lift);
            break;
          case 'outliers':
            out.push((rng.next() < 0.02 ? rng.lognormal(8, 1) : rng.normal(100, 25)) * lift);
            break;
          default:
            out.push(rng.bernoulli(Math.min(0.95, 0.2 * lift)));
        }
      }
      return out;
    };

    let tHits = 0;
    let mwHits = 0;
    let bootHits = 0;
    for (let r = 0; r < REPS; r += 1) {
      const a = draw(1);
      const b = draw(shift);
      if (welchTTest(a, b).pValue < 0.05) tHits += 1;
      if (mannWhitneyU(a, b).pValue < 0.05) mwHits += 1;
      // Bootstrap of the difference of means: significant when 0 is outside.
      const diffs: number[] = [];
      for (let k = 0; k < BOOT; k += 1) {
        let sa = 0;
        let sb = 0;
        for (let i = 0; i < n; i += 1) {
          sa += a[Math.floor(rng.next() * n)];
          sb += b[Math.floor(rng.next() * n)];
        }
        diffs.push(sb / n - sa / n);
      }
      diffs.sort((x, y) => x - y);
      const lo = quantile(diffs, 0.025);
      const hi = quantile(diffs, 0.975);
      if (lo > 0 || hi < 0) bootHits += 1;
    }

    return {
      t: tHits / REPS,
      mw: mwHits / REPS,
      boot: bootHits / REPS,
    };
  }, [shape, n, mode, seed]);

  const bars = [
    { label: 't-test (Welch)', value: data.t, color: 'var(--series-1)' },
    { label: 'Mann-Whitney', value: data.mw, color: 'var(--series-2)' },
    { label: 'bootstrap', value: data.boot, color: 'var(--series-3)' },
  ];
  const target = mode === 'aa' ? 0.05 : undefined;

  return (
    <>
      <div className="controls">
        <Select
          label={l('Распределение данных', 'Data distribution')}
          value={shape}
          options={[
            { value: 'lognormal', label: l('Логнормальное (выручка)', 'Lognormal (revenue)') },
            { value: 'normal', label: l('Нормальное', 'Normal') },
            { value: 'outliers', label: l('Нормальное с выбросами 2%', 'Normal with 2% outliers') },
            { value: 'binary', label: l('Бинарное (конверсия)', 'Binary (conversion)') },
          ]}
          onChange={setShape}
        />
        <Select
          label={l('Что проверяем', 'What we are checking')}
          value={mode}
          options={[
            { value: 'aa', label: l('A/A: доля ложных срабатываний', 'A/A: false positive rate') },
            { value: 'ab', label: l('A/B с эффектом +18%: мощность', 'A/B with a +18% effect: power') },
          ]}
          onChange={setMode}
        />
        <Slider
          label={l('Наблюдений в группе', 'Observations per group')}
          value={n}
          min={20}
          max={400}
          step={10}
          onChange={setN}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-0.5, bars.length - 0.5]}
        yDomain={[0, mode === 'aa' ? 0.2 : 1]}
        xTicks={bars.map((_, i) => i)}
        formatX={(v) => bars[Math.round(v)]?.label ?? ''}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        yLabel={mode === 'aa' ? 'false positives' : 'power'}
        ariaLabel="comparison of three tests"
        padBottom={34}
      >
        {(s) => (
          <>
            {bars.map((b, i) => (
              <Bars
                key={b.label}
                centers={[i]}
                values={[b.value]}
                binWidth={0.55}
                s={s}
                color={b.color}
                opacity={0.8}
              />
            ))}
            {target !== undefined && <HLine at={target} s={s} color="var(--text)" label="5%" />}
          </>
        )}
      </Plot>
      <div className="readouts">
        {bars.map((b) => (
          <Readout
            key={b.label}
            label={l(b.label, b.label)}
            value={`${(b.value * 100).toFixed(1)}%`}
            tone={
              mode === 'aa'
                ? Math.abs(b.value - 0.05) < 0.025
                  ? 'ok'
                  : 'bad'
                : b.value > 0.6
                  ? 'ok'
                  : 'bad'
            }
          />
        ))}
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* --------------------------------------------------------------- bootstrap -- */

type Statistic = 'mean' | 'median' | 'p90' | 'trimmed';

export function BootstrapCi() {
  const { t } = useLang();
  const [stat, setStat] = useState<Statistic>('mean');
  const [b, setB] = useState(600);
  const [n, setN] = useState(200);
  const [seed, setSeed] = useState(1);

  const compute = useMemo(() => {
    const rng = makeRng(seed * 433494437 + n);
    const sample: number[] = [];
    for (let i = 0; i < n; i += 1) sample.push(rng.lognormal(4, 1.1));

    const statistic = (xs: readonly number[]): number => {
      if (stat === 'mean') return mean(xs);
      const sorted = [...xs].sort((x, y) => x - y);
      if (stat === 'median') return quantile(sorted, 0.5);
      if (stat === 'p90') return quantile(sorted, 0.9);
      const cut = Math.floor(sorted.length * 0.01);
      return mean(sorted.slice(cut, sorted.length - cut));
    };

    const boot = bootstrapCi(sample, statistic, { b, next: rng.next });
    const h = histogram(boot.estimates, 32);
    const normal = meanInterval(sample);
    return { boot, h, sample, normal, sd: sd(sample) };
  }, [stat, b, n, seed]);

  const { boot, h } = compute;
  const domain: [number, number] = [h.lo, h.hi];

  return (
    <>
      <div className="controls">
        <Select
          label={l('Статистика', 'Statistic')}
          value={stat}
          options={[
            { value: 'mean', label: l('Среднее', 'Mean') },
            { value: 'median', label: l('Медиана', 'Median') },
            { value: 'p90', label: l('90-й перцентиль', '90th percentile') },
            { value: 'trimmed', label: l('Усечённое среднее (1%)', 'Trimmed mean (1%)') },
          ]}
          onChange={setStat}
        />
        <Slider
          label={l('Бутстрап-итераций B', 'Bootstrap iterations B')}
          value={b}
          min={50}
          max={3000}
          step={50}
          onChange={setB}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Размер выборки n', 'Sample size n')}
          value={n}
          min={30}
          max={1000}
          step={10}
          onChange={setN}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={domain}
        yDomain={[0, Math.max(...h.counts) * 1.15]}
        xLabel="bootstrap estimate"
        yLabel="count"
        ariaLabel="bootstrap distribution of the statistic"
      >
        {(s) => (
          <>
            <Bars
              centers={h.centers}
              values={h.counts}
              binWidth={h.width}
              s={s}
              color="var(--series-1)"
              opacity={0.65}
            />
            <VLine at={boot.lo} s={s} color="var(--series-2)" dashed={false} />
            <VLine at={boot.hi} s={s} color="var(--series-2)" dashed={false} />
            <VLine at={boot.point} s={s} color="var(--series-4)" dashed={false} width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-4)', label: 'estimate on the original sample' },
          { color: 'var(--series-2)', label: '95% percentile interval' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Оценка', 'Estimate')} value={boot.point.toFixed(1)} />
        <Readout
          label={l('Бутстрап-интервал', 'Bootstrap interval')}
          value={`${boot.lo.toFixed(0)} … ${boot.hi.toFixed(0)}`}
        />
        <Readout
          label={l('Нормальный интервал для среднего', 'Normal interval for the mean')}
          value={`${compute.normal[0].toFixed(0)} … ${compute.normal[1].toFixed(0)}`}
        />
      </div>
      <p className="faint">
        {stat === 'mean'
          ? t(
              l(
                'Для среднего бутстрап и нормальный интервал почти совпадают — ЦПТ работает. Переключись на медиану или перцентиль: формулы для них нет, а бутстрап считает интервал ровно так же.',
                'For the mean the bootstrap and the normal interval nearly coincide — the CLT is doing its job. Switch to the median or a percentile: no formula exists for those, and the bootstrap computes the interval exactly the same way.',
              ),
            )
          : t(
              l(
                'Нормальный интервал справа посчитан для среднего и к этой статистике отношения не имеет: формулы стандартной ошибки для неё просто нет. В этом и смысл бутстрапа.',
                'The normal interval on the right is for the mean and has nothing to do with this statistic: no standard error formula exists for it. That is the whole point of the bootstrap.',
              ),
            )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** Shared by the A/B simulators that need a skewed revenue-like draw. */
export function revenueDraw(next: () => number): number {
  const u = 1 - next();
  const v = next();
  return Math.exp(4 + 1.1 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
}

/** Small helper so a plot can shade the rejection region of a bootstrap CI. */
export function ciBand({
  lo,
  hi,
  s,
  color = 'var(--series-2)',
}: {
  lo: number;
  hi: number;
  s: Parameters<typeof Area>[0]['s'];
  color?: string;
}) {
  return (
    <rect
      x={s.x(lo)}
      y={s.padT}
      width={Math.max(1, s.x(hi) - s.x(lo))}
      height={s.h}
      fill={color}
      opacity={0.12}
    />
  );
}
