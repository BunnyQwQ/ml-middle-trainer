import { beforeEach, describe, expect, it } from 'vitest';
import {
  XP,
  buildExport,
  emptyProgress,
  levelFor,
  migrate,
  starsFor,
  useProgress,
  type ItemProgress,
} from '@/progress/store';

function item(partial: Partial<ItemProgress>): ItemProgress {
  return { attempts: 1, solved: true, firstTry: true, lastAt: 0, ...partial };
}

beforeEach(() => {
  useProgress.setState({ data: emptyProgress(), ready: true });
});

describe('stars', () => {
  it('gives nothing until every task in the node is solved', () => {
    expect(starsFor({ a: item({}) }, 3)).toBe(0);
  });

  it('gives three stars for a clean run', () => {
    expect(starsFor({ a: item({}), b: item({}), c: item({}) }, 3)).toBe(3);
  });

  it('drops to two when some tasks took a second attempt', () => {
    expect(
      starsFor({ a: item({}), b: item({ firstTry: false }), c: item({}) }, 3),
    ).toBe(2);
  });

  it('gives one star when most tasks needed retries', () => {
    expect(
      starsFor(
        {
          a: item({ firstTry: false }),
          b: item({ firstTry: false }),
          c: item({ firstTry: false }),
        },
        3,
      ),
    ).toBe(1);
  });
});

describe('levels', () => {
  it('starts at level one and needs 100 xp for the next', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, need: 100 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(300).level).toBe(3);
  });
});

describe('recording attempts', () => {
  it('awards full xp on a first-try solve and schedules nothing', () => {
    const { xpGained } = useProgress.getState().recordAttempt({
      nodeId: 'n',
      itemId: 'n.q1',
      kind: 'quiz',
      correct: true,
      nodeItemCount: 2,
      at: Date.now(),
    });
    expect(xpGained).toBe(XP.quizFirstTry);
    expect(useProgress.getState().data.srs['n.q1']).toBeUndefined();
  });

  it('schedules a review after a mistake and pays less xp afterwards', () => {
    const state = useProgress.getState();
    const at = Date.now();
    state.recordAttempt({
      nodeId: 'n',
      itemId: 'n.q1',
      kind: 'quiz',
      correct: false,
      nodeItemCount: 2,
      at,
    });
    expect(useProgress.getState().data.srs['n.q1']).toBeDefined();

    const second = useProgress.getState().recordAttempt({
      nodeId: 'n',
      itemId: 'n.q1',
      kind: 'quiz',
      correct: true,
      nodeItemCount: 2,
      at: at + 1000,
    });
    expect(second.xpGained).toBe(XP.quizLate);
    const data = useProgress.getState().data;
    expect(data.nodes.n.items['n.q1'].solved).toBe(true);
    expect(data.nodes.n.items['n.q1'].firstTry).toBe(false);
    // The card stays until it is answered right on its due date.
    expect(data.srs['n.q1']).toBeDefined();
  });

  it('awards stars once the whole node is solved and never takes them back', () => {
    const at = Date.now();
    const s = () => useProgress.getState();
    s().recordAttempt({ nodeId: 'n', itemId: 'n.a', kind: 'quiz', correct: true, nodeItemCount: 2, at });
    expect(s().data.nodes.n.stars).toBe(0);
    s().recordAttempt({ nodeId: 'n', itemId: 'n.b', kind: 'quiz', correct: true, nodeItemCount: 2, at });
    expect(s().data.nodes.n.stars).toBe(3);
    expect(s().data.nodes.n.completedAt).not.toBeNull();

    const before = s().data.xp;
    s().recordAttempt({ nodeId: 'n', itemId: 'n.b', kind: 'quiz', correct: true, nodeItemCount: 2, at });
    expect(s().data.xp).toBe(before);
    expect(s().data.nodes.n.stars).toBe(3);
  });

  it('counts a day streak once per calendar day', () => {
    const s = () => useProgress.getState();
    const day1 = new Date(2026, 2, 2, 10).getTime();
    s().recordAttempt({ nodeId: 'n', itemId: 'n.a', kind: 'quiz', correct: true, nodeItemCount: 1, at: day1 });
    expect(s().data.streak.current).toBe(1);

    s().recordAttempt({ nodeId: 'n', itemId: 'n.a', kind: 'quiz', correct: true, nodeItemCount: 1, at: day1 + 3600_000 });
    expect(s().data.streak.current).toBe(1);

    const day2 = new Date(2026, 2, 3, 9).getTime();
    s().recordAttempt({ nodeId: 'm', itemId: 'm.a', kind: 'quiz', correct: true, nodeItemCount: 1, at: day2 });
    expect(s().data.streak.current).toBe(2);

    const day5 = new Date(2026, 2, 6, 9).getTime();
    s().recordAttempt({ nodeId: 'k', itemId: 'k.a', kind: 'quiz', correct: true, nodeItemCount: 1, at: day5 });
    expect(s().data.streak.current).toBe(1);
    expect(s().data.streak.best).toBe(2);
  });
});

describe('export and import', () => {
  it('survives a full round trip through JSON', () => {
    const s = () => useProgress.getState();
    const at = Date.now();
    s().recordAttempt({ nodeId: 'n', itemId: 'n.a', kind: 'quiz', correct: false, nodeItemCount: 2, at });
    s().recordAttempt({ nodeId: 'n', itemId: 'n.a', kind: 'quiz', correct: true, nodeItemCount: 2, at });
    s().setDraft('n.sql', 'SELECT 1');
    s().setAnswer('n.case', 'my answer');

    const file = buildExport(s().data);
    const text = JSON.stringify(file);

    useProgress.setState({ data: emptyProgress() });
    expect(useProgress.getState().data.xp).toBe(0);

    s().replaceAll(migrate(JSON.parse(text)));
    const back = s().data;
    expect(back.xp).toBe(file.data.xp);
    expect(back.drafts['n.sql']).toBe('SELECT 1');
    expect(back.answers['n.case']).toBe('my answer');
    expect(back.nodes.n.items['n.a'].firstTry).toBe(false);
    expect(Object.keys(back.srs)).toEqual(Object.keys(file.data.srs));
  });

  it('accepts a bare progress object as well as a wrapped export', () => {
    const data = { ...emptyProgress(), xp: 42 };
    expect(migrate(data).xp).toBe(42);
    expect(migrate({ app: 'ml-middle-trainer', version: 1, exportedAt: 'x', data }).xp).toBe(42);
  });

  it('does not blow up on junk input', () => {
    for (const junk of [null, 'nope', 42, [], {}, { xp: 'lots', nodes: 'broken', srs: [1, 2] }]) {
      const out = migrate(junk);
      expect(out.version).toBe(1);
      expect(typeof out.xp).toBe('number');
      expect(Number.isFinite(out.xp)).toBe(true);
      expect(out.nodes).toEqual({});
    }
  });

  it('drops srs cards that have no due date', () => {
    const out = migrate({ srs: { bad: { stage: 2 }, good: { dueAt: 123, kind: 'sql', nodeId: 'n' } } });
    expect(Object.keys(out.srs)).toEqual(['good']);
  });
});
