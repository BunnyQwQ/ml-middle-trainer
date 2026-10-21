import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { mean, normalQuantile, sd } from '@/lib/stats';
import { Bars, HLine, Plot } from '@/ui/Plot';
import { Readout, SeedControl, Slider } from '@/ui/controls';

/**
 * Metric decomposition: revenue per user factors into conversion, orders per
 * buyer and average order value. The factors differ enormously in variance, so
 * the same traffic detects very different effect sizes in each.
 */
export function MetricDecomposition() {
  const { t } = useLang();
  const [n, setN] = useState(50000);
  const [conversion, setConversion] = useState(0.08);
  const [tail, setTail] = useState(1.0);
  const [seed, setSeed] = useState(3);

  const data = useMemo(() => {
    const rng = makeRng(seed * 2654435761);
    const USERS = 20000;
    const revenue: number[] = [];
    const ordered: number[] = [];
    const ordersPerBuyer: number[] = [];
    const orderValues: number[] = [];

    for (let u = 0; u < USERS; u += 1) {
      const buys = rng.next() < conversion;
      ordered.push(buys ? 1 : 0);
      if (!buys) {
        revenue.push(0);
        continue;
      }
      const orders = 1 + rng.poisson(0.4);
      ordersPerBuyer.push(orders);
      let total = 0;
      for (let o = 0; o < orders; o += 1) {
        const value = rng.lognormal(7.2, tail);
        orderValues.push(value);
        total += value;
      }
      revenue.push(total);
    }

    // Relative MDE for a mean at this n: (z_a + z_b) * CV / sqrt(n), two groups.
    const z = Math.abs(normalQuantile(0.975)) + Math.abs(normalQuantile(0.8));
    const mdeOf = (xs: number[]) => {
      const m = mean(xs);
      if (m === 0) return Infinity;
      const cv = sd(xs) / m;
      return (z * cv * Math.sqrt(2)) / Math.sqrt(n);
    };

    return {
      metrics: [
        { key: 'conversion', label: l('Конверсия в заказ', 'Order conversion'), mde: mdeOf(ordered), cv: sd(ordered) / mean(ordered) },
        {
          key: 'orders',
          label: l('Заказов на покупателя', 'Orders per buyer'),
          mde: mdeOf(ordersPerBuyer),
          cv: sd(ordersPerBuyer) / mean(ordersPerBuyer),
        },
        {
          key: 'aov',
          label: l('Средний чек', 'Average order value'),
          mde: mdeOf(orderValues),
          cv: sd(orderValues) / mean(orderValues),
        },
        {
          key: 'revenue',
          label: l('Выручка на пользователя', 'Revenue per user'),
          mde: mdeOf(revenue),
          cv: sd(revenue) / mean(revenue),
        },
      ],
      revenueMean: mean(revenue),
    };
  }, [n, conversion, tail, seed]);

  const values = data.metrics.map((m) => Math.min(0.5, m.mde));

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Трафик на группу', 'Traffic per group')}
          value={Math.log10(n)}
          min={3}
          max={6.5}
          step={0.05}
          onChange={(v) => setN(Math.round(10 ** v))}
          format={() => n.toLocaleString('en-US')}
        />
        <Slider
          label={l('Конверсия в заказ', 'Order conversion')}
          value={conversion}
          min={0.01}
          max={0.4}
          step={0.01}
          onChange={setConversion}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Slider
          label={l('Тяжесть хвоста чека', 'Heaviness of the order value tail')}
          value={tail}
          min={0.3}
          max={1.8}
          step={0.05}
          onChange={setTail}
          format={(v) => v.toFixed(2)}
        />
      </div>

      <Plot
        xDomain={[-0.5, 3.5]}
        yDomain={[0, Math.max(...values) * 1.2]}
        xTicks={[0, 1, 2, 3]}
        formatX={(v) => ['conversion', 'orders/buyer', 'AOV', 'revenue/user'][Math.round(v)] ?? ''}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        yLabel="detectable effect (relative MDE)"
        ariaLabel="minimum detectable effect for each factor of the decomposition"
        padBottom={34}
      >
        {(s) => (
          <>
            {values.map((v, i) => (
              <Bars
                key={i}
                centers={[i]}
                values={[v]}
                binWidth={0.55}
                s={s}
                color={i === 3 ? 'var(--series-2)' : 'var(--series-1)'}
                opacity={0.8}
              />
            ))}
            <HLine at={0.02} s={s} color="var(--text)" label="2% effect" />
          </>
        )}
      </Plot>

      <div className="readouts">
        {data.metrics.map((m) => (
          <Readout
            key={m.key}
            label={m.label}
            value={`${(m.mde * 100).toFixed(2)}%`}
            tone={m.mde < 0.02 ? 'ok' : 'bad'}
          />
        ))}
      </div>
      <p className="faint">
        {t(
          l(
            'Столбики — минимальный эффект, который видно на этом трафике. Выручка на пользователя почти всегда худшая: в ней сложены нули непокупателей и тяжёлый хвост чеков. Конверсия видна в разы лучше. Отсюда рабочий приём: мерить эффект в том множителе, где он ожидается, но решение принимать по верхнеуровневой метрике — иначе один множитель улучшат за счёт других.',
            'The bars are the smallest effect visible at this traffic. Revenue per user is almost always the worst: it stacks the zeros of non-buyers on top of a heavy order-value tail. Conversion is several times more visible. Hence the working trick: measure the effect in the factor where it is expected, but make the decision on the top-level metric — otherwise one factor gets improved at the expense of the others.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}
