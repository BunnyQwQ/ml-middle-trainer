import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCHES } from '@/content/branches';
import {
  branchNodes,
  branchStats,
  isNodeDone,
  isUnlocked,
  missingPrereqs,
  nodeStars,
} from '@/content/graph';
import type { Branch, SkillNode } from '@/content/types';
import { useProgress } from '@/progress/store';
import { Stars } from '@/ui/controls';
import { TreeMap } from './TreeMap';

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
      </div>

      {view === 'tree' && <TreeMap />}

      {BRANCHES.map((branch) => (
        <BranchBlock key={branch.id} branch={branch} progressKey={data.updatedAt} />
      ))}
    </>
  );
}

function BranchBlock({ branch, progressKey }: { branch: Branch; progressKey: number }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const nodes = branchNodes(branch.id);
  const stats = branchStats(data, branch.id);
  void progressKey;

  return (
    <section className="branch">
      <div className="branch__head">
        <span className="branch__dot" style={{ background: branch.accent }} />
        <h2 className="branch__title">{t(branch.title)}</h2>
        {branch.status === 'ready' ? (
          <span className="branch__meter">
            <span className="meter">
              <span
                className="meter__fill"
                style={{
                  width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%`,
                  background: branch.accent,
                }}
              />
            </span>
            {stats.done}/{stats.total}
          </span>
        ) : (
          <span className="branch__meter">
            <span className="pill">
              {t(UI.map.planned)} · {t(UI.map.nodes)} {branch.stage}
            </span>
          </span>
        )}
      </div>

      <p className="muted" style={{ marginTop: -4 }}>
        {t(branch.blurb)}
      </p>

      {branch.status === 'planned' ? (
        <p className="faint">{t(UI.map.plannedHint)}</p>
      ) : (
        <div className="nodegrid">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} accent={branch.accent} />
          ))}
        </div>
      )}
    </section>
  );
}

function NodeCard({ node, accent }: { node: SkillNode; accent: string }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const unlocked = isUnlocked(data, node);
  const stars = nodeStars(data, node.id);
  const done = isNodeDone(data, node.id);
  const missing = missingPrereqs(data, node);

  const body = (
    <>
      <div className="nodecard__top">
        <span className="nodecard__tier">{node.tier}</span>
        <span className="nodecard__title">{t(node.title)}</span>
        <span className="spacer" />
        {done ? <Stars value={stars} /> : unlocked ? null : <span className="pill">{t(UI.map.locked)}</span>}
      </div>
      <span className="nodecard__blurb">{t(node.blurb)}</span>
      {!unlocked && missing.length > 0 && (
        <span className="faint">
          {t(UI.map.needs)}: {missing.map((m) => t(m.title)).join(', ')}
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
