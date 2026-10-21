import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { NODES, nodeItemCount } from '@/content/graph';
import { BRANCH_BY_ID } from '@/content/branches';
import type { MetricPickTask, SkillNode } from '@/content/types';
import { useProgress } from '@/progress/store';
import { MetricPickTaskView } from '@/features/node-view/MetricPickTaskView';

type Scenario = { node: SkillNode; task: MetricPickTask };

/**
 * The metric trainer as a mode of its own: every scenario from every branch in
 * one place. Solving one here counts towards its home node, so the two views
 * never disagree about progress.
 */
export function MetricsPage() {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [open, setOpen] = useState<string | null>(null);

  const scenarios = useMemo<Scenario[]>(() => {
    const out: Scenario[] = [];
    for (const node of NODES) {
      for (const task of node.tasks) {
        if (task.kind === 'metric-pick') out.push({ node, task });
      }
    }
    return out;
  }, []);

  const solved = scenarios.filter(
    ({ node, task }) => data.nodes[node.id]?.items[task.id]?.solved,
  ).length;

  return (
    <>
      <h1 className="h1">{t(UI.metrics.title)}</h1>
      <p className="muted">{t(UI.metrics.subtitle)}</p>

      <div className="row" style={{ margin: '14px 0' }}>
        <span className="pill">
          {t(UI.metrics.solved)}: {solved}/{scenarios.length}
        </span>
      </div>

      {scenarios.length === 0 ? (
        <p className="muted">{t(UI.metrics.empty)}</p>
      ) : (
        scenarios.map(({ node, task }) => {
          const isOpen = open === task.id;
          const isSolved = Boolean(data.nodes[node.id]?.items[task.id]?.solved);
          const branch = BRANCH_BY_ID[node.branch];
          return (
            <section className="card" key={task.id}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="pill" style={{ borderColor: branch.accent, color: branch.accent }}>
                  {t(task.area)}
                </span>
                {isSolved && (
                  <span className="pill" style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}>
                    OK
                  </span>
                )}
                <span className="spacer" />
                <Link className="faint" to={`/node/${node.id}?tab=tasks&task=${encodeURIComponent(task.id)}`}>
                  {t(UI.metrics.fromNode)}: {t(node.title)}
                </Link>
              </div>

              {isOpen ? (
                <MetricPickTaskView
                  task={task}
                  onResult={(correct) =>
                    recordAttempt({
                      nodeId: node.id,
                      itemId: task.id,
                      kind: 'metric-pick',
                      correct,
                      nodeItemCount: nodeItemCount(node),
                    })
                  }
                />
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>{truncate(t(task.scenario), 220)}</p>
                  <button type="button" className="btn btn--primary" onClick={() => setOpen(task.id)}>
                    {t(UI.map.open)}
                  </button>
                </>
              )}
            </section>
          );
        })
      )}
    </>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
