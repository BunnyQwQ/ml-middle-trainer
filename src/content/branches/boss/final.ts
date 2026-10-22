import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const bossFinal: SkillNode = {
  id: 'boss.final',
  branch: 'boss',
  act: 5,
  tier: 4,
  boss: true,
  contest: { minutes: 60 },
  title: l('Испытание V: от постановки до решения', 'Trial V: from framing to the decision'),
  blurb: l(
    'Поставить задачу, измерить по логам, посчитать деньги, написать правило выкатки и защитить его тестами.',
    'Frame the task, measure it from the logs, count the money, write the rollout rule and defend it with tests.',
  ),
  requires: ['sysd.production', 'product.prioritization'],
  theory: [
    {
      type: 'p',
      text: l(
        'Последнее испытание устроено как рабочая неделя, а не как экзамен. Входные данные: маркетплейс хочет поднять конверсию поиска в заказ; у тебя есть логи, две недели и команда из тебя одного. Пять заданий идут по той же цепочке, по которой идёт настоящая задача: выбрать метрики, измерить текущее состояние по логам, перевести ожидаемый эффект в деньги, записать правило выкатки кодом и покрыть это правило тестами так, чтобы оно не сломалось молча.',
        'The last trial is shaped like a working week rather than an exam. The inputs: a marketplace wants to raise search-to-order conversion; you have the logs, two weeks and a team of one. Five assignments follow the same chain a real task does: choose the metrics, measure the current state from the logs, convert the expected effect into money, write the rollout rule as code, and cover that rule with tests so it cannot break silently.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Это финал основной линии тренажёра. В нём собрано всё: выбор метрики из третьего акта, ratio-метрики и ограничители из второго, SQL по логам из первого, порядок выкатки и мониторинг из пятого, мутационные тесты из ветки продовых тестов. Отдельных новых знаний здесь нет — проверяется, что они соединяются.',
        'This is the finale of the trainer\'s main line. Everything is gathered here: metric choice from act three, ratio metrics and guardrails from act two, SQL over logs from act one, the rollout order and monitoring from act five, mutation testing from the production-testing branch. There is no new knowledge here — what is tested is that it connects.',
      ),
    },
    {
      type: 'sim',
      sim: 'money-bridge',
      title: l('Напоминание: один процент в любом множителе', 'A reminder: one per cent in any factor'),
      caption: l(
        'Понадобится в третьем задании. Выручка — произведение множителей, поэтому процент конверсии и процент CTR стоят одинаково, а различаются только ценой получения.',
        'Needed in the third assignment. Revenue is a product of factors, so a per cent of conversion and a per cent of CTR are worth the same and differ only in what they cost to get.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'metric-pick',
      id: 'boss.final.pick',
      area: l('Конверсия поиска в заказ', 'Search-to-order conversion'),
      scenario: l(
        'Маркетплейс хочет поднять долю поисковых сессий, заканчивающихся заказом. Планируется менять ранжирование: поднимать товары, которые чаще покупают, а не те, которые чаще кликают. Выбери метрику для итераций, решающую метрику и два ограничителя. Учти два риска: такая перестановка может поднять наверх дешёвые ходовые товары, и она может ухудшить выдачу на информационных запросах, где покупки нет вовсе.',
        'A marketplace wants to raise the share of search sessions ending in an order. The plan is to change ranking: promote items that are bought more often rather than clicked more often. Choose the iteration metric, the deciding metric and two guardrails. Mind two risks: this reshuffle can push cheap fast-moving goods to the top, and it can hurt results on informational queries where no purchase is involved at all.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'offline-conv-ndcg',
          label: l(
            'nDCG@10 с покупкой в качестве релевантности',
            'nDCG@10 with purchase as the relevance label',
          ),
          correctFor: ['offline'],
          note: l(
            'Считается по логам на каждой итерации и измеряет ровно то, что модель теперь оптимизирует, — порядок покупаемых товаров в топе.',
            'Computed from logs at every iteration and measures exactly what the model now optimises — the order of purchased items in the top.',
          ),
        },
        {
          id: 'orders-per-session',
          label: l('Доля сессий с заказом', 'Share of sessions with an order'),
          correctFor: ['online'],
          note: l(
            'Дословно то, что просит бизнес, и то, по чему принимается решение. Шумнее оффлайн-метрики, поэтому не годится для ежедневных итераций.',
            'Literally what the business asks for and what the decision rests on. Noisier than the offline metric, so unfit for daily iteration.',
          ),
        },
        {
          id: 'revenue-per-user',
          label: l('Выручка на пользователя', 'Revenue per user'),
          correctFor: ['guardrail'],
          note: l(
            'Закрывает первый названный риск: дешёвые ходовые товары поднимают число заказов и роняют чек, и в числе заказов этого не видно.',
            'Covers the first named risk: cheap fast-moving goods raise the order count and lower the basket, which the order count cannot show.',
          ),
        },
        {
          id: 'info-query-quality',
          label: l(
            'Доля запросов без клика на информационных запросах',
            'No-click share on informational queries',
          ),
          correctFor: ['guardrail'],
          note: l(
            'Закрывает второй риск: на запросах без покупательского намерения оптимизация под покупку ухудшает выдачу, а в средних числах этот сегмент тонет.',
            'Covers the second risk: on queries with no purchase intent, optimising for purchases degrades results, and this segment drowns in the averages.',
          ),
        },
        {
          id: 'ctr',
          label: l('CTR выдачи', 'Result-page CTR'),
          correctFor: [],
          note: l(
            'Именно от него команда сознательно уходит: модель перестаёт оптимизировать клики. Ожидаемое падение CTR здесь не поломка, поэтому и ограничителем он быть не может.',
            'This is exactly what the team is deliberately moving away from: the model stops optimising clicks. A CTR drop here is expected rather than a breakage, so it cannot serve as a guardrail.',
          ),
        },
        {
          id: 'gmv-total',
          label: l('Суммарный GMV за период', 'Total GMV for the period'),
          correctFor: [],
          note: l(
            'Абсолютная величина, которая зависит от размера группы и от сезона сильнее, чем от изменения. В эксперименте сравнивают метрики на пользователя, а не суммы.',
            'An absolute figure that depends on arm size and season more than on the change. Experiments compare per-user metrics rather than totals.',
          ),
        },
        {
          id: 'model-auc',
          label: l('ROC AUC модели покупки', 'ROC AUC of the purchase model'),
          correctFor: [],
          note: l(
            'Метрика модели, а не выдачи: она не видит порядок в топе, который здесь и есть предмет изменения, и не чувствительна к тому, что происходит на первых трёх позициях.',
            'A model metric rather than a results metric: it cannot see order in the top, which is the thing being changed, and is insensitive to what happens in the first three positions.',
          ),
        },
      ],
      writeup: l(
        'Главная ловушка этого сценария — соблазн взять CTR ограничителем. Он выглядит как естественная защита, но команда сознательно уходит от оптимизации кликов, поэтому его падение — ожидаемое следствие, а не поломка. Ограничитель, который срабатывает при штатном поведении, хуже отсутствующего: его начинают игнорировать, и вместе с ним игнорируют настоящие срабатывания. Ограничители здесь берутся из двух рисков, названных в условии прямым текстом, и это общее правило: если ограничитель нельзя связать с конкретным способом сломать продукт, он лишний.',
        'The trap in this scenario is the temptation to take CTR as a guardrail. It looks like natural protection, but the team is deliberately moving away from optimising clicks, so a CTR drop is an expected consequence rather than a breakage. A guardrail that fires during normal behaviour is worse than no guardrail: people start ignoring it, and with it they ignore the real alerts. The guardrails here come from the two risks named explicitly in the statement, which is the general rule: if you cannot tie a guardrail to a concrete way of breaking the product, it is dead weight.',
      ),
    },
    {
      kind: 'sql',
      id: 'boss.final.sql-baseline',
      prompt: l(
        'Измерь текущее состояние: конверсию поиска в заказ по дням. Заказ считается связанным с поисковым днём, если он сделан тем же пользователем в тот же календарный день. Верни дату day, число запросов queries, число пользователей, сделавших в этот день заказ, как buyers, и конверсию conversion, равную buyers / число пользователей, искавших в этот день, округлённую до четырёх знаков. Сортировка по дате по возрастанию.',
        'Measure the current state: search-to-order conversion by day. An order counts as tied to a search day if the same user placed it on the same calendar day. Return the date as day, the number of queries as queries, the number of users who ordered that day as buyers, and conversion as buyers divided by the number of users who searched that day, rounded to four decimals. Sort by date ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `SELECT
  CAST(ts AS DATE) AS day,
  count(*) AS queries
FROM queries
GROUP BY 1
ORDER BY 1`,
      reference: `WITH searchers AS (
  SELECT
    CAST(ts AS DATE) AS day,
    user_id,
    count(*) AS queries
  FROM queries
  GROUP BY 1, 2
),
buyers AS (
  SELECT DISTINCT CAST(ts AS DATE) AS day, user_id
  FROM orders
)
SELECT
  s.day,
  sum(s.queries) AS queries,
  count(b.user_id) AS buyers,
  round(count(b.user_id) * 1.0 / count(*), 4) AS conversion
FROM searchers s
LEFT JOIN buyers b ON b.day = s.day AND b.user_id = s.user_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Задача целиком про единицу наблюдения. Конверсия здесь считается по пользователям, а не по запросам, поэтому сначала строится таблица «пользователь в дне», и уже она соединяется с покупателями. Если соединять заказы напрямую с запросами, пользователь с десятью запросами и одним заказом даст десять совпадений, и конверсия вылетит за единицу — та же мультипликативная ошибка джойна, что в ветке SQL, только спрятанная за продуктовой формулировкой.\n\nВторая тонкость — DISTINCT в покупателях: один пользователь может сделать за день три заказа, и без него он посчитается трижды. Третья — LEFT JOIN: пользователи, которые искали и не купили, обязаны остаться в знаменателе, иначе конверсия всегда будет равна единице.\n\nИ отдельно стоит сказать, чего этот запрос не делает: он не доказывает, что заказ случился из-за поиска. Связь «тот же пользователь в тот же день» — это прокси, и в нём сидят заказы из рекомендаций, из писем и из прямых заходов в карточку. Для базовой линии этого достаточно, для атрибуции эффекта — нет, и в отчёте это ограничение называется вслух.',
        'The task is entirely about the unit of observation. Conversion here is per user rather than per query, so a "user within a day" table is built first and only then joined to buyers. Joining orders straight to queries gives a user with ten queries and one order ten matches, and conversion flies above one — the same multiplying-join mistake as in the SQL branch, only hidden behind a product phrasing.\n\nThe second subtlety is the DISTINCT in buyers: one user can place three orders a day, and without it they count three times. The third is the LEFT JOIN: users who searched and did not buy must stay in the denominator, otherwise conversion is always exactly one.\n\nAnd it is worth saying what this query does not do: it does not prove the order happened because of the search. The "same user, same day" link is a proxy, and inside it sit orders from recommendations, from emails and from direct visits to an item page. For a baseline that is enough; for attributing an effect it is not, and the report says that limitation out loud.',
      ),
      clickhouse: {
        code: `WITH searchers AS (
  SELECT toDate(ts) AS day, user_id, count() AS queries
  FROM queries
  GROUP BY day, user_id
),
buyers AS (
  SELECT DISTINCT toDate(ts) AS day, user_id
  FROM orders
)
SELECT
  s.day AS day,
  sum(s.queries) AS queries,
  countIf(b.user_id != 0) AS buyers,
  round(countIf(b.user_id != 0) / count(), 4) AS conversion
FROM searchers AS s
LEFT JOIN buyers AS b ON b.day = s.day AND b.user_id = s.user_id
GROUP BY day
ORDER BY day`,
        note: l(
          'Соединение по двум ключам в ClickHouse работает, но на больших таблицах такую конверсию обычно считают не джойном, а одним проходом по объединённой таблице событий с группировкой по пользователю и дню: джойн двух больших таблиц здесь самое дорогое место.',
          'A two-key join works in ClickHouse, but on large tables a conversion like this is usually computed without a join, in one pass over a merged events table grouped by user and day: joining two large tables is the expensive part here.',
        ),
      },
    },
    {
      kind: 'python',
      id: 'boss.final.py-decision',
      prompt: l(
        'Запиши правило выкатки кодом. На вход словарь метрик: ключ — имя, значение — кортеж (ci_low, ci_high) для относительного изменения; имя решающей метрики; словарь ограничителей «имя → допустимое падение» (положительное число, например 0.01 для одного процента). Верни "rollback", если хотя бы у одного ограничителя ci_low строго меньше минус допуска; иначе "ship", если у решающей метрики ci_low строго больше нуля; иначе "inconclusive". Если решающей метрики нет в словаре — ValueError.',
        'Write the rollout rule as code. The input is a dict of metrics: the key is a name, the value a tuple (ci_low, ci_high) for the relative change; the name of the deciding metric; and a dict of guardrails mapping a name to the tolerated drop (a positive number, for example 0.01 for one per cent). Return "rollback" if any guardrail\'s ci_low is strictly below minus its tolerance; otherwise "ship" if the deciding metric\'s ci_low is strictly above zero; otherwise "inconclusive". If the deciding metric is absent from the dict, raise ValueError.',
      ),
      signature: 'def rollout_decision(metrics: dict, deciding: str, guardrails: dict) -> str:',
      starter: `def rollout_decision(metrics, deciding, guardrails):
    # TODO
    return 'inconclusive'
`,
      reference: `def rollout_decision(metrics, deciding, guardrails):
    if deciding not in metrics:
        raise ValueError(f'no deciding metric in the report: {deciding}')

    for name, tolerance in guardrails.items():
        if name not in metrics:
            continue
        ci_low, _ = metrics[name]
        if ci_low < -tolerance:
            return 'rollback'

    ci_low, _ = metrics[deciding]
    if ci_low > 0:
        return 'ship'
    return 'inconclusive'
`,
      sampleTests: `metrics = {'orders': (0.004, 0.02), 'revenue': (-0.002, 0.01)}
assert rollout_decision(metrics, 'orders', {'revenue': 0.01}) == 'ship'
`,
      tests: `metrics = {'orders': (0.004, 0.02), 'revenue': (-0.002, 0.01)}

# A guardrail inside its tolerance does not block a significant win.
assert rollout_decision(metrics, 'orders', {'revenue': 0.01}) == 'ship'

# The same report with a stricter tolerance rolls back.
assert rollout_decision(metrics, 'orders', {'revenue': 0.001}) == 'rollback'

# A guardrail breach wins over a positive deciding metric.
broken = {'orders': (0.01, 0.03), 'revenue': (-0.05, -0.01)}
assert rollout_decision(broken, 'orders', {'revenue': 0.01}) == 'rollback'

# An interval covering zero is inconclusive, not a ship.
flat = {'orders': (-0.001, 0.02), 'revenue': (0.0, 0.01)}
assert rollout_decision(flat, 'orders', {'revenue': 0.01}) == 'inconclusive'

# Exactly zero is not a win: the comparison is strict.
assert rollout_decision({'orders': (0.0, 0.05)}, 'orders', {}) == 'inconclusive'

# A guardrail exactly at its tolerance is not a breach.
edge = {'orders': (0.01, 0.03), 'revenue': (-0.01, 0.0)}
assert rollout_decision(edge, 'orders', {'revenue': 0.01}) == 'ship'

# A guardrail missing from the report is skipped rather than assumed broken.
assert rollout_decision({'orders': (0.01, 0.02)}, 'orders', {'retention': 0.01}) == 'ship'

# A missing deciding metric is an error.
try:
    rollout_decision({'revenue': (0.0, 0.1)}, 'orders', {})
    raise AssertionError('expected ValueError')
except ValueError:
    pass
`,
      writeup: l(
        'Смысл этой функции не в коде, а в том, что правило записано до эксперимента и его нельзя подвинуть, глядя на результат. Три решения в ней спорные ровно настолько, насколько спорны они в жизни. Первое: ограничитель перевешивает решающую метрику — выкатка с просевшим ограничителем не обсуждается, даже если цель выросла. Второе: интервал, накрывающий ноль, даёт не «не выкатываем», а «неопределённо», и это разные вещи: неопределённый результат обычно означает, что нужен более мощный эксперимент, а не что изменение вредно. Третье: отсутствующий в отчёте ограничитель пропускается, а не считается сломанным — иначе функция будет блокировать всё подряд при неполном отчёте; зато отсутствие решающей метрики — это ошибка, потому что отчёт без неё бессмыслен. Строгие неравенства на границах выбраны сознательно: ровно ноль и ровно допуск — это не победа и не нарушение.',
        'The point of this function is not the code but the fact that the rule is written before the experiment and cannot be nudged while looking at the result. Three of its decisions are debatable exactly as far as they are debatable in life. First: a guardrail outweighs the deciding metric — shipping with a sagging guardrail is not up for discussion even if the goal grew. Second: an interval covering zero gives "inconclusive" rather than "do not ship", and those differ: an inconclusive result usually means a more powerful experiment is needed, not that the change is harmful. Third: a guardrail missing from the report is skipped rather than assumed broken — otherwise the function blocks everything whenever a report is incomplete; a missing deciding metric, by contrast, is an error, because a report without it is meaningless. The strict inequalities at the boundaries are deliberate: exactly zero is not a win and exactly the tolerance is not a breach.',
      ),
    },
    {
      kind: 'write-tests',
      id: 'boss.final.write-guardrail',
      prompt: l(
        'Защити правило тестами. Функция guardrail_ok(ci, tolerance) принимает кортеж (ci_low, ci_high) и положительный допуск и возвращает True, если нижняя граница не ниже минус допуска, то есть метрика не просела значимо больше, чем разрешено. Напиши тесты так, чтобы они проходили на корректной реализации и падали на каждой из сломанных версий. Пиши обычные assert в глобальной области; функция guardrail_ok уже определена.',
        'Defend the rule with tests. The function guardrail_ok(ci, tolerance) takes a tuple (ci_low, ci_high) and a positive tolerance, and returns True when the lower bound is not below minus the tolerance, that is when the metric has not sagged significantly more than allowed. Write tests that pass on the correct implementation and fail on every broken version. Use plain asserts at module level; guardrail_ok is already defined.',
      ),
      reference: `def guardrail_ok(ci, tolerance):
    ci_low, _ = ci
    return ci_low >= -tolerance
`,
      mutants: [
        {
          id: 'uses-high',
          label: l('Смотрит на верхнюю границу', 'Looks at the upper bound'),
          code: `def guardrail_ok(ci, tolerance):
    _, ci_high = ci
    return ci_high >= -tolerance
`,
        },
        {
          id: 'sign',
          label: l('Забыт минус перед допуском', 'The minus before the tolerance is missing'),
          code: `def guardrail_ok(ci, tolerance):
    ci_low, _ = ci
    return ci_low >= tolerance
`,
        },
        {
          id: 'strict',
          label: l('Строгое неравенство на границе', 'Strict inequality at the boundary'),
          code: `def guardrail_ok(ci, tolerance):
    ci_low, _ = ci
    return ci_low > -tolerance
`,
        },
        {
          id: 'ignores-tolerance',
          label: l('Допуск игнорируется', 'The tolerance is ignored'),
          code: `def guardrail_ok(ci, tolerance):
    ci_low, _ = ci
    return ci_low >= 0
`,
        },
        {
          id: 'always-true',
          label: l('Всегда пропускает', 'Always passes'),
          code: `def guardrail_ok(ci, tolerance):
    return True
`,
        },
      ],
      starter: `# A clearly fine case.
assert guardrail_ok((0.01, 0.03), 0.01) is True
`,
      referenceTests: `# Clearly fine: the metric grew.
assert guardrail_ok((0.01, 0.03), 0.01) is True

# Clearly broken: the whole interval is below minus the tolerance.
assert guardrail_ok((-0.05, -0.02), 0.01) is False

# Exactly at the tolerance still passes: the comparison is not strict.
assert guardrail_ok((-0.01, 0.0), 0.01) is True

# Just below the tolerance fails.
assert guardrail_ok((-0.011, 0.0), 0.01) is False

# The upper bound must not be what decides: here it is comfortably positive
# while the lower bound is far below the tolerance.
assert guardrail_ok((-0.2, 0.3), 0.01) is False

# A wider tolerance accepts the same interval that a narrow one rejects.
assert guardrail_ok((-0.05, 0.0), 0.1) is True
`,
      writeup: l(
        'Пять сломанных версий здесь не выдуманы — это пять способов, которыми такую проверку действительно ломают. Версия, смотрящая на верхнюю границу, ловится только тестом, где границы расходятся в разные стороны: при интервале (-0.2, 0.3) ограничитель явно нарушен, но верхняя граница выглядит прекрасно. Версия без минуса ловится любым случаем, где метрика выросла, — и это тот редкий случай, когда «очевидный» тест действительно полезен. Строгое неравенство ловится только тестом ровно на границе, а версия, игнорирующая допуск, — только интервалом, который просел, но в пределах разрешённого. Версия, которая всегда возвращает True, ловится чем угодно отрицательным, и именно поэтому набор, состоящий из одних положительных примеров, пропускает самую грубую ошибку из всех.',
        'The five broken versions here are not invented — they are five ways this check actually breaks. The version reading the upper bound is caught only by a test where the bounds point opposite ways: at (-0.2, 0.3) the guardrail is plainly breached while the upper bound looks delightful. The version missing the minus is caught by any case where the metric grew — one of the rare occasions when the "obvious" test genuinely earns its place. The strict inequality is caught only by a test exactly on the boundary, and the version ignoring the tolerance only by an interval that sagged but stayed within what was allowed. The version that always returns True is caught by anything negative, which is precisely why a suite made of positive examples alone lets the crudest error of the lot through.',
      ),
    },
    {
      kind: 'case',
      id: 'boss.final.case-plan',
      prompt: l(
        'Соедини всё в одну страницу. Напиши план на две недели так, как ты написал бы его команде: какую метрику поднимаешь и чем её измеряешь оффлайн и онлайн, какой бейзлайн выкатываешь первым и почему именно его, как считаешь ожидаемый эффект в деньгах и с каким интервалом, по какому правилу принимается решение и что ты сделаешь, если за две недели результат окажется неопределённым. Ограничение реальное: две недели одного человека.',
        'Put it all on one page. Write a two-week plan the way you would write it for your team: which metric you are raising and what measures it offline and online, which baseline ships first and why that one, how you compute the expected effect in money and with what interval, what rule the decision follows, and what you do if after two weeks the result is inconclusive. The constraint is real: two weeks of one person.',
      ),
      reference: l(
        'Метрика: доля поисковых сессий, закончившихся заказом. Оффлайн итерируюсь по nDCG@10, где релевантностью считается покупка, — считается по логам за минуты и отражает именно то, что меняю. Онлайн решаю по доле сессий с заказом. Ограничители: выручка на пользователя, потому что дешёвые ходовые товары поднимают число заказов и роняют чек, и доля запросов без клика на информационных запросах, потому что оптимизация под покупку портит выдачу там, где покупки нет.\n\nПервые два дня — измерение текущего состояния запросом по дням и разбор полусотни запросов руками. Без этого непонятно, какая доля запросов вообще коммерческая, а от неё зависит потолок всего проекта.\n\nБейзлайн — не модель, а перевзвешивание: в текущую формулу ранжирования добавляю признак «доля покупок на показ за 30 дней» с небольшим весом. Это два дня работы и даёт возможность измерить, в какую сторону вообще двигает оптимизация под покупку. Полноценное переобучение на покупках имеет смысл только после того, как бейзлайн покажет направление, иначе две недели уйдут на модель, про которую неизвестно, нужна ли она.\n\nДеньги считаю по множителям: конверсия входит в произведение, поэтому ожидаемый прирост конверсии в процентах — это ровно столько же процентов годовой выручки при прочих равных. Считаю по нижней и верхней границам доверительного интервала и называю обе: точечная оценка в отчёте без интервала — это обещание, которое никто не сможет проверить.\n\nПравило решения записываю до запуска и кодом: откат, если любой ограничитель просел значимо больше допуска; выкатка, если нижняя граница интервала решающей метрики выше нуля; иначе неопределённо. Правило покрываю тестами, включая случай «ограничитель ровно на границе» и «верхняя граница хорошая, нижняя плохая», потому что именно на этих случаях такие проверки ломаются молча.\n\nЕсли через две недели результат неопределённый — это не «не сработало». Смотрю, хватило ли мощности: если ожидаемый эффект меньше MDE на этом трафике, эксперимент был обречён с самого начала и надо либо продлевать, либо брать более чувствительную метрику, либо применять CUPED. Если мощности хватало, а эффекта нет, то гипотеза «покупаемость важнее кликабельности» не подтвердилась на этом трафике, и правильный шаг — записать это как отрицательный результат, закрывающий направление, и не возвращаться к нему без новых данных.',
        'The metric: the share of search sessions ending in an order. Offline I iterate on nDCG@10 with purchase as relevance — computable from logs in minutes and reflecting exactly what I am changing. Online I decide on the share of sessions with an order. Guardrails: revenue per user, because cheap fast-moving goods raise the order count and lower the basket, and the no-click share on informational queries, because optimising for purchases spoils results where there is no purchase.\n\nThe first two days go on measuring the current state with a by-day query and on reading fifty queries by hand. Without that there is no telling what share of queries is commercial at all, and the whole project\'s ceiling depends on it.\n\nThe baseline is not a model but a reweighting: I add a "purchases per impression over 30 days" feature to the current ranking formula with a small weight. That is two days of work and makes it possible to measure which way optimising for purchases moves things at all. A full retrain on purchases only makes sense once the baseline shows the direction, otherwise two weeks go into a model nobody knows is needed.\n\nMoney I compute through the factors: conversion sits in the product, so an expected conversion lift in per cent is the same per cent of annual revenue, all else equal. I compute it at both bounds of the confidence interval and quote both: a point estimate in a report without an interval is a promise nobody can check.\n\nThe decision rule goes in before the launch, as code: roll back if any guardrail sags significantly more than its tolerance; ship if the lower bound of the deciding metric is above zero; otherwise inconclusive. I cover the rule with tests, including "guardrail exactly on the boundary" and "upper bound fine, lower bound bad", because those are the cases where such checks break silently.\n\nIf after two weeks the result is inconclusive, that is not "it did not work". I check whether there was power: if the expected effect is below the MDE at this traffic, the experiment was doomed from the start and the answer is to extend it, take a more sensitive metric, or apply CUPED. If the power was there and the effect is not, then the hypothesis "buyability beats clickability" did not hold on this traffic, and the right move is to write it down as a negative result that closes the direction and not return to it without new data.',
      ),
      checklist: [
        l(
          'Оффлайн-метрика и решающая онлайн-метрика разделены и обе названы.',
          'The offline metric and the deciding online metric are separated and both named.',
        ),
        l(
          'Ограничители выведены из конкретных рисков, а не взяты из общего списка.',
          'The guardrails come from concrete risks rather than from a general list.',
        ),
        l(
          'Первые дни потрачены на измерение текущего состояния.',
          'The first days go on measuring the current state.',
        ),
        l(
          'Бейзлайн дешевле модели и сам по себе отвечает на вопрос о направлении.',
          'The baseline is cheaper than a model and answers the direction question by itself.',
        ),
        l(
          'Деньги посчитаны через множители и названы интервалом, а не точкой.',
          'Money is computed through the factors and quoted as an interval rather than a point.',
        ),
        l(
          'Правило решения записано до запуска и в проверяемом виде.',
          'The decision rule is written before the launch and in a checkable form.',
        ),
        l(
          'Неопределённый результат разобран через мощность, а не объявлен провалом.',
          'An inconclusive result is examined through power rather than declared a failure.',
        ),
        l(
          'Отрицательный результат назван результатом, который закрывает направление.',
          'A negative result is named as a result that closes a direction.',
        ),
      ],
      writeup: l(
        'Если этот ответ получился, то тренажёр отработал. В нём соединяются вещи из разных актов, которые по отдельности выглядят как разные предметы: выбор метрики, единица наблюдения в SQL, мощность и MDE, перевод в деньги через множители, порядок выкатки и тесты на правило. Мидла от джуна отличает не знание любой из этих частей, а то, что он пишет их в одном документе и до начала работы, а не объясняет после.',
        'If this answer came out, the trainer did its job. It joins things from different acts that look like separate subjects on their own: metric choice, the unit of observation in SQL, power and MDE, converting to money through the factors, the rollout order and tests on the rule. What distinguishes a middle engineer from a junior is not knowing any one of these parts but writing them in a single document before the work starts rather than explaining them afterwards.',
      ),
    },
  ],
};
