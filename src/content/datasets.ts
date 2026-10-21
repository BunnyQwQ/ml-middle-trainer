import { l, type L } from '@/i18n/types';
import { makeRng } from '@/lib/rng';

/**
 * Synthetic marketplace search logs. Everything is generated from a seed, so
 * the sample database the user sees and the hidden grading databases come from
 * the same code and can never disagree about the schema.
 *
 * No real data of any kind is involved: queries, categories and prices are
 * made up here.
 */

export type ColumnDoc = { name: string; type: string; note: L };

export type TableDoc = { name: string; note: L; columns: ColumnDoc[] };

export type Dataset = {
  id: string;
  title: L;
  tables: TableDoc[];
  /** Full DDL + data. Built lazily because the hidden sets are large. */
  setupSql: () => string;
};

const CATEGORIES = [
  { id: 1, name: 'electronics/phones' },
  { id: 2, name: 'electronics/laptops' },
  { id: 3, name: 'home/kitchen' },
  { id: 4, name: 'clothes/shoes' },
  { id: 5, name: 'beauty/care' },
];

const QUERY_TEXTS = [
  'iphone 15',
  'laptop 16gb ram',
  'coffee grinder',
  'running shoes 42',
  'face cream spf',
  'usb c cable',
  'air fryer',
  'winter jacket',
  'shampoo dry hair',
  'monitor 27',
];

/** Per-position click-through rate: a steep decay, as real search logs show. */
function positionCtr(position: number, isAd: boolean): number {
  const base = 0.30 / Math.pow(position, 0.85);
  return isAd ? base * 0.75 : base;
}

type GenConfig = {
  seed: number;
  days: number;
  users: number;
  queriesPerUser: number;
};

function quote(text: string): string {
  return `'${text.replace(/'/g, "''")}'`;
}

function ts(dayStart: Date, dayOffset: number, secondsIntoDay: number): string {
  const d = new Date(dayStart.getTime());
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(0, 0, 0, 0);
  const at = new Date(d.getTime() + secondsIntoDay * 1000);
  return at.toISOString().slice(0, 19).replace('T', ' ');
}

const DDL = `
CREATE TABLE users (
  user_id      INTEGER PRIMARY KEY,
  signup_date  DATE,
  platform     VARCHAR
);
CREATE TABLE queries (
  query_id     INTEGER PRIMARY KEY,
  user_id      INTEGER,
  ts           TIMESTAMP,
  query_text   VARCHAR,
  category_id  INTEGER
);
CREATE TABLE impressions (
  impression_id INTEGER PRIMARY KEY,
  query_id      INTEGER,
  item_id       INTEGER,
  position      INTEGER,
  is_ad         BOOLEAN,
  ts            TIMESTAMP
);
CREATE TABLE clicks (
  click_id      INTEGER PRIMARY KEY,
  impression_id INTEGER,
  ts            TIMESTAMP
);
CREATE TABLE orders (
  order_id      INTEGER PRIMARY KEY,
  user_id       INTEGER,
  item_id       INTEGER,
  ts            TIMESTAMP,
  revenue       DOUBLE
);
`;

/** Build the whole database as one SQL script. */
export function generateSearchLogs(config: GenConfig): string {
  const { seed, days, users, queriesPerUser } = config;
  const rng = makeRng(seed);
  const origin = new Date(Date.UTC(2026, 2, 2)); // fixed Monday, so weekday logic is stable

  const userRows: string[] = [];
  const platforms = ['web', 'ios', 'android'] as const;
  for (let u = 1; u <= users; u += 1) {
    const signupDay = -rng.int(120) - 1;
    const d = new Date(origin.getTime());
    d.setUTCDate(d.getUTCDate() + signupDay);
    userRows.push(`(${u}, '${d.toISOString().slice(0, 10)}', ${quote(rng.pick(platforms))})`);
  }

  const queryRows: string[] = [];
  const impressionRows: string[] = [];
  const clickRows: string[] = [];
  const orderRows: string[] = [];

  let queryId = 0;
  let impressionId = 0;
  let clickId = 0;
  let orderId = 0;

  for (let day = 0; day < days; day += 1) {
    // A mild weekend dip, so grouping by day shows something to talk about.
    const weekday = (origin.getUTCDay() + day) % 7;
    const dayFactor = weekday === 5 || weekday === 6 ? 0.75 : 1;

    for (let u = 1; u <= users; u += 1) {
      const nQueries = Math.round(queriesPerUser * dayFactor * (0.4 + 1.2 * rng.next()));
      for (let q = 0; q < nQueries; q += 1) {
        queryId += 1;
        const cat = rng.pick(CATEGORIES);
        const text = rng.pick(QUERY_TEXTS);
        // Sessions: bursts of activity a few hours apart.
        const hour = 7 + rng.int(15);
        const secondsIntoDay = hour * 3600 + rng.int(3600);
        const queryTs = ts(origin, day, secondsIntoDay);
        queryRows.push(`(${queryId}, ${u}, '${queryTs}', ${quote(text)}, ${cat.id})`);

        const nShown = 6 + rng.int(5);
        for (let pos = 1; pos <= nShown; pos += 1) {
          impressionId += 1;
          // Ads sit at the top of the page.
          const isAd = pos <= 2 && rng.next() < 0.6;
          const itemId = 1000 + rng.int(400);
          const impTs = ts(origin, day, secondsIntoDay + 1);
          impressionRows.push(
            `(${impressionId}, ${queryId}, ${itemId}, ${pos}, ${isAd ? 'TRUE' : 'FALSE'}, '${impTs}')`,
          );

          if (rng.next() < positionCtr(pos, isAd)) {
            clickId += 1;
            const clickDelay = 2 + rng.int(60);
            clickRows.push(
              `(${clickId}, ${impressionId}, '${ts(origin, day, secondsIntoDay + clickDelay)}')`,
            );
            // Clicks sometimes turn into orders.
            if (rng.next() < 0.12) {
              orderId += 1;
              const revenue = (300 + rng.exponential(1 / 2500)).toFixed(2);
              orderRows.push(
                `(${orderId}, ${u}, ${itemId}, '${ts(origin, day, secondsIntoDay + clickDelay + 120)}', ${revenue})`,
              );
            }
          }
        }
      }
    }
  }

  const chunks = [DDL];
  pushInsert(chunks, 'users', userRows);
  pushInsert(chunks, 'queries', queryRows);
  pushInsert(chunks, 'impressions', impressionRows);
  pushInsert(chunks, 'clicks', clickRows);
  pushInsert(chunks, 'orders', orderRows);
  return chunks.join('\n');
}

/** DuckDB is happy with huge VALUES lists, but chunking keeps statements sane. */
function pushInsert(out: string[], table: string, rows: string[]) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    out.push(`INSERT INTO ${table} VALUES\n${rows.slice(i, i + CHUNK).join(',\n')};`);
  }
}

const SEARCH_TABLES: TableDoc[] = [
  {
    name: 'users',
    note: l('Пользователи маркетплейса.', 'Marketplace users.'),
    columns: [
      { name: 'user_id', type: 'INTEGER', note: l('Идентификатор пользователя', 'User id') },
      { name: 'signup_date', type: 'DATE', note: l('Дата регистрации', 'Signup date') },
      { name: 'platform', type: 'VARCHAR', note: l('web / ios / android', 'web / ios / android') },
    ],
  },
  {
    name: 'queries',
    note: l('Поисковые запросы: одна строка — один поиск.', 'Search queries: one row per search.'),
    columns: [
      { name: 'query_id', type: 'INTEGER', note: l('Идентификатор поиска', 'Search id') },
      { name: 'user_id', type: 'INTEGER', note: l('Кто искал', 'Who searched') },
      { name: 'ts', type: 'TIMESTAMP', note: l('Момент запроса', 'Query timestamp') },
      { name: 'query_text', type: 'VARCHAR', note: l('Текст запроса', 'Query text') },
      { name: 'category_id', type: 'INTEGER', note: l('Категория запроса', 'Query category') },
    ],
  },
  {
    name: 'impressions',
    note: l(
      'Показы: одна строка — один документ на одной позиции выдачи.',
      'Impressions: one row per document at one result position.',
    ),
    columns: [
      { name: 'impression_id', type: 'INTEGER', note: l('Идентификатор показа', 'Impression id') },
      { name: 'query_id', type: 'INTEGER', note: l('К какому поиску относится', 'Parent search') },
      { name: 'item_id', type: 'INTEGER', note: l('Показанный товар', 'Shown item') },
      { name: 'position', type: 'INTEGER', note: l('Позиция в выдаче, с 1', 'Result position, 1-based') },
      { name: 'is_ad', type: 'BOOLEAN', note: l('Рекламная позиция', 'Paid placement') },
      { name: 'ts', type: 'TIMESTAMP', note: l('Момент показа', 'Impression timestamp') },
    ],
  },
  {
    name: 'clicks',
    note: l(
      'Клики. Показ без клика в таблице просто отсутствует.',
      'Clicks. An impression without a click simply has no row here.',
    ),
    columns: [
      { name: 'click_id', type: 'INTEGER', note: l('Идентификатор клика', 'Click id') },
      { name: 'impression_id', type: 'INTEGER', note: l('По какому показу кликнули', 'Clicked impression') },
      { name: 'ts', type: 'TIMESTAMP', note: l('Момент клика', 'Click timestamp') },
    ],
  },
  {
    name: 'orders',
    note: l('Заказы с выручкой.', 'Orders with revenue.'),
    columns: [
      { name: 'order_id', type: 'INTEGER', note: l('Идентификатор заказа', 'Order id') },
      { name: 'user_id', type: 'INTEGER', note: l('Покупатель', 'Buyer') },
      { name: 'item_id', type: 'INTEGER', note: l('Товар', 'Item') },
      { name: 'ts', type: 'TIMESTAMP', note: l('Момент заказа', 'Order timestamp') },
      { name: 'revenue', type: 'DOUBLE', note: l('Выручка заказа', 'Order revenue') },
    ],
  },
];

function searchDataset(id: string, title: L, config: GenConfig): Dataset {
  return { id, title, tables: SEARCH_TABLES, setupSql: () => generateSearchLogs(config) };
}

export const DATASETS: Record<string, Dataset> = {
  'search-sample': searchDataset(
    'search-sample',
    l('Логи поиска: открытый пример', 'Search logs: sample'),
    { seed: 1, days: 7, users: 25, queriesPerUser: 2 },
  ),
  'search-hidden-1': searchDataset(
    'search-hidden-1',
    l('Логи поиска: скрытый тест 1', 'Search logs: hidden test 1'),
    { seed: 20260321, days: 14, users: 120, queriesPerUser: 3 },
  ),
  'search-hidden-2': searchDataset(
    'search-hidden-2',
    l('Логи поиска: скрытый тест 2', 'Search logs: hidden test 2'),
    { seed: 77003, days: 21, users: 40, queriesPerUser: 1 },
  ),
};

export function getDataset(id: string): Dataset {
  const ds = DATASETS[id];
  if (!ds) throw new Error(`Unknown dataset: ${id}`);
  return ds;
}
