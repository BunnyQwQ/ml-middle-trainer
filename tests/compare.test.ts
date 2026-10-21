import { describe, expect, it } from 'vitest';
import { cellsEqual, compareResults, normalizeCell, normalizeRows } from '@/engine/grading/compare';
import type { ResultSet } from '@/engine/grading/types';

function rs(columns: string[], rows: Array<Array<string | number | boolean | null>>): ResultSet {
  return { columns, rows };
}

describe('result normalisation', () => {
  it('turns DuckDB BigInt counts into plain numbers', () => {
    // count(*) comes back as BigInt from both duckdb-wasm and the node bindings.
    expect(normalizeCell(42n)).toBe(42);
    expect(normalizeRows([[1n, 'x']])).toEqual([[1, 'x']]);
  });

  it('keeps null distinct from zero and from empty string', () => {
    expect(normalizeCell(null)).toBeNull();
    expect(normalizeCell(undefined)).toBeNull();
    expect(cellsEqual(null, 0)).toBe(false);
    expect(cellsEqual(null, '')).toBe(false);
    expect(cellsEqual(null, null)).toBe(true);
  });

  it('renders timestamps deterministically', () => {
    const date = new Date(Date.UTC(2026, 2, 2, 10, 0, 0));
    expect(normalizeCell(date)).toBe('2026-03-02T10:00:00.000Z');
  });

  it('compares floats with tolerance instead of bit equality', () => {
    expect(cellsEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(cellsEqual(1 / 3, 0.3333333333333333)).toBe(true);
    expect(cellsEqual(0.2, 0.2001)).toBe(false);
  });

  it('matches a numeric column against the same value as text', () => {
    expect(cellsEqual(5, '5')).toBe(true);
    expect(cellsEqual(true, 'true')).toBe(true);
  });
});

describe('result comparison', () => {
  const expected = rs(['k', 'n'], [
    [1, 10],
    [2, 20],
    [3, 30],
  ]);

  it('accepts an identical result', () => {
    expect(compareResults(expected, expected, true).ok).toBe(true);
  });

  it('rejects a different column count', () => {
    const actual = rs(['k'], [[1], [2], [3]]);
    const res = compareResults(expected, actual, true);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diff).toEqual({ kind: 'columns', expected: 2, actual: 1 });
  });

  it('rejects a different row count', () => {
    const actual = rs(['k', 'n'], [[1, 10]]);
    const res = compareResults(expected, actual, true);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diff).toEqual({ kind: 'rows', expected: 3, actual: 1 });
  });

  it('honours row order when the task says it matters', () => {
    const shuffled = rs(['k', 'n'], [
      [2, 20],
      [1, 10],
      [3, 30],
    ]);
    expect(compareResults(expected, shuffled, true).ok).toBe(false);
    expect(compareResults(expected, shuffled, false).ok).toBe(true);
  });

  it('still catches wrong values when order is ignored', () => {
    const wrong = rs(['k', 'n'], [
      [2, 20],
      [1, 11],
      [3, 30],
    ]);
    const res = compareResults(expected, wrong, false);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.diff.kind).toBe('cell');
  });

  it('reports the first mismatching row for the diff view', () => {
    const wrong = rs(['k', 'n'], [
      [1, 10],
      [2, 21],
      [3, 30],
    ]);
    const res = compareResults(expected, wrong, true);
    expect(res.ok).toBe(false);
    if (!res.ok && res.diff.kind === 'cell') {
      expect(res.diff.row).toBe(1);
      expect(res.diff.expectedRow).toEqual([2, 20]);
      expect(res.diff.actualRow).toEqual([2, 21]);
    }
  });
});

describe('run isolation', () => {
  it('derives drop statements from whatever the setup script creates', async () => {
    const { dropStatements, tableNamesFromDdl } = await import('@/engine/sql/isolate');
    const ddl = `CREATE TABLE users (id INT);
CREATE TABLE IF NOT EXISTS queries (id INT);
INSERT INTO users VALUES (1);`;
    expect(tableNamesFromDdl(ddl)).toEqual(['users', 'queries']);
    // Reverse order, so a later schema with foreign keys still drops cleanly.
    expect(dropStatements(ddl)).toEqual([
      'DROP TABLE IF EXISTS queries',
      'DROP TABLE IF EXISTS users',
    ]);
  });
});
