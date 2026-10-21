import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sqlWindows: SkillNode = {
  id: 'sql.windows',
  branch: 'sql',
  tier: 3,
  title: l('Оконные функции', 'Window functions'),
  blurb: l(
    'Считать по группе, но не схлопывать строки: топ-N, доли и сравнение с соседом.',
    'Aggregate over a group without collapsing rows: top-N, shares and comparisons with the neighbour.',
  ),
  requires: ['sql.grouping'],
  theory: [
    {
      type: 'p',
      text: l(
        'GROUP BY схлопывает строки: было десять показов — стала одна строка с агрегатом. Оконная функция считает то же самое, но оставляет все строки на месте и дописывает результат рядом. Отсюда все её применения: «доля этой строки от общего», «место этой строки внутри своей группы», «чем эта строка отличается от предыдущей».',
        'GROUP BY collapses rows: ten impressions in, one aggregate row out. A window function computes the same thing but leaves every row where it was and writes the result alongside. That is where all its uses come from: "this row\'s share of the total", "this row\'s rank inside its group", "how this row differs from the previous one".',
      ),
    },
    {
      type: 'code',
      lang: 'sql',
      code: `функция() OVER (PARTITION BY чем_делим ORDER BY чем_сортируем)
function()  OVER (PARTITION BY what_splits ORDER BY what_orders)

row_number()  -- 1,2,3,4 — всегда разные / always distinct
rank()        -- 1,2,2,4 — с пропусками / with gaps
dense_rank()  -- 1,2,2,3 — без пропусков / without gaps
lag(x) / lead(x)  -- значение соседней строки / the neighbouring row's value
sum(x) OVER ()    -- итог по всей выборке / the total over everything`,
    },
    {
      type: 'sim',
      sim: 'window-functions',
      title: l('Окно на маленькой таблице', 'A window over a small table'),
      caption: l(
        'Десять показов с позициями и кликами. Переключай функцию и границы окна и смотри, какие именно строки попадают в расчёт для подсвеченной строки. Особое внимание на разницу между окном без ORDER BY (вся партиция целиком) и с ORDER BY (накопление от начала до текущей строки) — это источник самых неприятных расхождений в отчётах.',
        'Ten impressions with positions and clicks. Switch the function and the frame and watch which rows actually enter the computation for the highlighted row. Pay particular attention to the difference between a window without ORDER BY (the whole partition) and one with it (accumulating from the start up to the current row) — this is the source of the nastiest discrepancies in reports.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Главное правило: добавление ORDER BY внутрь OVER меняет рамку окна по умолчанию. Без ORDER BY агрегат считается по всей партиции, с ORDER BY — от начала партиции до текущей строки, то есть превращается в накопительный итог. Половина багов с оконными функциями — это именно случайно полученный накопительный итог вместо общего.',
        'The rule that matters: adding ORDER BY inside OVER changes the default frame. Without ORDER BY the aggregate covers the whole partition; with ORDER BY it covers the start of the partition up to the current row, i.e. it becomes a running total. Half of all window-function bugs are an accidental running total where a grand total was meant.',
      ),
    },
    {
      type: 'h',
      text: l('QUALIFY: фильтр по результату окна', 'QUALIFY: filtering on the window result'),
    },
    {
      type: 'p',
      text: l(
        'Оконную функцию нельзя использовать в WHERE: к моменту фильтрации она ещё не посчитана. Поэтому классический способ взять топ-1 в каждой группе — подзапрос с row_number и внешний WHERE rn = 1. QUALIFY делает ровно это, но без лишнего уровня вложенности. Он есть в DuckDB, ClickHouse, Snowflake и BigQuery, и в аналитических запросах он заметно читабельнее.',
        'A window function cannot be used in WHERE: at filtering time it has not been computed yet. So the classic way to take the top-1 per group is a subquery with row_number and an outer WHERE rn = 1. QUALIFY does exactly that without the extra nesting level. It exists in DuckDB, ClickHouse, Snowflake and BigQuery, and in analytical queries it reads noticeably better.',
      ),
    },
    {
      type: 'sim',
      sim: 'position-share',
      title: l('Распределение кликов по позициям', 'How clicks spread across positions'),
      caption: l(
        'Доля кликов по позициям и накопительная доля — ровно то, что считает sum() OVER (). Данные берутся из того же генератора логов, что и в задачах. Обрати внимание, какая доля кликов собирается первыми тремя позициями: отсюда растут и метрики на топ-k, и экономика рекламного блока.',
        'The share of clicks by position and the cumulative share — exactly what sum() OVER () computes. The data comes from the same log generator the tasks use. Note what fraction of clicks the first three positions collect: this is where both top-k metrics and the economics of the ad block come from.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'sql.windows.top-per-category',
      prompt: l(
        'Для каждой категории выведи самый дорогой товар. Три колонки: category_name, item_id, price. При равной цене бери товар с меньшим item_id. Сортировка по category_name.',
        'For every category output its most expensive item. Three columns: category_name, item_id, price. On equal prices take the smaller item_id. Sort by category_name.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- row_number() внутри категории, а потом оставить первые.
-- row_number() inside each category, then keep the first ones.
SELECT
FROM items
`,
      reference: `SELECT cat.name AS category_name, i.item_id, i.price
FROM items i
JOIN categories cat ON cat.category_id = i.category_id
QUALIFY row_number() OVER (PARTITION BY i.category_id ORDER BY i.price DESC, i.item_id) = 1
ORDER BY category_name`,
      orderMatters: true,
      writeup: l(
        'Это самый частый аналитический паттерн после группировки: «по одной строке из каждой группы, выбранной по правилу». Важно, что row_number, а не rank: при одинаковой максимальной цене rank выдал бы обе строки, и в ответе оказалось бы больше строк, чем категорий. Второй ключ в ORDER BY внутри окна нужен ровно для того, чтобы выбор между равными был детерминированным. Без QUALIFY это пишется подзапросом: SELECT … FROM (SELECT …, row_number() OVER (…) AS rn FROM …) WHERE rn = 1 — ровно та же работа, на один уровень вложенности больше.',
        'This is the most common analytical pattern after grouping: "one row from each group, chosen by a rule". It matters that this is row_number and not rank: with a tie at the maximum price, rank would return both rows and the answer would have more rows than categories. The second key in the window ORDER BY is there precisely to make the choice between equals deterministic. Without QUALIFY it is written as a subquery: SELECT … FROM (SELECT …, row_number() OVER (…) AS rn FROM …) WHERE rn = 1 — the same work with one more level of nesting.',
      ),
      clickhouse: {
        code: `SELECT cat.name AS category_name, i.item_id, i.price
FROM items AS i
INNER JOIN categories AS cat ON cat.category_id = i.category_id
ORDER BY i.price DESC, i.item_id
LIMIT 1 BY i.category_id
ORDER BY category_name`,
        note: l(
          'QUALIFY в ClickHouse тоже есть, но идиоматичнее LIMIT 1 BY: он берёт первую строку для каждого значения ключа после сортировки и работает заметно быстрее окна, потому что не материализует номер строки. Для топ-3 в каждой категории — LIMIT 3 BY. Ещё один способ, когда нужна одна агрегированная величина, а не строка: argMax(item_id, price), возвращающий значение одной колонки в строке с максимумом другой.',
          'ClickHouse has QUALIFY too, but LIMIT 1 BY is the idiomatic form: it takes the first row per key value after sorting and runs noticeably faster than a window because it never materialises the row number. For a top-3 per category, LIMIT 3 BY. One more option when you need a single aggregated value rather than a row: argMax(item_id, price), which returns one column from the row holding the maximum of another.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.windows.click-share',
      prompt: l(
        'Посчитай, как клики распределяются по позициям выдачи. Три колонки: position, clicks, share — доля кликов этой позиции от всех кликов, округлить до 4 знаков. Сортировка по position.',
        'Compute how clicks are distributed across result positions. Three columns: position, clicks, share — this position\'s share of all clicks, rounded to 4 decimals. Sort by position.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Знаменатель — итог по всей выборке. Окно умеет считать его в том же запросе.
-- The denominator is the grand total. A window can compute it in the same query.
SELECT
FROM clicks
`,
      reference: `SELECT i.position,
       count(*) AS clicks,
       round(count(*) * 1.0 / sum(count(*)) OVER (), 4) AS share
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
GROUP BY i.position
ORDER BY i.position`,
      orderMatters: true,
      writeup: l(
        'Конструкция sum(count(*)) OVER () выглядит странно, но читается слева направо по шагам выполнения: сначала GROUP BY считает count(*) по каждой позиции, потом окно суммирует уже посчитанные агрегаты по всем группам. То есть окно применяется поверх результата группировки, а не к сырым строкам. Это избавляет от подзапроса с общим числом кликов и от второго сканирования таблицы. Пустое OVER () означает «вся выборка целиком» — именно то, что нужно для знаменателя доли. Стоит проверить себя: сумма колонки share обязана дать единицу с точностью до округления. Содержательно это и есть кривая просмотра выдачи: резкий спад доли с позицией — причина, по которой метрики качества взвешивают документы по позиции, а не считают их равными.',
        'The construct sum(count(*)) OVER () looks odd but reads left to right in execution order: GROUP BY computes count(*) per position first, then the window sums those already-computed aggregates across all groups. The window applies on top of the grouping result rather than to raw rows. That removes both a subquery for the total click count and a second scan of the table. An empty OVER () means "the entire result set", which is exactly what the denominator of a share needs. A good self-check: the share column must sum to one up to rounding. Substantively this is the examination curve of a result page: the steep decay with position is why quality metrics weight documents by position instead of treating them as equals.',
      ),
      clickhouse: {
        code: `SELECT i.position,
       count() AS clicks,
       round(count() / sum(count()) OVER (), 4) AS share
FROM clicks AS cl
INNER JOIN impressions AS i ON i.impression_id = cl.impression_id
GROUP BY i.position
ORDER BY i.position`,
        note: l(
          'Переносится один в один: оконные функции в ClickHouse поддерживаются с версии 21.x, и агрегат под окном работает так же. Для простых долей, впрочем, в ClickHouse часто собирают всё в массив и делят на sum(arrayJoin(...)) — но читать такой запрос сложнее, а выигрыш появляется только на очень больших группировках.',
          'It carries over one to one: ClickHouse has supported window functions since 21.x and an aggregate under a window behaves the same. For simple shares, though, ClickHouse code often collects everything into an array and divides by sum(arrayJoin(...)) — but that is harder to read and only pays off on very large groupings.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.windows.day-over-day',
      prompt: l(
        'Посчитай клики по дням и прирост к предыдущему дню. Три колонки: day (строка вида 2026-03-02), clicks, delta — разница с предыдущим днём. Для первого дня delta должна быть NULL. Сортировка по day.',
        'Compute clicks by day and the change from the previous day. Three columns: day (a string like 2026-03-02), clicks, delta — the difference from the previous day. For the first day delta must be NULL. Sort by day.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- lag() достаёт значение предыдущей строки в заданном порядке.
-- lag() reaches for the previous row's value in a given order.
SELECT
FROM clicks
`,
      reference: `SELECT strftime(i.ts, '%Y-%m-%d') AS day,
       count(*) AS clicks,
       count(*) - lag(count(*)) OVER (ORDER BY strftime(i.ts, '%Y-%m-%d')) AS delta
FROM clicks cl
JOIN impressions i ON i.impression_id = cl.impression_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Снова окно поверх агрегата: lag смотрит на предыдущую строку уже сгруппированного результата. NULL в первой строке — не недоработка, а правильный ответ: предыдущего дня не существует, и подставлять туда ноль было бы враньём, которое потом выльется в «прирост +57 кликов» на первом дне графика. Если ноль всё же нужен, его пишут явно: coalesce(..., 0). Практическая оговорка про такие запросы: lag берёт предыдущую строку результата, а не предыдущий календарный день. Если в какой-то день кликов не было вообще, строки за этот день не существует, и lag молча сравнит с позавчера. На продовых дашбордах поэтому сначала генерируют полный календарь дней и джойнят к нему факты.',
        'A window over an aggregate again: lag looks at the previous row of the already-grouped result. The NULL in the first row is not an oversight but the correct answer: there is no previous day, and putting a zero there would be a lie that later shows up as "+57 clicks" on the first point of the chart. If a zero is genuinely wanted, it gets written explicitly: coalesce(..., 0). A practical caveat about queries like this: lag takes the previous row of the result, not the previous calendar day. If some day had no clicks at all, no row exists for it and lag silently compares against the day before that. Production dashboards therefore generate a full calendar of days first and join the facts onto it.',
      ),
      clickhouse: {
        code: `SELECT toString(toDate(i.ts)) AS day,
       count() AS clicks,
       count() - lagInFrame(count()) OVER (
           ORDER BY toDate(i.ts)
           ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
       ) AS delta
FROM clicks AS cl
INNER JOIN impressions AS i ON i.impression_id = cl.impression_id
GROUP BY day
ORDER BY day`,
        note: l(
          'Здесь ClickHouse заметно отличается, и это стоит запомнить. Функция называется lagInFrame, а не lag, и, в отличие от стандарта, она ограничена рамкой окна: при рамке по умолчанию (от начала партиции до текущей строки) lagInFrame(x) вернёт не предыдущую строку, а первую. Поэтому рамку пишут явно: ROWS BETWEEN 1 PRECEDING AND CURRENT ROW. Запрос без этой строчки не падает, а выдаёт неправильные дельты — типичная ошибка при переносе отчётов.',
          'ClickHouse differs noticeably here, and it is worth remembering. The function is called lagInFrame rather than lag and, unlike the standard, it is bounded by the window frame: with the default frame (start of partition to current row) lagInFrame(x) returns the first row rather than the previous one. So the frame is written out explicitly: ROWS BETWEEN 1 PRECEDING AND CURRENT ROW. A query missing that line does not fail — it returns wrong deltas, which is the classic mistake when porting reports.',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'DuckDB documentation: window functions',
      url: 'https://duckdb.org/docs/',
    },
    {
      title: 'ClickHouse documentation: window functions',
      url: 'https://clickhouse.com/docs',
      note: l('lagInFrame, leadInFrame и поведение рамок.', 'lagInFrame, leadInFrame and frame behaviour.'),
    },
  ],
};
