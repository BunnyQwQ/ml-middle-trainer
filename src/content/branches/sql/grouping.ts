import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sqlGrouping: SkillNode = {
  id: 'sql.grouping',
  branch: 'sql',
  tier: 2,
  title: l('Группировки и агрегаты', 'Grouping and aggregates'),
  blurb: l(
    'CTR — это деление, и почти все ошибки здесь про то, что именно делится.',
    'CTR is a division, and nearly every mistake here is about what exactly gets divided.',
  ),
  requires: ['sql.basics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Разница между count(*) и count(column) — не стилистика, а главный рабочий инструмент при счёте метрик по логам. count(*) считает строки, count(column) считает строки, где колонка не NULL. После LEFT JOIN показов с кликами это ровно то, что нужно: count(*) даёт число показов, а count(clicks.click_id) — число кликов, и CTR получается одним проходом по одной таблице.',
        'The difference between count(*) and count(column) is not a matter of style but the main working tool when computing metrics over logs. count(*) counts rows; count(column) counts rows where the column is not NULL. After a LEFT JOIN of impressions to clicks that is exactly what you need: count(*) gives impressions, count(clicks.click_id) gives clicks, and CTR falls out of a single pass over one table.',
      ),
    },
    {
      type: 'code',
      lang: 'sql',
      code: `SELECT count(*)              AS shows,
       count(c.click_id)     AS clicks,
       count(DISTINCT q.user_id) AS users
FROM impressions i
LEFT JOIN clicks c ON c.impression_id = i.impression_id
JOIN queries q ON q.query_id = i.query_id`,
      caption: l(
        'Три счётчика, три разных вопроса. Путаница между ними — самая частая причина расхождения цифр в двух дашбордах.',
        'Three counters, three different questions. Mixing them up is the most common reason two dashboards disagree.',
      ),
    },
    {
      type: 'h',
      text: l('Условные агрегаты', 'Conditional aggregates'),
    },
    {
      type: 'p',
      text: l(
        'Когда нужно посчитать не всё, а часть — рекламные показы отдельно от органических, — вместо отдельного запроса используют FILTER. Он считает агрегат только по строкам, подходящим под условие, и позволяет собрать всю разбивку одним проходом вместо трёх джойнов подзапросов.',
        'When you need a part rather than the whole — ad impressions apart from organic ones — you reach for FILTER instead of a separate query. It applies the aggregate only to the rows matching a condition, and lets the whole breakdown come out of a single pass rather than three joined subqueries.',
      ),
    },
    {
      type: 'code',
      lang: 'sql',
      code: `count(*) FILTER (WHERE is_ad)                 -- рекламные показы / ad impressions
count(c.click_id) FILTER (WHERE NOT is_ad)    -- органические клики / organic clicks
sum(CASE WHEN is_ad THEN 1 ELSE 0 END)        -- то же самое, переносимо / the same, portable`,
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Деление целых на целые во многих базах даёт целое: count(clicks) / count(*) вернёт ноль. Поэтому в числитель добавляют 1.0 или приводят тип явно. А если знаменатель может оказаться нулём, его оборачивают в nullif(x, 0): деление на NULL даёт NULL вместо падения запроса.',
        'Integer division returns an integer in many databases: count(clicks) / count(*) comes back as zero. That is why the numerator gets a 1.0 or an explicit cast. And when the denominator can be zero, it goes inside nullif(x, 0): dividing by NULL yields NULL instead of crashing the query.',
      ),
    },
    {
      type: 'sim',
      sim: 'ctr-definitions',
      title: l('Один CTR, четыре разных числа', 'One CTR, four different numbers'),
      caption: l(
        'Одни и те же логи, четыре честных определения CTR: на показ, на запрос, на сессию и среднее по пользователям. Числа считаются прямо здесь из сгенерированных событий. Покрути долю активных пользователей и посмотри, как расходятся «отношение сумм» и «среднее отношений» — это тот самый вопрос, который на собеседовании звучит как «а по чему вы усредняете».',
        'The same logs and four honest definitions of CTR: per impression, per query, per session and averaged over users. The numbers are computed right here from the generated events. Drag the share of heavy users and watch "ratio of sums" and "mean of ratios" come apart — this is the question that gets asked in interviews as "and what exactly are you averaging over".',
      ),
    },
    {
      type: 'p',
      text: l(
        'HAVING фильтрует уже посчитанные группы, WHERE — строки до группировки. Практическое следствие: условие на сырую колонку всегда дешевле поставить в WHERE, потому что оно отсечёт данные до агрегации. В HAVING попадает только то, что без агрегата не выразить, вроде «категории, где CTR выше общего».',
        'HAVING filters groups after they are computed, WHERE filters rows before the grouping. The practical consequence: a condition on a raw column is always cheaper in WHERE, because it cuts the data before aggregation. Only what cannot be expressed without an aggregate belongs in HAVING, such as "categories whose CTR is above the overall one".',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'sql.grouping.ctr-by-day',
      prompt: l(
        'Посчитай CTR по дням. Четыре колонки: day (строка вида 2026-03-02), shows, clicks, ctr (доля, округлить до 4 знаков). День берётся по времени показа. Сортировка по day.',
        'Compute CTR by day. Four columns: day (a string like 2026-03-02), shows, clicks, ctr (a share, rounded to 4 decimals). The day comes from the impression timestamp. Sort by day.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- strftime(ts, '%Y-%m-%d') даёт день строкой.
-- strftime(ts, '%Y-%m-%d') gives the day as a string.
SELECT
FROM impressions
`,
      reference: `SELECT strftime(i.ts, '%Y-%m-%d') AS day,
       count(*) AS shows,
       count(c.click_id) AS clicks,
       round(count(c.click_id) * 1.0 / count(*), 4) AS ctr
FROM impressions i
LEFT JOIN clicks c ON c.impression_id = i.impression_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Весь запрос держится на двух вещах. Первая: LEFT JOIN сохраняет показы без кликов, поэтому count(*) — это показы, а count(c.click_id) — клики. Если заменить LEFT на INNER, знаменатель превратится в число кликнутых показов, и CTR станет равен единице в каждом дне — ошибка, которая не падает, а выдаёт красивое неправильное число. Вторая: умножение на 1.0 спасает от целочисленного деления. GROUP BY 1 ссылается на первое выражение в SELECT — это сокращение поддерживают и DuckDB, и ClickHouse, а в проде оно экономит дублирование длинных выражений. На настоящих логах к этому добавляют фильтр на ботов и на технические показы, иначе CTR по дням будет гулять вслед за краулерами, а не за качеством поиска.',
        'The whole query rests on two things. First, the LEFT JOIN keeps impressions that were never clicked, so count(*) is impressions and count(c.click_id) is clicks. Swap LEFT for INNER and the denominator becomes the number of clicked impressions, making CTR exactly one on every day — a mistake that does not fail but returns a nice wrong number. Second, multiplying by 1.0 avoids integer division. GROUP BY 1 refers to the first expression in SELECT, a shorthand both DuckDB and ClickHouse accept, and in production it saves repeating long expressions. On real logs you add a bot filter and a filter for technical impressions on top, otherwise daily CTR tracks crawlers rather than search quality.',
      ),
      clickhouse: {
        code: `SELECT toString(toDate(i.ts)) AS day,
       count() AS shows,
       countIf(c.click_id != 0) AS clicks,
       round(countIf(c.click_id != 0) / count(), 4) AS ctr
FROM impressions AS i
LEFT JOIN clicks AS c ON c.impression_id = i.impression_id
GROUP BY day
ORDER BY day`,
        note: l(
          'Три отличия, и второе из них опасное. Дата: toDate вместо strftime. Деление: в ClickHouse деление целых и так даёт дробное, 1.0 не нужен. И главное — count(c.click_id) здесь не сработает: LEFT JOIN подставляет нули вместо NULL, поэтому непокликанные показы посчитались бы как клики. Либо countIf с явным сравнением, либо настройка join_use_nulls = 1.',
          'Three differences, and the second one bites. Date: toDate instead of strftime. Division: ClickHouse already returns a float for integer division, so the 1.0 is unnecessary. And crucially, count(c.click_id) does not work here: a LEFT JOIN fills unmatched rows with zeros rather than NULLs, so unclicked impressions would be counted as clicks. Either countIf with an explicit comparison, or the join_use_nulls = 1 setting.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.grouping.top-categories',
      prompt: l(
        'Найди три категории с наибольшим числом кликов. Категория берётся у запроса, а не у товара. Две колонки: category_name, clicks. Сортировка по clicks по убыванию, при равенстве — по имени категории.',
        'Find the three categories with the most clicks. The category comes from the query, not from the item. Two columns: category_name, clicks. Sort by clicks descending, ties broken by category name.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- От клика до категории три шага: clicks -> impressions -> queries -> categories.
-- From a click to a category takes three hops: clicks -> impressions -> queries -> categories.
SELECT
FROM clicks
`,
      reference: `SELECT cat.name AS category_name, count(*) AS clicks
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
JOIN queries q ON q.query_id = i.query_id
JOIN categories cat ON cat.category_id = q.category_id
GROUP BY 1
ORDER BY clicks DESC, category_name
LIMIT 3`,
      orderMatters: true,
      writeup: l(
        'Цепочка джойнов от факта к измерениям — самый обычный вид запроса по логам. Здесь уместен именно INNER JOIN: нас интересуют только клики, и терять нечего. Отдельно стоит заметить условие задачи «категория берётся у запроса»: у показанного товара своя категория, и она может не совпадать с категорией запроса — выдача иногда подмешивает товары из соседних разделов. Это не придирка к формулировке, а настоящая развилка в продуктовом смысле: клики по категории запроса отвечают на вопрос «что ищут», клики по категории товара — «что покупают». Второй ключ сортировки нужен, чтобы LIMIT 3 был детерминированным при равном числе кликов.',
        'A chain of joins from the fact table out to the dimensions is the most ordinary kind of log query. INNER JOIN is the right choice here: we only care about clicks, so there is nothing to lose. Worth noting the wording "the category comes from the query": the shown item has a category of its own and it need not match the query category — search results sometimes mix in items from neighbouring sections. That is not pedantry but a real product fork: clicks by query category answer "what people search for", clicks by item category answer "what people buy". The second sort key is what makes LIMIT 3 deterministic when click counts tie.',
      ),
      clickhouse: {
        code: `SELECT cat.name AS category_name, count() AS clicks
FROM clicks AS cl
INNER JOIN impressions AS i ON i.impression_id = cl.impression_id
INNER JOIN queries AS q ON q.query_id = i.query_id
INNER JOIN categories AS cat ON cat.category_id = q.category_id
GROUP BY category_name
ORDER BY clicks DESC, category_name
LIMIT 3`,
        note: l(
          'Для таких цепочек в ClickHouse обычно денормализуют таблицу показов, положив category_id прямо в неё: четыре джойна на миллиардах строк дороже лишней колонки. А когда нужен топ внутри каждой группы, а не общий, в ClickHouse есть LIMIT 1 BY category_name — конструкции с таким смыслом в стандартном SQL нет вовсе.',
          'For chains like this ClickHouse usually denormalises the impression table, putting category_id straight into it: four joins over billions of rows cost more than one extra column. And when you need a top-N inside each group rather than overall, ClickHouse has LIMIT 1 BY category_name — a construct standard SQL has no direct equivalent for.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.grouping.having-above-average',
      prompt: l(
        'Найди категории запросов, у которых CTR выше общего CTR по всем показам. Две колонки: category_name, ctr (округлить до 4 знаков). Сортировка по ctr по убыванию, при равенстве — по имени.',
        'Find the query categories whose CTR is above the overall CTR across all impressions. Two columns: category_name, ctr (rounded to 4 decimals). Sort by ctr descending, ties broken by name.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Общий CTR — одно число, его можно посчитать скалярным подзапросом.
-- The overall CTR is a single number, so a scalar subquery will do.
SELECT
FROM impressions
`,
      reference: `SELECT cat.name AS category_name,
       round(count(cl.click_id) * 1.0 / count(*), 4) AS ctr
FROM impressions i
JOIN queries q ON q.query_id = i.query_id
JOIN categories cat ON cat.category_id = q.category_id
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
GROUP BY 1
HAVING count(cl.click_id) * 1.0 / count(*)
       > (SELECT count(*) * 1.0 / (SELECT count(*) FROM impressions) FROM clicks)
ORDER BY ctr DESC, category_name`,
      orderMatters: true,
      writeup: l(
        'Три вещи, которые тут важны. Первая: в HAVING стоит выражение без round — сравнивать надо точные величины, иначе категория у самой границы попадёт или не попадёт в ответ в зависимости от округления. Вторая: скалярный подзапрос считает общий CTR один раз, а не для каждой группы; планировщик выполняет его до группировки. Третья, продуктовая: такое сравнение честно только при одинаковых условиях. Категории различаются средним числом показов на запрос и долей рекламы, поэтому «CTR выше среднего» может означать не лучшее качество, а просто более короткую выдачу. На практике рядом с таким запросом всегда просят число показов — без него список категорий с CTR 100% из трёх показов выглядит убедительно и ничего не значит.',
        'Three things matter here. First, the expression in HAVING carries no round — the comparison must use exact values, otherwise a category right at the boundary lands in or out of the answer depending on rounding. Second, the scalar subquery computes the overall CTR once rather than per group; the planner evaluates it before the grouping. Third, the product point: such a comparison is only fair under equal conditions. Categories differ in the average number of impressions per query and in the share of ads, so "CTR above average" may mean a shorter result page rather than better quality. In practice a query like this is always asked alongside the impression count — without it, a list of categories with 100% CTR off three impressions looks convincing and means nothing.',
      ),
      clickhouse: {
        code: `SELECT cat.name AS category_name,
       round(countIf(cl.click_id != 0) / count(), 4) AS ctr
FROM impressions AS i
INNER JOIN queries AS q ON q.query_id = i.query_id
INNER JOIN categories AS cat ON cat.category_id = q.category_id
LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
GROUP BY category_name
HAVING countIf(cl.click_id != 0) / count()
       > (SELECT count() / (SELECT count() FROM impressions) FROM clicks)
ORDER BY ctr DESC, category_name`,
        note: l(
          'Скалярные подзапросы ClickHouse поддерживает и вычисляет один раз. Но на больших объёмах вместо подзапроса чаще считают обе величины за один проход оконной функцией или через countIf в одном SELECT: лишнее сканирование таблицы показов на миллиардах строк заметно дороже самой группировки.',
          'ClickHouse supports scalar subqueries and evaluates them once. At scale, though, people usually compute both quantities in a single pass with a window function or with countIf in one SELECT: an extra scan of a billion-row impression table costs noticeably more than the grouping itself.',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'DuckDB documentation: aggregates and FILTER',
      url: 'https://duckdb.org/docs/',
    },
    {
      title: 'ClickHouse documentation: aggregate function combinators',
      url: 'https://clickhouse.com/docs',
      note: l('countIf, sumIf и остальные суффиксы -If.', 'countIf, sumIf and the rest of the -If suffixes.'),
    },
  ],
};
