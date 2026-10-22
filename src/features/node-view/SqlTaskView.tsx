import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { getDataset } from '@/content/datasets';
import type { SqlTask } from '@/content/types';
import { gradeSql } from '@/engine/sql/grade';
import type { ResultSet, Submission } from '@/engine/grading/types';
import { useProgress } from '@/progress/store';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './TaskSwitch';
import { ResultTable, VerdictPanel } from './VerdictPanel';

export function SqlTaskView({ task, onResult }: { task: SqlTask; onResult: TaskResultHandler }) {
  const { t } = useLang();
  const draft = useProgress((s) => s.data.drafts[task.id]);
  const setDraft = useProgress((s) => s.setDraft);
  const solved = useProgress((s) => Boolean(s.data.nodes[nodeIdOf(task.id)]?.items[task.id]?.solved));

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [running, setRunning] = useState(false);
  const [showWriteup, setShowWriteup] = useState(false);
  const [preview, setPreview] = useState<Record<string, ResultSet> | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const code = draft ?? task.starter;
  const dataset = getDataset(task.dataset);

  async function check() {
    setRunning(true);
    setSubmission(null);
    try {
      // DuckDB is a few hundred kilobytes of wrapper plus a wasm payload, so it
      // is pulled in on the first check instead of on page load.
      const { runSqlQueries } = await import('@/engine/sql/duckdb');
      const result = await gradeSql(task, code, runSqlQueries);
      setSubmission(result);
      onResult(result.verdict === 'OK');
      if (result.verdict === 'OK') setShowWriteup(true);
    } catch (err) {
      setSubmission({
        verdict: 'RE',
        tests: [],
        passed: 0,
        total: 1,
        engineError: err instanceof Error ? err.message : String(err),
        elapsedMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }

  async function loadPreview() {
    setPreviewing(true);
    try {
      const { previewTables } = await import('@/engine/sql/duckdb');
      const tables = dataset.tables.map((tbl) => tbl.name);
      setPreview(await previewTables(dataset.setupSql(), tables, 5));
    } catch {
      setPreview({});
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <>
      <Para value={task.prompt} />

      <details>
        <summary className="muted" style={{ cursor: 'pointer' }}>
          {t(UI.node.schema)} · {t(dataset.title)}
        </summary>
        <div className="table-wrap">
          <table className="data">
            <tbody>
              {dataset.tables.map((tbl) => (
                <tr key={tbl.name}>
                  <th style={{ whiteSpace: 'nowrap' }}>{tbl.name}</th>
                  <td>
                    <div className="faint">{t(tbl.note)}</div>
                    <code>
                      {tbl.columns.map((c) => `${c.name} ${c.type}`).join(', ')}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview ? (
          Object.entries(preview).map(([name, result]) => (
            <div key={name}>
              <p className="faint" style={{ marginBottom: 2 }}>
                {name}
              </p>
              <ResultTable result={result} limit={5} />
            </div>
          ))
        ) : (
          <button type="button" className="btn btn--sm" onClick={loadPreview} disabled={previewing}>
            {previewing ? t(UI.common.loading) : t(UI.verdict.onSample)}
          </button>
        )}
      </details>

      <p className="faint" style={{ marginTop: 10 }}>
        {task.orderMatters ? t(UI.verdict.rowOrderMatters) : t(UI.verdict.rowOrderIgnored)} ·{' '}
        {t(UI.node.editorHint)}
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
        aria-label="SQL"
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

      {submission?.verdict === 'OK' && submission.sampleOutput && (
        <>
          <p className="faint">{t(UI.verdict.onSample)}</p>
          <ResultTable result={submission.sampleOutput} />
        </>
      )}

      {showWriteup && (
        <>
          <h3 className="h2">{t(UI.node.writeup)}</h3>
          <Para value={task.writeup} />
          <p className="faint">{t(UI.node.referenceAnswer)}</p>
          <pre className="codeblock">
            <code>{task.reference}</code>
          </pre>
          {task.clickhouse && (
            <>
              <h3 className="h2">{t(UI.node.clickhouseNote)}</h3>
              <pre className="codeblock">
                <code>{task.clickhouse.code}</code>
              </pre>
              <Para value={task.clickhouse.note} />
            </>
          )}
        </>
      )}

      {solved && !submission && (
        <p className="faint" style={{ color: 'var(--ok)' }}>
          OK
        </p>
      )}
    </>
  );
}

/** Task ids are prefixed with their node id, which saves threading it through. */
function nodeIdOf(taskId: string): string {
  const parts = taskId.split('.');
  return parts.slice(0, 2).join('.');
}
