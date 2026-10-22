import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { Bars, HLine, Plot, VLine } from '@/ui/Plot';
import { Readout, Select, Slider } from '@/ui/controls';

/* -------------------------------------------------------- mutation testing -- */

/**
 * The same function in six versions: one correct, five broken. The catch
 * matrix is not written down anywhere — every test is actually executed
 * against every version right here, which is exactly what a grader does.
 */
type Impl = (clicks: number, shows: number) => number;

const CORRECT: Impl = (clicks, shows) => (shows === 0 ? 0 : clicks / shows);

const MUTANTS: Array<{ id: string; label: ReturnType<typeof l>; fn: Impl }> = [
  {
    id: 'no-guard',
    label: l('Убрана защита от деления на ноль', 'The zero-division guard is gone'),
    fn: (clicks, shows) => {
      if (shows === 0) throw new Error('ZeroDivisionError');
      return clicks / shows;
    },
  },
  {
    id: 'off-by-one',
    label: l('Знаменатель shows + 1', 'The denominator is shows + 1'),
    fn: (clicks, shows) => (shows === 0 ? 0 : clicks / (shows + 1)),
  },
  {
    id: 'inverted',
    label: l('Делит показы на клики', 'Divides impressions by clicks'),
    fn: (clicks, shows) => (clicks === 0 ? 0 : shows / clicks),
  },
  {
    id: 'rounded',
    label: l('Округляет до двух знаков', 'Rounds to two decimals'),
    fn: (clicks, shows) => (shows === 0 ? 0 : Math.round((clicks / shows) * 100) / 100),
  },
  {
    id: 'percent',
    label: l('Возвращает проценты вместо доли', 'Returns percent instead of a share'),
    fn: (clicks, shows) => (shows === 0 ? 0 : (100 * clicks) / shows),
  },
];

const TESTS: Array<{ id: string; label: ReturnType<typeof l>; run: (fn: Impl) => boolean }> = [
  {
    id: 'half',
    label: l('ctr(1, 2) == 0.5', 'ctr(1, 2) == 0.5'),
    run: (fn) => fn(1, 2) === 0.5,
  },
  {
    id: 'no-clicks',
    label: l('ctr(0, 10) == 0.0', 'ctr(0, 10) == 0.0'),
    run: (fn) => fn(0, 10) === 0,
  },
  {
    id: 'no-shows',
    label: l('ctr(5, 0) == 0.0 — без исключения', 'ctr(5, 0) == 0.0 — no exception'),
    run: (fn) => fn(5, 0) === 0,
  },
  {
    id: 'precision',
    label: l('ctr(1, 3) с точностью 1e-9', 'ctr(1, 3) to within 1e-9'),
    run: (fn) => Math.abs(fn(1, 3) - 1 / 3) < 1e-9,
  },
  {
    id: 'range',
    label: l('0 <= ctr(3, 7) <= 1', '0 <= ctr(3, 7) <= 1'),
    run: (fn) => {
      const v = fn(3, 7);
      return v >= 0 && v <= 1;
    },
  },
];

function passes(test: (typeof TESTS)[number], fn: Impl): boolean {
  try {
    return test.run(fn);
  } catch {
    return false;
  }
}

export function MutationTesting() {
  const { t } = useLang();
  const [selected, setSelected] = useState<string[]>(['half']);

  const result = useMemo(() => {
    const chosen = TESTS.filter((x) => selected.includes(x.id));
    const suitePasses = (fn: Impl) => chosen.every((test) => passes(test, fn));
    const acceptsCorrect = chosen.length > 0 && suitePasses(CORRECT);
    const caught = MUTANTS.map((m) => ({ mutant: m, caught: !suitePasses(m.fn) }));
    return {
      acceptsCorrect,
      caught,
      score: caught.filter((c) => c.caught).length,
    };
  }, [selected]);

  return (
    <>
      <pre className="codeblock">
        <code>{`def ctr(clicks, shows):
    if shows == 0:
        return 0.0
    return clicks / shows`}</code>
      </pre>

      <p className="faint">
        {t(
          l(
            'Отметь тесты, которые написал бы. Справа видно, какие сломанные версии они ловят.',
            'Tick the tests you would write. On the right you see which broken versions they catch.',
          ),
        )}
      </p>

      <div className="choices">
        {TESTS.map((test) => (
          <label className="choice choice--compact" key={test.id}>
            <input
              type="checkbox"
              checked={selected.includes(test.id)}
              onChange={() =>
                setSelected((prev) =>
                  prev.includes(test.id) ? prev.filter((x) => x !== test.id) : [...prev, test.id],
                )
              }
            />
            <code>{t(test.label)}</code>
          </label>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t(l('Сломанная версия', 'Broken version'))}</th>
              <th>{t(l('Поймана', 'Caught'))}</th>
            </tr>
          </thead>
          <tbody>
            {result.caught.map(({ mutant, caught }) => (
              <tr key={mutant.id}>
                <td>{t(mutant.label)}</td>
                <td style={{ color: caught ? 'var(--ok)' : 'var(--bad)' }}>
                  {caught ? t(l('да', 'yes')) : t(l('нет', 'no'))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="readouts">
        <Readout
          label={l('Тестов выбрано', 'Tests selected')}
          value={String(selected.length)}
        />
        <Readout
          label={l('Проходит на корректной версии', 'Passes on the correct version')}
          value={result.acceptsCorrect ? t(l('да', 'yes')) : t(l('нет', 'no'))}
          tone={result.acceptsCorrect ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Поймано версий', 'Versions caught')}
          value={`${result.score} / ${MUTANTS.length}`}
          tone={result.score === MUTANTS.length ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Один тест на ctr(1, 2) == 0.5 ловит почти всё — кроме версии, которая округляет, и версии без защиты от нуля. Это и есть смысл мутационного тестирования: вопрос не «сколько строк покрыто», а «какие поломки тесты заметят». Набери полный комплект и посмотри, сколько тестов для этого хватило.',
            'A single test on ctr(1, 2) == 0.5 catches almost everything — except the rounding version and the one without the zero guard. That is the point of mutation testing: the question is not "how many lines are covered" but "which breakages would the tests notice". Build a full set and see how few tests it took.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------------ fixture scope -- */

type Scope = 'function' | 'class' | 'module' | 'session';

const SUITE = [
  { module: 'test_metrics.py', cls: 'TestCtr', name: 'test_half' },
  { module: 'test_metrics.py', cls: 'TestCtr', name: 'test_zero_shows' },
  { module: 'test_metrics.py', cls: 'TestMrr', name: 'test_first_click' },
  { module: 'test_pipeline.py', cls: 'TestTrain', name: 'test_smoke' },
  { module: 'test_pipeline.py', cls: 'TestTrain', name: 'test_deterministic' },
];

export function FixtureScope() {
  const { t } = useLang();
  const [scope, setScope] = useState<Scope>('function');
  const SETUP_SECONDS = 2.5;

  const timeline = useMemo(() => {
    const events: Array<{ kind: 'setup' | 'test' | 'teardown'; label: string }> = [];
    const keyOf = (i: number) => {
      const row = SUITE[i];
      if (scope === 'function') return `${row.module}::${row.cls}::${row.name}`;
      if (scope === 'class') return `${row.module}::${row.cls}`;
      if (scope === 'module') return row.module;
      return 'session';
    };

    let current: string | null = null;
    SUITE.forEach((row, i) => {
      const key = keyOf(i);
      if (key !== current) {
        if (current !== null) events.push({ kind: 'teardown', label: current });
        events.push({ kind: 'setup', label: key });
        current = key;
      }
      events.push({ kind: 'test', label: `${row.cls}.${row.name}` });
    });
    if (current !== null) events.push({ kind: 'teardown', label: current });

    const setups = events.filter((e) => e.kind === 'setup').length;
    return { events, setups, seconds: setups * SETUP_SECONDS };
  }, [scope]);

  return (
    <>
      <div className="controls">
        <Select
          label={l('scope фикстуры', 'Fixture scope')}
          value={scope}
          options={[
            { value: 'function', label: l('function — по умолчанию', 'function — the default') },
            { value: 'class', label: l('class', 'class') },
            { value: 'module', label: l('module', 'module') },
            { value: 'session', label: l('session', 'session') },
          ]}
          onChange={setScope}
        />
      </div>

      <div className="codelines">
        {timeline.events.map((event, i) => (
          <div
            className="codeline"
            key={i}
            style={{
              color:
                event.kind === 'test'
                  ? 'var(--text)'
                  : event.kind === 'setup'
                    ? 'var(--ok)'
                    : 'var(--text-faint)',
              cursor: 'default',
            }}
          >
            <span className="codeline__no">{event.kind === 'test' ? '·' : '→'}</span>
            <span>
              {event.kind === 'setup' && `setup(${event.label})`}
              {event.kind === 'teardown' && `teardown(${event.label})`}
              {event.kind === 'test' && event.label}
            </span>
          </div>
        ))}
      </div>

      <div className="readouts">
        <Readout label={l('Запусков setup', 'setup runs')} value={String(timeline.setups)} />
        <Readout
          label={l('Время на фикстуру', 'Time spent on the fixture')}
          value={`${timeline.seconds.toFixed(1)} s`}
          tone={timeline.seconds > 8 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Изоляция тестов', 'Test isolation')}
          value={scope === 'function' ? t(l('полная', 'complete')) : t(l('общая на scope', 'shared within scope'))}
          tone={scope === 'function' ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Чем шире scope, тем реже выполняется дорогая подготовка — и тем больше шансов, что один тест испортит состояние для следующего. Function по умолчанию не случайно: изоляция важнее скорости, пока подготовка дешёвая. Поднимать scope стоит осознанно, для действительно дорогих вещей вроде поднятия базы или загрузки модели.',
            'The wider the scope, the less often the expensive setup runs — and the greater the chance one test spoils the state for the next. function is the default for a reason: isolation beats speed while the setup is cheap. Widening the scope is a deliberate decision for genuinely expensive things like starting a database or loading a model.',
          ),
        )}
      </p>
    </>
  );
}

/* --------------------------------------------------------------- data checks -- */

export function DataChecks() {
  const { t } = useLang();
  const [drift, setDrift] = useState(0);
  const [seed, setSeed] = useState(1);

  const data = useMemo(() => {
    const rng = makeRng(seed * 104729 + Math.round(drift * 1000));
    const N = 5000;
    // Yesterday's batch is the reference; today's is deformed by `drift`.
    const reference: number[] = [];
    const today: number[] = [];
    let nulls = 0;
    let negatives = 0;
    for (let i = 0; i < N; i += 1) {
      reference.push(Math.max(0, rng.normal(120, 30)));
    }
    const rows = Math.round(N * (1 - 0.35 * drift));
    for (let i = 0; i < rows; i += 1) {
      // Drift shifts the mean, fattens the tail and starts producing junk.
      const value = rng.normal(120 + 45 * drift, 30 * (1 + drift));
      if (drift > 0.55 && rng.next() < (drift - 0.55) * 0.5) {
        nulls += 1;
        continue;
      }
      if (value < 0) negatives += 1;
      today.push(value);
    }

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const sd = (xs: number[]) => {
      const m = mean(xs);
      return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    };

    const refMean = mean(reference);
    const refSd = sd(reference);
    const todayMean = mean(today);
    const se = refSd / Math.sqrt(Math.max(1, today.length));

    const checks = [
      {
        id: 'schema',
        label: l('Схема: колонка на месте и нужного типа', 'Schema: the column exists with the right type'),
        failed: drift > 0.92,
        detail: drift > 0.92 ? 'column renamed' : 'ok',
      },
      {
        id: 'rows',
        label: l('Объём: строк не меньше 80% от вчерашнего', 'Volume: at least 80% of yesterday\'s rows'),
        failed: rows < N * 0.8,
        detail: `${rows} / ${N}`,
      },
      {
        id: 'nulls',
        label: l('Пропуски: доля NULL ниже 1%', 'Nulls: share below 1%'),
        failed: nulls / Math.max(1, rows) > 0.01,
        detail: `${((nulls / Math.max(1, rows)) * 100).toFixed(2)}%`,
      },
      {
        id: 'range',
        label: l('Диапазон: отрицательных значений нет', 'Range: no negative values'),
        failed: negatives > 0,
        detail: String(negatives),
      },
      {
        id: 'distribution',
        label: l('Распределение: среднее в пределах 5 SE', 'Distribution: the mean within 5 SE'),
        failed: Math.abs(todayMean - refMean) > 5 * se,
        detail: `${((todayMean - refMean) / Math.max(1e-9, se)).toFixed(1)} SE`,
      },
    ];

    return { checks, refMean, todayMean, rows, firstFailure: checks.find((c) => c.failed)?.id };
  }, [drift, seed]);

  const bars = data.checks.map((c) => (c.failed ? 1 : 0));

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Насколько испортились данные', 'How badly the data degraded')}
          value={drift}
          min={0}
          max={1}
          step={0.02}
          onChange={setDrift}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label={l('Сид', 'Seed')}
          value={seed}
          min={1}
          max={20}
          step={1}
          onChange={setSeed}
          format={(v) => String(v)}
        />
      </div>

      <Plot
        xDomain={[-0.5, data.checks.length - 0.5]}
        yDomain={[0, 1.2]}
        xTicks={data.checks.map((_, i) => i)}
        formatX={(v) => ['schema', 'rows', 'nulls', 'range', 'distribution'][Math.round(v)] ?? ''}
        yTicks={[0, 1]}
        formatY={(v) => (v >= 1 ? 'fail' : 'ok')}
        yLabel="check"
        ariaLabel="which data checks fire as the data degrades"
        padBottom={34}
        height={170}
      >
        {(s) => (
          <>
            {bars.map((v, i) => (
              <Bars
                key={i}
                centers={[i]}
                values={[Math.max(v, 0.04)]}
                binWidth={0.5}
                s={s}
                color={v ? 'var(--bad)' : 'var(--ok)'}
                opacity={0.8}
              />
            ))}
            <HLine at={1} s={s} color="var(--text-faint)" />
            <VLine at={-0.49} s={s} color="var(--border-strong)" dashed={false} />
          </>
        )}
      </Plot>

      <div className="table-wrap">
        <table className="data">
          <tbody>
            {data.checks.map((check) => (
              <tr key={check.id}>
                <th>{t(check.label)}</th>
                <td className="num">{check.detail}</td>
                <td style={{ color: check.failed ? 'var(--bad)' : 'var(--ok)' }}>
                  {check.failed ? 'FAIL' : 'ok'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint">
        {t(
          l(
            'Двигай ползунок от нуля и следи, какая проверка сработает первой. Распределение уезжает задолго до того, как появятся NULL или пропадёт колонка: грубые поломки видны всем, а тихий сдвиг среднего ловит только проверка на распределение — и именно он молча портит модель неделями.',
            'Move the slider up from zero and watch which check fires first. The distribution drifts long before any NULLs appear or a column disappears: gross breakage is obvious to everyone, while a quiet shift of the mean is caught only by the distribution check — and that is what silently degrades a model for weeks.',
          ),
        )}
      </p>
    </>
  );
}
