import { beforeEach, describe, expect, it } from 'vitest';
import { ACTS, NODES, bossOfAct, getNode, isActOpen, isUnlocked, nodesOfAct } from '@/content/graph';
import { emptyProgress, useProgress, type ProgressData } from '@/progress/store';
import {
  betterRun,
  finishRun,
  formatClock,
  isExpired,
  limitMs,
  startRun,
  timeLeftMs,
} from '@/progress/contest';

const BASE = new Date(2026, 9, 22, 10, 0).getTime();
const MINUTE = 60_000;

function progressWith(doneIds: string[], xp = 0): ProgressData {
  const data = emptyProgress();
  data.xp = xp;
  for (const id of doneIds) {
    data.nodes[id] = { items: {}, stars: 3, completedAt: 1, startedAt: 1 };
  }
  return data;
}

beforeEach(() => {
  useProgress.setState({ data: emptyProgress(), ready: true });
});

describe('contest clock', () => {
  it('counts from the stored start, so a reload buys no extra time', () => {
    const run = startRun('boss.final', 5, BASE);
    expect(timeLeftMs(run, 10, BASE)).toBe(limitMs(10));
    expect(timeLeftMs(run, 10, BASE + 4 * MINUTE)).toBe(6 * MINUTE);
    expect(isExpired(run, 10, BASE + 4 * MINUTE)).toBe(false);
  });

  it('never reports negative time left and expires exactly at the limit', () => {
    const run = startRun('boss.final', 5, BASE);
    expect(timeLeftMs(run, 10, BASE + 10 * MINUTE)).toBe(0);
    expect(isExpired(run, 10, BASE + 10 * MINUTE)).toBe(true);
    expect(timeLeftMs(run, 10, BASE + 100 * MINUTE)).toBe(0);
  });

  it('caps the recorded time at the limit when the tab was left open', () => {
    const run = startRun('boss.final', 5, BASE);
    const done = finishRun(run, 3, 10, BASE + 12 * 60 * MINUTE);
    expect(done.elapsedMs).toBe(limitMs(10));
    expect(done.passed).toBe(false);
  });

  it('passes only when everything was solved before the clock ran out', () => {
    const run = startRun('boss.final', 3, BASE);
    expect(finishRun(run, 3, 10, BASE + 5 * MINUTE).passed).toBe(true);
    expect(finishRun(run, 2, 10, BASE + 5 * MINUTE).passed).toBe(false);
    // Solved everything, but only after the time was up.
    expect(finishRun(run, 3, 10, BASE + 11 * MINUTE).passed).toBe(false);
  });

  it('keeps the better run: more solved first, then faster', () => {
    const slowFull = finishRun(startRun('b', 3, BASE), 3, 20, BASE + 18 * MINUTE);
    const fastPartial = finishRun(startRun('b', 3, BASE), 2, 20, BASE + 2 * MINUTE);
    const fastFull = finishRun(startRun('b', 3, BASE), 3, 20, BASE + 7 * MINUTE);

    expect(betterRun(fastPartial, slowFull)).toBe(slowFull);
    expect(betterRun(slowFull, fastFull)).toBe(fastFull);
    expect(betterRun(null, fastFull)).toBe(fastFull);
    expect(betterRun(null, null)).toBeNull();
  });

  it('formats the clock as minutes and padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9_000)).toBe('0:09');
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('contest state in the store', () => {
  it('records a run and keeps only the best one', () => {
    const { startContest, finishContest } = useProgress.getState();

    startContest('boss.final', 4, BASE);
    expect(useProgress.getState().data.contests['boss.final'].current).not.toBeNull();

    finishContest('boss.final', 2, 60, BASE + 10 * MINUTE);
    const afterFirst = useProgress.getState().data.contests['boss.final'];
    expect(afterFirst.current).toBeNull();
    expect(afterFirst.best?.solved).toBe(2);

    // A worse second attempt does not overwrite the best one.
    startContest('boss.final', 4, BASE);
    finishContest('boss.final', 1, 60, BASE + 5 * MINUTE);
    expect(useProgress.getState().data.contests['boss.final'].best?.solved).toBe(2);

    // A better one does.
    startContest('boss.final', 4, BASE);
    finishContest('boss.final', 4, 60, BASE + 30 * MINUTE);
    const best = useProgress.getState().data.contests['boss.final'].best;
    expect(best?.solved).toBe(4);
    expect(best?.passed).toBe(true);
  });

  it('ignores a finish with no run in progress', () => {
    useProgress.getState().finishContest('boss.final', 3, 60, BASE);
    expect(useProgress.getState().data.contests['boss.final']).toBeUndefined();
  });
});

describe('the bosses are contests', () => {
  const bosses = NODES.filter((n) => n.boss);

  it('every boss has a clock with a sane limit', () => {
    expect(bosses.length).toBe(ACTS.length);
    for (const boss of bosses) {
      expect(boss.contest, boss.id).toBeTruthy();
      expect(boss.contest!.minutes).toBeGreaterThanOrEqual(30);
      expect(boss.contest!.minutes).toBeLessThanOrEqual(90);
    }
  });

  it('gives later trials at least as much time as earlier ones', () => {
    const byAct = [...bosses].sort((a, b) => a.act - b.act).map((b) => b.contest!.minutes);
    for (let i = 1; i < byAct.length; i += 1) {
      expect(byAct[i]).toBeGreaterThanOrEqual(byAct[i - 1]);
    }
  });

  it('only bosses carry a contest', () => {
    for (const node of NODES.filter((n) => !n.boss)) {
      expect(node.contest, node.id).toBeUndefined();
    }
  });
});

describe('act five', () => {
  it('stays shut until the fourth trial is done', () => {
    const before = progressWith(['ads.calibration', 'retrieval.ann', 'qcls.thresholds', 'testing.ml-pipelines']);
    expect(isActOpen(before, 5)).toBe(false);
    expect(isUnlocked(before, getNode('sysd.framing')!)).toBe(false);
    expect(isUnlocked(before, getNode('product.metrics')!)).toBe(false);

    const after = progressWith([...Object.keys(before.nodes), 'boss.production']);
    expect(isActOpen(after, 5)).toBe(true);
    expect(isUnlocked(after, getNode('sysd.framing')!)).toBe(true);
    expect(isUnlocked(after, getNode('product.metrics')!)).toBe(true);
  });

  it('opens two branches in parallel and keeps the chain inside each', () => {
    const open = progressWith(['boss.production']);
    expect(isUnlocked(open, getNode('sysd.data')!)).toBe(false);
    expect(isUnlocked(open, getNode('product.tradeoffs')!)).toBe(false);

    const branches = new Set(nodesOfAct(5).map((n) => n.branch));
    expect(branches).toEqual(new Set(['system-design', 'product']));
  });

  it('has no level bypass: the finale is earned, not ground out', () => {
    for (const node of nodesOfAct(5)) expect(node.unlockLevel, node.id).toBeUndefined();
    const grinder = progressWith([], 100_000);
    expect(isUnlocked(grinder, getNode('sysd.framing')!)).toBe(false);
  });

  it('closes with a trial that draws on both act-five branches', () => {
    const final = bossOfAct(5);
    expect(final?.id).toBe('boss.final');
    const branchesOfPrereqs = new Set(final!.requires.map((id) => getNode(id)!.branch));
    expect(branchesOfPrereqs).toEqual(new Set(['system-design', 'product']));
  });

  it('is the last act: nothing requires the final trial', () => {
    for (const node of NODES) {
      expect(node.requires, node.id).not.toContain('boss.final');
    }
  });
});
