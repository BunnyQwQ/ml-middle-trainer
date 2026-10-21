import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  SRS_INTERVALS_DAYS,
  dueCards,
  isDue,
  nextDueAt,
  review,
  type SrsCard,
} from '@/progress/srs';

const BASE = new Date(2026, 2, 2, 14, 30).getTime(); // a Monday afternoon

function daysBetween(from: number, to: number): number {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

describe('spaced repetition', () => {
  it('does not create a card when the answer is right the first time', () => {
    const card = review(undefined, {
      id: 'q1',
      nodeId: 'n',
      kind: 'quiz',
      correct: true,
      at: BASE,
    });
    expect(card).toBeNull();
  });

  it('schedules a mistake for tomorrow', () => {
    const card = review(undefined, {
      id: 'q1',
      nodeId: 'n',
      kind: 'quiz',
      correct: false,
      at: BASE,
    });
    expect(card).not.toBeNull();
    expect(card!.stage).toBe(1);
    expect(daysBetween(BASE, card!.dueAt)).toBe(1);
    expect(card!.lapses).toBe(1);
  });

  it('walks the 1 / 3 / 7 / 14 ladder and then graduates', () => {
    let card = review(undefined, { id: 'q', nodeId: 'n', kind: 'quiz', correct: false, at: BASE })!;
    const seen: number[] = [daysBetween(BASE, card.dueAt)];

    let at = BASE;
    for (let step = 1; step < SRS_INTERVALS_DAYS.length; step += 1) {
      at = card.dueAt + 3600_000;
      const next = review(card, { id: 'q', nodeId: 'n', kind: 'quiz', correct: true, at });
      expect(next).not.toBeNull();
      card = next!;
      seen.push(daysBetween(at, card.dueAt));
    }

    expect(seen).toEqual([...SRS_INTERVALS_DAYS]);

    const graduated = review(card, {
      id: 'q',
      nodeId: 'n',
      kind: 'quiz',
      correct: true,
      at: card.dueAt + 3600_000,
    });
    expect(graduated).toBeNull();
  });

  it('resets to one day after a relapse at any stage', () => {
    let card = review(undefined, { id: 'q', nodeId: 'n', kind: 'quiz', correct: false, at: BASE })!;
    card = review(card, { id: 'q', nodeId: 'n', kind: 'quiz', correct: true, at: card.dueAt })!;
    card = review(card, { id: 'q', nodeId: 'n', kind: 'quiz', correct: true, at: card.dueAt })!;
    expect(card.stage).toBe(3);

    const relapseAt = card.dueAt;
    const after = review(card, { id: 'q', nodeId: 'n', kind: 'quiz', correct: false, at: relapseAt })!;
    expect(after.stage).toBe(1);
    expect(daysBetween(relapseAt, after.dueAt)).toBe(1);
    expect(after.lapses).toBe(2);
  });

  it('treats a card as due for the whole day it falls on', () => {
    const card = review(undefined, { id: 'q', nodeId: 'n', kind: 'quiz', correct: false, at: BASE })!;
    const dueDayEarlyMorning = new Date(card.dueAt);
    dueDayEarlyMorning.setHours(0, 5, 0, 0);
    const dueDayLateNight = new Date(card.dueAt);
    dueDayLateNight.setHours(23, 55, 0, 0);

    expect(isDue(card, BASE)).toBe(false);
    expect(isDue(card, dueDayEarlyMorning.getTime())).toBe(true);
    expect(isDue(card, dueDayLateNight.getTime())).toBe(true);
    // Overdue cards stay due.
    expect(isDue(card, card.dueAt + 10 * DAY_MS)).toBe(true);
  });

  it('lists due cards oldest first and reports the next deadline', () => {
    const cards: Record<string, SrsCard> = {};
    for (const [i, id] of ['a', 'b', 'c'].entries()) {
      const card = review(undefined, {
        id,
        nodeId: 'n',
        kind: 'quiz',
        correct: false,
        at: BASE - i * DAY_MS,
      })!;
      cards[id] = card;
    }
    const due = dueCards(cards, BASE + DAY_MS);
    expect(due.map((c) => c.id)).toEqual(['c', 'b', 'a']);
    expect(nextDueAt(cards)).toBe(cards.c.dueAt);
  });
});
