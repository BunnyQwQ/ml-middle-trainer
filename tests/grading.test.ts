import { describe, expect, it } from 'vitest';
import type { PythonTask, SqlTask } from '@/content/types';
import { gradeSql, type SqlRunner } from '@/engine/sql/grade';
import { gradePython, type PyRunner } from '@/engine/python/grade';
import type { ResultSet } from '@/engine/grading/types';
import { l } from '@/i18n/types';

const task: SqlTask = {
  kind: 'sql',
  id: 'x.y.sql-demo',
  prompt: l('п', 'p'),
  dataset: 'search-sample',
  hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
  starter: 'SELECT',
  reference: 'SELECT 1 AS a ORDER BY 1',
  orderMatters: true,
  writeup: l('р', 'w'),
};

const ONE: ResultSet = { columns: ['a'], rows: [[1]] };
const TWO: ResultSet = { columns: ['a'], rows: [[2]] };

/** A runner that answers from a script, so verdicts can be tested exactly. */
function scripted(
  plan: Array<{ ref: ResultSet | string; user: ResultSet | string } | 'throw' | 'timeout'>,
): SqlRunner {
  let call = 0;
  return async () => {
    const step = plan[Math.min(call, plan.length - 1)];
    call += 1;
    if (step === 'throw') throw new Error('engine exploded');
    if (step === 'timeout') {
      const err = new Error('time limit exceeded');
      err.name = 'SqlTimeout';
      throw err;
    }
    return [
      typeof step.ref === 'string' ? { ok: false, message: step.ref } : { ok: true, result: step.ref },
      typeof step.user === 'string'
        ? { ok: false, message: step.user }
        : { ok: true, result: step.user },
    ];
  };
}

describe('sql grading', () => {
  it('gives OK only when every dataset agrees', async () => {
    const res = await gradeSql(task, 'SELECT 1 AS a', scripted([{ ref: ONE, user: ONE }]));
    expect(res.verdict).toBe('OK');
    expect(res.passed).toBe(3);
    expect(res.total).toBe(3);
  });

  it('stops at the first hidden mismatch and reports WA', async () => {
    const res = await gradeSql(
      task,
      'SELECT 1 AS a',
      scripted([
        { ref: ONE, user: ONE },
        { ref: ONE, user: TWO },
      ]),
    );
    expect(res.verdict).toBe('WA');
    expect(res.passed).toBe(1);
    expect(res.tests).toHaveLength(2);
  });

  it('hides the data of a failing hidden test', async () => {
    const res = await gradeSql(
      task,
      'SELECT 1 AS a',
      scripted([
        { ref: ONE, user: ONE },
        { ref: ONE, user: TWO },
      ]),
    );
    const hidden = res.tests.find((t) => t.hidden);
    expect(hidden?.verdict).toBe('WA');
    if (hidden?.diff?.kind === 'cell') {
      expect(hidden.diff.expectedRow).toEqual([]);
      expect(hidden.diff.actualRow).toEqual([]);
    }
  });

  it('shows the sample diff so the mistake is visible', async () => {
    const res = await gradeSql(task, 'SELECT 2 AS a', scripted([{ ref: ONE, user: TWO }]));
    expect(res.verdict).toBe('WA');
    expect(res.sampleExpected).toEqual(ONE);
    expect(res.sampleOutput).toEqual(TWO);
    const sample = res.tests.find((t) => !t.hidden);
    if (sample?.diff?.kind === 'cell') expect(sample.diff.expectedRow).toEqual([1]);
  });

  it('reports RE when the user query fails to run', async () => {
    const res = await gradeSql(
      task,
      'SELEKT 1',
      scripted([{ ref: ONE, user: 'syntax error at or near "SELEKT"' }]),
    );
    expect(res.verdict).toBe('RE');
    expect(res.tests[0].message).toContain('SELEKT');
  });

  it('reports TL when the engine runs past the limit', async () => {
    const res = await gradeSql(task, 'SELECT 1', scripted(['timeout']));
    expect(res.verdict).toBe('TL');
  });

  it('blames the task, not the user, when the reference is broken', async () => {
    const res = await gradeSql(task, 'SELECT 1', scripted([{ ref: 'bad reference', user: ONE }]));
    expect(res.verdict).toBe('RE');
    expect(res.engineError).toContain('reference solution failed');
  });

  it('refuses an empty submission without touching the engine', async () => {
    let called = false;
    const res = await gradeSql(task, '   ', async () => {
      called = true;
      return [];
    });
    expect(res.verdict).toBe('RE');
    expect(called).toBe(false);
  });
});

const pyTask: PythonTask = {
  kind: 'python',
  id: 'x.y.py-demo',
  prompt: l('п', 'p'),
  signature: 'def f(x):',
  starter: 'def f(x):\n    pass\n',
  reference: 'def f(x):\n    return x\n',
  tests: 'assert f(1) == 1\n',
  sampleTests: 'assert f(2) == 2\n',
  writeup: l('р', 'w'),
};

function pyScripted(result: Awaited<ReturnType<PyRunner>>): PyRunner {
  return async () => result;
}

describe('python grading', () => {
  it('gives OK when both phases pass', async () => {
    const res = await gradePython(
      pyTask,
      'def f(x): return x',
      pyScripted({
        phases: [
          { name: 'sample', ok: true },
          { name: 'hidden', ok: true },
        ],
        stdout: '',
      }),
    );
    expect(res.verdict).toBe('OK');
    expect(res.passed).toBe(2);
  });

  it('calls a failed assertion WA and an exception RE', async () => {
    const wa = await gradePython(
      pyTask,
      'x',
      pyScripted({
        phases: [{ name: 'sample', ok: false, error: 'AssertionError', isAssertion: true }],
        stdout: '',
      }),
    );
    expect(wa.verdict).toBe('WA');

    const re = await gradePython(
      pyTask,
      'x',
      pyScripted({
        phases: [{ name: 'sample', ok: false, error: 'TypeError: bad', isAssertion: false }],
        stdout: '',
      }),
    );
    expect(re.verdict).toBe('RE');
  });

  it('reports a module that does not even execute as RE', async () => {
    const res = await gradePython(
      pyTask,
      'def f(:',
      pyScripted({ phases: [], stdout: '', userError: 'SyntaxError: invalid syntax' }),
    );
    expect(res.verdict).toBe('RE');
    expect(res.tests[0].message).toContain('SyntaxError');
  });

  it('maps a worker timeout to TL', async () => {
    const res = await gradePython(pyTask, 'while True: pass', async () => {
      const err = new Error('time limit exceeded');
      err.name = 'PyTimeout';
      throw err;
    });
    expect(res.verdict).toBe('TL');
  });
});
