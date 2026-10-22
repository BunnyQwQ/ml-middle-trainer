import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { FindBugTask } from '@/content/types';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './TaskSwitch';

/** Pick the line, then read why it is the bug. */
export function FindBugTaskView({
  task,
  onResult,
}: {
  task: FindBugTask;
  onResult: TaskResultHandler;
}) {
  const { t } = useLang();
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const lines = task.code.split('\n');

  function submit() {
    if (picked === null) return;
    const ok = task.buggyLines.includes(picked);
    setAnswered(ok);
    onResult(ok);
  }

  return (
    <>
      <Para value={task.prompt} />

      <div className="codelines">
        {lines.map((line, i) => {
          const no = i + 1;
          const isBug = task.buggyLines.includes(no);
          let cls = 'codeline';
          if (answered !== null && isBug) cls += ' codeline--bug';
          else if (picked === no) cls += ' codeline--picked';
          return (
            <button
              type="button"
              className={cls}
              key={no}
              onClick={() => answered === null && setPicked(no)}
              disabled={answered !== null}
            >
              <span className="codeline__no">{no}</span>
              <span>{line || ' '}</span>
            </button>
          );
        })}
      </div>

      {answered === null ? (
        <button
          type="button"
          className="btn btn--primary"
          disabled={picked === null}
          onClick={submit}
        >
          {t(UI.node.submitAnswer)}
          {picked !== null && ` · ${picked}`}
        </button>
      ) : (
        <>
          <div className={`verdict verdict--${answered ? 'OK' : 'WA'}`}>
            {answered ? t(UI.node.correct) : t(UI.node.incorrect)}
            <span style={{ fontWeight: 400 }}>
              {' '}
              · {t(UI.verdict.expected)}: {task.buggyLines.join(', ')}
            </span>
          </div>
          <h3 className="h2">{t(UI.node.explanation)}</h3>
          <Para value={task.explanation} />
          {!answered && (
            <div className="row">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAnswered(null);
                  setPicked(null);
                }}
              >
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
