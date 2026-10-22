/**
 * Ids of the interactive blocks. Kept in a plain module (no JSX) so the
 * content checker can validate references without importing React.
 */
export const SIM_IDS = [
  // statistics
  'distribution-explorer',
  'sampling-noise',
  'clt',
  'clt-error-decay',
  'ci-coverage',
  'ci-width',
  'ci-wald-vs-wilson',
  // a/b testing
  'randomization-unit',
  'power-curve',
  'mde-calculator',
  'error-areas',
  'aa-test',
  'aa-broken',
  'srm-check',
  // sql
  'join-explorer',
  'ctr-definitions',
  'window-functions',
  'position-share',
  'session-gaps',
  'ratio-of-sums',
  // inference
  'pvalue-distribution',
  'significance-vs-truth',
  'test-comparison',
  'bootstrap-ci',
  // experiment practice
  'peeking',
  'peeking-paths',
  'multiple-comparisons',
  'ratio-variance',
  'cuped',
  'novelty-effect',
  'weekday-seasonality',
  // search quality
  'precision-recall-k',
  'mrr-map',
  'ndcg-reorder',
  'discount-curves',
  'position-bias',
  'rater-agreement',
  'offline-online',
  'interleaving-sim',
  // product metrics
  'metric-decomposition',
  // ads
  'ecpm-ranking',
  'auction-sim',
  'reliability-diagram',
  'calibration-money',
  'ad-load',
  // retrieval
  'bm25-explorer',
  'two-stage',
  'ann-ivf',
  'ann-hnsw',
  'pq-quantization',
  // bandits
  'epsilon-tradeoff',
  'bandit-regret',
  'thompson-posteriors',
  'nonstationary-bandit',
  // query classification
  'imbalance-pr-roc',
  'macro-micro',
  'threshold-coverage',
  // testing
  'mutation-testing',
  'fixture-scope',
  'data-checks',
  // deep learning
  'activations',
  'init-symmetry',
] as const;

export type SimId = (typeof SIM_IDS)[number];

export function isSimId(value: string): value is SimId {
  return (SIM_IDS as readonly string[]).includes(value);
}
