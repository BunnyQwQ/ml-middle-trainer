import { describe, expect, it } from 'vitest';
import {
  ACTS,
  NODES,
  NODE_BY_ID,
  bossOfAct,
  getNode,
  isActOpen,
  isUnlocked,
  lockReason,
  nodesOfAct,
} from '@/content/graph';
import { emptyProgress, type ProgressData } from '@/progress/store';

/** A profile that has finished the given nodes and earned the given xp. */
function progressWith(doneIds: string[], xp = 0): ProgressData {
  const data = emptyProgress();
  data.xp = xp;
  for (const id of doneIds) {
    data.nodes[id] = { items: {}, stars: 3, completedAt: 1, startedAt: 1 };
  }
  return data;
}

const BOSSES = NODES.filter((n) => n.boss);

describe('the shape of the tree', () => {
  it('closes acts 1 to 3 with exactly one boss each', () => {
    for (const act of [1, 2, 3] as const) {
      expect(bossOfAct(act)?.id).toBeDefined();
      expect(NODES.filter((n) => n.boss && n.act === act)).toHaveLength(1);
    }
  });

  it('never points a prerequisite at a later act', () => {
    for (const node of NODES) {
      for (const req of node.requires) {
        expect(NODE_BY_ID[req].act).toBeLessThanOrEqual(node.act);
      }
    }
  });

  it('draws every boss from at least two branches', () => {
    for (const boss of BOSSES) {
      const branches = new Set(boss.requires.map((r) => NODE_BY_ID[r].branch));
      expect(branches.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('starts every act after the first behind the previous boss', () => {
    for (const act of [2, 3, 4] as const) {
      const entries = nodesOfAct(act).filter(
        (n) => !n.requires.some((r) => NODE_BY_ID[r].act === act),
      );
      expect(entries.length).toBeGreaterThan(0);
      for (const node of entries) {
        expect(node.requires.some((r) => NODE_BY_ID[r].boss)).toBe(true);
      }
    }
  });
});

describe('what is open on a fresh profile', () => {
  const fresh = emptyProgress();

  it('opens only the first act', () => {
    expect(isActOpen(fresh, 1)).toBe(true);
    expect(isActOpen(fresh, 2)).toBe(false);
    expect(isActOpen(fresh, 3)).toBe(false);
  });

  it('offers more than one starting point, but not many', () => {
    const open = NODES.filter((n) => isUnlocked(fresh, n));
    expect(open.map((n) => n.id).sort()).toEqual(['sql.basics', 'stats.distributions']);
  });

  it('keeps every boss shut', () => {
    for (const boss of BOSSES) expect(isUnlocked(fresh, boss)).toBe(false);
  });
});

describe('progressing through the acts', () => {
  it('opens the first trial once both of its branches are finished', () => {
    const boss = getNode('boss.first-report')!;
    expect(isUnlocked(progressWith(['stats.ci']), boss)).toBe(false);
    expect(isUnlocked(progressWith(['sql.grouping']), boss)).toBe(false);
    expect(isUnlocked(progressWith(['stats.ci', 'sql.grouping']), boss)).toBe(true);
  });

  it('opens act two only after the trial is beaten', () => {
    const beforeTrial = progressWith(['stats.distributions', 'stats.clt', 'stats.ci', 'sql.basics', 'sql.grouping']);
    expect(isActOpen(beforeTrial, 2)).toBe(false);
    expect(isUnlocked(beforeTrial, getNode('ab.basics')!)).toBe(false);

    const afterTrial = progressWith([...Object.keys(beforeTrial.nodes), 'boss.first-report']);
    expect(isActOpen(afterTrial, 2)).toBe(true);
    expect(isUnlocked(afterTrial, getNode('ab.basics')!)).toBe(true);
    expect(isUnlocked(afterTrial, getNode('stats.hypotheses')!)).toBe(true);
    expect(isUnlocked(afterTrial, getNode('sql.windows')!)).toBe(true);
  });

  it('still requires the chain inside an act', () => {
    const afterTrial = progressWith(['stats.ci', 'sql.grouping', 'boss.first-report']);
    expect(isUnlocked(afterTrial, getNode('ab.basics')!)).toBe(true);
    // ab.power sits behind ab.basics even though the act is open.
    expect(isUnlocked(afterTrial, getNode('ab.power')!)).toBe(false);
  });
});

describe('side branches and the level bypass', () => {
  const heads = NODES.filter((n) => n.unlockLevel !== undefined);

  it('gives every act-four branch a level route', () => {
    // Derived from the content rather than hard-coded: a new act-four branch
    // without a level bypass would be reachable only through the trial.
    const actFour = new Set(
      NODES.filter((n) => n.act === 4 && !n.boss).map((n) => n.branch),
    );
    const branches = new Set(heads.map((n) => n.branch));
    expect(branches).toEqual(actFour);
  });

  it('keeps side branches shut at low level without the trial', () => {
    const early = progressWith([], 500);
    for (const head of heads) expect(isUnlocked(early, head)).toBe(false);
  });

  it('opens a side branch on level alone, ahead of the trial', () => {
    // Level 6 needs 50 * 6 * 5 = 1500 xp.
    const grinder = progressWith([], 1500);
    const retrieval = getNode('retrieval.bm25')!;
    expect(retrieval.unlockLevel).toBe(6);
    expect(isUnlocked(grinder, retrieval)).toBe(true);
    // The deeper side branches still wait for a higher level.
    expect(isUnlocked(grinder, getNode('bandits.basics')!)).toBe(false);
  });

  it('opens a side branch on the trial alone, at any level', () => {
    const finisher = progressWith(['boss.ranking-launch'], 0);
    for (const head of heads) expect(isUnlocked(finisher, head)).toBe(true);
  });

  it('explains the lock in words the map can print', () => {
    const fresh = emptyProgress();
    const side = lockReason(fresh, getNode('ads.ecpm')!);
    expect(side.kind).toBe('prereq');
    if (side.kind === 'prereq') {
      expect(side.missing.map((m) => m.id)).toEqual(['boss.ranking-launch']);
      expect(side.alsoLevel).toBe(6);
    }
    expect(lockReason(fresh, getNode('stats.distributions')!).kind).toBe('open');
  });
});

describe('acts cover everything', () => {
  it('assigns every node to an act and every act to some nodes', () => {
    for (const node of NODES) expect(ACTS).toContain(node.act);
    for (const act of ACTS) expect(nodesOfAct(act).length).toBeGreaterThan(0);
  });

  it('reaches every node from a fresh profile by finishing things in order', () => {
    const data = emptyProgress();
    const done = new Set<string>();
    // Repeatedly complete whatever is open until nothing new opens.
    for (let pass = 0; pass < NODES.length + 2; pass += 1) {
      const next = NODES.filter((n) => !done.has(n.id) && isUnlocked(data, n));
      if (next.length === 0) break;
      for (const node of next) {
        done.add(node.id);
        data.nodes[node.id] = { items: {}, stars: 3, completedAt: 1, startedAt: 1 };
      }
    }
    expect(done.size).toBe(NODES.length);
  });
});
