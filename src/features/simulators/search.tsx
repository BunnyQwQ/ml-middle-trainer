import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { twoProportionZTest, zTestPValue } from '@/lib/stats';
import { Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------------ shared bits -- */

/** Probability that a user even looks at this position. */
export function examination(position: number, decay: number): number {
  return 1 / Math.pow(position, decay);
}

export function dcg(rels: number[], exponential: boolean, k = rels.length): number {
  let sum = 0;
  for (let i = 0; i < Math.min(k, rels.length); i += 1) {
    const gain = exponential ? 2 ** rels[i] - 1 : rels[i];
    sum += gain / Math.log2(i + 2);
  }
  return sum;
}

export function ndcg(rels: number[], exponential: boolean, k = rels.length): number {
  const ideal = [...rels].sort((a, b) => b - a);
  const idealDcg = dcg(ideal, exponential, k);
  return idealDcg === 0 ? 0 : dcg(rels, exponential, k) / idealDcg;
}

const DOC_NAMES = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10'];

/* -------------------------------------------------------- precision/recall -- */

export function PrecisionRecallK() {
  const { t } = useLang();
  // Relevance is binary here; the list starts imperfect on purpose.
  const [rel, setRel] = useState<boolean[]>([
    true, false, true, true, false, false, true, false, false, false,
  ]);

  const totalRelevant = rel.filter(Boolean).length;
  const rows = useMemo(() => {
    let hits = 0;
    return rel.map((r, i) => {
      if (r) hits += 1;
      const k = i + 1;
      return {
        k,
        hits,
        precision: hits / k,
        recall: totalRelevant === 0 ? 0 : hits / totalRelevant,
      };
    });
  }, [rel, totalRelevant]);

  return (
    <>
      <p className="faint" style={{ marginTop: 0 }}>
        {t(
          l(
            'Нажимай на документы, чтобы пометить их релевантными. Метрики пересчитываются сразу.',
            'Click the documents to mark them relevant. The metrics recompute immediately.',
          ),
        )}
      </p>
      <div className="ranklist">
        {rel.map((r, i) => (
          <button
            type="button"
            key={i}
            className={`rankitem${r ? ' rankitem--rel' : ''}`}
            onClick={() => setRel((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          >
            <span className="rankitem__pos">{i + 1}</span>
            <span className="rankitem__name">{DOC_NAMES[i]}</span>
            <span className="rankitem__rel">{r ? '●' : '○'}</span>
          </button>
        ))}
      </div>

      <Plot
        xDomain={[1, 10]}
        yDomain={[0, 1]}
        xLabel="k"
        yLabel="metric"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="precision and recall at k"
      >
        {(s) => (
          <>
            <Line points={rows.map((r) => [r.k, r.precision])} s={s} color="var(--series-1)" width={2} />
            <Line points={rows.map((r) => [r.k, r.recall])} s={s} color="var(--series-2)" width={2} />
            <Dots points={rows.map((r) => [r.k, r.precision])} s={s} color="var(--series-1)" r={2.5} />
            <Dots points={rows.map((r) => [r.k, r.recall])} s={s} color="var(--series-2)" r={2.5} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'precision@k' },
          { color: 'var(--series-2)', label: 'recall@k' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('precision@1', 'precision@1')} value={rows[0].precision.toFixed(2)} />
        <Readout label={l('precision@5', 'precision@5')} value={rows[4].precision.toFixed(2)} />
        <Readout label={l('recall@5', 'recall@5')} value={rows[4].recall.toFixed(2)} />
        <Readout label={l('Релевантных всего', 'Relevant in total')} value={String(totalRelevant)} />
      </div>
      <p className="faint">
        {t(
          l(
            'Обрати внимание: precision@k не растёт монотонно, а recall@k не убывает никогда. И главное — ни одна из двух метрик не замечает порядок внутри топ-k: переставь первый и третий документ, числа не изменятся.',
            'Note that precision@k is not monotone while recall@k never decreases. And crucially, neither metric notices the order inside the top k: swap the first and third document and the numbers stay the same.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------------- MRR and MAP -- */

export function MrrMap() {
  const { t } = useLang();
  const [rel, setRel] = useState<boolean[]>([
    false, false, true, false, true, false, false, true, false, false,
  ]);

  const stats = useMemo(() => {
    const totalRelevant = rel.filter(Boolean).length;
    let hits = 0;
    let apSum = 0;
    let firstRelevant = 0;
    const contributions: Array<{ k: number; precision: number }> = [];
    rel.forEach((r, i) => {
      if (!r) return;
      hits += 1;
      const k = i + 1;
      if (firstRelevant === 0) firstRelevant = k;
      const precision = hits / k;
      apSum += precision;
      contributions.push({ k, precision });
    });
    return {
      totalRelevant,
      rr: firstRelevant === 0 ? 0 : 1 / firstRelevant,
      firstRelevant,
      ap: totalRelevant === 0 ? 0 : apSum / totalRelevant,
      contributions,
    };
  }, [rel]);

  return (
    <>
      <div className="ranklist">
        {rel.map((r, i) => (
          <button
            type="button"
            key={i}
            className={`rankitem${r ? ' rankitem--rel' : ''}`}
            onClick={() => setRel((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          >
            <span className="rankitem__pos">{i + 1}</span>
            <span className="rankitem__name">{DOC_NAMES[i]}</span>
            <span className="rankitem__rel">{r ? '●' : '○'}</span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="num">{t(l('Позиция релевантного', 'Relevant at position'))}</th>
              <th className="num">precision@k</th>
            </tr>
          </thead>
          <tbody>
            {stats.contributions.map((c) => (
              <tr key={c.k}>
                <td className="num">{c.k}</td>
                <td className="num">{c.precision.toFixed(4)}</td>
              </tr>
            ))}
            {stats.contributions.length === 0 && (
              <tr>
                <td colSpan={2} className="muted">
                  {t(l('Нет релевантных документов', 'No relevant documents'))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="readouts">
        <Readout
          label={l('Первый релевантный', 'First relevant')}
          value={stats.firstRelevant === 0 ? '—' : String(stats.firstRelevant)}
        />
        <Readout label={l('RR = 1 / позиция', 'RR = 1 / position')} value={stats.rr.toFixed(4)} />
        <Readout label={l('AP = среднее precision@k', 'AP = mean of precision@k')} value={stats.ap.toFixed(4)} />
        <Readout label={l('Релевантных всего', 'Relevant in total')} value={String(stats.totalRelevant)} />
      </div>
      <p className="faint">
        {t(
          l(
            'RR видит только первый релевантный документ: добавь релевантных ниже — RR не изменится, AP вырастет. Поэтому MRR уместен там, где ответ один (навигационный запрос), а MAP — там, где нужны все (подбор товаров).',
            'RR only sees the first relevant document: add relevant ones further down and RR stays put while AP grows. So MRR fits where there is one answer (a navigational query) and MAP where all of them matter (browsing products).',
          ),
        )}
      </p>
    </>
  );
}

/* ----------------------------------------------------------------- nDCG ---- */

const INITIAL_GRADES = [2, 0, 3, 1, 0, 2, 0, 1, 0, 0];

export function NdcgReorder() {
  const { t } = useLang();
  const [grades, setGrades] = useState<number[]>(INITIAL_GRADES);
  const [exponential, setExponential] = useState(true);
  const [k, setK] = useState(10);

  const stats = useMemo(() => {
    const ideal = [...grades].sort((a, b) => b - a);
    const perPosition = grades.map((g, i) => {
      const gain = exponential ? 2 ** g - 1 : g;
      return i < k ? gain / Math.log2(i + 2) : 0;
    });
    return {
      dcg: dcg(grades, exponential, k),
      idcg: dcg(ideal, exponential, k),
      ndcg: ndcg(grades, exponential, k),
      perPosition,
      ideal,
    };
  }, [grades, exponential, k]);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= grades.length) return;
    setGrades((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function cycleGrade(index: number) {
    setGrades((prev) => prev.map((g, i) => (i === index ? (g + 1) % 4 : g)));
  }

  return (
    <>
      <div className="controls">
        <Select
          label={l('Функция выигрыша', 'Gain function')}
          value={exponential ? 'exp' : 'lin'}
          options={[
            { value: 'exp', label: l('Экспоненциальная: 2^rel - 1', 'Exponential: 2^rel - 1') },
            { value: 'lin', label: l('Линейная: rel', 'Linear: rel') },
          ]}
          onChange={(v) => setExponential(v === 'exp')}
        />
        <Slider
          label={l('Глубина k', 'Cutoff k')}
          value={k}
          min={1}
          max={10}
          step={1}
          onChange={setK}
          format={(v) => String(v)}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Стрелки меняют порядок документов, клик по оценке повышает её по кругу 0 → 1 → 2 → 3. Всё пересчитывается на месте.',
            'The arrows reorder documents, clicking a grade cycles it 0 → 1 → 2 → 3. Everything recomputes in place.',
          ),
        )}
      </p>

      <div className="ranklist ranklist--graded">
        {grades.map((g, i) => (
          <div className={`rankitem rankitem--grade${g}`} key={i}>
            <span className="rankitem__pos">{i + 1}</span>
            <button type="button" className="rankitem__grade" onClick={() => cycleGrade(i)}>
              rel {g}
            </button>
            <span className="rankitem__gain">
              {i < k ? stats.perPosition[i].toFixed(3) : '—'}
            </span>
            <span className="rankitem__moves">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="up">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === grades.length - 1}
                aria-label="down"
              >
                ↓
              </button>
            </span>
          </div>
        ))}
      </div>

      <Plot
        xDomain={[0.4, 10.6]}
        yDomain={[0, Math.max(...stats.perPosition, 1) * 1.2]}
        xLabel="position"
        yLabel="contribution to DCG"
        ariaLabel="contribution of each position to DCG"
        height={170}
      >
        {(s) => (
          <>
            <Bars
              centers={stats.perPosition.map((_, i) => i + 1)}
              values={stats.perPosition}
              binWidth={0.75}
              s={s}
              color="var(--series-1)"
              opacity={0.75}
            />
            {k < 10 && <VLine at={k + 0.5} s={s} color="var(--warn)" label="k" />}
          </>
        )}
      </Plot>

      <div className="readouts">
        <Readout label={l('DCG', 'DCG')} value={stats.dcg.toFixed(4)} />
        <Readout label={l('IDCG (идеальный порядок)', 'IDCG (ideal order)')} value={stats.idcg.toFixed(4)} />
        <Readout
          label={l('nDCG', 'nDCG')}
          value={stats.ndcg.toFixed(4)}
          tone={stats.ndcg > 0.95 ? 'ok' : undefined}
        />
        <Readout
          label={l('Идеальный порядок оценок', 'Ideal grade order')}
          value={stats.ideal.slice(0, k).join(' ')}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Поменяй местами первый и второй документ, потом девятый и десятый — и сравни, насколько изменился nDCG. Логарифмический дисконт устроен так, что ошибка в топе стоит в разы дороже ошибки в хвосте.',
            'Swap the first and second document, then the ninth and tenth, and compare how much nDCG moved. The logarithmic discount is built so that a mistake at the top costs several times more than one in the tail.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------------- discounts --- */

type DiscountKind = 'log2' | 'inverse' | 'none';

export function DiscountCurves() {
  const { t } = useLang();
  const [kind, setKind] = useState<DiscountKind>('log2');

  const weight = (position: number, which: DiscountKind): number => {
    if (which === 'none') return 1;
    if (which === 'inverse') return 1 / position;
    return 1 / Math.log2(position + 1);
  };

  const data = useMemo(() => {
    const positions = Array.from({ length: 10 }, (_, i) => i + 1);
    const series: Record<DiscountKind, number[]> = {
      log2: positions.map((p) => weight(p, 'log2')),
      inverse: positions.map((p) => weight(p, 'inverse')),
      none: positions.map(() => 1),
    };
    // How much a swap of neighbouring positions is worth under this discount.
    const swapCost = (p: number) => weight(p, kind) - weight(p + 1, kind);
    return {
      positions,
      series,
      swapTop: swapCost(1),
      swapTail: swapCost(9),
    };
  }, [kind]);

  const colors: Record<DiscountKind, string> = {
    log2: 'var(--series-1)',
    inverse: 'var(--series-2)',
    none: 'var(--text-faint)',
  };

  return (
    <>
      <div className="controls">
        <Select
          label={l('Дисконт', 'Discount')}
          value={kind}
          options={[
            { value: 'log2', label: l('1 / log2(i+1) — как в DCG', '1 / log2(i+1) — as in DCG') },
            { value: 'inverse', label: l('1 / i — резче', '1 / i — steeper') },
            { value: 'none', label: l('Без дисконта — как в precision@k', 'No discount — as in precision@k') },
          ]}
          onChange={setKind}
        />
      </div>
      <Plot
        xDomain={[1, 10]}
        yDomain={[0, 1.05]}
        xLabel="position"
        yLabel="weight"
        ariaLabel="position weights under different discounts"
        height={190}
      >
        {(s) => (
          <>
            {(['none', 'inverse', 'log2'] as DiscountKind[]).map((which) => (
              <Line
                key={which}
                points={data.positions.map((p, i) => [p, data.series[which][i]])}
                s={s}
                color={colors[which]}
                width={which === kind ? 2.5 : 1.2}
                opacity={which === kind ? 1 : 0.45}
              />
            ))}
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: '1 / log2(i+1)' },
          { color: 'var(--series-2)', label: '1 / i' },
          { color: 'var(--text-faint)', label: 'no discount' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Цена перестановки 1↔2', 'Cost of swapping 1↔2')}
          value={data.swapTop.toFixed(4)}
        />
        <Readout
          label={l('Цена перестановки 9↔10', 'Cost of swapping 9↔10')}
          value={data.swapTail.toFixed(4)}
        />
        <Readout
          label={l('Во сколько раз дороже в топе', 'How much dearer at the top')}
          value={data.swapTail === 0 ? '∞' : `${(data.swapTop / data.swapTail).toFixed(1)}x`}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Без дисконта перестановка в топе и в хвосте стоят одинаково — именно поэтому precision@k слеп к порядку. Логарифм даёт мягкий спад, 1/i — резкий: выбор дисконта это утверждение о том, как пользователь просматривает выдачу.',
            'Without a discount, a swap at the top and in the tail cost the same — which is exactly why precision@k is blind to order. The logarithm decays gently, 1/i sharply: choosing a discount is a claim about how users scan the results.',
          ),
        )}
      </p>
    </>
  );
}

/* ---------------------------------------------------------- position bias -- */

export function PositionBias() {
  const { t } = useLang();
  const [decay, setDecay] = useState(0.9);
  const [seed, setSeed] = useState(2);
  const QUERIES = 4000;

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863);
    // True relevance is deliberately NOT sorted: the ranker made mistakes.
    const trueRel = [0.5, 0.2, 0.6, 0.15, 0.1, 0.3, 0.05, 0.08, 0.04, 0.02];
    const shows = new Array(10).fill(0);
    const clicks = new Array(10).fill(0);
    for (let q = 0; q < QUERIES; q += 1) {
      for (let p = 1; p <= 10; p += 1) {
        shows[p - 1] += 1;
        if (rng.next() < examination(p, decay) * trueRel[p - 1]) clicks[p - 1] += 1;
      }
    }
    const observed = clicks.map((c, i) => c / shows[i]);
    // What the ranking would look like if you sorted by observed CTR.
    const byObserved = observed
      .map((v, i) => ({ i, v }))
      .sort((a, b) => b.v - a.v)
      .map((x) => x.i + 1);
    const byTrue = trueRel
      .map((v, i) => ({ i, v }))
      .sort((a, b) => b.v - a.v)
      .map((x) => x.i + 1);
    const corrected = observed.map((v, i) => v / examination(i + 1, decay));
    return { trueRel, observed, corrected, byObserved, byTrue };
  }, [decay, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Насколько быстро падает внимание', 'How fast attention decays')}
          value={decay}
          min={0}
          max={1.6}
          step={0.05}
          onChange={setDecay}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[0.4, 10.6]}
        yDomain={[0, Math.max(...data.trueRel) * 1.25]}
        xLabel="position"
        yLabel="probability"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="true relevance against observed click-through rate"
      >
        {(s) => (
          <>
            <Bars
              centers={data.trueRel.map((_, i) => i + 1 - 0.18)}
              values={data.trueRel}
              binWidth={0.34}
              s={s}
              color="var(--series-3)"
              opacity={0.8}
            />
            <Bars
              centers={data.observed.map((_, i) => i + 1 + 0.18)}
              values={data.observed}
              binWidth={0.34}
              s={s}
              color="var(--series-2)"
              opacity={0.8}
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-3)', label: 'true relevance' },
          { color: 'var(--series-2)', label: 'observed CTR' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Порядок по истинной релевантности', 'Order by true relevance')}
          value={data.byTrue.slice(0, 4).join(' ')}
        />
        <Readout
          label={l('Порядок по наблюдаемому CTR', 'Order by observed CTR')}
          value={data.byObserved.slice(0, 4).join(' ')}
          tone={data.byObserved[0] === data.byTrue[0] ? 'ok' : 'bad'}
        />
        <Readout
          label={l('CTR позиции 1 / позиции 3', 'CTR of position 1 / position 3')}
          value={`${(data.observed[0] / Math.max(1e-9, data.observed[2])).toFixed(2)}x`}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Третий документ релевантнее первого, но кликов у него меньше: его просто реже смотрят. Поэтому обучать ранжирование на сырых кликах — значит закреплять текущий порядок. Лечится либо поправкой на позицию (делим на вероятность просмотра), либо рандомизацией выдачи, либо интерливингом.',
            'The third document is more relevant than the first yet collects fewer clicks: it is simply examined less often. Training a ranker on raw clicks therefore cements the current order. The cures are a position correction (dividing by the examination probability), randomising the results, or interleaving.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* --------------------------------------------------------- rater agreement -- */

export function RaterAgreement() {
  const { t } = useLang();
  const [skill, setSkill] = useState(0.85);
  const [prevalence, setPrevalence] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const ITEMS = 2000;

  const data = useMemo(() => {
    const rng = makeRng(seed * 433494437);
    let both = 0;
    let neither = 0;
    let onlyA = 0;
    let onlyB = 0;
    for (let i = 0; i < ITEMS; i += 1) {
      const truth = rng.next() < prevalence;
      // Each rater independently gets it right with probability `skill`.
      const a = rng.next() < skill ? truth : !truth;
      const b = rng.next() < skill ? truth : !truth;
      if (a && b) both += 1;
      else if (!a && !b) neither += 1;
      else if (a) onlyA += 1;
      else onlyB += 1;
    }
    const n = ITEMS;
    const po = (both + neither) / n;
    const pA = (both + onlyA) / n;
    const pB = (both + onlyB) / n;
    const pe = pA * pB + (1 - pA) * (1 - pB);
    const kappa = pe === 1 ? 0 : (po - pe) / (1 - pe);
    return { both, neither, onlyA, onlyB, po, pe, kappa };
  }, [skill, prevalence, seed]);

  const quality =
    data.kappa > 0.8 ? 'ok' : data.kappa > 0.6 ? undefined : ('bad' as const);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Качество разметчика', 'Rater accuracy')}
          value={skill}
          min={0.5}
          max={0.99}
          step={0.01}
          onChange={setSkill}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Slider
          label={l('Доля релевантных в выборке', 'Share of relevant items')}
          value={prevalence}
          min={0.02}
          max={0.98}
          step={0.02}
          onChange={setPrevalence}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th />
              <th className="num">{t(l('B: релевантно', 'B: relevant'))}</th>
              <th className="num">{t(l('B: нет', 'B: no'))}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>{t(l('A: релевантно', 'A: relevant'))}</th>
              <td className="num">{data.both}</td>
              <td className="num">{data.onlyA}</td>
            </tr>
            <tr>
              <th>{t(l('A: нет', 'A: no'))}</th>
              <td className="num">{data.onlyB}</td>
              <td className="num">{data.neither}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="readouts">
        <Readout label={l('Простое согласие', 'Raw agreement')} value={`${(data.po * 100).toFixed(1)}%`} />
        <Readout label={l('Согласие по случайности', 'Agreement by chance')} value={`${(data.pe * 100).toFixed(1)}%`} />
        <Readout label={l('Каппа Коэна', "Cohen's kappa")} value={data.kappa.toFixed(3)} tone={quality} />
      </div>
      <p className="faint">
        {t(
          l(
            'Поставь долю релевантных в 5%: простое согласие подскочит выше 90%, потому что оба разметчика почти всегда говорят «нерелевантно», а каппа останется низкой. Это и есть причина, по которой согласованность меряют каппой, а не процентом совпадений — и почему выборку для разметки стратифицируют, а не берут случайную.',
            'Set the share of relevant items to 5%: raw agreement jumps above 90% because both raters almost always say "not relevant", while kappa stays low. That is why agreement is measured with kappa rather than a percentage of matches — and why labelling samples are stratified rather than drawn at random.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------- offline vs online -- */

export function OfflineOnline() {
  const { t } = useLang();
  const [fidelity, setFidelity] = useState(0.6);
  const [seed, setSeed] = useState(5);
  const EXPERIMENTS = 160;

  const data = useMemo(() => {
    const rng = makeRng(seed * 982451653);
    const points: Array<[number, number]> = [];
    let shippedBad = 0;
    let offlineWins = 0;
    for (let i = 0; i < EXPERIMENTS; i += 1) {
      // The true online effect of this change.
      const online = rng.normal(0, 1);
      // The offline metric sees part of the truth plus its own noise.
      const offline =
        fidelity * online + Math.sqrt(Math.max(0, 1 - fidelity * fidelity)) * rng.normal(0, 1);
      points.push([offline, online]);
      if (offline > 0.3) {
        offlineWins += 1;
        if (online < 0) shippedBad += 1;
      }
    }
    const share = offlineWins === 0 ? 0 : shippedBad / offlineWins;
    return { points, share, offlineWins };
  }, [fidelity, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Насколько оффлайн-метрика отражает онлайн', 'How well the offline metric tracks online')}
          value={fidelity}
          min={0}
          max={0.98}
          step={0.02}
          onChange={setFidelity}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[-3, 3]}
        yDomain={[-3, 3]}
        xLabel="offline metric change"
        yLabel="online effect"
        ariaLabel="offline metric change against online effect"
      >
        {(s) => (
          <>
            <HLine at={0} s={s} color="var(--border-strong)" dashed={false} />
            <VLine at={0.3} s={s} color="var(--warn)" label="ship threshold" />
            <Dots
              points={data.points.filter((p) => !(p[0] > 0.3 && p[1] < 0))}
              s={s}
              color="var(--series-1)"
              r={2.6}
              opacity={0.6}
            />
            <Dots
              points={data.points.filter((p) => p[0] > 0.3 && p[1] < 0)}
              s={s}
              color="var(--bad)"
              r={3.2}
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'experiments' },
          { color: 'var(--bad)', label: 'offline win, online loss' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Прошли оффлайн-порог', 'Passed the offline threshold')}
          value={String(data.offlineWins)}
        />
        <Readout
          label={l('Из них вредны онлайн', 'Of them harmful online')}
          value={`${(data.share * 100).toFixed(0)}%`}
          tone={data.share > 0.2 ? 'bad' : 'ok'}
        />
        <Readout label={l('Корреляция', 'Correlation')} value={fidelity.toFixed(2)} />
      </div>
      <p className="faint">
        {t(
          l(
            'Оффлайн-метрика нужна не для принятия решения, а для отсева: она дёшева и позволяет не катить в эксперимент заведомо плохое. Даже при корреляции 0.6 заметная доля прошедших отбор изменений ухудшает продукт — поэтому последнее слово всегда за онлайн-экспериментом.',
            'An offline metric is not there to make the decision but to filter: it is cheap and keeps obviously bad changes out of the experiment queue. Even at a correlation of 0.6 a sizeable share of the changes that pass the filter make the product worse — which is why the online experiment always has the last word.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------------ interleaving -- */

export function InterleavingSim() {
  const { t } = useLang();
  const [gap, setGap] = useState(0.12);
  const [seed, setSeed] = useState(9);
  const REPS = 120;

  const data = useMemo(() => {
    const rng = makeRng(seed * 756065179 + Math.round(gap * 1000));
    const decay = 0.9;
    // Ranker B is better: its documents are relevant a bit more often.
    const relA = 0.3;
    const relB = 0.3 * (1 + gap);

    const sizes = [200, 500, 1500, 5000, 20000];
    const abPower: Array<[number, number]> = [];
    const tdiPower: Array<[number, number]> = [];

    for (const n of sizes) {
      let abHits = 0;
      let tdiHits = 0;
      for (let r = 0; r < REPS; r += 1) {
        // --- classic A/B: half the queries see A, half see B, compare CTR.
        let clicksA = 0;
        let clicksB = 0;
        let showsA = 0;
        let showsB = 0;
        for (let q = 0; q < n; q += 1) {
          const toB = rng.next() < 0.5;
          const rel = toB ? relB : relA;
          for (let p = 1; p <= 5; p += 1) {
            if (toB) showsB += 1;
            else showsA += 1;
            const clicked = rng.next() < examination(p, decay) * rel;
            if (clicked) {
              if (toB) clicksB += 1;
              else clicksA += 1;
            }
          }
        }
        if (twoProportionZTest(clicksA, showsA, clicksB, showsB).pValue < 0.05) abHits += 1;

        // --- team-draft interleaving: both rankings in one result page,
        // and the comparison happens inside each query.
        let winsA = 0;
        let winsB = 0;
        for (let q = 0; q < n; q += 1) {
          let cA = 0;
          let cB = 0;
          for (let p = 1; p <= 5; p += 1) {
            // Alternating draft: odd positions from one team, even from the other,
            // with the starting team chosen at random per query.
            const fromB = (p + (rng.next() < 0.5 ? 0 : 1)) % 2 === 0;
            const rel = fromB ? relB : relA;
            if (rng.next() < examination(p, decay) * rel) {
              if (fromB) cB += 1;
              else cA += 1;
            }
          }
          if (cA > cB) winsA += 1;
          else if (cB > cA) winsB += 1;
        }
        const decided = winsA + winsB;
        if (decided > 0) {
          // Binomial test against 50/50 on the queries that had a winner.
          const z = (winsB - decided / 2) / Math.sqrt(decided * 0.25);
          if (zTestPValue(z) < 0.05) tdiHits += 1;
        }
      }
      abPower.push([Math.log10(n), abHits / REPS]);
      tdiPower.push([Math.log10(n), tdiHits / REPS]);
    }
    return { abPower, tdiPower, sizes };
  }, [gap, seed]);

  const firstAbove = (series: Array<[number, number]>) => {
    const hit = series.find((p) => p[1] >= 0.8);
    return hit ? Math.round(10 ** hit[0]) : null;
  };
  const abN = firstAbove(data.abPower);
  const tdiN = firstAbove(data.tdiPower);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Насколько B лучше A', 'How much better B is than A')}
          value={gap}
          min={0.02}
          max={0.4}
          step={0.02}
          onChange={setGap}
          format={(v) => `+${(v * 100).toFixed(0)}%`}
        />
      </div>
      <Plot
        xDomain={[Math.log10(200), Math.log10(20000)]}
        yDomain={[0, 1]}
        xLabel="log10 queries"
        yLabel="power"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="power of an A/B test against team-draft interleaving"
      >
        {(s) => (
          <>
            <HLine at={0.8} s={s} color="var(--text)" label="80%" />
            <Line points={data.abPower} s={s} color="var(--series-2)" width={2} />
            <Line points={data.tdiPower} s={s} color="var(--series-3)" width={2} />
            <Dots points={data.abPower} s={s} color="var(--series-2)" r={3} />
            <Dots points={data.tdiPower} s={s} color="var(--series-3)" r={3} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'classic A/B on CTR' },
          { color: 'var(--series-3)', label: 'team-draft interleaving' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Запросов для A/B', 'Queries for A/B')}
          value={abN === null ? '> 20k' : abN.toLocaleString('en-US')}
        />
        <Readout
          label={l('Запросов для интерливинга', 'Queries for interleaving')}
          value={tdiN === null ? '> 20k' : tdiN.toLocaleString('en-US')}
          tone="ok"
        />
        <Readout
          label={l('Выигрыш по трафику', 'Traffic advantage')}
          value={abN && tdiN ? `${(abN / tdiN).toFixed(0)}x` : '—'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Интерливинг сравнивает две выдачи внутри одного запроса, поэтому различия между запросами и пользователями сокращаются, а не добавляются в дисперсию. Отсюда выигрыш в чувствительности в десятки раз. Плата: интерливинг отвечает только на вопрос «какое ранжирование пользователю нравится больше» и ничего не говорит про выручку, удержание и прочие продуктовые метрики.',
            'Interleaving compares two rankings inside a single query, so differences between queries and users cancel instead of adding to the variance. Hence the order-of-magnitude gain in sensitivity. The price: interleaving answers only "which ranking do users prefer" and says nothing about revenue, retention or other product metrics.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
