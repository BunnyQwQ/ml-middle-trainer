import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const statsClt: SkillNode = {
  id: 'stats.clt',
  branch: 'stats',
  tier: 2,
  title: l('Центральная предельная теорема', 'The central limit theorem'),
  blurb: l(
    'Почему к средним можно применять нормальные формулы — и когда нельзя.',
    'Why normal formulas work for means, and when they do not.',
  ),
  requires: ['stats.distributions'],
  theory: [
    {
      type: 'p',
      text: l(
        'ЦПТ отвечает на вопрос, почему во всех A/B-калькуляторах стоит нормальное распределение, хотя клики — это нули и единицы. Утверждение простое: среднее по n независимым наблюдениям при росте n ведёт себя как нормальная величина с центром в истинном среднем и стандартным отклонением sigma/sqrt(n), какое бы распределение ни было у одного наблюдения. Важно, что требование к одному наблюдению — только конечная дисперсия, а не нормальность.',
        'The CLT answers why every A/B calculator has a normal distribution inside it even though clicks are zeros and ones. The claim is simple: as n grows, the mean of n independent observations behaves like a normal variable centred on the true mean with standard deviation sigma/sqrt(n), whatever the distribution of a single observation is. Note that the only requirement on a single observation is finite variance, not normality.',
      ),
    },
    {
      type: 'formula',
      tex: '\\bar X_n \\;\\approx\\; \\mathcal{N}\\!\\left(\\mu,\\; \\frac{\\sigma^2}{n}\\right) \\quad \\text{при больших } n',
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'ЦПТ говорит про распределение среднего, а не про распределение данных. Выручка остаётся логнормальной с жутким хвостом сколько бы данных ты ни собрал — нормальной становится только её средняя оценка.',
        'The CLT is about the distribution of the mean, not the distribution of the data. Revenue stays lognormal with a nasty tail no matter how much data you collect; it is only the estimate of its mean that becomes normal.',
      ),
    },
    {
      type: 'sim',
      sim: 'clt',
      title: l('ЦПТ в действии', 'The CLT in action'),
      caption: l(
        'Поставь экспоненциальное распределение и n = 1: гистограмма средних — это само распределение, ничего нормального. Увеличивай n и смотри, как форма подтягивается к красной кривой. Сравни два ряда снизу: SD средних по симуляции против теоретической sigma/sqrt(n) — они совпадают до третьего знака.',
        'Set the exponential distribution and n = 1: the histogram of means is the distribution itself, nothing normal about it. Raise n and watch the shape pull towards the red curve. Compare the two readouts at the bottom: the simulated SD of means against the theoretical sigma/sqrt(n) — they agree to three decimals.',
      ),
    },
    { type: 'h', text: l('Скорость сходимости: откуда берётся корень', 'Rate of convergence: where the square root comes from') },
    {
      type: 'p',
      text: l(
        'Полезно один раз увидеть не формулу, а измерение. Если прогнать много выборок каждого размера и посчитать среднеквадратичную ошибку оценки, то в логарифмических осях точки лягут на прямую с наклоном -1/2. Наклон -1/2 и есть «корень из n»: это не соглашение и не приближение, а измеряемый факт.',
        'It is worth seeing this measured once instead of derived. Run many samples of each size, compute the root-mean-square error of the estimate, and in log-log axes the points fall on a straight line with slope -1/2. That slope is the "square root of n": not a convention or an approximation but a measurable fact.',
      ),
    },
    {
      type: 'sim',
      sim: 'clt-error-decay',
      title: l('Измеренный наклон -1/2', 'The measured slope of -1/2'),
      caption: l(
        'Наклон считается методом наименьших квадратов прямо по симулированным точкам, он не вписан в текст. Поменяй распределение: наклон остаётся тем же, меняется только высота прямой — то есть константа, а не закон.',
        'The slope is fitted by least squares on the simulated points; it is not typed into the text. Switch the distribution: the slope stays, only the height of the line moves — a constant changes, the law does not.',
      ),
    },
    { type: 'h', text: l('Когда ЦПТ подводит', 'When the CLT lets you down') },
    {
      type: 'list',
      items: [
        l(
          'Редкие события. Для конверсии 0.05% и n = 1000 ожидаемое число событий — половина. Нормальное приближение здесь даёт отрицательные границы интервала. Практическое правило: n·p и n·(1-p) должны быть не меньше 10.',
          'Rare events. At a 0.05% conversion and n = 1000 the expected count is one half. The normal approximation here produces negative interval bounds. Rule of thumb: both n·p and n·(1-p) should be at least 10.',
        ),
        l(
          'Тяжёлые хвосты. У выручки «большое n» начинается не с сотен, а с десятков тысяч наблюдений, потому что дисперсию определяют редкие крупные заказы. Проверять это надо симуляцией на своих же данных, а не верить формуле.',
          'Heavy tails. For revenue, "large n" starts in the tens of thousands rather than the hundreds, because the variance is driven by rare large orders. Check that by simulating on your own data rather than trusting the formula.',
        ),
        l(
          'Зависимые наблюдения. ЦПТ требует независимости. Десять показов одному пользователю — не десять независимых наблюдений, и это самая частая причина, по которой «значимый» результат не воспроизводится. Этим занимается следующая ветка.',
          'Dependent observations. The CLT requires independence. Ten impressions shown to one user are not ten independent observations, and that is the single most common reason a "significant" result fails to reproduce. The next branch is about exactly that.',
        ),
        l(
          'Ratio-метрики. CTR как отношение суммы кликов к сумме показов — это не среднее независимых величин, у него своя дисперсия. Для него нужны дельта-метод или бутстрап, это будет на втором этапе.',
          'Ratio metrics. CTR as a sum of clicks over a sum of impressions is not a mean of independent variables and has its own variance. It needs the delta method or the bootstrap, which comes in stage two.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Типичный вопрос на собеседовании: «данных 50 тысяч, можно применять z-тест?». Правильный ответ не «да», а «зависит от метрики»: для CTR с p = 5% — да, n·p = 2500; для конверсии в покупку 0.02% — n·p = 10, уже на грани; для средней выручки — надо смотреть на хвост.',
        'A standard interview question: "we have 50 thousand observations, can we use a z-test?". The right answer is not "yes" but "depends on the metric": for a CTR of 5% yes, n·p = 2500; for a 0.02% purchase conversion n·p = 10, which is borderline; for average revenue you have to look at the tail.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'stats.clt.q-what-converges',
      mode: 'single',
      prompt: l(
        'Выручка на пользователя логнормальна. Собрали 200 000 пользователей. Что из перечисленного станет примерно нормальным?',
        'Revenue per user is lognormal. We collected 200,000 users. Which of the following becomes approximately normal?',
      ),
      choices: [
        { id: 'a', text: l('Распределение выручки по пользователям', 'The distribution of revenue across users') },
        { id: 'b', text: l('Распределение оценки средней выручки', 'The distribution of the average-revenue estimate') },
        { id: 'c', text: l('И то, и другое', 'Both of them') },
        { id: 'd', text: l('Ни то, ни другое: логнормальность не лечится', 'Neither: lognormality cannot be fixed') },
      ],
      correct: ['b'],
      explanation: l(
        'ЦПТ про среднее. Гистограмма выручки по пользователям останется скошенной с длинным хвостом при любом n — это свойство самих данных. Нормальным становится распределение оценки среднего, то есть то, что нас интересует при сравнении групп.',
        'The CLT is about the mean. The histogram of revenue across users stays skewed with a long tail at any n — that is a property of the data itself. What becomes normal is the distribution of the estimate of the mean, which is exactly what matters when comparing groups.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.clt.q-np-rule',
      mode: 'single',
      prompt: l(
        'Конверсия в подписку 0.3%, в группе 2 000 пользователей. Можно ли считать доверительный интервал по нормальному приближению?',
        'Subscription conversion is 0.3% and the group has 2,000 users. Can the confidence interval be built with the normal approximation?',
      ),
      choices: [
        { id: 'a', text: l('Да, 2000 — большая выборка', 'Yes, 2000 is a large sample') },
        {
          id: 'b',
          text: l(
            'Нет: ожидаемое число событий n·p = 6, это меньше 10 — нужен Вильсон или точный метод',
            'No: the expected count n·p = 6 is below 10 — use Wilson or an exact method',
          ),
        },
        { id: 'c', text: l('Да, если взять уровень доверия 99% вместо 95%', 'Yes, if you take a 99% level instead of 95%') },
        { id: 'd', text: l('Нет, нормальное приближение вообще не применимо к долям', 'No, the normal approximation never applies to proportions') },
      ],
      correct: ['b'],
      explanation: l(
        'Размер выборки сам по себе ничего не говорит: важно ожидаемое число событий. При n·p = 6 нормальное приближение даёт слишком узкий и смещённый интервал. Повышение уровня доверия не лечит проблему, а усугубляет её — границы уезжают в отрицательные значения.',
        'Sample size on its own says nothing: what matters is the expected number of events. At n·p = 6 the normal approximation gives an interval that is too narrow and biased. Raising the confidence level does not fix it but makes it worse, pushing the bounds into negative values.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.clt.q-independence',
      mode: 'multi',
      prompt: l(
        'В каких из этих случаев требование независимости наблюдений нарушено?',
        'In which of these cases is the independence requirement violated?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Берём все показы за неделю как отдельные наблюдения, хотя один пользователь даёт десятки показов',
            'Taking every impression over a week as a separate observation, while one user produces dozens of them',
          ),
        },
        {
          id: 'b',
          text: l(
            'Берём по одному случайному показу от каждого пользователя',
            'Taking one random impression from each user',
          ),
        },
        {
          id: 'c',
          text: l(
            'Считаем метрику на уровне пользователя, рандомизация тоже по пользователю',
            'Computing the metric at user level, with randomisation at user level too',
          ),
        },
        {
          id: 'd',
          text: l(
            'Берём запросы одной сессии как независимые: пользователь переформулирует запрос, увидев плохую выдачу',
            'Taking queries from one session as independent, while the user reformulates after seeing bad results',
          ),
        },
      ],
      correct: ['a', 'd'],
      explanation: l(
        'Зависимость появляется, когда одно наблюдение несёт информацию о другом. Несколько показов одному пользователю скоррелированы: у активных пользователей своя склонность кликать. Запросы внутри сессии скоррелированы ещё и причинно — плохая выдача порождает переформулировку. Варианты b и c корректны: в b мы искусственно делаем наблюдения независимыми (ценой данных), в c единица анализа совпадает с единицей рандомизации.',
        'Dependence appears when one observation carries information about another. Several impressions from one user are correlated: active users have their own propensity to click. Queries inside a session are also causally linked — bad results cause a reformulation. Options b and c are fine: b forces independence at the cost of data, and c has the unit of analysis matching the unit of randomisation.',
      ),
    },
  ],

  sources: [
    {
      title: 'Allen Downey, Think Stats (2nd ed., free)',
      url: 'https://greenteapress.com/wp/think-stats-2e/',
    },
    {
      title: 'Wikipedia: Central limit theorem',
      url: 'https://en.wikipedia.org/wiki/Central_limit_theorem',
      note: l('Формулировки и условия.', 'Statements and conditions.'),
    },
  ],
};
