import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCH_BY_ID, BRANCHES } from '@/content/branches';
import {
  ACTS,
  bossOfAct,
  isActOpen,
  isNodeDone,
  isUnlocked,
  lockReason,
  nodesOfAct,
  nodeStars,
} from '@/content/graph';
import type { Act, Branch, SkillNode } from '@/content/types';
import { levelFor, useProgress } from '@/progress/store';
import { Stars } from '@/ui/controls';
import { TreeMap } from './TreeMap';

/**
 * The map is a sequence of acts rather than a pile of branches. Inside an act
 * a few branches run in parallel, so there is always a choice; between acts
 * stands a boss that gathers everything before it.
 */
export function MapPage() {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const [view, setView] = useState<'tree' | 'list'>('list');

  return (
    <>
      <h1 className="h1">{t(UI.map.title)}</h1>
      <p className="muted">{t(UI.map.subtitle)}</p>

      <div className="map__toolbar">
        <div className="segmented" role="group">
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            {t(UI.map.viewList)}
          </button>
          <button type="button" aria-pressed={view === 'tree'} onClick={() => setView('tree')}>
            {t(UI.map.viewTree)}
          </button>
        </div>
        <span className="spacer" />
        <span className="pill">
          {t(UI.dashboard.level)} {levelFor(data.xp).level}
        </span>
      </div>

      {view === 'tree' && <TreeMap />}

      {ACTS.map((act) => (
        <ActBlock key={act} act={act} />
      ))}

      <h2 className="h2">{t(UI.map.planned)}</h2>
      <div className="nodegrid">
        {BRANCHES.filter((b) => b.status === 'planned').map((branch) => (
          <div className="nodecard nodecard--locked" key={branch.id} style={{ borderLeftColor: branch.accent }}>
            <div className="nodecard__top">
              <span className="nodecard__title">{t(branch.title)}</span>
              <span className="spacer" />
              <span className="pill">{t(UI.map.planned)}</span>
            </div>
            <span className="nodecard__blurb">{t(branch.blurb)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ActBlock({ act }: { act: Act }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const nodes = nodesOfAct(act);
  const boss = bossOfAct(act);
  const open = isActOpen(data, act);
  const done = nodes.filter((n) => isNodeDone(data, n.id)).length;

  // Branch ids present in this act, in their declared order.
  const branchIds = BRANCHES.filter((b) => nodes.some((n) => n.branch === b.id)).map((b) => b.id);

  return (
    <section className={`act${open ? '' : ' act--locked'}`}>
      <div className="act__head">
        <h2 className="act__title">{t(UI.map.acts[act - 1])}</h2>
        <span className="spacer" />
        <span className="faint">
          {done}/{nodes.length}
        </span>
      </div>
      <p className="muted act__blurb">{t(UI.map.actBlurbs[act - 1])}</p>

      {branchIds.map((id) => (
        <BranchBlock
          key={id}
          branch={BRANCH_BY_ID[id]}
          nodes={nodes.filter((n) => n.branch === id)}
        />
      ))}

      {boss && <BossCard node={boss} />}
    </section>
  );
}

function BranchBlock({ branch, nodes }: { branch: Branch; nodes: SkillNode[] }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const done = nodes.filter((n) => isNodeDone(data, n.id)).length;
  const isSide = nodes.some((n) => n.unlockLevel !== undefined);

  return (
    <div className="branch">
      <div className="branch__head">
        <span className="branch__dot" style={{ background: branch.accent }} />
        <h3 className="branch__title">{t(branch.title)}</h3>
        {isSide && <span className="pill">{t(UI.map.sideBranch)}</span>}
        <span className="branch__meter">
          <span className="meter">
            <span
              className="meter__fill"
              style={{
                width: `${nodes.length ? (done / nodes.length) * 100 : 0}%`,
                background: branch.accent,
              }}
            />
          </span>
          {done}/{nodes.length}
        </span>
      </div>

      <div className="nodegrid">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} accent={branch.accent} />
        ))}
      </div>
    </div>
  );
}

function NodeCard({ node, accent }: { node: SkillNode; accent: string }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const unlocked = isUnlocked(data, node);
  const stars = nodeStars(data, node.id);
  const done = isNodeDone(data, node.id);
  const reason = lockReason(data, node);

  const body = (
    <>
      <div className="nodecard__top">
        <span className="nodecard__tier">{node.tier}</span>
        <span className="nodecard__title">{t(node.title)}</span>
        <span className="spacer" />
        {done ? <Stars value={stars} /> : unlocked ? null : <span className="pill">{t(UI.map.locked)}</span>}
      </div>
      <span className="nodecard__blurb">{t(node.blurb)}</span>
      {reason.kind === 'prereq' && reason.missing.length > 0 && (
        <span className="faint">
          {t(UI.map.needs)}: {reason.missing.map((m) => t(m.title)).join(', ')}
          {reason.alsoLevel !== undefined && ` · ${t(UI.map.needLevel)} ${reason.alsoLevel}`}
        </span>
      )}
      {reason.kind === 'level' && (
        <span className="faint">
          {t(UI.map.needLevel)} {reason.need}
        </span>
      )}
    </>
  );

  if (!unlocked) {
    return (
      <div className="nodecard nodecard--locked" style={{ borderLeftColor: accent }} aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <Link to={`/node/${node.id}`} className="nodecard" style={{ borderLeftColor: accent }}>
      {body}
    </Link>
  );
}

function BossCard({ node }: { node: SkillNode }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const unlocked = isUnlocked(data, node);
  const done = isNodeDone(data, node.id);
  const stars = nodeStars(data, node.id);
  const reason = lockReason(data, node);

  const body = (
    <>
      <div className="row" style={{ gap: 8 }}>
        <span className="bosscard__badge">{t(UI.map.boss)}</span>
        <strong className="bosscard__title">{t(node.title)}</strong>
        <span className="spacer" />
        {done ? <Stars value={stars} /> : <span className="pill">{t(UI.map.locked)}</span>}
      </div>
      <p className="bosscard__blurb">{t(node.blurb)}</p>
      <p className="faint" style={{ margin: 0 }}>
        {t(UI.map.bossHint)}
        {reason.kind === 'prereq' && reason.missing.length > 0 && (
          <>
            {' · '}
            {t(UI.map.bossLocked)}: {reason.missing.map((m) => t(m.title)).join(', ')}
          </>
        )}
      </p>
    </>
  );

  if (!unlocked) {
    return (
      <div className="bosscard bosscard--locked" aria-disabled>
        {body}
      </div>
    );
  }
  return (
    <Link to={`/node/${node.id}`} className="bosscard">
      {body}
    </Link>
  );
}
