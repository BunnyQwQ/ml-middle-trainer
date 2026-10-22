import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCH_BY_ID, BRANCHES } from '@/content/branches';
import { ACTS, NODES, isNodeDone, isUnlocked, nodeStars } from '@/content/graph';
import { useProgress } from '@/progress/store';

const COL = 170;
const ROW = 86;
const PAD = 26;
const R = 15;

/**
 * The spine, drawn. Rows run top to bottom in act order, bosses sit on rows of
 * their own spanning the whole width, and the edges show what feeds what —
 * including the cross-branch ones, which is the point of the picture.
 */
export function TreeMap() {
  const { t } = useLang();
  const navigate = useNavigate();
  const data = useProgress((s) => s.data);

  // Columns: every branch that has a non-boss node, in declared order.
  const columns = BRANCHES.filter(
    (b) => b.id !== 'boss' && NODES.some((n) => n.branch === b.id),
  ).map((b) => b.id);

  // Rows: inside an act, nodes stack by tier; the boss gets the row after them.
  const rowOf = new Map<string, number>();
  let row = 0;
  for (const act of ACTS) {
    const actNodes = NODES.filter((n) => n.act === act && !n.boss);
    const tiers = [...new Set(actNodes.map((n) => n.tier))].sort((a, b) => a - b);
    for (const tier of tiers) {
      for (const node of actNodes.filter((n) => n.tier === tier)) rowOf.set(node.id, row);
      row += 1;
    }
    const boss = NODES.find((n) => n.boss && n.act === act);
    if (boss) {
      rowOf.set(boss.id, row);
      row += 1;
    }
  }

  const width = PAD * 2 + columns.length * COL;
  const centreX = width / 2;
  const positioned = NODES.filter((n) => rowOf.has(n.id)).map((n) => ({
    node: n,
    x: n.boss ? centreX : PAD + columns.indexOf(n.branch) * COL + COL / 2,
    y: PAD + 24 + (rowOf.get(n.id) ?? 0) * ROW + R,
  }));
  const posById = new Map(positioned.map((p) => [p.node.id, p]));
  const height = PAD * 2 + 24 + row * ROW + R;

  return (
    <div className="treewrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: Math.max(width, 320), height, maxWidth: 'none' }}
        role="img"
        aria-label={t(UI.map.title)}
      >
        {columns.map((id, i) => (
          <text
            key={id}
            x={PAD + i * COL + COL / 2}
            y={PAD}
            textAnchor="middle"
            style={{ fontSize: 11, fontWeight: 600 }}
            fill={BRANCH_BY_ID[id].accent}
          >
            {truncate(t(BRANCH_BY_ID[id].title), 18)}
          </text>
        ))}

        {positioned.flatMap(({ node, x, y }) =>
          node.requires.map((req) => {
            const from = posById.get(req);
            if (!from) return null;
            const done = isNodeDone(data, req);
            return (
              <path
                key={`${req}->${node.id}`}
                d={`M${from.x} ${from.y + R} C ${from.x} ${from.y + R + 30}, ${x} ${y - R - 30}, ${x} ${y - R}`}
                fill="none"
                stroke={done ? 'var(--accent)' : 'var(--border-strong)'}
                strokeWidth={node.boss ? 2 : 1.4}
                strokeDasharray={done ? undefined : '4 4'}
              />
            );
          }),
        )}

        {positioned.map(({ node, x, y }) => {
          const unlocked = isUnlocked(data, node);
          const stars = nodeStars(data, node.id);
          const accent = node.boss ? 'var(--star)' : BRANCH_BY_ID[node.branch].accent;
          return (
            <g
              key={node.id}
              className={unlocked ? 'tree__node' : 'tree__node tree__node--locked'}
              onClick={() => unlocked && navigate(`/node/${node.id}`)}
              role={unlocked ? 'button' : undefined}
              tabIndex={unlocked ? 0 : -1}
              onKeyDown={(e) => {
                if (unlocked && (e.key === 'Enter' || e.key === ' ')) navigate(`/node/${node.id}`);
              }}
            >
              {node.boss ? (
                <rect
                  x={x - 26}
                  y={y - R}
                  width={52}
                  height={R * 2}
                  rx={8}
                  fill={stars > 0 ? accent : 'var(--bg-elev-2)'}
                  stroke={accent}
                  strokeWidth={2}
                  opacity={unlocked ? 1 : 0.5}
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill={stars > 0 ? accent : 'var(--bg-elev-2)'}
                  stroke={unlocked ? accent : 'var(--border-strong)'}
                  strokeWidth={2}
                  opacity={unlocked ? 1 : 0.5}
                />
              )}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 700 }}
                fill={stars > 0 ? 'var(--bg)' : 'var(--text-dim)'}
              >
                {stars > 0 ? '★'.repeat(stars) : unlocked ? (node.boss ? '!' : node.tier) : '🔒'}
              </text>
              <text x={x} y={y + R + 13} textAnchor="middle" className="tree__label">
                {truncate(t(node.title), node.boss ? 30 : 19)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
