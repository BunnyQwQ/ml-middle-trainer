import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { PythonTask } from '@/content/types';
import { runPython } from '@/engine/python/client';
import { gradePython } from '@/engine/python/grade';
import type { Submission } from '@/engine/grading/types';
import { useProgress } from '@/progress/store';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './NodePage';
import { VerdictPanel } from './VerdictPanel';

export function PythonTaskView({
  task,
  onResult,
}: {
  task: PythonTask;
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
      const result = await gradePython(task, code, (src, phases) => runPython(src, phases));
      setSubmission(result);
      onResult(result.verdict === 'OK');
      if (result.verdict === 'OK') setShowWriteup(true);
    } catch (err) {
      setSubmission({
        verdict: 'RE',
        tests: [],
        passed: 0,
        total: 2,
        engineError: err instanceof Error ? err.message : String(err),
        elapsedMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Para value={task.prompt} />

      <p className="faint" style={{ marginBottom: 2 }}>
        {task.signature}
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
        aria-label="Python"
      />

      <details style={{ marginTop: 8 }}>
        <summary className="muted" style={{ cursor: 'pointer' }}>
          {t(UI.verdict.onSample)}
        </summary>
        <pre className="codeblock">
          <code>{task.sampleTests}</code>
        </pre>
      </details>

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

      {showWriteup && (
        <>
          <h3 className="h2">{t(UI.node.writeup)}</h3>
          <Para value={task.writeup} />
          <p className="faint">{t(UI.node.referenceAnswer)}</p>
          <pre className="codeblock">
            <code>{task.reference}</code>
          </pre>
        </>
      )}
    </>
  );
}
