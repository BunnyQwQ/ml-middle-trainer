import type { PythonTask, WriteTestsTask } from '@/content/types';
import type { Submission, TestOutcome, Verdict } from '../grading/types';

/**
 * Grading for Python tasks. The runner is injected so the exact same logic
 * runs in the browser (worker + Pyodide) and in CI (Node + Pyodide), which is
 * what makes "the reference solution passes its own tests" a meaningful claim.
 */
export type PyRunner = (
  code: string,
  phases: Array<{ name: string; source: string }>,
  packages?: string[],
) => Promise<{
  phases: Array<{ name: string; ok: boolean; error?: string; isAssertion?: boolean }>;
  stdout: string;
  userError?: string;
}>;

export function isPyTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === 'PyTimeout' || /time limit/i.test(err.message));
}

export async function gradePython(
  task: PythonTask,
  userCode: string,
  runner: PyRunner,
): Promise<Submission> {
  const started = Date.now();

  if (userCode.trim().length === 0) {
    return {
      verdict: 'RE',
      tests: [],
      passed: 0,
      total: 2,
      engineError: 'empty submission',
      elapsedMs: 0,
    };
  }

  const phases = [
    { name: 'sample', source: task.sampleTests },
    { name: 'hidden', source: task.tests },
  ];
  // A preamble builds whatever the task hands the user: frames, fixtures, imports.
  const source = task.preamble ? `${task.preamble}
${userCode}` : userCode;

  let run: Awaited<ReturnType<PyRunner>>;
  try {
    run = await runner(source, phases, task.packages);
  } catch (err) {
    const timedOut = isPyTimeout(err);
    return {
      verdict: timedOut ? 'TL' : 'RE',
      tests: [{ name: 'run', hidden: false, verdict: timedOut ? 'TL' : 'RE' }],
      passed: 0,
      total: phases.length,
      engineError: timedOut ? undefined : err instanceof Error ? err.message : String(err),
      elapsedMs: Date.now() - started,
    };
  }

  if (run.userError) {
    return {
      verdict: 'RE',
      tests: [{ name: 'module', hidden: false, verdict: 'RE', message: run.userError }],
      passed: 0,
      total: phases.length,
      stdout: run.stdout,
      elapsedMs: Date.now() - started,
    };
  }

  const tests: TestOutcome[] = run.phases.map((p) => ({
    name: p.name,
    hidden: p.name === 'hidden',
    verdict: p.ok ? 'OK' : p.isAssertion ? 'WA' : 'RE',
    // A failed assertion in a hidden test shows the message but not the data:
    // the assert lines themselves carry no dataset, only the contract.
    message: p.ok ? undefined : p.error,
  }));

  const passed = tests.filter((t) => t.verdict === 'OK').length;
  const failing = tests.find((t) => t.verdict !== 'OK');
  const verdict: Verdict = failing ? failing.verdict : 'OK';

  return {
    verdict,
    tests,
    passed,
    total: phases.length,
    stdout: run.stdout,
    elapsedMs: Date.now() - started,
  };
}


/* ------------------------------------------------------- writing the tests -- */

/**
 * Grading a test suite. There is only one honest way to do it: the suite has
 * to accept the correct implementation and reject every broken one. A suite
 * that passes everything proves nothing, and the mutants are what say so.
 */
export async function gradeWriteTests(
  task: WriteTestsTask,
  userTests: string,
  runner: PyRunner,
): Promise<Submission> {
  const started = Date.now();
  const total = 1 + task.mutants.length;

  if (userTests.trim().length === 0) {
    return {
      verdict: 'RE',
      tests: [],
      passed: 0,
      total,
      engineError: 'empty submission',
      elapsedMs: 0,
    };
  }

  const outcomes: TestOutcome[] = [];
  const runAgainst = async (code: string) =>
    runner(code, [{ name: 'tests', source: userTests }]);

  // 1. The suite must pass on the correct implementation.
  let onReference: Awaited<ReturnType<PyRunner>>;
  try {
    onReference = await runAgainst(task.reference);
  } catch (err) {
    const timedOut = isPyTimeout(err);
    return {
      verdict: timedOut ? 'TL' : 'RE',
      tests: [{ name: 'reference', hidden: false, verdict: timedOut ? 'TL' : 'RE' }],
      passed: 0,
      total,
      engineError: timedOut ? undefined : err instanceof Error ? err.message : String(err),
      elapsedMs: Date.now() - started,
    };
  }

  if (onReference.userError) {
    return {
      verdict: 'RE',
      tests: [{ name: 'reference', hidden: false, verdict: 'RE', message: onReference.userError }],
      passed: 0,
      total,
      elapsedMs: Date.now() - started,
    };
  }

  const refPhase = onReference.phases[0];
  if (!refPhase || !refPhase.ok) {
    return {
      verdict: refPhase?.isAssertion ? 'WA' : 'RE',
      tests: [
        {
          name: 'reference',
          hidden: false,
          verdict: refPhase?.isAssertion ? 'WA' : 'RE',
          message: refPhase?.error,
        },
      ],
      passed: 0,
      total,
      stdout: onReference.stdout,
      elapsedMs: Date.now() - started,
    };
  }
  outcomes.push({ name: 'reference', hidden: false, verdict: 'OK' });

  // 2. Every mutant must be caught: the suite has to fail on it.
  let survivors = 0;
  for (const mutant of task.mutants) {
    let run: Awaited<ReturnType<PyRunner>>;
    try {
      run = await runAgainst(mutant.code);
    } catch (err) {
      outcomes.push({
        name: mutant.id,
        hidden: false,
        verdict: isPyTimeout(err) ? 'TL' : 'RE',
      });
      survivors += 1;
      continue;
    }
    const phase = run.phases[0];
    // A mutant that crashes the suite still counts as caught: the suite noticed.
    const caught = Boolean(run.userError) || !phase || !phase.ok;
    if (caught) {
      outcomes.push({ name: mutant.id, hidden: false, verdict: 'OK' });
    } else {
      survivors += 1;
      outcomes.push({ name: mutant.id, hidden: false, verdict: 'WA' });
    }
  }

  return {
    verdict: survivors === 0 ? 'OK' : 'WA',
    tests: outcomes,
    passed: outcomes.filter((o) => o.verdict === 'OK').length,
    total,
    stdout: onReference.stdout,
    elapsedMs: Date.now() - started,
  };
}
