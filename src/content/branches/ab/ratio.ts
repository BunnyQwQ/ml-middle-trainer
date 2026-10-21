import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abRatio: SkillNode = {
  id: 'ab.ratio',
  branch: 'ab',
  tier: 6,
  title: l('Ratio-метрики', 'Ratio metrics'),
  blurb: l(
    'CTR — отношение сумм, и обычная формула стандартной ошибки к нему не применима.',
    'CTR is a ratio of sums, and the ordinary standard error formula does not apply to it.',
  ),
  requires: ['ab.multiple'],
  theory: [
    {
      type: 'p',
      text: l(
        'Большинство метрик поиска и рекламы — отношения: клики на показы, заказы на сессии, выручка на запрос. Если рандомизация идёт по пользователю, а числитель и знаменатель суммируются по событиям, то метрика перестаёт быть средним независимых величин. Формула sqrt(p(1-p)/n) для неё неверна, потому что n здесь — число событий, а независимых наблюдений ровно столько, сколько пользователей.',
        'Most search and ads metrics are ratios: clicks over impressions, orders over sessions, revenue over query. When randomisation is by user while the numerator and denominator are summed over events, the metric stops being a mean of independent quantities. The formula sqrt(p(1-p)/n) is wrong for it, because n there counts events while the number of independent observations is the number of users.',
      ),
    },
    {
      type: 'formula',
      tex: 'R = \\frac{\\sum_u c_u}{\\sum_u s_u} = \\frac{\\bar c}{\\bar s}',
      caption: l(
        'Каждый пользователь даёт пару чисел: числитель и знаменатель. Метрика — отношение их средних.',
        'Every user contributes a pair of numbers: a numerator and a denominator. The metric is the ratio of their means.',
      ),
    },
    {
      type: 'h',
      text: l('Дельта-метод', 'The delta method'),
    },
    {
      type: 'p',
      text: l(
        'Дельта-метод линеаризует отношение в окрестности средних и даёт формулу дисперсии через дисперсии и ковариацию числителя и знаменателя. Ковариация здесь принципиальна: у активного пользователя велики и клики, и показы, и игнорировать эту связь — значит сильно переоценить дисперсию.',
        'The delta method linearises the ratio around the means and gives a variance formula in terms of the variances and the covariance of numerator and denominator. The covariance matters: an active user has both many clicks and many impressions, and ignoring that link badly overstates the variance.',
      ),
    },
    {
      type: 'formula',
      tex: '\\operatorname{Var}(R) \\approx \\frac{1}{n}\\left(\\frac{\\operatorname{Var}(c)}{\\bar s^{2}} - \\frac{2\\bar c\\operatorname{Cov}(c,s)}{\\bar s^{3}} + \\frac{\\bar c^{2}\\operatorname{Var}(s)}{\\bar s^{4}}\\right)',
    },
    {
      type: 'sim',
      sim: 'ratio-variance',
      title: l('Три оценки стандартной ошибки', 'Three estimates of the standard error'),
      caption: l(
        'Покрытие интервала, измеренное симуляцией: сколько процентов построенных интервалов накрыли истинный CTR. Наивная биномиальная формула проваливается тем сильнее, чем больше разброс склонности кликать между пользователями. Дельта-метод и бутстрап по пользователям держат обещанные 95%. Поставь разброс в ноль — и наивная формула внезапно становится корректной: именно потому, что при одинаковых пользователях события и правда независимы.',
        'Interval coverage measured by simulation: what percentage of the constructed intervals covered the true CTR. The naive binomial formula fails harder the more the click propensity varies between users. The delta method and the bootstrap over users hold the promised 95%. Set the spread to zero and the naive formula suddenly becomes correct — precisely because with identical users the events really are independent.',
      ),
    },
    {
      type: 'sim',
      sim: 'ratio-of-sums',
      title: l('Отношение сумм против среднего отношений', 'Ratio of sums versus mean of ratios'),
      caption: l(
        'Второй вопрос про ratio-метрики — не как считать ошибку, а что именно усреднять. Если активные пользователи ведут себя иначе, два определения расходятся, и выбор между ними меняет ответ эксперимента.',
        'The second question about ratio metrics is not how to compute the error but what exactly to average. When heavy users behave differently the two definitions diverge, and the choice between them changes the answer of the experiment.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Бутстрап ресемплит пользователей целиком, вместе со всеми их событиями. Ресемплинг отдельных показов разрушает кластерную структуру и возвращает ту же заниженную дисперсию, от которой мы уходили, — только дороже.',
        'The bootstrap resamples whole users together with all their events. Resampling individual impressions destroys the cluster structure and brings back the same understated variance we were escaping — only more expensively.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.ratio.q-when-naive-works',
      mode: 'single',
      prompt: l(
        'В каком случае наивная формула sqrt(p(1-p)/n) по числу показов даёт корректный доверительный интервал для CTR?',
        'In which case does the naive formula sqrt(p(1-p)/n) over the impression count give a correct confidence interval for CTR?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Всегда, если показов много', 'Always, provided there are many impressions'),
        },
        {
          id: 'b',
          text: l(
            'Когда рандомизация идёт по показу, либо когда на каждого пользователя приходится ровно один показ',
            'When randomisation is per impression, or when every user contributes exactly one impression',
          ),
        },
        { id: 'c', text: l('Когда CTR близок к 50%', 'When CTR is near 50%') },
        { id: 'd', text: l('Никогда', 'Never') },
      ],
      correct: ['b'],
      explanation: l(
        'Формула предполагает независимость наблюдений. Она выполняется, если единица рандомизации совпадает с единицей наблюдения: либо бакет назначается каждому показу, либо каждый пользователь даёт ровно одно наблюдение. Во всех остальных случаях показы одного пользователя скоррелированы, и формула занижает дисперсию тем сильнее, чем больше событий на пользователя и чем сильнее пользователи различаются между собой — ровно то, что показывает симулятор выше.',
        'The formula assumes independent observations. That holds when the randomisation unit coincides with the observation unit: either the bucket is assigned per impression, or each user contributes exactly one observation. In every other case one user\'s impressions are correlated, and the formula understates the variance the more events per user there are and the more users differ from one another — exactly what the simulator above shows.',
      ),
    },
    {
      kind: 'python',
      id: 'ab.ratio.py-delta',
      prompt: l(
        'Реализуй дельта-метод для отношения сумм. На вход два списка одинаковой длины: числители и знаменатели по пользователям. Верни кортеж (ratio, se), где ratio — сумма числителей, делённая на сумму знаменателей, а se — стандартная ошибка по формуле дельта-метода с выборочными дисперсиями и ковариацией (деление на n-1). Если пользователей меньше двух или сумма знаменателей равна нулю, верни (0.0, 0.0). Внешние библиотеки, кроме math, запрещены.',
        'Implement the delta method for a ratio of sums. The input is two equal-length lists: per-user numerators and denominators. Return a tuple (ratio, se), where ratio is the sum of numerators over the sum of denominators and se is the standard error from the delta method formula with sample variances and covariance (dividing by n-1). If there are fewer than two users or the denominators sum to zero, return (0.0, 0.0). No libraries beyond math.',
      ),
      signature: 'def ratio_se_delta(numerators: list[float], denominators: list[float]) -> tuple[float, float]:',
      starter: `import math


def ratio_se_delta(numerators, denominators):
    """Delta-method standard error for a ratio of sums, clustered by user."""
    # TODO
    return (0.0, 0.0)
`,
      reference: `import math


def ratio_se_delta(numerators, denominators):
    """Delta-method standard error for a ratio of sums, clustered by user."""
    n = len(numerators)
    if n < 2 or sum(denominators) == 0:
        return (0.0, 0.0)
    mx = sum(numerators) / n
    my = sum(denominators) / n
    ratio = mx / my
    vx = vy = cxy = 0.0
    for c, s in zip(numerators, denominators):
        dx = c - mx
        dy = s - my
        vx += dx * dx
        vy += dy * dy
        cxy += dx * dy
    vx /= n - 1
    vy /= n - 1
    cxy /= n - 1
    var = (vx / my ** 2 - 2 * mx * cxy / my ** 3 + mx ** 2 * vy / my ** 4) / n
    return (ratio, math.sqrt(max(0.0, var)))
`,
      sampleTests: `ratio, se = ratio_se_delta([1, 0, 2, 1], [10, 5, 20, 8])
assert abs(ratio - 4 / 43) < 1e-12
assert se > 0

assert ratio_se_delta([1], [2]) == (0.0, 0.0)
assert ratio_se_delta([0, 0], [0, 0]) == (0.0, 0.0)
`,
      tests: `import math
import random

# 1. The ratio itself is just a ratio of sums.
rnd = random.Random(1)
num = [rnd.randint(0, 5) for _ in range(300)]
den = [rnd.randint(1, 20) for _ in range(300)]
ratio, se = ratio_se_delta(num, den)
assert abs(ratio - sum(num) / sum(den)) < 1e-12
assert se > 0

# 2. Matches an algebraically different route: the linearised per-user values.
def _se_by_linearisation(num, den):
    n = len(num)
    mx = sum(num) / n
    my = sum(den) / n
    r = mx / my
    lin = [(c - r * s) / my for c, s in zip(num, den)]
    m = sum(lin) / n
    v = sum((z - m) ** 2 for z in lin) / (n - 1)
    return math.sqrt(v / n)

assert abs(se - _se_by_linearisation(num, den)) < 1e-9, (se, _se_by_linearisation(num, den))

# 3. With exactly one event per user it collapses to the binomial standard error.
clicks = [1 if rnd.random() < 0.3 else 0 for _ in range(2000)]
ones = [1] * 2000
r2, se2 = ratio_se_delta(clicks, ones)
p = sum(clicks) / 2000
assert abs(r2 - p) < 1e-12
assert abs(se2 - math.sqrt(p * (1 - p) / 2000)) < 2e-5, (se2, math.sqrt(p * (1 - p) / 2000))

# 4. Degenerate inputs.
assert ratio_se_delta([], []) == (0.0, 0.0)
assert ratio_se_delta([3], [4]) == (0.0, 0.0)
assert ratio_se_delta([1, 2], [0, 0]) == (0.0, 0.0)

# 5. More heterogeneity between users -> larger standard error.
def _make(spread, seed):
    r = random.Random(seed)
    num, den = [], []
    for _ in range(800):
        s = r.randint(5, 40)
        p = min(0.9, max(0.01, 0.2 * (1 + r.gauss(0, spread))))
        num.append(sum(1 for _ in range(s) if r.random() < p))
        den.append(s)
    return num, den

_, se_low = ratio_se_delta(*_make(0.0, 5))
_, se_high = ratio_se_delta(*_make(0.9, 5))
assert se_high > se_low * 1.2, (se_low, se_high)

# 6. The promise: coverage of the resulting interval.
rnd = random.Random(20260321)
true_ctr = 0.15
covered = 0
reps = 120
for _ in range(reps):
    num, den = [], []
    for _ in range(400):
        s = rnd.randint(3, 30)
        p = min(0.9, max(0.005, true_ctr * (1 + rnd.gauss(0, 0.5))))
        num.append(sum(1 for _ in range(s) if rnd.random() < p))
        den.append(s)
    r3, se3 = ratio_se_delta(num, den)
    if abs(r3 - true_ctr) <= 1.96 * se3:
        covered += 1
assert covered / reps >= 0.88, covered / reps
`,
      writeup: l(
        'Два способа прийти к одной формуле. Первый — честно раскрыть дисперсию отношения через ряд Тейлора, получится выражение из теории. Второй, который проще держать в голове и которым пользуются скрытые тесты: ввести для каждого пользователя линеаризованную величину z_u = (c_u - R·s_u) / mean(s), после чего стандартная ошибка отношения равна обычной стандартной ошибке среднего от z. Это удобно тем, что к z дальше можно применять всё привычное — CUPED, стратификацию, усечение. Третий тест в наборе проверяет важный частный случай: если у каждого пользователя ровно один показ, дельта-метод обязан сойтись к биномиальной формуле, и он сходится. Именно отсюда видно, что наивная формула — не ошибка, а частный случай с неверно выбранным n. В проде такую функцию почти всегда пишут векторно на numpy, а бутстрап держат рядом как эталон для сверки на новых метриках.',
        'Two routes to the same formula. The first is to expand the variance of the ratio honestly via a Taylor series, which produces the textbook expression. The second, easier to keep in your head and the one the hidden tests use: define a linearised quantity per user, z_u = (c_u - R·s_u) / mean(s), after which the standard error of the ratio is the ordinary standard error of the mean of z. That is convenient because everything familiar then applies to z — CUPED, stratification, capping. The third test checks an important special case: with exactly one impression per user the delta method must collapse to the binomial formula, and it does. That is where you can see the naive formula is not an error but a special case with the wrong n. In production this function is almost always written vectorised in numpy, with a bootstrap kept alongside as a reference when new metrics appear.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.ratio.q-bootstrap-unit',
      mode: 'single',
      prompt: l(
        'Считаем бутстрап-интервал для CTR в эксперименте с рандомизацией по пользователю. Что именно ресемплить?',
        'We are computing a bootstrap interval for CTR in an experiment randomised by user. What exactly should be resampled?',
      ),
      choices: [
        { id: 'a', text: l('Отдельные показы', 'Individual impressions') },
        { id: 'b', text: l('Пользователей целиком, со всеми их показами и кликами', 'Whole users, with all their impressions and clicks') },
        { id: 'c', text: l('Отдельные клики', 'Individual clicks') },
        { id: 'd', text: l('Дни эксперимента', 'Days of the experiment') },
      ],
      correct: ['b'],
      explanation: l(
        'Ресемплить надо единицу рандомизации. Бутстрап по показам даёт интервал примерно той же ширины, что и наивная формула, то есть воспроизводит ту самую ошибку, ради исправления которой его и взяли. Ресемплинг по дням — это другая конструкция (блочный бутстрап), она уместна, когда главная зависимость временная, а не пользовательская.',
        'Resample the randomisation unit. A bootstrap over impressions produces an interval about as wide as the naive formula, i.e. it reproduces the very error it was brought in to fix. Resampling by day is a different construction (a block bootstrap), appropriate when the dominant dependence is temporal rather than per-user.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Глава про ratio-метрики и дельта-метод.', 'The chapter on ratio metrics and the delta method.'),
    },
    {
      title: 'Wikipedia: Delta method',
      url: 'https://en.wikipedia.org/wiki/Delta_method',
    },
  ],
};
