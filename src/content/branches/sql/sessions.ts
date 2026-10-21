import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sqlSessions: SkillNode = {
  id: 'sql.sessions',
  branch: 'sql',
  tier: 4,
  title: l('Сессии', 'Sessions'),
  blurb: l(
    'Логи не знают, где кончается визит. Границу приходится восстанавливать запросом.',
    'Logs do not know where a visit ends. The boundary has to be reconstructed by a query.',
  ),
  requires: ['sql.windows'],
  theory: [
    {
      type: 'p',
      text: l(
        'В логах нет колонки session_id — есть поток событий с временными метками. Сессия это договорённость: подряд идущие события одного пользователя считаются одним визитом, пока пауза между ними не превысила порог. Стандартный порог — 30 минут, он пришёл из веб-аналитики и держится не на теории, а на том, что распределение пауз между событиями двугорбое: короткие паузы внутри визита и длинные между визитами, а провал между горбами как раз в районе получаса.',
        'Logs have no session_id column — they have a stream of timestamped events. A session is a convention: consecutive events from one user count as one visit until the gap between them exceeds a threshold. The standard threshold is 30 minutes; it comes from web analytics and rests not on theory but on the fact that the distribution of gaps between events is bimodal — short gaps inside a visit, long gaps between visits, with the valley between the humps sitting around half an hour.',
      ),
    },
    {
      type: 'sim',
      sim: 'session-gaps',
      title: l('Откуда берётся порог в 30 минут', 'Where the 30-minute threshold comes from'),
      caption: l(
        'Гистограмма пауз между соседними запросами одного пользователя, посчитанная по тем же синтетическим логам, что и в задачах. Двигай порог и смотри, как меняется число сессий и средняя длина сессии. Обрати внимание, что в широком диапазоне порога число сессий почти не меняется — это и есть признак того, что порог выбран в провале распределения, а не наугад.',
        'A histogram of gaps between consecutive queries from the same user, computed over the same synthetic logs the tasks use. Drag the threshold and watch the session count and the average session length change. Note that across a wide range of thresholds the session count barely moves — that is the sign the threshold sits in the valley of the distribution rather than being picked at random.',
      ),
    },
    {
      type: 'h',
      text: l('Паттерн из трёх шагов', 'The three-step pattern'),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'lag даёт время предыдущего события того же пользователя.',
          'lag gives the timestamp of that user\'s previous event.',
        ),
        l(
          'Флаг: единица, если паузы не было вовсе (первое событие) или она больше порога.',
          'A flag: one when there was no previous event at all, or the gap exceeds the threshold.',
        ),
        l(
          'Накопительная сумма флага внутри пользователя даёт номер сессии.',
          'A running sum of that flag within the user yields the session number.',
        ),
      ],
    },
    {
      type: 'code',
      lang: 'sql',
      code: `WITH marked AS (
  SELECT user_id, ts,
         CASE WHEN lag(ts) OVER w IS NULL
                OR ts - lag(ts) OVER w > INTERVAL 30 MINUTE
              THEN 1 ELSE 0 END AS is_new
  FROM queries
  WINDOW w AS (PARTITION BY user_id ORDER BY ts)
)
SELECT user_id, ts,
       sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_no
FROM marked`,
      caption: l(
        'Третий шаг — тот самый случай, когда накопительный итог нужен намеренно: ORDER BY внутри OVER здесь обязателен.',
        'The third step is the case where a running total is wanted on purpose: the ORDER BY inside OVER is mandatory here.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Номер сессии уникален только внутри пользователя. Если дальше группировать по session_no без user_id, сессии разных людей склеятся в одну. Поэтому ключом сессии всегда служит пара (user_id, session_no), а в продовых витринах её сразу хэшируют в один идентификатор.',
        'The session number is unique only within a user. Group by session_no without user_id further down and sessions from different people merge into one. So the session key is always the pair (user_id, session_no), and production tables hash it into a single identifier right away.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Зачем это нужно за пределами SQL: сессия — естественная единица анализа для поиска. Пользователь переформулирует запрос, потому что выдача не ответила, поэтому два запроса внутри сессии не независимы, и метрика «доля сессий с кликом» говорит о качестве больше, чем «доля запросов с кликом». Та же логика стоит за выбором единицы рандомизации в A/B: считать по запросам, когда рандомизовали по пользователю, — значит занизить дисперсию.',
        'Why this matters beyond SQL: the session is the natural unit of analysis for search. A user reformulates because the results did not answer, so two queries inside one session are not independent, and "share of sessions with a click" says more about quality than "share of queries with a click". The same logic sits behind the choice of randomisation unit in A/B testing: analysing per query when randomisation was per user understates the variance.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'sql.sessions.count-per-user',
      prompt: l(
        'Разметь сессии по запросам с порогом неактивности 30 минут и посчитай число сессий у каждого пользователя. Две колонки: user_id, sessions. Сортировка по user_id.',
        'Mark sessions over the queries with a 30-minute inactivity threshold and count the sessions of every user. Two columns: user_id, sessions. Sort by user_id.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Первое событие пользователя тоже открывает сессию.
-- A user's first event opens a session too.
WITH marked AS (
  SELECT
  FROM queries
)
SELECT
FROM marked
`,
      reference: `WITH marked AS (
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
      orderMatters: true,
      writeup: l(
        'Самая частая ошибка в этой задаче — забыть про условие IS NULL. У первого запроса пользователя предыдущего не существует, lag возвращает NULL, сравнение NULL > интервал даёт NULL, CASE уходит в ELSE, и первая сессия каждого пользователя не считается. Запрос не падает, просто у всех на одну сессию меньше. Второй способ посчитать то же самое — count(*) по числу строк с is_new = 1, но sum по флагу короче и работает одинаково. Заметь, что раз нужно только количество, накопительная сумма из третьего шага паттерна здесь не понадобилась: номера сессий нужны только тогда, когда дальше считаются метрики внутри сессии.',
        'The most common mistake here is forgetting the IS NULL branch. A user\'s first query has no predecessor, lag returns NULL, comparing NULL to an interval yields NULL, CASE falls through to ELSE, and the first session of every user goes uncounted. The query does not fail — everyone is simply one session short. Another way to compute the same thing is count(*) over the rows where is_new = 1, but summing the flag is shorter and behaves identically. Note that since only a count is needed, the running sum from step three of the pattern was not required: session numbers are only needed when metrics are computed inside a session afterwards.',
      ),
      clickhouse: {
        code: `WITH marked AS (
  SELECT user_id, ts,
         if(dateDiff('minute',
              lagInFrame(ts) OVER (PARTITION BY user_id ORDER BY ts
                                   ROWS BETWEEN 1 PRECEDING AND CURRENT ROW),
              ts) > 30
            OR lagInFrame(ts) OVER (PARTITION BY user_id ORDER BY ts
                                    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) = ts,
            1, 0) AS is_new
  FROM queries
)
SELECT user_id, sum(is_new) AS sessions
FROM marked
GROUP BY user_id
ORDER BY user_id`,
        note: l(
          'В ClickHouse два отличия. Первое: lagInFrame с явной рамкой вместо lag. Второе и более коварное: у первой строки lagInFrame возвращает не NULL, а значение по умолчанию для типа — для DateTime это начало эпохи, а при рамке 1 PRECEDING фактически саму текущую строку. Поэтому условие «первое событие» приходится выражать иначе, чем через IS NULL. Разница во времени считается через dateDiff, а не вычитанием с интервалом.',
          'ClickHouse differs in two ways. First, lagInFrame with an explicit frame instead of lag. Second and more treacherous: on the first row lagInFrame returns the type default rather than NULL — for DateTime that is the epoch, and with a 1 PRECEDING frame effectively the current row itself. So "this is the first event" has to be expressed by something other than IS NULL. Time differences go through dateDiff rather than subtraction with an interval.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.sessions.length',
      prompt: l(
        'Посчитай среднюю длину сессии. Две колонки в одной строке: avg_queries — среднее число запросов в сессии, avg_minutes — средняя длительность сессии в минутах (от первого запроса до последнего). Обе величины округли до 4 знаков. Порог сессии — 30 минут.',
        'Compute the average session length. Two columns in a single row: avg_queries — the mean number of queries per session, avg_minutes — the mean session duration in minutes (from the first query to the last). Round both to 4 decimals. The session threshold is 30 minutes.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Теперь номера сессий нужны: по ним группируем.
-- Now the session numbers are needed: they are what we group by.
WITH marked AS (
  SELECT
  FROM queries
)
SELECT
FROM marked
`,
      reference: `WITH marked AS (
  SELECT user_id, ts,
         CASE WHEN lag(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL
                OR ts - lag(ts) OVER (PARTITION BY user_id ORDER BY ts) > INTERVAL 30 MINUTE
              THEN 1 ELSE 0 END AS is_new
  FROM queries
),
numbered AS (
  SELECT user_id, ts,
         sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_no
  FROM marked
),
per_session AS (
  SELECT user_id, session_no,
         count(*) AS queries_cnt,
         date_diff('second', min(ts), max(ts)) AS seconds
  FROM numbered
  GROUP BY 1, 2
)
SELECT round(avg(queries_cnt), 4) AS avg_queries,
       round(avg(seconds) / 60.0, 4) AS avg_minutes
FROM per_session`,
      orderMatters: false,
      writeup: l(
        'Здесь важен порядок усреднения: сначала агрегируем внутри сессии, потом усредняем по сессиям. Если посчитать avg прямо по запросам, активные пользователи с длинными сессиями перетянут результат на себя — это ровно то же различие между «отношением сумм» и «средним отношений», которое потом всплывёт в A/B на ratio-метриках. Длительность сессии из одного запроса равна нулю, и это не ошибка: с одной точкой интервала нет. На продовых данных такие сессии обычно составляют заметную долю, поэтому среднюю длительность почти всегда показывают рядом с медианой и долей односессионных визитов — иначе среднее описывает не типичного пользователя, а смесь двух разных поведений.',
        'The order of averaging is what matters: aggregate inside the session first, then average across sessions. Computing avg straight over queries lets heavy users with long sessions pull the result towards themselves — exactly the "ratio of sums" versus "mean of ratios" distinction that resurfaces in A/B testing on ratio metrics. A one-query session has zero duration, and that is not a bug: a single point spans no interval. On production data such sessions are usually a sizeable share, so mean duration is almost always shown next to the median and the share of single-query visits — otherwise the mean describes not a typical user but a mixture of two different behaviours.',
      ),
      clickhouse: {
        code: `-- Схема та же, но в ClickHouse есть специальная функция для накопления:
-- The scheme is the same, but ClickHouse has a dedicated accumulator:
SELECT avg(queries_cnt) AS avg_queries, avg(seconds) / 60 AS avg_minutes
FROM (
    SELECT user_id, session_no, count() AS queries_cnt,
           dateDiff('second', min(ts), max(ts)) AS seconds
    FROM (
        SELECT user_id, ts,
               runningAccumulate(state) AS session_no
        FROM ( /* ... sumState(is_new) по пользователю ... */ )
    )
    GROUP BY user_id, session_no
)`,
        note: l(
          'В ClickHouse тот же паттерн пишется либо оконной функцией, как в DuckDB, либо через runningAccumulate с состоянием агрегата — исторически окон не было, и накопительные итоги делали именно так. Для сессионного анализа есть и готовые инструменты: sequenceMatch и windowFunnel считают воронки по событиям без ручной разметки сессий, и на больших логах их предпочитают.',
          'In ClickHouse the same pattern is written either with a window function, as in DuckDB, or with runningAccumulate over an aggregate state — windows did not exist historically, and running totals were done exactly this way. For session analysis there are purpose-built tools too: sequenceMatch and windowFunnel compute event funnels without marking sessions by hand, and on large logs they are preferred.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.sessions.session-ctr',
      prompt: l(
        'Посчитай долю сессий, в которых был хотя бы один клик. Три колонки в одной строке: sessions, sessions_with_click, session_ctr (округлить до 4 знаков). Порог сессии — 30 минут, сессии размечаются по запросам.',
        'Compute the share of sessions with at least one click. Three columns in a single row: sessions, sessions_with_click, session_ctr (rounded to 4 decimals). The session threshold is 30 minutes and sessions are marked over the queries.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- От сессии до клика: queries -> impressions -> clicks.
-- From a session down to a click: queries -> impressions -> clicks.
WITH marked AS (
  SELECT
  FROM queries
)
SELECT
FROM marked
`,
      reference: `WITH marked AS (
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
      orderMatters: false,
      writeup: l(
        'Запрос собирает всю ветку целиком: окно размечает сессии, джойны спускаются до кликов, условный агрегат считает долю. Две тонкости. Первая: группировать надо по паре (user_id, session_no) — номер сессии сам по себе не уникален. Вторая: LEFT JOIN к кликам обязателен, иначе сессии без единого клика исчезнут из знаменателя, и доля окажется равной единице. Содержательно session CTR — одна из самых честных быстрых метрик поиска: она не зависит от того, сколько показов поместилось на экран, и устойчива к пользователям, которые просто листают много. Её слабое место в другом: клик не означает, что пользователь нашёл нужное, поэтому рядом всегда смотрят на долю сессий с переформулировкой и на долю коротких кликов — это уже ветка метрик качества поиска.',
        'This query assembles the whole branch: a window marks the sessions, joins descend to the clicks, a conditional aggregate computes the share. Two subtleties. First, the grouping key must be the pair (user_id, session_no) — the session number alone is not unique. Second, the LEFT JOIN to clicks is mandatory, otherwise sessions without a single click vanish from the denominator and the share comes out as one. Substantively, session CTR is one of the more honest quick search metrics: it does not depend on how many impressions fit on screen and is robust to users who simply scroll a lot. Its weakness is elsewhere: a click does not mean the user found what they needed, so it is always read next to the share of sessions with a reformulation and the share of short clicks — which is the search quality metrics branch.',
      ),
      clickhouse: {
        code: `SELECT count() AS sessions,
       countIf(clicks > 0) AS sessions_with_click,
       round(countIf(clicks > 0) / count(), 4) AS session_ctr
FROM ( /* ... та же разметка сессий и джойн до кликов ... */ )`,
        note: l(
          'Условные агрегаты в ClickHouse пишутся суффиксом -If: countIf, sumIf, avgIf, uniqIf. Это не синтаксический сахар поверх FILTER, а отдельное семейство комбинаторов, и в сложных отчётах оно заметно короче: countIf(clicks > 0) против count(*) FILTER (WHERE clicks > 0).',
          'Conditional aggregates in ClickHouse use the -If suffix: countIf, sumIf, avgIf, uniqIf. It is not syntactic sugar over FILTER but a separate family of combinators, and in complex reports it is noticeably terser: countIf(clicks > 0) against count(*) FILTER (WHERE clicks > 0).',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'DuckDB documentation: window functions and CTEs',
      url: 'https://duckdb.org/docs/',
    },
    {
      title: 'ClickHouse documentation: windowFunnel and sequence functions',
      url: 'https://clickhouse.com/docs',
    },
  ],
};
