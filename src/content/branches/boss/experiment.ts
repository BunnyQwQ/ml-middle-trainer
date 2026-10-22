import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const bossExperiment: SkillNode = {
  id: 'boss.experiment',
  branch: 'boss',
  act: 2,
  tier: 2,
  boss: true,
  contest: { minutes: 45 },
  title: l('Испытание II: эксперимент целиком', 'Trial II: the whole experiment'),
  blurb: l(
    'От сырых логов до решения: сплит, метрики, корректная дисперсия и вердикт.',
    'From raw logs to a decision: the split, the metrics, the right variance and a verdict.',
  ),
  requires: ['stats.tests', 'ab.aa', 'sql.metrics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Эксперимент закончился, и тебе отдали логи, а не готовый отчёт. Это нормальная ситуация в команде, где платформа экспериментов ещё не покрывает все метрики: половину работы приходится делать руками, и именно здесь чаще всего рождаются неверные выводы — не потому что кто-то не знает статистику, а потому что запрос написан не так, как метрика определена.',
        'The experiment is over and you were handed logs rather than a finished report. That is a normal situation in a team whose experiment platform does not yet cover every metric: half the work is done by hand, and this is where wrong conclusions are born most often — not because someone does not know statistics but because the query does not match the way the metric is defined.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Порядок действий в этом испытании тот же, что в жизни: сначала проверить сплит, потом посчитать метрики, потом взять для них правильную дисперсию, и только в конце что-то решать. Перестановка шагов — главная причина, по которой разбор занимает день вместо часа.',
        'The order of operations in this trial is the one from real life: check the split first, compute the metrics second, take the right variance for them third, and only then decide anything. Swapping the steps is the main reason an analysis takes a day instead of an hour.',
      ),
    },
    {
      type: 'sim',
      sim: 'srm-check',
      title: l('Напоминание: когда перекос перестаёт быть случайным', 'A reminder: when a skew stops being chance'),
      caption: l(
        'Поставь счётчики близко к тем, что получатся в задаче ниже, и посмотри на p-value. Главное, что стоит запомнить: на больших числах перекос в доли процента уже невозможен случайно, а на маленьких — совершенно обычен. Поэтому SRM проверяют формулой, а не глазами.',
        'Set the counters close to what the task below will produce and look at the p-value. The thing to remember: at large counts a skew of a fraction of a percent is already impossible by chance, while at small ones it is entirely ordinary. That is why SRM is checked with a formula rather than by eye.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'boss.experiment.sql-groups',
      prompt: l(
        'Собери сводку эксперимента по группам одним запросом. Шесть колонок: ab_group, users — сколько всего пользователей в группе, shows — показы, clicks — клики, ctr (округли до 5 знаков), buyer_share — доля пользователей группы, сделавших хотя бы один заказ (округли до 5 знаков). Пользователи считаются все, даже если они ни разу не искали. Сортировка по ab_group.',
        'Assemble an experiment summary by group in one query. Six columns: ab_group, users — how many users the group has in total, shows — impressions, clicks — clicks, ctr (rounded to 5 decimals), buyer_share — the share of the group\'s users who placed at least one order (rounded to 5 decimals). Every user counts, even one who never searched. Sort by ab_group.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Три разных знаменателя в одной таблице: показы, пользователи, покупатели.
-- Three different denominators in one table: impressions, users, buyers.
WITH shows_by_group AS (
  SELECT
  FROM impressions
)
SELECT
FROM shows_by_group
`,
      reference: `WITH shows_by_group AS (
  SELECT u.ab_group, count(*) AS shows, count(cl.click_id) AS clicks
  FROM impressions i
  JOIN queries q ON q.query_id = i.query_id
  JOIN users u ON u.user_id = q.user_id
  LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
  GROUP BY 1
),
users_by_group AS (
  SELECT ab_group, count(*) AS users FROM users GROUP BY 1
),
buyers_by_group AS (
  SELECT u.ab_group, count(DISTINCT o.user_id) AS buyers
  FROM users u
  JOIN orders o ON o.user_id = u.user_id
  GROUP BY 1
)
SELECT ug.ab_group,
       ug.users,
       sg.shows,
       sg.clicks,
       round(sg.clicks * 1.0 / sg.shows, 5) AS ctr,
       round(coalesce(bg.buyers, 0) * 1.0 / ug.users, 5) AS buyer_share
FROM users_by_group ug
JOIN shows_by_group sg ON sg.ab_group = ug.ab_group
LEFT JOIN buyers_by_group bg ON bg.ab_group = ug.ab_group
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Задача на то, ради чего существуют CTE: три метрики с тремя разными знаменателями нельзя посчитать одной группировкой, потому что джойн показов к заказам размножил бы строки и сломал оба счётчика. Считаем каждую величину в своём блоке на своём уровне детализации и соединяем по ключу группы. Две ловушки. Первая: пользователей надо брать из users, а не из тех, кто делал запросы, — иначе «доля покупателей» посчитается от активных, а не от всех, и это уже другая метрика, которая вдобавок зависит от эксперимента. Вторая: LEFT JOIN к покупателям с coalesce — если в группе вообще нет заказов, строка не должна исчезнуть, в ответе должен стоять ноль. Теперь посмотри на колонку users: она почти наверняка не равна пополам, и следующий шаг — выяснить, случайно ли это.',
        'This is the task CTEs exist for: three metrics with three different denominators cannot come from one grouping, because joining impressions to orders would multiply rows and break both counters. Each quantity is computed in its own block at its own grain and joined on the group key. Two traps. First, users must come from the users table rather than from whoever made queries — otherwise "share of buyers" is computed over active users rather than all of them, which is a different metric and one that depends on the experiment itself. Second, the LEFT JOIN to buyers with a coalesce: if a group has no orders at all its row must not vanish, the answer should hold a zero. Now look at the users column: it is almost certainly not an even split, and the next step is finding out whether that is chance.',
      ),
      clickhouse: {
        code: `SELECT ug.ab_group, ug.users, sg.shows, sg.clicks,
       round(sg.clicks / sg.shows, 5) AS ctr,
       round(bg.buyers / ug.users, 5) AS buyer_share
FROM ( SELECT ab_group, count() AS users FROM users GROUP BY ab_group ) AS ug
LEFT JOIN ( /* показы и клики / impressions and clicks */ ) AS sg USING (ab_group)
LEFT JOIN ( SELECT ab_group, uniqExact(user_id) AS buyers FROM ... ) AS bg USING (ab_group)
ORDER BY ab_group`,
        note: l(
          'uniqExact вместо count(DISTINCT), и помни про нули вместо NULL после LEFT JOIN — здесь они как раз на руку, coalesce не нужен. В продовых системах экспериментов такую сводку обычно собирают из заранее посчитанных витрин по пользователю: соединять сырые показы с заказами на каждом отчёте слишком дорого.',
          'uniqExact instead of count(DISTINCT), and remember the zeros instead of NULLs after a LEFT JOIN — here they work in your favour and no coalesce is needed. Production experiment systems usually assemble a summary like this from precomputed per-user tables: joining raw impressions to orders on every report is too expensive.',
        ),
      },
    },
    {
      kind: 'python',
      id: 'boss.experiment.py-srm',
      prompt: l(
        'Реализуй проверку SRM для двух групп. На вход число объектов в первой группе, во второй и ожидаемая доля первой группы. Верни p-value критерия хи-квадрат с одной степенью свободы. Подсказка: при одной степени свободы p равен erfc(sqrt(chi2) / sqrt(2)). Если суммарное число нулевое или ожидаемая доля не лежит строго между нулём и единицей, верни 1.0. Из библиотек доступен только math.',
        'Implement an SRM check for two groups. The input is the object count in the first group, in the second, and the expected share of the first group. Return the p-value of a chi-square test with one degree of freedom. Hint: at one degree of freedom p equals erfc(sqrt(chi2) / sqrt(2)). If the total count is zero or the expected share does not lie strictly between zero and one, return 1.0. Only math is available.',
      ),
      signature: 'def srm_pvalue(count_a: int, count_b: int, share_a: float = 0.5) -> float:',
      starter: `import math


def srm_pvalue(count_a, count_b, share_a=0.5):
    """Chi-square p-value for a sample ratio mismatch between two groups."""
    # TODO
    return 1.0
`,
      reference: `import math


def srm_pvalue(count_a, count_b, share_a=0.5):
    """Chi-square p-value for a sample ratio mismatch between two groups."""
    total = count_a + count_b
    if total <= 0 or not (0 < share_a < 1):
        return 1.0
    expected_a = total * share_a
    expected_b = total * (1 - share_a)
    chi2 = (count_a - expected_a) ** 2 / expected_a + (count_b - expected_b) ** 2 / expected_b
    return math.erfc(math.sqrt(chi2) / math.sqrt(2))
`,
      sampleTests: `# A perfectly even split is as unsuspicious as it gets.
assert abs(srm_pvalue(1000, 1000) - 1.0) < 1e-12

# A large imbalance on large numbers is impossible by chance.
assert srm_pvalue(1_004_000, 996_000) < 1e-6

# The same relative skew on small numbers is ordinary.
assert srm_pvalue(104, 96) > 0.1

assert srm_pvalue(0, 0) == 1.0
`,
      tests: `import math

# 1. An even split gives p = 1.
assert abs(srm_pvalue(5000, 5000) - 1.0) < 1e-12

# 2. A hand-computable case: chi2 = 32 at a million per group.
#    (4000^2 / 1e6) * 2 = 32, so p = erfc(sqrt(32)/sqrt(2)) = erfc(4).
want = math.erfc(4.0)
assert abs(srm_pvalue(1_004_000, 996_000) - want) < 1e-12, (srm_pvalue(1_004_000, 996_000), want)

# 3. Symmetric in the direction of the skew.
assert abs(srm_pvalue(5200, 4800) - srm_pvalue(4800, 5200)) < 1e-12

# 4. The same relative skew is more suspicious on more data.
small = srm_pvalue(520, 480)
big = srm_pvalue(52_000, 48_000)
assert big < small
assert small > 0.1 and big < 1e-6

# 5. Monotone in the size of the skew.
ps = [srm_pvalue(5000 + d, 5000 - d) for d in (0, 25, 50, 100, 200)]
assert all(ps[i] >= ps[i + 1] for i in range(len(ps) - 1)), ps

# 6. An uneven planned split is handled too: 90/10 traffic is not an SRM.
assert srm_pvalue(9000, 1000, 0.9) > 0.5
# ... but 80/20 against a planned 90/10 certainly is.
assert srm_pvalue(8000, 2000, 0.9) < 1e-6

# 7. Always a probability.
for a, b in ((0, 1), (1, 0), (1, 1), (10**7, 10**7 - 1), (3, 97)):
    p = srm_pvalue(a, b)
    assert 0.0 <= p <= 1.0, (a, b, p)

# 8. Degenerate inputs.
assert srm_pvalue(0, 0) == 1.0
assert srm_pvalue(100, 100, 0.0) == 1.0
assert srm_pvalue(100, 100, 1.0) == 1.0
`,
      writeup: l(
        'Четвёртый и пятый тесты вместе объясняют, почему SRM нельзя проверять на глаз. Перекос 52 на 48 процентов выглядит одинаково и на выборке в тысячу, и на выборке в сто тысяч, но в первом случае это обычная случайность, а во втором — гарантированный баг. Шестой тест закрывает частый практический случай: запланированный неравный сплит. Если эксперимент раскатан на 10% трафика, ожидаемая доля 0.9, и проверять надо отклонение от неё, а не от половины. Про порог: для SRM берут p < 0.001, а не привычные 0.05, и причина асимметричная. Ложная тревога стоит часа работы инженера, а пропущенный SRM — всего эксперимента, причём незаметно: цифры будут выглядеть правдоподобно. При этом проверку делают по каждому срезу отдельно — по платформам, странам, новым и старым пользователям: общий сплит может сойтись, а внутри одной платформы разъехаться, и именно там будет спрятана причина.',
        'The fourth and fifth tests together explain why SRM cannot be checked by eye. A 52-to-48 skew looks identical on a sample of a thousand and on a sample of a hundred thousand, yet in the first case it is ordinary chance and in the second a guaranteed bug. The sixth test covers a common practical case: a deliberately uneven split. If the experiment runs on 10% of traffic, the expected share is 0.9 and the deviation to check is from that rather than from a half. On the threshold: SRM uses p < 0.001 rather than the usual 0.05, and the reason is asymmetric. A false alarm costs an engineer an hour; a missed SRM costs the whole experiment, and does so invisibly, because the numbers will look plausible. The check is also run per slice — by platform, country, new versus returning users: the overall split can balance while one platform diverges, and that is where the cause will be hiding.',
      ),
    },
    {
      kind: 'findbug',
      id: 'boss.experiment.bug-analysis',
      lang: 'python',
      prompt: l(
        'Этот скрипт считает значимость эффекта в эксперименте с рандомизацией по пользователю. Он стабильно выдаёт p-value на порядок меньше, чем платформа экспериментов. Укажи строку, из-за которой это происходит.',
        'This script computes the significance of an effect in a user-randomised experiment. It consistently returns a p-value an order of magnitude smaller than the experiment platform does. Point at the line that causes it.',
      ),
      code: `import math
from collections import defaultdict


def analyse(impressions):
    """impressions: list of (user_id, ab_group, clicked)."""
    shows = defaultdict(int)
    clicks = defaultdict(int)
    for user_id, group, clicked in impressions:
        shows[group] += 1
        clicks[group] += clicked

    p_control = clicks['control'] / shows['control']
    p_test = clicks['test'] / shows['test']
    pooled = (clicks['control'] + clicks['test']) / (shows['control'] + shows['test'])
    se = math.sqrt(pooled * (1 - pooled) * (1 / shows['control'] + 1 / shows['test']))
    z = (p_test - p_control) / se
    return 2 * (1 - 0.5 * math.erfc(-abs(z) / math.sqrt(2)))`,
      buggyLines: [10, 11],
      explanation: l(
        'Ошибка в строках 10 и 11: счётчики ведутся по показам, хотя рандомизация шла по пользователю. Формула стандартной ошибки предполагает, что каждое наблюдение независимо, а показы одного пользователя скоррелированы — у активных своя склонность кликать. В результате знаменатель оказывается завышен на величину порядка корня из числа показов на пользователя, и p-value падает в разы. Обрати внимание, что сам user_id в цикле даже не используется: это характерный признак такой ошибки, переменная распакована и забыта. Чинится либо агрегацией до уровня пользователя с последующим t-тестом, либо дельта-методом с кластеризацией по пользователю, либо бутстрапом по пользователям — всё это было в ветке A/B. Последняя строка, кстати, корректна, хоть и написана извращённо: 2·(1 - 0.5·erfc(-|z|/√2)) действительно равно двустороннему p-value, потому что 0.5·erfc(-x/√2) — это и есть функция распределения стандартной нормальной величины.',
        'The bug is on lines 10 and 11: the counters are kept per impression although randomisation was per user. The standard error formula assumes every observation is independent, while one user\'s impressions are correlated — active users have their own propensity to click. The denominator ends up inflated by roughly the square root of the impressions-per-user count, and the p-value falls several-fold. Note that user_id is never used inside the loop: that is the signature of this bug, a variable unpacked and forgotten. The fix is either aggregating to user level and running a t-test, or the delta method clustered by user, or a bootstrap over users — all of which appeared in the A/B branch. The last line, incidentally, is correct despite being written perversely: 2·(1 - 0.5·erfc(-|z|/√2)) really is the two-sided p-value, because 0.5·erfc(-x/√2) is the standard normal CDF.',
      ),
    },
    {
      kind: 'case',
      id: 'boss.experiment.case-verdict',
      prompt: l(
        'Сводка по эксперименту собрана: в контроле 248 100 пользователей, в тесте 251 400. CTR вырос с 10.40% до 10.72%, доля покупателей с 4.80% до 4.86%. Платформа экспериментов показывает по CTR p = 0.003, по доле покупателей p = 0.41. Эксперимент шёл с четверга по среду, то есть ровно семь дней. Напиши разбор: в каком порядке проверяешь, что считаешь сам, какой вывод и что делаешь дальше.',
        'The experiment summary is assembled: control has 248,100 users, test has 251,400. CTR rose from 10.40% to 10.72%, the buyer share from 4.80% to 4.86%. The experiment platform reports p = 0.003 for CTR and p = 0.41 for the buyer share. The experiment ran Thursday to Wednesday, exactly seven days. Write the analysis: in what order you check things, what you compute yourself, what you conclude and what you do next.',
      ),
      reference: l(
        'Начинать надо с проверки сплита, не глядя на метрики. Ожидали по 249 750, наблюдаем расхождение в 1650 пользователей в каждую сторону. Хи-квадрат примерно 1650²/249750 умножить на два — это около 21.8, p-value порядка 3e-6. Порог для SRM 0.001, значит проверка сработала, и дальше формально ничего интерпретировать нельзя. Это главное, что должно прозвучать в ответе. Дальше — причины: чаще всего это фильтрация ботов, применённая к одной группе, потеря событий при джойне, разное время включения групп или падение клиента в одной из версий. Проверять надо по срезам: платформа, страна, новые против вернувшихся, дни эксперимента — обычно перекос локализуется в одном срезе, и это сразу указывает на причину. Если предположить, что SRM окажется артефактом конкретного среза и после починки исчезнет, дальше смотрим на метрики. CTR вырос на 0.32 пункта, то есть примерно на 3% относительно, с p = 0.003 — но здесь надо спросить, как платформа считала дисперсию: CTR это отношение сумм, и если значимость посчитана по формуле для двух пропорций на уровне показов, p занижен в разы. Доля покупателей — метрика на уровне пользователя, с ней проще, но p = 0.41 почти наверняка означает недостаток мощности, а не отсутствие эффекта: нужен доверительный интервал, и если он простирается до плюс 5% относительных, то вывод «на заказы не повлияло» неоснователен. Срок в семь дней правильный — полная неделя, сезонность по дням сокращается. Но стоит посмотреть динамику эффекта по дням: если CTR рос только в первые два дня, это эффект новизны. Решение: не раскатывать, найти причину SRM, перезапустить; параллельно запросить у платформы метод расчёта дисперсии для CTR и интервал по доле покупателей.',
        'Start with the split, without looking at the metrics. We expected 249,750 each and observe a gap of 1650 users either way. Chi-square is roughly 1650²/249750 times two, about 21.8, a p-value around 3e-6. The SRM threshold is 0.001, so the check has fired and formally nothing below may be interpreted. That is the main thing the answer must say. Then the causes: most often bot filtering applied to one group, events lost in a join, groups enabled at different times, or a client crash in one version. Check by slice: platform, country, new versus returning, days of the experiment — the skew usually localises to one slice, which points straight at the cause. Assuming the SRM turns out to be an artefact of one slice and disappears after a fix, we move to the metrics. CTR rose 0.32 points, about 3% relative, at p = 0.003 — but here you must ask how the platform computed the variance: CTR is a ratio of sums, and if significance came from the two-proportion formula at impression level, the p-value is several times too small. The buyer share is a user-level metric and is easier, but p = 0.41 almost certainly means a lack of power rather than an absence of effect: a confidence interval is needed, and if it reaches plus 5% relative then "no effect on orders" rests on nothing. The seven-day horizon is right — a whole week, so weekday seasonality cancels. But the daily dynamics of the effect are worth a look: if CTR rose only on the first two days, that is novelty. Decision: do not ship, find the cause of the SRM, rerun; in parallel ask the platform how it computes the CTR variance and request an interval for the buyer share.',
      ),
      checklist: [
        l('Проверил сплит до того, как смотреть на метрики', 'Checked the split before looking at the metrics'),
        l('Посчитал хи-квадрат и сравнил с порогом 0.001', 'Computed the chi-square and compared it with the 0.001 threshold'),
        l('Назвал конкретные причины SRM и способ их локализовать по срезам', 'Named concrete causes of SRM and how to localise them by slice'),
        l('Усомнился в способе расчёта дисперсии для CTR как ratio-метрики', 'Questioned how the variance was computed for CTR as a ratio metric'),
        l('Потребовал интервал для незначимой метрики вместо вывода об отсутствии эффекта', 'Asked for an interval on the non-significant metric instead of concluding no effect'),
        l('Отметил, что неделя — корректный срок, и предложил посмотреть динамику по дням', 'Noted the week is a correct horizon and proposed checking the daily dynamics'),
        l('Сформулировал решение и параллельные шаги', 'Stated a decision and the parallel steps'),
      ],
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
    },
  ],
};
