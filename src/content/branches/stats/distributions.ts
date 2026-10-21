import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const statsDistributions: SkillNode = {
  id: 'stats.distributions',
  branch: 'stats',
  tier: 1,
  title: l('Распределения и выборочный шум', 'Distributions and sampling noise'),
  blurb: l(
    'Почему любая метрика — это оценка, и насколько она дрожит.',
    'Why every metric is an estimate, and how much it wobbles.',
  ),
  requires: [],
  theory: [
    {
      type: 'p',
      text: l(
        'Любое число в дашборде — не факт, а оценка по выборке. CTR 4.2% за вчера — это не «CTR равен 4.2%», а «мы вытащили одну реализацию случайного процесса, и она дала 4.2%». Завтра тот же процесс без единого изменения в продукте даст 4.1% или 4.4%. Вся статистика в A/B нужна ровно для одного: отличить изменение продукта от этого дрожания.',
        'Every number on a dashboard is an estimate, not a fact. Yesterday\'s CTR of 4.2% does not mean "CTR equals 4.2%", it means "we drew one realisation of a random process and it came out at 4.2%". Tomorrow the same process, with nothing changed in the product, gives 4.1% or 4.4%. All the statistics in A/B testing exists for exactly one purpose: to tell a product change apart from that wobble.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Главный вопрос любой метрики: какова её случайная ошибка? Пока ты не знаешь ответа, сравнивать два числа бессмысленно.',
        'The first question about any metric: what is its random error? Until you know that, comparing two numbers is meaningless.',
      ),
    },
    {
      type: 'h',
      text: l('Три распределения, которые закрывают почти все метрики', 'Three distributions that cover almost every metric'),
    },
    {
      type: 'table',
      head: [
        l('Распределение', 'Distribution'),
        l('Что моделирует', 'What it models'),
        l('Примеры метрик', 'Example metrics'),
      ],
      rows: [
        [
          l('Бернулли', 'Bernoulli'),
          l('Одно событие: случилось или нет', 'A single event: happened or not'),
          l('Клик по показу, конверсия в заказ, доля сессий с кликом', 'Click on an impression, conversion to order, share of sessions with a click'),
        ],
        [
          l('Пуассона', 'Poisson'),
          l('Счётчик редких событий за интервал', 'A count of rare events in an interval'),
          l('Запросов на пользователя за день, заказов за час', 'Queries per user per day, orders per hour'),
        ],
        [
          l('Логнормальное', 'Lognormal'),
          l('Положительная величина с тяжёлым правым хвостом', 'A positive quantity with a heavy right tail'),
          l('Выручка с заказа, время до клика, GMV на пользователя', 'Revenue per order, time to click, GMV per user'),
        ],
      ],
    },
    {
      type: 'p',
      text: l(
        'Клик — это Бернулли с вероятностью p. Дисперсия одного наблюдения равна p(1-p) и полностью определяется самим p: тебе не нужно её ниоткуда оценивать. Это важное свойство, из него потом вырастает весь расчёт размера выборки для конверсионных метрик.',
        'A click is a Bernoulli trial with probability p. The variance of one observation is p(1-p) and is fully determined by p itself: you never have to estimate it separately. That property is what the whole sample-size calculation for conversion metrics is later built on.',
      ),
    },
    { type: 'formula', tex: '\\operatorname{Var}(X) = p(1-p), \\qquad \\operatorname{SD}(X) = \\sqrt{p(1-p)}' },
    {
      type: 'sim',
      sim: 'distribution-explorer',
      title: l('Исследователь распределений', 'Distribution explorer'),
      caption: l(
        'Выбери распределение и покрути параметр. Красная кривая — истинная плотность, столбики — выборка. Сравни выборочное среднее с истинным: при малой выборке они расходятся заметно.',
        'Pick a distribution and drag the parameter. The red curve is the true density, the bars are a sample. Compare the sample mean with the true one: on a small sample they differ visibly.',
      ),
    },
    { type: 'h', text: l('Выборочный шум и корень из n', 'Sampling noise and the square root of n') },
    {
      type: 'p',
      text: l(
        'Оценка доли по n наблюдениям имеет стандартную ошибку SE = sqrt(p(1-p)/n). Главное здесь — корень: чтобы уменьшить ошибку в 2 раза, нужно в 4 раза больше данных, а в 10 раз — в 100 раз больше. Именно поэтому эксперименты на маленьком трафике бесполезны, и это же объясняет, почему дешёвая метрика на миллионах показов бывает полезнее дорогой на сотнях.',
        'An estimate of a proportion from n observations has standard error SE = sqrt(p(1-p)/n). The square root is the whole story: halving the error takes four times the data, and a tenfold reduction takes a hundred times. That is why experiments on small traffic are useless, and also why a cheap metric over millions of impressions often beats an expensive one over hundreds.',
      ),
    },
    { type: 'formula', tex: 'SE(\\hat p) = \\sqrt{\\frac{p(1-p)}{n}}' },
    {
      type: 'sim',
      sim: 'sampling-noise',
      title: l('Как оценка сходится к истине', 'How an estimate converges to the truth'),
      caption: l(
        'Накопительная оценка конверсии по мере роста n. Пунктир — коридор ±2·SE. Обрати внимание: на первых сотнях наблюдений оценка болтается на проценты, и любой вывод там — чистый шум.',
        'A running conversion estimate as n grows. The dashed lines are the ±2·SE band. Note how the estimate swings by whole percentage points over the first few hundred observations: any conclusion drawn there is pure noise.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'С выручкой всё сложнее. У логнормального распределения дисперсия определяется хвостом: один заказ на 300 тысяч может сдвинуть среднюю выручку на пользователя сильнее, чем тысяча обычных заказов. Поэтому средняя выручка как метрика эксперимента требует либо огромного трафика, либо усечения выбросов, либо перехода к более устойчивой метрике.',
        'Revenue is harder. In a lognormal distribution the variance lives in the tail: a single 300k order can move average revenue per user more than a thousand ordinary ones. So average revenue as an experiment metric needs either enormous traffic, or outlier capping, or a switch to a sturdier metric.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Запомни порядок действий, он пригодится на собеседовании: сначала понять, какое распределение у одного наблюдения, потом — какая у метрики дисперсия, и только потом считать значимость. Если пропустить первые два шага, получится «CTR вырос на 3%» без ответа на вопрос, бывает ли такой рост сам по себе.',
        'Remember the order of operations, it comes up in interviews: first work out the distribution of a single observation, then the variance of the metric, and only then compute significance. Skip the first two steps and you get "CTR is up 3%" with no answer to whether such a jump happens on its own.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'stats.distributions.q-se',
      mode: 'single',
      prompt: l(
        'Конверсия в клик p = 20%, собрали n = 10 000 показов. Чему примерно равна стандартная ошибка оценки CTR?',
        'Click-through rate p = 20%, collected n = 10,000 impressions. Roughly what is the standard error of the CTR estimate?',
      ),
      choices: [
        { id: 'a', text: l('0.04 процентных пункта', '0.04 percentage points') },
        { id: 'b', text: l('0.4 процентных пункта', '0.4 percentage points') },
        { id: 'c', text: l('4 процентных пункта', '4 percentage points') },
        { id: 'd', text: l('Нельзя сказать, нужна дисперсия из данных', 'Cannot say, the variance has to come from the data') },
      ],
      correct: ['b'],
      explanation: l(
        'SE = sqrt(0.2·0.8/10000) = sqrt(0.000016) = 0.004, то есть 0.4 пп. Вариант «нужна дисперсия из данных» неверен именно для Бернулли: дисперсия равна p(1-p) и считается из самого p.',
        'SE = sqrt(0.2·0.8/10000) = sqrt(0.000016) = 0.004, i.e. 0.4 pp. The "variance has to come from the data" option is wrong precisely for Bernoulli: the variance is p(1-p) and follows from p itself.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.distributions.q-n-for-se',
      mode: 'number',
      prompt: l(
        'Та же конверсия 20%. Сколько показов нужно, чтобы стандартная ошибка стала 0.1 процентного пункта? Ответ — число показов.',
        'The same 20% conversion. How many impressions are needed for the standard error to reach 0.1 percentage points? Answer with the number of impressions.',
      ),
      value: 160000,
      tolerance: 2000,
      unit: l('показов', 'impressions'),
      explanation: l(
        'Из SE = sqrt(p(1-p)/n) получаем n = p(1-p)/SE² = 0.16/0.001² = 160 000. Сравни с предыдущей задачей: ошибка упала в 4 раза, данных понадобилось в 16 раз больше.',
        'From SE = sqrt(p(1-p)/n) we get n = p(1-p)/SE² = 0.16/0.001² = 160,000. Compare with the previous task: the error dropped fourfold and the data requirement grew sixteenfold.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.distributions.q-bernoulli-var',
      mode: 'multi',
      prompt: l(
        'Какие утверждения о дисперсии Бернулли верны?',
        'Which statements about Bernoulli variance are true?',
      ),
      choices: [
        { id: 'a', text: l('Дисперсия максимальна при p = 0.5', 'The variance is largest at p = 0.5') },
        {
          id: 'b',
          text: l(
            'Чем реже событие, тем меньше абсолютная дисперсия, но относительная ошибка растёт',
            'The rarer the event, the smaller the absolute variance, while the relative error grows',
          ),
        },
        { id: 'c', text: l('Дисперсия не зависит от p', 'The variance does not depend on p') },
        {
          id: 'd',
          text: l(
            'Для редких событий (p около 0.1%) нужен существенно больший трафик на тот же относительный MDE',
            'For rare events (p around 0.1%) you need far more traffic for the same relative MDE',
          ),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'p(1-p) — парабола с максимумом в 0.5. Но для бизнеса важна относительная ошибка SE/p = sqrt((1-p)/(np)): она растёт при малых p, поэтому редкие конверсии (покупка, подписка) требуют гораздо больше трафика, чем клики.',
        'p(1-p) is a parabola peaking at 0.5. What matters for the business, though, is the relative error SE/p = sqrt((1-p)/(np)): it grows as p shrinks, so rare conversions (purchase, subscription) need far more traffic than clicks.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.distributions.q-revenue-tail',
      mode: 'single',
      prompt: l(
        'Метрика эксперимента — средняя выручка на пользователя. За неделю в тесте появился один заказ на 400 000, при средней выручке около 1 500. Что разумнее сделать?',
        'The experiment metric is average revenue per user. During the week the test group got one 400,000 order, against an average revenue of about 1,500. What is the sensible move?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Оставить как есть: выбросы — часть реальности', 'Leave it as is: outliers are part of reality'),
        },
        {
          id: 'b',
          text: l(
            'Заранее зафиксировать правило усечения (например, перцентиль 99.9) и применить его к обеим группам',
            'Fix a capping rule in advance (say the 99.9th percentile) and apply it to both groups',
          ),
        },
        { id: 'c', text: l('Удалить этого пользователя из теста', 'Drop that user from the test') },
        {
          id: 'd',
          text: l('Перейти на медианную выручку и считать по ней значимость', 'Switch to median revenue and compute significance on it'),
        },
      ],
      correct: ['b'],
      explanation: l(
        'Усечение по заранее объявленному правилу, симметрично к обеим группам — стандартная практика: она снижает дисперсию и не создаёт смещения в пользу одной из групп. Удалять конкретного пользователя после того, как увидел результат, нельзя: это выбор решения под данные. Медиана выглядит заманчиво, но она не связана с деньгами аддитивно: сумма медиан не равна медиане суммы, и бизнес-интерпретация ломается.',
        'Capping by a rule declared in advance, applied symmetrically to both groups, is the standard practice: it cuts variance without biasing either group. Dropping that particular user after seeing the result is not allowed: that is choosing the decision to fit the data. The median looks tempting but does not add up to money: a sum of medians is not the median of a sum, and the business interpretation breaks.',
      ),
    },
    {
      kind: 'sql',
      id: 'stats.distributions.sql-queries-per-user',
      prompt: l(
        'Посчитай эмпирическое распределение активности: для каждого значения k выведи, сколько пользователей сделали ровно k запросов за весь период. Две колонки в таком порядке: queries_cnt, users. Сортировка по queries_cnt по возрастанию. Пользователей без запросов учитывать не нужно.',
        'Compute the empirical activity distribution: for each value of k, output how many users made exactly k queries over the whole period. Two columns in this order: queries_cnt, users. Sorted by queries_cnt ascending. Users with no queries do not need to be counted.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Сначала запросы на пользователя, потом пользователи на каждое значение.
-- First queries per user, then users per value.
SELECT
FROM queries
`,
      reference: `WITH per_user AS (
  SELECT user_id, count(*) AS q
  FROM queries
  GROUP BY user_id
)
SELECT q AS queries_cnt, count(*) AS users
FROM per_user
GROUP BY q
ORDER BY q`,
      orderMatters: true,
      writeup: l(
        'Это «группировка по результату группировки» — самый частый паттерн при построении распределений из логов. Первый GROUP BY сводит таблицу событий к одной строке на пользователя, второй считает, сколько пользователей попало в каждую корзину. Пытаться сделать это одним GROUP BY нельзя: агрегат от агрегата требует подзапроса или CTE. На практике дальше обычно идёт группировка в бакеты (1, 2-3, 4-10, 11+) через CASE, потому что сырой хвост распределения занимает сотни строк.',
        'This is "grouping over the result of a grouping", the most common pattern when building distributions out of logs. The first GROUP BY collapses the event table to one row per user; the second counts how many users landed in each bucket. One GROUP BY cannot do it: an aggregate of an aggregate needs a subquery or a CTE. In practice the next step is usually bucketing (1, 2-3, 4-10, 11+) with CASE, because the raw tail of the distribution runs to hundreds of rows.',
      ),
      clickhouse: {
        code: `SELECT q AS queries_cnt, count() AS users
FROM (
    SELECT user_id, count() AS q
    FROM queries
    GROUP BY user_id
)
GROUP BY q
ORDER BY q`,
        note: l(
          'В ClickHouse то же самое, но есть нюансы: count() без звёздочки — идиоматичная форма, CTE через WITH тоже поддерживается, а для распределений часто пишут сразу histogram(k)(x) или quantiles(0.5, 0.9, 0.99)(q) одним проходом вместо явной группировки.',
          'ClickHouse does the same with a few twists: count() without the star is the idiomatic form, WITH is supported too, and for distributions people often reach straight for histogram(k)(x) or quantiles(0.5, 0.9, 0.99)(q) in a single pass instead of grouping explicitly.',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'Allen Downey, Think Stats (2nd ed., free)',
      url: 'https://greenteapress.com/wp/think-stats-2e/',
      note: l('Главы про распределения и выборки.', 'The chapters on distributions and samples.'),
    },
    {
      title: 'SciPy: statistical functions reference',
      url: 'https://docs.scipy.org/doc/scipy/reference/stats.html',
      note: l('Что чем считать в Python.', 'Which function computes what in Python.'),
    },
  ],
};
