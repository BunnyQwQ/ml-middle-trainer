import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { BRANCH_BY_ID } from '@/content/branches';
import { getNode, isUnlocked, nodeItemCount, nodeStars } from '@/content/graph';
import type { SkillNode, Task } from '@/content/types';
import { useProgress } from '@/progress/store';
import type { SrsItemKind } from '@/progress/srs';
import { Stars } from '@/ui/controls';
import { TheoryBody } from '@/ui/Theory';
import { QuizTaskView } from './QuizTaskView';
import { SqlTaskView } from './SqlTaskView';
import { PythonTaskView } from './PythonTaskView';
import { CaseTaskView } from './CaseTaskView';
import { FindBugTaskView } from './FindBugTaskView';
import { MetricPickTaskView } from './MetricPickTaskView';

export type TaskResultHandler = (correct: boolean) => void;

export function NodePage() {
  const { nodeId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const node = nodeId ? getNode(nodeId) : undefined;

  const tabFromUrl = params.get('tab') === 'tasks' ? 'tasks' : 'theory';
  const [tab, setTab] = useState<'theory' | 'tasks'>(tabFromUrl);

  useEffect(() => {
    setTab(params.get('tab') === 'tasks' ? 'tasks' : 'theory');
  }, [params]);

  const focusTask = params.get('task');

  useEffect(() => {
    if (!focusTask) return;
    const el = document.getElementById(`task-${focusTask}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusTask, tab]);

  if (!node) {
    return (
      <>
        <h1 className="h1">{t(UI.common.notFound)}</h1>
        <Link to="/" className="btn">
          {t(UI.node.toMap)}
        </Link>
      </>
    );
  }

  const unlocked = isUnlocked(data, node);
  const branch = BRANCH_BY_ID[node.branch];
  const stars = nodeStars(data, node.id);

  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <span className="pill" style={{ borderColor: branch.accent, color: branch.accent }}>
          {t(branch.title)}
        </span>
        <span className="pill">
          {t(UI.node.taskOf)} {node.tasks.length}
        </span>
        {stars > 0 && <Stars value={stars} />}
      </div>

      <h1 className="h1" style={{ marginTop: 10 }}>
        {t(node.title)}
      </h1>
      <p className="muted">{t(node.blurb)}</p>

      {!unlocked && (
        <div className="note note--warn">
          <p style={{ margin: 0 }}>
            {t(UI.map.needs)}:{' '}
            {node.requires
              .map((r) => getNode(r))
              .filter(Boolean)
              .map((n) => t((n as SkillNode).title))
              .join(', ')}
          </p>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === 'theory'}
          onClick={() => {
            setTab('theory');
            setParams({}, { replace: true });
          }}
        >
          {t(UI.node.theory)}
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === 'tasks'}
          onClick={() => {
            setTab('tasks');
            setParams({ tab: 'tasks' }, { replace: true });
          }}
        >
          {t(UI.node.tasks)} · {node.tasks.length}
        </button>
      </div>

      {tab === 'theory' ? (
        <>
          <TheoryBody blocks={node.theory} />
          {node.sources && node.sources.length > 0 && (
            <>
              <h2 className="h2">{t(UI.common.sources)}</h2>
              <ul>
                {node.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      {s.title}
                    </a>
                    {s.note && <span className="muted"> — {t(s.note)}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="row" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setTab('tasks');
                setParams({ tab: 'tasks' }, { replace: true });
              }}
            >
              {t(UI.node.toTasks)}
            </button>
          </div>
        </>
      ) : (
        <TaskList node={node} />
      )}
    </>
  );
}

function TaskList({ node }: { node: SkillNode }) {
  const { t } = useLang();
  const data = useProgress((s) => s.data);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const itemCount = useMemo(() => nodeItemCount(node), [node]);

  const makeHandler = (task: Task): TaskResultHandler => (correct) => {
    recordAttempt({
      nodeId: node.id,
      itemId: task.id,
      kind: task.kind as SrsItemKind,
      correct,
      nodeItemCount: itemCount,
    });
  };

  const solvedCount = Object.values(data.nodes[node.id]?.items ?? {}).filter((i) => i.solved).length;

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="pill">
          {solvedCount} {t(UI.common.of)} {node.tasks.length}
        </span>
        {solvedCount === node.tasks.length && node.tasks.length > 0 && (
          <span className="pill" style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}>
            {t(UI.node.completed)}
          </span>
        )}
      </div>

      {node.tasks.map((task, i) => (
        <section className="card" id={`task-${task.id}`} key={task.id}>
          <div className="row" style={{ marginBottom: 8 }}>
            <strong>
              {t(UI.node.task)} {i + 1}
            </strong>
            <span className="pill">{task.kind}</span>
            {data.nodes[node.id]?.items[task.id]?.solved && (
              <span className="pill" style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}>
                OK
              </span>
            )}
          </div>
          <TaskSwitch task={task} onResult={makeHandler(task)} />
        </section>
      ))}
    </>
  );
}

function TaskSwitch({ task, onResult }: { task: Task; onResult: TaskResultHandler }) {
  switch (task.kind) {
    case 'quiz':
      return <QuizTaskView task={task} onResult={onResult} />;
    case 'sql':
      return <SqlTaskView task={task} onResult={onResult} />;
    case 'python':
      return <PythonTaskView task={task} onResult={onResult} />;
    case 'case':
      return <CaseTaskView task={task} onResult={onResult} />;
    case 'findbug':
      return <FindBugTaskView task={task} onResult={onResult} />;
    case 'metric-pick':
      return <MetricPickTaskView task={task} onResult={onResult} />;
    default:
      return null;
  }
}
