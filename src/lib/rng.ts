/**
 * Deterministic RNG shared by the simulators, the write-ups and the dataset
 * generators. Every number shown to the user is computed from a seed, so the
 * text and the picture can never drift apart.
 */

export type Rng = {
  /** Uniform on [0, 1). */
  next: () => number;
  int: (maxExclusive: number) => number;
  pick: <T>(items: readonly T[]) => T;
  normal: (mu?: number, sigma?: number) => number;
  exponential: (rate?: number) => number;
  bernoulli: (p: number) => 0 | 1;
  lognormal: (mu?: number, sigma?: number) => number;
  poisson: (lambda: number) => number;
  shuffle: <T>(items: T[]) => T[];
};

/** mulberry32: small, fast, good enough for teaching material. */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const normal = (mu = 0, sigma = 1) => {
    // Box-Muller; u is nudged off zero so log() stays finite.
    const u = 1 - next();
    const v = next();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const rng: Rng = {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    pick: (items) => items[Math.floor(next() * items.length)],
    normal,
    exponential: (rate = 1) => -Math.log(1 - next()) / rate,
    bernoulli: (p) => (next() < p ? 1 : 0),
    lognormal: (mu = 0, sigma = 1) => Math.exp(normal(mu, sigma)),
    poisson: (lambda) => {
      // Knuth, fine for the small lambdas used here.
      const limit = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k += 1;
        p *= next();
      } while (p > limit);
      return k - 1;
    },
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items;
    },
  };
  return rng;
}

/** Stable 32-bit hash, used to turn a string id into a seed. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
