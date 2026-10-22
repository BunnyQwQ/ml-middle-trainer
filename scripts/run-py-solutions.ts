/**
 * Runs every Python reference solution against its own hidden tests, in
 * Pyodide — the same interpreter build the browser uses, so "passes in CI"
 * means "passes for the user".
 *
 * A second probe runs the starter template and requires it to fail: a task
 * that the unedited template already solves is not a task.
 *
 * Run: npm run check:py
 */
import { loadPyodide } from 'pyodide';
import { NODES } from '@/content/graph';
import type { PythonTask, WriteTestsTask } from '@/content/types';
import { gradePython, gradeWriteTests, type PyRunner } from '@/engine/python/grade';

const py = await loadPyodide();
const stdout: string[] = [];
py.setStdout({ batched: (text: string) => stdout.push(text) });
py.setStderr({ batched: (text: string) => stdout.push(text) });

const loaded = new Set<string>();

const runner: PyRunner = async (code, phases, packages) => {
  const missing = (packages ?? []).filter((name) => !loaded.has(name));
  if (missing.length > 0) {
    await py.loadPackage(missing);
    for (const name of missing) loaded.add(name);
  }
  stdout.length = 0;
  const ns = py.globals.get('dict')();
  const results: Array<{ name: string; ok: boolean; error?: string; isAssertion?: boolean }> = [];
  let userError: string | undefined;
  try {
    try {
      py.runPython(code, { globals: ns });
    } catch (err) {
      userError = err instanceof Error ? err.message : String(err);
    }
    if (!userError) {
      for (const phase of phases) {
        try {
          py.runPython(phase.source, { globals: ns });
          results.push({ name: phase.name, ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          results.push({
            name: phase.name,
            ok: false,
            error: message,
            isAssertion: /AssertionError/.test(message),
          });
          break;
        }
      }
    }
  } finally {
    ns.destroy();
  }
  return { phases: results, stdout: stdout.join(''), userError };
};

const pyTasks: Array<{ nodeId: string; task: PythonTask }> = [];
const testTasks: Array<{ nodeId: string; task: WriteTestsTask }> = [];
for (const node of NODES) {
  for (const task of node.tasks) {
    if (task.kind === 'python') pyTasks.push({ nodeId: node.id, task });
    if (task.kind === 'write-tests') testTasks.push({ nodeId: node.id, task });
  }
}

console.log(
  `python reference check: ${pyTasks.length} solution task(s), ${testTasks.length} test-writing task(s)`,
);

let failures = 0;

for (const { nodeId, task } of pyTasks) {
  const started = Date.now();
  const submission = await gradePython(task, task.reference, runner);
  const elapsed = Date.now() - started;

  if (submission.verdict !== 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id} (${nodeId}): reference got ${submission.verdict}`);
    for (const test of submission.tests) {
      if (test.verdict !== 'OK') console.error(`    ${test.name}: ${test.message ?? test.verdict}`);
    }
    continue;
  }

  const starterRun = await gradePython(task, task.starter, runner);
  if (starterRun.verdict === 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id}: the unedited starter passes the tests`);
    continue;
  }

  console.log(
    `  ok   ${task.id}: ${submission.passed}/${submission.total} phases, ` +
      `starter correctly fails with ${starterRun.verdict}, ${elapsed} ms`,
  );
}

/* ---------------------------------------------- tasks where the user writes tests -- */

for (const { nodeId, task } of testTasks) {
  const started = Date.now();
  // The reference suite has to accept the implementation and catch every mutant.
  const submission = await gradeWriteTests(task, task.referenceTests, runner);
  const elapsed = Date.now() - started;

  if (submission.verdict !== 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id} (${nodeId}): reference suite got ${submission.verdict}`);
    for (const outcome of submission.tests) {
      if (outcome.verdict !== 'OK') {
        console.error(`    ${outcome.name} not caught: ${outcome.message ?? outcome.verdict}`);
      }
    }
    continue;
  }

  // The unedited starter must not already catch everything.
  const starterRun = await gradeWriteTests(task, task.starter, runner);
  if (starterRun.verdict === 'OK') {
    failures += 1;
    console.error(`  FAIL ${task.id}: the unedited starter already catches every mutant`);
    continue;
  }

  console.log(
    `  ok   ${task.id}: ${task.mutants.length} mutants caught, ` +
      `starter correctly fails with ${starterRun.verdict}, ${elapsed} ms`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} python check(s) failed`);
  process.exit(1);
}

console.log('  all python references pass');
