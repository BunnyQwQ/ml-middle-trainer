import { useMemo, useState } from 'react';
import { l } from '@/i18n/types';
import { useLang } from '@/i18n/LangProvider';
import { makeRng } from '@/lib/rng';
import { HLine, Legend, Line, Plot, VLine } from '@/ui/Plot';
import { Readout, Select, Slider } from '@/ui/controls';

/* ----------------------------------------------------------- activations -- */

type ActId = 'sigmoid' | 'tanh' | 'relu' | 'leaky' | 'leaky1' | 'gelu';

const ACTS: Record<ActId, { label: ReturnType<typeof l>; f: (x: number) => number; d: (x: number) => number }> = {
  sigmoid: {
    label: l('Сигмоида', 'Sigmoid'),
    f: (x) => 1 / (1 + Math.exp(-x)),
    d: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    },
  },
  tanh: {
    label: l('Гиперболический тангенс', 'Tanh'),
    f: (x) => Math.tanh(x),
    d: (x) => 1 - Math.tanh(x) ** 2,
  },
  relu: {
    label: l('ReLU', 'ReLU'),
    f: (x) => Math.max(0, x),
    d: (x) => (x > 0 ? 1 : 0),
  },
  leaky: {
    label: l('LeakyReLU(0.01)', 'LeakyReLU(0.01)'),
    f: (x) => (x > 0 ? x : 0.01 * x),
    d: (x) => (x > 0 ? 1 : 0.01),
  },
  leaky1: {
    label: l('LeakyReLU(1) — ловушка', 'LeakyReLU(1) — the trap'),
    f: (x) => x,
    d: () => 1,
  },
  gelu: {
    label: l('GELU (приближение)', 'GELU (approximation)'),
    f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    d: (x) => {
      const h = 1e-4;
      const f = ACTS.gelu.f;
      return (f(x + h) - f(x - h)) / (2 * h);
    },
  },
};

export function Activations() {
  const { t } = useLang();
  const [act, setAct] = useState<ActId>('sigmoid');
  const [depth, setDepth] = useState(10);

  const data = useMemo(() => {
    const spec = ACTS[act];
    const fn: Array<[number, number]> = [];
    const deriv: Array<[number, number]> = [];
    for (let i = 0; i <= 200; i += 1) {
      const x = -6 + (12 * i) / 200;
      fn.push([x, spec.f(x)]);
      deriv.push([x, spec.d(x)]);
    }
    // How a gradient shrinks through `depth` layers at a typical pre-activation.
    const typical = 1.5;
    const perLayer = spec.d(typical);
    const through = perLayer ** depth;
    const isLinear = act === 'leaky1';
    return { fn, deriv, perLayer, through, isLinear };
  }, [act, depth]);

  return (
    <>
      <div className="controls">
        <Select
          label={l('Активация', 'Activation')}
          value={act}
          options={(Object.keys(ACTS) as ActId[]).map((id) => ({ value: id, label: ACTS[id].label }))}
          onChange={setAct}
        />
        <Slider
          label={l('Глубина сети, слоёв', 'Network depth, layers')}
          value={depth}
          min={1}
          max={30}
          step={1}
          onChange={setDepth}
          format={(v) => String(v)}
        />
      </div>
      <Plot
        xDomain={[-6, 6]}
        yDomain={[-1.5, 2.5]}
        xLabel="pre-activation"
        yLabel="value"
        ariaLabel="activation function and its derivative"
      >
        {(s) => (
          <>
            <HLine at={0} s={s} color="var(--border-strong)" dashed={false} />
            <VLine at={0} s={s} color="var(--border-strong)" dashed={false} />
            <Line points={data.fn} s={s} color="var(--series-1)" width={2} />
            <Line points={data.deriv} s={s} color="var(--series-2)" width={2} dashed />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { color: 'var(--series-1)', label: 'activation' },
          { color: 'var(--series-2)', label: 'derivative' },
        ]}
      />
      <div className="readouts">
        <Readout
          label={l('Производная при x = 1.5', 'Derivative at x = 1.5')}
          value={data.perLayer.toFixed(4)}
        />
        <Readout
          label={l('Множитель градиента через всю сеть', 'Gradient factor through the whole network')}
          value={data.through < 1e-4 ? data.through.toExponential(1) : data.through.toFixed(4)}
          tone={data.through < 0.01 ? 'bad' : 'ok'}
        />
        <Readout
          label={l('Нелинейность', 'Non-linearity')}
          value={data.isLinear ? t(l('нет', 'none')) : t(l('есть', 'present'))}
          tone={data.isLinear ? 'bad' : 'ok'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'Сигмоида при десяти слоях умножает градиент примерно на 10⁻⁷ — это и есть затухание градиента, из-за которого глубокие сети не учились до ReLU. Отдельно посмотри на LeakyReLU(1): её график — прямая, производная всюду единица. Формально это активация, фактически — тождественная функция, и слой с ней не добавляет сети ни капли выразительности.',
            'Sigmoid over ten layers multiplies the gradient by roughly 10⁻⁷ — that is the vanishing gradient that kept deep networks from training before ReLU. Look separately at LeakyReLU(1): its graph is a straight line and its derivative is one everywhere. Formally an activation, in fact the identity, and a layer using it adds not a drop of expressive power.',
          ),
        )}
      </p>
    </>
  );
}

/* ------------------------------------------------------- symmetry breaking -- */

export function InitSymmetry() {
  const { t } = useLang();
  const [scheme, setScheme] = useState<'zeros' | 'constant' | 'random'>('zeros');
  const [seed, setSeed] = useState(3);
  const HIDDEN = 4;
  const STEPS = 12;

  const data = useMemo(() => {
    const rng = makeRng(seed * 7919);
    // A toy layer: four hidden units, one input, trained by plain gradient steps.
    const init = () => {
      if (scheme === 'zeros') return new Array(HIDDEN).fill(0);
      if (scheme === 'constant') return new Array(HIDDEN).fill(0.5);
      return Array.from({ length: HIDDEN }, () => rng.normal(0, 0.5));
    };
    let w = init();
    const history: number[][] = [w.slice()];
    for (let step = 0; step < STEPS; step += 1) {
      // Every unit sees the same input and the same error, so the update is
      // identical for units that started identical.
      const x = 1;
      const target = 0.8;
      const out = w.reduce((acc, wi) => acc + Math.max(0, wi * x), 0) / HIDDEN;
      const error = out - target;
      w = w.map((wi) => wi - 0.3 * error * (wi * x > 0 ? x : 0) / HIDDEN);
      history.push(w.slice());
    }
    const distinct = new Set(w.map((v) => v.toFixed(6))).size;
    return { history, w, distinct };
  }, [scheme, seed]);

  const series = Array.from({ length: HIDDEN }, (_, unit) =>
    data.history.map((row, step) => [step, row[unit]] as [number, number]),
  );
  const colors = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

  return (
    <>
      <div className="controls">
        <Select
          label={l('Инициализация весов', 'Weight initialisation')}
          value={scheme}
          options={[
            { value: 'zeros', label: l('Все нули', 'All zeros') },
            { value: 'constant', label: l('Все одинаковые, 0.5', 'All the same, 0.5') },
            { value: 'random', label: l('Случайная', 'Random') },
          ]}
          onChange={setScheme}
        />
      </div>
      <Plot
        xDomain={[0, STEPS]}
        yDomain={[-1.2, 1.2]}
        xLabel="training step"
        yLabel="weight"
        ariaLabel="weights of four hidden units during training"
        height={200}
      >
        {(s) => (
          <>
            <HLine at={0} s={s} color="var(--border-strong)" dashed={false} />
            {series.map((points, i) => (
              <Line key={i} points={points} s={s} color={colors[i]} width={2} opacity={0.85} />
            ))}
          </>
        )}
      </Plot>
      <div className="readouts">
        <Readout
          label={l('Различных весов в конце', 'Distinct weights at the end')}
          value={`${data.distinct} / ${HIDDEN}`}
          tone={data.distinct === HIDDEN ? 'ok' : 'bad'}
        />
        <Readout
          label={l('Нейроны различимы', 'The units are distinguishable')}
          value={data.distinct > 1 ? t(l('да', 'yes')) : t(l('нет', 'no'))}
          tone={data.distinct > 1 ? 'ok' : 'bad'}
        />
      </div>
      <p className="faint">
        {t(
          l(
            'При нулевой и при любой одинаковой инициализации все четыре линии лежат друг на друге: нейроны получают один и тот же градиент и остаются копиями навсегда. Слой из ста таких нейронов имеет выразительность одного. Случайная инициализация разводит их с первого шага — именно для этого она и нужна, а не ради «хорошего старта».',
            'With zero initialisation, or any identical one, all four lines lie on top of each other: the units receive the same gradient and stay copies forever. A layer of a hundred such units has the expressive power of one. Random initialisation separates them from the first step — that is what it is for, rather than for a "good start".',
          ),
        )}
      </p>
      <SeedRow seed={seed} onSeed={setSeed} visible={scheme === 'random'} />
    </>
  );
}

function SeedRow({
  seed,
  onSeed,
  visible,
}: {
  seed: number;
  onSeed: (next: number) => void;
  visible: boolean;
}) {
  const { t } = useLang();
  if (!visible) return null;
  return (
    <div className="row" style={{ marginTop: 10 }}>
      <button type="button" className="btn btn--sm" onClick={() => onSeed(seed + 1)}>
        {t(l('Новый сид', 'New seed'))}
      </button>
      <span className="faint">{seed}</span>
    </div>
  );
}
