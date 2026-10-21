/**
 * Runs every SQL reference solution against every one of its datasets and
 * grades it with the same code the browser uses. A task whose own reference
 * does not produce the expected answer never reaches the site.
 *
 * On top of that, two probes confirm the checker actually rejects wrong
 * answers: a query of the wrong shape, and (for ordered tasks) the right rows
 * in the wrong order.
 *
 * Run: npm run check:sql
 */
import { DuckDBInstance } from '@duckdb/node-api';
import { NODES } from '@/content/graph';
import type { SqlTask } from '@/content/types';
import { normalizeRows } from '@/engine/grading/compare';
import { dropStatements } from '@/engine/sql/isolate';
import { splitStatements, stripTrailingSemicolon } from '@/engine/sql/split';
import { gradeSql, type SqlRunner } from '@/engine/sql/grade';

// One instance for the whole run, exactly like the browser: that way CI sees
// the same shared-state problems a user would.
const instance = await DuckDBInstance.create(':memory:');
const sharedConn = await instance.connect();

const runner: SqlRunner = async ({ setupSql, queries }) => {
  for (const stmt of dropStatements(setupSql)) {
    await sharedConn.run(stmt);
  }
  for (const stmt of splitStatements(setupSql)) {
    await sharedConn.run(stmt);
  }
  const out: Awaited<ReturnType<SqlRunner>> = [];
  for (const query of queries) {
    try {
      const reader = await sharedConn.runAndReadAll(stripTrailingSemicolon(query));
      const columns = reader.columnNames();
      const objects = reader.getRowObjectsJS() as Array<Record<string, unknown>>;
      const rows = objects.map((row) => columns.map((c) => row[c]));
      out.push({ ok: true, result: { columns, rows: normalizeRows(rows) } });
    } catch (err) {
      out.push({ ok: false, message: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
};

const sqlTasks: Array<{ nodeId: string; task: SqlTask }> = [];
for (const node of NODES) {
  for (const task of node.tasks) {
    if (task.kind === 'sql') sqlTasks.push({ nodeId: node.id, task });
  }
}

console.log(`sql reference check: ${sqlTasks.length} task(s)`);

let failures = 0;

for (const { nodeId, task } of sqlTasks) {
  const started = Date.now();
  const submission = await gradeSql(task, task.reference, runner, 120_000);
  const elapsed = Date.now() - started;

  if (submission.verdict !== 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id} (${nodeId}): reference got ${submission.verdict}`);
    if (submission.engineError) console.error(`    engine: ${submission.engineError}`);
    for (const test of submission.tests) {
      if (test.verdict !== 'OK') {
        console.error(`    ${test.name}: ${test.verdict} ${test.message ?? ''}`);
        if (test.diff) console.error(`    diff: ${JSON.stringify(test.diff).slice(0, 300)}`);
      }
    }
    continue;
  }

  const sampleRows = submission.sampleOutput?.rows.length ?? 0;
  if (sampleRows === 0) {
    failures += 1;
    console.error(`  FAIL ${task.id}: reference returns no rows on the sample dataset`);
    continue;
  }

  // Probe 1: a query of the wrong shape must not pass.
  const shapeProbe = await gradeSql(task, 'SELECT 1 AS x', runner, 120_000);
  if (shapeProbe.verdict === 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id}: the checker accepted "SELECT 1 AS x"`);
    continue;
  }

  // Probe 2: for ordered tasks, the same rows in reverse order must not pass.
  let orderProbeOk = true;
  if (task.orderMatters) {
    const reversed = `SELECT * FROM (${stripTrailingSemicolon(task.reference)}) AS t ORDER BY 1 DESC`;
    const probe = await gradeSql(task, reversed, runner, 120_000);
    if (probe.verdict === 'OK') {
      orderProbeOk = false;
      failures += 1;
      console.error(`  FAIL ${task.id}: orderMatters is set but reversed order passed`);
    }
  }

  if (orderProbeOk) {
    console.log(
      `  ok   ${task.id}: ${submission.passed}/${submission.total} datasets, ` +
        `${sampleRows} sample rows, ${elapsed} ms`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} SQL check(s) failed`);
  process.exit(1);
}

console.log('  all sql references pass');
