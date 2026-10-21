import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { makeRng } from '@/lib/rng';
import {
  histogram,
  mean,
  normalCdf,
  normalPdf,
  normalQuantile,
  proportionMde,
  proportionPower,
  proportionSampleSize,
  twoProportionZTest,
  welchTTest,
  zTestPValue,
} from '@/lib/stats';
import { Area, Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------- randomization unit -- */

/**
 * The mistake this one is about: splitting traffic by user and then running the
 * test as if every event were independent. The p-values come out far too small.
 */
export function RandomizationUnit() {
  const [eventsPerUser, setEventsPerUser] = useState(8);
  const [heterogeneity, setHeterogeneity] = useState(0.6);
  const [seed, setSeed] = useState(9);
  const USERS = 150;
  const EXPERIMENTS = 250;
  const p0 = 0.2;

  const data = useMemo(() => {
    const rng = makeRng(seed * 433494437);
    const pEvent: number[] = [];
    const pUser: number[] = [];

    for (let e = 0; e < EXPERIMENTS; e += 1) {
      const groupClicks = [0, 0];
      const groupEvents = [0, 0];
      const userRates: number[][] = [[], []];
      for (let g = 0; g < 2; g += 1) {
        for (let u = 0; u < USERS; u += 1) {
          // Users differ from each other; that is what breaks the event-level test.
          const spread = heterogeneity * 0.18;
          const pu = Math.min(0.95, Math.max(0.01, p0 + rng.normal(0, spread)));
          let clicks = 0;
          for (let k = 0; k < eventsPerUser; k += 1) clicks += rng.bernoulli(pu);
          groupClicks[g] += clicks;
          groupEvents[g] += eventsPerUser;
          userRates[g].push(clicks / eventsPerUser);
        }
      }
      pEvent.push(
        twoProportionZTest(groupClicks[0], groupEvents[0], groupClicks[1], groupEvents[1]).pValue,
      );
      pUser.push(welchTTest(userRates[0], userRates[1]).pValue);
    }

    const fprEvent = pEvent.filter((p) => p < 0.05).length / EXPERIMENTS;
    const fprUser = pUser.filter((p) => p < 0.05).length / EXPERIMENTS;
    const hEvent = histogram(pEvent, 20, [0, 1]);
    const hUser = histogram(pUser, 20, [0, 1]);
    return { fprEvent, fprUser, hEvent, hUser };
  }, [eventsPerUser, heterogeneity, seed]);

  const yMax = Math.max(...data.hEvent.counts, ...data.hUser.counts) * 1.1;
  return (
    <>
      <div className="controls">
        <Slider label={l('События на пользователя', 'Events per user')} value={eventsPerUser} min={1} max={25}
          step={1} onChange={setEventsPerUser} format={(v) => String(v)} />
        <Slider label={l('Разброс между пользователями', 'Between-user spread')} value={heterogeneity} min={0}
          max={1} step={0.05} onChange={setHeterogeneity} format={(v) => v.toFixed(2)} />
      </div>
      <Plot xDomain={[0, 1]} yDomain={[0, yMax]} xLabel="p-value in A/A" yLabel="count"
        ariaLabel="p-value histograms for event-level and user-level analysis">
        {(s) => (
          <>
            <Bars centers={data.hEvent.centers} values={data.hEvent.counts} binWidth={data.hEvent.width} s={s}
              color="var(--series-2)" opacity={0.6} />
            <Bars centers={data.hUser.centers} values={data.hUser.counts} binWidth={data.hUser.width} s={s}
              color="var(--series-3)" opacity={0.5} />
            <HLine at={EXPERIMENTS / 20} s={s} color="var(--text)" label="uniform" />
            <VLine at={0.05} s={s} color="var(--warn)" label="0.05" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'analyzed per event (wrong)' },
          { color: 'var(--series-3)', label: 'analyzed per user (right)' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('FPR, анализ по событиям', 'FPR, per-event analysis')}
          value={`${(data.fprEvent * 100).toFixed(1)}%`} tone={data.fprEvent > 0.09 ? 'bad' : 'ok'} />
        <Readout label={l('FPR, анализ по юзерам', 'FPR, per-user analysis')}
          value={`${(data.fprUser * 100).toFixed(1)}%`} tone={data.fprUser > 0.09 ? 'bad' : 'ok'} />
        <Readout label={l('Обещано alpha', 'Promised alpha')} value="5.0%" />
        <Readout label={l('Во сколько раз хуже', 'Inflation factor')}
          value={`${(data.fprEvent / 0.05).toFixed(1)}x`} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ---------------------------------------------------------------- power ----- */

export function PowerCurve() {
  const [baseline, setBaseline] = useState(0.2);
  const [alpha, setAlpha] = useState(0.05);
  const [seed, setSeed] = useState(6);
  const relLifts = [0.02, 0.05, 0.1];
  const colors = ['var(--series-2)', 'var(--series-1)', 'var(--series-3)'];

  const data = useMemo(() => {
    const curves = relLifts.map((rel) => {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 100; i += 1) {
        const n = 200 * 1.1 ** i;
        if (n > 2_000_000) break;
        pts.push([Math.log10(n), proportionPower(baseline, baseline * (1 + rel), n, alpha)]);
      }
      return pts;
    });

    // Monte Carlo check of the middle curve, so the formula is not taken on faith.
    const rng = makeRng(seed * 1000003);
    const checks: Array<[number, number]> = [];
    const rel = relLifts[1];
    for (const n of [500, 2000, 8000, 32000]) {
      const REPS = 220;
      let rejected = 0;
      const p1 = baseline;
      const p2 = baseline * (1 + rel);
      for (let r = 0; r < REPS; r += 1) {
        // Binomial draws via the normal approximation keep this interactive:
        // at these n it is accurate to well under one count.
        const x1 = Math.round(n * p1 + rng.normal(0, Math.sqrt(n * p1 * (1 - p1))));
        const x2 = Math.round(n * p2 + rng.normal(0, Math.sqrt(n * p2 * (1 - p2))));
        if (twoProportionZTest(x1, n, x2, n, alpha).pValue < alpha) rejected += 1;
      }
      checks.push([Math.log10(n), rejected / REPS]);
    }
    return { curves, checks };
  }, [baseline, alpha, seed]);

  const nFor80 = relLifts.map((rel) =>
    proportionSampleSize(baseline, baseline * rel, alpha, 0.8),
  );

  return (
    <>
      <div className="controls">
        <Slider label={l('Базовая конверсия', 'Baseline conversion')} value={baseline} min={0.01} max={0.5}
          step={0.01} onChange={setBaseline} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label={l('Уровень значимости alpha', 'Significance level alpha')} value={alpha} min={0.01} max={0.2}
          step={0.01} onChange={setAlpha} format={(v) => v.toFixed(2)} />
      </div>
      <Plot xDomain={[Math.log10(200), Math.log10(2_000_000)]} yDomain={[0, 1]} xLabel="log10 n per group"
        yLabel="power" formatY={(v) => `${(v * 100).toFixed(0)}%`} ariaLabel="power versus sample size">
        {(s) => (
          <>
            <HLine at={0.8} s={s} color="var(--text)" label="80%" />
            {data.curves.map((pts, i) => (
              <Line key={i} points={pts} s={s} color={colors[i]} width={2} />
            ))}
            <Dots points={data.checks} s={s} color="var(--text)" r={3.2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          ...relLifts.map((rel, i) => ({ color: colors[i], label: `+${(rel * 100).toFixed(0)}% rel` })),
          { color: 'var(--text)', label: 'Monte Carlo check' },
        ]}
      />
      <div className="readouts">
        {relLifts.map((rel, i) => (
          <Readout key={rel} label={l(`n на группу для +${rel * 100}%`, `n per group for +${rel * 100}%`)}
            value={nFor80[i].toLocaleString('en-US')} />
        ))}
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

export function MdeCalculator() {
  const [baseline, setBaseline] = useState(0.2);
  const [n, setN] = useState(20000);
  const [power, setPower] = useState(0.8);
  const [alpha, setAlpha] = useState(0.05);

  const mde = proportionMde(baseline, n, alpha, power);
  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 100; i += 1) {
      const nn = 500 * 1.12 ** i;
      if (nn > 5_000_000) break;
      pts.push([Math.log10(nn), (proportionMde(baseline, nn, alpha, power) / baseline) * 100]);
    }
    return pts;
  }, [baseline, alpha, power]);

  return (
    <>
      <div className="controls">
        <Slider label={l('Базовая конверсия', 'Baseline conversion')} value={baseline} min={0.01} max={0.5}
          step={0.01} onChange={setBaseline} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label={l('Трафик на группу', 'Traffic per group')} value={Math.log10(n)} min={3} max={6.7}
          step={0.05} onChange={(v) => setN(Math.round(10 ** v))}
          format={() => n.toLocaleString('en-US')} />
        <Slider label={l('Мощность', 'Power')} value={power} min={0.5} max={0.95} step={0.05} onChange={setPower}
          format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label={l('alpha', 'alpha')} value={alpha} min={0.01} max={0.2} step={0.01} onChange={setAlpha}
          format={(v) => v.toFixed(2)} />
      </div>
      <Plot xDomain={[Math.log10(500), Math.log10(5_000_000)]} yDomain={[0, 40]} xLabel="log10 n per group"
        yLabel="MDE, % relative" ariaLabel="minimum detectable effect versus traffic">
        {(s) => (
          <>
            <Line points={curve} s={s} color="var(--series-1)" width={2} />
            <VLine at={Math.log10(n)} s={s} color="var(--series-4)" dashed={false} />
            <HLine at={(mde / baseline) * 100} s={s} color="var(--series-4)" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('MDE абсолютный', 'MDE absolute')} value={`${(mde * 100).toFixed(3)} pp`} />
        <Readout label={l('MDE относительный', 'MDE relative')} value={`${((mde / baseline) * 100).toFixed(2)}%`} />
        <Readout label={l('n для +1% отн.', 'n for +1% rel')}
          value={proportionSampleSize(baseline, baseline * 0.01, alpha, power).toLocaleString('en-US')} />
        <Readout label={l('n для +5% отн.', 'n for +5% rel')}
          value={proportionSampleSize(baseline, baseline * 0.05, alpha, power).toLocaleString('en-US')} />
      </div>
    </>
  );
}

/** The two error types as areas under two densities. */
export function ErrorAreas() {
  const [alpha, setAlpha] = useState(0.05);
  // Opens on a well-powered setup; dragging it down is the point of the control.
  const [effect, setEffect] = useState(2.8);

  const sigma = 1;
  const zCrit = Math.abs(normalQuantile(1 - alpha / 2));
  const power = 1 - normalCdf(zCrit - effect) + normalCdf(-zCrit - effect);
  const domain: [number, number] = [-4, 4 + effect];

  const curve = (mu: number) => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 200; i += 1) {
      const x = domain[0] + ((domain[1] - domain[0]) * i) / 200;
      pts.push([x, normalPdf(x, mu, sigma)]);
    }
    return pts;
  };
  const tail = (mu: number, from: number, to: number) => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 60; i += 1) {
      const x = from + ((to - from) * i) / 60;
      pts.push([x, normalPdf(x, mu, sigma)]);
    }
    return pts;
  };

  return (
    <>
      <div className="controls">
        <Slider label={l('alpha (ошибка I рода)', 'alpha (type I error)')} value={alpha} min={0.005} max={0.3}
          step={0.005} onChange={setAlpha} format={(v) => v.toFixed(3)} />
        <Slider label={l('Эффект в единицах SE', 'Effect in SE units')} value={effect} min={0} max={4} step={0.1}
          onChange={setEffect} format={(v) => v.toFixed(1)} />
      </div>
      <Plot xDomain={domain} yDomain={[0, 0.45]} xLabel="test statistic" yLabel="density"
        ariaLabel="type I and type II error areas">
        {(s) => (
          <>
            <Area points={tail(0, zCrit, domain[1])} s={s} color="var(--bad)" opacity={0.45} baseline={0} />
            <Area points={tail(0, domain[0], -zCrit)} s={s} color="var(--bad)" opacity={0.45} baseline={0} />
            <Area points={tail(effect, -zCrit, zCrit)} s={s} color="var(--warn)" opacity={0.35} baseline={0} />
            <Line points={curve(0)} s={s} color="var(--series-1)" width={2} />
            <Line points={curve(effect)} s={s} color="var(--series-3)" width={2} />
            <VLine at={zCrit} s={s} color="var(--text)" />
            <VLine at={-zCrit} s={s} color="var(--text)" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'H0: no effect' },
          { color: 'var(--series-3)', label: 'H1: real effect' },
          { color: 'var(--bad)', label: 'alpha: false positive' },
          { color: 'var(--warn)', label: 'beta: missed effect' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('alpha', 'alpha')} value={alpha.toFixed(3)} />
        <Readout label={l('beta (ошибка II рода)', 'beta (type II error)')} value={(1 - power).toFixed(3)} />
        <Readout label={l('Мощность 1-beta', 'Power 1-beta')} value={power.toFixed(3)}
          tone={power >= 0.8 ? 'ok' : 'bad'} />
        <Readout label={l('Критическое значение', 'Critical value')} value={`±${zCrit.toFixed(2)}`} />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- A/A tests -- */

export function AaTest() {
  const [n, setN] = useState(5000);
  const [baseline, setBaseline] = useState(0.2);
  const [experiments, setExperiments] = useState(400);
  const [seed, setSeed] = useState(8);

  const data = useMemo(() => {
    const rng = makeRng(seed * 982451653 + n);
    const ps: number[] = [];
    for (let e = 0; e < experiments; e += 1) {
      const sd = Math.sqrt(n * baseline * (1 - baseline));
      const x1 = Math.round(n * baseline + rng.normal(0, sd));
      const x2 = Math.round(n * baseline + rng.normal(0, sd));
      ps.push(twoProportionZTest(x1, n, x2, n).pValue);
    }
    const h = histogram(ps, 20, [0, 1]);
    const fpr = ps.filter((p) => p < 0.05).length / experiments;
    return { h, fpr, ps };
  }, [n, baseline, experiments, seed]);

  return (
    <>
      <div className="controls">
        <Slider label={l('Трафик на группу', 'Traffic per group')} value={n} min={500} max={50000} step={500}
          onChange={setN} format={(v) => v.toLocaleString('en-US')} />
        <Slider label={l('Базовая конверсия', 'Baseline conversion')} value={baseline} min={0.02} max={0.5}
          step={0.01} onChange={setBaseline} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <Slider label={l('Сколько A/A прогнать', 'How many A/A runs')} value={experiments} min={100} max={2000}
          step={100} onChange={setExperiments} format={(v) => String(v)} />
      </div>
      <Plot xDomain={[0, 1]} yDomain={[0, Math.max(...data.h.counts) * 1.2]} xLabel="p-value" yLabel="count"
        ariaLabel="p-value histogram in A/A tests">
        {(s) => (
          <>
            <Bars centers={data.h.centers} values={data.h.counts} binWidth={data.h.width} s={s}
              color="var(--series-1)" opacity={0.65} />
            <HLine at={experiments / 20} s={s} color="var(--text)" label="uniform" />
            <VLine at={0.05} s={s} color="var(--warn)" label="0.05" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Доля p < 0.05', 'Share of p < 0.05')} value={`${(data.fpr * 100).toFixed(1)}%`}
          tone={Math.abs(data.fpr - 0.05) < 0.025 ? 'ok' : 'bad'} />
        <Readout label={l('Ожидаем', 'Expected')} value="5.0%" />
        <Readout label={l('Ложных срабатываний', 'False positives')}
          value={`${Math.round(data.fpr * experiments)} / ${experiments}`} />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/**
 * A broken split: buckets are assigned by a key that correlates with platform,
 * and iOS users convert better. The A/A test stops looking like an A/A test.
 */
export function AaBroken() {
  const [broken, setBroken] = useState<'broken' | 'fixed'>('broken');
  const [gap, setGap] = useState(0.5);
  const [seed, setSeed] = useState(12);
  const EXPERIMENTS = 400;
  const USERS = 4000;
  const pWeb = 0.18;

  const data = useMemo(() => {
    const rng = makeRng(seed * 756065179);
    const pIos = pWeb * (1 + gap);
    const ps: number[] = [];
    for (let e = 0; e < EXPERIMENTS; e += 1) {
      const clicks = [0, 0];
      const counts = [0, 0];
      for (let u = 0; u < USERS; u += 1) {
        const isIos = rng.next() < 0.45;
        // Broken: the bucket key is the platform-correlated id parity.
        const group = broken === 'broken' ? (isIos ? (u % 3 === 0 ? 1 : 0) : u % 2) : rng.int(2);
        counts[group] += 1;
        clicks[group] += rng.bernoulli(isIos ? pIos : pWeb);
      }
      ps.push(twoProportionZTest(clicks[0], counts[0], clicks[1], counts[1]).pValue);
    }
    const h = histogram(ps, 20, [0, 1]);
    const fpr = ps.filter((p) => p < 0.05).length / EXPERIMENTS;
    return { h, fpr };
  }, [broken, gap, seed]);

  return (
    <>
      <div className="controls">
        <Select label={l('Разбиение', 'Split')} value={broken}
          options={[
            { value: 'broken', label: l('Сломанное: ключ коррелирует с платформой', 'Broken: key correlates with platform') },
            { value: 'fixed', label: l('Честное: случайное', 'Honest: random') },
          ]}
          onChange={setBroken} />
        <Slider label={l('Насколько iOS конвертит лучше', 'How much better iOS converts')} value={gap} min={0}
          max={1.5} step={0.05} onChange={setGap} format={(v) => `+${(v * 100).toFixed(0)}%`} />
      </div>
      <Plot xDomain={[0, 1]} yDomain={[0, Math.max(...data.h.counts) * 1.2]} xLabel="p-value" yLabel="count"
        ariaLabel="p-value histogram under a broken split">
        {(s) => (
          <>
            <Bars centers={data.h.centers} values={data.h.counts} binWidth={data.h.width} s={s}
              color={broken === 'broken' ? 'var(--series-2)' : 'var(--series-3)'} opacity={0.65} />
            <HLine at={EXPERIMENTS / 20} s={s} color="var(--text)" label="uniform" />
            <VLine at={0.05} s={s} color="var(--warn)" label="0.05" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Доля p < 0.05', 'Share of p < 0.05')} value={`${(data.fpr * 100).toFixed(1)}%`}
          tone={data.fpr > 0.09 ? 'bad' : 'ok'} />
        <Readout label={l('Ожидаем на честном A/A', 'Expected in an honest A/A')} value="5.0%" />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** Sample ratio mismatch: the split itself is the thing under test. */
export function SrmCheck() {
  const [nA, setNA] = useState(100000);
  const [nB, setNB] = useState(99000);

  const total = nA + nB;
  const expected = total / 2;
  const chi2 = (nA - expected) ** 2 / expected + (nB - expected) ** 2 / expected;
  // df = 1, so the tail is the two-sided normal tail of sqrt(chi2).
  const pValue = zTestPValue(Math.sqrt(chi2));
  const share = nA / total;

  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    const sigma = Math.sqrt(0.25 / total);
    for (let i = 0; i <= 200; i += 1) {
      const x = 0.5 - 4 * sigma + ((8 * sigma) * i) / 200;
      pts.push([x, normalPdf(x, 0.5, sigma)]);
    }
    return pts;
  }, [total]);

  const sigma = Math.sqrt(0.25 / total);
  return (
    <>
      <div className="controls">
        <Slider label={l('Пользователей в A', 'Users in A')} value={nA} min={10000} max={200000} step={1000}
          onChange={setNA} format={(v) => v.toLocaleString('en-US')} />
        <Slider label={l('Пользователей в B', 'Users in B')} value={nB} min={10000} max={200000} step={1000}
          onChange={setNB} format={(v) => v.toLocaleString('en-US')} />
      </div>
      <Plot xDomain={[0.5 - 4 * sigma, 0.5 + 4 * sigma]} yDomain={[0, normalPdf(0.5, 0.5, sigma) * 1.15]}
        xLabel="share of traffic in A" yLabel="density" formatX={(v) => `${(v * 100).toFixed(2)}%`}
        ariaLabel="expected split distribution versus observed share">
        {(s) => (
          <>
            <Area points={curve} s={s} color="var(--series-1)" opacity={0.2} baseline={0} />
            <Line points={curve} s={s} color="var(--series-1)" width={2} />
            <VLine at={0.5} s={s} color="var(--text)" dashed />
            <VLine at={share} s={s} color={pValue < 0.001 ? 'var(--bad)' : 'var(--ok)'} dashed={false} width={2} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Фактическая доля A', 'Observed share of A')} value={`${(share * 100).toFixed(3)}%`} />
        <Readout label={l('Хи-квадрат', 'Chi-square')} value={chi2.toFixed(1)} />
        <Readout label={l('p-value', 'p-value')} value={pValue < 1e-6 ? '< 1e-6' : pValue.toExponential(2)}
          tone={pValue < 0.001 ? 'bad' : 'ok'} />
        <Readout label={l('Вердикт SRM', 'SRM verdict')}
          value={pValue < 0.001 ? 'SRM' : 'ok'} tone={pValue < 0.001 ? 'bad' : 'ok'} />
      </div>
      <p className="faint">
        {`z = ${Math.sqrt(chi2).toFixed(2)}, |A-B| = ${Math.abs(nA - nB).toLocaleString('en-US')}`}
      </p>
    </>
  );
}

/** Kept separate so the A/B theory can show the plain mean-difference test too. */
export function meanDiffSummary(a: number[], b: number[]) {
  const res = welchTTest(a, b);
  return { diff: res.diff, p: res.pValue, mA: mean(a), mB: mean(b) };
}
