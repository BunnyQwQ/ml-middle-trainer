import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { WriteTestsTask } from '@/content/types';
import { runPython } from '@/engine/python/client';
import { gradeWriteTests } from '@/engine/python/grade';
import type { Submission } from '@/engine/grading/types';
import { useProgress } from '@/progress/store';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './TaskSwitch';
import { VerdictPanel } from './VerdictPanel';

/**
 * The user writes the test suite, and the grader does the only thing that can
 * judge one: runs it against the correct implementation and against a set of
 * broken ones. A suite that passes everything catches nothing.
 */
export function WriteTestsTaskView({
  task,
  onResult,
}: {
  task: WriteTestsTask;
  onResult: TaskResultHandler;
}) {
  const { t } = useLang();
  const draft = useProgress((s) => s.data.drafts[task.id]);
  const setDraft = useProgress((s) => s.setDraft);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [running, setRunning] = useState(false);
  const [showWriteup, setShowWriteup] = useState(false);

  const code = draft ?? task.starter;

  async function check() {
    setRunning(true);
    setSubmission(null);
    try {
      const result = await gradeWriteTests(task, code, (src, phases, packages) =>
        runPython(src, phases, undefined, packages),
      );
      setSubmission(result);
      onResult(result.verdict === 'OK');
      if (result.verdict === 'OK') setShowWriteup(true);
    } catch (err) {
      setSubmission({
        verdict: 'RE',
        tests: [],
        passed: 0,
        total: 1 + task.mutants.length,
        engineError: err instanceof Error ? err.message : String(err),
        elapsedMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }

  const outcomeOf = (id: string) => submission?.tests.find((x) => x.name === id)?.verdict;

  return (
    <>
      <Para value={task.prompt} />

      <details>
        <summary className="muted" style={{ cursor: 'pointer' }}>
          {t(UI.node.codeUnderTest)}
        </summary>
        <pre className="codeblock">
          <code>{task.reference}</code>
        </pre>
      </details>

      <p className="faint" style={{ marginTop: 10 }}>
        {t(UI.node.mutantsHint)} · {task.mutants.length}
      </p>

      <textarea
        className="editor"
        spellCheck={false}
        value={code}
        onChange={(e) => setDraft(task.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (!running) void check();
          }
        }}
        aria-label="Python tests"
      />

      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn--primary" onClick={check} disabled={running}>
          {running ? t(UI.node.checking) : t(UI.node.check)}
        </button>
        <button type="button" className="btn" onClick={() => setDraft(task.id, task.starter)}>
          {t(UI.node.reset)}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setShowWriteup((v) => !v)}>
          {showWriteup ? t(UI.node.hideSolution) : t(UI.node.showSolution)}
        </button>
        {running && <span className="faint">{t(UI.verdict.engineLoading)}</span>}
      </div>

      {submission && <VerdictPanel submission={submission} />}

      {submission && submission.tests.length > 1 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t(UI.node.mutant)}</th>
                <th>{t(UI.node.mutantCaught)}</th>
              </tr>
            </thead>
            <tbody>
              {task.mutants.map((mutant) => {
                const verdict = outcomeOf(mutant.id);
                const caught = verdict === 'OK';
                return (
                  <tr key={mutant.id}>
                    <td>{t(mutant.label)}</td>
                    <td style={{ color: caught ? 'var(--ok)' : 'var(--bad)' }}>
                      {caught ? t(UI.node.caught) : t(UI.node.survived)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showWriteup && (
        <>
          <h3 className="h2">{t(UI.node.writeup)}</h3>
          <Para value={task.writeup} />
          <p className="faint">{t(UI.node.referenceAnswer)}</p>
          <pre className="codeblock">
            <code>{task.referenceTests}</code>
          </pre>
          <h3 className="h2">{t(UI.node.mutantsList)}</h3>
          {task.mutants.map((mutant) => (
            <div key={mutant.id}>
              <p className="faint" style={{ marginBottom: 2 }}>
                {t(mutant.label)}
              </p>
              <pre className="codeblock">
                <code>{mutant.code}</code>
              </pre>
            </div>
          ))}
        </>
      )}
    </>
  );
}
