import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCH_BY_ID, BRANCHES } from '@/content/branches';
import { ACTS, NODES, isNodeDone, isUnlocked, nodeStars } from '@/content/graph';
import type { Act, BranchId, SkillNode } from '@/content/types';
import { useProgress } from '@/progress/store';

/* Geometry. Everything else is derived from these. */
const TRUNK_GAP = 96; // how far the first bough leaves the trunk
const BOUGH_GAP = 132; // distance between boughs on the same side
const LEAN = 64; // how much a bough leans outwards as it descends
const STAGGER = 26; // outer boughs leave the trunk lower than inner ones
const NODE_V = 78; // vertical step between nodes of one bough
const ACT_HEAD = 54; // room above an act's first row
const ACT_FOOT = 96; // room for the trial that closes the act
const R = 17;
const MARGIN = 92;

type Placed = { node: SkillNode; x: number; y: number };
type Bough = { branch: BranchId; dir: -1 | 1; from: { x: number; y: number }; points: Placed[] };

/**
 * The map as a tree rather than a table. A trunk runs down the middle through
 * the trials; inside every act the branches grow out of it to both sides, each
 * in its own colour, leaning further out as they descend. Nothing here is
 * decorative: the position of a node is its act and its tier, and a bough is
 * the chain of prerequisites inside one branch.
 */
export function TreeMap() {
  const { t } = useLang();
  const navigate = useNavigate();
  const data = useProgress((s) => s.data);

  const layout = useMemo(() => buildLayout(), []);
  const { boughs, bosses, acts, width, height, centre } = layout;

  // The tree is wider than the panel on purpose; open it looking at the trunk
  // rather than at the left edge, which is where a plain scroller would start.
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    // The svg is rendered at its natural pixel width, so viewBox units are css
    // pixels and the trunk sits exactly `centre` pixels from the left edge.
    el.scrollLeft = Math.max(0, centre - el.clientWidth / 2);
  }, [centre]);

  const posById = new Map<string, Placed>();
  for (const b of boughs) for (const p of b.points) posById.set(p.node.id, p);
  for (const b of bosses) posById.set(b.node.id, b);

  return (
    <div className="treewrap" ref={wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: Math.max(width, 320), height, maxWidth: 'none' }}
        role="img"
        aria-label={t(UI.map.title)}
      >
        {/* The trunk, one piece per act so it can taper the way a trunk does. */}
        {acts.map((act, i) => (
          <path
            key={`trunk-${act.act}`}
            d={`M${centre} ${i === 0 ? act.yTop - 20 : act.yTop - ACT_FOOT} L${centre} ${
              i === acts.length - 1 ? height - MARGIN / 2 : acts[i + 1].yTop - ACT_FOOT
            }`}
            stroke="var(--border-strong)"
            strokeWidth={11 - i * 1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.45}
          />
        ))}

        {acts.map((act) => (
          <text
            key={`act-${act.act}`}
            x={10}
            y={act.yTop - 4}
            className="tree__act"
            fill="var(--text-dim)"
          >
            {t(UI.map.acts[act.act - 1])}
          </text>
        ))}

        {/* Boughs, drawn segment by segment so they can taper like branches do. */}
        {boughs.map((bough) => {
          const accent = BRANCH_BY_ID[bough.branch].accent;
          const chain = [bough.from, ...bough.points.map((p) => ({ x: p.x, y: p.y }))];
          const reached = bough.points.filter((p) => isNodeDone(data, p.node.id)).length;
          return chain.slice(1).map((_, i) => {
            const alive = i < reached;
            return (
              <path
                key={`${bough.branch}-${i}`}
                d={segment(chain, i)}
                stroke={accent}
                strokeWidth={Math.max(2.5, 7 - i * 1.1)}
                strokeLinecap="round"
                fill="none"
                opacity={alive ? 0.95 : 0.3}
              />
            );
          });
        })}

        {/* What each trial waits for: thin threads from the branch tips. */}
        {bosses.flatMap((boss) =>
          boss.node.requires.map((req) => {
            const from = posById.get(req);
            if (!from) return null;
            const done = isNodeDone(data, req);
            return (
              <path
                key={`${req}->${boss.node.id}`}
                d={`M${from.x} ${from.y + R} C ${from.x} ${from.y + 46}, ${boss.x} ${boss.y - 52}, ${boss.x} ${boss.y - 22}`}
                stroke={done ? 'var(--star)' : 'var(--border-strong)'}
                strokeWidth={1.6}
                strokeDasharray={done ? undefined : '5 5'}
                fill="none"
                opacity={done ? 0.9 : 0.5}
              />
            );
          }),
        )}

        {boughs.map((bough) => {
          const branch = BRANCH_BY_ID[bough.branch];
          const head = bough.points[0];
          return (
            <text
              key={`label-${bough.branch}`}
              x={head.x}
              y={head.y - R - 12}
              textAnchor="middle"
              className="tree__branch"
              fill={branch.accent}
            >
              {truncate(t(branch.title), 18)}
            </text>
          );
        })}

        {boughs.flatMap((bough) =>
          bough.points.map((p) => (
            <TreeNode
              key={p.node.id}
              placed={p}
              accent={BRANCH_BY_ID[bough.branch].accent}
              unlocked={isUnlocked(data, p.node)}
              stars={nodeStars(data, p.node.id)}
              label={truncate(t(p.node.title), 17)}
              onOpen={() => navigate(`/node/${p.node.id}`)}
            />
          )),
        )}

        {bosses.map((boss) => (
          <TreeNode
            key={boss.node.id}
            placed={boss}
            accent="var(--star)"
            unlocked={isUnlocked(data, boss.node)}
            stars={nodeStars(data, boss.node.id)}
            label={truncate(t(boss.node.title), 34)}
            boss
            onOpen={() => navigate(`/node/${boss.node.id}`)}
          />
        ))}
      </svg>
    </div>
  );
}

function TreeNode({
  placed,
  accent,
  unlocked,
  stars,
  label,
  boss = false,
  onOpen,
}: {
  placed: Placed;
  accent: string;
  unlocked: boolean;
  stars: number;
  label: string;
  boss?: boolean;
  onOpen: () => void;
}) {
  const { x, y, node } = placed;
  const r = boss ? 22 : R;
  const done = stars > 0;
  return (
    <g
      className={unlocked ? 'tree__node' : 'tree__node tree__node--locked'}
      onClick={() => unlocked && onOpen()}
      role={unlocked ? 'button' : undefined}
      tabIndex={unlocked ? 0 : -1}
      onKeyDown={(e) => {
        if (unlocked && (e.key === 'Enter' || e.key === ' ')) onOpen();
      }}
    >
      {boss ? (
        <g transform={`rotate(45 ${x} ${y})`}>
          <rect
            x={x - r}
            y={y - r}
            width={r * 2}
            height={r * 2}
            rx={6}
            fill={done ? accent : 'var(--bg-elev-2)'}
            stroke={accent}
            strokeWidth={2.5}
            opacity={unlocked ? 1 : 0.55}
          />
        </g>
      ) : (
        <>
          {done && <circle cx={x} cy={y} r={r + 5} fill={accent} opacity={0.18} />}
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={done ? accent : 'var(--bg-elev-2)'}
            stroke={unlocked ? accent : 'var(--border-strong)'}
            strokeWidth={2.5}
            strokeDasharray={unlocked ? undefined : '3 3'}
            opacity={unlocked ? 1 : 0.6}
          />
        </>
      )}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="tree__mark"
        fill={done ? 'var(--bg)' : 'var(--text-dim)'}
      >
        {done ? '★'.repeat(stars) : unlocked ? (boss ? '!' : node.tier) : '🔒'}
      </text>
      <text
        x={x}
        y={y + r + 15}
        textAnchor="middle"
        className={unlocked ? 'tree__label' : 'tree__label tree__label--locked'}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * One smooth segment of a bough, with Catmull-Rom control points so the whole
 * chain reads as a single curve even though it is drawn piece by piece.
 */
function segment(points: Array<{ x: number; y: number }>, i: number): string {
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  return `M${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

/**
 * Acts stack vertically; inside one, the branches are handed out to the two
 * sides in turn, so a wide act grows in both directions instead of running off
 * to the right. The inner slots go to the branches declared first, which keeps
 * the main line of the course near the trunk.
 */
function buildLayout() {
  const order = BRANCHES.filter((b) => b.id !== 'boss').map((b) => b.id);
  const acts: Array<{ act: Act; yTop: number; yBoss: number }> = [];
  const boughs: Bough[] = [];
  const bosses: Placed[] = [];

  let y = MARGIN;
  let halfWidth = 240;

  for (const act of ACTS) {
    const actNodes = NODES.filter((n) => n.act === act && !n.boss);
    if (actNodes.length === 0) continue;

    const branchIds = order.filter((id) => actNodes.some((n) => n.branch === id));
    const depth = Math.max(...branchIds.map((id) => actNodes.filter((n) => n.branch === id).length));
    const yTop = y;
    const spread = Math.max(0, Math.ceil(branchIds.length / 2) - 1) * STAGGER;
    const yBoss = yTop + ACT_HEAD + spread + depth * NODE_V + ACT_FOOT - 40;

    const perSide = { [-1]: 0, [1]: 0 } as Record<number, number>;
    branchIds.forEach((id, index) => {
      const dir: -1 | 1 = index % 2 === 0 ? 1 : -1;
      const slot = perSide[dir];
      perSide[dir] += 1;

      const nodes = actNodes
        .filter((n) => n.branch === id)
        .sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));

      const baseX = dir * (TRUNK_GAP + slot * BOUGH_GAP);
      // Outer boughs leave the trunk lower and start a little deeper, so the
      // act opens like a fan instead of a row of wires leaving at one height.
      const drop = slot * STAGGER;
      const points = nodes.map((node, i) => {
        const p = nodes.length === 1 ? 1 : i / (nodes.length - 1);
        // The lean plus a small sway is what stops the boughs looking like
        // table columns; both are deterministic, not random.
        const sway = Math.sin((i + slot * 1.7) * 1.1) * 11;
        return {
          node,
          x: baseX + dir * (p * LEAN + sway),
          y: yTop + ACT_HEAD + drop + i * NODE_V,
        };
      });

      halfWidth = Math.max(halfWidth, ...points.map((p) => Math.abs(p.x) + 76));
      boughs.push({
        branch: id,
        dir,
        from: { x: dir * 10, y: yTop + 16 + drop },
        points,
      });
    });

    const boss = NODES.find((n) => n.boss && n.act === act);
    if (boss) bosses.push({ node: boss, x: 0, y: yBoss });
    acts.push({ act, yTop, yBoss });
    y = yBoss + ACT_FOOT;
  }

  const centre = halfWidth;
  const width = halfWidth * 2;
  const height = y;

  // Everything was laid out around x = 0; shift it into the viewBox.
  for (const bough of boughs) {
    bough.from.x += centre;
    for (const p of bough.points) p.x += centre;
  }
  for (const boss of bosses) boss.x += centre;

  return { boughs, bosses, acts, width, height, centre };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
