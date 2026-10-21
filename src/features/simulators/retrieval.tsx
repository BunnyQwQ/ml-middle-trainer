import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { Dots, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/* ----------------------------------------------------------------- BM25 --- */

type Doc = { id: string; terms: Record<string, number>; length: number };

const CORPUS: Doc[] = [
  { id: 'd1', terms: { ноутбук: 3, игровой: 1, ram: 1 }, length: 40 },
  { id: 'd2', terms: { ноутбук: 12, ram: 2 }, length: 220 },
  { id: 'd3', terms: { ноутбук: 1, игровой: 4 }, length: 60 },
  { id: 'd4', terms: { ram: 6, игровой: 1 }, length: 95 },
  { id: 'd5', terms: { ноутбук: 2, игровой: 2, ram: 2 }, length: 70 },
  { id: 'd6', terms: { монитор: 5 }, length: 50 },
];

const QUERY = ['ноутбук', 'игровой'];

function idf(term: string, corpus: Doc[]): number {
  const n = corpus.length;
  const df = corpus.filter((d) => (d.terms[term] ?? 0) > 0).length;
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

export function bm25Score(doc: Doc, query: string[], corpus: Doc[], k1: number, b: number): number {
  const avgdl = corpus.reduce((acc, d) => acc + d.length, 0) / corpus.length;
  let score = 0;
  for (const term of query) {
    const f = doc.terms[term] ?? 0;
    if (f === 0) continue;
    const norm = 1 - b + (b * doc.length) / avgdl;
    score += idf(term, corpus) * ((f * (k1 + 1)) / (f + k1 * norm));
  }
  return score;
}

export function Bm25Explorer() {
  const { t } = useLang();
  const [k1, setK1] = useState(1.2);
  const [b, setB] = useState(0.75);

  const data = useMemo(() => {
    const scored = CORPUS.map((doc) => ({
      doc,
      score: bm25Score(doc, QUERY, CORPUS, k1, b),
    })).sort((x, y) => y.score - x.score);

    // How the term-frequency contribution saturates.
    const avgdl = CORPUS.reduce((acc, d) => acc + d.length, 0) / CORPUS.length;
    const curve: Array<[number, number]> = [];
    for (let f = 0; f <= 20; f += 0.25) {
      const norm = 1 - b + (b * avgdl) / avgdl;
      curve.push([f, (f * (k1 + 1)) / (f + k1 * norm)]);
    }
    const linear: Array<[number, number]> = [];
    for (let f = 0; f <= 20; f += 1) linear.push([f, f / 5]);

    return { scored, curve, linear, avgdl, idfs: QUERY.map((q) => ({ q, v: idf(q, CORPUS) })) };
  }, [k1, b]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('k1 — насыщение по частоте', 'k1 — term frequency saturation')}
          value={k1}
          min={0}
          max={3}
          step={0.1}
          onChange={setK1}
          format={(v) => v.toFixed(1)}
        />
        <Slider
          label={l('b — нормировка на длину', 'b — length normalisation')}
          value={b}
          min={0}
          max={1}
          step={0.05}
          onChange={setB}
          format={(v) => v.toFixed(2)}
        />
      </div>

      <p className="faint">
        {t(l('Запрос: ', 'Query: '))}
        <code>ноутбук игровой</code>
      </p>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t(l('Документ', 'Document'))}</th>
              <th className="num">{t(l('«ноутбук»', '"ноутбук"'))}</th>
              <th className="num">{t(l('«игровой»', '"игровой"'))}</th>
              <th className="num">{t(l('Длина', 'Length'))}</th>
              <th className="num">BM25</th>
            </tr>
          </thead>
          <tbody>
            {data.scored.map(({ doc, score }) => (
              <tr key={doc.id} style={{ opacity: score === 0 ? 0.45 : 1 }}>
                <th>{doc.id}</th>
                <td className="num">{doc.terms['ноутбук'] ?? 0}</td>
                <td className="num">{doc.terms['игровой'] ?? 0}</td>
                <td className="num">{doc.length}</td>
                <td className="num">{score.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Plot
        xDomain={[0, 20]}
        yDomain={[0, Math.max(3, k1 + 1.4)]}
        xLabel="term frequency in the document"
        yLabel="contribution"
        ariaLabel="term frequency saturation curve"
        height={180}
      >
        {(s) => (
          <>
            <Line points={data.linear} s={s} color="var(--text-faint)" dashed width={1.5} />
            <Line points={data.curve} s={s} color="var(--series-1)" width={2} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'BM25 saturation' },
          { color: 'var(--text-faint)', label: 'linear tf, for comparison' },
        ]}
      />

      <div className="readouts">
        <Readout label={l('idf «ноутбук»', 'idf of "ноутбук"')} value={data.idfs[0].v.toFixed(3)} />
        <Readout label={l('idf «игровой»', 'idf of "игровой"')} value={data.idfs[1].v.toFixed(3)} />
        <Readout label={l('Средняя длина документа', 'Average document length')} value={data.avgdl.toFixed(1)} />
        <Readout label={l('Победитель', 'Winner')} value={data.scored[0].doc.id} />
      </div>
      <p className="faint">
        {t(
          l(
            'Поставь k1 = 0: вклад частоты становится ступенькой, важно только наличие слова. Увеличь k1 — кривая выпрямляется, и длинный документ d2 с двенадцатью вхождениями начинает побеждать. Поставь b = 0: нормировка на длину выключается, и d2 выигрывает просто потому, что он длинный. Эти два параметра и есть весь BM25 поверх idf.',
            'Set k1 = 0: the frequency contribution becomes a step and only presence matters. Raise k1 and the curve straightens, so the long document d2 with twelve occurrences starts winning. Set b = 0: length normalisation switches off and d2 wins simply for being long. Those two parameters are all of BM25 on top of idf.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------------- two stage -- */

export function TwoStage() {
  const { t } = useLang();
  const [budget, setBudget] = useState(200);
  const [rerankerQuality, setRerankerQuality] = useState(0.85);
  const [retrievalQuality, setRetrievalQuality] = useState(0.6);

  const data = useMemo(() => {
    // Recall of the candidate stage grows with the budget and its own quality.
    const recallAt = (k: number) => 1 - Math.exp(-retrievalQuality * Math.log2(1 + k) * 0.55);
    const curve: Array<[number, number]> = [];
    const finalCurve: Array<[number, number]> = [];
    for (let i = 0; i <= 60; i += 1) {
      const k = Math.round(10 * 1.12 ** i);
      if (k > 20000) break;
      const r = recallAt(k);
      curve.push([Math.log10(k), r]);
      // Whatever the reranker does, it can only reorder what it was given.
      finalCurve.push([Math.log10(k), r * rerankerQuality]);
    }
    const recall = recallAt(budget);
    return {
      curve,
      finalCurve,
      recall,
      final: recall * rerankerQuality,
      // Cost grows linearly with the candidate budget for a cross-encoder.
      cost: budget,
    };
  }, [budget, rerankerQuality, retrievalQuality]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Кандидатов с первой стадии', 'Candidates from the first stage')}
          value={Math.log10(budget)}
          min={1}
          max={4.3}
          step={0.05}
          onChange={(v) => setBudget(Math.round(10 ** v))}
          format={() => budget.toLocaleString('en-US')}
        />
        <Slider
          label={l('Качество отбора кандидатов', 'Quality of the candidate stage')}
          value={retrievalQuality}
          min={0.2}
          max={1.5}
          step={0.05}
          onChange={setRetrievalQuality}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Качество переранжирования', 'Quality of the reranker')}
          value={rerankerQuality}
          min={0.4}
          max={1}
          step={0.02}
          onChange={setRerankerQuality}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[1, 4.3]}
        yDomain={[0, 1]}
        xLabel="log10 candidates"
        yLabel="quality"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="recall of the first stage and final quality against the candidate budget"
      >
        {(s) => (
          <>
            <Line points={data.curve} s={s} color="var(--series-1)" width={2} />
            <Line points={data.finalCurve} s={s} color="var(--series-3)" width={2} />
            <VLine at={Math.log10(budget)} s={s} color="var(--series-4)" dashed={false} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'recall of the candidate stage (the ceiling)' },
          { color: 'var(--series-3)', label: 'final quality after reranking' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('recall кандидатов', 'Candidate recall')} value={`${(data.recall * 100).toFixed(1)}%`} />
        <Readout
          label={l('Итоговое качество', 'Final quality')}
          value={`${(data.final * 100).toFixed(1)}%`}
        />
        <Readout
          label={l('Стоимость переранжирования', 'Reranking cost')}
          value={`${data.cost.toLocaleString('en-US')} ${t(l('пар', 'pairs'))}`}
          tone={data.cost > 2000 ? 'bad' : 'ok'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Синяя кривая — потолок: документ, не попавший в кандидаты, не вернёт никакое переранжирование. Зелёная всегда под ней. Увеличивать бюджет кандидатов выгодно ровно до того места, где синяя кривая выходит на плато, — дальше растёт только стоимость, потому что кросс-энкодер считает каждую пару отдельно.',
            'The blue curve is the ceiling: a document that never entered the candidate set cannot be recovered by any reranker. The green one always sits below it. Raising the candidate budget pays off exactly up to where the blue curve plateaus — beyond that only the cost grows, because a cross-encoder scores every pair separately.',
          ),
        )}
      </p>
    </>
  );
}

/* --------------------------------------------------------------- ANN: IVF -- */

type Point = { x: number; y: number };

function buildPoints(seed: number, clusters: number, perCluster: number) {
  const rng = makeRng(seed);
  const centers: Point[] = [];
  for (let c = 0; c < clusters; c += 1) {
    centers.push({ x: rng.next() * 100, y: rng.next() * 100 });
  }
  const points: Array<Point & { cluster: number }> = [];
  for (let c = 0; c < clusters; c += 1) {
    for (let i = 0; i < perCluster; i += 1) {
      points.push({
        x: centers[c].x + rng.normal(0, 7),
        y: centers[c].y + rng.normal(0, 7),
        cluster: c,
      });
    }
  }
  return { centers, points };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function AnnIvf() {
  const { t } = useLang();
  const [nprobe, setNprobe] = useState(1);
  const [seed, setSeed] = useState(2);
  const CLUSTERS = 12;
  const PER_CLUSTER = 60;
  const K = 10;

  const data = useMemo(() => {
    const { centers, points } = buildPoints(seed * 7919, CLUSTERS, PER_CLUSTER);
    const query: Point = { x: 50, y: 50 };

    const exact = [...points]
      .map((p, i) => ({ i, d: dist(p, query) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, K)
      .map((r) => r.i);

    const probed = centers
      .map((c, i) => ({ i, d: dist(c, query) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, nprobe)
      .map((r) => r.i);

    const scanned = points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => probed.includes((p as Point & { cluster: number }).cluster));

    const approx = scanned
      .map(({ p, i }) => ({ i, d: dist(p, query) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, K)
      .map((r) => r.i);

    const hit = approx.filter((i) => exact.includes(i)).length;

    return {
      centers,
      points,
      query,
      probed,
      scannedCount: scanned.length,
      recall: hit / K,
      exact,
      total: points.length,
    };
  }, [nprobe, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('nprobe — сколько ячеек просматриваем', 'nprobe — how many cells we scan')}
          value={nprobe}
          min={1}
          max={CLUSTERS}
          step={1}
          onChange={setNprobe}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-10, 110]}
        yDomain={[-10, 110]}
        xLabel="dimension 1"
        yLabel="dimension 2"
        ariaLabel="IVF cells and the scanned region"
        height={260}
      >
        {(s) => (
          <>
            <Dots
              points={data.points
                .filter((p) => !data.probed.includes(p.cluster))
                .map((p) => [p.x, p.y] as [number, number])}
              s={s}
              color="var(--text-faint)"
              r={1.6}
              opacity={0.35}
            />
            <Dots
              points={data.points
                .filter((p) => data.probed.includes(p.cluster))
                .map((p) => [p.x, p.y] as [number, number])}
              s={s}
              color="var(--series-1)"
              r={2}
              opacity={0.75}
            />
            <Dots
              points={data.exact.map((i) => [data.points[i].x, data.points[i].y] as [number, number])}
              s={s}
              color="var(--ok)"
              r={3.4}
            />
            <Dots
              points={data.centers.map((c) => [c.x, c.y] as [number, number])}
              s={s}
              color="var(--series-2)"
              r={4}
            />
            <Dots points={[[data.query.x, data.query.y]]} s={s} color="var(--bad)" r={5} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--bad)', label: 'query' },
          { color: 'var(--series-2)', label: 'cell centroids' },
          { color: 'var(--series-1)', label: 'scanned points' },
          { color: 'var(--ok)', label: 'true 10 nearest' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('recall@10', 'recall@10')} value={`${(data.recall * 100).toFixed(0)}%`}
          tone={data.recall >= 0.9 ? 'ok' : 'bad'} />
        <Readout
          label={l('Просмотрено точек', 'Points scanned')}
          value={`${data.scannedCount} / ${data.total}`}
        />
        <Readout
          label={l('Ускорение против полного перебора', 'Speed-up over brute force')}
          value={`${(data.total / Math.max(1, data.scannedCount)).toFixed(1)}x`}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'При nprobe = 1 просматривается одна ячейка: быстро, но соседи у границы теряются — зелёные точки за пределами синей области и есть потерянный recall. Увеличивай nprobe: recall растёт, ускорение падает. Это и есть ручка «точность против скорости», и в проде её крутят под требуемый recall, а не наоборот.',
            'At nprobe = 1 a single cell is scanned: fast, but neighbours near the boundary are lost — the green points outside the blue region are exactly the lost recall. Raise nprobe: recall grows and the speed-up falls. This is the accuracy-versus-speed knob, and in production it is tuned to a required recall rather than the other way round.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* -------------------------------------------------------------- ANN: HNSW -- */

export function AnnHnsw() {
  const { t } = useLang();
  const [degree, setDegree] = useState(4);
  const [ef, setEf] = useState(1);
  const [seed, setSeed] = useState(5);
  const N = 120;

  const data = useMemo(() => {
    const rng = makeRng(seed * 104729);
    const points: Point[] = [];
    for (let i = 0; i < N; i += 1) points.push({ x: rng.next() * 100, y: rng.next() * 100 });
    const query: Point = { x: 72, y: 28 };

    // A proximity graph: every node keeps links to its nearest neighbours.
    const neighbours = points.map((p, i) =>
      points
        .map((q, j) => ({ j, d: dist(p, q) }))
        .filter((r) => r.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, degree)
        .map((r) => r.j),
    );

    // Greedy beam search from a fixed entry point.
    const entry = 0;
    const visited = new Set<number>([entry]);
    let frontier = [entry];
    const path: number[] = [entry];
    let best = entry;
    let bestD = dist(points[entry], query);
    for (let step = 0; step < 40; step += 1) {
      const candidates: Array<{ j: number; d: number }> = [];
      for (const node of frontier) {
        for (const nb of neighbours[node]) {
          if (visited.has(nb)) continue;
          visited.add(nb);
          candidates.push({ j: nb, d: dist(points[nb], query) });
        }
      }
      if (candidates.length === 0) break;
      candidates.sort((a, b) => a.d - b.d);
      frontier = candidates.slice(0, ef).map((c) => c.j);
      path.push(frontier[0]);
      if (candidates[0].d < bestD) {
        bestD = candidates[0].d;
        best = candidates[0].j;
      } else if (ef === 1) {
        break; // plain greedy stops at a local minimum
      }
    }

    const trueBest = points
      .map((p, i) => ({ i, d: dist(p, query) }))
      .sort((a, b) => a.d - b.d)[0];

    return {
      points,
      neighbours,
      query,
      path,
      best,
      bestD,
      trueBest,
      visited: visited.size,
      found: best === trueBest.i,
    };
  }, [degree, ef, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Степень вершины: сколько связей у точки', 'Node degree: links per point')}
          value={degree}
          min={2}
          max={10}
          step={1}
          onChange={setDegree}
          format={(v) => String(v)}
        />
        <Slider
          label={l('ef — ширина поиска', 'ef — search width')}
          value={ef}
          min={1}
          max={10}
          step={1}
          onChange={setEf}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-5, 105]}
        yDomain={[-5, 105]}
        xLabel="dimension 1"
        yLabel="dimension 2"
        ariaLabel="proximity graph and the greedy search path"
        height={260}
      >
        {(s) => (
          <>
            <g stroke="var(--border-strong)" strokeWidth={0.4} opacity={0.5}>
              {data.neighbours.flatMap((nbs, i) =>
                nbs.map((j) => (
                  <line
                    key={`${i}-${j}`}
                    x1={s.x(data.points[i].x)}
                    y1={s.y(data.points[i].y)}
                    x2={s.x(data.points[j].x)}
                    y2={s.y(data.points[j].y)}
                  />
                )),
              )}
            </g>
            <Line
              points={data.path.map((i) => [data.points[i].x, data.points[i].y] as [number, number])}
              s={s}
              color="var(--series-4)"
              width={2}
            />
            <Dots
              points={data.points.map((p) => [p.x, p.y] as [number, number])}
              s={s}
              color="var(--text-faint)"
              r={1.8}
              opacity={0.7}
            />
            <Dots
              points={[[data.points[data.trueBest.i].x, data.points[data.trueBest.i].y]]}
              s={s}
              color="var(--ok)"
              r={4.5}
            />
            <Dots
              points={[[data.points[data.best].x, data.points[data.best].y]]}
              s={s}
              color="var(--series-4)"
              r={3.4}
            />
            <Dots points={[[data.query.x, data.query.y]]} s={s} color="var(--bad)" r={5} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--bad)', label: 'query' },
          { color: 'var(--series-4)', label: 'search path and the answer found' },
          { color: 'var(--ok)', label: 'true nearest neighbour' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Нашли истинного соседа', 'Found the true neighbour')}
          value={data.found ? '✓' : '✗'}
          tone={data.found ? 'ok' : 'bad'}
        />
        <Readout label={l('Посещено точек', 'Points visited')} value={String(data.visited)} />
        <Readout label={l('Шагов поиска', 'Search steps')} value={String(data.path.length)} />
        <Readout
          label={l('Ускорение против перебора', 'Speed-up over brute force')}
          value={`${(N / Math.max(1, data.visited)).toFixed(1)}x`}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'При степени 2 и ef = 1 поиск регулярно застревает в локальном минимуме: жадный спуск по разреженному графу приводит не туда. Добавь связей или увеличь ef — путь удлиняется, посещённых точек становится больше, но ответ становится правильным. Настоящий HNSW добавляет к этому иерархию слоёв: верхние слои разрежены и дают дальние прыжки, нижние плотные и уточняют ответ.',
            'At degree 2 and ef = 1 the search regularly gets stuck in a local minimum: greedy descent over a sparse graph leads to the wrong place. Add links or raise ef — the path lengthens and more points get visited, but the answer becomes correct. Real HNSW adds a hierarchy of layers on top of this: sparse upper layers give long jumps, dense lower ones refine the answer.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ---------------------------------------------------------------- ANN: PQ -- */

export function PqQuantization() {
  const { t } = useLang();
  const [bits, setBits] = useState(3);
  const [seed, setSeed] = useState(1);
  const N = 400;

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863);
    const points: Point[] = [];
    for (let i = 0; i < N; i += 1) {
      const cluster = rng.int(3);
      const cx = [25, 70, 50][cluster];
      const cy = [30, 40, 80][cluster];
      points.push({ x: cx + rng.normal(0, 12), y: cy + rng.normal(0, 12) });
    }

    // Product quantisation on two one-dimensional subspaces: each coordinate
    // gets its own codebook of 2^bits levels, placed at the data quantiles.
    const levels = 2 ** bits;
    const codebook = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const book: number[] = [];
      for (let i = 0; i < levels; i += 1) {
        const lo = Math.floor((i / levels) * sorted.length);
        const hi = Math.max(lo + 1, Math.floor(((i + 1) / levels) * sorted.length));
        const slice = sorted.slice(lo, hi);
        book.push(slice.reduce((a, b) => a + b, 0) / slice.length);
      }
      return book;
    };
    const bookX = codebook(points.map((p) => p.x));
    const bookY = codebook(points.map((p) => p.y));
    const nearest = (book: number[], v: number) =>
      book.reduce((best, c) => (Math.abs(c - v) < Math.abs(best - v) ? c : best), book[0]);

    const reconstructed = points.map((p) => ({
      x: nearest(bookX, p.x),
      y: nearest(bookY, p.y),
    }));

    let mse = 0;
    for (let i = 0; i < N; i += 1) mse += dist(points[i], reconstructed[i]) ** 2;
    mse /= N;

    const bytesOriginal = 2 * 4; // two float32 per vector
    const bytesCompressed = (2 * bits) / 8;

    return {
      points,
      reconstructed,
      grid: bookX.flatMap((x) => bookY.map((y) => [x, y] as [number, number])),
      rmse: Math.sqrt(mse),
      ratio: bytesOriginal / bytesCompressed,
      levels,
    };
  }, [bits, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Бит на подпространство', 'Bits per subspace')}
          value={bits}
          min={1}
          max={6}
          step={1}
          onChange={setBits}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0, 100]}
        yDomain={[0, 110]}
        xLabel="dimension 1"
        yLabel="dimension 2"
        ariaLabel="original vectors against their quantised reconstructions"
        height={250}
      >
        {(s) => (
          <>
            <Dots points={data.grid} s={s} color="var(--series-2)" r={1.6} opacity={0.5} />
            <Dots
              points={data.points.map((p) => [p.x, p.y] as [number, number])}
              s={s}
              color="var(--series-1)"
              r={1.8}
              opacity={0.55}
            />
            <g stroke="var(--text-faint)" strokeWidth={0.4} opacity={0.4}>
              {data.points.slice(0, 120).map((p, i) => (
                <line
                  key={i}
                  x1={s.x(p.x)}
                  y1={s.y(p.y)}
                  x2={s.x(data.reconstructed[i].x)}
                  y2={s.y(data.reconstructed[i].y)}
                />
              ))}
            </g>
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'original vectors' },
          { color: 'var(--series-2)', label: 'reachable reconstructions' },
        ]}
      />
      <div className="readouts">
        <Readout label={l('Уровней на координату', 'Levels per coordinate')} value={String(data.levels)} />
        <Readout label={l('Ошибка восстановления', 'Reconstruction error')} value={data.rmse.toFixed(2)} />
        <Readout
          label={l('Сжатие', 'Compression')}
          value={`${data.ratio.toFixed(1)}x`}
          tone={data.ratio > 4 ? 'ok' : undefined}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Серая сетка — все значения, в которые вообще может превратиться вектор после квантования: их ровно 2^bits на координату. Отрезки показывают, куда уехала каждая точка. Один бит даёт четырёхкратное сжатие с чудовищной ошибкой, шесть бит почти не портят данные, но и экономия скромнее. В настоящем PQ подпространств не два, а 8–64, и кодовая книга учится k-means, а не берётся по квантилям.',
            'The grey lattice is every value a vector can collapse to after quantisation: exactly 2^bits per coordinate. The segments show where each point moved. One bit gives a fourfold compression with a monstrous error; six bits barely damage the data but save much less. Real PQ uses 8–64 subspaces rather than two, and the codebook is learned by k-means instead of taken from quantiles.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
