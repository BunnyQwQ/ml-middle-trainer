import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { BRANCH_BY_ID } from '@/content/branches';
import { NODES, READY_BRANCHES, isNodeDone, isUnlocked, nodeStars } from '@/content/graph';
import { useProgress } from '@/progress/store';

const COL = 200;
const ROW = 96;
const PAD = 28;
const R = 15;

/**
 * The skill tree: one column per branch, depth by tier, edges for
 * prerequisites. Cross-branch edges are the point of the picture — they show
 * that A/B leans on statistics.
 */
export function TreeMap() {
  const { t } = useLang();
  const navigate = useNavigate();
  const data = useProgress((s) => s.data);

  const columns = READY_BRANCHES.map((b) => b.id);
  const positioned = NODES.filter((n) => columns.includes(n.branch)).map((n) => ({
    node: n,
    x: PAD + columns.indexOf(n.branch) * COL + COL / 2,
    y: PAD + 26 + (n.tier - 1) * ROW + R,
  }));
  const posById = new Map(positioned.map((p) => [p.node.id, p]));

  const maxTier = Math.max(...positioned.map((p) => p.node.tier), 1);
  const width = PAD * 2 + columns.length * COL;
  const height = PAD * 2 + 26 + (maxTier - 1) * ROW + R * 2 + 20;

  return (
    <div className="treewrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: Math.max(width, 320), height, maxWidth: 'none' }}
        role="img"
        aria-label={t({ ru: 'Дерево навыков', en: 'Skill tree' })}
      >
        {columns.map((id, i) => (
          <text
            key={id}
            x={PAD + i * COL + COL / 2}
            y={PAD}
            textAnchor="middle"
            style={{ fontSize: 12, fontWeight: 600 }}
            fill={BRANCH_BY_ID[id].accent}
          >
            {t(BRANCH_BY_ID[id].title)}
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
                d={`M${from.x} ${from.y + R} C ${from.x} ${from.y + R + 36}, ${x} ${y - R - 36}, ${x} ${y - R}`}
                fill="none"
                stroke={done ? 'var(--accent)' : 'var(--border-strong)'}
                strokeWidth={1.6}
                strokeDasharray={done ? undefined : '4 4'}
              />
            );
          }),
        )}

        {positioned.map(({ node, x, y }) => {
          const unlocked = isUnlocked(data, node);
          const stars = nodeStars(data, node.id);
          const accent = BRANCH_BY_ID[node.branch].accent;
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
              <circle
                cx={x}
                cy={y}
                r={R}
                fill={stars > 0 ? accent : 'var(--bg-elev-2)'}
                stroke={unlocked ? accent : 'var(--border-strong)'}
                strokeWidth={2}
                opacity={unlocked ? 1 : 0.5}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 700 }}
                fill={stars > 0 ? 'var(--bg)' : 'var(--text-dim)'}
              >
                {stars > 0 ? '★'.repeat(stars) : unlocked ? node.tier : '🔒'}
              </text>
              <text x={x} y={y + R + 14} textAnchor="middle" className="tree__label">
                {truncate(t(node.title), 22)}
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
