/**
 * Content gate. Fails the build when authored content is incomplete, which in
 * practice means: a missing translation, a dangling prerequisite, a quiz whose
 * correct answer is not among its choices, or a link to a domain we have not
 * vetted.
 *
 * Run: npm run check:content
 */
import { BRANCHES } from '@/content/branches';
import { DATASETS } from '@/content/datasets';
import { NODES } from '@/content/graph';
import { SIM_IDS } from '@/content/sims';
import type { SkillNode, Task } from '@/content/types';
import { UI, flattenL } from '@/i18n/ui';
import { isL } from '@/i18n/types';

const problems: string[] = [];

function fail(where: string, what: string) {
  problems.push(`${where}: ${what}`);
}

/* ------------------------------------------------- both languages present -- */

function checkLocalized(label: string, value: unknown) {
  for (const { path, value: pair } of flattenL(value)) {
    const where = path ? `${label}.${path}` : label;
    if (!pair.ru || pair.ru.trim().length === 0) fail(where, 'empty ru');
    if (!pair.en || pair.en.trim().length === 0) fail(where, 'empty en');
    // same() marks a value that is meant to read identically in both languages.
    if (!pair.same && pair.ru.trim() === pair.en.trim() && pair.ru.trim().length > 25) {
      fail(where, 'ru and en are identical, looks like a forgotten translation');
    }
  }
}

checkLocalized('UI', UI);
checkLocalized('BRANCHES', BRANCHES);
for (const node of NODES) checkLocalized(`node ${node.id}`, node);
checkLocalized('DATASETS', DATASETS);

/* --------------------------------------------------------- ids and graph -- */

const seenNodes = new Set<string>();
const seenTasks = new Set<string>();

for (const node of NODES) {
  if (seenNodes.has(node.id)) fail(`node ${node.id}`, 'duplicate node id');
  seenNodes.add(node.id);
  if (!BRANCHES.some((b) => b.id === node.branch)) {
    fail(`node ${node.id}`, `unknown branch ${node.branch}`);
  }
  if (node.theory.length === 0) fail(`node ${node.id}`, 'no theory blocks');
  if (node.tasks.length === 0) fail(`node ${node.id}`, 'no tasks');

  const interactives = node.theory.filter((b) => b.type === 'sim').length;
  if (interactives === 0) {
    fail(`node ${node.id}`, 'no interactive blocks in the theory');
  }

  for (const task of node.tasks) {
    if (seenTasks.has(task.id)) fail(`task ${task.id}`, 'duplicate task id');
    seenTasks.add(task.id);
    if (!task.id.startsWith(node.id)) {
      fail(`task ${task.id}`, `task id must start with its node id (${node.id})`);
    }
  }
}

for (const node of NODES) {
  for (const req of node.requires) {
    if (!seenNodes.has(req)) {
      fail(`node ${node.id}`, `prerequisite ${req} does not exist`);
      continue;
    }
    const prior = NODES.find((n) => n.id === req);
    // The sequence only holds if nothing depends on a later act.
    if (prior && prior.act > node.act) {
      fail(`node ${node.id}`, `prerequisite ${req} lives in a later act (${prior.act} > ${node.act})`);
    }
  }
  if (node.unlockLevel !== undefined && node.requires.length === 0) {
    fail(`node ${node.id}`, 'unlockLevel on a node that has no prerequisites to bypass');
  }
}

/* -------------------------------------------------------------- the bosses -- */

for (const act of [1, 2, 3] as const) {
  const bosses = NODES.filter((n) => n.boss && n.act === act);
  if (bosses.length === 0) fail('acts', `act ${act} has no boss to close it`);
  if (bosses.length > 1) fail('acts', `act ${act} has ${bosses.length} bosses`);
}

for (const node of NODES.filter((n) => n.boss)) {
  const where = `boss ${node.id}`;
  if (node.branch !== 'boss') fail(where, 'a boss must live in the boss branch');
  if (node.tasks.length < 3) fail(where, 'a boss needs at least three tasks');
  const branchesPulled = new Set(
    node.requires.map((r) => NODES.find((n) => n.id === r)?.branch).filter(Boolean),
  );
  if (branchesPulled.size < 2) {
    fail(where, 'a boss must draw its prerequisites from at least two branches');
  }
  const kinds = new Set(node.tasks.map((t) => t.kind));
  if (kinds.size < 3) fail(where, 'a boss should mix at least three task kinds');
}

// Nodes that open an act must depend on the previous act's boss (or be first).
for (const node of NODES.filter((n) => !n.boss && n.act > 1)) {
  const sameActPrereq = node.requires.some(
    (r) => NODES.find((n) => n.id === r)?.act === node.act,
  );
  const gatedByBoss = node.requires.some((r) => NODES.find((n) => n.id === r)?.boss);
  if (!sameActPrereq && !gatedByBoss) {
    fail(`node ${node.id}`, 'starts an act without depending on the previous act boss');
  }
}

// A cycle in the prerequisite graph would lock a branch forever.
const WHITE = 0;
const GREY = 1;
const BLACK = 2;
const colour = new Map<string, number>(NODES.map((n) => [n.id, WHITE]));
const byId = new Map<string, SkillNode>(NODES.map((n) => [n.id, n]));

function visit(id: string, stack: string[]) {
  const state = colour.get(id);
  if (state === GREY) {
    fail('graph', `prerequisite cycle: ${[...stack, id].join(' -> ')}`);
    return;
  }
  if (state === BLACK) return;
  colour.set(id, GREY);
  for (const req of byId.get(id)?.requires ?? []) visit(req, [...stack, id]);
  colour.set(id, BLACK);
}

for (const node of NODES) visit(node.id, []);

/* ------------------------------------------------------------ task shapes -- */

function checkTask(node: SkillNode, task: Task) {
  const where = `task ${task.id}`;
  switch (task.kind) {
    case 'quiz': {
      if (task.mode === 'number') {
        if (typeof task.value !== 'number') fail(where, 'number quiz without a value');
        if (typeof task.tolerance !== 'number') fail(where, 'number quiz without a tolerance');
        if (task.choices) fail(where, 'number quiz must not have choices');
      } else {
        const choices = task.choices ?? [];
        if (choices.length < 2) fail(where, 'fewer than two choices');
        const ids = new Set(choices.map((c) => c.id));
        if (ids.size !== choices.length) fail(where, 'duplicate choice ids');
        const correct = task.correct ?? [];
        if (correct.length === 0) fail(where, 'no correct answer');
        for (const id of correct) {
          if (!ids.has(id)) fail(where, `correct answer ${id} is not among the choices`);
        }
        if (task.mode === 'single' && correct.length !== 1) {
          fail(where, 'single-choice quiz with more than one correct answer');
        }
        if (task.mode === 'multi' && correct.length === choices.length) {
          fail(where, 'every choice is correct, the question is vacuous');
        }
      }
      if (!task.explanation) fail(where, 'no explanation');
      break;
    }
    case 'sql': {
      if (!DATASETS[task.dataset]) fail(where, `unknown dataset ${task.dataset}`);
      for (const hidden of task.hiddenDatasets) {
        if (!DATASETS[hidden]) fail(where, `unknown hidden dataset ${hidden}`);
      }
      if (task.hiddenDatasets.length === 0) fail(where, 'no hidden tests');
      if (task.hiddenDatasets.includes(task.dataset)) {
        fail(where, 'the sample dataset is also used as a hidden test');
      }
      if (task.reference.trim().length === 0) fail(where, 'empty reference solution');
      if (task.starter.trim().length === 0) fail(where, 'empty starter');
      if (normalize(task.starter) === normalize(task.reference)) {
        fail(where, 'the starter is the reference solution');
      }
      if (task.orderMatters && !/order\s+by/i.test(task.reference)) {
        fail(where, 'orderMatters is set but the reference has no ORDER BY');
      }
      break;
    }
    case 'python': {
      if (task.reference.trim().length === 0) fail(where, 'empty reference solution');
      if (task.tests.trim().length === 0) fail(where, 'no hidden tests');
      if (task.sampleTests.trim().length === 0) fail(where, 'no sample tests');
      if (normalize(task.starter) === normalize(task.reference)) {
        fail(where, 'the starter is the reference solution');
      }
      const fnName = task.signature.match(/def\s+([A-Za-z_][A-Za-z0-9_]*)/)?.[1];
      if (!fnName) fail(where, 'signature does not declare a function');
      else {
        if (!task.reference.includes(fnName)) fail(where, 'reference does not define the function');
        if (!task.tests.includes(fnName)) fail(where, 'hidden tests never call the function');
      }
      break;
    }
    case 'case': {
      if (task.checklist.length < 3) fail(where, 'checklist shorter than three items');
      break;
    }
    case 'findbug': {
      const lines = task.code.split('\n').length;
      if (task.buggyLines.length === 0) fail(where, 'no buggy line marked');
      for (const line of task.buggyLines) {
        if (line < 1 || line > lines) fail(where, `buggy line ${line} outside the code (1..${lines})`);
      }
      break;
    }
    case 'metric-pick': {
      if (task.options.length < 5) fail(where, 'fewer than five metrics in the pool');
      const ids = new Set(task.options.map((o) => o.id));
      if (ids.size !== task.options.length) fail(where, 'duplicate option ids');
      for (const slot of ['offline', 'online'] as const) {
        const fitting = task.options.filter((o) => o.correctFor.includes(slot));
        if (fitting.length === 0) fail(where, `no option is valid for the ${slot} slot`);
        if (fitting.length === task.options.length) {
          fail(where, `every option is valid for the ${slot} slot, the question is vacuous`);
        }
      }
      const guardrails = task.options.filter((o) => o.correctFor.includes('guardrail'));
      if (guardrails.length < task.guardrailCount) {
        fail(where, 'fewer valid guardrails than the task asks the user to pick');
      }
      if (task.guardrailCount < 1) fail(where, 'guardrailCount must be at least one');
      const wrong = task.options.filter((o) => o.correctFor.length === 0);
      if (wrong.length === 0) fail(where, 'no distractor options at all');
      break;
    }
    default: {
      fail(where, `unknown task kind on node ${node.id}`);
    }
  }
}

for (const node of NODES) for (const task of node.tasks) checkTask(node, task);

function normalize(code: string): string {
  return code.replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------ simulators -- */

for (const node of NODES) {
  for (const block of node.theory) {
    if (block.type === 'sim' && !(SIM_IDS as readonly string[]).includes(block.sim)) {
      fail(`node ${node.id}`, `unknown simulator id ${block.sim}`);
    }
  }
}

/* ---------------------------------------------------------------- sources -- */

/**
 * Only domains that were actually checked by hand. A new source means adding
 * its domain here on purpose, which is the point: no invented links.
 */
const ALLOWED_SOURCE_HOSTS = [
  'experimentguide.com',
  'exp-platform.com',
  'greenteapress.com',
  'docs.scipy.org',
  'en.wikipedia.org',
  'duckdb.org',
  'clickhouse.com',
  'pyodide.org',
  'www.statlearning.com',
  'scikit-learn.org',
  'pandas.pydata.org',
  'docs.pytest.org',
];

for (const node of NODES) {
  for (const source of node.sources ?? []) {
    let host: string;
    try {
      const url = new URL(source.url);
      host = url.host;
      if (url.protocol !== 'https:') fail(`node ${node.id}`, `source is not https: ${source.url}`);
    } catch {
      fail(`node ${node.id}`, `malformed source url: ${source.url}`);
      continue;
    }
    if (!ALLOWED_SOURCE_HOSTS.includes(host)) {
      fail(`node ${node.id}`, `source host not in the vetted list: ${host}`);
    }
    if (source.note && !isL(source.note)) fail(`node ${node.id}`, 'source note is not localized');
  }
}

/* ------------------------------------------------------------------ report -- */

const counts = {
  branches: BRANCHES.length,
  readyBranches: BRANCHES.filter((b) => b.status === 'ready').length,
  nodes: NODES.length,
  tasks: NODES.reduce((acc, n) => acc + n.tasks.length, 0),
  interactives: NODES.reduce(
    (acc, n) => acc + n.theory.filter((b) => b.type === 'sim').length,
    0,
  ),
  localizedStrings: flattenL(NODES).length + flattenL(UI).length + flattenL(BRANCHES).length,
};

console.log('content check');
console.log(
  `  branches ${counts.branches} (ready ${counts.readyBranches}), nodes ${counts.nodes}, ` +
    `tasks ${counts.tasks}, interactive blocks ${counts.interactives}, ` +
    `localized pairs ${counts.localizedStrings}`,
);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log('  ok');
