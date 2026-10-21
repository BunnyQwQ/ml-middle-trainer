import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng, type Rng } from '@/lib/rng';
import { Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/* ------------------------------------------------------------- algorithms -- */

export type Policy = 'greedy' | 'epsilon' | 'ucb' | 'thompson';

type ArmState = { pulls: number; wins: number };

/** One decision of each policy, given what it has seen so far. */
export function selectArm(
  policy: Policy,
  arms: ArmState[],
  round: number,
  epsilon: number,
  rng: Rng,
): number {
  const untried = arms.findIndex((a) => a.pulls === 0);
  if (policy !== 'thompson' && untried !== -1) return untried;

  switch (policy) {
    case 'greedy':
      return argMax(arms.map((a) => a.wins / a.pulls));
    case 'epsilon':
      if (rng.next() < epsilon) return rng.int(arms.length);
      return argMax(arms.map((a) => a.wins / a.pulls));
    case 'ucb':
      return argMax(
        arms.map((a) => a.wins / a.pulls + Math.sqrt((2 * Math.log(round + 1)) / a.pulls)),
      );
    default: {
      // Thompson sampling: draw from each arm's Beta posterior and take the best.
      return argMax(arms.map((a) => sampleBeta(a.wins + 1, a.pulls - a.wins + 1, rng)));
    }
  }
}

function argMax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i += 1) if (values[i] > values[best]) best = i;
  return best;
}

/** Beta sample via two Gamma samples; good enough for a teaching simulator. */
function sampleBeta(a: number, b: number, rng: Rng): number {
  const x = sampleGamma(a, rng);
  const y = sampleGamma(b, rng);
  return x / (x + y);
}

function sampleGamma(shape: number, rng: Rng): number {
  if (shape < 1) {
    return sampleGamma(shape + 1, rng) * Math.pow(rng.next(), 1 / shape);
  }
  // Marsaglia-Tsang
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const z = rng.normal(0, 1);
    const v = (1 + c * z) ** 3;
    if (v <= 0) continue;
    const u = rng.next();
    if (Math.log(u) < 0.5 * z * z + d - d * v + d * Math.log(v)) return d * v;
  }
}

function runBandit(
  policy: Policy,
  rates: number[],
  horizon: number,
  epsilon: number,
  seed: number,
): { regret: Array<[number, number]>; pulls: number[]; reward: number } {
  const rng = makeRng(seed);
  const arms: ArmState[] = rates.map(() => ({ pulls: 0, wins: 0 }));
  const best = Math.max(...rates);
  let cumulativeRegret = 0;
  let reward = 0;
  const regret: Array<[number, number]> = [];
  for (let t = 0; t < horizon; t += 1) {
    const arm = selectArm(policy, arms, t, epsilon, rng);
    const win = rng.next() < rates[arm] ? 1 : 0;
    arms[arm].pulls += 1;
    arms[arm].wins += win;
    reward += win;
    cumulativeRegret += best - rates[arm];
    if (t % Math.max(1, Math.floor(horizon / 120)) === 0) regret.push([t, cumulativeRegret]);
  }
  regret.push([horizon, cumulativeRegret]);
  return { regret, pulls: arms.map((a) => a.pulls), reward };
}

/* -------------------------------------------------------- epsilon tradeoff -- */

export function EpsilonTradeoff() {
  const { t } = useLang();
  const [horizon, setHorizon] = useState(2000);
  const [gap, setGap] = useState(0.04);
  const [seed, setSeed] = useState(3);

  const data = useMemo(() => {
    const rates = [0.2 + gap, 0.2, 0.2, 0.2, 0.18];
    const points: Array<[number, number]> = [];
    for (let i = 0; i <= 20; i += 1) {
      const eps = i / 20;
      let total = 0;
      const REPS = 12;
      for (let r = 0; r < REPS; r += 1) {
        total += runBandit('epsilon', rates, horizon, eps, seed * 1000 + r).reward;
      }
      points.push([eps, total / REPS / horizon]);
    }
    const best = points.reduce((b, p) => (p[1] > b[1] ? p : b), points[0]);
    return { points, best, oracle: Math.max(...rates) };
  }, [horizon, gap, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Длина эксперимента', 'Horizon')}
          value={Math.log10(horizon)}
          min={2}
          max={4.3}
          step={0.05}
          onChange={(v) => setHorizon(Math.round(10 ** v))}
          format={() => horizon.toLocaleString('en-US')}
        />
        <Slider
          label={l('Насколько лучшая рука лучше', 'How much better the best arm is')}
          value={gap}
          min={0.005}
          max={0.15}
          step={0.005}
          onChange={setGap}
          format={(v) => `+${(v * 100).toFixed(1)} pp`}
        />
      </div>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0.17, data.oracle * 1.02]}
        xLabel="epsilon"
        yLabel="average reward"
        formatX={(v) => v.toFixed(1)}
        formatY={(v) => `${(v * 100).toFixed(1)}%`}
        ariaLabel="average reward against the exploration rate"
      >
        {(s) => (
          <>
            <HLine at={data.oracle} s={s} color="var(--text)" label="oracle" />
            <Line points={data.points} s={s} color="var(--series-1)" width={2} />
            <Dots points={[data.best]} s={s} color="var(--ok)" r={4} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Лучшая epsilon', 'Best epsilon')} value={data.best[0].toFixed(2)} tone="ok" />
        <Readout label={l('Её средняя награда', 'Its average reward')} value={`${(data.best[1] * 100).toFixed(2)}%`} />
        <Readout label={l('Потолок (знали бы заранее)', 'Ceiling (with hindsight)')} value={`${(data.oracle * 100).toFixed(2)}%`} />
        <Readout
          label={l('Потеря против потолка', 'Loss against the ceiling')}
          value={`${((1 - data.best[1] / data.oracle) * 100).toFixed(1)}%`}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'При epsilon = 0 алгоритм жадный: он фиксируется на руке, которая случайно повезла в первых испытаниях, и может никогда не найти лучшую. При epsilon = 1 он всегда случаен и получает среднее по всем рукам. Оптимум посередине и зависит от длины эксперимента: чем он длиннее, тем меньше нужно исследовать — информация успевает накопиться.',
            'At epsilon = 0 the algorithm is greedy: it locks onto whichever arm got lucky in the first trials and may never find the best one. At epsilon = 1 it is always random and earns the average across arms. The optimum sits in between and depends on the horizon: the longer it is, the less exploration is needed — the information has time to accumulate.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------------ regret plot -- */

export function BanditRegret() {
  const { t } = useLang();
  const [arms, setArms] = useState(5);
  const [gap, setGap] = useState(0.03);
  const [epsilon, setEpsilon] = useState(0.1);
  const [seed, setSeed] = useState(7);
  const HORIZON = 5000;

  const data = useMemo(() => {
    const rates = Array.from({ length: arms }, (_, i) => (i === 0 ? 0.2 + gap : 0.2 - i * 0.004));
    const policies: Policy[] = ['greedy', 'epsilon', 'ucb', 'thompson'];
    const runs = policies.map((policy) => ({
      policy,
      ...runBandit(policy, rates, HORIZON, epsilon, seed * 7919),
    }));
    return { runs, rates };
  }, [arms, gap, epsilon, seed]);

  const colors: Record<Policy, string> = {
    greedy: 'var(--bad)',
    epsilon: 'var(--series-4)',
    ucb: 'var(--series-1)',
    thompson: 'var(--series-3)',
  };

  const yMax = Math.max(...data.runs.flatMap((r) => r.regret.map((p) => p[1]))) * 1.1;

  return (
    <>
      <div className="controls">
        <Slider label={l('Число рук', 'Number of arms')} value={arms} min={2} max={10} step={1}
          onChange={setArms} format={(v) => String(v)} />
        <Slider label={l('Отрыв лучшей руки', 'Lead of the best arm')} value={gap} min={0.005} max={0.1}
          step={0.005} onChange={setGap} format={(v) => `+${(v * 100).toFixed(1)} pp`} />
        <Slider label={l('epsilon для eps-greedy', 'epsilon for eps-greedy')} value={epsilon} min={0.01}
          max={0.5} step={0.01} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
      </div>
      <Plot
        xDomain={[0, HORIZON]}
        yDomain={[0, Math.max(1, yMax)]}
        xLabel="round"
        yLabel="cumulative regret"
        ariaLabel="cumulative regret of four bandit policies"
      >
        {(s) => (
          <>
            {data.runs.map((run) => (
              <Line key={run.policy} points={run.regret} s={s} color={colors[run.policy]} width={2} />
            ))}
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: colors.greedy, label: 'greedy' },
          { color: colors.epsilon, label: `eps-greedy (${epsilon.toFixed(2)})` },
          { color: colors.ucb, label: 'UCB1' },
          { color: colors.thompson, label: 'Thompson' },
        ]}
      />
      <div className="readouts">
        {data.runs.map((run) => (
          <Readout
            key={run.policy}
            label={l(run.policy, run.policy)}
            value={run.regret[run.regret.length - 1][1].toFixed(1)}
            tone={
              run.regret[run.regret.length - 1][1] ===
              Math.min(...data.runs.map((r) => r.regret[r.regret.length - 1][1]))
                ? 'ok'
                : undefined
            }
          />
        ))}
      </div>
      <p className="faint">
        {t(
          l(
            'Жадная стратегия даёт линейный regret: зафиксировавшись на неверной руке, она теряет одинаково на каждом шаге. У eps-greedy regret тоже линеен, но с меньшим наклоном — доля epsilon тратится впустую всегда. У UCB и Thompson кривая загибается: это логарифмический regret, то есть со временем они почти перестают ошибаться. Уменьши отрыв лучшей руки — всем станет труднее, но порядок сохранится.',
            'The greedy policy produces linear regret: having locked onto the wrong arm, it loses the same amount every round. eps-greedy is linear too but with a gentler slope — the epsilon share is always wasted. UCB and Thompson bend: that is logarithmic regret, meaning they practically stop making mistakes over time. Shrink the lead of the best arm and everything gets harder, but the ordering holds.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* -------------------------------------------------------- Thompson beliefs -- */

export function ThompsonPosteriors() {
  const { t } = useLang();
  const [round, setRound] = useState(200);
  const [seed, setSeed] = useState(2);
  const RATES = [0.25, 0.2, 0.15];

  const data = useMemo(() => {
    const rng = makeRng(seed * 433494437);
    const arms: ArmState[] = RATES.map(() => ({ pulls: 0, wins: 0 }));
    for (let t = 0; t < round; t += 1) {
      const arm = selectArm('thompson', arms, t, 0, rng);
      arms[arm].pulls += 1;
      arms[arm].wins += rng.next() < RATES[arm] ? 1 : 0;
    }

    // Beta density, normalised numerically so the shapes are comparable.
    const curves = arms.map((a) => {
      const alpha = a.wins + 1;
      const beta = a.pulls - a.wins + 1;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 200; i += 1) {
        const x = i / 200;
        const logDensity = (alpha - 1) * Math.log(Math.max(1e-12, x)) + (beta - 1) * Math.log(Math.max(1e-12, 1 - x));
        pts.push([x, Math.exp(logDensity)]);
      }
      const area = pts.reduce((acc, p) => acc + p[1] / 200, 0);
      return pts.map(([x, y]) => [x, y / Math.max(1e-12, area)] as [number, number]);
    });

    return { arms, curves };
  }, [round, seed]);

  const yMax = Math.max(...data.curves.flatMap((c) => c.map((p) => p[1]))) * 1.1;
  const colors = ['var(--series-3)', 'var(--series-1)', 'var(--series-2)'];

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Сколько раундов прошло', 'Rounds elapsed')}
          value={round}
          min={5}
          max={2000}
          step={5}
          onChange={setRound}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0, 0.5]}
        yDomain={[0, Math.max(1, yMax)]}
        xLabel="conversion rate"
        yLabel="belief density"
        formatX={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="beta posteriors of three arms"
      >
        {(s) => (
          <>
            {data.curves.map((curve, i) => (
              <Line key={i} points={curve} s={s} color={colors[i]} width={2} />
            ))}
            {RATES.map((r, i) => (
              <VLine key={i} at={r} s={s} color={colors[i]} />
            ))}
          </>
        )}
      </Plot>
      <Legend
        items={RATES.map((r, i) => ({
          color: colors[i],
          label: `arm ${i + 1}: true ${(r * 100).toFixed(0)}%, pulled ${data.arms[i].pulls}`,
        }))}
      />
      <div className="readouts">
        {data.arms.map((a, i) => (
          <Readout
            key={i}
            label={l(`Рука ${i + 1}: показов`, `Arm ${i + 1}: pulls`)}
            value={String(a.pulls)}
            tone={i === 0 ? 'ok' : undefined}
          />
        ))}
      </div>
      <p className="faint">
        {t(
          l(
            'Каждая кривая — текущее представление алгоритма о конверсии руки. На пятом раунде они почти плоские: неизвестно ничего, и выбор случаен. К двухсотому раунду кривая лучшей руки узкая и стоит правее остальных, а плохие руки остаются широкими — их просто перестали показывать, и знание о них не уточняется. В этом вся суть Thompson sampling: он выделяет показы пропорционально вероятности быть лучшим, а не поровну.',
            'Each curve is the algorithm\'s current belief about an arm\'s conversion. At round five they are nearly flat: nothing is known and the choice is random. By round two hundred the best arm\'s curve is narrow and sits to the right, while the poor arms stay wide — they simply stopped being shown and knowledge about them stopped improving. That is the essence of Thompson sampling: it allocates impressions in proportion to the probability of being best rather than equally.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------------ drift ------- */

export function NonstationaryBandit() {
  const { t } = useLang();
  const [switchAt, setSwitchAt] = useState(2000);
  const [window, setWindow] = useState(500);
  const [seed, setSeed] = useState(11);
  const HORIZON = 5000;

  const data = useMemo(() => {
    const rateAt = (arm: number, t: number) => {
      // The arms swap places halfway through: what was best becomes worst.
      const before = [0.25, 0.15];
      const after = [0.12, 0.3];
      return t < switchAt ? before[arm] : after[arm];
    };

    const run = (useWindow: boolean) => {
      const rng = makeRng(seed * 982451653 + (useWindow ? 1 : 0));
      const history: Array<{ arm: number; win: number }> = [];
      const reward: Array<[number, number]> = [];
      let total = 0;
      for (let t = 0; t < HORIZON; t += 1) {
        const relevant = useWindow ? history.slice(-window) : history;
        const stats = [0, 1].map((arm) => {
          const mine = relevant.filter((h) => h.arm === arm);
          return { pulls: mine.length, wins: mine.reduce((a, h) => a + h.win, 0) };
        });
        const arm = selectArm('thompson', stats, t, 0, rng);
        const win = rng.next() < rateAt(arm, t) ? 1 : 0;
        history.push({ arm, win });
        total += win;
        if (t % 50 === 0) reward.push([t, total / (t + 1)]);
      }
      return reward;
    };

    return { plain: run(false), windowed: run(true) };
  }, [switchAt, window, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Когда руки меняются местами', 'When the arms swap')}
          value={switchAt}
          min={500}
          max={4000}
          step={100}
          onChange={setSwitchAt}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Окно памяти', 'Memory window')}
          value={window}
          min={100}
          max={2000}
          step={50}
          onChange={setWindow}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0, HORIZON]}
        yDomain={[0.1, 0.32]}
        xLabel="round"
        yLabel="average reward so far"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="average reward of a plain and a windowed bandit across a change point"
      >
        {(s) => (
          <>
            <VLine at={switchAt} s={s} color="var(--warn)" label="arms swap" />
            <Line points={data.plain} s={s} color="var(--series-2)" width={2} />
            <Line points={data.windowed} s={s} color="var(--series-3)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'remembers everything' },
          { color: 'var(--series-3)', label: 'sliding window' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Итог: полная память', 'Final: full memory')}
          value={`${(data.plain[data.plain.length - 1][1] * 100).toFixed(2)}%`}
          tone="bad"
        />
        <Readout
          label={l('Итог: окно', 'Final: window')}
          value={`${(data.windowed[data.windowed.length - 1][1] * 100).toFixed(2)}%`}
          tone="ok"
        />
      </div>
      <p className="faint">
        {t(
          l(
            'До переключения обе стратегии одинаковы. После него алгоритм с полной памятью продолжает верить старым данным: за тысячи показов он накопил такую уверенность в первой руке, что новые наблюдения почти не двигают апостериорное распределение. Скользящее окно забывает прошлое и перестраивается за сотни показов. В продовых системах по этой же причине добавляют дисконтирование или периодический сброс: мир меняется быстрее, чем накапливается уверенность.',
            'Before the switch the two strategies are identical. After it, the full-memory algorithm keeps believing the old data: over thousands of pulls it accumulated such confidence in the first arm that new observations barely move the posterior. The sliding window forgets the past and readjusts within hundreds of pulls. Production systems add discounting or periodic resets for the same reason: the world changes faster than confidence accumulates.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** Used by the write-ups: how many pulls a fixed A/B split would waste. */
export function abWaste(arms: number, horizon: number, gap: number): number {
  return ((arms - 1) / arms) * horizon * gap;
}

/** Shown as a bar chart in one of the nodes. */
export function PullDistribution({ pulls }: { pulls: number[] }) {
  const total = pulls.reduce((a, b) => a + b, 0) || 1;
  return (
    <Plot
      xDomain={[-0.5, pulls.length - 0.5]}
      yDomain={[0, 1]}
      xTicks={pulls.map((_, i) => i)}
      formatX={(v) => `arm ${Math.round(v) + 1}`}
      formatY={(v) => `${(v * 100).toFixed(0)}%`}
      yLabel="share of traffic"
      ariaLabel="share of traffic per arm"
      height={160}
    >
      {(s) => (
        <Bars
          centers={pulls.map((_, i) => i)}
          values={pulls.map((p) => p / total)}
          binWidth={0.6}
          s={s}
          color="var(--series-1)"
          opacity={0.8}
        />
      )}
    </Plot>
  );
}
