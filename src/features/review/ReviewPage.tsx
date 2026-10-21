import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { getNode } from '@/content/graph';
import { useProgress } from '@/progress/store';
import { SRS_INTERVALS_DAYS, dueCards, nextDueAt } from '@/progress/srs';

/**
 * "Review today": every quiz question and task you got wrong comes back after
 * 1, 3, 7 and 14 days. Cards graduate out of the list once answered correctly
 * at the last interval.
 */
export function ReviewPage() {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const now = Date.now();
  const due = dueCards(data.srs, now);
  const upcoming = nextDueAt(data.srs);
  const total = Object.keys(data.srs).length;

  return (
    <>
      <h1 className="h1">{t(UI.review.title)}</h1>

      <div className="row">
        <span className="pill">
          {t(UI.review.dueToday)}: {due.length}
        </span>
        <span className="pill">
          {total} {t(UI.review.items)}
        </span>
        <span className="pill">{SRS_INTERVALS_DAYS.join(' / ')} d</span>
      </div>

      {due.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ marginTop: 0 }}>{t(UI.review.empty)}</p>
          <p className="faint" style={{ margin: 0 }}>
            {t(UI.review.emptyHint)}
          </p>
          {upcoming && upcoming > now && (
            <p className="faint">
              {t(UI.review.nextDue)}: {new Date(upcoming).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="nodegrid" style={{ marginTop: 16 }}>
          {due.map((card) => {
            const node = getNode(card.nodeId);
            return (
              <div className="nodecard" key={card.id}>
                <div className="nodecard__top">
                  <span className="pill">{card.kind}</span>
                  <span className="spacer" />
                  <span className="faint">
                    {card.stage}/{SRS_INTERVALS_DAYS.length}
                  </span>
                </div>
                <span className="nodecard__title">
                  {node ? t(node.title) : card.nodeId}
                </span>
                <span className="faint">
                  {t(UI.review.fromNode)}: {card.id}
                </span>
                {node && (
                  <Link
                    className="btn btn--sm"
                    to={`/node/${node.id}?tab=tasks&task=${encodeURIComponent(card.id)}`}
                  >
                    {t(UI.review.goToTask)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
