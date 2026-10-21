import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { mean } from '@/lib/stats';
import { Bars, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------------ join types -- */

type JoinKind = 'inner' | 'left' | 'anti' | 'left-dup';

const IMPRESSIONS = [
  { id: 1, item: 'A', pos: 1 },
  { id: 2, item: 'B', pos: 2 },
  { id: 3, item: 'C', pos: 3 },
  { id: 4, item: 'D', pos: 4 },
];

/** Impression 2 was clicked twice, which is what makes the duplicate case real. */
const CLICKS = [
  { clickId: 11, impressionId: 1 },
  { clickId: 12, impressionId: 2 },
  { clickId: 13, impressionId: 2 },
];

export function JoinExplorer() {
  const { t } = useLang();
  const [kind, setKind] = useState<JoinKind>('left');

  const rows = useMemo(() => {
    const out: Array<{ id: number; item: string; click: number | null }> = [];
    for (const imp of IMPRESSIONS) {
      const matches = CLICKS.filter((c) => c.impressionId === imp.id);
      if (kind === 'inner') {
        for (const m of matches.slice(0, 1)) out.push({ id: imp.id, item: imp.item, click: m.clickId });
      } else if (kind === 'left') {
        const first = matches[0];
        out.push({ id: imp.id, item: imp.item, click: first ? first.clickId : null });
      } else if (kind === 'anti') {
        if (matches.length === 0) out.push({ id: imp.id, item: imp.item, click: null });
      } else {
        // left-dup: every matching click produces its own row.
        if (matches.length === 0) out.push({ id: imp.id, item: imp.item, click: null });
        for (const m of matches) out.push({ id: imp.id, item: imp.item, click: m.clickId });
      }
    }
    return out;
  }, [kind]);

  const shows = rows.length;
  const clicks = rows.filter((r) => r.click !== null).length;
  const ctr = shows === 0 ? 0 : clicks / shows;

  return (
    <>
      <div className="controls">
        <Select
          label={l('Тип соединения', 'Join type')}
          value={kind}
          options={[
            { value: 'left', label: l('LEFT JOIN (ключ уникален)', 'LEFT JOIN (unique key)') },
            { value: 'inner', label: l('INNER JOIN', 'INNER JOIN') },
            { value: 'anti', label: l('LEFT JOIN … IS NULL (антиджойн)', 'LEFT JOIN … IS NULL (anti-join)') },
            {
              value: 'left-dup',
              label: l('LEFT JOIN, ключ не уникален', 'LEFT JOIN, non-unique key'),
            },
          ]}
          onChange={setKind}
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="num">impression_id</th>
              <th>item</th>
              <th className="num">click_id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="num">{r.id}</td>
                <td>{r.item}</td>
                <td className="num" style={{ color: r.click === null ? 'var(--text-faint)' : undefined }}>
                  {r.click === null ? 'NULL' : r.click}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  {t(l('Пусто', 'Empty'))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="readouts">
        <Readout label={l('Строк в результате', 'Rows in the result')} value={String(shows)} />
        <Readout
          label={l('Показов было', 'Impressions there were')}
          value={String(IMPRESSIONS.length)}
          tone={shows === IMPRESSIONS.length ? 'ok' : 'bad'}
        />
        <Readout label={l('Строк с кликом', 'Rows with a click')} value={String(clicks)} />
        <Readout
          label={l('CTR, если считать так', 'CTR if computed this way')}
          value={`${(ctr * 100).toFixed(1)}%`}
          tone={kind === 'left' ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Правильный CTR на этих данных — 2 кликнутых показа из 4, то есть 50%. INNER JOIN теряет показы и даёт 100%, дубли кликов раздувают знаменатель и дают 60%.',
            'The correct CTR on this data is 2 clicked impressions out of 4, i.e. 50%. INNER JOIN loses impressions and reports 100%, duplicate clicks inflate the denominator and report 60%.',
          ),
        )}
      </p>
    </>
  );
}

/* --------------------------------------------------------- CTR definitions -- */

type LogSim = {
  users: Array<{
    sessions: Array<{
      queries: Array<{ shows: number; clicks: number }>;
    }>;
  }>;
};

function simulateLog(seed: number, heavyShare: number): LogSim {
  const rng = makeRng(seed);
  const USERS = 300;
  const users: LogSim['users'] = [];
  for (let u = 0; u < USERS; u += 1) {
    const heavy = rng.next() < heavyShare;
    const sessions = [];
    const nSessions = heavy ? 3 + rng.int(6) : 1 + rng.int(2);
    for (let s = 0; s < nSessions; s += 1) {
      const queries = [];
      const nQueries = 1 + rng.int(heavy ? 5 : 3);
      for (let q = 0; q < nQueries; q += 1) {
        const shows = 6 + rng.int(5);
        // Heavy users browse more and click a smaller share of what they see.
        const perShow = heavy ? 0.075 : 0.12;
        let clicks = 0;
        for (let i = 0; i < shows; i += 1) if (rng.next() < perShow) clicks += 1;
        queries.push({ shows, clicks });
      }
      sessions.push({ queries });
    }
    users.push({ sessions });
  }
  return { users };
}

export function CtrDefinitions() {
  const [heavyShare, setHeavyShare] = useState(0.3);
  const [seed, setSeed] = useState(4);

  const stats = useMemo(() => {
    const log = simulateLog(seed * 7919, heavyShare);
    let shows = 0;
    let clicks = 0;
    let queries = 0;
    let queriesWithClick = 0;
    let sessions = 0;
    let sessionsWithClick = 0;
    const perUser: number[] = [];

    for (const user of log.users) {
      let uShows = 0;
      let uClicks = 0;
      for (const session of user.sessions) {
        sessions += 1;
        let sClicks = 0;
        for (const query of session.queries) {
          queries += 1;
          shows += query.shows;
          clicks += query.clicks;
          uShows += query.shows;
          uClicks += query.clicks;
          sClicks += query.clicks;
          if (query.clicks > 0) queriesWithClick += 1;
        }
        if (sClicks > 0) sessionsWithClick += 1;
      }
      if (uShows > 0) perUser.push(uClicks / uShows);
    }

    return {
      perImpression: clicks / shows,
      perQuery: queriesWithClick / queries,
      perSession: sessionsWithClick / sessions,
      perUser: mean(perUser),
      shows,
      clicks,
    };
  }, [heavyShare, seed]);

  const bars = [
    { label: 'per impression', value: stats.perImpression, color: 'var(--series-1)' },
    { label: 'query with click', value: stats.perQuery, color: 'var(--series-2)' },
    { label: 'session with click', value: stats.perSession, color: 'var(--series-3)' },
    { label: 'mean per user', value: stats.perUser, color: 'var(--series-4)' },
  ];
  const yMax = Math.max(...bars.map((b) => b.value)) * 1.2;

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Доля активных пользователей', 'Share of heavy users')}
          value={heavyShare}
          min={0}
          max={1}
          step={0.05}
          onChange={setHeavyShare}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      </div>
      <Plot
        xDomain={[-0.5, bars.length - 0.5]}
        yDomain={[0, yMax]}
        xTicks={bars.map((_, i) => i)}
        formatX={(v) => bars[Math.round(v)]?.label ?? ''}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        yLabel="CTR"
        ariaLabel="four definitions of CTR side by side"
        padBottom={34}
      >
        {(s) => (
          <>
            {bars.map((b, i) => (
              <Bars
                key={b.label}
                centers={[i]}
                values={[b.value]}
                binWidth={0.6}
                s={s}
                color={b.color}
                opacity={0.8}
              />
            ))}
          </>
        )}
      </Plot>
      <div className="readouts">
        {bars.map((b) => (
          <Readout key={b.label} label={l(b.label, b.label)} value={`${(b.value * 100).toFixed(2)}%`} />
        ))}
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ----------------------------------------------------------- window frames -- */

type WindowFn = 'row_number' | 'rank' | 'dense_rank' | 'lag' | 'running' | 'total';

const WIN_ROWS = [
  { pos: 1, clicks: 5 },
  { pos: 2, clicks: 3 },
  { pos: 3, clicks: 3 },
  { pos: 4, clicks: 2 },
  { pos: 5, clicks: 2 },
  { pos: 6, clicks: 1 },
  { pos: 7, clicks: 1 },
  { pos: 8, clicks: 0 },
];

export function WindowFunctions() {
  const { t } = useLang();
  const [fn, setFn] = useState<WindowFn>('running');
  const [highlight, setHighlight] = useState(3);

  const values = useMemo(() => {
    const byClicks = [...WIN_ROWS].sort((a, b) => b.clicks - a.clicks || a.pos - b.pos);
    const rankOf = new Map<number, number>();
    const denseOf = new Map<number, number>();
    let rank = 0;
    let dense = 0;
    let prev: number | null = null;
    byClicks.forEach((row, i) => {
      if (prev === null || row.clicks !== prev) {
        rank = i + 1;
        dense += 1;
        prev = row.clicks;
      }
      rankOf.set(row.pos, rank);
      denseOf.set(row.pos, dense);
    });

    const total = WIN_ROWS.reduce((acc, r) => acc + r.clicks, 0);
    let running = 0;
    return WIN_ROWS.map((row, i) => {
      running += row.clicks;
      switch (fn) {
        case 'row_number':
          return byClicks.findIndex((r) => r.pos === row.pos) + 1;
        case 'rank':
          return rankOf.get(row.pos) ?? 0;
        case 'dense_rank':
          return denseOf.get(row.pos) ?? 0;
        case 'lag':
          return i === 0 ? null : WIN_ROWS[i - 1].clicks;
        case 'running':
          return running;
        default:
          return total;
      }
    });
  }, [fn]);

  /** Which rows the window actually reads for the highlighted row. */
  const framed = useMemo(() => {
    const idx = highlight - 1;
    if (fn === 'total') return WIN_ROWS.map((_, i) => i);
    if (fn === 'lag') return idx === 0 ? [] : [idx - 1];
    if (fn === 'running') return WIN_ROWS.map((_, i) => i).filter((i) => i <= idx);
    return WIN_ROWS.map((_, i) => i);
  }, [fn, highlight]);

  const expr: Record<WindowFn, string> = {
    row_number: 'row_number() OVER (ORDER BY clicks DESC, pos)',
    rank: 'rank() OVER (ORDER BY clicks DESC)',
    dense_rank: 'dense_rank() OVER (ORDER BY clicks DESC)',
    lag: 'lag(clicks) OVER (ORDER BY pos)',
    running: 'sum(clicks) OVER (ORDER BY pos)',
    total: 'sum(clicks) OVER ()',
  };

  return (
    <>
      <div className="controls">
        <Select
          label={l('Функция', 'Function')}
          value={fn}
          options={[
            { value: 'running', label: l('sum() OVER (ORDER BY …) — накопительно', 'sum() OVER (ORDER BY …) — running') },
            { value: 'total', label: l('sum() OVER () — по всей выборке', 'sum() OVER () — whole set') },
            { value: 'lag', label: l('lag() — предыдущая строка', 'lag() — previous row') },
            { value: 'row_number', label: l('row_number()', 'row_number()') },
            { value: 'rank', label: l('rank() — с пропусками', 'rank() — with gaps') },
            { value: 'dense_rank', label: l('dense_rank()', 'dense_rank()') },
          ]}
          onChange={setFn}
        />
        <Slider
          label={l('Подсвеченная строка', 'Highlighted row')}
          value={highlight}
          min={1}
          max={WIN_ROWS.length}
          step={1}
          onChange={setHighlight}
          format={(v) => String(v)}
        />
      </div>

      <pre className="codeblock">
        <code>{expr[fn]}</code>
      </pre>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="num">position</th>
              <th className="num">clicks</th>
              <th className="num">{fn}</th>
            </tr>
          </thead>
          <tbody>
            {WIN_ROWS.map((row, i) => {
              const inFrame = framed.includes(i);
              const isCurrent = i === highlight - 1;
              return (
                <tr
                  key={row.pos}
                  style={{
                    background: isCurrent
                      ? 'color-mix(in srgb, var(--accent) 24%, transparent)'
                      : inFrame
                        ? 'color-mix(in srgb, var(--accent) 9%, transparent)'
                        : undefined,
                  }}
                >
                  <td className="num">{row.pos}</td>
                  <td className="num">{row.clicks}</td>
                  <td className="num">{values[i] === null ? 'NULL' : values[i]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="faint">
        {t(
          l(
            'Подсветка показывает, какие строки попадают в рамку окна для выбранной строки. Переключи между двумя первыми вариантами: ORDER BY внутри OVER сужает рамку до «от начала до текущей строки», и общий итог незаметно превращается в накопительный.',
            'The highlight shows which rows fall inside the window frame for the selected row. Switch between the first two options: an ORDER BY inside OVER narrows the frame to "from the start up to the current row", and a grand total quietly becomes a running one.',
          ),
        )}
      </p>
    </>
  );
}

/* --------------------------------------------------------- position shares -- */

function positionCtr(position: number, isAd: boolean): number {
  const base = 0.3 / Math.pow(position, 0.85);
  return isAd ? base * 0.75 : base;
}

export function PositionShare() {
  const [depth, setDepth] = useState(10);

  const data = useMemo(() => {
    const ctrs: number[] = [];
    for (let p = 1; p <= depth; p += 1) ctrs.push(positionCtr(p, false));
    const total = ctrs.reduce((a, b) => a + b, 0);
    const shares = ctrs.map((c) => c / total);
    const cumulative: Array<[number, number]> = [];
    let acc = 0;
    shares.forEach((s, i) => {
      acc += s;
      cumulative.push([i + 1, acc]);
    });
    const top3 = shares.slice(0, 3).reduce((a, b) => a + b, 0);
    return { shares, cumulative, top3 };
  }, [depth]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Длина выдачи', 'Result page length')}
          value={depth}
          min={5}
          max={20}
          step={1}
          onChange={setDepth}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0.4, depth + 0.6]}
        yDomain={[0, Math.max(...data.shares) * 1.25]}
        xLabel="position"
        yLabel="share of clicks"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="click share by position with a cumulative curve"
      >
        {(s) => (
          <>
            <Bars
              centers={data.shares.map((_, i) => i + 1)}
              values={data.shares}
              binWidth={0.8}
              s={s}
              color="var(--series-1)"
              opacity={0.7}
            />
            <Line
              points={data.cumulative.map(([x, y]) => [x, y * Math.max(...data.shares) * 1.25])}
              s={s}
              color="var(--series-2)"
              width={2}
            />
            <VLine at={3.5} s={s} color="var(--text-dim)" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'share of clicks at this position' },
          { color: 'var(--series-2)', label: 'cumulative share (rescaled)' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Доля кликов в топ-3', 'Share of clicks in the top 3')}
          value={`${(data.top3 * 100).toFixed(1)}%`}
        />
        <Readout
          label={l('CTR первой позиции', 'CTR of position 1')}
          value={`${(positionCtr(1, false) * 100).toFixed(1)}%`}
        />
        <Readout
          label={l('CTR последней позиции', 'CTR of the last position')}
          value={`${(positionCtr(depth, false) * 100).toFixed(1)}%`}
        />
      </div>
    </>
  );
}

/* -------------------------------------------------------------- session gaps -- */

export function SessionGaps() {
  const [threshold, setThreshold] = useState(30);
  const [seed, setSeed] = useState(3);

  const data = useMemo(() => {
    const rng = makeRng(seed * 104729);
    // The same generative model the datasets use: bursts inside a visit,
    // hours between visits.
    const gaps: number[] = [];
    const USERS = 200;
    const events: number[][] = [];
    for (let u = 0; u < USERS; u += 1) {
      const times: number[] = [];
      let cursor = 7 * 3600 + rng.int(3600);
      const sessions = 1 + rng.int(4);
      for (let s = 0; s < sessions; s += 1) {
        cursor += 2 * 3600 + rng.int(3 * 3600);
        const n = 1 + rng.int(4);
        for (let q = 0; q < n; q += 1) {
          if (q > 0) cursor += 40 + rng.int(500);
          times.push(cursor);
        }
      }
      events.push(times);
      for (let i = 1; i < times.length; i += 1) gaps.push((times[i] - times[i - 1]) / 60);
    }

    const bins = 40;
    const maxGap = 180;
    const counts = new Array<number>(bins).fill(0);
    for (const g of gaps) {
      if (g > maxGap) continue;
      counts[Math.min(bins - 1, Math.floor((g / maxGap) * bins))] += 1;
    }
    const centers = counts.map((_, i) => ((i + 0.5) / bins) * maxGap);

    let sessions = 0;
    let queries = 0;
    for (const times of events) {
      queries += times.length;
      sessions += 1;
      for (let i = 1; i < times.length; i += 1) {
        if ((times[i] - times[i - 1]) / 60 > threshold) sessions += 1;
      }
    }

    return {
      counts,
      centers,
      binWidth: maxGap / bins,
      sessions,
      queriesPerSession: queries / sessions,
      insideShare: gaps.filter((g) => g <= threshold).length / gaps.length,
    };
  }, [threshold, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Порог сессии, минут', 'Session threshold, minutes')}
          value={threshold}
          min={1}
          max={120}
          step={1}
          onChange={setThreshold}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[0, 180]}
        yDomain={[0, Math.max(...data.counts) * 1.15]}
        xLabel="gap between queries, minutes"
        yLabel="count"
        ariaLabel="histogram of gaps between consecutive queries"
      >
        {(s) => (
          <>
            <Bars
              centers={data.centers}
              values={data.counts}
              binWidth={data.binWidth}
              s={s}
              color="var(--series-1)"
              opacity={0.7}
            />
            <VLine at={threshold} s={s} color="var(--series-2)" dashed={false} width={2} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Сессий найдено', 'Sessions found')} value={String(data.sessions)} />
        <Readout
          label={l('Запросов на сессию', 'Queries per session')}
          value={data.queriesPerSession.toFixed(2)}
        />
        <Readout
          label={l('Пауз признано внутренними', 'Gaps treated as inside a visit')}
          value={`${(data.insideShare * 100).toFixed(1)}%`}
        />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/* ------------------------------------------------------- ratio of sums ----- */

export function RatioOfSums() {
  const [coupling, setCoupling] = useState(0.6);
  const [seed, setSeed] = useState(2);

  const data = useMemo(() => {
    const rng = makeRng(seed * 15485863);
    const USERS = 2000;
    let sumClicks = 0;
    let sumShows = 0;
    const perUser: number[] = [];
    const points: Array<[number, number]> = [];

    for (let u = 0; u < USERS; u += 1) {
      // Activity is heavy-tailed, as it always is in real logs.
      const shows = Math.max(1, Math.round(rng.lognormal(2.4, 1.1)));
      // coupling ties the click rate to activity: the more active, the lower the CTR.
      const base = 0.14;
      const rate = Math.max(
        0.005,
        base * (1 - coupling * Math.min(1, Math.log(shows + 1) / 5)),
      );
      let clicks = 0;
      for (let i = 0; i < shows; i += 1) if (rng.next() < rate) clicks += 1;
      sumClicks += clicks;
      sumShows += shows;
      perUser.push(clicks / shows);
      if (u < 400) points.push([Math.log10(shows), clicks / shows]);
    }

    return {
      ratioOfSums: sumClicks / sumShows,
      meanOfRatios: mean(perUser),
      points,
      sumShows,
    };
  }, [coupling, seed]);

  const gap = ((data.meanOfRatios - data.ratioOfSums) / data.ratioOfSums) * 100;

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Связь активности и CTR', 'Coupling of activity and CTR')}
          value={coupling}
          min={0}
          max={1}
          step={0.05}
          onChange={setCoupling}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[0, 3]}
        yDomain={[0, 0.35]}
        xLabel="log10 impressions per user"
        yLabel="user CTR"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="per-user CTR against activity"
      >
        {(s) => (
          <>
            <g>
              {data.points.map(([x, y], i) => (
                <circle key={i} cx={s.x(x)} cy={s.y(y)} r={1.8} fill="var(--series-1)" opacity={0.45} />
              ))}
            </g>
            <Line
              points={[
                [0, data.ratioOfSums],
                [3, data.ratioOfSums],
              ]}
              s={s}
              color="var(--series-2)"
              width={2}
            />
            <Line
              points={[
                [0, data.meanOfRatios],
                [3, data.meanOfRatios],
              ]}
              s={s}
              color="var(--series-3)"
              width={2}
              dashed
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'ratio of sums' },
          { color: 'var(--series-3)', label: 'mean of ratios' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Отношение сумм', 'Ratio of sums')}
          value={`${(data.ratioOfSums * 100).toFixed(3)}%`}
        />
        <Readout
          label={l('Среднее отношений', 'Mean of ratios')}
          value={`${(data.meanOfRatios * 100).toFixed(3)}%`}
        />
        <Readout
          label={l('Расхождение', 'Gap')}
          value={`${gap >= 0 ? '+' : ''}${gap.toFixed(1)}%`}
          tone={Math.abs(gap) > 5 ? 'bad' : 'ok'}
        />
      </div>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
