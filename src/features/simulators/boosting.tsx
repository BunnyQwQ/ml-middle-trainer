import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { mean } from '@/lib/stats';
import { Bars, Dots, Legend, Line, Plot } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------------ gbm steps -- */

type Stump = { threshold: number; left: number; right: number };

/** One depth-1 tree fitted to the residuals by exhaustive search over splits. */
function fitStump(xs: number[], residuals: number[], candidates: number[]): Stump {
  let best: Stump = { threshold: candidates[0], left: 0, right: 0 };
  let bestSse = Infinity;
  for (const threshold of candidates) {
    let leftSum = 0;
    let leftCount = 0;
    let rightSum = 0;
    let rightCount = 0;
    for (let i = 0; i < xs.length; i += 1) {
      if (xs[i] < threshold) {
        leftSum += residuals[i];
        leftCount += 1;
      } else {
        rightSum += residuals[i];
        rightCount += 1;
      }
    }
    if (leftCount === 0 || rightCount === 0) continue;
    const left = leftSum / leftCount;
    const right = rightSum / rightCount;
    let sse = 0;
    for (let i = 0; i < xs.length; i += 1) {
      const pred = xs[i] < threshold ? left : right;
      sse += (residuals[i] - pred) ** 2;
    }
    if (sse < bestSse) {
      bestSse = sse;
      best = { threshold, left, right };
    }
  }
  return best;
}

/**
 * Gradient boosting with depth-1 trees, fitted here in the browser: each tree
 * is trained on what the previous ones got wrong, and the whole model is a sum
 * of steps scaled by the learning rate. Nothing about the curve or the errors
 * is drawn by hand — the stumps are searched over real split candidates.
 */
export function GbmSteps() {
  const { t } = useLang();
  const [trees, setTrees] = useState(10);
  const [rate, setRate] = useState(0.3);
  const [noise, setNoise] = useState(0.25);
  const [seed, setSeed] = useState(2);

  const data = useMemo(() => {
    const rng = makeRng(seed * 1000003);
    const truth = (x: number) => Math.sin(x * 2.2) + 0.35 * x;

    const trainX: number[] = [];
    const trainY: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const x = -3 + (6 * i) / 39;
      trainX.push(x);
      trainY.push(truth(x) + rng.normal(0, noise));
    }
    const testX: number[] = [];
    const testY: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const x = -2.9 + (5.8 * i) / 39;
      testX.push(x);
      testY.push(truth(x) + rng.normal(0, noise));
    }

    const sorted = [...new Set(trainX)].sort((a, b) => a - b);
    const candidates: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) candidates.push((sorted[i - 1] + sorted[i]) / 2);

    const base = mean(trainY);
    const stumps: Stump[] = [];
    let preds = trainX.map(() => base);
    const trainCurve: Array<[number, number]> = [];
    const testCurve: Array<[number, number]> = [];

    const predictAll = (xs: number[]) =>
      xs.map((x) =>
        stumps.reduce((acc, s) => acc + rate * (x < s.threshold ? s.left : s.right), base),
      );

    for (let step = 0; step < trees; step += 1) {
      const residuals = trainY.map((y, i) => y - preds[i]);
      const stump = fitStump(trainX, residuals, candidates);
      stumps.push(stump);
      preds = trainX.map((x, i) => preds[i] + rate * (x < stump.threshold ? stump.left : stump.right));
      trainCurve.push([step + 1, mean(trainY.map((y, i) => (y - preds[i]) ** 2))]);
      const testPreds = predictAll(testX);
      testCurve.push([step + 1, mean(testY.map((y, i) => (y - testPreds[i]) ** 2))]);
    }

    const curve: Array<[number, number]> = [];
    for (let i = 0; i <= 120; i += 1) {
      const x = -3 + (6 * i) / 120;
      curve.push([
        x,
        stumps.reduce((acc, s) => acc + rate * (x < s.threshold ? s.left : s.right), base),
      ]);
    }
    const truthCurve: Array<[number, number]> = [];
    for (let i = 0; i <= 120; i += 1) {
      const x = -3 + (6 * i) / 120;
      truthCurve.push([x, truth(x)]);
    }

    const trainMse = trainCurve.length ? trainCurve[trainCurve.length - 1][1] : mean(trainY.map((y) => (y - base) ** 2));
    const testMse = testCurve.length
      ? testCurve[testCurve.length - 1][1]
      : mean(testY.map((y) => (y - base) ** 2));
    const bestTest = testCurve.reduce(
      (best, [step, value]) => (value < best.value ? { step, value } : best),
      { step: 0, value: Infinity },
    );

    return {
      points: trainX.map((x, i) => [x, trainY[i]] as [number, number]),
      curve,
      truthCurve,
      trainCurve,
      testCurve,
      trainMse,
      testMse,
      bestTest,
      budget: rate * trees,
    };
  }, [trees, rate, noise, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Деревьев', 'Trees')}
          value={trees}
          min={1}
          max={120}
          step={1}
          onChange={setTrees}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Скорость обучения', 'Learning rate')}
          value={rate}
          min={0.02}
          max={1}
          step={0.02}
          onChange={setRate}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Шум в данных', 'Noise in the data')}
          value={noise}
          min={0}
          max={0.8}
          step={0.05}
          onChange={setNoise}
          format={(v) => v.toFixed(2)}
        />
      </div>

      <Plot
        xDomain={[-3, 3]}
        yDomain={[-2.5, 2.5]}
        xLabel="x"
        yLabel="y"
        height={210}
        ariaLabel="the boosted model against the true function"
      >
        {(s) => (
          <>
            <Line points={data.truthCurve} s={s} color="var(--series-3)" width={2} dashed />
            <Dots points={data.points} s={s} color="var(--series-2)" r={2.4} opacity={0.75} />
            <Line points={data.curve} s={s} color="var(--series-1)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'boosted model' },
          { color: 'var(--series-3)', label: 'true function' },
          { color: 'var(--series-2)', label: 'training data' },
        ]}
      />

      <Plot
        xDomain={[1, Math.max(2, trees)]}
        yDomain={[0, Math.max(0.3, data.trainCurve[0]?.[1] ?? 1)]}
        xLabel="trees"
        yLabel="MSE"
        height={170}
        ariaLabel="training and test error against the number of trees"
      >
        {(s) => (
          <>
            <Line points={data.trainCurve} s={s} color="var(--series-1)" width={2} />
            <Line points={data.testCurve} s={s} color="var(--series-4)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'train' },
          { color: 'var(--series-4)', label: 'test' },
        ]}
      />

      <div className="readouts">
        <Readout label={l('MSE на обучении', 'Train MSE')} value={data.trainMse.toFixed(4)} />
        <Readout
          label={l('MSE на отложенных данных', 'Held-out MSE')}
          value={data.testMse.toFixed(4)}
          tone={data.testMse > data.bestTest.value * 1.05 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Лучшее число деревьев', 'Best number of trees')}
          value={`${data.bestTest.step} · ${data.bestTest.value.toFixed(4)}`}
        />
        <Readout
          label={l('Бюджет: скорость × деревья', 'Budget: rate × trees')}
          value={data.budget.toFixed(2)}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Каждое дерево учится на том, что не угадали предыдущие, поэтому кривая набирает форму ступеньками, а не сразу. Произведение скорости на число деревьев — грубое правило, а не равенство: поставь 0.6 и 10 деревьев, потом 0.1 и 60 — бюджет один, результат разный, потому что мелкими шагами модель до той же точки ещё не дошла; дай ей 120 деревьев, и она догонит. Нижний график важнее верхнего: ошибка на обучении падает всегда, а на отложенных данных разворачивается — но только когда в данных есть шум. Поставь шум 0 — лучшим окажется последнее дерево; поставь 0.6 и 120 деревьев — лучшим окажется примерно сороковое, и всё, что после, учит шум. Плашка «лучшее число деревьев» и есть то, что в проде находят ранней остановкой.',
            'Every tree learns from what the previous ones missed, so the curve takes shape in steps rather than at once. The rate times the number of trees is a rough rule, not an equality: set 0.6 and 10 trees, then 0.1 and 60 — the same budget, a different result, because with small steps the model has not reached the same point yet; give it 120 trees and it catches up. The lower chart matters more than the upper one: training error always falls while held-out error turns around — but only when the data has noise. Set the noise to 0 and the last tree is the best one; set it to 0.6 with 120 trees and the best is around the fortieth, with everything after it learning noise. The "best number of trees" readout is what early stopping finds in production.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------ target encoding -- */

type Scheme = 'naive' | 'loo' | 'ordered';

/**
 * Mean target encoding of a categorical feature, in three versions. The naive
 * one puts the row's own label into its own feature, which looks spectacular
 * on training data and collapses on held-out data. The numbers here are the
 * measured log-loss of a model that is nothing but the encoding.
 */
export function TargetEncoding() {
  const { t } = useLang();
  const [scheme, setScheme] = useState<Scheme>('naive');
  const [perCategory, setPerCategory] = useState(3);
  const [prior, setPrior] = useState(1);
  const [seed, setSeed] = useState(6);

  const data = useMemo(() => {
    const rng = makeRng(seed * 7919 + 13);
    const CATEGORIES = 60;

    // Every category has its own true rate; with few rows per category the
    // sample mean is almost pure noise, which is where the trouble lives.
    const rates = Array.from({ length: CATEGORIES }, () => 0.15 + rng.next() * 0.7);
    const rows: Array<{ cat: number; y: number }> = [];
    const test: Array<{ cat: number; y: number }> = [];
    for (let c = 0; c < CATEGORIES; c += 1) {
      for (let i = 0; i < perCategory; i += 1) rows.push({ cat: c, y: rng.next() < rates[c] ? 1 : 0 });
      for (let i = 0; i < 20; i += 1) test.push({ cat: c, y: rng.next() < rates[c] ? 1 : 0 });
    }

    const globalMean = mean(rows.map((r) => r.y));

    // With no prior and no earlier rows there is nothing to divide by; the
    // honest answer in that case is the global mean rather than a NaN.
    const smooth = (sum: number, count: number) =>
      count + prior === 0 ? globalMean : (sum + prior * globalMean) / (count + prior);

    const totals = new Map<number, { sum: number; count: number }>();
    for (const row of rows) {
      const t0 = totals.get(row.cat) ?? { sum: 0, count: 0 };
      t0.sum += row.y;
      t0.count += 1;
      totals.set(row.cat, t0);
    }

    // Training-time encoding under each scheme.
    const seen = new Map<number, { sum: number; count: number }>();
    const trainEncoding = rows.map((row) => {
      const all = totals.get(row.cat)!;
      if (scheme === 'naive') return smooth(all.sum, all.count);
      if (scheme === 'loo') return smooth(all.sum - row.y, all.count - 1);
      const prefix = seen.get(row.cat) ?? { sum: 0, count: 0 };
      const value = smooth(prefix.sum, prefix.count);
      seen.set(row.cat, { sum: prefix.sum + row.y, count: prefix.count + 1 });
      return value;
    });

    // At prediction time every scheme can only use the full training statistic.
    const testEncoding = test.map((row) => {
      const all = totals.get(row.cat)!;
      return smooth(all.sum, all.count);
    });

    const logLoss = (probs: number[], ys: number[]) =>
      mean(
        probs.map((p, i) => {
          const clipped = Math.min(1 - 1e-6, Math.max(1e-6, p));
          return -(ys[i] * Math.log(clipped) + (1 - ys[i]) * Math.log(1 - clipped));
        }),
      );

    const trainLoss = logLoss(trainEncoding, rows.map((r) => r.y));
    const testLoss = logLoss(testEncoding, test.map((r) => r.y));
    const baseline = logLoss(test.map(() => globalMean), test.map((r) => r.y));

    // The honest ceiling: encode with the category's true rate.
    const oracle = logLoss(test.map((r) => rates[r.cat]), test.map((r) => r.y));

    return { trainLoss, testLoss, baseline, oracle, gap: testLoss - trainLoss };
  }, [scheme, perCategory, prior, seed]);

  return (
    <>
      <div className="controls">
        <Select
          label={l('Способ кодирования', 'Encoding scheme')}
          value={scheme}
          options={[
            { value: 'naive', label: l('Наивный: среднее по всей выборке', 'Naive: mean over the whole sample') },
            { value: 'loo', label: l('Leave-one-out', 'Leave-one-out') },
            { value: 'ordered', label: l('Упорядоченный: только прошлое', 'Ordered: the past only') },
          ]}
          onChange={setScheme}
        />
        <Slider
          label={l('Строк на категорию', 'Rows per category')}
          value={perCategory}
          min={1}
          max={30}
          step={1}
          onChange={setPerCategory}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Сила сглаживания (prior)', 'Smoothing strength (prior)')}
          value={prior}
          min={0}
          max={20}
          step={1}
          onChange={setPrior}
          format={(v) => String(v)}
        />
      </div>

      <Plot
        xDomain={[-0.5, 3.5]}
        yDomain={[0, 1.1]}
        xTicks={[0, 1, 2, 3]}
        formatX={(v) => ['train', 'test', 'global', 'oracle'][v] ?? ''}
        xLabel="log loss"
        yLabel="loss"
        height={180}
        ariaLabel="log loss of the encoding on train and test"
      >
        {(s) => (
          <>
            <Bars
              centers={[0, 1, 2, 3]}
              values={[data.trainLoss, data.testLoss, data.baseline, data.oracle]}
              binWidth={0.6}
              s={s}
              color="var(--series-1)"
            />
          </>
        )}
      </Plot>

      <div className="readouts">
        <Readout label={l('Логлосс на обучении', 'Train log loss')} value={data.trainLoss.toFixed(3)} />
        <Readout
          label={l('Логлосс на отложенных данных', 'Held-out log loss')}
          value={data.testLoss.toFixed(3)}
          tone={data.testLoss < data.baseline ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Разрыв между ними', 'The gap between them')}
          value={data.gap.toFixed(3)}
          tone={data.gap > 0.15 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Если предсказывать общее среднее', 'Predicting the global mean')}
          value={data.baseline.toFixed(3)}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Главное здесь — знак разрыва, а не его размер. У наивного кодирования он положительный: обучающая оценка лучше отложенной, то есть льстит. Это самый опасный вид ошибки — модели, которой нет, верят. У leave-one-out и у упорядоченного разрыв отрицательный: обучающая оценка пессимистична, потому что ни одна строка не видит собственной метки, а ранние строки не видят почти ничего. Разница между этими двумя в том, откуда берётся пессимизм: у leave-one-out признак указывает на свою метку в обратную сторону и тем самым всё ещё её выдаёт, а у упорядоченного утечки нет вовсе, просто мало данных в начале. Поставь сглаживание в ноль — оба эффекта станут огромными; верни его и увеличь число строк на категорию — все три сойдутся, и станет видно, что вся проблема живёт в редких категориях.',
            'What matters here is the sign of the gap rather than its size. For naive encoding it is positive: the training estimate is better than the held-out one, that is, it flatters. This is the most dangerous kind of error — people believe a model that is not there. For leave-one-out and for the ordered scheme the gap is negative: the training estimate is pessimistic, because no row sees its own label and the early rows see almost nothing. The difference between those two is where the pessimism comes from: in leave-one-out the feature points at your own label in reverse and so still reveals it, while the ordered scheme has no leak at all, merely little data at the start. Set the smoothing to zero and both effects become enormous; restore it and raise the rows per category and all three converge, showing that the whole problem lives in rare categories.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ---------------------------------------------------------- oblivious -- */

/**
 * Symmetric (oblivious) trees: the same split on every node of a level. The
 * numbers below are counted, not quoted — thresholds stored, comparisons per
 * prediction and how a prediction becomes a single index into the leaf array.
 */
export function ObliviousTrees() {
  const { t } = useLang();
  const [depth, setDepth] = useState(6);

  const data = useMemo(() => {
    const leaves = 2 ** depth;
    const classicNodes = leaves - 1; // a full classic tree stores a split per node
    const obliviousThresholds = depth;
    const rows = [];
    for (let d = 1; d <= 10; d += 1) {
      rows.push({ d, classic: 2 ** d - 1, oblivious: d });
    }
    return { leaves, classicNodes, obliviousThresholds, rows, ratio: classicNodes / depth };
  }, [depth]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Глубина дерева', 'Tree depth')}
          value={depth}
          min={1}
          max={10}
          step={1}
          onChange={setDepth}
          format={(v) => String(v)}
        />
      </div>

      <Plot
        xDomain={[1, 10]}
        yDomain={[0, 1100]}
        xLabel="depth"
        yLabel="splits stored"
        height={180}
        ariaLabel="splits stored by a classic tree against a symmetric one"
      >
        {(s) => (
          <>
            <Line
              points={data.rows.map((r) => [r.d, r.classic] as [number, number])}
              s={s}
              color="var(--series-3)"
              width={2}
            />
            <Line
              points={data.rows.map((r) => [r.d, r.oblivious] as [number, number])}
              s={s}
              color="var(--series-1)"
              width={2}
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-3)', label: 'classic tree' },
          { color: 'var(--series-1)', label: 'symmetric tree' },
        ]}
      />

      <div className="readouts">
        <Readout label={l('Листьев', 'Leaves')} value={String(data.leaves)} />
        <Readout
          label={l('Порогов в классическом дереве', 'Splits in a classic tree')}
          value={String(data.classicNodes)}
        />
        <Readout
          label={l('Порогов в симметричном', 'Splits in a symmetric tree')}
          value={String(data.obliviousThresholds)}
          tone="ok"
        />
        <Readout
          label={l('Во сколько раз меньше', 'How many times fewer')}
          value={`${data.ratio.toFixed(1)}×`}
        />
      </div>

      <pre className="codeblock">
        <code>{`index = 0
for level in range(depth):            # depth comparisons, no branching
    index = index * 2 + (x[f[level]] > t[level])
prediction = leaf_values[index]`}</code>
      </pre>

      <p className="faint">
        {t(
          l(
            'Симметричное дерево на каждом уровне использует один и тот же признак и один и тот же порог, поэтому путь до листа — не обход указателей, а число, собранное из битов сравнений. Отсюда два следствия. Инференс становится предсказуемым по времени и векторизуется: никаких ветвлений, которые процессор не может предсказать, фиксированное число операций на объект. И модель получается жёстче: симметричное дерево выразительно беднее классического той же глубины, что само по себе работает как регуляризация — именно поэтому CatBoost с такими деревьями часто не проигрывает в качестве, выигрывая в скорости предсказания.',
            'A symmetric tree uses the same feature and the same threshold on every node of a level, so the path to a leaf is not a pointer chase but a number assembled from comparison bits. Two consequences follow. Inference becomes predictable in time and vectorisable: no branches the CPU cannot predict, a fixed number of operations per object. And the model gets stiffer: a symmetric tree is strictly less expressive than a classic one of the same depth, which works as regularisation by itself — which is why CatBoost with such trees often loses nothing in quality while winning on prediction speed.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------- ranking losses -- */

/**
 * Pointwise against pairwise, on one fixed ranking. Shifting and scaling the
 * scores leaves the order — and therefore nDCG — untouched, while pointwise
 * MSE reacts violently. All three numbers are recomputed from the same scores.
 */
export function RankingLosses() {
  const { t } = useLang();
  const [shift, setShift] = useState(0);
  const [scale, setScale] = useState(1);

  const data = useMemo(() => {
    // One query: six documents with graded labels and a model that orders them
    // almost correctly.
    const labels = [3, 2, 3, 0, 1, 0];
    const raw = [0.9, 0.7, 0.6, 0.1, 0.75, 0.2];
    const scores = raw.map((s) => s * scale + shift);

    const mse = mean(scores.map((s, i) => (s - labels[i]) ** 2));

    let pairLoss = 0;
    let pairs = 0;
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = 0; j < labels.length; j += 1) {
        if (labels[i] <= labels[j]) continue;
        pairLoss += Math.log(1 + Math.exp(-(scores[i] - scores[j])));
        pairs += 1;
      }
    }
    pairLoss /= pairs;

    const order = labels.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
    const dcg = (idx: number[]) =>
      idx.reduce((acc, i, rank) => acc + (2 ** labels[i] - 1) / Math.log2(rank + 2), 0);
    const ideal = labels.map((_, i) => i).sort((a, b) => labels[b] - labels[a]);
    const ndcg = dcg(order) / dcg(ideal);

    const inversions = (() => {
      let bad = 0;
      let total = 0;
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = 0; j < labels.length; j += 1) {
          if (labels[i] <= labels[j]) continue;
          total += 1;
          if (scores[i] <= scores[j]) bad += 1;
        }
      }
      return { bad, total };
    })();

    return { labels, scores, mse, pairLoss, ndcg, inversions };
  }, [shift, scale]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Сдвиг всех скоров', 'Shift every score')}
          value={shift}
          min={-2}
          max={3}
          step={0.25}
          onChange={setShift}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Масштаб всех скоров', 'Scale every score')}
          value={scale}
          min={0.25}
          max={4}
          step={0.25}
          onChange={setScale}
          format={(v) => `${v.toFixed(2)}×`}
        />
      </div>

      <Plot
        xDomain={[-0.5, 5.5]}
        yDomain={[-2.5, 5]}
        xTicks={[0, 1, 2, 3, 4, 5]}
        formatX={(v) => `d${v + 1}`}
        xLabel="document"
        yLabel="label / score"
        height={190}
        ariaLabel="labels against model scores"
      >
        {(s) => (
          <>
            <Bars
              centers={data.labels.map((_, i) => i)}
              values={data.labels}
              binWidth={0.6}
              s={s}
              color="var(--series-3)"
              opacity={0.4}
            />
            <Dots
              points={data.scores.map((v, i) => [i, v] as [number, number])}
              s={s}
              color="var(--series-1)"
              r={5}
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-3)', label: 'label' },
          { color: 'var(--series-1)', label: 'score' },
        ]}
      />

      <div className="readouts">
        <Readout
          label={l('Поточечный MSE', 'Pointwise MSE')}
          value={data.mse.toFixed(3)}
          tone={data.mse > 2 ? 'bad' : 'ok'}
        />
        <Readout label={l('Попарный логлосс', 'Pairwise log loss')} value={data.pairLoss.toFixed(3)} />
        <Readout label={l('nDCG', 'nDCG')} value={data.ndcg.toFixed(4)} tone="ok" />
        <Readout
          label={l('Неправильных пар', 'Mis-ordered pairs')}
          value={`${data.inversions.bad} / ${data.inversions.total}`}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Подвигай сдвиг. Порядок документов не меняется ни на миллиметр: nDCG и число неправильных пар стоят, попарный логлосс тоже. А поточечный MSE живёт своей жизнью — он минимален там, где скоры случайно попадают в абсолютные значения меток, и растёт в обе стороны от этой точки. Модель, обученная на MSE, потратит ёмкость на то, чтобы туда попасть, хотя пользователю видно только порядок. Масштаб устроен иначе: порядок и nDCG он тоже не трогает, но попарный логлосс падает — растянутые скоры дают большие зазоры между документами, и за те же самые пары модель штрафуется меньше. Отсюда вывод, который стоит помнить: попарный логлосс не метрика качества, его можно улучшить, не улучшив ранжирования.',
            'Move the shift. The order of the documents does not budge: nDCG and the count of mis-ordered pairs hold still, and so does the pairwise log loss. Pointwise MSE, meanwhile, lives its own life — it is smallest where the scores happen to land on the absolute label values and grows in both directions from there. A model trained on MSE spends capacity getting there, although the user only sees the order. The scale works differently: it leaves the order and nDCG alone too, but lowers the pairwise log loss — stretched scores give wider margins between documents, so the model is punished less for exactly the same pairs. Hence a conclusion worth keeping: the pairwise log loss is not a quality metric, it can be improved without improving the ranking.',
          ),
        )}
      </p>
    </>
  );
}
