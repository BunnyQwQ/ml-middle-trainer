import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { QuizTask } from '@/content/types';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './NodePage';

/** Single choice, multiple choice and numeric answer in one component. */
export function QuizTaskView({
  task,
  onResult,
}: {
  task: QuizTask;
  onResult: TaskResultHandler;
}) {
  const { t } = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const [numberInput, setNumberInput] = useState('');
  const [answered, setAnswered] = useState<null | boolean>(null);

  const correctIds = task.correct ?? [];

  function toggle(id: string) {
    if (answered !== null) return;
    setPicked((prev) => {
      if (task.mode === 'single') return [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }

  function evaluate(): boolean {
    if (task.mode === 'number') {
      const value = Number(numberInput.replace(',', '.').trim());
      if (!Number.isFinite(value)) return false;
      const tol = task.tolerance ?? 1e-9;
      return Math.abs(value - (task.value ?? NaN)) <= tol;
    }
    if (picked.length !== correctIds.length) return false;
    return correctIds.every((id) => picked.includes(id));
  }

  function submit() {
    const ok = evaluate();
    setAnswered(ok);
    onResult(ok);
  }

  function retry() {
    setAnswered(null);
    setPicked([]);
    setNumberInput('');
  }

  const canSubmit =
    answered === null && (task.mode === 'number' ? numberInput.trim().length > 0 : picked.length > 0);

  return (
    <>
      <Para value={task.prompt} />

      {task.mode === 'number' ? (
        <div className="row">
          <input
            className="editor"
            style={{ minHeight: 42, maxWidth: 220, whiteSpace: 'normal' }}
            inputMode="decimal"
            value={numberInput}
            disabled={answered !== null}
            placeholder={t(UI.node.numberHint)}
            onChange={(e) => setNumberInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) submit();
            }}
            aria-label={t(UI.node.yourAnswer)}
          />
          {task.unit && <span className="muted">{t(task.unit)}</span>}
        </div>
      ) : (
        <>
          {task.mode === 'multi' && <p className="faint">{t(UI.node.multiHint)}</p>}
          <div className="choices">
            {(task.choices ?? []).map((choice) => {
              const isPicked = picked.includes(choice.id);
              const isCorrect = correctIds.includes(choice.id);
              let cls = 'choice';
              if (answered !== null) {
                if (isCorrect) cls += ' choice--correct';
                else if (isPicked) cls += ' choice--wrong';
              }
              return (
                <label className={cls} key={choice.id}>
                  <input
                    type={task.mode === 'single' ? 'radio' : 'checkbox'}
                    name={task.id}
                    checked={isPicked}
                    disabled={answered !== null}
                    onChange={() => toggle(choice.id)}
                  />
                  <span>{t(choice.text)}</span>
                </label>
              );
            })}
          </div>
        </>
      )}

      {answered === null ? (
        <button type="button" className="btn btn--primary" disabled={!canSubmit} onClick={submit}>
          {t(UI.node.submitAnswer)}
        </button>
      ) : (
        <>
          <div className={`verdict verdict--${answered ? 'OK' : 'WA'}`}>
            {answered ? t(UI.node.correct) : t(UI.node.incorrect)}
            {!answered && task.mode === 'number' && task.value !== undefined && (
              <span style={{ fontWeight: 400 }}>
                {' '}
                · {t(UI.verdict.expected)}: {task.value}
              </span>
            )}
          </div>
          <h3 className="h2" style={{ marginTop: 10 }}>
            {t(UI.node.explanation)}
          </h3>
          <Para value={task.explanation} />
          {!answered && (
            <div className="row">
              <button type="button" className="btn" onClick={retry}>
                {t(UI.node.reset)}
              </button>
              <span className="faint">{t(UI.node.scheduledRepeat)}</span>
            </div>
          )}
        </>
      )}
    </>
  );
}
