import type { PythonTask } from '@/content/types';
import type { Submission, TestOutcome, Verdict } from '../grading/types';

/**
 * Grading for Python tasks. The runner is injected so the exact same logic
 * runs in the browser (worker + Pyodide) and in CI (Node + Pyodide), which is
 * what makes "the reference solution passes its own tests" a meaningful claim.
 */
export type PyRunner = (
  code: string,
  phases: Array<{ name: string; source: string }>,
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

  let run: Awaited<ReturnType<PyRunner>>;
  try {
    run = await runner(userCode, phases);
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
