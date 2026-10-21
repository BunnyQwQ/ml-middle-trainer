import { l, type L } from '@/i18n/types';
import { makeRng } from '@/lib/rng';

/**
 * Synthetic marketplace search logs. Everything is generated from a seed, so
 * the sample database the user sees and the hidden grading databases come from
 * the same code and can never disagree about the schema.
 *
 * The data is shaped to make the SQL branch teachable rather than pretty:
 *  - visits come in sessions with real gaps, so sessionisation has something to find;
 *  - categories form a two-level tree, so a self-join has a point;
 *  - clicks decay with position, so per-position metrics look like the real thing;
 *  - users are split into A/B groups with a small lift in the test group.
 *
 * No real data of any kind is involved.
 */

export type ColumnDoc = { name: string; type: string; note: L };

export type TableDoc = { name: string; note: L; columns: ColumnDoc[] };

export type Dataset = {
  id: string;
  title: L;
  tables: TableDoc[];
  /** Full DDL + data. Generated once and memoised: the hidden sets are large. */
  setupSql: () => string;
};

/** Two-level category tree: three roots, six leaves. */
const CATEGORIES = [
  { id: 1, name: 'electronics', parent: null },
  { id: 2, name: 'home', parent: null },
  { id: 3, name: 'clothes', parent: null },
  { id: 10, name: 'phones', parent: 1 },
  { id: 11, name: 'laptops', parent: 1 },
  { id: 12, name: 'kitchen', parent: 2 },
  { id: 13, name: 'decor', parent: 2 },
  { id: 14, name: 'shoes', parent: 3 },
  { id: 15, name: 'outerwear', parent: 3 },
];

const LEAF_CATEGORIES = CATEGORIES.filter((c) => c.parent !== null);

const QUERY_TEXTS: Record<number, string[]> = {
  10: ['iphone 15', 'phone 128gb', 'cheap smartphone'],
  11: ['laptop 16gb ram', 'ultrabook 14', 'gaming laptop'],
  12: ['coffee grinder', 'air fryer', 'kettle steel'],
  13: ['wall shelf', 'floor lamp', 'photo frame'],
  14: ['running shoes 42', 'winter boots', 'sneakers white'],
  15: ['winter jacket', 'raincoat', 'down coat'],
};

/** Per-position click-through rate: a steep decay, as real search logs show. */
function positionCtr(position: number, isAd: boolean): number {
  const base = 0.3 / Math.pow(position, 0.85);
  return isAd ? base * 0.75 : base;
}

type GenConfig = {
  seed: number;
  days: number;
  users: number;
  /** Average number of sessions a user starts per day. */
  sessionsPerDay: number;
};

function quote(text: string): string {
  return `'${text.replace(/'/g, "''")}'`;
}

const DDL = `
CREATE TABLE users (
  user_id      INTEGER PRIMARY KEY,
  signup_date  DATE,
  platform     VARCHAR,
  ab_group     VARCHAR
);
CREATE TABLE categories (
  category_id  INTEGER PRIMARY KEY,
  name         VARCHAR,
  parent_id    INTEGER
);
CREATE TABLE items (
  item_id      INTEGER PRIMARY KEY,
  category_id  INTEGER,
  price        DOUBLE,
  in_stock     BOOLEAN
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

/** Fixed Monday, so weekday logic is stable across runs. */
const ORIGIN = Date.UTC(2026, 2, 2);

function stamp(dayOffset: number, secondsIntoDay: number): string {
  const at = new Date(ORIGIN + dayOffset * 86400000 + secondsIntoDay * 1000);
  return at.toISOString().slice(0, 19).replace('T', ' ');
}

/** Build the whole database as one SQL script. */
export function generateSearchLogs(config: GenConfig): string {
  const { seed, days, users, sessionsPerDay } = config;
  const rng = makeRng(seed);

  const userRows: string[] = [];
  const userGroup: string[] = [];
  const platforms = ['web', 'ios', 'android'] as const;
  for (let u = 1; u <= users; u += 1) {
    const signup = new Date(ORIGIN - (rng.int(120) + 1) * 86400000);
    const group = rng.next() < 0.5 ? 'control' : 'test';
    userGroup[u] = group;
    userRows.push(
      `(${u}, '${signup.toISOString().slice(0, 10)}', ${quote(rng.pick(platforms))}, ${quote(group)})`,
    );
  }

  const categoryRows = CATEGORIES.map(
    (c) => `(${c.id}, ${quote(c.name)}, ${c.parent === null ? 'NULL' : c.parent})`,
  );

  const ITEMS = 400;
  const itemRows: string[] = [];
  const itemCategory = new Map<number, number>();
  const itemPrice = new Map<number, number>();
  for (let i = 0; i < ITEMS; i += 1) {
    const itemId = 1000 + i;
    const cat = rng.pick(LEAF_CATEGORIES);
    const price = Math.round(300 + rng.lognormal(7.2, 0.8));
    itemCategory.set(itemId, cat.id);
    itemPrice.set(itemId, price);
    itemRows.push(`(${itemId}, ${cat.id}, ${price}, ${rng.next() < 0.88 ? 'TRUE' : 'FALSE'})`);
  }
  const itemsByCategory = new Map<number, number[]>();
  for (const [itemId, catId] of itemCategory) {
    const list = itemsByCategory.get(catId) ?? [];
    list.push(itemId);
    itemsByCategory.set(catId, list);
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
    const weekday = (new Date(ORIGIN + day * 86400000).getUTCDay() + 7) % 7;
    // A mild weekend dip, so grouping by day has something to show.
    const dayFactor = weekday === 0 || weekday === 6 ? 0.75 : 1;

    for (let u = 1; u <= users; u += 1) {
      // The test group clicks a little more; the SQL metrics tasks rely on it.
      const lift = userGroup[u] === 'test' ? 1.06 : 1;

      const sessions = Math.round(sessionsPerDay * dayFactor * (0.3 + 1.4 * rng.next()));
      let cursor = 7 * 3600 + rng.int(3600); // first session of the day
      for (let s = 0; s < sessions; s += 1) {
        // Sessions are separated by well over the 30 minute inactivity rule.
        cursor += 2 * 3600 + rng.int(3 * 3600);
        if (cursor > 23 * 3600) break;

        const queriesInSession = 1 + rng.int(4);
        let withinSession = cursor;
        for (let q = 0; q < queriesInSession; q += 1) {
          // Inside a session the next query follows within a few minutes.
          if (q > 0) withinSession += 40 + rng.int(500);
          queryId += 1;
          const cat = rng.pick(LEAF_CATEGORIES);
          const text = rng.pick(QUERY_TEXTS[cat.id]);
          queryRows.push(
            `(${queryId}, ${u}, '${stamp(day, withinSession)}', ${quote(text)}, ${cat.id})`,
          );

          const pool = itemsByCategory.get(cat.id) ?? [];
          const nShown = 6 + rng.int(5);
          for (let pos = 1; pos <= nShown; pos += 1) {
            impressionId += 1;
            const isAd = pos <= 2 && rng.next() < 0.6;
            // Most results come from the queried category; some leak in.
            const itemId =
              pool.length > 0 && rng.next() < 0.85
                ? pool[rng.int(pool.length)]
                : 1000 + rng.int(ITEMS);
            impressionRows.push(
              `(${impressionId}, ${queryId}, ${itemId}, ${pos}, ${isAd ? 'TRUE' : 'FALSE'}, '${stamp(day, withinSession + 1)}')`,
            );

            if (rng.next() < positionCtr(pos, isAd) * lift) {
              clickId += 1;
              const clickDelay = 2 + rng.int(60);
              clickRows.push(
                `(${clickId}, ${impressionId}, '${stamp(day, withinSession + clickDelay)}')`,
              );
              if (rng.next() < 0.12) {
                orderId += 1;
                // Paid amount is the price, discounted now and then.
                const discount = rng.next() < 0.25 ? 0.9 : 1;
                const revenue = ((itemPrice.get(itemId) ?? 1000) * discount).toFixed(2);
                orderRows.push(
                  `(${orderId}, ${u}, ${itemId}, '${stamp(day, withinSession + clickDelay + 120)}', ${revenue})`,
                );
              }
            }
          }
        }
        cursor = withinSession;
      }
    }
  }

  const chunks = [DDL];
  pushInsert(chunks, 'users', userRows);
  pushInsert(chunks, 'categories', categoryRows);
  pushInsert(chunks, 'items', itemRows);
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
      {
        name: 'ab_group',
        type: 'VARCHAR',
        note: l('Группа эксперимента: control / test', 'Experiment group: control / test'),
      },
    ],
  },
  {
    name: 'categories',
    note: l(
      'Дерево категорий в два уровня: у корневых parent_id равен NULL.',
      'A two-level category tree: roots have parent_id NULL.',
    ),
    columns: [
      { name: 'category_id', type: 'INTEGER', note: l('Идентификатор категории', 'Category id') },
      { name: 'name', type: 'VARCHAR', note: l('Название', 'Name') },
      { name: 'parent_id', type: 'INTEGER', note: l('Родитель или NULL', 'Parent or NULL') },
    ],
  },
  {
    name: 'items',
    note: l('Товары. Категория всегда листовая.', 'Items. The category is always a leaf.'),
    columns: [
      { name: 'item_id', type: 'INTEGER', note: l('Идентификатор товара', 'Item id') },
      { name: 'category_id', type: 'INTEGER', note: l('Листовая категория', 'Leaf category') },
      { name: 'price', type: 'DOUBLE', note: l('Цена', 'Price') },
      { name: 'in_stock', type: 'BOOLEAN', note: l('Есть в наличии', 'In stock') },
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
      {
        name: 'position',
        type: 'INTEGER',
        note: l('Позиция в выдаче, с 1', 'Result position, 1-based'),
      },
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
      {
        name: 'impression_id',
        type: 'INTEGER',
        note: l('По какому показу кликнули', 'Clicked impression'),
      },
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
  let cached: string | null = null;
  return {
    id,
    title,
    tables: SEARCH_TABLES,
    setupSql: () => {
      if (cached === null) cached = generateSearchLogs(config);
      return cached;
    },
  };
}

export const DATASETS: Record<string, Dataset> = {
  'search-sample': searchDataset(
    'search-sample',
    l('Логи поиска: открытый пример', 'Search logs: sample'),
    { seed: 1, days: 7, users: 25, sessionsPerDay: 1.2 },
  ),
  'search-hidden-1': searchDataset(
    'search-hidden-1',
    l('Логи поиска: скрытый тест 1', 'Search logs: hidden test 1'),
    { seed: 20260321, days: 14, users: 90, sessionsPerDay: 1.6 },
  ),
  'search-hidden-2': searchDataset(
    'search-hidden-2',
    l('Логи поиска: скрытый тест 2', 'Search logs: hidden test 2'),
    { seed: 77003, days: 21, users: 35, sessionsPerDay: 0.9 },
  ),
};

export function getDataset(id: string): Dataset {
  const ds = DATASETS[id];
  if (!ds) throw new Error(`Unknown dataset: ${id}`);
  return ds;
}
