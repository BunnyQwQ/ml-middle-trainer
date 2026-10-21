import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import {
  benjaminiHochberg,
  cuped,
  mean,
  proportionMde,
  quantile,
  ratioDeltaSe,
  twoProportionZTest,
  variance,
  zTestPValue,
} from '@/lib/stats';
import { Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------------------ peeking -- */

/** Looking at the p-value repeatedly and stopping at the first dip below 0.05. */
export function Peeking() {
  const [maxLooks, setMaxLooks] = useState(10);
  const [seed, setSeed] = useState(4);
  const REPS = 400;
  const TOTAL_N = 20000;
  const p0 = 0.2;

  const data = useMemo(() => {
    const rng = makeRng(seed * 2654435761);
    const points: Array<[number, number]> = [];
    const naive: Array<[number, number]> = [];

    for (let looks = 1; looks <= maxLooks; looks += 1) {
      let stopped = 0;
      for (let r = 0; r < REPS; r += 1) {
        let ca = 0;
        let cb = 0;
        let na = 0;
        let nb = 0;
        let crossed = false;
        for (let k = 1; k <= looks; k += 1) {
          const batch = TOTAL_N / looks;
          const sdB = Math.sqrt(batch * p0 * (1 - p0));
          ca += Math.round(batch * p0 + rng.normal(0, sdB));
          cb += Math.round(batch * p0 + rng.normal(0, sdB));
          na += batch;
          nb += batch;
          if (twoProportionZTest(ca, na, cb, nb).pValue < 0.05) {
            crossed = true;
            break;
          }
        }
        if (crossed) stopped += 1;
      }
      points.push([looks, stopped / REPS]);
      naive.push([looks, 0.05]);
    }
    return { points, naive };
  }, [maxLooks, seed]);

  const last = data.points[data.points.length - 1]?.[1] ?? 0.05;

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Сколько раз смотрим на результат', 'How many times we look at the result')}
          value={maxLooks}
          min={1}
          max={20}
          step={1}
          onChange={setMaxLooks}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[1, Math.max(2, maxLooks)]}
        yDomain={[0, Math.max(0.3, last * 1.2)]}
        xLabel="number of looks"
        yLabel="false positive rate"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="false positive rate against the number of interim looks"
      >
        {(s) => (
          <>
            <HLine at={0.05} s={s} color="var(--text)" label="promised 5%" />
            <Line points={data.points} s={s} color="var(--series-2)" width={2} />
            <Dots points={data.points} s={s} color="var(--series-2)" r={3} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={l('Фактическая доля ложных', 'Actual false positive rate')}
          value={`${(last * 100).toFixed(1)}%`}
          tone={last > 0.08 ? 'bad' : 'ok'}
        />
        <Readout label={l('Обещано', 'Promised')} value="5.0%" />
        <Readout
          label={l('Во сколько раз больше', 'Inflation factor')}
          value={`${(last / 0.05).toFixed(1)}x`}
          tone={last / 0.05 > 1.6 ? 'bad' : 'ok'}
        />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** The same thing seen as trajectories: every line is one honest A/A test. */
export function PeekingPaths() {
  const { t } = useLang();
  const [seed, setSeed] = useState(11);
  const DAYS = 28;
  const PATHS = 24;
  const PER_DAY = 800;
  const p0 = 0.2;

  const data = useMemo(() => {
    const rng = makeRng(seed * 982451653);
    const paths: Array<{ points: Array<[number, number]>; crossed: boolean }> = [];
    let crossedCount = 0;
    let endCount = 0;
    for (let p = 0; p < PATHS; p += 1) {
      let ca = 0;
      let cb = 0;
      let n = 0;
      const points: Array<[number, number]> = [];
      let crossed = false;
      for (let d = 1; d <= DAYS; d += 1) {
        const sdB = Math.sqrt(PER_DAY * p0 * (1 - p0));
        ca += Math.round(PER_DAY * p0 + rng.normal(0, sdB));
        cb += Math.round(PER_DAY * p0 + rng.normal(0, sdB));
        n += PER_DAY;
        const pv = twoProportionZTest(ca, n, cb, n).pValue;
        points.push([d, Math.min(1, pv)]);
        if (pv < 0.05) crossed = true;
      }
      if (crossed) crossedCount += 1;
      if (points[points.length - 1][1] < 0.05) endCount += 1;
      paths.push({ points, crossed });
    }
    return { paths, crossedShare: crossedCount / PATHS, endShare: endCount / PATHS };
  }, [seed]);

  return (
    <>
      <Plot
        xDomain={[1, DAYS]}
        yDomain={[0, 1]}
        xLabel="day of the experiment"
        yLabel="p-value"
        ariaLabel="p-value trajectories in honest A/A tests"
        height={250}
      >
        {(s) => (
          <>
            {data.paths.map((path, i) => (
              <Line
                key={i}
                points={path.points}
                s={s}
                color={path.crossed ? 'var(--bad)' : 'var(--text-faint)'}
                width={path.crossed ? 1.6 : 1}
                opacity={path.crossed ? 0.9 : 0.5}
              />
            ))}
            <HLine at={0.05} s={s} color="var(--warn)" dashed={false} label="0.05" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={l('Зашли под 0.05 хоть раз', 'Dipped below 0.05 at least once')}
          value={`${(data.crossedShare * 100).toFixed(0)}%`}
          tone="bad"
        />
        <Readout
          label={l('Значимы на последний день', 'Significant on the final day')}
          value={`${(data.endShare * 100).toFixed(0)}%`}
          tone="ok"
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Все линии — честные A/A-тесты, эффекта нет ни в одном. Красные в какой-то момент опускались ниже 0.05: если бы эксперимент остановили в этот день, результат объявили бы значимым. К последнему дню значимыми остаются примерно обещанные 5%.',
            'Every line is an honest A/A test with no effect anywhere. The red ones dipped below 0.05 at some point: stop the experiment on that day and the result gets declared significant. By the final day roughly the promised 5% remain significant.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------ multiple comparisons -- */

export function MultipleComparisons() {
  const [m, setM] = useState(20);
  const [trueEffects, setTrueEffects] = useState(3);
  const [seed, setSeed] = useState(6);
  const REPS = 300;
  const POWER = 0.8;

  const data = useMemo(() => {
    const rng = makeRng(seed * 756065179 + m);
    const alpha = 0.05;
    let fpNone = 0;
    let fpBonf = 0;
    let fpBh = 0;
    let tpNone = 0;
    let tpBonf = 0;
    let tpBh = 0;
    let anyFalseNone = 0;

    for (let r = 0; r < REPS; r += 1) {
      const ps: number[] = [];
      const isReal: boolean[] = [];
      for (let i = 0; i < m; i += 1) {
        const real = i < trueEffects;
        isReal.push(real);
        if (real) {
          // A metric with a real effect: z drawn around the power threshold.
          const z = rng.normal(2.8, 1);
          ps.push(zTestPValue(z));
        } else {
          ps.push(rng.next());
        }
      }

      const bonf = ps.map((p) => p * m);
      const bhIdx = new Set(benjaminiHochberg(ps, alpha));

      let falseNone = 0;
      ps.forEach((p, i) => {
        if (p < alpha) {
          if (isReal[i]) tpNone += 1;
          else {
            fpNone += 1;
            falseNone += 1;
          }
        }
        if (bonf[i] < alpha) {
          if (isReal[i]) tpBonf += 1;
          else fpBonf += 1;
        }
        if (bhIdx.has(i)) {
          if (isReal[i]) tpBh += 1;
          else fpBh += 1;
        }
      });
      if (falseNone > 0) anyFalseNone += 1;
    }

    return {
      fp: [fpNone / REPS, fpBonf / REPS, fpBh / REPS],
      tp: [tpNone / REPS, tpBonf / REPS, tpBh / REPS],
      fwer: anyFalseNone / REPS,
      theoreticalFwer: 1 - (1 - 0.05) ** (m - trueEffects),
      power: POWER,
    };
  }, [m, trueEffects, seed]);

  const labels = ['no correction', 'Bonferroni', 'Benjamini-Hochberg'];
  const yMax = Math.max(...data.fp, ...data.tp) * 1.25;

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Сколько метрик смотрим', 'How many metrics we look at')}
          value={m}
          min={2}
          max={60}
          step={1}
          onChange={setM}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Из них реально работают', 'Of them genuinely work')}
          value={trueEffects}
          min={0}
          max={Math.min(10, m)}
          step={1}
          onChange={setTrueEffects}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-0.5, 2.5]}
        yDomain={[0, Math.max(1, yMax)]}
        xTicks={[0, 1, 2]}
        formatX={(v) => labels[Math.round(v)] ?? ''}
        yLabel="metrics flagged per experiment"
        ariaLabel="false and true positives under three correction schemes"
        padBottom={34}
      >
        {(s) => (
          <>
            {data.tp.map((v, i) => (
              <Bars key={`tp${i}`} centers={[i - 0.16]} values={[v]} binWidth={0.3} s={s} color="var(--ok)" opacity={0.8} />
            ))}
            {data.fp.map((v, i) => (
              <Bars key={`fp${i}`} centers={[i + 0.16]} values={[v]} binWidth={0.3} s={s} color="var(--bad)" opacity={0.8} />
            ))}
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--ok)', label: 'real effects found' },
          { color: 'var(--bad)', label: 'false alarms' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Шанс хоть одной ложной тревоги', 'Chance of at least one false alarm')}
          value={`${(data.fwer * 100).toFixed(0)}%`}
          tone={data.fwer > 0.2 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Формула 1-(1-a)^m', 'Formula 1-(1-a)^m')}
          value={`${(data.theoreticalFwer * 100).toFixed(0)}%`}
        />
        <Readout
          label={l('Найдено реальных: без поправки', 'Real effects found: no correction')}
          value={data.tp[0].toFixed(2)}
        />
        <Readout
          label={l('Bonferroni / BH', 'Bonferroni / BH')}
          value={`${data.tp[1].toFixed(2)} / ${data.tp[2].toFixed(2)}`}
        />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------------ ratio metrics -- */

/** Three ways to get a standard error for CTR, and which of them keeps its promise. */
export function RatioVariance() {
  const [users, setUsers] = useState(2000)
  const [spread, setSpread] = useState(0.6);
  const [seed, setSeed] = useState(3);
  const REPS = 160;
  const BOOT = 120;

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863 + users);
    let naiveCover = 0;
    let deltaCover = 0;
    let bootCover = 0;
    const trueCtr = 0.12;

    for (let r = 0; r < REPS; r += 1) {
      const clicks: number[] = [];
      const shows: number[] = [];
      let totalC = 0;
      let totalS = 0;
      for (let u = 0; u < users; u += 1) {
        const s = Math.max(1, Math.round(rng.lognormal(2.2, 1.0)));
        // Per-user click propensity varies; that is what breaks the naive formula.
        const p = Math.min(0.9, Math.max(0.005, trueCtr * (1 + rng.normal(0, spread))));
        let c = 0;
        for (let i = 0; i < s; i += 1) if (rng.next() < p) c += 1;
        clicks.push(c);
        shows.push(s);
        totalC += c;
        totalS += s;
      }
      const ratio = totalC / totalS;

      // 1. Naive: treat every impression as an independent Bernoulli trial.
      const naiveSe = Math.sqrt((ratio * (1 - ratio)) / totalS);
      if (Math.abs(ratio - trueCtr) <= 1.96 * naiveSe) naiveCover += 1;

      // 2. Delta method, clustered by user.
      const { se: deltaSe } = ratioDeltaSe(clicks, shows);
      if (Math.abs(ratio - trueCtr) <= 1.96 * deltaSe) deltaCover += 1;

      // 3. Bootstrap over users.
      const estimates: number[] = [];
      for (let k = 0; k < BOOT; k += 1) {
        let bc = 0;
        let bs = 0;
        for (let u = 0; u < users; u += 1) {
          const idx = Math.floor(rng.next() * users);
          bc += clicks[idx];
          bs += shows[idx];
        }
        estimates.push(bc / bs);
      }
      estimates.sort((x, y) => x - y);
      if (quantile(estimates, 0.025) <= trueCtr && trueCtr <= quantile(estimates, 0.975)) {
        bootCover += 1;
      }
    }

    return {
      coverage: [naiveCover / REPS, deltaCover / REPS, bootCover / REPS],
    };
  }, [users, spread, seed]);

  const labels = ['naive binomial', 'delta method', 'bootstrap by user'];

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Разброс склонности кликать', 'Spread of click propensity')}
          value={spread}
          min={0}
          max={1.2}
          step={0.05}
          onChange={setSpread}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Пользователей в выборке', 'Users in the sample')}
          value={users}
          min={500}
          max={4000}
          step={250}
          onChange={setUsers}
          format={(v) => v.toLocaleString('en-US')}
        />
      </div>
      <Plot
        xDomain={[-0.5, 2.5]}
        yDomain={[0, 1]}
        xTicks={[0, 1, 2]}
        formatX={(v) => labels[Math.round(v)] ?? ''}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        yLabel="coverage of the 95% interval"
        ariaLabel="coverage of three standard error estimates for a ratio metric"
        padBottom={34}
      >
        {(s) => (
          <>
            {data.coverage.map((v, i) => (
              <Bars
                key={i}
                centers={[i]}
                values={[v]}
                binWidth={0.5}
                s={s}
                color={v >= 0.92 ? 'var(--ok)' : 'var(--bad)'}
                opacity={0.8}
              />
            ))}
            <HLine at={0.95} s={s} color="var(--text)" label="95%" />
          </>
        )}
      </Plot>
      <div className="readouts">
        {labels.map((label, i) => (
          <Readout
            key={label}
            label={l(label, label)}
            value={`${(data.coverage[i] * 100).toFixed(0)}%`}
            tone={data.coverage[i] >= 0.92 ? 'ok' : 'bad'}
          />
        ))}
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------------------- CUPED -- */

export function Cuped() {
  const [rho, setRho] = useState(0.7);
  const [seed, setSeed] = useState(8);
  const N = 1500;

  const data = useMemo(() => {
    const rng = makeRng(seed * 433494437);
    const pre: number[] = [];
    const post: number[] = [];
    for (let i = 0; i < N; i += 1) {
      const base = rng.normal(0, 1);
      const noise = rng.normal(0, 1);
      pre.push(base);
      post.push(rho * base + Math.sqrt(Math.max(0, 1 - rho * rho)) * noise);
    }
    const { adjusted, theta, varianceRatio } = cuped(post, pre);
    const points: Array<[number, number]> = [];
    for (let i = 0; i < 350; i += 1) points.push([pre[i], post[i]]);
    return {
      theta,
      varianceRatio,
      points,
      sdBefore: Math.sqrt(variance(post)),
      sdAfter: Math.sqrt(variance(adjusted)),
      meanBefore: mean(post),
      meanAfter: mean(adjusted),
    };
  }, [rho, seed]);

  // Traffic needed scales with variance; MDE with its square root.
  const trafficSaving = 1 - data.varianceRatio;
  const mdeRatio = Math.sqrt(data.varianceRatio);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Корреляция с предпериодом', 'Correlation with the pre-period')}
          value={rho}
          min={0}
          max={0.95}
          step={0.05}
          onChange={setRho}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[-3.2, 3.2]}
        yDomain={[-3.2, 3.2]}
        xLabel="metric before the experiment"
        yLabel="metric during the experiment"
        ariaLabel="pre-period against experiment metric"
      >
        {(s) => (
          <>
            <Dots points={data.points} s={s} color="var(--series-1)" r={1.7} opacity={0.45} />
            <Line
              points={[
                [-3.2, -3.2 * data.theta],
                [3.2, 3.2 * data.theta],
              ]}
              s={s}
              color="var(--series-2)"
              width={2}
            />
          </>
        )}
      </Plot>
      <Legend items={[{ color: 'var(--series-2)', label: 'fitted theta (the part CUPED removes)' }]} />
      <div className="readouts">
        <Readout label={l('Дисперсия осталась', 'Variance remaining')} value={`${(data.varianceRatio * 100).toFixed(0)}%`} />
        <Readout
          label={l('Экономия трафика', 'Traffic saved')}
          value={`${(trafficSaving * 100).toFixed(0)}%`}
          tone={trafficSaving > 0.2 ? 'ok' : undefined}
        />
        <Readout label={l('MDE стал меньше в', 'MDE shrinks by')} value={`${(1 / mdeRatio).toFixed(2)}x`} />
        <Readout label={l('Оценка theta', 'Estimated theta')} value={data.theta.toFixed(3)} />
      </div>
      <p className="faint">
        {`1 - rho^2 = ${(1 - rho * rho).toFixed(3)}`}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* --------------------------------------------------------- novelty effect ---- */

export function NoveltyEffect() {
  const { t } = useLang();
  const [novelty, setNovelty] = useState(0.06);
  const [tau, setTau] = useState(4);
  const [trueEffect, setTrueEffect] = useState(0.01);
  const DAYS = 28;

  const data = useMemo(() => {
    const daily: Array<[number, number]> = [];
    const cumulative: Array<[number, number]> = [];
    let acc = 0;
    for (let d = 1; d <= DAYS; d += 1) {
      const effect = trueEffect + novelty * Math.exp(-(d - 1) / tau);
      daily.push([d, effect]);
      acc += effect;
      cumulative.push([d, acc / d]);
    }
    return { daily, cumulative };
  }, [novelty, tau, trueEffect]);

  const readAt = (day: number) => data.cumulative[day - 1][1];

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Размер эффекта новизны', 'Size of the novelty bump')}
          value={novelty}
          min={0}
          max={0.15}
          step={0.005}
          onChange={setNovelty}
          format={(v) => `+${(v * 100).toFixed(1)}%`}
        />
        <Slider
          label={l('Скорость затухания, дней', 'Decay constant, days')}
          value={tau}
          min={1}
          max={14}
          step={1}
          onChange={setTau}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Настоящий долгосрочный эффект', 'True long-run effect')}
          value={trueEffect}
          min={-0.02}
          max={0.04}
          step={0.005}
          onChange={setTrueEffect}
          format={(v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`}
        />
      </div>
      <Plot
        xDomain={[1, DAYS]}
        yDomain={[Math.min(-0.01, trueEffect - 0.01), Math.max(0.02, trueEffect + novelty * 1.1)]}
        xLabel="day"
        yLabel="measured effect"
        formatY={(v) => `${(v * 100).toFixed(1)}%`}
        ariaLabel="daily effect and cumulative estimate over time"
      >
        {(s) => (
          <>
            <HLine at={trueEffect} s={s} color="var(--text)" label="true effect" />
            <HLine at={0} s={s} color="var(--border-strong)" dashed={false} />
            <Line points={data.daily} s={s} color="var(--series-2)" width={2} />
            <Line points={data.cumulative} s={s} color="var(--series-1)" width={2} dashed />
            <VLine at={3} s={s} color="var(--warn)" label="day 3" />
            <VLine at={7} s={s} color="var(--text-dim)" label="day 7" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'effect on that day' },
          { color: 'var(--series-1)', label: 'cumulative estimate' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Прочитали на 3-й день', 'Read on day 3')} value={`${(readAt(3) * 100).toFixed(2)}%`} tone="bad" />
        <Readout label={l('На 7-й день', 'On day 7')} value={`${(readAt(7) * 100).toFixed(2)}%`} />
        <Readout label={l('На 28-й день', 'On day 28')} value={`${(readAt(28) * 100).toFixed(2)}%`} />
        <Readout
          label={l('Настоящий эффект', 'True effect')}
          value={`${(trueEffect * 100).toFixed(2)}%`}
          tone="ok"
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Накопительная оценка сходится к истине медленно: она тащит за собой первые дни. Поэтому при подозрении на новизну смотрят не на накопленное среднее, а на эффект по последней неделе.',
            'The cumulative estimate converges slowly because it keeps dragging the first days along. When novelty is suspected, the number to look at is the effect over the last week rather than the running average.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------ weekday seasonality -- */

export function WeekdaySeasonality() {
  const { t } = useLang();
  const [startDay, setStartDay] = useState(2);
  const [length, setLength] = useState(5);

  const WEEK = [1.08, 1.06, 1.04, 1.02, 0.98, 0.84, 0.86];
  const NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseline = 0.2;

  const data = useMemo(() => {
    const trueMean = mean(WEEK) * baseline;
    const covered: number[] = [];
    for (let i = 0; i < length; i += 1) covered.push((startDay + i) % 7);
    const windowMean = mean(covered.map((d) => WEEK[d] * baseline));
    const bars = WEEK.map((w) => w * baseline);
    return {
      bars,
      covered,
      windowMean,
      trueMean,
      bias: (windowMean - trueMean) / trueMean,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDay, length]);

  return (
    <>
      <div className="controls">
        <Select
          label={l('День старта', 'Start day')}
          value={String(startDay)}
          options={NAMES.map((n, i) => ({ value: String(i), label: l(n, n) }))}
          onChange={(v) => setStartDay(Number(v))}
        />
        <Slider
          label={l('Длительность, дней', 'Duration, days')}
          value={length}
          min={1}
          max={14}
          step={1}
          onChange={setLength}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-0.6, 6.6]}
        yDomain={[0, Math.max(...data.bars) * 1.25]}
        xTicks={[0, 1, 2, 3, 4, 5, 6]}
        formatX={(v) => NAMES[Math.round(v)] ?? ''}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        yLabel="conversion"
        ariaLabel="conversion by weekday with the measurement window"
        padBottom={34}
      >
        {(s) => (
          <>
            {data.bars.map((v, i) => (
              <Bars
                key={i}
                centers={[i]}
                values={[v]}
                binWidth={0.7}
                s={s}
                color={data.covered.includes(i) ? 'var(--series-1)' : 'var(--border-strong)'}
                opacity={data.covered.includes(i) ? 0.85 : 0.5}
              />
            ))}
            <HLine at={data.trueMean} s={s} color="var(--text)" label="true weekly average" />
            <HLine at={data.windowMean} s={s} color="var(--series-2)" dashed={false} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={l('Среднее за окно', 'Average over the window')}
          value={`${(data.windowMean * 100).toFixed(2)}%`}
        />
        <Readout
          label={l('Истинное недельное среднее', 'True weekly average')}
          value={`${(data.trueMean * 100).toFixed(2)}%`}
        />
        <Readout
          label={l('Смещение', 'Bias')}
          value={`${data.bias >= 0 ? '+' : ''}${(data.bias * 100).toFixed(1)}%`}
          tone={Math.abs(data.bias) > 0.02 ? 'bad' : 'ok'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Поставь длительность 7 или 14 — смещение исчезает при любом дне старта. Любое другое число дней делает оценку зависимой от того, в какой день недели запустили эксперимент.',
            'Set the duration to 7 or 14 and the bias disappears for every start day. Any other number of days makes the estimate depend on which weekday the experiment was launched.',
          ),
        )}
      </p>
    </>
  );
}

/** Used by the review node to show a reported effect with its interval. */
export function effectWithCi(clicksA: number, nA: number, clicksB: number, nB: number) {
  const res = twoProportionZTest(clicksA, nA, clicksB, nB);
  return { diff: res.diff, lo: res.ciLow, hi: res.ciHigh, p: res.pValue };
}

/** Shared helper: how much traffic a given MDE needs at this baseline. */
export function mdeAt(baseline: number, n: number): number {
  return proportionMde(baseline, n);
}
