import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { formatCell } from '@/engine/grading/compare';
import type { ResultSet, Submission } from '@/engine/grading/types';

export function VerdictPanel({ submission }: { submission: Submission }) {
  const { t } = useLang();
  const v = submission.verdict;

  return (
    <>
      <div className={`verdict verdict--${v}`}>
        <span>{t(UI.verdict[v])}</span>
        <span className="spacer" />
        <span style={{ fontWeight: 400, fontSize: 13 }}>
          {t(UI.verdict.passedTests)}: {submission.passed}/{submission.total}
          {submission.elapsedMs > 0 && ` · ${(submission.elapsedMs / 1000).toFixed(1)}s`}
        </span>
      </div>

      {submission.engineError && (
        <pre className="codeblock" style={{ color: 'var(--bad)' }}>
          {submission.engineError}
        </pre>
      )}

      {submission.tests.length > 0 && (
        <div className="row" style={{ gap: 6 }}>
          {submission.tests.map((test) => (
            <span
              className="pill"
              key={test.name}
              style={{
                color: test.verdict === 'OK' ? 'var(--ok)' : 'var(--bad)',
                borderColor: test.verdict === 'OK' ? 'var(--ok)' : 'var(--bad)',
              }}
            >
              {test.hidden ? t(UI.verdict.onHidden) : t(UI.verdict.onSample)}
              {test.name !== 'sample' && test.name !== 'hidden' ? ` ${test.name}` : ''} ·{' '}
              {test.verdict}
            </span>
          ))}
        </div>
      )}

      {submission.tests.map((test) =>
        test.message ? (
          <pre className="codeblock" key={`${test.name}-msg`} style={{ color: 'var(--warn)' }}>
            {test.message}
          </pre>
        ) : null,
      )}

      {submission.stdout && submission.stdout.trim().length > 0 && (
        <>
          <p className="faint" style={{ marginBottom: 4 }}>
            stdout
          </p>
          <pre className="codeblock">{submission.stdout}</pre>
        </>
      )}

      {submission.tests.some((tst) => tst.diff?.kind === 'rows' || tst.diff?.kind === 'columns') && (
        <p className="faint">
          {submission.tests
            .map((tst) => {
              if (tst.diff?.kind === 'rows') {
                return `${t(UI.verdict.expected)} ${tst.diff.expected} rows, ${t(UI.verdict.got)} ${tst.diff.actual}`;
              }
              if (tst.diff?.kind === 'columns') {
                return `${t(UI.verdict.expected)} ${tst.diff.expected} columns, ${t(UI.verdict.got)} ${tst.diff.actual}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('; ')}
        </p>
      )}

      {submission.verdict === 'WA' && submission.sampleExpected && submission.sampleOutput && (
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <p className="faint">{t(UI.verdict.expected)}</p>
            <ResultTable result={submission.sampleExpected} />
          </div>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <p className="faint">{t(UI.verdict.got)}</p>
            <ResultTable result={submission.sampleOutput} />
          </div>
        </div>
      )}
    </>
  );
}

export function ResultTable({ result, limit = 12 }: { result: ResultSet; limit?: number }) {
  const rows = result.rows.slice(0, limit);
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {result.columns.map((c) => (
              <th key={c} className="num">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="num">
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length > limit && (
        <p className="faint">… {result.rows.length - limit} more rows</p>
      )}
    </div>
  );
}
