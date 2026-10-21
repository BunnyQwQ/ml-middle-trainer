import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { Bars, Dots, HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, SeedControl, Select, Slider } from '@/ui/controls';

/* ------------------------------------------------------------ the auction -- */

export type Bidder = { id: string; bid: number; quality: number; value: number };

/** Click-through rate of a slot, independent of which ad sits in it. */
const SLOT_CTR = [0.08, 0.045, 0.03];

/**
 * Generalised second price with quality scores.
 * Ads are ranked by bid x quality; the winner of slot i pays just enough to
 * keep it ahead of the next ad, measured in its own quality units.
 */
export function gspOutcome(bidders: Bidder[], slots = SLOT_CTR) {
  const ranked = [...bidders].sort((a, b) => b.bid * b.quality - a.bid * a.quality);
  return ranked.slice(0, slots.length).map((ad, i) => {
    const next = ranked[i + 1];
    const price = next ? (next.bid * next.quality) / ad.quality : 0;
    const clicks = slots[i] * ad.quality;
    return { ad, position: i + 1, price: Math.min(price, ad.bid), clicks, revenue: clicks * Math.min(price, ad.bid) };
  });
}

/**
 * VCG: each winner pays the harm it does to everyone else — the value the
 * other advertisers lose because this ad took a slot above them.
 */
export function vcgOutcome(bidders: Bidder[], slots = SLOT_CTR) {
  const ranked = [...bidders].sort((a, b) => b.bid * b.quality - a.bid * a.quality);
  return ranked.slice(0, slots.length).map((ad, i) => {
    let payment = 0;
    for (let j = i + 1; j < Math.min(ranked.length, slots.length + 1); j += 1) {
      const above = slots[j - 1] ?? 0;
      const below = slots[j] ?? 0;
      payment += (above - below) * ranked[j].bid * ranked[j].quality;
    }
    const clicks = slots[i] * ad.quality;
    const price = clicks > 0 ? payment / clicks : 0;
    return { ad, position: i + 1, price, clicks, revenue: payment };
  });
}

/**
 * Deliberately tuned so both lessons are visible: C bids most with the worst
 * quality (the eCPM lesson), and B sits just below A while C and D are far
 * cheaper — which is what makes shading pay under GSP.
 */
const BASE_BIDDERS: Bidder[] = [
  { id: 'A', bid: 30, quality: 0.09, value: 30 },
  { id: 'B', bid: 28, quality: 0.09, value: 28 },
  { id: 'C', bid: 45, quality: 0.04, value: 45 },
  { id: 'D', bid: 12, quality: 0.09, value: 12 },
];

export function EcpmRanking() {
  const { t } = useLang();
  const [mode, setMode] = useState<'ecpm' | 'bid'>('ecpm');
  const [cBid, setCBid] = useState(45);

  const data = useMemo(() => {
    const bidders = BASE_BIDDERS.map((b) => (b.id === 'C' ? { ...b, bid: cBid, value: cBid } : b));
    const byEcpm = [...bidders].sort((a, b) => b.bid * b.quality - a.bid * a.quality);
    const byBid = [...bidders].sort((a, b) => b.bid - a.bid);
    const chosen = mode === 'ecpm' ? byEcpm : byBid;
    const shown = chosen.slice(0, SLOT_CTR.length);
    // Expected revenue if every winner paid its own bid per click.
    const revenue = shown.reduce((acc, ad, i) => acc + SLOT_CTR[i] * ad.quality * ad.bid, 0);
    const clicks = shown.reduce((acc, ad, i) => acc + SLOT_CTR[i] * ad.quality, 0);
    return { bidders, shown, revenue, clicks, byEcpm, byBid };
  }, [mode, cBid]);

  return (
    <>
      <div className="controls">
        <Select
          label={l('Правило ранжирования', 'Ranking rule')}
          value={mode}
          options={[
            { value: 'ecpm', label: l('По eCPM: ставка × вероятность клика', 'By eCPM: bid × click probability') },
            { value: 'bid', label: l('По ставке', 'By bid') },
          ]}
          onChange={setMode}
        />
        <Slider
          label={l('Ставка рекламодателя C', "Advertiser C's bid")}
          value={cBid}
          min={10}
          max={90}
          step={1}
          onChange={setCBid}
          format={(v) => `${v} ₽`}
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t(l('Объявление', 'Ad'))}</th>
              <th className="num">{t(l('Ставка', 'Bid'))}</th>
              <th className="num">pCTR</th>
              <th className="num">eCPM</th>
              <th className="num">{t(l('Позиция', 'Slot'))}</th>
            </tr>
          </thead>
          <tbody>
            {data.bidders.map((b) => {
              const slot = data.shown.findIndex((s) => s.id === b.id);
              return (
                <tr key={b.id} style={{ opacity: slot === -1 ? 0.45 : 1 }}>
                  <th>{b.id}</th>
                  <td className="num">{b.bid}</td>
                  <td className="num">{(b.quality * 100).toFixed(1)}%</td>
                  <td className="num">{(b.bid * b.quality * 1000).toFixed(0)}</td>
                  <td className="num">{slot === -1 ? '—' : slot + 1}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="readouts">
        <Readout
          label={l('Ожидаемая выручка за показ', 'Expected revenue per impression')}
          value={`${data.revenue.toFixed(3)} ₽`}
          tone={mode === 'ecpm' ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Ожидаемых кликов за показ', 'Expected clicks per impression')}
          value={data.clicks.toFixed(4)}
          tone={mode === 'ecpm' ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Первое место', 'Top slot')}
          value={data.shown[0]?.id ?? '—'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Рекламодатель C платит больше всех, но его объявление почти никто не кликает. Ранжирование по ставке ставит его наверх и теряет и деньги, и пользователя: место занято, а кликов нет. eCPM решает это, домножая ставку на вероятность клика — платформа ранжирует по ожидаемой выручке, а не по обещанной.',
            'Advertiser C pays the most but almost nobody clicks its ad. Ranking by bid puts it on top and loses both the money and the user: the slot is taken and no clicks come. eCPM fixes that by multiplying the bid by the click probability — the platform ranks by expected revenue rather than promised revenue.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------------- GSP vs VCG -- */

export function AuctionSim() {
  const { t } = useLang();
  const [ownBid, setOwnBid] = useState(30);
  const OWN_VALUE = 30;

  const data = useMemo(() => {
    const withBid = (bid: number): Bidder[] =>
      BASE_BIDDERS.map((b) => (b.id === 'A' ? { ...b, bid, value: OWN_VALUE } : b));

    const utilityAt = (bid: number, mechanism: 'gsp' | 'vcg') => {
      const outcome = (mechanism === 'gsp' ? gspOutcome : vcgOutcome)(withBid(bid));
      const mine = outcome.find((o) => o.ad.id === 'A');
      if (!mine) return 0;
      return (OWN_VALUE - mine.price) * mine.clicks;
    };

    const curve = (mechanism: 'gsp' | 'vcg'): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let bid = 5; bid <= 70; bid += 1) pts.push([bid, utilityAt(bid, mechanism)]);
      return pts;
    };

    const gsp = gspOutcome(withBid(ownBid));
    const vcg = vcgOutcome(withBid(ownBid));
    return {
      gsp,
      vcg,
      gspCurve: curve('gsp'),
      vcgCurve: curve('vcg'),
      gspRevenue: gsp.reduce((a, o) => a + o.revenue, 0),
      vcgRevenue: vcg.reduce((a, o) => a + o.revenue, 0),
      gspUtility: utilityAt(ownBid, 'gsp'),
      vcgUtility: utilityAt(ownBid, 'vcg'),
    };
  }, [ownBid]);

  const best = (curve: Array<[number, number]>) =>
    curve.reduce((bestPt, pt) => (pt[1] > bestPt[1] ? pt : bestPt), curve[0]);

  const gspBest = best(data.gspCurve);
  const vcgBest = best(data.vcgCurve);
  const yMax = Math.max(...data.gspCurve.map((p) => p[1]), ...data.vcgCurve.map((p) => p[1])) * 1.2;

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Твоя ставка (истинная ценность 30 ₽)', 'Your bid (true value is 30 ₽)')}
          value={ownBid}
          min={5}
          max={70}
          step={1}
          onChange={setOwnBid}
          format={(v) => `${v} ₽`}
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="num">{t(l('Позиция', 'Slot'))}</th>
              <th>{t(l('Объявление', 'Ad'))}</th>
              <th className="num">{t(l('Цена клика, GSP', 'Click price, GSP'))}</th>
              <th className="num">{t(l('Цена клика, VCG', 'Click price, VCG'))}</th>
            </tr>
          </thead>
          <tbody>
            {data.gsp.map((row, i) => (
              <tr key={row.ad.id}>
                <td className="num">{row.position}</td>
                <th>{row.ad.id}</th>
                <td className="num">{row.price.toFixed(2)}</td>
                <td className="num">{(data.vcg[i]?.price ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Plot
        xDomain={[5, 70]}
        yDomain={[0, Math.max(0.01, yMax)]}
        xLabel="your bid"
        yLabel="your profit per impression"
        ariaLabel="advertiser profit against bid under GSP and VCG"
        height={200}
      >
        {(s) => (
          <>
            <VLine at={OWN_VALUE} s={s} color="var(--text)" label="true value" />
            <Line points={data.gspCurve} s={s} color="var(--series-2)" width={2} />
            <Line points={data.vcgCurve} s={s} color="var(--series-3)" width={2} />
            <Dots points={[gspBest]} s={s} color="var(--series-2)" r={4} />
            <Dots points={[vcgBest]} s={s} color="var(--series-3)" r={4} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'GSP' },
          { color: 'var(--series-3)', label: 'VCG' },
        ]}
      />

      <div className="readouts">
        <Readout label={l('Выручка площадки, GSP', 'Platform revenue, GSP')} value={data.gspRevenue.toFixed(3)} />
        <Readout label={l('Выручка площадки, VCG', 'Platform revenue, VCG')} value={data.vcgRevenue.toFixed(3)} />
        <Readout
          label={l('Лучшая ставка при GSP', 'Best bid under GSP')}
          value={`${gspBest[0]} ₽`}
          tone={Math.abs(gspBest[0] - OWN_VALUE) <= 1 ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Лучшая ставка при VCG', 'Best bid under VCG')}
          value={`${vcgBest[0]} ₽`}
          tone={Math.abs(vcgBest[0] - OWN_VALUE) <= 1 ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Зелёная кривая выходит на плато ровно в точке истинной ценности: при VCG занижать и завышать ставку одинаково бессмысленно. У GSP оптимум обычно не совпадает с ценностью — рекламодателю выгодно занижать ставку, и аукцион превращается в игру в угадайку. Платформы всё равно чаще выбирают GSP: он проще объясняется и часто приносит больше денег при равновесных ставках.',
            'The green curve plateaus exactly at the true value: under VCG there is no point shading your bid in either direction. Under GSP the optimum usually does not coincide with the value — the advertiser profits from bidding below it, and the auction becomes a guessing game. Platforms still choose GSP more often: it is easier to explain and often brings more money at equilibrium bids.',
          ),
        )}
      </p>
    </>
  );
}

/* ----------------------------------------------------------- calibration -- */

export function ReliabilityDiagram() {
  const { t } = useLang();
  const [bias, setBias] = useState(1.5);
  const [seed, setSeed] = useState(4);
  const N = 20000;
  const BINS = 10;

  const data = useMemo(() => {
    const rng = makeRng(seed * 982451653);
    const sums = new Array(BINS).fill(0);
    const hits = new Array(BINS).fill(0);
    const counts = new Array(BINS).fill(0);

    for (let i = 0; i < N; i += 1) {
      const trueP = Math.min(0.95, Math.max(0.005, rng.lognormal(-2.6, 0.8)));
      // A miscalibrated model multiplies the odds by a constant factor.
      const odds = (trueP / (1 - trueP)) * bias;
      const predicted = odds / (1 + odds);
      const bin = Math.min(BINS - 1, Math.floor(predicted * BINS));
      counts[bin] += 1;
      sums[bin] += predicted;
      hits[bin] += rng.next() < trueP ? 1 : 0;
    }

    const points: Array<[number, number]> = [];
    let ece = 0;
    for (let b = 0; b < BINS; b += 1) {
      if (counts[b] === 0) continue;
      const predicted = sums[b] / counts[b];
      const observed = hits[b] / counts[b];
      points.push([predicted, observed]);
      ece += (counts[b] / N) * Math.abs(predicted - observed);
    }
    return { points, ece, counts };
  }, [bias, seed]);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Во сколько раз модель завышает шансы', 'How much the model inflates the odds')}
          value={bias}
          min={0.3}
          max={3}
          step={0.05}
          onChange={setBias}
          format={(v) => `${v.toFixed(2)}x`}
        />
      </div>
      <Plot
        xDomain={[0, 0.6]}
        yDomain={[0, 0.6]}
        xLabel="predicted probability"
        yLabel="observed frequency"
        formatX={(v) => `${(v * 100).toFixed(0)}%`}
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="reliability diagram"
      >
        {(s) => (
          <>
            <Line
              points={[
                [0, 0],
                [0.6, 0.6],
              ]}
              s={s}
              color="var(--text-faint)"
              dashed
              width={1.5}
            />
            <Line points={data.points} s={s} color="var(--series-1)" width={2} />
            <Dots points={data.points} s={s} color="var(--series-1)" r={3} />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--text-faint)', label: 'perfect calibration' },
          { color: 'var(--series-1)', label: 'this model' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('ECE — средняя ошибка калибровки', 'ECE — expected calibration error')}
          value={`${(data.ece * 100).toFixed(2)} pp`}
          tone={data.ece < 0.01 ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Смещение шансов', 'Odds shift')}
          value={`${bias.toFixed(2)}x`}
          tone={Math.abs(bias - 1) < 0.05 ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Кривая ниже диагонали означает, что модель обещает больше кликов, чем происходит. Ранжирующая способность при этом не страдает совсем: порядок объявлений сохраняется, AUC не меняется. Поэтому калибровку нельзя заметить метриками порядка — её смотрят отдельно.',
            'A curve below the diagonal means the model promises more clicks than actually happen. Ranking ability is untouched by this: the order of the ads is preserved and AUC does not move. So calibration cannot be spotted by ranking metrics — it is checked separately.',
          ),
        )}
      </p>
      <SeedControl seed={seed} onSeed={setSeed} />
    </>
  );
}

/** Miscalibration that is not uniform across advertisers costs real money. */
export function CalibrationMoney() {
  const { t } = useLang();
  const [skew, setSkew] = useState(1.6);

  const data = useMemo(() => {
    // Two advertisers; the model overestimates the first one's click rate.
    const truth: Bidder[] = [
      { id: 'A', bid: 25, quality: 0.05, value: 25 },
      { id: 'B', bid: 20, quality: 0.08, value: 20 },
      { id: 'C', bid: 15, quality: 0.06, value: 15 },
    ];
    const believed = truth.map((b) => (b.id === 'A' ? { ...b, quality: b.quality * skew } : b));

    const slots = [0.08, 0.045];
    // Ranking uses the believed quality; money is earned at the true quality.
    const rankedBelieved = [...believed].sort((a, b) => b.bid * b.quality - a.bid * a.quality);
    const rankedTrue = [...truth].sort((a, b) => b.bid * b.quality - a.bid * a.quality);

    const revenueOf = (order: Bidder[]) =>
      order.slice(0, slots.length).reduce((acc, ad, i) => {
        const trueQuality = truth.find((t2) => t2.id === ad.id)!.quality;
        return acc + slots[i] * trueQuality * ad.bid;
      }, 0);

    const actual = revenueOf(rankedBelieved);
    const best = revenueOf(rankedTrue);
    return {
      actual,
      best,
      loss: best === 0 ? 0 : (best - actual) / best,
      order: rankedBelieved.map((b) => b.id),
      bestOrder: rankedTrue.map((b) => b.id),
    };
  }, [skew]);

  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let s = 0.5; s <= 3; s += 0.05) {
      const truth: Bidder[] = [
        { id: 'A', bid: 25, quality: 0.05, value: 25 },
        { id: 'B', bid: 20, quality: 0.08, value: 20 },
        { id: 'C', bid: 15, quality: 0.06, value: 15 },
      ];
      const believed = truth.map((b) => (b.id === 'A' ? { ...b, quality: b.quality * s } : b));
      const slots = [0.08, 0.045];
      const revenueOf = (order: Bidder[]) =>
        order.slice(0, slots.length).reduce((acc, ad, i) => {
          const trueQuality = truth.find((t2) => t2.id === ad.id)!.quality;
          return acc + slots[i] * trueQuality * ad.bid;
        }, 0);
      const actual = revenueOf([...believed].sort((a, b) => b.bid * b.quality - a.bid * a.quality));
      const best = revenueOf([...truth].sort((a, b) => b.bid * b.quality - a.bid * a.quality));
      pts.push([s, (best - actual) / best]);
    }
    return pts;
  }, []);

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Во сколько раз завышен pCTR объявления A', "How much A's pCTR is overestimated")}
          value={skew}
          min={0.5}
          max={3}
          step={0.05}
          onChange={setSkew}
          format={(v) => `${v.toFixed(2)}x`}
        />
      </div>
      <Plot
        xDomain={[0.5, 3]}
        yDomain={[0, Math.max(0.05, Math.max(...curve.map((p) => p[1])) * 1.2)]}
        xLabel="pCTR overestimation factor"
        yLabel="revenue lost"
        formatY={(v) => `${(v * 100).toFixed(0)}%`}
        ariaLabel="revenue lost against miscalibration"
        height={190}
      >
        {(s) => (
          <>
            <Line points={curve} s={s} color="var(--series-2)" width={2} />
            <VLine at={skew} s={s} color="var(--series-4)" dashed={false} />
            <HLine at={0} s={s} color="var(--border-strong)" dashed={false} />
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout label={l('Порядок по модели', 'Order by the model')} value={data.order.join(' ')} />
        <Readout
          label={l('Правильный порядок', 'Correct order')}
          value={data.bestOrder.join(' ')}
          tone={data.order.join() === data.bestOrder.join() ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Потеря выручки', 'Revenue lost')}
          value={`${(data.loss * 100).toFixed(1)}%`}
          tone={data.loss > 0.01 ? 'bad' : 'ok'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Пока завышение не меняет порядок, потери ровно нулевые — поэтому калибровка и не видна в метриках ранжирования. Но стоит пересечь границу, где A обгоняет B, и площадка начинает показывать объявление с меньшей ожидаемой выручкой. Деньги теряются ступенькой, а не плавно.',
            'As long as the overestimate does not change the order, the loss is exactly zero — which is why calibration is invisible to ranking metrics. But cross the point where A overtakes B and the platform starts showing the ad with lower expected revenue. The money is lost in a step, not gradually.',
          ),
        )}
      </p>
    </>
  );
}

/* --------------------------------------------------------------- ad load -- */

export function AdLoad() {
  const { t } = useLang();
  const [slots, setSlots] = useState(2);
  const [sensitivity, setSensitivity] = useState(0.5);

  const data = useMemo(() => {
    const point = (n: number) => {
      // Each extra ad slot pushes organic results down and earns less than the last.
      let adRevenue = 0;
      for (let i = 1; i <= n; i += 1) adRevenue += 0.08 / Math.pow(i, 0.9) * 25 * 0.06;
      // User harm grows faster than linearly: the page becomes an ad page.
      const harm = sensitivity * Math.pow(n, 1.6) * 0.012;
      const organic = Math.max(0, 1 - harm);
      // Long-run value: today's money times the share of users who keep coming back.
      const longRun = adRevenue * organic;
      return { adRevenue, organic, longRun };
    };
    const curve: Array<{ n: number; adRevenue: number; organic: number; longRun: number }> = [];
    for (let n = 0; n <= 8; n += 1) curve.push({ n, ...point(n) });
    const best = curve.reduce((b, c) => (c.longRun > b.longRun ? c : b), curve[0]);
    return { curve, best, current: point(slots) };
  }, [slots, sensitivity]);

  const maxRevenue = Math.max(...data.curve.map((c) => c.adRevenue));

  return (
    <>
      <div className="controls">
        <Slider
          label={l('Рекламных мест в выдаче', 'Ad slots on the page')}
          value={slots}
          min={0}
          max={8}
          step={1}
          onChange={setSlots}
          format={(v) => String(v)}
        />
        <Slider
          label={l('Чувствительность пользователей к рекламе', 'How much users mind the ads')}
          value={sensitivity}
          min={0.1}
          max={1.5}
          step={0.05}
          onChange={setSensitivity}
          format={(v) => v.toFixed(2)}
        />
      </div>
      <Plot
        xDomain={[-0.4, 8.4]}
        yDomain={[0, maxRevenue * 1.25]}
        xTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
        xLabel="ad slots"
        yLabel="revenue per impression"
        ariaLabel="short-term and long-run revenue against ad load"
      >
        {(s) => (
          <>
            <Bars
              centers={data.curve.map((c) => c.n)}
              values={data.curve.map((c) => c.adRevenue)}
              binWidth={0.7}
              s={s}
              color="var(--series-2)"
              opacity={0.45}
            />
            <Line
              points={data.curve.map((c) => [c.n, c.longRun])}
              s={s}
              color="var(--series-3)"
              width={2.5}
            />
            <VLine at={slots} s={s} color="var(--series-4)" dashed={false} />
            <VLine at={data.best.n} s={s} color="var(--ok)" label="optimum" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-2)', label: 'revenue today' },
          { color: 'var(--series-3)', label: 'revenue adjusted for user loss' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Выручка сегодня', 'Revenue today')}
          value={data.current.adRevenue.toFixed(4)}
        />
        <Readout
          label={l('Осталось пользователей', 'Users retained')}
          value={`${(data.current.organic * 100).toFixed(0)}%`}
          tone={data.current.organic > 0.9 ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Оптимум мест', 'Optimal slots')}
          value={String(data.best.n)}
          tone={slots === data.best.n ? 'ok' : undefined}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Серые столбики растут почти монотонно: каждое новое место приносит деньги сегодня. Зелёная кривая — та же выручка с поправкой на уходящих пользователей, и у неё есть максимум. Весь спор про рекламную нагрузку сводится к тому, что первая кривая измеряется за неделю, а вторая — за квартал, и команда, которую премируют по первой, всегда будет предлагать больше мест.',
            'The grey bars grow almost monotonically: every extra slot brings money today. The green curve is the same revenue adjusted for users walking away, and it has a maximum. The entire argument about ad load comes down to the first curve being measurable in a week and the second in a quarter, so a team rewarded on the first will always propose more slots.',
          ),
        )}
      </p>
    </>
  );
}
