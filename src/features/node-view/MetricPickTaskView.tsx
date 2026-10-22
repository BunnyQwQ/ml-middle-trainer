import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { l } from '@/i18n/types';
import type { MetricPickTask, MetricSlot } from '@/content/types';
import { Para } from '@/ui/Theory';
import type { TaskResultHandler } from './TaskSwitch';

/**
 * The metric choice trainer. One pool of metrics, three slots: the offline
 * metric you iterate on, the online metric the decision is made by, and the
 * guardrails that must not move in the wrong direction.
 *
 * Several metrics can be defensible for a slot, so grading accepts any of the
 * options marked for it rather than one blessed answer.
 */

const SLOT_TITLES: Record<MetricSlot, { title: ReturnType<typeof l>; hint: ReturnType<typeof l> }> = {
  offline: {
    title: l('Оффлайн-метрика', 'Offline metric'),
    hint: l(
      'Считается на разметке или логах без выкатки. По ней итерируются модели.',
      'Computed on labels or logs without shipping. Models are iterated on it.',
    ),
  },
  online: {
    title: l('Онлайн-метрика', 'Online metric'),
    hint: l(
      'По ней принимается решение в эксперименте. Одна, выбранная заранее.',
      'The experiment decision is made on it. One metric, chosen in advance.',
    ),
  },
  guardrail: {
    title: l('Guardrail-метрики', 'Guardrail metrics'),
    hint: l(
      'Не должны ухудшиться. Ловят вред, которого основная метрика не видит.',
      'Must not degrade. They catch harm the primary metric cannot see.',
    ),
  },
};

export function MetricPickTaskView({
  task,
  onResult,
}: {
  task: MetricPickTask;
  onResult: TaskResultHandler;
}) {
  const { t } = useLang();
  const [offline, setOffline] = useState<string | null>(null);
  const [online, setOnline] = useState<string | null>(null);
  const [guardrails, setGuardrails] = useState<string[]>([]);
  const [answered, setAnswered] = useState<null | boolean>(null);

  const byId = new Map(task.options.map((o) => [o.id, o]));
  const fits = (id: string | null, slot: MetricSlot) =>
    Boolean(id && byId.get(id)?.correctFor.includes(slot));

  const ready =
    offline !== null && online !== null && guardrails.length === task.guardrailCount;

  function toggleGuardrail(id: string) {
    if (answered !== null) return;
    setGuardrails((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= task.guardrailCount) return prev;
      return [...prev, id];
    });
  }

  function submit() {
    const ok =
      fits(offline, 'offline') &&
      fits(online, 'online') &&
      guardrails.every((id) => fits(id, 'guardrail'));
    setAnswered(ok);
    onResult(ok);
  }

  function reset() {
    setAnswered(null);
    setOffline(null);
    setOnline(null);
    setGuardrails([]);
  }

  const slotState = (slot: MetricSlot): 'ok' | 'bad' =>
    slot === 'guardrail'
      ? guardrails.every((id) => fits(id, 'guardrail'))
        ? 'ok'
        : 'bad'
      : fits(slot === 'offline' ? offline : online, slot)
        ? 'ok'
        : 'bad';

  return (
    <>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="pill">{t(task.area)}</span>
      </div>
      <Para value={task.scenario} />

      <div className="metricslots">
        {(['offline', 'online', 'guardrail'] as MetricSlot[]).map((slot) => (
          <section className="metricslot" key={slot}>
            <h4 className="metricslot__title">
              {t(SLOT_TITLES[slot].title)}
              {slot === 'guardrail' && (
                <span className="faint">
                  {' '}
                  {guardrails.length}/{task.guardrailCount}
                </span>
              )}
              {answered !== null && (
                <span
                  className="pill"
                  style={{
                    marginLeft: 'auto',
                    color: slotState(slot) === 'ok' ? 'var(--ok)' : 'var(--bad)',
                    borderColor: slotState(slot) === 'ok' ? 'var(--ok)' : 'var(--bad)',
                  }}
                >
                  {slotState(slot) === 'ok' ? t(UI.node.correct) : t(UI.node.incorrect)}
                </span>
              )}
            </h4>
            <p className="faint" style={{ margin: '0 0 8px' }}>
              {t(SLOT_TITLES[slot].hint)}
            </p>
            <div className="choices">
              {task.options.map((option) => {
                const picked =
                  slot === 'guardrail'
                    ? guardrails.includes(option.id)
                    : (slot === 'offline' ? offline : online) === option.id;
                const good = option.correctFor.includes(slot);
                let cls = 'choice choice--compact';
                if (answered !== null) {
                  if (good) cls += ' choice--correct';
                  else if (picked) cls += ' choice--wrong';
                }
                return (
                  <label className={cls} key={`${slot}-${option.id}`}>
                    <input
                      type={slot === 'guardrail' ? 'checkbox' : 'radio'}
                      name={`${task.id}-${slot}`}
                      checked={picked}
                      disabled={answered !== null}
                      onChange={() => {
                        if (answered !== null) return;
                        if (slot === 'guardrail') toggleGuardrail(option.id);
                        else if (slot === 'offline') setOffline(option.id);
                        else setOnline(option.id);
                      }}
                    />
                    <span>{t(option.label)}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {answered === null ? (
        <button type="button" className="btn btn--primary" disabled={!ready} onClick={submit}>
          {t(UI.node.submitAnswer)}
        </button>
      ) : (
        <>
          <div className={`verdict verdict--${answered ? 'OK' : 'WA'}`}>
            {answered ? t(UI.node.correct) : t(UI.node.incorrect)}
          </div>

          <h3 className="h2">{t(UI.node.metricsBreakdown)}</h3>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {task.options.map((option) => (
                  <tr key={option.id}>
                    <th style={{ whiteSpace: 'nowrap' }}>{t(option.label)}</th>
                    <td>
                      <div className="row" style={{ gap: 4, marginBottom: 4 }}>
                        {option.correctFor.length === 0 ? (
                          <span className="pill" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}>
                            {t(UI.node.metricNotHere)}
                          </span>
                        ) : (
                          option.correctFor.map((slot) => (
                            <span
                              className="pill"
                              key={slot}
                              style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}
                            >
                              {t(SLOT_TITLES[slot].title)}
                            </span>
                          ))
                        )}
                      </div>
                      {t(option.note)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="h2">{t(UI.node.writeup)}</h3>
          <Para value={task.writeup} />

          {!answered && (
            <div className="row">
              <button type="button" className="btn" onClick={reset}>
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
