import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sqlMetrics: SkillNode = {
  id: 'sql.metrics',
  branch: 'sql',
  tier: 5,
  title: l('Продуктовые метрики', 'Product metrics'),
  blurb: l(
    'CTR, конверсия, позиции и группы эксперимента — и почему два верных запроса дают разные числа.',
    'CTR, conversion, positions and experiment groups — and why two correct queries disagree.',
  ),
  requires: ['sql.sessions'],
  theory: [
    {
      type: 'p',
      text: l(
        'К этому моменту у тебя есть все инструменты, и остаётся единственный по-настоящему сложный вопрос: что именно считать. «CTR вырос» — утверждение без смысла, пока не сказано, на что делили. Клики на показы, клики на запросы, доля запросов с кликом, доля сессий с кликом и средний по пользователям CTR — пять разных чисел, каждое из которых честное, и они расходятся не на проценты, а качественно: одно может расти, пока другое падает.',
        'By this point you have all the tools, and the only genuinely hard question left is what to compute. "CTR is up" means nothing until you say what it was divided by. Clicks over impressions, clicks over queries, share of queries with a click, share of sessions with a click, and the per-user average CTR are five different numbers, each of them honest, and they diverge not by a few percent but qualitatively: one can rise while another falls.',
      ),
    },
    {
      type: 'table',
      head: [
        l('Метрика', 'Metric'),
        l('Знаменатель', 'Denominator'),
        l('Чувствительна к', 'Sensitive to'),
      ],
      rows: [
        [
          l('CTR на показ', 'CTR per impression'),
          l('Все показанные документы', 'Every shown document'),
          l(
            'Длине выдачи: покажи 20 документов вместо 10 — CTR упадёт без единого изменения в качестве',
            'Result page length: show 20 documents instead of 10 and CTR drops with no change in quality at all',
          ),
        ],
        [
          l('Доля запросов с кликом', 'Share of queries with a click'),
          l('Запросы', 'Queries'),
          l(
            'Качеству топа выдачи, не зависит от длины страницы',
            'The quality of the top of the page, independent of page length',
          ),
        ],
        [
          l('Доля сессий с кликом', 'Share of sessions with a click'),
          l('Сессии', 'Sessions'),
          l(
            'Решению задачи целиком, с учётом переформулировок',
            'Solving the task as a whole, reformulations included',
          ),
        ],
        [
          l('Средний CTR по пользователям', 'Per-user average CTR'),
          l('Пользователи', 'Users'),
          l(
            'Опыту типичного пользователя: активный и редкий весят одинаково',
            'The typical user experience: heavy and occasional users weigh the same',
          ),
        ],
      ],
    },
    {
      type: 'h',
      text: l('Отношение сумм против среднего отношений', 'Ratio of sums versus mean of ratios'),
    },
    {
      type: 'p',
      text: l(
        'Два способа посчитать «CTR по пользователям» дают разные числа, и это не погрешность. Отношение сумм делит все клики на все показы — активный пользователь вносит больший вклад. Среднее отношений считает CTR каждому пользователю и усредняет — все весят поровну. Выбор между ними продуктовый: деньги считаются отношением сумм, а опыт типичного пользователя — средним отношений. В A/B это ещё и техническая развилка: у отношения сумм нестандартная дисперсия, и для него нужен дельта-метод или бутстрап.',
        'Two ways of computing "CTR across users" give different numbers, and that is not rounding error. The ratio of sums divides all clicks by all impressions — a heavy user contributes more. The mean of ratios computes a CTR per user and averages them — everyone weighs the same. The choice is a product decision: money is counted as a ratio of sums, the typical user experience as a mean of ratios. In A/B testing it is also a technical fork: the ratio of sums has a non-standard variance and needs the delta method or a bootstrap.',
      ),
    },
    { type: 'formula', tex: '\\frac{\\sum_u c_u}{\\sum_u s_u} \\;\\neq\\; \\frac{1}{n}\\sum_u \\frac{c_u}{s_u}' },
    {
      type: 'sim',
      sim: 'ratio-of-sums',
      title: l('Насколько сильно они расходятся', 'How far apart they actually get'),
      caption: l(
        'Симуляция пользователей с разной активностью. Ползунок задаёт, насколько сильно CTR зависит от активности: когда активные пользователи кликают хуже обычных, отношение сумм оказывается заметно ниже среднего отношений, и выбор метрики меняет знак эффекта в эксперименте. Числа считаются симуляцией при каждом движении ползунка.',
        'A simulation of users with different activity levels. The slider sets how strongly CTR depends on activity: when heavy users click worse than average, the ratio of sums lands well below the mean of ratios, and the choice of metric flips the sign of an experiment effect. The numbers are simulated afresh on every slider move.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Метрики по позициям требуют особой осторожности. CTR первой позиции выше не потому, что там лучшие документы, а потому, что её видят все. Сравнивать качество двух формул ранжирования по CTR на позицию нельзя: это сравнение не документов, а внимания. Для этого есть интерливинг и метрики с поправкой на позицию — отдельная ветка.',
        'Per-position metrics need particular care. The CTR of position one is higher not because the best documents live there but because everyone sees it. Comparing two ranking formulas by per-position CTR is invalid: it compares attention rather than documents. Interleaving and position-corrected metrics exist for that, and they get their own branch.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'sql.metrics.ab-groups',
      prompt: l(
        'Посчитай CTR по группам эксперимента. Группа берётся у пользователя, сделавшего запрос. Четыре колонки: ab_group, shows, clicks, ctr (округлить до 5 знаков). Сортировка по ab_group.',
        'Compute CTR by experiment group. The group comes from the user who made the query. Four columns: ab_group, shows, clicks, ctr (rounded to 5 decimals). Sort by ab_group.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Группа лежит в users, показы — в impressions, между ними queries.
-- The group lives in users, impressions in impressions, queries in between.
SELECT
FROM impressions
`,
      reference: `SELECT u.ab_group,
       count(*) AS shows,
       count(cl.click_id) AS clicks,
       round(count(cl.click_id) * 1.0 / count(*), 5) AS ctr
FROM impressions i
JOIN queries q ON q.query_id = i.query_id
JOIN users u ON u.user_id = q.user_id
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Технически это та же связка джойнов, что и раньше, но содержательно здесь прячется ловушка всей ветки A/B. Этот запрос считает CTR на показ, то есть берёт каждый показ за независимое наблюдение, хотя рандомизация была по пользователю. Само число посчитано верно, и как описательная статистика оно годится. Но как только по нему попытаются посчитать значимость обычной формулой для двух пропорций, p-value окажется занижено в разы: показы одного пользователя скоррелированы. Правильный путь — либо считать метрику на уровне пользователя, либо оставить отношение сумм, но брать дисперсию бутстрапом по пользователям или дельта-методом. Обрати внимание и на размер групп: они почти никогда не равны ровно, и это нормально до тех пор, пока расхождение не станет статистически значимым — тогда это SRM и повод остановить анализ.',
        'Technically this is the same chain of joins as before, but substantively it hides the trap of the entire A/B branch. This query computes CTR per impression, i.e. treats every impression as an independent observation, while randomisation was by user. The number itself is correct and perfectly fine as descriptive statistics. But the moment someone computes significance from it with the usual two-proportion formula, the p-value comes out several times too small: one user\'s impressions are correlated. The right route is either to compute the metric at user level, or to keep the ratio of sums but take its variance from a bootstrap over users or the delta method. Note the group sizes too: they are almost never exactly equal, and that is fine until the discrepancy becomes statistically significant — at which point it is SRM and a reason to stop the analysis.',
      ),
      clickhouse: {
        code: `SELECT u.ab_group,
       count() AS shows,
       countIf(cl.click_id != 0) AS clicks,
       round(countIf(cl.click_id != 0) / count(), 5) AS ctr
FROM impressions AS i
INNER JOIN queries AS q ON q.query_id = i.query_id
INNER JOIN users AS u ON u.user_id = q.user_id
LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
GROUP BY ab_group
ORDER BY ab_group`,
        note: l(
          'В продовых системах экспериментов такой запрос почти никогда не пишут руками: принадлежность к группе хранят прямо в таблице событий, чтобы не джойнить справочник пользователей на каждый отчёт, а метрики считают на заранее агрегированных витринах по пользователю. Джойн к users здесь — учебное упрощение.',
          'In production experiment systems a query like this is almost never written by hand: group membership is stored right in the event table so the user dimension does not have to be joined for every report, and metrics are computed over per-user pre-aggregates. The join to users here is a teaching simplification.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.metrics.position-ad-organic',
      prompt: l(
        'Сравни рекламу и органику по позициям с первой по пятую. Пять колонок: position, ad_shows, organic_shows, ad_ctr, organic_ctr. Оба CTR округли до 4 знаков. Если показов какого-то типа на позиции нет, соответствующий CTR должен быть NULL, а не ошибка деления. Сортировка по position.',
        'Compare ads and organic results across positions one to five. Five columns: position, ad_shows, organic_shows, ad_ctr, organic_ctr. Round both CTRs to 4 decimals. If a position has no impressions of one kind, the corresponding CTR must be NULL rather than a division error. Sort by position.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Условные агрегаты и защита знаменателя.
-- Conditional aggregates and a guarded denominator.
SELECT
FROM impressions
`,
      reference: `SELECT i.position,
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
      orderMatters: true,
      writeup: l(
        'Вся разбивка собирается одним проходом по таблице показов: четыре условных агрегата вместо четырёх подзапросов. nullif превращает нулевой знаменатель в NULL, и деление даёт NULL вместо падения — в отчёте пустая ячейка честнее нуля, потому что ноль читается как «кликов не было», а на самом деле не было показов. Что здесь интересно по сути: органика на той же позиции обычно собирает больше кликов, чем реклама. Это не значит, что реклама плохая — пользователи систематически меньше доверяют помеченным блокам, и именно поэтому рекламный аукцион ранжирует не по ставке, а по ставке, умноженной на вероятность клика, оценённую отдельно для рекламных позиций.',
        'The whole breakdown comes out of a single pass over the impression table: four conditional aggregates instead of four subqueries. nullif turns a zero denominator into NULL, so the division yields NULL instead of failing — in a report an empty cell is more honest than a zero, because a zero reads as "there were no clicks" when in fact there were no impressions. What is interesting substantively: organic results at the same position usually collect more clicks than ads. That does not make ads bad — users systematically trust labelled blocks less, which is exactly why an ad auction ranks by bid multiplied by a click probability estimated separately for ad slots, rather than by bid alone.',
      ),
      clickhouse: {
        code: `SELECT i.position,
       countIf(i.is_ad) AS ad_shows,
       countIf(NOT i.is_ad) AS organic_shows,
       round(countIf(cl.click_id != 0 AND i.is_ad)
             / nullIf(countIf(i.is_ad), 0), 4) AS ad_ctr,
       round(countIf(cl.click_id != 0 AND NOT i.is_ad)
             / nullIf(countIf(NOT i.is_ad), 0), 4) AS organic_ctr
FROM impressions AS i
LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
WHERE i.position <= 5
GROUP BY position
ORDER BY position`,
        note: l(
          'countIf читается короче, чем FILTER, а nullIf пишется с заглавной I. Обрати внимание, что условие клика снова не count(col): после LEFT JOIN в ClickHouse непокликанные показы получают ноль вместо NULL.',
          'countIf reads shorter than FILTER, and nullIf is spelled with a capital I. Note that the click condition is again not count(col): after a LEFT JOIN in ClickHouse unclicked impressions get a zero rather than a NULL.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.metrics.ratio-of-sums',
      prompt: l(
        'Посчитай CTR двумя способами и выведи оба числа в одной строке. Колонка ratio_of_sums — все клики, делённые на все показы. Колонка mean_of_ratios — средний по пользователям CTR, то есть сначала CTR каждому пользователю, потом среднее по пользователям. Обе величины округли до 5 знаков. Пользователи без показов не учитываются.',
        'Compute CTR two ways and output both numbers in one row. The column ratio_of_sums is all clicks divided by all impressions. The column mean_of_ratios is the per-user average CTR: a CTR per user first, then the mean across users. Round both to 5 decimals. Users with no impressions are not counted.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Сначала агрегат по пользователю, потом два разных способа свернуть его в одно число.
-- Aggregate per user first, then two different ways to collapse that into one number.
WITH per_user AS (
  SELECT
  FROM impressions
)
SELECT
FROM per_user
`,
      reference: `WITH per_user AS (
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
      orderMatters: false,
      writeup: l(
        'Разница между колонками — это разница между двумя вопросами. sum(clicks)/sum(shows) отвечает «какая доля всех показов была кликнута» и взвешивает пользователей по активности. avg(clicks/shows) отвечает «каков CTR у типичного пользователя» и взвешивает всех поровну. На этих данных числа близки, потому что активность пользователей сгенерирована однородно; на реальных логах расхождение бывает в полтора раза и больше, потому что распределение активности тяжелохвостое. Практические следствия три. Первое: в любом отчёте надо писать, какой из двух способов использован, иначе две команды получат разные числа и потратят день на сверку. Второе: отношение сумм — это не среднее независимых величин, поэтому обычная формула стандартной ошибки к нему неприменима, нужен дельта-метод или бутстрап по пользователям. Третье: когда метрика выбрана, менять способ усреднения в середине эксперимента нельзя — это выбор решения под данные.',
        'The difference between the columns is the difference between two questions. sum(clicks)/sum(shows) answers "what fraction of all impressions was clicked" and weights users by activity. avg(clicks/shows) answers "what is a typical user\'s CTR" and weights everyone equally. On this data the numbers come out close because user activity is generated uniformly; on real logs the gap reaches 1.5x and more, because the activity distribution is heavy-tailed. Three practical consequences. First, any report must state which of the two it used, otherwise two teams get different numbers and spend a day reconciling them. Second, a ratio of sums is not a mean of independent quantities, so the ordinary standard error formula does not apply to it — the delta method or a bootstrap over users is needed. Third, once the metric is chosen, the averaging scheme must not change mid-experiment: that is choosing the decision to fit the data.',
      ),
      clickhouse: {
        code: `WITH per_user AS (
    SELECT q.user_id, count() AS shows, countIf(cl.click_id != 0) AS clicks
    FROM impressions AS i
    INNER JOIN queries AS q ON q.query_id = i.query_id
    LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
    GROUP BY q.user_id
)
SELECT round(sum(clicks) / sum(shows), 5) AS ratio_of_sums,
       round(avg(clicks / shows), 5) AS mean_of_ratios
FROM per_user`,
        note: l(
          'Один в один, с поправкой на countIf и на то, что деление целых в ClickHouse и так даёт дробное. В системах экспериментов обе величины обычно считают сразу вместе с бутстрапными квантилями, потому что без доверительного интервала ни одно из этих чисел не является результатом.',
          'One to one, allowing for countIf and for integer division already returning a float in ClickHouse. Experiment systems usually compute both quantities together with bootstrap quantiles, because without a confidence interval neither number is a result.',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про выбор метрик и ratio-метрики.', 'The chapters on metric choice and ratio metrics.'),
    },
    {
      title: 'ClickHouse documentation: aggregate functions',
      url: 'https://clickhouse.com/docs',
    },
  ],
};
