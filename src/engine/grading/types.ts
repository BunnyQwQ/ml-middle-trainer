/** Verdicts, in the ejudge tradition. */
export type Verdict = 'OK' | 'WA' | 'RE' | 'TL' | 'PENDING';

export type Cell = string | number | boolean | null;

export type ResultSet = {
  columns: string[];
  rows: Cell[][];
};

export type TestOutcome = {
  /** Name shown to the user: the sample test or a hidden one. */
  name: string;
  hidden: boolean;
  verdict: Verdict;
  /** Set for RE and for engine failures. */
  message?: string;
  /** Set for WA on a visible test, so the user can see the difference. */
  diff?: ResultDiff;
};

export type ResultDiff =
  | { kind: 'columns'; expected: number; actual: number }
  | { kind: 'rows'; expected: number; actual: number }
  | { kind: 'cell'; row: number; expectedRow: Cell[]; actualRow: Cell[] };

export type Submission = {
  verdict: Verdict;
  tests: TestOutcome[];
  passed: number;
  total: number;
  /** Raw engine error, if the whole run could not start. */
  engineError?: string;
  /** Result of the user's query on the open sample, always shown when present. */
  sampleOutput?: ResultSet;
  /** Expected result on the open sample, shown on WA. */
  sampleExpected?: ResultSet;
  /** Captured stdout for Python submissions. */
  stdout?: string;
  elapsedMs: number;
};

export function emptySubmission(): Submission {
  return { verdict: 'PENDING', tests: [], passed: 0, total: 0, elapsedMs: 0 };
}
