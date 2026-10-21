import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { CaseTask } from '@/content/types';
import { useProgress } from '@/progress/store';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './NodePage';

/**
 * Open-answer case: the answer is written first, and only then does the
 * reference appear, together with a checklist to grade yourself against.
 * Revealing before answering is possible, but then the answer box locks —
 * self-honesty is the only thing that makes this task type work.
 */
export function CaseTaskView({ task, onResult }: { task: CaseTask; onResult: TaskResultHandler }) {
  const { t } = useLang();
  const answer = useProgress((s) => s.data.answers[task.id] ?? '');
  const setAnswer = useProgress((s) => s.setAnswer);
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  function reveal() {
    setRevealed(true);
    onResult(true);
  }

  const hits = Object.values(checked).filter(Boolean).length;

  return (
    <>
      <Para value={task.prompt} />

      <textarea
        className="editor"
        style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--sans)', minHeight: 220 }}
        value={answer}
        disabled={revealed}
        placeholder={t(UI.node.yourAnswer)}
        onChange={(e) => setAnswer(task.id, e.target.value)}
        aria-label={t(UI.node.yourAnswer)}
      />

      <div className="row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={reveal}
          disabled={revealed || wordCount < 20}
        >
          {t(UI.node.showSolution)}
        </button>
        <span className="faint">{wordCount} words</span>
      </div>

      {revealed && (
        <>
          <h3 className="h2">{t(UI.node.referenceAnswer)}</h3>
          <Para value={task.reference} />

          <h3 className="h2">
            {t(UI.node.checklist)} · {hits}/{task.checklist.length}
          </h3>
          <ul className="checklist">
            {task.checklist.map((item, i) => (
              <li key={i}>
                <input
                  type="checkbox"
                  checked={Boolean(checked[i])}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                  id={`${task.id}-chk-${i}`}
                />
                <label htmlFor={`${task.id}-chk-${i}`}>{t(item)}</label>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
