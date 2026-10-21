/**
 * Spaced repetition, deliberately boring: a mistake schedules the item for
 * tomorrow, and each correct recall moves it along 1 -> 3 -> 7 -> 14 days.
 * Pure functions so the schedule is unit-testable without fake clocks.
 */

export const SRS_INTERVALS_DAYS = [1, 3, 7, 14] as const;

export type SrsItemKind = 'quiz' | 'sql' | 'python' | 'case' | 'findbug' | 'metric-pick';

export type SrsCard = {
  /** Stable id of the question or task. */
  id: string;
  nodeId: string;
  kind: SrsItemKind;
  /** 0 = just failed, 1..4 = position in SRS_INTERVALS_DAYS. */
  stage: number;
  /** Epoch ms of the next time this card should be shown. */
  dueAt: number;
  lapses: number;
  reviews: number;
  lastResult: 'correct' | 'wrong';
  updatedAt: number;
};

export const DAY_MS = 86_400_000;

/** Midnight-anchored day index, so "due today" does not depend on the hour. */
export function dayIndex(at: number): number {
  const d = new Date(at);
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS,
  );
}

export function startOfNextDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + DAY_MS;
}

function dueFromStage(stage: number, at: number): number {
  const idx = Math.min(Math.max(stage, 1), SRS_INTERVALS_DAYS.length) - 1;
  const days = SRS_INTERVALS_DAYS[idx];
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + days * DAY_MS;
}

/**
 * Fold one attempt into a card.
 * A wrong answer always resets to the 1-day slot; a correct one advances.
 * Returns null when the card graduated (correct at the last interval).
 */
export function review(
  prev: SrsCard | undefined,
  input: { id: string; nodeId: string; kind: SrsItemKind; correct: boolean; at: number },
): SrsCard | null {
  const { id, nodeId, kind, correct, at } = input;
  const base: SrsCard = prev ?? {
    id,
    nodeId,
    kind,
    stage: 0,
    dueAt: at,
    lapses: 0,
    reviews: 0,
    lastResult: correct ? 'correct' : 'wrong',
    updatedAt: at,
  };

  if (!correct) {
    return {
      ...base,
      nodeId,
      kind,
      stage: 1,
      dueAt: dueFromStage(1, at),
      lapses: base.lapses + 1,
      reviews: base.reviews + 1,
      lastResult: 'wrong',
      updatedAt: at,
    };
  }

  // Correct answers on a card that was never failed do not create a card.
  if (!prev) return null;

  const nextStage = base.stage + 1;
  if (nextStage > SRS_INTERVALS_DAYS.length) return null; // graduated

  return {
    ...base,
    nodeId,
    kind,
    stage: nextStage,
    dueAt: dueFromStage(nextStage, at),
    reviews: base.reviews + 1,
    lastResult: 'correct',
    updatedAt: at,
  };
}

export function isDue(card: SrsCard, at: number): boolean {
  return dayIndex(card.dueAt) <= dayIndex(at);
}

export function dueCards(cards: Record<string, SrsCard>, at: number): SrsCard[] {
  return Object.values(cards)
    .filter((c) => isDue(c, at))
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id));
}

export function nextDueAt(cards: Record<string, SrsCard>): number | null {
  const values = Object.values(cards);
  if (values.length === 0) return null;
  return values.reduce((min, c) => Math.min(min, c.dueAt), Number.POSITIVE_INFINITY);
}
