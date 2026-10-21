import type { Cell, ResultDiff, ResultSet } from './types';

/**
 * Result comparison for the SQL checker.
 *
 * DuckDB hands back BigInt for 64-bit integers (both in the browser via Arrow
 * and in Node), Date objects for timestamps and occasionally typed wrappers,
 * so every value goes through normalisation before anything is compared.
 */
export function normalizeCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  // Arrow can wrap values in objects that still stringify correctly.
  if (typeof value === 'object') {
    const obj = value as { toString?: () => string; valueOf?: () => unknown };
    const raw = obj.valueOf?.();
    if (typeof raw === 'number' || typeof raw === 'bigint') return Number(raw);
    return String(obj.toString ? obj.toString() : JSON.stringify(value));
  }
  return String(value);
}

export function normalizeRows(rows: unknown[][]): Cell[][] {
  return rows.map((row) => row.map(normalizeCell));
}

const ABS_EPS = 1e-9;
const REL_EPS = 1e-9;

export function cellsEqual(a: Cell, b: Cell): boolean {
  if (a === null || b === null) return a === b;
  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return true;
    const diff = Math.abs(a - b);
    return diff <= ABS_EPS || diff <= REL_EPS * Math.max(Math.abs(a), Math.abs(b));
  }
  if (typeof a === 'number' || typeof b === 'number') {
    // One side came back as text: compare numerically when possible.
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return cellsEqual(na, nb);
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return boolLike(a) === boolLike(b);
  }
  return String(a) === String(b);
}

function boolLike(value: Cell): boolean | string {
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return s;
}

function rowKey(row: Cell[]): string {
  return row
    .map((c) => {
      if (c === null) return '\u0000';
      if (typeof c === 'number') return c.toFixed(9);
      if (typeof c === 'boolean') return c ? 'true' : 'false';
      return c;
    })
    .join('\u0001');
}

/**
 * Compare a user result against the reference.
 * With orderMatters = false both sides are sorted first, which is the flag the
 * task author sets when the query has no ORDER BY of its own.
 */
export function compareResults(
  expected: ResultSet,
  actual: ResultSet,
  orderMatters: boolean,
): { ok: true } | { ok: false; diff: ResultDiff } {
  const expectedWidth = expected.columns.length;
  const actualWidth = actual.columns.length;
  if (expectedWidth !== actualWidth) {
    return { ok: false, diff: { kind: 'columns', expected: expectedWidth, actual: actualWidth } };
  }
  if (expected.rows.length !== actual.rows.length) {
    return {
      ok: false,
      diff: { kind: 'rows', expected: expected.rows.length, actual: actual.rows.length },
    };
  }

  let left = expected.rows;
  let right = actual.rows;
  if (!orderMatters) {
    left = [...left].sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
    right = [...right].sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
  }

  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < expectedWidth; j += 1) {
      if (!cellsEqual(left[i][j], right[i][j])) {
        return {
          ok: false,
          diff: { kind: 'cell', row: i, expectedRow: left[i], actualRow: right[i] },
        };
      }
    }
  }
  return { ok: true };
}

/** Render a result set as a small table of text, for the diff view. */
export function formatCell(value: Cell): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value;
}
