import type { L } from '@/i18n/types';
import type { SimId } from './sims';

export type BranchId =
  | 'stats'
  | 'ab'
  | 'sql'
  | 'search-metrics'
  | 'metric-picker'
  | 'ads'
  | 'retrieval'
  | 'bandits'
  | 'query-cls'
  | 'testing'
  | 'system-design'
  | 'product'
  | 'boosting'
  | 'mini';

export type Branch = {
  id: BranchId;
  title: L;
  blurb: L;
  /** CSS custom property name that holds the branch accent colour. */
  accent: string;
  /** 'ready' branches have content now; 'planned' ones are shown greyed out. */
  status: 'ready' | 'planned';
  /** Stage of the build plan this branch belongs to. Shown on planned cards. */
  stage: number;
  order: number;
};

/* ---------------------------------------------------------------- theory --- */

export type TheoryBlock =
  | { type: 'p'; text: L }
  | { type: 'h'; text: L }
  | { type: 'note'; tone: 'info' | 'warn' | 'key'; text: L }
  | { type: 'list'; ordered?: boolean; items: L[] }
  | { type: 'formula'; tex: string; caption?: L }
  | { type: 'code'; lang: 'python' | 'sql' | 'text'; code: string; caption?: L }
  | { type: 'table'; head: L[]; rows: L[][]; caption?: L }
  /** Interactive block: a simulator or a computed chart from the registry. */
  | { type: 'sim'; sim: SimId; title: L; caption: L };

/* ----------------------------------------------------------------- tasks --- */

export type Choice = { id: string; text: L };

export type QuizTask = {
  kind: 'quiz';
  id: string;
  mode: 'single' | 'multi' | 'number';
  prompt: L;
  choices?: Choice[];
  /** Ids of correct choices for single/multi. */
  correct?: string[];
  /** Expected value for 'number' mode. */
  value?: number;
  /** Absolute tolerance for 'number' mode. */
  tolerance?: number;
  unit?: L;
  explanation: L;
};

export type SqlTask = {
  kind: 'sql';
  id: string;
  prompt: L;
  /** Dataset shown to the user and used for the sample run. */
  dataset: string;
  /** Datasets the answer is graded on but never shown. */
  hiddenDatasets: string[];
  starter: string;
  reference: string;
  /** When false, both result sets are sorted before comparison. */
  orderMatters: boolean;
  writeup: L;
  /** How the same query looks in ClickHouse, which is what prod uses. */
  clickhouse?: { code: string; note: L };
};

export type PythonTask = {
  kind: 'python';
  id: string;
  prompt: L;
  /** Function the user must implement, e.g. 'def ctr(clicks, shows):'. */
  signature: string;
  starter: string;
  reference: string;
  /** Python asserts run against the user's module. Never shown. */
  tests: string;
  /** A visible subset of the tests, so the contract is unambiguous. */
  sampleTests: string;
  writeup: L;
};

export type CaseTask = {
  kind: 'case';
  id: string;
  prompt: L;
  reference: L;
  checklist: L[];
};

export type FindBugTask = {
  kind: 'findbug';
  id: string;
  prompt: L;
  lang: 'python' | 'sql';
  code: string;
  /** 1-based line numbers that count as the bug. */
  buggyLines: number[];
  explanation: L;
};

/** One metric in the pool a scenario offers. */
export type MetricOption = {
  id: string;
  label: L;
  /** The slots where this metric is a defensible answer. */
  correctFor: Array<MetricSlot>;
  /** Why it fits, or why it does not. Shown after the answer. */
  note: L;
};

export type MetricSlot = 'offline' | 'online' | 'guardrail';

/**
 * The metric choice trainer: a product scenario, one pool of metrics, and
 * three slots to fill — offline, online and guardrails.
 */
export type MetricPickTask = {
  kind: 'metric-pick';
  id: string;
  /** The product situation, in a few sentences. */
  scenario: L;
  /** Short label for the dedicated trainer screen. */
  area: L;
  options: MetricOption[];
  /** How many guardrail metrics the scenario expects. */
  guardrailCount: number;
  writeup: L;
};

export type Task =
  | QuizTask
  | SqlTask
  | PythonTask
  | CaseTask
  | FindBugTask
  | MetricPickTask;

export type Source = { title: string; url: string; note?: L };

export type SkillNode = {
  id: string;
  branch: BranchId;
  /** Depth inside the branch; drives the map layout. */
  tier: number;
  title: L;
  blurb: L;
  /** Node ids that must be completed first. */
  requires: string[];
  /** Timed mixed contest at the end of a branch. */
  boss?: boolean;
  theory: TheoryBlock[];
  tasks: Task[];
  sources?: Source[];
};

export function taskKindOf(task: Task): Task['kind'] {
  return task.kind;
}

/** Tasks that are graded automatically, i.e. everything but open cases. */
export function gradedTasks(node: SkillNode): Task[] {
  return node.tasks;
}
