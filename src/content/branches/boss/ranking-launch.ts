import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const bossRankingLaunch: SkillNode = {
  id: 'boss.ranking-launch',
  branch: 'boss',
  act: 3,
  tier: 3,
  boss: true,
  title: l('Испытание III: запуск ранжирования', 'Trial III: launching a ranker'),
  blurb: l(
    'Выбрать метрики, измерить качество по логам, решить между интерливингом и A/B.',
    'Choose the metrics, measure quality from logs, decide between interleaving and an A/B.',
  ),
  requires: ['ab.review', 'search.interleaving', 'metric.traps'],
  theory: [
    {
      type: 'p',
      text: l(
        'Самое частое рабочее задание мидла в поисковой команде звучит так: «мы обучили новую модель ранжирования, давай проверим». За этой фразой стоит цепочка решений, каждое из которых стоит недели работы, если ошибиться. По какой метрике итерироваться. Чем мерить онлайн. Интерливинг или полноценный A/B. Сколько ждать. Что считать успехом.',
        'The most common working assignment for a middle engineer in a search team sounds like this: "we trained a new ranking model, let us check it". Behind that sentence sits a chain of decisions, each costing a week of work if you get it wrong. Which metric to iterate on. What to measure online. Interleaving or a full A/B. How long to wait. What counts as success.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Это последнее испытание основной линии. Оно собирает третий акт: выбор метрик, метрики качества поиска, чувствительность интерливинга и чтение отчёта. После него открываются отдельные области — реклама, retrieval, бандиты, классификация запросов, — и порядок там уже твой.',
        'This is the last trial of the main line. It gathers the third act: metric choice, search quality metrics, the sensitivity of interleaving and reading a report. After it the separate areas open up — ads, retrieval, bandits, query classification — and their order is yours to choose.',
      ),
    },
    {
      type: 'sim',
      sim: 'interleaving-sim',
      title: l('Напоминание: во сколько раз дешевле интерливинг', 'A reminder: how much cheaper interleaving is'),
      caption: l(
        'Поставь разницу между системами в 4–6% и посмотри, сколько запросов нужно каждому методу для мощности 80%. Разрыв в десятки раз — это и есть аргумент, которым защищают интерливинг как первый шаг. Второй шаг, A/B, всё равно понадобится: деньги и удержание интерливинг не измеряет.',
        'Set the gap between the systems to 4–6% and look at how many queries each method needs for 80% power. The order-of-magnitude difference is the argument for interleaving as a first step. The second step, an A/B, is still needed: interleaving measures neither money nor retention.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'metric-pick',
      id: 'boss.ranking-launch.metric-pick',
      area: l('Новая модель ранжирования товарного поиска', 'A new ranking model for product search'),
      scenario: l(
        'Новая модель ранжирования обучена, оффлайн она выглядит лучше. Трафика в поиске достаточно, асессорская разметка есть, платформа экспериментов умеет и A/B, и интерливинг. Нужно выбрать метрику для итераций над моделью, метрику, по которой примется решение о раскатке, и два ограничителя, которые не должны ухудшиться. Помни, что в этом сценарии реклама стоит в той же выдаче.',
        'A new ranking model is trained and looks better offline. Search traffic is plentiful, rater labels exist, and the experiment platform supports both A/B and interleaving. Choose the metric for iterating on the model, the metric the rollout decision will rest on, and two guardrails that must not degrade. Remember that ads share the same result page in this scenario.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'ndcg',
          label: l('nDCG@10 по асессорской разметке', 'nDCG@10 on rater labels'),
          correctFor: ['offline'],
          note: l(
            'Градации плюс чувствительность к порядку в топе, считается на каждой итерации обучения без выкатки. Решение по ней принимать нельзя: связь с деньгами не проверена.',
            'Grades plus sensitivity to order at the top, computed at every training iteration without shipping. It cannot carry the decision: its link to money is unverified.',
          ),
        },
        {
          id: 'session-success',
          label: l('Доля сессий, закончившихся заказом', 'Share of sessions ending in an order'),
          correctFor: ['online'],
          note: l(
            'Пользовательская метрика со знаменателем на уровне сессии, связана с бизнесом и устойчива к изменению числа запросов в сессии. Для решения о раскатке ранжирования — разумный выбор.',
            'A user-level metric with a session denominator, tied to the business and robust to changes in queries per session. A sensible basis for a ranking rollout decision.',
          ),
        },
        {
          id: 'ad-revenue',
          label: l('Выручка с рекламы на сессию', 'Ad revenue per session'),
          correctFor: ['guardrail'],
          note: l(
            'Реклама стоит в той же выдаче: изменение органического ранжирования меняет и внимание к рекламным местам. Классический guardrail на соседнюю систему, про который забывают поисковые команды.',
            'Ads live on the same page: changing the organic ranking changes attention to the ad slots too. The classic guardrail on a neighbouring system that search teams forget.',
          ),
        },
        {
          id: 'latency',
          label: l('Время ответа поиска, p99', 'Search latency, p99'),
          correctFor: ['guardrail'],
          note: l(
            'Новая модель почти всегда тяжелее предыдущей. Деградация скорости съедает выигрыш в релевантности и видна пользователю раньше, чем качество выдачи.',
            'A new model is almost always heavier than its predecessor. A latency regression eats the relevance gain and is visible to users before the ranking quality is.',
          ),
        },
        {
          id: 'interleaving-pref',
          label: l('Предпочтение в интерливинге', 'Interleaving preference'),
          correctFor: [],
          note: l(
            'Отличный инструмент быстрой проверки, но не метрика решения: он говорит только «какая выдача нравится больше здесь и сейчас» и ничего — про заказы, выручку и возвращаемость. В этом сценарии его место между оффлайном и A/B, а не вместо них.',
            'An excellent quick check but not a decision metric: it only says which page is preferred here and now and nothing about orders, revenue or retention. In this scenario it belongs between offline and A/B rather than instead of them.',
          ),
        },
        {
          id: 'ctr',
          label: l('CTR выдачи', 'Result page CTR'),
          correctFor: [],
          note: l(
            'Смещён позицией, растёт от кликбейта и падает, если выдача стала длиннее. Как метрика решения для ранжирования опасен: его легко поднять, не улучшив ничего.',
            'Biased by position, rises with clickbait and falls when the page gets longer. Dangerous as a ranking decision metric: it is easy to lift without improving anything.',
          ),
        },
        {
          id: 'model-auc',
          label: l('AUC модели на отложенной выборке', 'Model AUC on a held-out sample'),
          correctFor: [],
          note: l(
            'Техническая характеристика обучения, не метрика выдачи: она не знает ни про позиции, ни про то, что пользователь видит страницу целиком.',
            'A training characteristic rather than a results metric: it knows nothing about positions or about the user seeing a whole page.',
          ),
        },
      ],
      writeup: l(
        'Правильный набор повторяет канон: оффлайн — nDCG@10, решение — пользовательская метрика со знаменателем на уровне сессии, guardrails закрывают два разных риска. Интересна здесь именно пара ограничителей. Скорость — очевидный технический риск новой модели. А вот рекламная выручка как guardrail для чисто поискового изменения — то, что отличает инженера, понимающего продукт целиком: органика и реклама делят одну страницу и одно внимание пользователя, поэтому улучшение органического ранжирования способно уронить деньги, и узнать об этом лучше из эксперимента, чем из квартального отчёта. Отдельно про интерливинг: он отвергнут не потому, что плох, а потому, что отвечает на другой вопрос. Его место — между оффлайном и A/B: быстро отсеять варианты, которые пользователю не нравятся, и только лучший отправить в дорогой эксперимент с деньгами и guardrails.',
        'The right set follows the canon: nDCG@10 offline, a user-level metric with a session denominator for the decision, and guardrails covering two different risks. The pair of guardrails is the interesting part here. Latency is the obvious technical risk of a new model. Ad revenue as a guardrail for a purely organic change, though, is what distinguishes an engineer who understands the whole product: organic and ads share one page and one pool of user attention, so improving organic ranking can knock the money down, and learning that from an experiment beats learning it from a quarterly report. On interleaving: it is rejected not because it is poor but because it answers a different question. Its place is between offline and A/B — quickly discarding variants users dislike and sending only the best into the expensive experiment with money and guardrails.',
      ),
    },
    {
      kind: 'sql',
      id: 'boss.ranking-launch.sql-top3',
      prompt: l(
        'Посчитай по группам эксперимента долю запросов, в которых был клик по одной из первых трёх позиций. Четыре колонки: ab_group, queries — всего запросов группы, queries_with_top3_click, share (округли до 5 знаков). Запросы без показов учитывать не нужно. Сортировка по ab_group.',
        'By experiment group, compute the share of queries with a click on one of the first three positions. Four columns: ab_group, queries — the group\'s total queries, queries_with_top3_click, share (rounded to 5 decimals). Queries with no impressions need not be counted. Sort by ab_group.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Сначала один флаг на запрос, потом доля по группе.
-- One flag per query first, then the share per group.
WITH per_query AS (
  SELECT
  FROM queries
)
SELECT
FROM per_query
`,
      reference: `WITH per_query AS (
  SELECT q.query_id,
         u.ab_group,
         max(CASE WHEN i.position <= 3 AND cl.click_id IS NOT NULL THEN 1 ELSE 0 END) AS top3_click
  FROM queries q
  JOIN users u ON u.user_id = q.user_id
  JOIN impressions i ON i.query_id = q.query_id
  LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
  GROUP BY 1, 2
)
SELECT ab_group,
       count(*) AS queries,
       sum(top3_click) AS queries_with_top3_click,
       round(sum(top3_click) * 1.0 / count(*), 5) AS share
FROM per_query
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Паттерн «сначала флаг на единицу анализа, потом агрегат по группе» — рабочая лошадка любой метрики качества выдачи. Ключевое здесь max по CASE: он превращает несколько строк показов одного запроса в один булев факт «был ли клик в топ-3». Попытка посчитать это одним уровнем группировки даст долю показов, а не долю запросов, и числа разойдутся в разы. Почему именно такая метрика: доля запросов с кликом в топ-3 не зависит от того, сколько документов поместилось на страницу, и потому сравнима между версиями выдачи разной длины — в отличие от CTR на показ. Она при этом остаётся метрикой на уровне запроса, а не пользователя, поэтому для расчёта значимости её всё равно придётся либо свернуть до пользователя, либо взять дисперсию бутстрапом по пользователям.',
        'The pattern "a flag on the unit of analysis first, an aggregate per group second" is the workhorse of any result-quality metric. The key piece is the max over a CASE: it collapses the several impression rows of one query into a single boolean fact, "was there a click in the top three". Trying to compute this with one level of grouping yields a share of impressions rather than a share of queries, and the numbers differ several-fold. Why this metric: the share of queries with a top-3 click does not depend on how many documents fit on the page, so it is comparable across result pages of different lengths — unlike per-impression CTR. It remains a query-level metric rather than a user-level one, though, so computing significance still requires either collapsing it to the user or taking the variance from a bootstrap over users.',
      ),
      clickhouse: {
        code: `SELECT ab_group,
       count() AS queries,
       sum(top3_click) AS queries_with_top3_click,
       round(sum(top3_click) / count(), 5) AS share
FROM (
    SELECT q.query_id, u.ab_group,
           maxIf(1, i.position <= 3 AND cl.click_id != 0) AS top3_click
    FROM queries AS q
    INNER JOIN users AS u ON u.user_id = q.user_id
    INNER JOIN impressions AS i ON i.query_id = q.query_id
    LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
    GROUP BY q.query_id, u.ab_group
)
GROUP BY ab_group
ORDER BY ab_group`,
        note: l(
          'maxIf вместо max(CASE ...), и снова проверка на ноль вместо NULL после LEFT JOIN. На продовых объёмах такой запрос обычно не пишут вовсе: признак «клик в топ-3» кладут прямо в витрину событий на этапе ETL, потому что пересчитывать его на каждый отчёт по миллиардам показов слишком дорого.',
          'maxIf instead of max(CASE ...), and once again a comparison against zero rather than NULL after the LEFT JOIN. At production volumes this query is usually not written at all: the "click in the top three" flag is materialised into the event table during ETL, because recomputing it per report over billions of impressions is too expensive.',
        ),
      },
    },
    {
      kind: 'python',
      id: 'boss.ranking-launch.py-interleaving',
      prompt: l(
        'Посчитай результат интерливинга. На вход список запросов, каждый задан парой чисел: сколько кликов получила команда A и сколько команда B. Запрос считается выигранным той командой, у которой кликов больше; при равенстве запрос в расчёт не идёт. Верни кортеж (preference, z, p), где preference — доля побед команды B среди решённых запросов, z — статистика биномиального критерия относительно доли 0.5, а p — двустороннее p-value через erfc. Если решённых запросов нет, верни (0.5, 0.0, 1.0). Из библиотек доступен только math.',
        'Compute the outcome of an interleaving run. The input is a list of queries, each given by a pair of numbers: how many clicks team A received and how many team B did. A query is won by whichever team has more clicks; ties do not count. Return a tuple (preference, z, p) where preference is team B\'s share of wins among decided queries, z is the binomial test statistic against a share of 0.5, and p is the two-sided p-value via erfc. If no query was decided, return (0.5, 0.0, 1.0). Only math is available.',
      ),
      signature:
        'def interleaving_preference(queries: list[tuple[int, int]]) -> tuple[float, float, float]:',
      starter: `import math


def interleaving_preference(queries):
    """Preference for team B, with a binomial test against a coin flip."""
    # TODO
    return (0.5, 0.0, 1.0)
`,
      reference: `import math


def interleaving_preference(queries):
    """Preference for team B, with a binomial test against a coin flip."""
    wins_a = sum(1 for a, b in queries if a > b)
    wins_b = sum(1 for a, b in queries if b > a)
    decided = wins_a + wins_b
    if decided == 0:
        return (0.5, 0.0, 1.0)
    preference = wins_b / decided
    z = (wins_b - decided / 2) / math.sqrt(decided * 0.25)
    p = math.erfc(abs(z) / math.sqrt(2))
    return (preference, z, p)
`,
      sampleTests: `# A dead heat.
pref, z, p = interleaving_preference([(1, 1)] * 50)
assert pref == 0.5 and z == 0.0 and p == 1.0

# B wins everywhere.
pref, z, p = interleaving_preference([(0, 1)] * 100)
assert abs(pref - 1.0) < 1e-12 and z > 0 and p < 1e-6

assert interleaving_preference([]) == (0.5, 0.0, 1.0)
`,
      tests: `import math

# 1. Ties are excluded from the denominator entirely.
pref, _, _ = interleaving_preference([(1, 2)] * 30 + [(3, 3)] * 970)
assert abs(pref - 1.0) < 1e-12, pref

# 2. An even split of decided queries is no evidence either way.
pref, z, p = interleaving_preference([(1, 0)] * 500 + [(0, 1)] * 500)
assert abs(pref - 0.5) < 1e-12
assert abs(z) < 1e-12
assert abs(p - 1.0) < 1e-12

# 3. Swapping the teams mirrors the preference and flips the sign of z.
p1 = interleaving_preference([(0, 1)] * 60 + [(1, 0)] * 40)
p2 = interleaving_preference([(1, 0)] * 60 + [(0, 1)] * 40)
assert abs(p1[0] + p2[0] - 1.0) < 1e-12
assert abs(p1[1] + p2[1]) < 1e-12
assert abs(p1[2] - p2[2]) < 1e-12

# 4. A hand-computable z: 60 wins out of 100.
_, z, _ = interleaving_preference([(0, 1)] * 60 + [(1, 0)] * 40)
assert abs(z - (60 - 50) / math.sqrt(100 * 0.25)) < 1e-12, z

# 5. The same preference is more convincing on more queries.
_, _, p_small = interleaving_preference([(0, 1)] * 55 + [(1, 0)] * 45)
_, _, p_big = interleaving_preference([(0, 1)] * 5500 + [(1, 0)] * 4500)
assert p_small > 0.1 and p_big < 1e-9

# 6. Only the sign of the click difference matters, not its size.
a = interleaving_preference([(0, 1)] * 30 + [(1, 0)] * 20)
b = interleaving_preference([(0, 9)] * 30 + [(7, 0)] * 20)
assert abs(a[0] - b[0]) < 1e-12 and abs(a[1] - b[1]) < 1e-12

# 7. Every query tied means no evidence at all.
assert interleaving_preference([(2, 2)] * 1000) == (0.5, 0.0, 1.0)

# 8. The p-value is always a probability.
for wins_b, wins_a in ((1, 0), (0, 1), (7, 3), (500, 500), (999, 1)):
    _, _, p = interleaving_preference([(0, 1)] * wins_b + [(1, 0)] * wins_a)
    assert 0.0 <= p <= 1.0

# 9. Degenerate input.
assert interleaving_preference([]) == (0.5, 0.0, 1.0)
`,
      writeup: l(
        'Первый и шестой тесты вместе задают характер метода. Интерливинг смотрит только на знак разницы кликов внутри запроса: девять кликов против семи и один против нуля — одинаковая победа. Это сознательное огрубление, и оно же источник устойчивости. Разница между запросами полностью сокращается, потому что сравнение происходит внутри запроса, и остаётся чистый сигнал предпочтения — отсюда и выигрыш в чувствительности в десятки раз по сравнению с A/B. Первый тест показывает цену: ничьи выбрасываются, и если две системы выдают почти одинаковый топ, решённых запросов окажется мало, а статистика будет копиться медленно несмотря на все преимущества. Практическая деталь, которой нет в этой задаче: в проде клики взвешивают по позиции или по длительности, иначе короткий случайный клик весит столько же, сколько осознанный переход с долгим чтением.',
        'The first and sixth tests together define the character of the method. Interleaving looks only at the sign of the click difference inside a query: nine clicks against seven and one against zero are the same win. That is a deliberate coarsening and also the source of its robustness. Variation between queries cancels completely, because the comparison happens inside a query, leaving a clean preference signal — hence the order-of-magnitude sensitivity advantage over an A/B. The first test shows the price: ties are discarded, and if two systems return nearly identical tops, few queries get decided and statistics accumulate slowly despite every advantage. A practical detail absent from this task: production scoring weights clicks by position or dwell time, otherwise a short accidental click counts as much as a deliberate visit with a long read.',
      ),
    },
    {
      kind: 'case',
      id: 'boss.ranking-launch.case-plan',
      prompt: l(
        'Напиши план проверки новой модели ранжирования — такой, который можно принести на планирование. Исходные данные: nDCG@10 на разметке вырос на 1.8%, трафика в поиске около 2 миллионов поисковых сессий в неделю, платформа умеет A/B и интерливинг, рекламный блок стоит в той же выдаче. План должен отвечать на вопросы: что проверяем на каждом шаге, сколько это займёт, что считаем успехом и в какой момент имеем право раскатить на всех.',
        'Write a validation plan for the new ranking model — one you could bring to a planning meeting. The inputs: nDCG@10 on labels is up 1.8%, search traffic is about 2 million search sessions a week, the platform supports both A/B and interleaving, and the ad block sits on the same page. The plan must answer: what is checked at each step, how long it takes, what counts as success, and at what moment you have the right to ship to everyone.',
      ),
      reference: l(
        'Разумный план трёхступенчатый, и каждая ступень отвечает на свой вопрос. Шаг ноль, до всякого трафика: убедиться, что рост nDCG не артефакт. Посмотреть доверительный интервал метрики по выборке запросов, проверить, не пришёл ли весь прирост из частотного сегмента, и убедиться, что новая модель не поднимает документы, которых просто нет в пуле разметки — иначе метрика выросла, а выдача стала хуже. Шаг первый, интерливинг, два-три дня. Отвечает на вопрос «нравится ли пользователю новая выдача больше». По симулятору видно, что на эффекте в несколько процентов хватает тысяч запросов, то есть даже доли дневного трафика. Если интерливинг показывает предпочтение в пользу старой модели, дальше идти незачем, и это сэкономило две недели. Шаг второй, A/B, две полные недели. Отвечает на вопрос «стало ли лучше продукту». Метрика решения — доля сессий с заказом, посчитанная на уровне сессии, с интервалом. Guardrails: время ответа, рекламная выручка на сессию, доля сессий без клика. По размеру: 2 миллиона сессий в неделю, то есть около 2 миллионов на группу за две недели, и MDE по конверсионной метрике стоит посчитать заранее — если ожидаемый эффект меньше MDE, надо сразу сказать, что A/B ответа не даст, и либо брать более чувствительную метрику, либо применять CUPED. Критерий раскатки: метрика решения значимо не упала, ни один guardrail не ухудшился значимо, эффект не затухает к концу второй недели (проверка на новизну), SRM не сработал. Отдельно стоит зафиксировать, чего план не делает: не обещает роста выручки, потому что ранжирование влияет на неё опосредованно, и не заменяет долгосрочный holdout, который покажет накопленный эффект через квартал.',
        'A sensible plan has three steps and each answers its own question. Step zero, before any traffic: make sure the nDCG gain is not an artefact. Look at the confidence interval of the metric over the query sample, check whether the whole gain came from the head segment, and confirm the new model is not promoting documents that simply are not in the labelling pool — otherwise the metric rose while the page got worse. Step one, interleaving, two or three days. It answers "do users prefer the new page". The simulator shows that an effect of a few percent needs thousands of queries, a fraction of a day\'s traffic. If interleaving shows a preference for the old model there is no point going further, and that saved two weeks. Step two, an A/B, two full weeks. It answers "did the product get better". The decision metric is the share of sessions with an order, computed at session level, with an interval. Guardrails: latency, ad revenue per session, share of click-free sessions. On sizing: 2 million sessions a week means about 2 million per group over two weeks, and the MDE for the conversion metric should be computed in advance — if the expected effect is below the MDE, say immediately that the A/B will not answer, and either take a more sensitive metric or apply CUPED. Shipping criteria: the decision metric did not fall significantly, no guardrail degraded significantly, the effect has not decayed by the end of the second week (the novelty check), and SRM did not fire. It is worth recording what the plan does not do: it does not promise a revenue increase, because ranking affects revenue only indirectly, and it does not replace the long-term holdout that shows the accumulated effect a quarter later.',
      ),
      checklist: [
        l('Проверил оффлайн-прирост на артефакты до выкатки', 'Checked the offline gain for artefacts before shipping anything'),
        l('Поставил интерливинг первым шагом и объяснил, зачем', 'Put interleaving first and explained why'),
        l('Назвал метрику решения на уровне сессии или пользователя', 'Named a decision metric at session or user level'),
        l('Включил рекламную выручку в guardrails, хотя изменение поисковое', 'Included ad revenue among the guardrails although the change is organic'),
        l('Посчитал или потребовал посчитать MDE до запуска', 'Computed or demanded an MDE before launch'),
        l('Указал полные недели и проверку на эффект новизны', 'Specified whole weeks and a novelty check'),
        l('Сформулировал явный критерий раскатки, а не «посмотрим»', 'Stated an explicit shipping criterion rather than "we will see"'),
        l('Сказал, на какие вопросы план не отвечает', 'Said which questions the plan does not answer'),
      ],
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
    },
    {
      title: 'Wikipedia: Learning to rank',
      url: 'https://en.wikipedia.org/wiki/Learning_to_rank',
    },
  ],
};
