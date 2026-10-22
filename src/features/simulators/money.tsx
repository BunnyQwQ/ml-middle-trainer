import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { Bars, Legend, Plot } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/**
 * Product thinking where it stops being a matter of taste: turning a metric
 * into money, and choosing between hypotheses under uncertainty.
 */

/* ----------------------------------------------------------- money bridge -- */

/**
 * Revenue is a product of factors, so a one-per-cent lift in any of them is
 * worth exactly the same amount — the readouts compute that rather than claim
 * it. What differs between factors is what that one per cent costs to get.
 */
export function MoneyBridge() {
  const { t } = useLang();
  const [lift, setLift] = useState(0.01);
  const [ctrLift, setCtrLift] = useState(0.01);
  const [convLift, setConvLift] = useState(0.004);
  const [aovLift, setAovLift] = useState(0.002);

  const data = useMemo(() => {
    // A synthetic marketplace, deliberately round numbers.
    const DAU = 2_000_000;
    const SEARCHES = 3.4; // per user per day
    const CTR = 0.32;
    const CONVERSION = 0.062; // orders per click
    const AOV = 2400;
    const MARGIN = 0.08;
    const DAYS = 365;

    const revenue = (f: { ctr: number; conv: number; aov: number; searches: number }) =>
      DAU * f.searches * f.ctr * f.conv * f.aov * MARGIN * DAYS;

    const base = { ctr: CTR, conv: CONVERSION, aov: AOV, searches: SEARCHES };
    const baseline = revenue(base);

    const uniform = [
      { id: 'ctr', value: revenue({ ...base, ctr: CTR * (1 + lift) }) - baseline },
      { id: 'conv', value: revenue({ ...base, conv: CONVERSION * (1 + lift) }) - baseline },
      { id: 'aov', value: revenue({ ...base, aov: AOV * (1 + lift) }) - baseline },
      { id: 'searches', value: revenue({ ...base, searches: SEARCHES * (1 + lift) }) - baseline },
    ];

    const realistic = [
      { id: 'ctr', value: revenue({ ...base, ctr: CTR * (1 + ctrLift) }) - baseline },
      { id: 'conv', value: revenue({ ...base, conv: CONVERSION * (1 + convLift) }) - baseline },
      { id: 'aov', value: revenue({ ...base, aov: AOV * (1 + aovLift) }) - baseline },
    ];

    const values = uniform.map((u) => u.value);
    const spread = Math.max(...values) - Math.min(...values);
    const bestRealistic = Math.max(...realistic.map((r) => r.value));
    return { baseline, uniform, realistic, spread, bestRealistic };
  }, [lift, ctrLift, convLift, aovLift]);

  const money = (v: number) => `${(v / 1e6).toFixed(1)} ${t(l('млн ₽/год', 'M ₽/yr'))}`;

  const UNIFORM_LABELS: Record<string, ReturnType<typeof l>> = {
    ctr: l('+ к CTR выдачи', '+ to result-page CTR'),
    conv: l('+ к конверсии клика в заказ', '+ to click-to-order conversion'),
    aov: l('+ к среднему чеку', '+ to average order value'),
    searches: l('+ к числу поисков на пользователя', '+ to searches per user'),
  };

  const REAL_LABELS: Record<string, ReturnType<typeof l>> = {
    ctr: l('Деньги с CTR', 'Money from CTR'),
    conv: l('Деньги с конверсии', 'Money from conversion'),
    aov: l('Деньги с чека', 'Money from order value'),
  };

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Одинаковый относительный прирост', 'The same relative lift everywhere')}
          value={lift}
          min={0.002}
          max={0.05}
          step={0.002}
          onChange={setLift}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
      </div>

      <div className="readouts">
        <Readout label={l('Выручка как есть', 'Revenue as is')} value={money(data.baseline)} />
        {data.uniform.map((u) => (
          <Readout key={u.id} label={UNIFORM_LABELS[u.id]} value={money(u.value)} />
        ))}
        <Readout
          label={l('Разброс между множителями', 'Spread between the factors')}
          value={money(data.spread)}
          tone="ok"
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Разброс равен нулю при любом приросте: выручка — произведение множителей, поэтому один процент в CTR, в конверсии, в чеке и в числе поисков стоит одинаково. Отсюда вывод, неприятный для споров про «самую важную метрику»: важность множителя определяется не его местом в формуле, а тем, сколько стоит выжать из него этот процент.',
            'The spread is zero at any lift: revenue is a product of its factors, so one per cent of CTR, of conversion, of order value and of searches per user are all worth the same. Which gives the conclusion that spoils arguments about "the most important metric": a factor\'s importance comes not from its place in the formula but from what that one per cent costs to extract.',
          ),
        )}
      </p>

      <div className="controls">
        <Slider
          label={l('Реально достижимо: CTR', 'Actually achievable: CTR')}
          value={ctrLift}
          min={0}
          max={0.04}
          step={0.002}
          onChange={setCtrLift}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
        <Slider
          label={l('Реально достижимо: конверсия', 'Actually achievable: conversion')}
          value={convLift}
          min={0}
          max={0.04}
          step={0.002}
          onChange={setConvLift}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
        <Slider
          label={l('Реально достижимо: чек', 'Actually achievable: order value')}
          value={aovLift}
          min={0}
          max={0.04}
          step={0.002}
          onChange={setAovLift}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
      </div>

      <div className="readouts">
        {data.realistic.map((r) => (
          <Readout
            key={r.id}
            label={REAL_LABELS[r.id]}
            value={money(r.value)}
            tone={r.value === data.bestRealistic && r.value > 0 ? 'ok' : undefined}
          />
        ))}
      </div>
    </>
  );
}

/* --------------------------------------------------------- prioritisation -- */

/**
 * Prioritising hypotheses under uncertainty. Each one has a claimed effect, a
 * confidence and a cost in weeks; the realised effect is drawn around the
 * claim, with more air in the louder claims. With limited capacity, ordering
 * by the claim alone loses to ordering by expected value per week, and the gap
 * is measured here rather than asserted.
 */
export function Prioritization() {
  const { t } = useLang();
  const [capacity, setCapacity] = useState(12);
  const [optimism, setOptimism] = useState(0.5);
  const [seed, setSeed] = useState(5);

  const data = useMemo(() => {
    const rng = makeRng(seed * 40503);
    const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const QUARTERS = 200;

    type Item = { name: string; claimed: number; confidence: number; weeks: number; truth: number };

    const draw = (): Item[] =>
      NAMES.map((name) => {
        const claimed = 0.4 + rng.next() * 3.6; // millions per year, as pitched
        const confidence = 0.25 + rng.next() * 0.7;
        const weeks = 1 + Math.round(rng.next() * 7);
        // The louder the claim, the more of it evaporates under optimism.
        const shrink = Math.max(0, confidence * (1 - optimism * (claimed / 4)) + rng.normal(0, 0.08));
        return { name, claimed, confidence, weeks, truth: Math.max(0, claimed * Math.min(1, shrink)) };
      });

    const run = (order: Item[]) => {
      let left = capacity;
      let value = 0;
      const taken: string[] = [];
      for (const item of order) {
        if (item.weeks > left) continue;
        left -= item.weeks;
        value += item.truth;
        taken.push(item.name);
      }
      return { value, taken };
    };

    const byClaimOrder = (items: Item[]) => [...items].sort((a, b) => b.claimed - a.claimed);
    const byValueOrder = (items: Item[]) =>
      [...items].sort((a, b) => b.claimed * b.confidence - a.claimed * a.confidence);
    const byExpectedOrder = (items: Item[]) =>
      [...items].sort(
        (a, b) => (b.claimed * b.confidence) / b.weeks - (a.claimed * a.confidence) / a.weeks,
      );
    const oracleOrder = (items: Item[]) => [...items].sort((a, b) => b.truth / b.weeks - a.truth / a.weeks);

    // One quarter is a coin toss: the ordering that wins on a single draw says
    // nothing. So the readouts average over many independently drawn quarters,
    // and the chart shows the first of them for intuition.
    const shown = draw();
    const totals = { claim: 0, value: 0, expected: 0, oracle: 0 };
    let claimWins = 0;
    for (let q = 0; q < QUARTERS; q += 1) {
      const items = q === 0 ? shown : draw();
      const claim = run(byClaimOrder(items)).value;
      const expected = run(byExpectedOrder(items)).value;
      totals.claim += claim;
      totals.value += run(byValueOrder(items)).value;
      totals.expected += expected;
      totals.oracle += run(oracleOrder(items)).value;
      if (claim >= expected) claimWins += 1;
    }

    return {
      items: shown,
      quarters: QUARTERS,
      byClaim: { value: totals.claim / QUARTERS, taken: run(byClaimOrder(shown)).taken },
      byValue: { value: totals.value / QUARTERS, taken: run(byValueOrder(shown)).taken },
      byExpected: { value: totals.expected / QUARTERS, taken: run(byExpectedOrder(shown)).taken },
      oracle: { value: totals.oracle / QUARTERS, taken: run(oracleOrder(shown)).taken },
      claimWinsShare: claimWins / QUARTERS,
    };
  }, [capacity, optimism, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Ёмкость квартала, недель', 'Quarter capacity, weeks')}
          value={capacity}
          min={4}
          max={26}
          step={1}
          onChange={setCapacity}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Оптимизм оценок', 'Optimism in the estimates')}
          value={optimism}
          min={0}
          max={1}
          step={0.1}
          onChange={setOptimism}
          format={(v) => v.toFixed(1)}
        />
      </div>

      <Plot
        xDomain={[-0.5, data.items.length - 0.5]}
        yDomain={[0, 4.2]}
        xTicks={data.items.map((_, i) => i)}
        formatX={(v) => data.items[v]?.name ?? ''}
        xLabel="hypothesis"
        yLabel="M ₽/yr"
        height={190}
        ariaLabel="claimed versus realised value per hypothesis"
      >
        {(s) => (
          <>
            <Bars
              centers={data.items.map((_, i) => i)}
              values={data.items.map((it) => it.claimed)}
              binWidth={0.7}
              s={s}
              color="var(--series-3)"
              opacity={0.45}
            />
            <Bars
              centers={data.items.map((_, i) => i)}
              values={data.items.map((it) => it.truth)}
              binWidth={0.4}
              s={s}
              color="var(--series-1)"
            />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-3)', label: 'claimed' },
          { color: 'var(--series-1)', label: 'realised' },
        ]}
      />

      <div className="readouts">
        <Readout
          label={l('По заявленному эффекту, среднее', 'By claimed effect, mean')}
          value={`${data.byClaim.value.toFixed(2)} · ${data.byClaim.taken.join(' ')}`}
          tone="bad"
        />
        <Readout
          label={l('По ценности без учёта стоимости, среднее', 'By value ignoring cost, mean')}
          value={`${data.byValue.value.toFixed(2)} · ${data.byValue.taken.join(' ')}`}
        />
        <Readout
          label={l('По ожидаемой ценности за неделю, среднее', 'By expected value per week, mean')}
          value={`${data.byExpected.value.toFixed(2)} · ${data.byExpected.taken.join(' ')}`}
          tone="ok"
        />
        <Readout
          label={l('Потолок, если бы знали правду', 'The ceiling, knowing the truth')}
          value={data.oracle.value.toFixed(2)}
        />
        <Readout
          label={l('Цена сортировки «по вау», в среднем', 'The average price of sorting by wow')}
          value={`${(data.byExpected.value - data.byClaim.value).toFixed(2)} ${t(l('млн ₽', 'M ₽'))}`}
          tone={data.byExpected.value > data.byClaim.value ? 'bad' : undefined}
        />
        <Readout
          label={l('Кварталов, где «по вау» не хуже', 'Quarters where "by wow" is no worse')}
          value={`${(data.claimWinsShare * 100).toFixed(0)}%`}
        />
      </div>

      <p className="faint">
        {t(
          l(
            'Плашки — средние по двумстам случайно разыгранным кварталам, иначе один удачный расклад доказывал бы что угодно. Порядок виден всегда один: по заявленному эффекту хуже всех, учёт уверенности закрывает большую часть разрыва, деление на недели — остаток, и чем больше воздуха в оценках, тем важнее становится стоимость. Разрыв не исчезает при нулевом оптимизме: он создан не приукрашиванием, а тем, что сортировка по заявленному эффекту игнорирует и уверенность, и цену. Но главное — последняя плашка: примерно в половине кварталов сортировка «по вау» оказывается не хуже. Поэтому одним кварталом нельзя доказать, что приоритизация работает, — разница живёт в среднем.',
            'The readouts are means over two hundred randomly drawn quarters, because otherwise one lucky draw would prove anything. The order is always the same: the claimed effect is the worst, taking confidence in closes most of the gap, dividing by weeks closes the rest, and the more air there is in the estimates the more the cost matters. The gap does not disappear at zero optimism: it is created not by flattery but by an ordering that ignores both the confidence and the price. The readout that matters most, though, is the last one: in about half the quarters sorting by wow turns out no worse. So a single quarter cannot prove that prioritisation works — the difference lives in the average.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
