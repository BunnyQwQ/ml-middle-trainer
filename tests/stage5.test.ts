import { describe, expect, it } from 'vitest';
import { NODES, getNode } from '@/content/graph';
import { miniPandas } from '@/content/branches/mini/pandas';
import { miniDlQuiz } from '@/content/branches/mini/dl-quiz';
import { miniMlBugs } from '@/content/branches/mini/ml-bugs';
import type { Task } from '@/content/types';
import { emptyProgress } from '@/progress/store';
import { dueCards, review, type SrsItemKind } from '@/progress/srs';

const ALL_TASKS: Task[] = NODES.flatMap((n) => n.tasks);
const BASE = new Date(2026, 9, 22, 11, 0).getTime();

describe('review covers every task kind', () => {
  const KINDS: SrsItemKind[] = [
    'quiz',
    'sql',
    'python',
    'case',
    'findbug',
    'metric-pick',
    'write-tests',
  ];

  it.each(KINDS)('content has at least one %s task, so the kind can be scheduled', (kind) => {
    expect(ALL_TASKS.filter((t) => t.kind === kind).length).toBeGreaterThan(0);
  });

  it('every task kind present in the content is a schedulable card kind', () => {
    const kinds = new Set(ALL_TASKS.map((t) => t.kind));
    for (const kind of kinds) {
      expect(KINDS).toContain(kind as SrsItemKind);
    }
  });
});

describe('a due card resolves back to a renderable task', () => {
  /**
   * The review session renders the task itself, so every card must be able to
   * find its task from the ids it stores. This fails one wrong task id.
   */
  it('finds the task of a card scheduled from any node', () => {
    const data = emptyProgress();
    for (const node of NODES) {
      for (const task of node.tasks) {
        const card = review(undefined, {
          id: task.id,
          nodeId: node.id,
          kind: task.kind as SrsItemKind,
          correct: false,
          at: BASE,
        });
        expect(card).not.toBeNull();
        data.srs[task.id] = card!;
      }
    }

    const due = dueCards(data.srs, BASE + 86_400_000);
    expect(due.length).toBe(ALL_TASKS.length);

    for (const card of due) {
      const node = getNode(card.nodeId);
      expect(node, card.nodeId).toBeTruthy();
      const task = node!.tasks.find((t) => t.id === card.id);
      expect(task, card.id).toBeTruthy();
      expect(task!.kind).toBe(card.kind);
    }
  });

  it('task ids are unique across the whole content, so cards cannot collide', () => {
    const ids = ALL_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('mini branches stay exactly as specified', () => {
  it('ML code bugs: exactly three find-the-bug tasks', () => {
    expect(miniMlBugs.tasks.length).toBe(3);
    expect(miniMlBugs.tasks.every((t) => t.kind === 'findbug')).toBe(true);
  });

  it('DL questions: exactly one quiz of ten questions', () => {
    expect(miniDlQuiz.tasks.length).toBe(10);
    expect(miniDlQuiz.tasks.every((t) => t.kind === 'quiz')).toBe(true);
  });

  it('pandas: exactly ten tasks, all python, all on the same fixture', () => {
    expect(miniPandas.tasks.length).toBe(10);
    const preambles = new Set<string>();
    for (const task of miniPandas.tasks) {
      expect(task.kind).toBe('python');
      if (task.kind !== 'python') continue;
      expect(task.packages).toEqual(['pandas']);
      preambles.add(task.preamble ?? '');
    }
    expect(preambles.size).toBe(1);
  });

  it('the mini branch holds nothing but those three nodes', () => {
    const ids = NODES.filter((n) => n.branch === 'mini').map((n) => n.id);
    expect(ids.sort()).toEqual(['mini.dl-quiz', 'mini.ml-bugs', 'mini.pandas']);
  });

  it('mini nodes are a side branch: level-gated, behind the last boss', () => {
    for (const node of NODES.filter((n) => n.branch === 'mini')) {
      expect(node.unlockLevel).toBeGreaterThan(0);
      expect(node.requires).toContain('boss.ranking-launch');
    }
  });
});

describe('pandas tasks forbid row loops where the task says so', () => {
  /**
   * Three of the ten tasks explicitly ask for a vectorised solution. The
   * reference must practise what the prompt preaches, otherwise the write-up
   * teaches one thing and the code shows another.
   */
  const VECTORISED = ['mini.pandas.query-ctr', 'mini.pandas.rolling', 'mini.pandas.rank-in-group'];

  it.each(VECTORISED)('%s has no loop in the reference', (id) => {
    const task = miniPandas.tasks.find((t) => t.id === id);
    expect(task).toBeTruthy();
    if (task?.kind !== 'python') throw new Error('not a python task');
    expect(task.reference).not.toMatch(/\bfor\b|\bwhile\b|iterrows|itertuples|\.apply\(/);
  });
});
