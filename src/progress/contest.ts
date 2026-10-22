import type { ContestRun } from './store';

/**
 * Boss contests, as pure functions over a run record. The clock lives in the
 * stored `startedAt` rather than in a React timer, so closing the tab, a
 * reload or a language switch cannot hand you extra minutes.
 */

export function startRun(nodeId: string, total: number, at: number): ContestRun {
  return { nodeId, startedAt: at, finishedAt: null, solved: 0, total, elapsedMs: 0, passed: false };
}

export function limitMs(minutes: number): number {
  return minutes * 60_000;
}

export function elapsedMs(run: ContestRun, now: number): number {
  return Math.max(0, now - run.startedAt);
}

export function timeLeftMs(run: ContestRun, minutes: number, now: number): number {
  return Math.max(0, limitMs(minutes) - elapsedMs(run, now));
}

export function isExpired(run: ContestRun, minutes: number, now: number): boolean {
  return timeLeftMs(run, minutes, now) === 0;
}

/**
 * Close a run. The elapsed time is capped at the limit so a tab left open
 * overnight does not record a twelve-hour contest, and `passed` means every
 * task was solved before the clock ran out.
 */
export function finishRun(
  run: ContestRun,
  solved: number,
  minutes: number,
  at: number,
): ContestRun {
  const used = Math.min(elapsedMs(run, at), limitMs(minutes));
  return {
    ...run,
    finishedAt: at,
    solved,
    elapsedMs: used,
    passed: solved >= run.total && used < limitMs(minutes),
  };
}

/** More solved wins; on a tie the faster run wins. */
export function betterRun(a: ContestRun | null, b: ContestRun | null): ContestRun | null {
  if (!a) return b;
  if (!b) return a;
  if (a.solved !== b.solved) return a.solved > b.solved ? a : b;
  return a.elapsedMs <= b.elapsedMs ? a : b;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
