import { describe, expect, it } from 'vitest';
import { BRANCHES } from '@/content/branches';
import { NODES, branchNodes, getNode, isUnlocked } from '@/content/graph';
import { SIM_IDS } from '@/content/sims';
import { emptyProgress, levelFor, type ProgressData } from '@/progress/store';

function progressWith(doneIds: string[], xp = 0): ProgressData {
  const data = emptyProgress();
  data.xp = xp;
  for (const id of doneIds) {
    data.nodes[id] = { items: {}, stars: 3, completedAt: 1, startedAt: 1 };
  }
  return data;
}

describe('the boosting branch', () => {
  const nodes = branchNodes('boosting');

  it('is three nodes in a chain', () => {
    expect(nodes.map((n) => n.id)).toEqual([
      'boosting.gradient',
      'boosting.catboost',
      'boosting.ranking',
    ]);
    expect(getNode('boosting.catboost')!.requires).toEqual(['boosting.gradient']);
    expect(getNode('boosting.ranking')!.requires).toEqual(['boosting.catboost']);
  });

  it('is a side branch: only its head has a level bypass, and a high one', () => {
    const head = getNode('boosting.gradient')!;
    expect(head.unlockLevel).toBe(8);
    expect(head.requires).toEqual(['boss.ranking-launch']);
    for (const node of nodes.slice(1)) expect(node.unlockLevel).toBeUndefined();
  });

  it('opens on the third trial or on level eight, and not before either', () => {
    const early = progressWith([], 2000);
    expect(levelFor(2000).level).toBeLessThan(8);
    expect(isUnlocked(early, getNode('boosting.gradient')!)).toBe(false);

    expect(isUnlocked(progressWith(['boss.ranking-launch']), getNode('boosting.gradient')!)).toBe(true);

    // 100 * n(n+1)/2 xp for level n+1; level 8 needs 100 * 28 = 2800.
    const grinder = progressWith([], 3000);
    expect(levelFor(3000).level).toBeGreaterThanOrEqual(8);
    expect(isUnlocked(grinder, getNode('boosting.gradient')!)).toBe(true);
  });

  it('is optional: no trial depends on it', () => {
    const bossRequirements = NODES.filter((n) => n.boss).flatMap((n) => n.requires);
    for (const node of nodes) expect(bossRequirements).not.toContain(node.id);
  });

  it('carries its own interactives', () => {
    for (const node of nodes) {
      const sims = node.theory.filter((b) => b.type === 'sim');
      expect(sims.length, node.id).toBeGreaterThan(0);
    }
    const used = new Set(
      nodes.flatMap((n) => n.theory.filter((b) => b.type === 'sim').map((b) => (b as { sim: string }).sim)),
    );
    expect(used).toEqual(
      new Set(['gbm-steps', 'target-encoding', 'oblivious-trees', 'ranking-losses']),
    );
  });
});

describe('the plan is complete', () => {
  it('every declared branch now has content', () => {
    const planned = BRANCHES.filter((b) => b.status !== 'ready');
    expect(planned.map((b) => b.id)).toEqual([]);
  });

  it('every branch has at least one node, and every node a branch', () => {
    for (const branch of BRANCHES) {
      expect(branchNodes(branch.id).length, branch.id).toBeGreaterThan(0);
    }
    const ids = new Set(BRANCHES.map((b) => b.id));
    for (const node of NODES) expect(ids.has(node.branch), node.id).toBe(true);
  });

  it('every simulator in the registry is used by some node', () => {
    const used = new Set(
      NODES.flatMap((n) =>
        n.theory.filter((b) => b.type === 'sim').map((b) => (b as { sim: string }).sim),
      ),
    );
    const unused = SIM_IDS.filter((id) => !used.has(id));
    expect(unused).toEqual([]);
  });
});
