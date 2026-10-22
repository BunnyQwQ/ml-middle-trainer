import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';
import { useProgress } from '@/progress/store';
import { formatClock, isExpired, limitMs, timeLeftMs } from '@/progress/contest';

/**
 * A boss is a contest: mixed tasks, one clock, and a result that is kept.
 * The clock is read from the stored start time rather than counted in state,
 * so a reload, a language switch or a closed tab cannot buy extra minutes.
 * When the time runs out the run closes itself and the tasks stay open as
 * ordinary practice — the contest result just stops changing.
 */
export function ContestPanel({ node }: { node: SkillNode }) {
  const { t } = useLang();
  const minutes = node.contest?.minutes ?? 0;
  const data = useProgress((s) => s.data);
  const startContest = useProgress((s) => s.startContest);
  const finishContest = useProgress((s) => s.finishContest);

  const slot = data.contests[node.id] ?? { current: null, best: null };
  const run = slot.current;

  // Re-render once a second while the clock runs; nothing else needs a timer.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);

  /** Tasks solved since this run began — an earlier solve does not count. */
  const solvedInRun = useMemo(() => {
    if (!run) return 0;
    const items = data.nodes[node.id]?.items ?? {};
    return node.tasks.filter((task) => {
      const item = items[task.id];
      return Boolean(item?.solved) && item.lastAt >= run.startedAt;
    }).length;
  }, [data.nodes, node, run]);

  const expired = run ? isExpired(run, minutes, now) : false;

  useEffect(() => {
    if (run && expired) finishContest(node.id, solvedInRun, minutes);
  }, [run, expired, finishContest, node.id, solvedInRun, minutes]);

  if (!node.contest) return null;

  if (run && !expired) {
    const left = timeLeftMs(run, minutes, now);
    const tight = left < limitMs(minutes) * 0.2;
    return (
      <div className="card contest contest--live">
        <div className="row">
          <strong className={tight ? 'contest__clock contest__clock--tight' : 'contest__clock'}>
            {formatClock(left)}
          </strong>
          <span className="pill">
            {solvedInRun} {t(UI.common.of)} {node.tasks.length}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => finishContest(node.id, solvedInRun, minutes)}
          >
            {t(UI.contest.submit)}
          </button>
        </div>
        <p className="faint" style={{ marginBottom: 0 }}>
          {t(UI.contest.liveHint)}
        </p>
      </div>
    );
  }

  const best = slot.best;

  return (
    <div className="card contest">
      <div className="row">
        <strong>{t(UI.contest.title)}</strong>
        <span className="pill">
          {minutes} {t(UI.contest.minutes)}
        </span>
        <span className="pill">
          {node.tasks.length} {t(UI.contest.tasks)}
        </span>
        {best && (
          <span
            className="pill"
            style={
              best.passed
                ? { color: 'var(--ok)', borderColor: 'var(--ok)' }
                : { color: 'var(--warn)', borderColor: 'var(--warn)' }
            }
          >
            {t(UI.contest.best)}: {best.solved}/{best.total} · {formatClock(best.elapsedMs)}
          </span>
        )}
      </div>

      <p>{t(best ? UI.contest.againHint : UI.contest.rules)}</p>

      {best && !best.passed && (
        <p className="faint">{t(UI.contest.partialHint)}</p>
      )}

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => startContest(node.id, node.tasks.length)}
      >
        {t(best ? UI.contest.restart : UI.contest.start)}
      </button>
      <p className="faint" style={{ marginBottom: 0 }}>
        {t(
          l(
            'Без запуска часов задачи тоже решаются — просто это не будет попыткой на время.',
            'The tasks can be solved without starting the clock — it just will not count as a timed attempt.',
          ),
        )}
      </p>
    </div>
  );
}
