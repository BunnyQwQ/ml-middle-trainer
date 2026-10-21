import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCHES } from '@/content/branches';
import { NODES, branchStats, nodesDone, totalStars, weakSpots } from '@/content/graph';
import { levelFor, useProgress } from '@/progress/store';
import { dueCards } from '@/progress/srs';
import { Stars } from '@/ui/controls';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const { level, into, need } = levelFor(data.xp);
  const stars = totalStars(data);
  const weak = weakSpots(data);
  const due = dueCards(data.srs, Date.now()).length;

  return (
    <>
      <h1 className="h1">{t(UI.dashboard.title)}</h1>

      <div className="statgrid">
        <div className="readout">
          <span className="readout__label">{t(UI.dashboard.level)}</span>
          <span className="readout__value">{level}</span>
          <div className="xpbar">
            <div className="xpbar__fill" style={{ width: `${(into / need) * 100}%` }} />
          </div>
          <span className="faint">
            {into} / {need} {t(UI.dashboard.xp)}
          </span>
        </div>
        <div className="readout">
          <span className="readout__label">{t(UI.dashboard.xp)}</span>
          <span className="readout__value">{data.xp}</span>
        </div>
        <div className="readout">
          <span className="readout__label">{t(UI.dashboard.streak)}</span>
          <span className="readout__value">
            {data.streak.current} {t(UI.dashboard.days)}
          </span>
          <span className="faint">best {data.streak.best}</span>
        </div>
        <div className="readout">
          <span className="readout__label">{t(UI.dashboard.stars)}</span>
          <span className="readout__value">
            {stars.stars}/{stars.max}
          </span>
        </div>
        <div className="readout">
          <span className="readout__label">{t(UI.dashboard.nodesDone)}</span>
          <span className="readout__value">
            {nodesDone(data)}/{NODES.length}
          </span>
        </div>
        <div className="readout">
          <span className="readout__label">{t(UI.review.dueToday)}</span>
          <span className="readout__value">{due}</span>
        </div>
      </div>

      <h2 className="h2">{t(UI.dashboard.byBranch)}</h2>
      {BRANCHES.filter((b) => b.status === 'ready').map((branch) => {
        const s = branchStats(data, branch.id);
        return (
          <div className="row" key={branch.id} style={{ padding: '6px 0' }}>
            <span className="branch__dot" style={{ background: branch.accent }} />
            <span style={{ minWidth: 180 }}>{t(branch.title)}</span>
            <span className="meter">
              <span
                className="meter__fill"
                style={{
                  width: `${s.maxStars ? (s.stars / s.maxStars) * 100 : 0}%`,
                  background: branch.accent,
                }}
              />
            </span>
            <span className="faint">
              {s.done}/{s.total} · {s.stars}/{s.maxStars} ★
            </span>
          </div>
        );
      })}

      <h2 className="h2">{t(UI.dashboard.weakSpots)}</h2>
      <p className="faint" style={{ marginTop: -4 }}>
        {t(UI.dashboard.weakSpotsHint)}
      </p>
      {weak.length === 0 ? (
        <p className="muted">{t(UI.dashboard.weakSpotsEmpty)}</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t(UI.nav.map)}</th>
                <th className="num">{t(UI.dashboard.accuracy)}</th>
                <th className="num">{t(UI.dashboard.attempts)}</th>
                <th className="num">{t(UI.dashboard.stars)}</th>
              </tr>
            </thead>
            <tbody>
              {weak.map(({ node, accuracy, attempts }) => (
                <tr key={node.id}>
                  <td>
                    <Link to={`/node/${node.id}?tab=tasks`}>{t(node.title)}</Link>
                  </td>
                  <td className="num">{(accuracy * 100).toFixed(0)}%</td>
                  <td className="num">{attempts}</td>
                  <td className="num">
                    <Stars value={data.nodes[node.id]?.stars ?? 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
