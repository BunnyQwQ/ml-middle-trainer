import { create } from 'zustand';
import { storageGet, storageRemove, storageSet } from './storage';
import { dayIndex, review, type SrsCard, type SrsItemKind } from './srs';
import { betterRun, finishRun, startRun } from './contest';

export const PROGRESS_KEY = 'mlmt.progress.v1';
export const PROGRESS_SCHEMA_VERSION = 1;

export type ItemProgress = {
  attempts: number;
  solved: boolean;
  /** Solved without a single wrong attempt. Drives stars and weak spots. */
  firstTry: boolean;
  lastAt: number;
};

export type NodeProgress = {
  items: Record<string, ItemProgress>;
  stars: 0 | 1 | 2 | 3;
  completedAt: number | null;
  startedAt: number;
};

/** One attempt at a boss contest. Only the best run per boss is kept. */
export type ContestRun = {
  nodeId: string;
  startedAt: number;
  /** null while the clock is still running. */
  finishedAt: number | null;
  solved: number;
  total: number;
  /** Wall-clock milliseconds used, capped at the limit. */
  elapsedMs: number;
  /** Solved everything before the clock ran out. */
  passed: boolean;
};

export type ProgressData = {
  version: number;
  xp: number;
  nodes: Record<string, NodeProgress>;
  srs: Record<string, SrsCard>;
  /** Contest state per boss: the run in progress and the best finished one. */
  contests: Record<string, { current: ContestRun | null; best: ContestRun | null }>;
  /** Unsent editor contents, keyed by task id. Survives reloads and language switches. */
  drafts: Record<string, string>;
  /** Free-text answers to case studies. */
  answers: Record<string, string>;
  streak: { lastDay: number | null; current: number; best: number };
  updatedAt: number;
};

export function emptyProgress(): ProgressData {
  return {
    version: PROGRESS_SCHEMA_VERSION,
    xp: 0,
    nodes: {},
    srs: {},
    contests: {},
    drafts: {},
    answers: {},
    streak: { lastDay: null, current: 0, best: 0 },
    updatedAt: 0,
  };
}

/** Level thresholds grow linearly: level n needs 100 * n(n+1)/2 xp. */
export function levelFor(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let spent = 0;
  for (;;) {
    const need = 100 * level;
    if (xp - spent < need) return { level, into: xp - spent, need };
    spent += need;
    level += 1;
  }
}

export const XP = {
  quizFirstTry: 10,
  quizLate: 4,
  codeFirstTry: 30,
  codeLate: 12,
  caseSubmit: 15,
  nodeStar: 15,
} as const;

export function starsFor(items: Record<string, ItemProgress>, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const solved = Object.values(items).filter((i) => i.solved).length;
  if (solved < total) return 0;
  const firstTry = Object.values(items).filter((i) => i.solved && i.firstTry).length;
  const share = firstTry / total;
  if (share >= 0.9) return 3;
  if (share >= 0.6) return 2;
  return 1;
}

type AttemptInput = {
  nodeId: string;
  itemId: string;
  kind: SrsItemKind;
  correct: boolean;
  /** Total number of graded items in the node, used for stars. */
  nodeItemCount: number;
  at?: number;
};

type Store = {
  data: ProgressData;
  ready: boolean;
  hydrate: () => Promise<void>;
  recordAttempt: (input: AttemptInput) => { xpGained: number; stars: 0 | 1 | 2 | 3 };
  startContest: (nodeId: string, total: number, at?: number) => void;
  finishContest: (nodeId: string, solved: number, minutes: number, at?: number) => void;
  setDraft: (itemId: string, code: string) => void;
  setAnswer: (itemId: string, text: string) => void;
  touchStreak: (at?: number) => void;
  replaceAll: (next: ProgressData) => void;
  wipe: () => void;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(data: ProgressData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void storageSet(PROGRESS_KEY, JSON.stringify(data)).catch(() => undefined);
  }, 150);
}

export const useProgress = create<Store>((set, get) => ({
  data: emptyProgress(),
  ready: false,

  hydrate: async () => {
    let loaded = emptyProgress();
    try {
      const raw = await storageGet(PROGRESS_KEY);
      if (raw) loaded = migrate(JSON.parse(raw) as unknown);
    } catch {
      loaded = emptyProgress();
    }
    set({ data: loaded, ready: true });
  },

  recordAttempt: (input) => {
    const at = input.at ?? Date.now();
    const { nodeId, itemId, kind, correct, nodeItemCount } = input;
    const data = structuredCloneSafe(get().data);

    const node: NodeProgress =
      data.nodes[nodeId] ?? { items: {}, stars: 0, completedAt: null, startedAt: at };
    const prevItem = node.items[itemId];
    const firstAttempt = !prevItem;

    const item: ItemProgress = {
      attempts: (prevItem?.attempts ?? 0) + 1,
      solved: prevItem?.solved || correct,
      firstTry: prevItem ? prevItem.firstTry && (prevItem.solved || correct) : correct,
      lastAt: at,
    };
    node.items[itemId] = item;

    let xpGained = 0;
    const newlySolved = correct && !prevItem?.solved;
    if (newlySolved) {
      const isCode = kind === 'sql' || kind === 'python';
      if (kind === 'case') xpGained = XP.caseSubmit;
      else if (firstAttempt) xpGained = isCode ? XP.codeFirstTry : XP.quizFirstTry;
      else xpGained = isCode ? XP.codeLate : XP.quizLate;
    }

    const prevStars = node.stars;
    const stars = starsFor(node.items, nodeItemCount);
    node.stars = stars;
    if (stars > 0 && node.completedAt === null) node.completedAt = at;
    if (stars > prevStars) xpGained += (stars - prevStars) * XP.nodeStar;

    data.nodes[nodeId] = node;
    data.xp += xpGained;

    const card = review(data.srs[itemId], { id: itemId, nodeId, kind, correct, at });
    if (card) data.srs[itemId] = card;
    else delete data.srs[itemId];

    data.updatedAt = at;
    applyStreak(data, at);
    set({ data });
    scheduleSave(data);
    return { xpGained, stars };
  },

  startContest: (nodeId, total, at = Date.now()) => {
    const data = structuredCloneSafe(get().data);
    const slot = data.contests[nodeId] ?? { current: null, best: null };
    slot.current = startRun(nodeId, total, at);
    data.contests[nodeId] = slot;
    data.updatedAt = at;
    set({ data });
    scheduleSave(data);
  },

  finishContest: (nodeId, solved, minutes, at = Date.now()) => {
    const data = structuredCloneSafe(get().data);
    const slot = data.contests[nodeId] ?? { current: null, best: null };
    if (!slot.current) return;
    const done = finishRun(slot.current, solved, minutes, at);
    slot.best = betterRun(slot.best, done);
    slot.current = null;
    data.contests[nodeId] = slot;
    data.updatedAt = at;
    set({ data });
    scheduleSave(data);
  },

  setDraft: (itemId, code) => {
    const data = { ...get().data, drafts: { ...get().data.drafts, [itemId]: code } };
    set({ data });
    scheduleSave(data);
  },

  setAnswer: (itemId, text) => {
    const data = { ...get().data, answers: { ...get().data.answers, [itemId]: text } };
    set({ data });
    scheduleSave(data);
  },

  touchStreak: (at) => {
    const data = structuredCloneSafe(get().data);
    if (applyStreak(data, at ?? Date.now())) {
      set({ data });
      scheduleSave(data);
    }
  },

  replaceAll: (next) => {
    const data = migrate(next);
    set({ data });
    scheduleSave(data);
  },

  wipe: () => {
    const data = emptyProgress();
    set({ data });
    void storageRemove(PROGRESS_KEY).catch(() => undefined);
  },
}));

/** Returns true when the streak changed. */
function applyStreak(data: ProgressData, at: number): boolean {
  const today = dayIndex(at);
  const last = data.streak.lastDay;
  if (last === today) return false;
  const current = last !== null && today - last === 1 ? data.streak.current + 1 : 1;
  data.streak = { lastDay: today, current, best: Math.max(current, data.streak.best) };
  return true;
}

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

/**
 * Accept anything that claims to be progress and return something usable.
 * Imported files come from the user, so every field is treated as suspect.
 */
export function migrate(input: unknown): ProgressData {
  const base = emptyProgress();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<ProgressData> & { data?: unknown };
  // Export wraps payload in { version, exportedAt, data }.
  const body = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Partial<ProgressData>;

  const out: ProgressData = {
    ...base,
    version: PROGRESS_SCHEMA_VERSION,
    xp: numberOr(body.xp, 0),
    updatedAt: numberOr(body.updatedAt, 0),
  };

  if (body.nodes && typeof body.nodes === 'object') {
    for (const [id, node] of Object.entries(body.nodes)) {
      if (!node || typeof node !== 'object') continue;
      const n = node as Partial<NodeProgress>;
      const items: Record<string, ItemProgress> = {};
      for (const [itemId, item] of Object.entries(n.items ?? {})) {
        if (!item || typeof item !== 'object') continue;
        const it = item as Partial<ItemProgress>;
        items[itemId] = {
          attempts: numberOr(it.attempts, 0),
          solved: Boolean(it.solved),
          firstTry: Boolean(it.firstTry),
          lastAt: numberOr(it.lastAt, 0),
        };
      }
      const stars = numberOr(n.stars, 0);
      out.nodes[id] = {
        items,
        stars: (stars >= 0 && stars <= 3 ? stars : 0) as 0 | 1 | 2 | 3,
        completedAt: typeof n.completedAt === 'number' ? n.completedAt : null,
        startedAt: numberOr(n.startedAt, 0),
      };
    }
  }

  if (body.srs && typeof body.srs === 'object') {
    for (const [id, card] of Object.entries(body.srs)) {
      if (!card || typeof card !== 'object') continue;
      const c = card as Partial<SrsCard>;
      if (typeof c.dueAt !== 'number') continue;
      out.srs[id] = {
        id,
        nodeId: typeof c.nodeId === 'string' ? c.nodeId : '',
        kind: (c.kind ?? 'quiz') as SrsItemKind,
        stage: numberOr(c.stage, 1),
        dueAt: c.dueAt,
        lapses: numberOr(c.lapses, 0),
        reviews: numberOr(c.reviews, 0),
        lastResult: c.lastResult === 'correct' ? 'correct' : 'wrong',
        updatedAt: numberOr(c.updatedAt, 0),
      };
    }
  }

  if (body.contests && typeof body.contests === 'object') {
    for (const [id, slot] of Object.entries(body.contests)) {
      if (!slot || typeof slot !== 'object') continue;
      const s = slot as Partial<ProgressData['contests'][string]>;
      out.contests[id] = { current: migrateRun(s.current, id), best: migrateRun(s.best, id) };
    }
  }

  for (const key of ['drafts', 'answers'] as const) {
    const src = body[key];
    if (src && typeof src === 'object') {
      for (const [id, text] of Object.entries(src)) {
        if (typeof text === 'string') out[key][id] = text;
      }
    }
  }

  if (body.streak && typeof body.streak === 'object') {
    const s = body.streak as Partial<ProgressData['streak']>;
    out.streak = {
      lastDay: typeof s.lastDay === 'number' ? s.lastDay : null,
      current: numberOr(s.current, 0),
      best: numberOr(s.best, 0),
    };
  }

  return out;
}

function migrateRun(value: unknown, nodeId: string): ContestRun | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as Partial<ContestRun>;
  if (typeof r.startedAt !== 'number') return null;
  return {
    nodeId,
    startedAt: r.startedAt,
    finishedAt: typeof r.finishedAt === 'number' ? r.finishedAt : null,
    solved: numberOr(r.solved, 0),
    total: numberOr(r.total, 0),
    elapsedMs: numberOr(r.elapsedMs, 0),
    passed: Boolean(r.passed),
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export type ExportFile = {
  app: 'ml-middle-trainer';
  version: number;
  exportedAt: string;
  data: ProgressData;
};

export function buildExport(data: ProgressData): ExportFile {
  return {
    app: 'ml-middle-trainer',
    version: PROGRESS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}
