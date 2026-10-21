import { l, same } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const statsTests: SkillNode = {
  id: 'stats.tests',
  branch: 'stats',
  tier: 5,
  title: l('Какой критерий когда', 'Which test, when'),
  blurb: l(
    'z, t, Манн-Уитни и бутстрап: что каждый из них на самом деле проверяет.',
    'z, t, Mann-Whitney and the bootstrap: what each of them actually tests.',
  ),
  requires: ['stats.hypotheses'],
  theory: [
    {
      type: 'p',
      text: l(
        'Выбор критерия на собеседовании звучит как вопрос про формулы, но на деле это вопрос про то, какую гипотезу ты проверяешь и какие допущения готов принять. Четырёх инструментов хватает практически на всё, что встречается в продуктовой аналитике.',
        'Choosing a test sounds like a question about formulas in an interview, but it is really a question about which hypothesis you are testing and which assumptions you are willing to accept. Four tools cover practically everything that comes up in product analytics.',
      ),
    },
    {
      type: 'table',
      head: [
        l('Критерий', 'Test'),
        l('Что проверяет', 'What it tests'),
        l('Когда брать', 'When to use it'),
      ],
      rows: [
        [
          l('z-тест для долей', 'z-test for proportions'),
          l('Равенство двух вероятностей', 'Equality of two probabilities'),
          l(
            'Конверсии и CTR при n·p ≥ 10 в обеих группах',
            'Conversions and CTR when n·p ≥ 10 in both groups',
          ),
        ],
        [
          l('t-тест Уэлча', "Welch's t-test"),
          l('Равенство средних', 'Equality of means'),
          l(
            'Непрерывные метрики: время, выручка, число действий. Дисперсии групп не обязаны совпадать',
            'Continuous metrics: time, revenue, counts. Group variances need not be equal',
          ),
        ],
        [
          l('Манн-Уитни', 'Mann-Whitney'),
          l(
            'Склонность одной группы давать большие значения, а не равенство средних',
            'The tendency of one group to produce larger values, not equality of means',
          ),
          l(
            'Сильно скошенные данные, когда интересен сдвиг распределения целиком',
            'Heavily skewed data when the shift of the whole distribution is what matters',
          ),
        ],
        [
          l('Бутстрап', 'Bootstrap'),
          l('Что угодно, для чего есть формула вычисления', 'Anything you can compute'),
          l(
            'Медианы, перцентили, ratio-метрики, сложные комбинации — там, где формулы SE нет',
            'Medians, percentiles, ratio metrics, odd combinations — wherever no SE formula exists',
          ),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Манн-Уитни часто подают как «t-тест для ненормальных данных», и это опасное упрощение. Он проверяет другую гипотезу: вероятность того, что случайное наблюдение из одной группы больше случайного из другой. Если распределения различаются формой, значимый Манн-Уитни не означает, что среднее выросло, — а бизнес обычно интересует именно среднее, потому что деньги складываются.',
        'Mann-Whitney is often sold as "a t-test for non-normal data", and that is a dangerous simplification. It tests a different hypothesis: the probability that a random observation from one group exceeds a random one from the other. If the distributions differ in shape, a significant Mann-Whitney does not mean the mean went up — and the business usually cares about the mean, because money adds up.',
      ),
    },
    {
      type: 'sim',
      sim: 'test-comparison',
      title: l('Три критерия на одних данных', 'Three tests on the same data'),
      caption: l(
        'Переключай распределение и режим. На A/A все три должны давать около 5% ложных срабатываний — это проверка корректности. На A/B смотри на мощность: на логнормальных данных и при выбросах Манн-Уитни и бутстрап обходят t-тест, а на бинарных данных разница исчезает. Поставь маленькое n и выбросы: t-тест теряет мощность быстрее остальных.',
        'Switch the distribution and the mode. On A/A all three should give about 5% false positives — that is the correctness check. On A/B watch the power: on lognormal data and with outliers Mann-Whitney and the bootstrap beat the t-test, while on binary data the difference disappears. Set a small n with outliers: the t-test loses power faster than the others.',
      ),
    },
    {
      type: 'h',
      text: l('Бутстрап: когда формулы нет', 'The bootstrap: when there is no formula'),
    },
    {
      type: 'p',
      text: l(
        'Идея бутстрапа в одном предложении: выборка — лучшее, что у нас есть, вместо генеральной совокупности, поэтому будем много раз брать из неё выборки с возвращением и смотреть, как гуляет интересующая величина. Доверительный интервал берётся как перцентили полученного распределения. Метод не требует ни нормальности, ни даже формулы стандартной ошибки — только возможность посчитать статистику.',
        'The bootstrap in one sentence: the sample is the best stand-in we have for the population, so let us resample from it with replacement many times and watch how the quantity of interest wanders. The confidence interval is taken as percentiles of the resulting distribution. The method needs neither normality nor even a standard error formula — only the ability to compute the statistic.',
      ),
    },
    {
      type: 'sim',
      sim: 'bootstrap-ci',
      title: l('Бутстрап-интервал для любой статистики', 'A bootstrap interval for any statistic'),
      caption: l(
        'Данные логнормальные, как выручка. Для среднего бутстрап-интервал почти совпадает с обычным — ЦПТ работает. Переключись на медиану или 90-й перцентиль: формулы стандартной ошибки для них нет, а бутстрап работает так же. Уменьши B до 50 и посмотри, как интервал начинает дёргаться от сида: на хвостовых квантилях B нужно больше.',
        'The data is lognormal, like revenue. For the mean the bootstrap interval nearly matches the ordinary one — the CLT is working. Switch to the median or the 90th percentile: no standard error formula exists for them, and the bootstrap carries on unchanged. Drop B to 50 and watch the interval jitter with the seed: tail quantiles need a larger B.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'Бутстрап по пользователям, а не по событиям: ресемплить надо ту единицу, по которой шла рандомизация, иначе дисперсия снова окажется занижена.',
          'Bootstrap over users, not over events: the unit you resample must be the unit you randomised on, otherwise the variance comes out understated again.',
        ),
        l(
          'B от 1000 для интервалов на 95% и от 10000, если нужны хвостовые квантили. Меньше — интервал сам становится шумным.',
          'B from 1000 for 95% intervals and from 10000 when tail quantiles are needed. Any less and the interval itself becomes noisy.',
        ),
        l(
          'Бутстрап не чинит смещение выборки. Если данные собраны криво, он честно посчитает интервал вокруг неправильного числа.',
          'The bootstrap does not fix a biased sample. If the data was collected badly, it will honestly compute an interval around the wrong number.',
        ),
        l(
          'На больших данных бутстрап дорог. В продовых платформах для ratio-метрик чаще берут дельта-метод, а бутстрап держат как эталон для сверки.',
          'On large data the bootstrap is expensive. Production platforms usually use the delta method for ratio metrics and keep the bootstrap as a reference to check against.',
        ),
      ],
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'stats.tests.q-choose',
      mode: 'single',
      prompt: l(
        'Метрика эксперимента — выручка на пользователя, распределение с тяжёлым правым хвостом, в каждой группе 300 тысяч пользователей. Что разумнее использовать?',
        'The experiment metric is revenue per user with a heavy right tail, and each group has 300 thousand users. What is the sensible choice?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            't-тест Уэлча: при таком n ЦПТ работает, а бизнесу нужно именно среднее',
            "Welch's t-test: at this n the CLT holds, and the business wants the mean",
          ),
        },
        {
          id: 'b',
          text: l('Манн-Уитни: данные ненормальные', 'Mann-Whitney: the data is not normal'),
        },
        {
          id: 'c',
          text: l('Ничего нельзя, нужна нормальность', 'Nothing can be used, normality is required'),
        },
        {
          id: 'd',
          text: l('Только бутстрап, других вариантов нет', 'Only the bootstrap, there are no alternatives'),
        },
      ],
      correct: ['a'],
      explanation: l(
        'Нормальность требуется не от данных, а от распределения оценки среднего, и при 300 тысячах наблюдений оно нормально даже при тяжёлом хвосте. Манн-Уитни здесь отвечает не на тот вопрос: он проверяет сдвиг распределения, а выручка складывается, и решение принимается по сумме. Бутстрап тоже корректен, но на таком объёме он дороже и даст практически то же самое. Что действительно стоит сделать — усечь выбросы по заранее объявленному перцентилю: это снизит дисперсию и сократит нужный трафик.',
        'Normality is required not of the data but of the distribution of the mean estimate, and at 300 thousand observations that is normal even with a heavy tail. Mann-Whitney answers a different question here: it tests a shift of the distribution, while revenue adds up and the decision is made on the total. The bootstrap is also valid but costs more at this scale and gives practically the same answer. What is genuinely worth doing is capping outliers at a pre-declared percentile: that cuts variance and reduces the traffic needed.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.tests.q-mann-whitney',
      mode: 'multi',
      prompt: l(
        'В каких случаях Манн-Уитни — уместный выбор?',
        'In which cases is Mann-Whitney an appropriate choice?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Время ответа сервиса: интересно, стало ли в целом быстрее',
            'Service latency: the question is whether it got faster overall',
          ),
        },
        {
          id: 'b',
          text: l(
            'Выручка на пользователя, решение принимается по сумме денег',
            'Revenue per user, where the decision is made on total money',
          ),
        },
        {
          id: 'c',
          text: l(
            'Оценки асессоров по шкале от 1 до 5: это порядковая шкала',
            'Rater scores on a 1 to 5 scale: an ordinal scale',
          ),
        },
        {
          id: 'd',
          text: l('Маленькая выборка с сильными выбросами', 'A small sample with strong outliers'),
        },
      ],
      correct: ['a', 'c', 'd'],
      explanation: l(
        'Манн-Уитни хорош там, где важен порядок, а не арифметика: время отклика, порядковые оценки, маленькие выборки с выбросами. Для выручки он не подходит именно потому, что деньги складываются: можно получить значимый сдвиг распределения при упавшей сумме, если хвост стал легче. Для порядковых шкал это к тому же единственный корректный вариант — считать среднее от оценок «1..5» формально некорректно, расстояния между делениями шкалы не определены.',
        'Mann-Whitney is good where order matters rather than arithmetic: response times, ordinal scores, small samples with outliers. It does not fit revenue precisely because money adds up: you can get a significant distributional shift while the total falls, if the tail got lighter. For ordinal scales it is also the only correct option — averaging scores of "1..5" is formally invalid, since the distances between scale points are undefined.',
      ),
    },
    {
      kind: 'python',
      id: 'stats.tests.py-bootstrap',
      prompt: l(
        'Реализуй перцентильный бутстрап-интервал для среднего. Функция берёт список чисел, число итераций b, уровень alpha и сид, возвращает кортеж (low, high). Используй random.Random(seed) — при одном и том же сиде результат обязан повторяться. Нижняя граница — квантиль alpha/2 распределения бутстрап-средних, верхняя — квантиль 1-alpha/2. Для пустого списка верни (0.0, 0.0). Внешние библиотеки, кроме random и math, запрещены.',
        'Implement a percentile bootstrap interval for the mean. The function takes a list of numbers, an iteration count b, a level alpha and a seed, and returns a tuple (low, high). Use random.Random(seed) — with the same seed the result must repeat. The lower bound is the alpha/2 quantile of the bootstrap means, the upper one the 1-alpha/2 quantile. For an empty list return (0.0, 0.0). No libraries beyond random and math.',
      ),
      signature:
        'def bootstrap_mean_ci(data: list[float], b: int = 2000, alpha: float = 0.05, seed: int = 0) -> tuple[float, float]:',
      starter: `import random


def bootstrap_mean_ci(data, b=2000, alpha=0.05, seed=0):
    """Percentile bootstrap confidence interval for the mean."""
    # TODO
    return (0.0, 0.0)
`,
      reference: `import random


def bootstrap_mean_ci(data, b=2000, alpha=0.05, seed=0):
    """Percentile bootstrap confidence interval for the mean."""
    n = len(data)
    if n == 0:
        return (0.0, 0.0)
    rnd = random.Random(seed)
    means = []
    for _ in range(b):
        sample = rnd.choices(data, k=n)
        means.append(sum(sample) / n)
    means.sort()

    def pick(q):
        if len(means) == 1:
            return means[0]
        pos = (len(means) - 1) * q
        lo = int(pos)
        hi = min(lo + 1, len(means) - 1)
        return means[lo] + (pos - lo) * (means[hi] - means[lo])

    return (pick(alpha / 2), pick(1 - alpha / 2))
`,
      sampleTests: `data = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
lo, hi = bootstrap_mean_ci(data, b=400, seed=1)
assert lo < 3.0 < hi

# same seed -> same answer
assert bootstrap_mean_ci(data, b=200, seed=7) == bootstrap_mean_ci(data, b=200, seed=7)

assert bootstrap_mean_ci([], b=10) == (0.0, 0.0)
`,
      tests: `import random

# 1. The interval brackets the sample mean and is correctly ordered.
_gen = random.Random(1)
data = [_gen.gauss(10, 3) for _ in range(200)]
lo, hi = bootstrap_mean_ci(data, b=500, seed=3)
m = sum(data) / len(data)
assert lo < m < hi, (lo, m, hi)

# 2. Reproducible for a given seed, different for another one.
assert bootstrap_mean_ci(data, b=300, seed=11) == bootstrap_mean_ci(data, b=300, seed=11)
assert bootstrap_mean_ci(data, b=300, seed=11) != bootstrap_mean_ci(data, b=300, seed=12)

# 3. A constant sample has a degenerate interval.
lo, hi = bootstrap_mean_ci([5.0] * 50, b=200, seed=1)
assert abs(lo - 5.0) < 1e-9 and abs(hi - 5.0) < 1e-9

# 4. Empty input.
assert bootstrap_mean_ci([], b=50) == (0.0, 0.0)

# 5. A wider alpha gives a narrower interval.
wide = bootstrap_mean_ci(data, b=600, alpha=0.05, seed=5)
narrow = bootstrap_mean_ci(data, b=600, alpha=0.5, seed=5)
assert (narrow[1] - narrow[0]) < (wide[1] - wide[0])

# 6. More data, narrower interval.
rnd = random.Random(42)
small = [rnd.gauss(0, 1) for _ in range(40)]
big = [rnd.gauss(0, 1) for _ in range(1000)]
w_small = bootstrap_mean_ci(small, b=400, seed=2)
w_big = bootstrap_mean_ci(big, b=400, seed=2)
assert (w_big[1] - w_big[0]) < (w_small[1] - w_small[0])

# 7. The promise that matters: coverage close to the nominal level.
rnd = random.Random(20260321)
covered = 0
reps = 120
for _ in range(reps):
    sample = [rnd.expovariate(1 / 50.0) for _ in range(60)]
    lo, hi = bootstrap_mean_ci(sample, b=150, seed=rnd.randrange(10 ** 6))
    if lo <= 50.0 <= hi:
        covered += 1
coverage = covered / reps
assert 0.82 <= coverage <= 1.0, coverage
`,
      writeup: l(
        'Бутстрап — это цикл из трёх строк, и вся его сила в том, что он ничего не предполагает о распределении. Несколько практических деталей. Первая: ресемплить надо выборку того же размера n — именно это воспроизводит исходную неопределённость; выборка меньшего размера даст слишком широкий интервал. Вторая: rnd.choices с возвращением, а не sample, который берёт без возвращения и при k = n просто перемешает данные, дав нулевую дисперсию. Третья: интерполяция квантилей важнее, чем кажется, при маленьком B — без неё границы прыгают дискретными шагами. Проверка покрытия в тестах сделана на экспоненциальных данных с сильной скошенностью, и покрытие там заметно ниже 95% при n = 60: перцентильный бутстрап смещён на скошенных данных, и это известное ограничение — для таких случаев есть BCa-вариант с поправкой на смещение и ускорение. Знать про этот недостаток важнее, чем уметь реализовать BCa наизусть.',
        'The bootstrap is a three-line loop, and all its strength lies in assuming nothing about the distribution. A few practical details. First, resample at the same size n — that is what reproduces the original uncertainty; a smaller resample gives an interval that is too wide. Second, rnd.choices resamples with replacement, unlike sample, which draws without replacement and at k = n merely shuffles the data, yielding zero variance. Third, interpolating the quantiles matters more than it looks at small B — without it the bounds jump in discrete steps. The coverage check in the tests uses exponential, strongly skewed data, and coverage there is noticeably below 95% at n = 60: the percentile bootstrap is biased on skewed data, and that is a known limitation — the BCa variant with bias correction and acceleration exists for such cases. Knowing about the shortcoming matters more than being able to implement BCa from memory.',
      ),
    },
  ],

  sources: [
    {
      title: 'SciPy: statistical tests',
      url: 'https://docs.scipy.org/doc/scipy/reference/stats.html',
      note: same('ttest_ind, mannwhitneyu, bootstrap'),
    },
    {
      title: 'Wikipedia: Mann-Whitney U test',
      url: 'https://en.wikipedia.org/wiki/Mann%E2%80%93Whitney_U_test',
    },
  ],
};
