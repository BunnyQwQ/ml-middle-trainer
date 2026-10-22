import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { getNode, nodeItemCount } from '@/content/graph';
import type { Task } from '@/content/types';
import { useProgress } from '@/progress/store';
import { SRS_INTERVALS_DAYS, dueCards, nextDueAt, type SrsCard } from '@/progress/srs';
import type { SrsItemKind } from '@/progress/srs';
import { TaskSwitch } from '@/features/node-view/TaskSwitch';

type Queued = { card: SrsCard; task: Task; nodeTitle: string; nodeId: string };

/**
 * "Review today" is a session, not a list of links: the due task is rendered
 * right here, with the same editor and the same grading as in its lesson, and
 * the result feeds straight back into the schedule. A card you get right moves
 * one step along 1 -> 3 -> 7 -> 14 days; a card you get wrong drops back to
 * tomorrow. Skipping leaves the schedule untouched.
 */
export function ReviewPage() {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const recordAttempt = useProgress((s) => s.recordAttempt);

  const now = Date.now();
  const total = Object.keys(data.srs).length;
  const upcoming = nextDueAt(data.srs);

  // The queue is frozen when the session starts: grading a card changes its due
  // date, and a live list would reshuffle itself under the user's hands.
  const [queue, setQueue] = useState<Queued[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [tally, setTally] = useState({ correct: 0, wrong: 0, skipped: 0 });

  const dueNow = useMemo(() => buildQueue(dueCards(data.srs, now), t), [data.srs, now, t]);

  function start() {
    setQueue(dueNow);
    setIndex(0);
    setAnswered({});
    setTally({ correct: 0, wrong: 0, skipped: 0 });
  }

  const header = (
    <>
      <h1 className="h1">{t(UI.review.title)}</h1>
      <div className="row">
        <span className="pill">
          {t(UI.review.dueToday)}: {dueNow.length}
        </span>
        <span className="pill">
          {total} {t(UI.review.items)}
        </span>
        <span className="pill">{SRS_INTERVALS_DAYS.join(' / ')} d</span>
      </div>
    </>
  );

  if (dueNow.length === 0) {
    return (
      <>
        {header}
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ marginTop: 0 }}>{t(UI.review.empty)}</p>
          <p className="faint" style={{ margin: 0 }}>
            {t(UI.review.emptyHint)}
          </p>
          {upcoming !== null && upcoming > now && (
            <p className="faint">
              {t(UI.review.nextDue)}: {new Date(upcoming).toLocaleDateString()}
            </p>
          )}
        </div>
      </>
    );
  }

  if (queue === null) {
    return (
      <>
        {header}
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ marginTop: 0 }}>{t(UI.review.sessionIntro)}</p>
          <ul className="faint" style={{ marginTop: 0 }}>
            {dueNow.slice(0, 8).map((q) => (
              <li key={q.card.id}>
                {q.nodeTitle} · {q.card.kind} · {q.card.stage}/{SRS_INTERVALS_DAYS.length}
              </li>
            ))}
            {dueNow.length > 8 && <li>…</li>}
          </ul>
          <button type="button" className="btn btn--primary" onClick={start}>
            {t(UI.review.startSession)} ({dueNow.length})
          </button>
        </div>
      </>
    );
  }

  if (index >= queue.length) {
    const left = dueCards(data.srs, now).length;
    return (
      <>
        {header}
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="h2" style={{ marginTop: 0 }}>
            {t(UI.review.sessionDone)}
          </h2>
          <div className="row">
            <span className="pill" style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}>
              {t(UI.review.gotRight)}: {tally.correct}
            </span>
            <span className="pill" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}>
              {t(UI.review.gotWrong)}: {tally.wrong}
            </span>
            <span className="pill">
              {t(UI.review.skipped)}: {tally.skipped}
            </span>
          </div>
          <p className="faint">
            {t(UI.review.stillDue)}: {left}
          </p>
          {left > 0 && (
            <button type="button" className="btn" onClick={start}>
              {t(UI.review.againRound)}
            </button>
          )}
        </div>
      </>
    );
  }

  const current = queue[index];
  const isAnswered = answered[current.card.id] !== undefined;

  function handleResult(correct: boolean) {
    const card = current.card;
    const node = getNode(card.nodeId);
    recordAttempt({
      nodeId: card.nodeId,
      itemId: card.id,
      kind: current.task.kind as SrsItemKind,
      correct,
      nodeItemCount: node ? nodeItemCount(node) : 1,
    });
    // Only the first attempt on a card counts towards the session tally; the
    // schedule itself keeps following every attempt.
    setAnswered((prev) => (card.id in prev ? prev : { ...prev, [card.id]: correct }));
    setTally((prev) =>
      card.id in answered
        ? prev
        : correct
          ? { ...prev, correct: prev.correct + 1 }
          : { ...prev, wrong: prev.wrong + 1 },
    );
  }

  function next() {
    setIndex((i) => i + 1);
  }

  function skip() {
    setTally((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    next();
  }

  return (
    <>
      {header}

      <div className="row" style={{ marginTop: 16 }}>
        <span className="pill">
          {index + 1} {t(UI.common.of)} {queue.length}
        </span>
        <span className="pill">{current.card.kind}</span>
        <span className="pill">
          {t(UI.review.stage)} {current.card.stage}/{SRS_INTERVALS_DAYS.length}
        </span>
        {current.card.lapses > 1 && (
          <span className="pill" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}>
            {t(UI.review.lapses)}: {current.card.lapses}
          </span>
        )}
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>{current.nodeTitle}</strong>
          <span className="spacer" />
          <Link className="btn btn--sm" to={`/node/${current.nodeId}`}>
            {t(UI.review.openTheory)}
          </Link>
        </div>

        {/* Remounting on the card id keeps one card's editor state out of the next. */}
        <TaskSwitch key={current.card.id} task={current.task} onResult={handleResult} />

        <div className="row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className={isAnswered ? 'btn btn--primary' : 'btn'}
            onClick={next}
          >
            {index + 1 === queue.length ? t(UI.review.finish) : t(UI.review.nextCard)}
          </button>
          {!isAnswered && (
            <button type="button" className="btn btn--sm" onClick={skip}>
              {t(UI.review.skip)}
            </button>
          )}
          {isAnswered && (
            <span className="faint">
              {answered[current.card.id] ? t(UI.review.movedOn) : t(UI.review.backTomorrow)}
            </span>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * A card only carries ids, so the task itself is looked up here. Cards whose
 * task no longer exists (content renamed between sessions) are dropped rather
 * than rendered as an error.
 */
function buildQueue(cards: SrsCard[], t: (value: { ru: string; en: string }) => string): Queued[] {
  const out: Queued[] = [];
  for (const card of cards) {
    const node = getNode(card.nodeId);
    if (!node) continue;
    const task = node.tasks.find((item) => item.id === card.id);
    if (!task) continue;
    out.push({ card, task, nodeTitle: t(node.title), nodeId: node.id });
  }
  return out;
}
