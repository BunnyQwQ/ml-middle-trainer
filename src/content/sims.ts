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
] as const;

export type SimId = (typeof SIM_IDS)[number];

export function isSimId(value: string): value is SimId {
  return (SIM_IDS as readonly string[]).includes(value);
}
