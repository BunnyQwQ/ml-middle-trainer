import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { mean } from '@/lib/stats';
import { Bars, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/* ------------------------------------------------------------ time split -- */

/**
 * Random split versus split by time. The world drifts: the coefficient tying
 * the feature to the target moves day by day. A random split lets the model
 * see rows from the same days it is scored on, so it reports a quality that
 * production never delivers. Every number here is fitted by least squares on
 * the simulated rows, not asserted.
 */
export function TimeSplit() {
  const { t } = useLang();
  const [drift, setDrift] = useState(0.06);
  const [noise, setNoise] = useState(0.5);
  const [seed, setSeed] = useState(4);

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863);
    const DAYS = 30;
    const PER_DAY = 60;
    const HORIZON = 7; // days after the training window, i.e. production

    type Row = { day: number; x: number; y: number };
    const rows: Row[] = [];
    for (let day = 0; day < DAYS + HORIZON; day += 1) {
      const slope = 1 + drift * day;
      for (let i = 0; i < PER_DAY; i += 1) {
        const x = rng.normal(0, 1);
        rows.push({ day, x, y: slope * x + rng.normal(0, noise) });
      }
    }

    const past = rows.filter((r) => r.day < DAYS);
    const future = rows.filter((r) => r.day >= DAYS);

    // Random split: 80 % of the same days to train, 20 % held out.
    const shuffled = past.map((r) => ({ r, k: rng.next() })).sort((a, b) => a.k - b.k).map((o) => o.r);
    const cut = Math.floor(shuffled.length * 0.8);
    const randomTrain = shuffled.slice(0, cut);
    const randomTest = shuffled.slice(cut);

    // Time split: the last five days of the window are held out.
    const timeTrain = past.filter((r) => r.day < DAYS - 5);
    const timeTest = past.filter((r) => r.day >= DAYS - 5);

    const fit = (set: Row[]) => {
      let sxy = 0;
      let sxx = 0;
      for (const r of set) {
        sxy += r.x * r.y;
        sxx += r.x * r.x;
      }
      return sxx === 0 ? 0 : sxy / sxx;
    };
    const rmse = (set: Row[], slope: number) =>
      Math.sqrt(mean(set.map((r) => (r.y - slope * r.x) ** 2)));

    const randomSlope = fit(randomTrain);
    const timeSlope = fit(timeTrain);

    const randomScore = rmse(randomTest, randomSlope);
    const timeScore = rmse(timeTest, timeSlope);
    // What production actually gets: the randomly-split model on future days.
    const productionScore = rmse(future, randomSlope);

    const trueSlope: Array<[number, number]> = [];
    for (let day = 0; day < DAYS + HORIZON; day += 1) trueSlope.push([day, 1 + drift * day]);

    return {
      randomScore,
      timeScore,
      productionScore,
      randomSlope,
      timeSlope,
      trueSlope,
      days: DAYS,
      horizon: HORIZON,
      optimism: productionScore / randomScore,
    };
  }, [drift, noise, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Дрейф за день', 'Drift per day')}
          value={drift}
          min={0}
          max={0.15}
          step={0.01}
          onChange={setDrift}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Шум', 'Noise')}
          value={noise}
          min={0.2}
          max={2}
          step={0.1}
          onChange={setNoise}
          format={(v) => v.toFixed(1)}
        />
      </div>

      <Plot
        xDomain={[0, data.days + data.horizon]}
        yDomain={[0, Math.max(3, 1 + drift * (data.days + data.horizon) + 0.5)]}
        xLabel="day"
        yLabel="true coefficient"
        height={190}
        ariaLabel="the true coefficient drifting over days"
      >
        {(s) => (
          <>
            <Line points={data.trueSlope} s={s} color="var(--series-3)" width={2} />
            <HLine at={data.randomSlope} s={s} color="var(--series-1)" />
            <HLine at={data.timeSlope} s={s} color="var(--series-2)" />
            <VLine at={data.days} s={s} color="var(--border-strong)" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-3)', label: 'true' },
          { color: 'var(--series-1)', label: 'fit, random split' },
          { color: 'var(--series-2)', label: 'fit, time split' },
        ]}
      />

      <div className="readouts">
        <Readout
          label={l('RMSE, случайный сплит', 'RMSE, random split')}
          value={data.randomScore.toFixed(3)}
          tone="ok"
        />
        <Readout
          label={l('RMSE, временной сплит', 'RMSE, time split')}
          value={data.timeScore.toFixed(3)}
        />
        <Readout
          label={l('RMSE в проде (следующие 7 дней)', 'RMSE in production (next 7 days)')}
          value={data.productionScore.toFixed(3)}
          tone={data.optimism > 1.2 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Во сколько раз врёт случайный сплит', 'How much the random split flatters')}
          value={`${data.optimism.toFixed(2)}×`}
          tone={data.optimism > 1.2 ? 'bad' : 'ok'}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'При нулевом дрейфе оба сплита дают одно и то же — и именно поэтому случайный сплит кажется безобидным на учебных данных. Подними дрейф: оценка на случайном сплите почти не меняется, а прод уезжает. Модель видела строки тех же дней, на которых её проверяют, и выучила сегодняшний мир, а работать ей завтра. Временной сплит измеряет ровно то, что произойдёт.',
            'With zero drift both splits give the same answer — which is exactly why a random split looks harmless on textbook data. Raise the drift: the random-split estimate barely moves while production drifts away. The model saw rows from the very days it is scored on and learned today\'s world, but it has to work tomorrow. The time split measures exactly what will happen.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* -------------------------------------------------------- baseline ladder -- */

type Strategy = { id: string; label: ReturnType<typeof l>; costMs: number };

const STRATEGIES: Strategy[] = [
  { id: 'random', label: l('Случайный порядок', 'Random order'), costMs: 0 },
  { id: 'popularity', label: l('По популярности', 'By popularity'), costMs: 1 },
  { id: 'match', label: l('По текстовому совпадению', 'By text match'), costMs: 5 },
  { id: 'handblend', label: l('Ручная формула', 'Hand-tuned formula'), costMs: 6 },
  { id: 'fitted', label: l('Обученная линейная модель', 'Fitted linear model'), costMs: 12 },
];

/**
 * The ladder of approaches, with nDCG@5 actually computed by ranking simulated
 * documents rather than quoted. The point is the shape of the curve: the first
 * honest baseline takes most of the distance, and the fitted model adds a
 * useful but much smaller slice at several times the cost.
 */
export function BaselineLadder() {
  const { t } = useLang();
  const [queries, setQueries] = useState(300);
  const [seed, setSeed] = useState(7);

  const data = useMemo(() => {
    const rng = makeRng(seed * 2654435761);
    const DOCS = 20;
    const K = 5;
    // True relevance weights the simulator uses to generate the labels.
    const W = { match: 1.0, popularity: 0.45, fresh: 0.25 };

    type Doc = { match: number; popularity: number; fresh: number; rel: number };
    const sets: Doc[][] = [];
    for (let q = 0; q < queries; q += 1) {
      const docs: Doc[] = [];
      for (let d = 0; d < DOCS; d += 1) {
        const match = rng.next();
        const popularity = rng.next();
        const fresh = rng.next();
        const score = W.match * match + W.popularity * popularity + W.fresh * fresh + rng.normal(0, 0.25);
        docs.push({ match, popularity, fresh, rel: Math.max(0, Math.min(3, Math.round(score * 1.6))) });
      }
      sets.push(docs);
    }

    const dcg = (rels: number[]) =>
      rels.reduce((acc, rel, i) => acc + (2 ** rel - 1) / Math.log2(i + 2), 0);

    const ndcgOf = (score: (d: Doc) => number) => {
      const per = sets.map((docs) => {
        const ranked = [...docs].sort((a, b) => score(b) - score(a)).slice(0, K);
        const ideal = [...docs].sort((a, b) => b.rel - a.rel).slice(0, K);
        const idcg = dcg(ideal.map((d) => d.rel));
        return idcg === 0 ? 0 : dcg(ranked.map((d) => d.rel)) / idcg;
      });
      return mean(per);
    };

    // The "fitted" model: least squares on the first half of the queries,
    // scored on all of them. Normal equations on three features.
    const train = sets.slice(0, Math.floor(sets.length / 2)).flat();
    const fitted = solve3(train);

    const scores: Record<string, number> = {
      random: ndcgOf(() => rng.next()),
      popularity: ndcgOf((d) => d.popularity),
      match: ndcgOf((d) => d.match),
      handblend: ndcgOf((d) => d.match + 0.5 * d.popularity),
      fitted: ndcgOf((d) => fitted[0] * d.match + fitted[1] * d.popularity + fitted[2] * d.fresh),
    };

    const best = scores.fitted;
    const matchShare = (scores.match - scores.random) / (best - scores.random);
    return { scores, fitted, matchShare };
  }, [queries, seed]);

  const values = STRATEGIES.map((s) => data.scores[s.id]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Запросов в симуляции', 'Queries simulated')}
          value={queries}
          min={100}
          max={800}
          step={50}
          onChange={setQueries}
          format={(v) => String(v)}
        />
      </div>

      <Plot
        xDomain={[-0.5, STRATEGIES.length - 0.5]}
        yDomain={[0, 1]}
        xTicks={STRATEGIES.map((_, i) => i)}
        formatX={(v) => String(v + 1)}
        xLabel="approach"
        yLabel="nDCG@5"
        height={200}
        ariaLabel="nDCG of each approach"
      >
        {(s) => (
          <>
            <Bars
              centers={STRATEGIES.map((_, i) => i)}
              values={values}
              binWidth={0.7}
              s={s}
              color="var(--series-1)"
            />
            <HLine at={data.scores.fitted} s={s} color="var(--series-2)" />
          </>
        )}
      </Plot>

      <div className="readouts">
        {STRATEGIES.map((strategy, i) => (
          <Readout
            key={strategy.id}
            label={strategy.label}
            value={`${values[i].toFixed(3)} · ${strategy.costMs} ms`}
            tone={strategy.id === 'fitted' ? 'ok' : undefined}
          />
        ))}
        <Readout
          label={l('Доля пути, которую даёт один честный признак', 'Share of the distance one honest feature gives')}
          value={`${(data.matchShare * 100).toFixed(0)}%`}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Один признак текстового совпадения забирает большую часть разрыва между случайным порядком и обученной моделью — при нулевой стоимости обучения и пяти миллисекундах на запрос. Обученная линейная модель добавляет сверху заметно меньше, чем кажется, пока не измеришь. Отсюда правило: сначала бейзлайн с одним понятным признаком, и только потом модель, иначе нечем будет мерить, стоило ли оно того. Коэффициенты подобраны МНК прямо здесь: совпадение '
              + data.fitted[0].toFixed(2) + ', популярность ' + data.fitted[1].toFixed(2) + ', свежесть ' + data.fitted[2].toFixed(2) + '.',
            'A single text-match feature takes most of the gap between random order and the fitted model — at zero training cost and five milliseconds per query. The fitted linear model adds noticeably less on top than it seems to until you measure. Hence the rule: the baseline with one understandable feature first, the model only after, or there is nothing to measure the model against. The coefficients are least-squares fitted right here: match '
              + data.fitted[0].toFixed(2) + ', popularity ' + data.fitted[1].toFixed(2) + ', freshness ' + data.fitted[2].toFixed(2) + '.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** Least squares for three features against `rel`, via the normal equations. */
function solve3(rows: Array<{ match: number; popularity: number; fresh: number; rel: number }>): [number, number, number] {
  const A = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const b = [0, 0, 0];
  for (const r of rows) {
    const x = [r.match, r.popularity, r.fresh];
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) A[i][j] += x[i] * x[j];
      b[i] += x[i] * r.rel;
    }
  }
  // Gaussian elimination with partial pivoting on a 3x3 system.
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < 3; r += 1) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const d = m[col][col] || 1e-9;
    for (let c = col; c < 4; c += 1) m[col][c] /= d;
    for (let r = 0; r < 3; r += 1) {
      if (r === col) continue;
      const f = m[r][col];
      for (let c = col; c < 4; c += 1) m[r][c] -= f * m[col][c];
    }
  }
  return [m[0][3], m[1][3], m[2][3]];
}

/* ------------------------------------------------------------ model decay -- */

/**
 * Quality falls after training and a retrain puts it back. The sawtooth makes
 * the real question visible: not "does the model degrade" but "how often is it
 * worth retraining", where the answer is where the curve flattens, not zero.
 */
export function ModelDecay() {
  const { t } = useLang();
  const [halfLife, setHalfLife] = useState(30);
  const [cadence, setCadence] = useState(14);
  const DAYS = 120;
  const FRESH = 0.78;
  const FLOOR = 0.5;

  const data = useMemo(() => {
    const qualityAfter = (days: number) => FLOOR + (FRESH - FLOOR) * 2 ** (-days / halfLife);

    const series: Array<[number, number]> = [];
    const never: Array<[number, number]> = [];
    for (let day = 0; day <= DAYS; day += 1) {
      series.push([day, qualityAfter(day % cadence)]);
      never.push([day, qualityAfter(day)]);
    }

    const avg = mean(series.map(([, q]) => q));
    const avgNever = mean(never.map(([, q]) => q));
    const retrains = Math.floor(DAYS / cadence);

    // Marginal value of retraining twice as often, computed the same way.
    const denser = [];
    const half = Math.max(1, Math.round(cadence / 2));
    for (let day = 0; day <= DAYS; day += 1) denser.push(qualityAfter(day % half));
    const avgDenser = mean(denser);

    return { series, never, avg, avgNever, retrains, gainFromDoubling: avgDenser - avg };
  }, [halfLife, cadence]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Период полураспада качества, дней', 'Quality half-life, days')}
          value={halfLife}
          min={5}
          max={90}
          step={5}
          onChange={setHalfLife}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Переобучать раз в, дней', 'Retrain every, days')}
          value={cadence}
          min={1}
          max={60}
          step={1}
          onChange={setCadence}
          format={(v) => String(v)}
        />
      </div>

      <Plot
        xDomain={[0, DAYS]}
        yDomain={[0.45, 0.82]}
        xLabel="day"
        yLabel="quality"
        height={200}
        ariaLabel="model quality with and without retraining"
      >
        {(s) => (
          <>
            <Line points={data.never} s={s} color="var(--series-3)" width={2} dashed />
            <Line points={data.series} s={s} color="var(--series-1)" width={2} />
            <HLine at={data.avg} s={s} color="var(--series-2)" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'with retraining' },
          { color: 'var(--series-3)', label: 'never retrained' },
          { color: 'var(--series-2)', label: 'average' },
        ]}
      />

      <div className="readouts">
        <Readout
          label={l('Среднее качество', 'Average quality')}
          value={data.avg.toFixed(3)}
          tone="ok"
        />
        <Readout
          label={l('Если не переобучать вовсе', 'If never retrained')}
          value={data.avgNever.toFixed(3)}
          tone="bad"
        />
        <Readout
          label={l('Переобучений за 120 дней', 'Retrains over 120 days')}
          value={String(data.retrains)}
        />
        <Readout
          label={l('Прибавка, если переобучать вдвое чаще', 'Gain from retraining twice as often')}
          value={`+${data.gainFromDoubling.toFixed(4)}`}
          tone={data.gainFromDoubling < 0.005 ? 'bad' : 'ok'}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Последняя плашка — единственный честный аргумент в споре «давайте переобучать чаще». Сдвинь частоту с 30 дней на 14 — прибавка заметная; с 7 на 3 — уже на третьем знаке, а инфраструктуры и дежурств это стоит столько же. Та же логика решает, нужен ли онлайн-апдейт: не «быстрее лучше», а «насколько быстрее падает качество, чем мы успеваем его поднимать».',
            'The last readout is the only honest argument in the "let us retrain more often" debate. Move the cadence from 30 days to 14 and the gain is visible; from 7 to 3 and it lives in the third decimal while costing the same infrastructure and on-call. The same logic decides whether online updates are needed: not "faster is better" but "how much faster quality falls than we manage to lift it".',
          ),
        )}
      </p>
    </>
  );
}
