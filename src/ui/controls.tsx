import { useId, type ReactNode } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { L } from '@/i18n/types';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  disabled,
}: {
  label: L;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const { t } = useLang();
  const id = useId();
  return (
    <div className="control">
      <label className="control__label" htmlFor={id}>
        <span>{t(label)}</span>
        <span className="control__value">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: L;
  value: T;
  options: Array<{ value: T; label: L }>;
  onChange: (v: T) => void;
}) {
  const { t } = useLang();
  const id = useId();
  return (
    <div className="control">
      <label className="control__label" htmlFor={id}>
        <span>{t(label)}</span>
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.label)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Readout({
  label,
  value,
  tone,
}: {
  label: L;
  value: string;
  tone?: 'ok' | 'bad';
}) {
  const { t } = useLang();
  return (
    <div className="readout">
      <span className="readout__label">{t(label)}</span>
      <span className={`readout__value${tone ? ` readout__value--${tone}` : ''}`}>{value}</span>
    </div>
  );
}

export function Stars({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'stars__on' : 'stars__off'}>
          {i < value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

/** Frame around every interactive block, so they all look the same. */
export function SimFrame({
  title,
  caption,
  children,
}: {
  title: L;
  caption?: L;
  children: ReactNode;
}) {
  const { t } = useLang();
  return (
    <figure className="sim">
      <div className="sim__head">
        <span className="sim__title">{t(title)}</span>
        <span className="sim__tag">{t(UI.sim.run)}</span>
      </div>
      <div className="sim__body">
        {children}
        {caption && <figcaption className="sim__caption">{t(caption)}</figcaption>}
      </div>
    </figure>
  );
}

export function SeedControl({
  seed,
  onSeed,
  extra,
}: {
  seed: number;
  onSeed: (next: number) => void;
  extra?: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="row" style={{ marginTop: 10 }}>
      <button type="button" className="btn btn--sm" onClick={() => onSeed(seed + 1)}>
        {t(UI.sim.newSeed)}
      </button>
      <span className="faint">
        {t(UI.sim.seed)} {seed}
      </span>
      {extra}
    </div>
  );
}
