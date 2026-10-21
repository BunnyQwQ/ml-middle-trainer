import { useId, type ReactNode } from 'react';

/**
 * A minimal composable SVG plot. Hand-rolled on purpose: the data in these
 * lessons is small, and this way every colour comes from a theme token and
 * the whole thing scales down to a phone without a second layout engine.
 */

export type Scales = {
  x: (v: number) => number;
  y: (v: number) => number;
  /** Inverse of x, for drag interactions. */
  xInv: (px: number) => number;
  w: number;
  h: number;
  padL: number;
  padT: number;
  xDomain: [number, number];
  yDomain: [number, number];
};

type PlotProps = {
  width?: number;
  height?: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks?: number[];
  yTicks?: number[];
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
  padLeft?: number;
  padBottom?: number;
  children: (s: Scales) => ReactNode;
  onPointerMove?: (xValue: number, s: Scales) => void;
  ariaLabel?: string;
};

function niceTicks(domain: [number, number], count: number): number[] {
  const [lo, hi] = domain;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return [lo];
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-6; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const DEFAULT_FORMAT = (v: number) => {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  if (a >= 0.01) return v.toFixed(2);
  return v.toExponential(0);
};

export function Plot({
  width = 640,
  height = 230,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  formatX = DEFAULT_FORMAT,
  formatY = DEFAULT_FORMAT,
  xLabel,
  yLabel,
  padLeft = 44,
  padBottom = 30,
  children,
  onPointerMove,
  ariaLabel,
}: PlotProps) {
  const padT = 10;
  const padR = 12;
  const w = width - padLeft - padR;
  const h = height - padT - padBottom;
  const clipId = useId().replace(/:/g, '');

  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  const spanX = x1 - x0 || 1;
  const spanY = y1 - y0 || 1;

  const scales: Scales = {
    x: (v) => padLeft + ((v - x0) / spanX) * w,
    y: (v) => padT + h - ((v - y0) / spanY) * h,
    xInv: (px) => x0 + ((px - padLeft) / w) * spanX,
    w,
    h,
    padL: padLeft,
    padT,
    xDomain,
    yDomain,
  };

  const xs = xTicks ?? niceTicks(xDomain, 5);
  const ys = yTicks ?? niceTicks(yDomain, 4);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={
        onPointerMove
          ? (e) => {
              const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
              if (!rect) return;
              const px = ((e.clientX - rect.left) / rect.width) * width;
              onPointerMove(scales.xInv(px), scales);
            }
          : undefined
      }
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={padLeft} y={padT} width={w} height={h} />
        </clipPath>
      </defs>

      {ys.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={padLeft}
            x2={padLeft + w}
            y1={scales.y(t)}
            y2={scales.y(t)}
            stroke="var(--grid)"
            strokeWidth={1}
          />
          <text x={padLeft - 6} y={scales.y(t) + 3} textAnchor="end">
            {formatY(t)}
          </text>
        </g>
      ))}

      {xs.map((t) => (
        <g key={`x${t}`}>
          <line
            x1={scales.x(t)}
            x2={scales.x(t)}
            y1={padT}
            y2={padT + h}
            stroke="var(--grid)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text x={scales.x(t)} y={padT + h + 14} textAnchor="middle">
            {formatX(t)}
          </text>
        </g>
      ))}

      <g clipPath={`url(#${clipId})`}>{children(scales)}</g>

      <line
        x1={padLeft}
        x2={padLeft + w}
        y1={padT + h}
        y2={padT + h}
        stroke="var(--border-strong)"
        strokeWidth={1}
      />
      <line x1={padLeft} x2={padLeft} y1={padT} y2={padT + h} stroke="var(--border-strong)" strokeWidth={1} />

      {xLabel && (
        <text x={padLeft + w} y={height - 2} textAnchor="end" fill="var(--text-faint)">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={2} y={padT - 1} textAnchor="start" fill="var(--text-faint)">
          {yLabel}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------- marks ----- */

export function Line({
  points,
  s,
  color = 'var(--series-1)',
  width = 2,
  dashed = false,
  opacity = 1,
}: {
  points: Array<[number, number]>;
  s: Scales;
  color?: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  if (points.length === 0) return null;
  const d = points
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${s.x(px).toFixed(2)} ${s.y(py).toFixed(2)}`)
    .join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? '5 4' : undefined}
      opacity={opacity}
    />
  );
}

export function Area({
  points,
  s,
  color = 'var(--series-1)',
  opacity = 0.18,
  baseline,
}: {
  points: Array<[number, number]>;
  s: Scales;
  color?: string;
  opacity?: number;
  baseline?: number;
}) {
  if (points.length === 0) return null;
  const base = s.y(baseline ?? s.yDomain[0]);
  const d = [
    `M${s.x(points[0][0]).toFixed(2)} ${base.toFixed(2)}`,
    ...points.map(([px, py]) => `L${s.x(px).toFixed(2)} ${s.y(py).toFixed(2)}`),
    `L${s.x(points[points.length - 1][0]).toFixed(2)} ${base.toFixed(2)}`,
    'Z',
  ].join(' ');
  return <path d={d} fill={color} opacity={opacity} stroke="none" />;
}

export function Bars({
  centers,
  values,
  binWidth,
  s,
  color = 'var(--series-1)',
  opacity = 0.75,
}: {
  centers: number[];
  values: number[];
  binWidth: number;
  s: Scales;
  color?: string;
  opacity?: number;
}) {
  const pxWidth = Math.max(1, Math.abs(s.x(binWidth) - s.x(0)) - 1);
  const base = s.y(Math.max(0, s.yDomain[0]));
  return (
    <g fill={color} opacity={opacity}>
      {centers.map((c, i) => {
        const top = s.y(values[i]);
        const height = Math.max(0, base - top);
        if (height <= 0) return null;
        return (
          <rect
            key={c}
            x={s.x(c) - pxWidth / 2}
            y={top}
            width={pxWidth}
            height={height}
            rx={Math.min(2, pxWidth / 3)}
          />
        );
      })}
    </g>
  );
}

export function Dots({
  points,
  s,
  color = 'var(--series-2)',
  r = 2.5,
  opacity = 1,
}: {
  points: Array<[number, number]>;
  s: Scales;
  color?: string;
  r?: number;
  opacity?: number;
}) {
  return (
    <g fill={color} opacity={opacity}>
      {points.map(([px, py], i) => (
        <circle key={i} cx={s.x(px)} cy={s.y(py)} r={r} />
      ))}
    </g>
  );
}

export function VLine({
  at,
  s,
  color = 'var(--text-dim)',
  dashed = true,
  label,
  width = 1.5,
}: {
  at: number;
  s: Scales;
  color?: string;
  dashed?: boolean;
  label?: string;
  width?: number;
}) {
  const px = s.x(at);
  return (
    <g>
      <line
        x1={px}
        x2={px}
        y1={s.padT}
        y2={s.padT + s.h}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      {label && (
        <text x={px + 4} y={s.padT + 10} fill={color} style={{ fontSize: 10 }}>
          {label}
        </text>
      )}
    </g>
  );
}

export function HLine({
  at,
  s,
  color = 'var(--text-dim)',
  dashed = true,
  label,
}: {
  at: number;
  s: Scales;
  color?: string;
  dashed?: boolean;
  label?: string;
}) {
  const py = s.y(at);
  return (
    <g>
      <line
        x1={s.padL}
        x2={s.padL + s.w}
        y1={py}
        y2={py}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      {label && (
        <text x={s.padL + s.w - 2} y={py - 4} textAnchor="end" fill={color} style={{ fontSize: 10 }}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Horizontal segments with a centre dot: used for confidence intervals. */
export function Intervals({
  items,
  s,
  okColor = 'var(--ok)',
  badColor = 'var(--bad)',
}: {
  items: Array<{ lo: number; hi: number; center: number; row: number; ok: boolean }>;
  s: Scales;
  okColor?: string;
  badColor?: string;
}) {
  return (
    <g>
      {items.map((it, i) => {
        const color = it.ok ? okColor : badColor;
        const y = s.y(it.row);
        return (
          <g key={i} stroke={color} fill={color}>
            <line x1={s.x(it.lo)} x2={s.x(it.hi)} y1={y} y2={y} strokeWidth={1.5} />
            <circle cx={s.x(it.center)} cy={y} r={1.6} stroke="none" />
          </g>
        );
      })}
    </g>
  );
}

export function Legend({ items }: { items: Array<{ color: string; label: string }> }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span className="legend__item" key={it.label}>
          <span className="legend__swatch" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
