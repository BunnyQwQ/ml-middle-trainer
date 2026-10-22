import type { Task } from '@/content/types';
import { QuizTaskView } from './QuizTaskView';
import { SqlTaskView } from './SqlTaskView';
import { PythonTaskView } from './PythonTaskView';
import { CaseTaskView } from './CaseTaskView';
import { FindBugTaskView } from './FindBugTaskView';
import { MetricPickTaskView } from './MetricPickTaskView';
import { WriteTestsTaskView } from './WriteTestsTaskView';

/** Called by every task view once an attempt has been graded. */
export type TaskResultHandler = (correct: boolean) => void;

/**
 * The single dispatch from a task to its view. Both the node page and the
 * review session render tasks through here, so a review card behaves exactly
 * like the task does in its lesson — same editor, same verdicts, same write-up.
 */
export function TaskSwitch({ task, onResult }: { task: Task; onResult: TaskResultHandler }) {
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
    case 'write-tests':
      return <WriteTestsTaskView task={task} onResult={onResult} />;
    default:
      return null;
  }
}
