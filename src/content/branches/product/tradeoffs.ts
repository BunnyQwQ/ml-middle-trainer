import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const productTradeoffs: SkillNode = {
  id: 'product.tradeoffs',
  branch: 'product',
  act: 5,
  tier: 2,
  title: l('Компромиссы и локальные улучшения', 'Trade-offs and local improvements'),
  blurb: l(
    'Почти каждое улучшение что-то отнимает. Вопрос в том, видно ли это в отчёте.',
    'Almost every improvement takes something away. The question is whether the report shows it.',
  ),
  requires: ['product.metrics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Самый опасный эксперимент — тот, где выбранная метрика выросла, а всё остальное никто не посмотрел. Почти любое изменение в продукте — это перераспределение: внимания между блоками, трафика между сегментами, денег между сегодня и через месяц. Отчёт, в котором растёт ровно одна метрика и нет ни одного числа про то, за счёт чего, — это не результат, это незаконченный анализ.',
        'The most dangerous experiment is the one where the chosen metric rose and nobody looked at anything else. Almost any product change is a redistribution: of attention between blocks, of traffic between segments, of money between today and a month from now. A report in which exactly one metric grows and there is not a single number about what paid for it is not a result but an unfinished analysis.',
      ),
    },
    {
      type: 'sim',
      sim: 'ad-load',
      title: l('Больше рекламы — больше денег, до какого-то места', 'More ads mean more money, up to a point'),
      caption: l(
        'Классический компромисс в чистом виде: доля рекламных мест против выручки сегодня и против возвращаемости. Обрати внимание, что максимум выручки за один визит и максимум за длинный горизонт достигаются в разных точках. Эксперимент на две недели видит только первый из них — поэтому в таких задачах guardrail на удержание не украшение, а единственная защита от решения, которое выглядит выигрышным ровно до следующего квартала.',
        'The classic trade-off in pure form: the share of ad slots against today\'s revenue and against return rate. Note that the maximum of single-visit revenue and the maximum over a long horizon sit at different points. A two-week experiment sees only the first — which is why a retention guardrail here is not decoration but the only defence against a decision that looks like a win right up until the next quarter.',
      ),
    },
    {
      type: 'sim',
      sim: 'offline-online',
      title: l('Почему оффлайн-выигрыш не доезжает до онлайна', 'Why an offline win does not reach online'),
      caption: l(
        'Второй источник ложных побед: метрика выросла на размеченном срезе, а в онлайне эффекта нет. Покрути позиционное смещение и долю размеченных запросов — и увидишь, при каких условиях оффлайн-метрика вообще перестаёт предсказывать онлайн. Это не повод отказаться от оффлайна, это повод знать, где он врёт.',
        'The second source of false victories: the metric grew on the labelled slice while online shows nothing. Turn the position bias and the share of labelled queries and see the conditions under which the offline metric stops predicting online at all. Not a reason to abandon offline, but a reason to know where it lies.',
      ),
    },
    {
      type: 'table',
      head: [
        l('Что выросло', 'What grew'),
        l('За счёт чего это обычно бывает', 'What usually pays for it'),
        l('Чем ловить', 'How to catch it'),
      ],
      rows: [
        [
          l('CTR выдачи', 'Result-page CTR'),
          l(
            'Выдача стала хуже, и пользователь кликает больше, не найдя с первого раза.',
            'Results got worse and the user clicks more, not finding it the first time.',
          ),
          l(
            'Доля запросов с переформулировкой, время до первого клика, заказы.',
            'Share of reformulated queries, time to first click, orders.',
          ),
        ],
        [
          l('Выручка с рекламы', 'Ad revenue'),
          l(
            'Органические клики каннибализированы: деньги переехали из будущих покупок в сегодняшний показ.',
            'Organic clicks cannibalised: money moved from future purchases into today\'s impression.',
          ),
          l(
            'Органический CTR на запросах с рекламой наверху, заказы на пользователя, возвращаемость.',
            'Organic CTR on queries with a top ad, orders per user, return rate.',
          ),
        ],
        [
          l('Конверсия', 'Conversion'),
          l(
            'В выдачу поднялись дешёвые товары: конверсия выше, средний чек ниже.',
            'Cheap items rose in the results: conversion up, order value down.',
          ),
          l('Выручка на пользователя, средний чек.', 'Revenue per user, average order value.'),
        ],
        [
          l('Средняя метрика по всем пользователям', 'The average metric over all users'),
          l(
            'Выигрыш на большом сегменте и проигрыш на маленьком, но важном: новые пользователи, мобильные, длинные запросы.',
            'A gain on a big segment and a loss on a small but important one: new users, mobile, long queries.',
          ),
          l(
            'Разрез по сегментам, заданный заранее, а не подобранный после.',
            'A segment breakdown fixed in advance rather than picked afterwards.',
          ),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Правило, которое экономит больше всего времени на ревью: к каждой метрике роста заранее подбирается метрика, которая обязана не упасть, и обе кладутся в один отчёт. Не потому что рост подозрителен, а потому что без второй половины невозможно отличить улучшение от перераспределения — ни тебе, ни тому, кто читает отчёт через полгода.',
        'The rule that saves the most review time: every growth metric gets a paired metric that must not fall, chosen in advance, and both go into the same report. Not because growth is suspicious, but because without the second half there is no telling an improvement from a redistribution — neither for you nor for whoever reads the report six months later.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'product.tradeoffs.sql-cannibalisation',
      prompt: l(
        'Проверь каннибализацию: сравни органический CTR на запросах, где на первой позиции стояла реклама, и на остальных. Верни две строки: has_top_ad (0 или 1), число таких запросов queries и органический CTR organic_ctr, посчитанный как отношение суммы органических кликов к сумме органических показов, округлённый до четырёх знаков. Учитывай только запросы, у которых есть хотя бы один органический показ. Сортировка по has_top_ad по возрастанию.',
        'Check for cannibalisation: compare the organic CTR of queries where position one held an ad against the rest. Return two rows: has_top_ad (0 or 1), the number of such queries as queries, and the organic CTR as organic_ctr, computed as the ratio of summed organic clicks to summed organic impressions, rounded to four decimals. Count only queries that have at least one organic impression. Sort by has_top_ad ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `SELECT
  0 AS has_top_ad,
  count(*) AS queries,
  0.0 AS organic_ctr
FROM impressions`,
      reference: `WITH top_ad AS (
  SELECT
    query_id,
    max(CASE WHEN position = 1 AND is_ad THEN 1 ELSE 0 END) AS has_top_ad
  FROM impressions
  GROUP BY query_id
),
organic AS (
  SELECT
    i.query_id,
    count(*) AS organic_shows,
    count(c.click_id) AS organic_clicks
  FROM impressions i
  LEFT JOIN clicks c ON c.impression_id = i.impression_id
  WHERE NOT i.is_ad
  GROUP BY i.query_id
)
SELECT
  t.has_top_ad,
  count(*) AS queries,
  round(sum(o.organic_clicks) * 1.0 / sum(o.organic_shows), 4) AS organic_ctr
FROM top_ad t
JOIN organic o ON o.query_id = t.query_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Это ratio-of-sums, а не среднее отношений, и разница здесь принципиальна: если считать CTR отдельно по каждому запросу и потом усреднить, запрос с одним показом получит тот же вес, что запрос с двадцатью, и картина уедет в сторону хвоста. Поэтому суммы кликов и показов складываются по группе и делятся один раз — ровно так же, как считается CTR в любом отчёте.\n\nНо главное в этой задаче не SQL, а то, что число само по себе ничего не доказывает. Реклама наверху показывается не случайно: её ставят на коммерческие запросы с высоким намерением купить, а такие запросы и без рекламы ведут себя иначе. Поэтому разница в органическом CTR между группами — это смесь эффекта рекламы и эффекта отбора запросов. Честный ответ на вопрос о каннибализации даёт только эксперимент, где реклама включается случайно; этот запрос — способ увидеть, есть ли повод такой эксперимент ставить.',
        'This is a ratio of sums rather than an average of ratios, and the difference is essential: computing CTR per query and averaging gives a query with one impression the same weight as one with twenty, which drags the picture towards the tail. So clicks and impressions are summed within the group and divided once — exactly how CTR is computed in any report.\n\nBut the point of this task is not the SQL. The number proves nothing by itself. A top ad is not shown at random: it goes on commercial queries with high purchase intent, and such queries behave differently with or without ads. So the organic CTR gap between the groups mixes the ad effect with a query-selection effect. An honest answer about cannibalisation comes only from an experiment where the ad is switched on at random; this query is a way to see whether such an experiment is worth running.',
      ),
      clickhouse: {
        code: `WITH top_ad AS (
  SELECT query_id, max(position = 1 AND is_ad) AS has_top_ad
  FROM impressions
  GROUP BY query_id
),
organic AS (
  SELECT
    i.query_id AS query_id,
    count() AS organic_shows,
    countIf(c.click_id != 0) AS organic_clicks
  FROM impressions AS i
  LEFT JOIN clicks AS c ON c.impression_id = i.impression_id
  WHERE NOT i.is_ad
  GROUP BY i.query_id
)
SELECT
  t.has_top_ad AS has_top_ad,
  count() AS queries,
  round(sum(o.organic_clicks) / sum(o.organic_shows), 4) AS organic_ctr
FROM top_ad AS t
INNER JOIN organic AS o ON o.query_id = t.query_id
GROUP BY has_top_ad
ORDER BY has_top_ad`,
        note: l(
          'countIf вместо count по джойну и булево выражение прямо под max — обычный стиль ClickHouse. Важная разница: LEFT JOIN в ClickHouse заполняет отсутствующие строки нулями типа, а не NULL, поэтому проверять надо на ноль, а не на NULL.',
          'countIf instead of counting a join, and a boolean expression straight under max, are ordinary ClickHouse style. One important difference: a LEFT JOIN in ClickHouse fills missing rows with the type\'s zero rather than NULL, so the check is against zero rather than NULL.',
        ),
      },
    },
    {
      kind: 'quiz',
      id: 'product.tradeoffs.q-paired',
      mode: 'single',
      prompt: l(
        'Эксперимент поднял CTR выдачи на 4%, заказы на пользователя не изменились (интервал включает ноль), время до первого клика выросло на 6%. Какой вывод наиболее обоснован?',
        'An experiment raised result-page CTR by 4%, left orders per user unchanged (the interval includes zero) and increased time to first click by 6%. Which conclusion is best supported?',
      ),
      choices: [
        {
          id: 'ship',
          text: l(
            'Выкатывать: CTR вырос значимо, заказы хотя бы не упали',
            'Ship it: CTR is significantly up and orders at least did not fall',
          ),
        },
        {
          id: 'worse',
          text: l(
            'Скорее всего выдача стала хуже: пользователь кликает больше и ищет дольше при том же результате',
            'Results most likely got worse: the user clicks more and searches longer for the same outcome',
          ),
        },
        {
          id: 'underpowered',
          text: l(
            'Эксперимент недомощный, нужно просто продлить до значимости по заказам',
            'The experiment is underpowered; just extend it until orders reach significance',
          ),
        },
        {
          id: 'novelty',
          text: l('Это эффект новизны, через месяц CTR вернётся', 'This is a novelty effect; CTR will return in a month'),
        },
      ],
      correct: ['worse'],
      explanation: l(
        'Три числа складываются в одну историю: кликов больше, времени до первого клика больше, результата столько же. Это ровно то, как выглядит ухудшение выдачи — нужный документ съехал, и пользователь вынужден просмотреть и кликнуть больше, чтобы добраться до того же. CTR в такой конструкции растёт не вопреки ухудшению, а из-за него. Вариант «продлить до значимости» звучит разумно, но он отвечает не на тот вопрос: заказы не просто незначимы, у нас есть независимый сигнал в сторону ухудшения, и дополнительные две недели его не отменят. Эффект новизны тоже не объясняет рост времени до клика: новизна обычно даёт кратковременный всплеск внимания, а не систематически более долгий поиск.',
        'The three numbers tell one story: more clicks, longer time to the first click, the same outcome. That is exactly what degraded results look like — the needed document slid down and the user has to scan and click more to reach the same place. CTR in that construction rises not despite the degradation but because of it. "Extend it to significance" sounds reasonable but answers the wrong question: orders are not merely insignificant, we have an independent signal pointing at harm, and two more weeks will not cancel it. A novelty effect does not explain the longer time to click either: novelty usually gives a short burst of attention rather than systematically longer searching.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'product.tradeoffs.pick-push',
      area: l('Пуш-уведомления о снижении цены', 'Price-drop push notifications'),
      scenario: l(
        'Команда роста предлагает присылать пуш, когда цена товара из избранного упала. Пуши может увидеть любой пользователь с установленным приложением. Нужна метрика для итераций над моделью выбора получателей, решающая метрика и два ограничителя. Имей в виду, что от пушей отписываются и приложение удаляют, а эффект отписки необратим.',
        'A growth team proposes sending a push when the price of a favourited item drops. Any user with the app installed can receive these. Pick the metric for iterating on the recipient-selection model, the deciding metric, and two guardrails. Bear in mind that people unsubscribe from pushes and delete apps, and an unsubscribe is irreversible.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'push-ctr',
          label: l('CTR пуша по модели выбора получателей', 'Push CTR under the recipient model'),
          correctFor: ['offline'],
          note: l(
            'Считается по историческим пушам и прямо отражает то, что модель меняет, — кому слать. Решать по ней нельзя: CTR растёт, если слать только тем, кто и так зайдёт.',
            'Computed from historical pushes and directly reflects what the model changes — whom to send to. It cannot carry the decision: CTR rises if you only send to people who would have come anyway.',
          ),
        },
        {
          id: 'incremental-orders',
          label: l('Инкрементальные заказы на пользователя', 'Incremental orders per user'),
          correctFor: ['online'],
          note: l(
            'Ключевое слово — инкрементальные: сравнение с контрольной группой, которой пуш не отправляли. Без контроля пуши припишут себе заказы тех, кто пришёл бы сам.',
            'The key word is incremental: a comparison with a holdout that got no push. Without a holdout, pushes claim credit for orders that would have happened anyway.',
          ),
        },
        {
          id: 'unsub',
          label: l('Доля отписок от пушей', 'Push unsubscribe rate'),
          correctFor: ['guardrail'],
          note: l(
            'Прямо названный в условии необратимый риск: отписавшегося пользователя не вернуть, и ущерб накапливается за пределами двух недель эксперимента.',
            'The irreversible risk named in the statement: an unsubscribed user does not come back, and the damage accumulates beyond the experiment\'s two weeks.',
          ),
        },
        {
          id: 'uninstall',
          label: l('Доля удалений приложения', 'App uninstall rate'),
          correctFor: ['guardrail'],
          note: l(
            'Худшая форма того же риска. Редкое событие, поэтому на него почти никогда не хватает мощности в коротком эксперименте — но смотреть на него обязательно, хотя бы как на направленный сигнал.',
            'The worst form of the same risk. A rare event, so a short experiment almost never has the power for it — but it must still be watched, at least as a directional signal.',
          ),
        },
        {
          id: 'push-volume',
          label: l('Число отправленных пушей', 'Number of pushes sent'),
          correctFor: [],
          note: l(
            'Метрика активности команды, а не пользы. Её можно увеличить одним SQL-запросом, и это ничего не говорит о продукте.',
            'A measure of the team\'s activity rather than of value. It can be raised with a single SQL query, which says nothing about the product.',
          ),
        },
        {
          id: 'dau',
          label: l('DAU', 'DAU'),
          correctFor: [],
          note: l(
            'Вырастет от любой рассылки на следующий день просто потому, что людей разбудили. Для задачи с необратимым оттоком это худший из возможных ориентиров: он максимален ровно тогда, когда шлют слишком много.',
            'It rises after any blast the next day simply because people were woken up. For a task with irreversible churn it is the worst possible compass: it peaks exactly when you send too much.',
          ),
        },
      ],
      writeup: l(
        'Задачи про уведомления устроены так, что почти все очевидные метрики растут от «слать больше», а вред копится в необратимой части — отписках и удалениях. Поэтому решающая метрика обязана быть инкрементальной, то есть измеренной против контрольной группы без пушей, а ограничители — закрывать именно необратимое. И отдельно стоит помнить про горизонт: ущерб от переизбытка писем виден на месяцах, а выигрыш — на днях, поэтому такие эксперименты держат дольше обычного и оставляют постоянную контрольную группу.',
        'Notification tasks are built so that almost every obvious metric rises from "send more", while the harm accumulates in the irreversible part — unsubscribes and uninstalls. So the deciding metric has to be incremental, measured against a holdout that gets no pushes, and the guardrails have to cover exactly the irreversible. And the horizon deserves separate attention: the damage from over-messaging shows over months while the gain shows over days, so these experiments run longer than usual and keep a permanent holdout.',
      ),
    },
    {
      kind: 'case',
      id: 'product.tradeoffs.case-report',
      prompt: l(
        'Коллега приносит результат: новая модель рекламного ранжирования дала +3.1% к выручке с рекламы, p-value 0.01, эксперимент шёл две недели на 10% трафика. Других чисел в отчёте нет. Напиши, какие именно числа ты попросишь добавить и почему каждое из них; что ты будешь готов выкатить, если они окажутся в норме; и при каком сочетании чисел ты будешь возражать против выкатки, несмотря на значимый рост выручки.',
        'A colleague brings a result: the new ad ranking model gave +3.1% ad revenue at p = 0.01, measured over two weeks on 10% of traffic. The report contains no other numbers. Write down which numbers you would ask to add and why each one; what you would be ready to ship if they come back fine; and what combination of numbers would make you argue against shipping despite the significant revenue gain.',
      ),
      reference: l(
        'Прошу четыре группы чисел. Первая — органика: органический CTR и заказы на пользователя. Рост выручки с рекламы может быть перераспределением, а не приростом: рекламные места съели внимание, которое ушло бы на органические результаты, и заказ случился бы всё равно, только без платы за клик. Если заказы на пользователя в нуле, а выручка с рекламы выросла, скорее всего это и произошло.\n\nВторая — ограничители на пользователя: доля запросов без клика, время до первого клика, возвращаемость. Реклама влияет на то, как люди относятся к сервису, и этот эффект за две недели виден плохо, но направление увидеть можно.\n\nТретья — разрез по сегментам, заданный заранее: мобильные и десктоп, новые и старые пользователи, коммерческие и информационные запросы. Выигрыш в среднем при провале на новых пользователях — частый и дорогой сценарий, потому что новые пользователи решают, останутся ли они вообще.\n\nЧетвёртая — проверки здоровья самого эксперимента: SRM, динамика эффекта по дням, доля трафика в каждой группе. Значимый результат на сломанном сплите не значит ничего, и эта проверка стоит пяти минут.\n\nВыкачу, если заказы на пользователя не упали, органический CTR цел, по сегментам нет заметного провала, SRM в порядке и эффект не затухает к концу второй недели.\n\nВозражать буду при сочетании: выручка с рекламы вверх, заказы на пользователя в нуле или вниз, органический CTR вниз. Это картина каннибализации, при которой компания меняет будущие покупки на сегодняшние клики. Второе сочетание — эффект держится первые три дня и затухает: признак новизны, и годовая экстраполяция тогда завышена в разы. Третье — рост целиком в одном сегменте, а в остальных ноль или минус: такой результат не выкатывают целиком, его выкатывают на сегмент.',
        'I ask for four groups of numbers. First, the organic side: organic CTR and orders per user. An ad revenue gain can be a redistribution rather than an addition: ad slots ate attention that would have gone to organic results, and the order would have happened anyway, only without a paid click. If orders per user sit at zero while ad revenue grows, that is most likely what happened.\n\nSecond, user-level guardrails: the share of queries with no click, time to first click, return rate. Ads change how people feel about the service, and two weeks show that badly — but the direction is visible.\n\nThird, a segment breakdown fixed in advance: mobile and desktop, new and returning users, commercial and informational queries. A gain on average with a loss on new users is a common and expensive scenario, because new users are deciding whether to stay at all.\n\nFourth, the experiment\'s own health: SRM, the effect by day, the traffic share in each arm. A significant result on a broken split means nothing, and that check costs five minutes.\n\nI would ship if orders per user did not fall, organic CTR is intact, no segment shows a marked loss, SRM is fine and the effect does not fade by the end of the second week.\n\nI would argue against on this combination: ad revenue up, orders per user flat or down, organic CTR down. That is the picture of cannibalisation, where the company trades future purchases for today\'s clicks. The second combination is an effect that holds for three days and fades: a novelty signature, which makes an annual extrapolation several times too large. The third is a gain concentrated in one segment with zero or minus elsewhere: such a result does not ship wholesale, it ships to the segment.',
      ),
      checklist: [
        l(
          'Запросил метрики органики, а не только рекламы.',
          'Asked for organic metrics, not only ad metrics.',
        ),
        l(
          'Назвал заказы на пользователя как проверку, что это прирост, а не перераспределение.',
          'Named orders per user as the check that this is an addition rather than a redistribution.',
        ),
        l(
          'Попросил разрез по сегментам, заданный заранее.',
          'Asked for a segment breakdown fixed in advance.',
        ),
        l('Проверил здоровье эксперимента: SRM и динамику по дням.', 'Checked experiment health: SRM and the effect by day.'),
        l(
          'Сформулировал условие выкатки до того, как увидел числа.',
          'Stated the shipping condition before seeing the numbers.',
        ),
        l(
          'Описал конкретное сочетание чисел, при котором возражает.',
          'Described a concrete combination of numbers that triggers an objection.',
        ),
        l(
          'Упомянул горизонт: две недели не видят отложенного эффекта рекламы.',
          'Mentioned the horizon: two weeks cannot see the delayed effect of ads.',
        ),
      ],
      writeup: l(
        'Разбор чужого отчёта — половина работы мидла, и выглядит она именно так: не «я не верю», а список конкретных чисел с объяснением, что каждое из них исключает. Самое ценное в этом ответе — условие выкатки, сформулированное до того, как числа увидены. Если формулировать после, почти невозможно не подогнать его под уже известный результат, и это происходит не со злого умысла, а само собой.',
        'Reviewing someone else\'s report is half of a middle engineer\'s job and looks exactly like this: not "I do not believe it" but a list of concrete numbers with an explanation of what each one rules out. The most valuable part of this answer is the shipping condition stated before the numbers are seen. State it afterwards and it is nearly impossible not to fit it to the result you already know — not out of malice, it simply happens.',
      ),
    },
  ],
};
