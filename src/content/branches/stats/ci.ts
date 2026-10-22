import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const statsCi: SkillNode = {
  id: 'stats.ci',
  branch: 'stats',
  act: 1,
  tier: 3,
  title: l('Доверительные интервалы', 'Confidence intervals'),
  blurb: l(
    'Что они обещают, как это проверить симуляцией и где нормальное приближение врёт.',
    'What they promise, how to check it by simulation, and where the normal approximation lies.',
  ),
  requires: ['stats.clt'],
  theory: [
    {
      type: 'p',
      text: l(
        'Доверительный интервал — это процедура, а не утверждение о конкретном числе. Фраза «95% интервал» означает: если повторять эксперимент много раз и каждый раз строить интервал по этому правилу, то в 95% повторений интервал накроет истинное значение. Про один конкретный интервал нельзя сказать «истина лежит в нём с вероятностью 95%» — истина там либо есть, либо нет.',
        'A confidence interval is a procedure, not a statement about one particular number. Saying "95% interval" means: repeat the experiment many times, build the interval by this rule each time, and in 95% of repetitions the interval covers the true value. About one specific interval you cannot say "the truth is inside with 95% probability" — it either is or it is not.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Это различие любят спрашивать на собеседовании. Гарантия относится к методу построения, а не к одному результату. Если хочется говорить о вероятности для конкретного интервала — это байесовский credible interval, другой объект с другими предположениями.',
        'Interviewers like this distinction. The guarantee is about the construction method, not about one result. If you want to talk about probability for a specific interval, that is a Bayesian credible interval — a different object with different assumptions.',
      ),
    },
    {
      type: 'formula',
      tex: '\\hat p \\pm z_{1-\\alpha/2}\\sqrt{\\frac{\\hat p(1-\\hat p)}{n}}',
      caption: l(
        'Интервал Wald: нормальное приближение, самая распространённая и самая ломкая формула.',
        'The Wald interval: normal approximation, the most common and most fragile formula.',
      ),
    },
    {
      type: 'sim',
      sim: 'ci-coverage',
      title: l('Симулятор покрытия', 'Coverage simulator'),
      caption: l(
        'Сто независимых экспериментов, в каждом строится интервал. Зелёные накрыли истинное p, красные промахнулись. При p = 10% и n = 100 покрытие заметно ниже обещанных 95%: подвинь n вниз и посмотри, как рушится правило n·p ≥ 10. Переключи метод на Вильсона — промахов станет ровно столько, сколько обещано.',
        'A hundred independent experiments, each with its own interval. Green ones covered the true p, red ones missed. At p = 10% and n = 100 the coverage is visibly below the promised 95%: drag n down and watch the n·p ≥ 10 rule fall apart. Switch the method to Wilson and the misses drop to exactly what was promised.',
      ),
    },
    { type: 'h', text: l('Почему Wald врёт, а Вильсон нет', 'Why Wald lies and Wilson does not') },
    {
      type: 'p',
      text: l(
        'У Wald две беды. Первая: он использует оценку p̂ вместо истинного p в формуле дисперсии, и при p̂ близком к нулю дисперсия оценивается слишком маленькой. Вторая, более грубая: при x = 0 кликов он даёт интервал нулевой ширины, то есть «мы точно знаем, что конверсия равна нулю». Вильсон решает уравнение относительно p вместо подстановки оценки, поэтому его интервал никогда не вырождается и всегда лежит внутри [0, 1].',
        'Wald has two problems. First, it plugs the estimate p̂ into the variance formula instead of the true p, so when p̂ is near zero the variance comes out far too small. Second and cruder: with x = 0 clicks it returns a zero-width interval, i.e. "we know for certain the conversion is zero". Wilson solves an equation for p instead of substituting the estimate, so its interval never degenerates and always sits inside [0, 1].',
      ),
    },
    {
      type: 'formula',
      tex: '(\\hat p - p)^2 = z^2\\,\\frac{p(1-p)}{n} \\;\\Longrightarrow\\; \\text{границы — корни этого квадратного уравнения}',
    },
    {
      type: 'sim',
      sim: 'ci-wald-vs-wilson',
      title: l('Покрытие: Wald против Вильсона', 'Coverage: Wald versus Wilson'),
      caption: l(
        'По каждой точке прогоняется 1200 экспериментов, покрытие считается симуляцией. Wald проваливается на малых p и мелких n, причём не плавно, а пилой — из-за дискретности числа успехов. Вильсон держится около 95% почти везде.',
        'Each point runs 1200 experiments and the coverage is measured by simulation. Wald fails at small p and small n, and not smoothly but in a sawtooth, because the number of successes is discrete. Wilson stays near 95% almost everywhere.',
      ),
    },
    { type: 'h', text: l('Сколько данных нужно для нужной точности', 'How much data a given precision needs') },
    {
      type: 'p',
      text: l(
        'Ширина интервала — это язык, на котором стоит разговаривать с продактом. Вопрос «нам хватит недели?» переводится в «какой будет ширина интервала через неделю трафика», и ответ считается заранее, до запуска. Обрати внимание на цену точности: сузить интервал вдвое стоит вчетверо больше трафика.',
        'Interval width is the language to use with a product manager. "Will a week be enough?" translates into "how wide will the interval be after a week of traffic", and the answer is computed before launch, not after. Note the price of precision: halving the width costs four times the traffic.',
      ),
    },
    {
      type: 'sim',
      sim: 'ci-width',
      title: l('Ширина интервала против трафика', 'Interval width versus traffic'),
      caption: l(
        'Три уровня доверия. Числа под графиком — требуемый n для фиксированной ширины, пересчитываются при движении ползунка конверсии. Заметь, что переход с 95% на 99% дороже, чем кажется.',
        'Three confidence levels. The numbers under the chart are the n required for a fixed width and are recomputed as you drag the conversion slider. Note that moving from 95% to 99% costs more than it looks.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'stats.ci.q-interpretation',
      mode: 'single',
      prompt: l(
        'Посчитали 95% доверительный интервал для разницы CTR: [-0.1 пп; +0.6 пп]. Какая формулировка корректна?',
        'A 95% confidence interval for the CTR difference came out as [-0.1 pp; +0.6 pp]. Which statement is correct?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'С вероятностью 95% истинная разница лежит в этом интервале',
            'With 95% probability the true difference lies in this interval',
          ),
        },
        {
          id: 'b',
          text: l(
            'Данные совместимы с отсутствием эффекта, но и с ростом до 0.6 пп: мощности не хватило для вывода',
            'The data are compatible with no effect, but also with a rise up to 0.6 pp: there was not enough power to conclude',
          ),
        },
        { id: 'c', text: l('Эффекта нет, можно откатывать фичу', 'There is no effect, the feature can be rolled back') },
        { id: 'd', text: l('Эффект есть, но маленький', 'There is an effect, but a small one') },
      ],
      correct: ['b'],
      explanation: l(
        'Интервал содержит ноль, значит на уровне 0.05 эффект не доказан — но «не доказан» не равно «отсутствует». Верхняя граница +0.6 пп может быть вполне интересной для бизнеса, то есть эксперимент просто не ответил на вопрос. Правильное действие — посчитать, какой трафик нужен для MDE меньше 0.6 пп, а не объявлять эффект нулевым. Формулировка про «вероятность 95%» — классическая ошибка интерпретации: вероятность относится к процедуре, а не к данному интервалу.',
        'The interval contains zero, so at the 0.05 level the effect is not demonstrated — but "not demonstrated" is not "absent". An upper bound of +0.6 pp may well be interesting to the business, which means the experiment simply did not answer the question. The right move is to compute the traffic needed for an MDE below 0.6 pp, not to declare the effect zero. The "95% probability" phrasing is the classic misinterpretation: the probability belongs to the procedure, not to this interval.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.ci.q-zero-clicks',
      mode: 'single',
      prompt: l(
        'Новый баннер показали 500 раз, кликов не было ни одного. Что даст интервал Wald и что с этим делать?',
        'A new banner was shown 500 times with zero clicks. What does the Wald interval give and what should be done about it?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Интервал [0; 0] — CTR баннера ровно нулевой', 'The interval [0; 0] — the banner CTR is exactly zero'),
        },
        {
          id: 'b',
          text: l(
            'Интервал [0; 0], и это бессмыслица: нужен Вильсон или правило трёх, они дадут верхнюю границу около 0.6%',
            'The interval [0; 0], which is nonsense: Wilson or the rule of three is needed and gives an upper bound near 0.6%',
          ),
        },
        { id: 'c', text: l('Интервал посчитать нельзя вообще', 'No interval can be computed at all') },
        { id: 'd', text: l('Нужно просто увеличить уровень доверия до 99%', 'Just raise the confidence level to 99%') },
      ],
      correct: ['b'],
      explanation: l(
        'При x = 0 формула Wald даёт p̂ = 0 и нулевую дисперсию, то есть вырожденный интервал. Вильсон даёт примерно [0; 0.0073]. Есть и быстрая прикидка — «правило трёх»: при нуле событий верхняя граница 95% интервала примерно 3/n, здесь 3/500 = 0.6%. Содержательный вывод: 500 показов просто не позволяют отличить CTR 0% от CTR 0.5%.',
        'At x = 0 the Wald formula gives p̂ = 0 and zero variance, i.e. a degenerate interval. Wilson gives roughly [0; 0.0073]. There is also a quick shortcut, the "rule of three": with zero events the upper bound of the 95% interval is about 3/n, here 3/500 = 0.6%. The substantive conclusion: 500 impressions simply cannot tell a 0% CTR from a 0.5% one.',
      ),
    },
    {
      kind: 'python',
      id: 'stats.ci.py-wilson',
      prompt: l(
        'Реализуй интервал Вильсона. Функция принимает число успехов, размер выборки и z-квантиль, возвращает кортеж (low, high). Требования: границы обрезаны в [0, 1]; при n = 0 вернуть (0.0, 1.0); при нуле успехов нижняя граница должна быть 0.0, а верхняя строго больше нуля. Нельзя использовать внешние библиотеки, кроме math.',
        'Implement the Wilson interval. The function takes the number of successes, the sample size and the z quantile, and returns a tuple (low, high). Requirements: bounds clamped to [0, 1]; for n = 0 return (0.0, 1.0); with zero successes the lower bound must be 0.0 and the upper bound strictly above zero. No external libraries beyond math.',
      ),
      signature: 'def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:',
      starter: `import math


def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    # TODO
    return (0.0, 1.0)
`,
      reference: `import math


def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    if n <= 0:
        return (0.0, 1.0)
    p = successes / n
    denom = 1.0 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, center - half), min(1.0, center + half))
`,
      sampleTests: `lo, hi = wilson_interval(10, 100)
assert 0.05 < lo < 0.06 and 0.17 < hi < 0.18

# zero successes: not a degenerate interval
lo, hi = wilson_interval(0, 500)
assert lo == 0.0 and 0.0 < hi < 0.02

assert wilson_interval(7, 0) == (0.0, 1.0)
`,
      tests: `import math
import random


def _bounds_by_roots(x, n, z):
    """Same interval derived differently: roots of (p_hat - p)^2 = z^2 p(1-p)/n."""
    p = x / n
    a = 1.0 + z * z / n
    b = -(2.0 * p + z * z / n)
    c = p * p
    disc = max(0.0, b * b - 4 * a * c)
    r1 = (-b - math.sqrt(disc)) / (2 * a)
    r2 = (-b + math.sqrt(disc)) / (2 * a)
    return (max(0.0, min(r1, r2)), min(1.0, max(r1, r2)))


# 1. Matches an algebraically independent derivation of the same interval.
for n in (10, 37, 100, 1000):
    for x in (0, 1, 2, n // 3, n // 2, n - 1, n):
        for z in (1.6449, 1.96, 2.5758):
            got = wilson_interval(x, n, z)
            want = _bounds_by_roots(x, n, z)
            assert abs(got[0] - want[0]) < 1e-9, (x, n, z, got, want)
            assert abs(got[1] - want[1]) < 1e-9, (x, n, z, got, want)

# 2. Degenerate input.
assert wilson_interval(0, 0) == (0.0, 1.0)

# 3. Bounds stay inside [0, 1] and ordered.
for n in (1, 5, 50, 999):
    for x in range(0, n + 1, max(1, n // 7)):
        lo, hi = wilson_interval(x, n)
        assert 0.0 <= lo <= hi <= 1.0

# 4. Zero successes must not collapse the interval (this is what Wald gets wrong).
lo, hi = wilson_interval(0, 500)
assert lo == 0.0
assert 0.0 < hi < 0.02

# 5. Symmetry: the interval for n-x is the mirror image of the one for x.
for n in (20, 101):
    for x in range(n + 1):
        lo, hi = wilson_interval(x, n)
        mlo, mhi = wilson_interval(n - x, n)
        assert abs(lo - (1.0 - mhi)) < 1e-12
        assert abs(hi - (1.0 - mlo)) < 1e-12

# 6. Width shrinks as n grows.
widths = []
for n in (50, 200, 800, 3200):
    lo, hi = wilson_interval(round(0.2 * n), n)
    widths.append(hi - lo)
assert all(widths[i] > widths[i + 1] for i in range(len(widths) - 1))

# 7. The actual promise: coverage close to the nominal level.
rnd = random.Random(20260321)
p_true = 0.08
n = 60
covered = 0
reps = 4000
for _ in range(reps):
    x = sum(1 for _ in range(n) if rnd.random() < p_true)
    lo, hi = wilson_interval(x, n)
    if lo <= p_true <= hi:
        covered += 1
coverage = covered / reps
assert 0.93 <= coverage <= 0.99, coverage
`,
      writeup: l(
        'Ключевая идея Вильсона: не подставлять оценку в формулу дисперсии, а решить уравнение (p̂ - p)² = z²·p(1-p)/n относительно p. Это квадратное уравнение, его корни и есть границы. Отсюда все хорошие свойства: интервал всегда внутри [0, 1], не вырождается при x = 0 или x = n, и центр смещён к 1/2 — именно это смещение компенсирует недооценку дисперсии в Wald. Скрытые тесты проверяют не выписанные руками числа, а совпадение с независимым выводом тех же границ через формулу корней, симметрию, монотонность ширины и, главное, фактическое покрытие на 4000 симуляциях. В продовом коде лучше брать scipy.stats.binomtest(...).proportion_ci(method="wilson"), но знать, что внутри, обязательно: именно этот интервал стоит показывать в отчётах по редким конверсиям.',
        'The key idea in Wilson is not to plug the estimate into the variance formula but to solve (p̂ - p)² = z²·p(1-p)/n for p. That is a quadratic, and its roots are the bounds. All the good properties follow: the interval always sits inside [0, 1], never degenerates at x = 0 or x = n, and its centre is pulled towards 1/2 — exactly the shift that compensates for Wald underestimating the variance. The hidden tests check not hand-written numbers but agreement with an independent derivation of the same bounds via the quadratic formula, plus symmetry, width monotonicity and, above all, actual coverage over 4000 simulations. In production code reach for scipy.stats.binomtest(...).proportion_ci(method="wilson"), but knowing what is inside is not optional: this is the interval to put in reports about rare conversions.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Binomial proportion confidence interval',
      url: 'https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval',
      note: l('Wald, Вильсон, Клоппер-Пирсон и правило трёх.', 'Wald, Wilson, Clopper-Pearson and the rule of three.'),
    },
    {
      title: 'SciPy: binomtest and proportion_ci',
      url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html',
    },
  ],
};
