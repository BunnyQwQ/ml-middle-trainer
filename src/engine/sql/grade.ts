import { getDataset } from '@/content/datasets';
import type { SqlTask } from '@/content/types';
import { compareResults } from '../grading/compare';
import type { ResultSet, Submission, TestOutcome, Verdict } from '../grading/types';

/**
 * The testing system, ejudge style: the query runs on the open sample and on
 * hidden databases, and the result is compared against the reference solution
 * on every one of them. The reference is executed, never stored as text, so a
 * task cannot drift away from its own expected answer.
 */

export type SqlRunner = (args: {
  setupSql: string;
  queries: string[];
  timeoutMs: number;
}) => Promise<Array<{ ok: true; result: ResultSet } | { ok: false; message: string }>>;

export type SqlTimeoutError = { isTimeout: true };

export function isTimeout(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'SqlTimeout' || /time limit|timeout/i.test(err.message))
  );
}

export const SQL_TIME_LIMIT_MS = 15000;

export async function gradeSql(
  task: SqlTask,
  userSql: string,
  runner: SqlRunner,
  timeLimitMs = SQL_TIME_LIMIT_MS,
): Promise<Submission> {
  const started = Date.now();
  const tests: TestOutcome[] = [];
  let sampleOutput: ResultSet | undefined;
  let sampleExpected: ResultSet | undefined;

  if (userSql.trim().length === 0) {
    return {
      verdict: 'RE',
      tests: [],
      passed: 0,
      total: 1 + task.hiddenDatasets.length,
      engineError: 'empty query',
      elapsedMs: 0,
    };
  }

  const datasetIds = [task.dataset, ...task.hiddenDatasets];

  for (const [index, datasetId] of datasetIds.entries()) {
    const hidden = index > 0;
    const name = hidden ? `hidden ${index}` : 'sample';
    const dataset = getDataset(datasetId);

    let outcomes: Awaited<ReturnType<SqlRunner>>;
    try {
      outcomes = await runner({
        setupSql: dataset.setupSql(),
        // The reference runs first on the same database as the user's query.
        queries: [task.reference, userSql],
        timeoutMs: timeLimitMs,
      });
    } catch (err) {
      const timedOut = isTimeout(err);
      tests.push({
        name,
        hidden,
        verdict: timedOut ? 'TL' : 'RE',
        message: timedOut ? undefined : err instanceof Error ? err.message : String(err),
      });
      break;
    }

    const [refOutcome, userOutcome] = outcomes;
    if (!refOutcome || !refOutcome.ok) {
      // The task's own reference is broken; this is caught in CI, never shipped.
      return {
        verdict: 'RE',
        tests,
        passed: tests.filter((t) => t.verdict === 'OK').length,
        total: datasetIds.length,
        engineError: `reference solution failed on ${name}: ${
          refOutcome && !refOutcome.ok ? refOutcome.message : 'no result'
        }`,
        elapsedMs: Date.now() - started,
      };
    }

    if (!hidden) sampleExpected = refOutcome.result;

    if (!userOutcome || !userOutcome.ok) {
      tests.push({
        name,
        hidden,
        verdict: 'RE',
        message: userOutcome && !userOutcome.ok ? userOutcome.message : 'no result',
      });
      break;
    }

    if (!hidden) sampleOutput = userOutcome.result;

    const cmp = compareResults(refOutcome.result, userOutcome.result, task.orderMatters);
    if (cmp.ok) {
      tests.push({ name, hidden, verdict: 'OK' });
    } else {
      tests.push({
        name,
        hidden,
        verdict: 'WA',
        // Hidden tests never leak their data: only the shape of the mismatch.
        diff: hidden ? redactDiff(cmp.diff) : cmp.diff,
      });
      break;
    }
  }

  const passed = tests.filter((t) => t.verdict === 'OK').length;
  const failing = tests.find((t) => t.verdict !== 'OK');
  const verdict: Verdict = failing ? failing.verdict : 'OK';

  return {
    verdict,
    tests,
    passed,
    total: datasetIds.length,
    sampleOutput,
    sampleExpected,
    elapsedMs: Date.now() - started,
  };
}

/** Keep row and column counts, drop the values of hidden datasets. */
function redactDiff(diff: NonNullable<TestOutcome['diff']>): TestOutcome['diff'] {
  if (diff.kind === 'cell') return { kind: 'cell', row: diff.row, expectedRow: [], actualRow: [] };
  return diff;
}
