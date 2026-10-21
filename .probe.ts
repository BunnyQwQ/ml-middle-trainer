import { DuckDBInstance } from '@duckdb/node-api';
import { getDataset } from '@/content/datasets';
import { splitStatements } from '@/engine/sql/split';

const inst = await DuckDBInstance.create(':memory:');
const c = await inst.connect();
for (const s of splitStatements(getDataset('search-sample').setupSql())) await c.run(s);

const Q: Record<string, string> = {
  'basics-1': `SELECT i.item_id, i.price
FROM items i
JOIN categories c ON c.category_id = i.category_id
WHERE c.name = 'phones' AND i.in_stock AND i.price > 5000
ORDER BY i.price DESC, i.item_id`,

  'basics-2': `SELECT child.name AS child_name, parent.name AS parent_name
FROM categories child
JOIN categories parent ON parent.category_id = child.parent_id
ORDER BY child_name`,

  'basics-3': `SELECT u.user_id
FROM users u
LEFT JOIN orders o ON o.user_id = u.user_id
WHERE o.order_id IS NULL
ORDER BY u.user_id`,

  'group-1': `SELECT strftime(i.ts, '%Y-%m-%d') AS day,
       count(*) AS shows,
       count(c.click_id) AS clicks,
       round(count(c.click_id) * 1.0 / count(*), 4) AS ctr
FROM impressions i
LEFT JOIN clicks c ON c.impression_id = i.impression_id
GROUP BY 1
ORDER BY 1`,

  'group-2': `SELECT cat.name AS category_name, count(*) AS clicks
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
JOIN queries q ON q.query_id = i.query_id
JOIN categories cat ON cat.category_id = q.category_id
GROUP BY 1
ORDER BY clicks DESC, category_name
LIMIT 3`,

  'group-3': `SELECT cat.name AS category_name,
       round(count(cl.click_id) * 1.0 / count(*), 4) AS ctr
FROM impressions i
JOIN queries q ON q.query_id = i.query_id
JOIN categories cat ON cat.category_id = q.category_id
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
GROUP BY 1
HAVING count(cl.click_id) * 1.0 / count(*)
       > (SELECT count(*) * 1.0 / (SELECT count(*) FROM impressions) FROM clicks)
ORDER BY ctr DESC, category_name`,

  'win-1': `SELECT cat.name AS category_name, i.item_id, i.price
FROM items i
JOIN categories cat ON cat.category_id = i.category_id
QUALIFY row_number() OVER (PARTITION BY i.category_id ORDER BY i.price DESC, i.item_id) = 1
ORDER BY category_name`,

  'win-2': `SELECT i.position,
       count(*) AS clicks,
       round(count(*) * 1.0 / sum(count(*)) OVER (), 4) AS share
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
GROUP BY i.position
ORDER BY i.position`,

  'win-3': `SELECT strftime(i.ts, '%Y-%m-%d') AS day,
       count(*) AS clicks,
       count(*) - lag(count(*)) OVER (ORDER BY strftime(i.ts, '%Y-%m-%d')) AS delta
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
GROUP BY 1
ORDER BY 1`,

  'sess-1': `WITH marked AS (
  SELECT user_id, ts,
         CASE WHEN lag(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL
                OR ts - lag(ts) OVER (PARTITION BY user_id ORDER BY ts) > INTERVAL 30 MINUTE
              THEN 1 ELSE 0 END AS is_new
  FROM queries
)
SELECT user_id, sum(is_new) AS sessions
FROM marked
GROUP BY 1
ORDER BY 1`,

  'sess-2': `WITH marked AS (
  SELECT user_id, ts,
         CASE WHEN lag(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL
                OR ts - lag(ts) OVER (PARTITION BY user_id ORDER BY ts) > INTERVAL 30 MINUTE
              THEN 1 ELSE 0 END AS is_new
  FROM queries
),
numbered AS (
  SELECT user_id, ts, sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_no
  FROM marked
),
per_session AS (
  SELECT user_id, session_no, count(*) AS queries_cnt,
         date_diff('second', min(ts), max(ts)) AS seconds
  FROM numbered GROUP BY 1, 2
)
SELECT round(avg(queries_cnt), 4) AS avg_queries,
       round(avg(seconds) / 60.0, 4) AS avg_minutes
FROM per_session`,

  'sess-3': `WITH marked AS (
  SELECT query_id, user_id, ts,
         CASE WHEN lag(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL
                OR ts - lag(ts) OVER (PARTITION BY user_id ORDER BY ts) > INTERVAL 30 MINUTE
              THEN 1 ELSE 0 END AS is_new
  FROM queries
),
numbered AS (
  SELECT query_id, user_id,
         sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_no
  FROM marked
),
clicked AS (
  SELECT n.user_id, n.session_no, count(cl.click_id) AS clicks
  FROM numbered n
  JOIN impressions i ON i.query_id = n.query_id
  LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
  GROUP BY 1, 2
)
SELECT count(*) AS sessions,
       count(*) FILTER (WHERE clicks > 0) AS sessions_with_click,
       round(count(*) FILTER (WHERE clicks > 0) * 1.0 / count(*), 4) AS session_ctr
FROM clicked`,

  'met-1': `SELECT u.ab_group,
       count(*) AS shows,
       count(cl.click_id) AS clicks,
       round(count(cl.click_id) * 1.0 / count(*), 5) AS ctr
FROM impressions i
JOIN queries q ON q.query_id = i.query_id
JOIN users u ON u.user_id = q.user_id
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
GROUP BY 1
ORDER BY 1`,

  'met-2': `SELECT i.position,
       count(*) FILTER (WHERE i.is_ad) AS ad_shows,
       count(*) FILTER (WHERE NOT i.is_ad) AS organic_shows,
       round(count(cl.click_id) FILTER (WHERE i.is_ad) * 1.0
             / nullif(count(*) FILTER (WHERE i.is_ad), 0), 4) AS ad_ctr,
       round(count(cl.click_id) FILTER (WHERE NOT i.is_ad) * 1.0
             / nullif(count(*) FILTER (WHERE NOT i.is_ad), 0), 4) AS organic_ctr
FROM impressions i
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
WHERE i.position <= 5
GROUP BY 1
ORDER BY 1`,

  'met-3': `WITH per_user AS (
  SELECT q.user_id,
         count(*) AS shows,
         count(cl.click_id) AS clicks
  FROM impressions i
  JOIN queries q ON q.query_id = i.query_id
  LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
  GROUP BY 1
)
SELECT round(sum(clicks) * 1.0 / sum(shows), 5) AS ratio_of_sums,
       round(avg(clicks * 1.0 / shows), 5) AS mean_of_ratios
FROM per_user`,
};

for (const [name, sql] of Object.entries(Q)) {
  try {
    const r = await c.runAndReadAll(sql);
    const rows = r.getRowObjectsJS();
    const txt = JSON.stringify(rows.slice(0, 3), (_k, v) => (typeof v === 'bigint' ? Number(v) : v));
    console.log(`${name}: ${rows.length} rows | cols ${r.columnNames().join(',')} | ${txt.slice(0, 190)}`);
  } catch (e) {
    console.log(`${name}: ERROR ${(e as Error).message.slice(0, 160)}`);
  }
}
