import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const bossFirstReport: SkillNode = {
  id: 'boss.first-report',
  branch: 'boss',
  act: 1,
  tier: 1,
  boss: true,
  title: l('Испытание I: первый отчёт', 'Trial I: the first report'),
  blurb: l(
    'Логи, запрос, интервал и честный ответ продакту. Всё из первого акта сразу.',
    'Logs, a query, an interval and an honest answer to a product manager. Everything from act one at once.',
  ),
  requires: ['stats.ci', 'sql.grouping'],
  theory: [
    {
      type: 'p',
      text: l(
        'Ситуация, с которой начинается работа любого аналитика. В пятницу вечером приходит сообщение: «кажется, в выходные CTR проседает, посмотри». Данные есть, инструменты есть, и дальше всё зависит от того, сумеешь ли ты отличить реальный эффект от дрожания выборки — и объяснить разницу человеку, который про доверительные интервалы не слышал.',
        'The situation every analyst\'s job starts with. A message arrives on Friday evening: "CTR seems to sag at weekends, take a look". The data is there, the tools are there, and everything else depends on whether you can tell a real effect from sampling noise — and explain the difference to someone who has never heard of a confidence interval.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Это испытание собирает первый акт целиком: SQL по логам, выборочный шум, доверительный интервал и формулировка вывода. Задания решаются подряд, и узлы следующего акта откроются только когда закрыты все.',
        'This trial pulls the whole first act together: SQL over logs, sampling noise, a confidence interval and the wording of a conclusion. The tasks are solved in order, and the next act opens only once all of them are done.',
      ),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l('Достать цифры запросом, не забыв показы без кликов.', 'Pull the numbers with a query, not forgetting the impressions without clicks.'),
        l('Оценить, насколько велик выборочный шум при таком объёме.', 'Judge how large the sampling noise is at this volume.'),
        l('Построить интервал для разницы, а не сравнивать два числа на глаз.', 'Build an interval for the difference rather than eyeballing two numbers.'),
        l('Сформулировать ответ так, чтобы по нему можно было принять решение.', 'Word the answer so that a decision can be made from it.'),
      ],
    },
    {
      type: 'sim',
      sim: 'sampling-noise',
      title: l('Напоминание: сколько дрожит оценка', 'A reminder: how much an estimate wobbles'),
      caption: l(
        'Поставь конверсию около 10% — примерно столько будет в данных ниже. Посмотри, какой ширины коридор ±2·SE при нескольких сотнях наблюдений: именно столько «движения» метрики не значит ничего. Дневные данные в логах — это как раз сотни, а не тысячи кликов.',
        'Set the conversion near 10% — roughly what the data below will show. Look at the width of the ±2·SE band at a few hundred observations: that much metric "movement" means nothing. The daily data in the logs is exactly hundreds of clicks, not thousands.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'boss.first-report.sql-weekday',
      prompt: l(
        'Посчитай CTR по дням недели. Четыре колонки: dow — номер дня недели по времени показа (используй date_part, воскресенье = 0), shows, clicks, ctr (округли до 5 знаков). Сортировка по dow.',
        'Compute CTR by day of week. Four columns: dow — the weekday number from the impression timestamp (use date_part, Sunday = 0), shows, clicks, ctr (rounded to 5 decimals). Sort by dow.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- date_part('dow', ts) даёт номер дня недели.
-- date_part('dow', ts) gives the weekday number.
SELECT
FROM impressions
`,
      reference: `SELECT date_part('dow', i.ts) AS dow,
       count(*) AS shows,
       count(cl.click_id) AS clicks,
       round(count(cl.click_id) * 1.0 / count(*), 5) AS ctr
FROM impressions i
LEFT JOIN clicks cl ON cl.impression_id = i.impression_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Запрос почти тот же, что был в узле про группировки, и это намеренно: испытание проверяет, закрепилось ли. Две детали, на которых спотыкаются. Первая: LEFT JOIN, иначе знаменатель превратится в число кликнутых показов и CTR станет единицей каждый день. Вторая: группировать надо по дню недели от времени показа, а не от времени клика — иначе показы без кликов потеряют день и выпадут из расчёта совсем. Посмотри на результат: разброс CTR между днями есть, и дальше весь вопрос в том, больше он выборочного шума или нет.',
        'The query is nearly the one from the grouping node, and that is deliberate: a trial checks what stuck. Two details trip people up. First, the LEFT JOIN, otherwise the denominator becomes the count of clicked impressions and CTR is one every day. Second, group by the weekday of the impression timestamp rather than the click timestamp — otherwise impressions without clicks lose their day and drop out of the computation entirely. Look at the result: there is spread in CTR across days, and the whole question is whether it exceeds the sampling noise.',
      ),
      clickhouse: {
        code: `SELECT toDayOfWeek(i.ts) AS dow,
       count() AS shows,
       countIf(cl.click_id != 0) AS clicks,
       round(countIf(cl.click_id != 0) / count(), 5) AS ctr
FROM impressions AS i
LEFT JOIN clicks AS cl ON cl.impression_id = i.impression_id
GROUP BY dow
ORDER BY dow`,
        note: l(
          'В ClickHouse функция называется toDayOfWeek и нумерует с понедельника = 1, а не с воскресенья = 0. Такие расхождения в нумерации дней — классический источник сдвинутых на день отчётов при переносе запросов между базами.',
          'In ClickHouse the function is toDayOfWeek and numbers from Monday = 1 rather than Sunday = 0. Numbering mismatches like this are a classic source of reports shifted by one day when queries move between databases.',
        ),
      },
    },
    {
      kind: 'python',
      id: 'boss.first-report.py-diff-ci',
      prompt: l(
        'Реализуй доверительный интервал для разницы двух конверсий. На вход число успехов и число наблюдений в первой группе, то же во второй, и z-квантиль. Верни кортеж (diff, low, high), где diff — это p2 минус p1. Стандартную ошибку считай без объединения групп: корень из суммы p(1-p)/n по каждой группе. Если в какой-то группе нет наблюдений, верни (0.0, 0.0, 0.0). Из библиотек доступен только math.',
        'Implement a confidence interval for the difference of two conversion rates. The input is successes and observations in the first group, the same for the second, and a z quantile. Return a tuple (diff, low, high) where diff is p2 minus p1. Compute the standard error without pooling: the square root of the sum of p(1-p)/n over the two groups. If either group has no observations, return (0.0, 0.0, 0.0). Only math is available.',
      ),
      signature:
        'def diff_proportions_ci(c1: int, n1: int, c2: int, n2: int, z: float = 1.96) -> tuple[float, float, float]:',
      starter: `import math


def diff_proportions_ci(c1, n1, c2, n2, z=1.96):
    """Confidence interval for p2 - p1."""
    # TODO
    return (0.0, 0.0, 0.0)
`,
      reference: `import math


def diff_proportions_ci(c1, n1, c2, n2, z=1.96):
    """Confidence interval for p2 - p1."""
    if n1 <= 0 or n2 <= 0:
        return (0.0, 0.0, 0.0)
    p1 = c1 / n1
    p2 = c2 / n2
    diff = p2 - p1
    se = math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
    return (diff, diff - z * se, diff + z * se)
`,
      sampleTests: `diff, lo, hi = diff_proportions_ci(100, 1000, 120, 1000)
assert abs(diff - 0.02) < 1e-12
assert lo < 0.02 < hi

# Identical groups: the interval straddles zero.
diff, lo, hi = diff_proportions_ci(50, 500, 50, 500)
assert abs(diff) < 1e-12 and lo < 0 < hi

assert diff_proportions_ci(1, 0, 1, 10) == (0.0, 0.0, 0.0)
`,
      tests: `import math
import random

# 1. The point estimate is simply the difference of the rates.
diff, lo, hi = diff_proportions_ci(100, 1000, 130, 1000)
assert abs(diff - 0.03) < 1e-12
assert lo < diff < hi

# 2. Swapping the groups flips the sign and mirrors the interval.
d1, l1, h1 = diff_proportions_ci(100, 1000, 130, 1000)
d2, l2, h2 = diff_proportions_ci(130, 1000, 100, 1000)
assert abs(d1 + d2) < 1e-12
assert abs(l1 + h2) < 1e-12 and abs(h1 + l2) < 1e-12

# 3. More data, narrower interval, same point estimate.
_, l_small, h_small = diff_proportions_ci(100, 1000, 130, 1000)
_, l_big, h_big = diff_proportions_ci(10000, 100000, 13000, 100000)
assert (h_big - l_big) < (h_small - l_small) / 5

# 4. A larger z widens the interval symmetrically.
d, l95, h95 = diff_proportions_ci(100, 1000, 130, 1000, 1.96)
_, l99, h99 = diff_proportions_ci(100, 1000, 130, 1000, 2.576)
assert l99 < l95 and h99 > h95
assert abs((h99 - d) - (d - l99)) < 1e-12

# 5. Identical rates put zero inside the interval.
_, lo, hi = diff_proportions_ci(200, 2000, 200, 2000)
assert lo < 0 < hi

# 6. Degenerate inputs.
assert diff_proportions_ci(0, 0, 0, 0) == (0.0, 0.0, 0.0)
assert diff_proportions_ci(5, 10, 0, 0) == (0.0, 0.0, 0.0)
# A zero-variance group still produces a usable interval.
d, lo, hi = diff_proportions_ci(0, 100, 10, 100)
assert abs(d - 0.1) < 1e-12 and hi > lo

# 7. The promise that matters: coverage of the true difference.
rnd = random.Random(20261022)
p1_true, p2_true = 0.20, 0.23
covered = 0
reps = 500
for _ in range(reps):
    n = 1200
    c1 = sum(1 for _ in range(n) if rnd.random() < p1_true)
    c2 = sum(1 for _ in range(n) if rnd.random() < p2_true)
    _, lo, hi = diff_proportions_ci(c1, n, c2, n)
    if lo <= (p2_true - p1_true) <= hi:
        covered += 1
assert 0.92 <= covered / reps <= 0.98, covered / reps
`,
      writeup: l(
        'Главный вопрос этой задачи — почему дисперсии складываются без объединения групп. Объединённая оценка используется в тесте гипотез: там мы считаем вероятность данных при условии, что истинные доли равны, и тогда разумно оценить общую долю по обеим группам. Здесь же мы строим интервал для разницы, не предполагая равенства, поэтому дисперсия каждой группы оценивается отдельно, а дисперсия разности независимых величин равна сумме дисперсий. Числа различаются немного, но концептуально это два разных вопроса, и путать их не стоит. Седьмой тест проверяет то единственное, что интервал обещает: 95% построенных интервалов накрывают истинную разницу. Ещё одна деталь: при нулевом числе успехов в группе оценка дисперсии для неё обращается в ноль, интервал становится уже, чем должен, — это та самая слабость нормального приближения, из-за которой в узле про доверительные интервалы появился Вильсон.',
        'The main question in this task is why the variances add without pooling. A pooled estimate belongs in a hypothesis test: there we compute the probability of the data given that the true rates are equal, so estimating one shared rate from both groups makes sense. Here we build an interval for the difference without assuming equality, so each group\'s variance is estimated separately, and the variance of a difference of independent quantities is the sum of the variances. The numbers differ only slightly, but conceptually these are two different questions and should not be confused. The seventh test checks the one thing the interval promises: 95% of the intervals built cover the true difference. One more detail: with zero successes in a group its variance estimate collapses to zero and the interval becomes narrower than it should be — exactly the weakness of the normal approximation that brought Wilson into the confidence interval node.',
      ),
    },
    {
      kind: 'quiz',
      id: 'boss.first-report.q-interpret',
      mode: 'single',
      prompt: l(
        'По логам: в будний день 3200 показов и 352 клика, в выходной 1900 показов и 190 кликов. Разница CTR составила -1.0 процентного пункта, интервал примерно от -2.7 до +0.7 пп. Что писать в ответе?',
        'From the logs: a weekday had 3200 impressions and 352 clicks, a weekend day 1900 impressions and 190 clicks. The CTR difference is -1.0 percentage points with an interval of roughly -2.7 to +0.7 pp. What goes in the answer?',
      ),
      choices: [
        { id: 'a', text: l('CTR в выходные падает на 1 пп', 'CTR drops by 1 pp at weekends') },
        {
          id: 'b',
          text: l(
            'На таком объёме данных просадка неотличима от шума: интервал включает ноль и доходит до -2.7 пп, то есть вопрос пока без ответа',
            'At this data volume the dip is indistinguishable from noise: the interval includes zero and reaches -2.7 pp, so the question is unanswered for now',
          ),
        },
        { id: 'c', text: l('Разницы нет, можно закрывать вопрос', 'There is no difference, the question can be closed') },
        { id: 'd', text: l('Нужно сравнить ещё и с прошлым месяцем', 'We should also compare against last month') },
      ],
      correct: ['b'],
      explanation: l(
        'Два неверных ответа — зеркальные ошибки. Первый принимает точечную оценку за факт, игнорируя, что при таком объёме она гуляет на пару пунктов. Третий путает «не доказано» с «доказано, что нет»: верхняя граница +0.7 пп мала, а вот нижняя -2.7 пп — это уже заметная просадка, которую данные не исключают. Правильный ответ называет обе границы и честно говорит, что для вывода нужно больше данных. Если продакту нужен ответ сегодня, следующий шаг — посчитать, сколько дней накопления хватит, чтобы интервал сузился до приемлемой ширины.',
        'The two wrong answers are mirror-image mistakes. The first takes the point estimate for a fact, ignoring that at this volume it wanders by a couple of points. The third confuses "not demonstrated" with "demonstrated absent": the upper bound of +0.7 pp is small, but the lower bound of -2.7 pp is a serious dip the data does not rule out. The right answer names both bounds and says honestly that a conclusion needs more data. If the product manager needs an answer today, the next step is computing how many days of accumulation would narrow the interval to an acceptable width.',
      ),
    },
    {
      kind: 'case',
      id: 'boss.first-report.case-answer',
      prompt: l(
        'Напиши ответ продакту на исходное сообщение «кажется, в выходные CTR проседает, посмотри». Пиши так, как отправил бы в рабочий чат: с цифрами, но без терминов, которые придётся объяснять отдельно. Обязательно скажи, что ты сделал, что получилось, насколько этому можно верить и что предлагаешь дальше.',
        'Write the reply to the original message, "CTR seems to sag at weekends, take a look". Write it as you would send it in a work chat: with numbers, but without terms that would need explaining separately. Be sure to say what you did, what came out, how much it can be trusted and what you propose next.',
      ),
      reference: l(
        'Хороший ответ короткий и состоит из четырёх частей. Что сделал: посчитал CTR по дням недели за неделю логов, отдельно показы и клики. Что получилось: в выходные CTR ниже примерно на процентный пункт, но данных за выходные вдвое меньше, потому что и трафика меньше. Насколько можно верить: при таком объёме разница в пределах погрешности — интервал от минус 2.7 до плюс 0.7 пункта, то есть данные совместимы и с заметной просадкой, и с её отсутствием. Что предлагаю: накопить три-четыре недели и посмотреть на ту же разбивку, тогда интервал сузится примерно вдвое; параллельно проверить состав трафика по выходным — если там другая доля мобильных или другая смесь категорий запросов, то дело может быть не в дне недели, а в том, кто приходит. Отдельно стоит сказать, чего делать не надо: не предлагать менять продукт под гипотезу, которая пока не подтверждена, и не обещать точный ответ к завтрашнему дню. Полезно заканчивать вопросом по существу: насколько велика цена ошибки — если решение по выходным касается, например, ставок в рекламе, то ждать три недели может быть дороже, чем принять решение при текущей неопределённости, и об этом стоит сказать прямо.',
        'A good answer is short and has four parts. What you did: computed CTR by weekday over a week of logs, impressions and clicks separately. What came out: weekend CTR is lower by about a percentage point, but there is half as much weekend data because there is less traffic. How much it can be trusted: at this volume the difference is within the margin — an interval from minus 2.7 to plus 0.7 points, so the data is compatible both with a serious dip and with none at all. What you propose: accumulate three or four weeks and look at the same breakdown, which will roughly halve the interval; in parallel check the traffic mix on weekends — if the share of mobile or the mix of query categories differs, the cause may not be the day of week but who shows up. It is worth saying what not to do as well: do not propose changing the product for a hypothesis that is not confirmed, and do not promise a precise answer by tomorrow. Ending with a substantive question helps: how costly is a mistake here — if the weekend decision concerns ad bids, say, then waiting three weeks may cost more than deciding under the current uncertainty, and that should be said out loud.',
      ),
      checklist: [
        l('Сказал, что именно посчитал и на каких данных', 'Stated exactly what was computed and on what data'),
        l('Привёл числа, а не только вывод', 'Gave numbers rather than only a conclusion'),
        l('Назвал границы неопределённости человеческими словами', 'Named the bounds of uncertainty in plain words'),
        l('Не выдал точечную оценку за установленный факт', 'Did not present the point estimate as an established fact'),
        l('Не объявил отсутствие эффекта доказанным', 'Did not declare the absence of an effect proven'),
        l('Предложил конкретный следующий шаг со сроком', 'Proposed a concrete next step with a timeframe'),
        l('Упомянул альтернативное объяснение (состав трафика)', 'Mentioned an alternative explanation (the traffic mix)'),
        l('Обошёлся без терминов, требующих отдельной лекции', 'Avoided terms that would need a lecture of their own'),
      ],
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Binomial proportion confidence interval',
      url: 'https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval',
    },
  ],
};
