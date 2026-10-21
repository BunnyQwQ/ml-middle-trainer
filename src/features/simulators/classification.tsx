import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/* ----------------------------------------------------- imbalance: ROC vs PR -- */

export function ImbalancePrRoc() {
  const { t } = useLang();
  const [positiveRate, setPositiveRate] = useState(0.5);
  const [separation, setSeparation] = useState(1.6);
  const [seed, setSeed] = useState(3);
  const N = 6000;

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863);
    const scored: Array<{ score: number; label: number }> = [];
    for (let i = 0; i < N; i += 1) {
      const label = rng.next() < positiveRate ? 1 : 0;
      scored.push({ score: rng.normal(label ? separation : 0, 1), label });
    }
    scored.sort((a, b) => b.score - a.score);

    const totalPos = scored.filter((s) => s.label === 1).length;
    const totalNeg = scored.length - totalPos;

    const roc: Array<[number, number]> = [[0, 0]];
    const pr: Array<[number, number]> = [];
    let tp = 0;
    let fp = 0;
    let rocAuc = 0;
    let prevFpr = 0;
    let prevTpr = 0;
    for (const item of scored) {
      if (item.label === 1) tp += 1;
      else fp += 1;
      const tpr = totalPos === 0 ? 0 : tp / totalPos;
      const fpr = totalNeg === 0 ? 0 : fp / totalNeg;
      roc.push([fpr, tpr]);
      pr.push([tpr, tp / (tp + fp)]);
      rocAuc += (fpr - prevFpr) * ((tpr + prevTpr) / 2);
      prevFpr = fpr;
      prevTpr = tpr;
    }

    // Average precision: the area under the precision-recall curve.
    let ap = 0;
    let lastRecall = 0;
    for (const [recall, precision] of pr) {
      ap += (recall - lastRecall) * precision;
      lastRecall = recall;
    }

    return { roc, pr, rocAuc, ap, baseline: totalPos / scored.length };
  }, [positiveRate, separation, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Доля положительного класса', 'Share of the positive class')}
          value={positiveRate}
          min={0.005}
          max={0.5}
          step={0.005}
          onChange={setPositiveRate}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
        <Slider
          label={l('Насколько классы разделимы', 'How separable the classes are')}
          value={separation}
          min={0.2}
          max={3}
          step={0.1}
          onChange={setSeparation}
          format={(v) => v.toFixed(1)}
        />
      </div>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        xLabel="false positive rate / recall"
        yLabel="true positive rate / precision"
        formatX={(v) => v.toFixed(1)}
        formatY={(v) => v.toFixed(1)}
        ariaLabel="ROC and precision-recall curves"
      >
        {(s) => (
          <>
            <Line
              points={[
                [0, 0],
                [1, 1],
              ]}
              s={s}
              color="var(--text-faint)"
              dashed
              width={1}
            />
            <HLine at={data.baseline} s={s} color="var(--text-faint)" label="random precision" />
            <Line points={data.roc} s={s} color="var(--series-1)" width={2} />
            <Line points={data.pr} s={s} color="var(--series-2)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'ROC' },
          { color: 'var(--series-2)', label: 'precision-recall' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('ROC AUC', 'ROC AUC')} value={data.rocAuc.toFixed(3)} tone="ok" />
        <Readout
          label={l('Average precision (PR AUC)', 'Average precision (PR AUC)')}
          value={data.ap.toFixed(3)}
          tone={data.ap > 0.5 ? 'ok' : 'bad'}
        />
        <Readout
          label={l('PR базовой линии', 'Baseline precision')}
          value={data.baseline.toFixed(3)}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Уменьшай долю положительного класса, не трогая разделимость: ROC AUC почти не двигается, average precision падает в разы. Модель не стала хуже — изменилась задача. Поэтому для редких классов отчитываются PR-кривой и average precision, а ROC AUC в таких задачах выглядит обнадёживающе и не значит почти ничего.',
            'Shrink the positive class share without touching separability: ROC AUC barely moves while average precision falls several-fold. The model did not get worse — the task changed. So rare-class problems are reported with the PR curve and average precision, while ROC AUC looks reassuring there and means next to nothing.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* -------------------------------------------------------- macro vs micro --- */

type ClassRow = { name: string; support: number; recall: number; precision: number };

const START_CLASSES: ClassRow[] = [
  { name: 'phones', support: 5000, recall: 0.95, precision: 0.94 },
  { name: 'laptops', support: 3000, recall: 0.92, precision: 0.9 },
  { name: 'kitchen', support: 1200, recall: 0.85, precision: 0.82 },
  { name: 'decor', support: 300, recall: 0.55, precision: 0.5 },
  { name: 'rare-1', support: 60, recall: 0.25, precision: 0.3 },
  { name: 'rare-2', support: 20, recall: 0.1, precision: 0.2 },
];

export function MacroMicro() {
  const { t } = useLang();
  const [tailQuality, setTailQuality] = useState(1);
  const [tailSize, setTailSize] = useState(1);

  const data = useMemo(() => {
    const classes = START_CLASSES.map((c) => {
      const isTail = c.support < 500;
      return {
        ...c,
        support: isTail ? Math.round(c.support * tailSize) : c.support,
        recall: isTail ? Math.min(0.98, c.recall * tailQuality) : c.recall,
        precision: isTail ? Math.min(0.98, c.precision * tailQuality) : c.precision,
      };
    });

    const f1 = (p: number, r: number) => (p + r === 0 ? 0 : (2 * p * r) / (p + r));
    const macro = classes.reduce((acc, c) => acc + f1(c.precision, c.recall), 0) / classes.length;

    // Micro over a single-label multiclass problem equals accuracy.
    let tp = 0;
    let total = 0;
    for (const c of classes) {
      tp += c.support * c.recall;
      total += c.support;
    }
    const micro = tp / total;
    const weighted =
      classes.reduce((acc, c) => acc + c.support * f1(c.precision, c.recall), 0) / total;

    return { classes, macro, micro, weighted, total };
  }, [tailQuality, tailSize]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Качество на редких категориях', 'Quality on rare categories')}
          value={tailQuality}
          min={0.3}
          max={3}
          step={0.05}
          onChange={setTailQuality}
          format={(v) => `${v.toFixed(2)}x`}
        />
        <Slider
          label={l('Размер редких категорий', 'Size of the rare categories')}
          value={tailSize}
          min={0.2}
          max={20}
          step={0.2}
          onChange={setTailSize}
          format={(v) => `${v.toFixed(1)}x`}
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t(l('Категория', 'Category'))}</th>
              <th className="num">{t(l('Примеров', 'Support'))}</th>
              <th className="num">precision</th>
              <th className="num">recall</th>
              <th className="num">F1</th>
            </tr>
          </thead>
          <tbody>
            {data.classes.map((c) => {
              const f1 = (2 * c.precision * c.recall) / Math.max(1e-9, c.precision + c.recall);
              return (
                <tr key={c.name}>
                  <th>{c.name}</th>
                  <td className="num">{c.support}</td>
                  <td className="num">{c.precision.toFixed(2)}</td>
                  <td className="num">{c.recall.toFixed(2)}</td>
                  <td className="num">{f1.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Plot
        xDomain={[-0.5, 2.5]}
        yDomain={[0, 1]}
        xTicks={[0, 1, 2]}
        formatX={(v) => ['macro F1', 'micro F1', 'weighted F1'][Math.round(v)] ?? ''}
        formatY={(v) => v.toFixed(1)}
        yLabel="score"
        ariaLabel="macro, micro and weighted F1 side by side"
        padBottom={34}
        height={180}
      >
        {(s) => (
          <>
            {[data.macro, data.micro, data.weighted].map((v, i) => (
              <Bars
                key={i}
                centers={[i]}
                values={[v]}
                binWidth={0.5}
                s={s}
                color={i === 0 ? 'var(--series-1)' : 'var(--series-2)'}
                opacity={0.8}
              />
            ))}
          </>
        )}
      </Plot>

      <div className="readouts">
        <Readout label={l('macro F1', 'macro F1')} value={data.macro.toFixed(3)} />
        <Readout label={l('micro F1 (= accuracy)', 'micro F1 (= accuracy)')} value={data.micro.toFixed(3)} />
        <Readout label={l('weighted F1', 'weighted F1')} value={data.weighted.toFixed(3)} />
      </div>
      <p className="faint">
        {t(
          l(
            'Ухудшай качество на редких категориях: macro F1 проваливается, micro почти не шевелится — на него приходится 99% примеров из трёх крупных классов. Теперь увеличивай размер редких категорий: micro начинает замечать проблему. Разница между метриками — это разница между вопросами «сколько запросов обработано верно» и «насколько хорошо мы умеем каждую категорию».',
            'Degrade the quality on rare categories: macro F1 collapses while micro hardly moves — 99% of the examples sit in the three large classes. Now grow the rare categories: micro starts noticing. The gap between the metrics is the gap between the questions "how many queries were handled correctly" and "how well do we handle each category".',
          ),
        )}
      </p>
    </>
  );
}

/* ---------------------------------------------------- threshold и coverage -- */

export function ThresholdCoverage() {
  const { t } = useLang();
  const [threshold, setThreshold] = useState(0.5);
  const [seed, setSeed] = useState(6);
  const N = 5000;

  const data = useMemo(() => {
    const rng = makeRng(seed * 756065179);
    // A classifier whose confidence correlates with being right.
    const items: Array<{ confidence: number; correct: boolean }> = [];
    for (let i = 0; i < N; i += 1) {
      const confidence = Math.min(0.999, Math.max(0.2, rng.next() ** 0.6));
      items.push({ confidence, correct: rng.next() < confidence });
    }

    const curve: Array<[number, number]> = [];
    const coverageCurve: Array<[number, number]> = [];
    for (let i = 0; i <= 100; i += 1) {
      const thr = 0.2 + (i / 100) * 0.79;
      const kept = items.filter((it) => it.confidence >= thr);
      const coverage = kept.length / N;
      const precision = kept.length === 0 ? 1 : kept.filter((it) => it.correct).length / kept.length;
      curve.push([coverage, precision]);
      coverageCurve.push([thr, coverage]);
    }

    const kept = items.filter((it) => it.confidence >= threshold);
    const precision = kept.length === 0 ? 1 : kept.filter((it) => it.correct).length / kept.length;
    return {
      curve,
      coverageCurve,
      coverage: kept.length / N,
      precision,
      abstained: 1 - kept.length / N,
    };
  }, [threshold, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Порог уверенности', 'Confidence threshold')}
          value={threshold}
          min={0.2}
          max={0.99}
          step={0.01}
          onChange={setThreshold}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0.5, 1]}
        xLabel="coverage: share of queries answered"
        yLabel="precision on the answered ones"
        formatX={(v) => `${(v * 100).toFixed(0)}%`}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="precision against coverage"
      >
        {(s) => (
          <>
            <Line points={data.curve} s={s} color="var(--series-1)" width={2} />
            <Dots points={[[data.coverage, data.precision]]} s={s} color="var(--series-4)" r={4.5} />
            <VLine at={data.coverage} s={s} color="var(--series-4)" />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Покрытие', 'Coverage')} value={`${(data.coverage * 100).toFixed(1)}%`} />
        <Readout
          label={l('Точность на отвеченных', 'Precision on the answered')}
          value={`${(data.precision * 100).toFixed(1)}%`}
          tone={data.precision > 0.9 ? 'ok' : undefined}
        />
        <Readout label={l('Отказов', 'Abstentions')} value={`${(data.abstained * 100).toFixed(1)}%`} />
      </div>
      <p className="faint">
        {t(
          l(
            'Кривая показывает цену уверенности: отказываясь отвечать на неуверенных запросах, точность на остальных можно поднять почти до единицы — но покрытие падает. Для классификатора категорий это рабочий приём: там, где модель не уверена, фильтр по категории просто не применяют и показывают общую выдачу. Порог выбирают не по максимуму F1, а по требуемой точности при приемлемом покрытии.',
            'The curve shows the price of confidence: by declining to answer on uncertain queries, precision on the rest can be pushed almost to one — but coverage falls. For a category classifier this is a working technique: where the model is unsure, the category filter is simply not applied and general results are shown. The threshold is chosen not by maximum F1 but by a required precision at an acceptable coverage.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
