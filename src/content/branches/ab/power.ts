import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abPower: SkillNode = {
  id: 'ab.power',
  branch: 'ab',
  tier: 2,
  title: l('Мощность и MDE', 'Power and MDE'),
  blurb: l(
    'Сколько трафика нужно и какой эффект ты вообще способен увидеть.',
    'How much traffic you need and what effect you are able to see at all.',
  ),
  requires: ['ab.basics', 'stats.ci'],
  theory: [
    {
      type: 'p',
      text: l(
        'Эксперимент надо рассчитывать до запуска, и считается ровно одна вещь: какой минимальный эффект ты сможешь задетектировать на доступном трафике. Это MDE, minimum detectable effect. Если MDE равен 5%, а продакт ждёт роста на 1%, эксперимент бесполезен ещё до старта — он с высокой вероятностью покажет «значимых различий нет» независимо от того, работает фича или нет.',
        'An experiment has to be sized before launch, and exactly one thing gets computed: the smallest effect you will be able to detect on the traffic available. That is the MDE, the minimum detectable effect. If the MDE is 5% and the product manager expects a 1% lift, the experiment is useless before it starts — it will most likely report "no significant difference" whether the feature works or not.',
      ),
    },
    {
      type: 'h',
      text: l('Четыре числа, связанные жёстко', 'Four numbers tied rigidly together'),
    },
    {
      type: 'list',
      items: [
        l('alpha — вероятность увидеть эффект там, где его нет (ошибка I рода). Обычно 0.05.', 'alpha — the chance of seeing an effect that is not there (type I error). Usually 0.05.'),
        l('beta — вероятность не увидеть эффект, который есть (ошибка II рода). Мощность = 1 - beta, обычно целятся в 0.8.', 'beta — the chance of missing an effect that is there (type II error). Power = 1 - beta, usually targeted at 0.8.'),
        l('Размер эффекта — то, что хотим задетектировать.', 'Effect size — what we want to detect.'),
        l('n — трафик на группу.', 'n — traffic per group.'),
      ],
    },
    {
      type: 'p',
      text: l(
        'Зафиксируй любые три — четвёртое определено. Это не четыре независимые ручки, а одно уравнение, и вся работа при планировании эксперимента состоит в том, чтобы честно показать продакту этот компромисс.',
        'Fix any three and the fourth is determined. These are not four independent knobs but one equation, and the whole job of planning an experiment is to show the product manager that trade-off honestly.',
      ),
    },
    {
      type: 'formula',
      tex: 'n \\;=\\; \\frac{\\left(z_{1-\\alpha/2}\\sqrt{2\\bar p(1-\\bar p)} + z_{\\text{power}}\\sqrt{p_1(1-p_1)+p_2(1-p_2)}\\right)^2}{(p_2-p_1)^2}',
      caption: l(
        'Размер выборки на группу для разницы двух конверсий. Та же формула внутри любого онлайн-калькулятора.',
        'Sample size per group for a difference of two conversions. The same formula sits inside every online calculator.',
      ),
    },
    {
      type: 'sim',
      sim: 'error-areas',
      title: l('Ошибки I и II рода как площади', 'Type I and type II errors as areas'),
      caption: l(
        'Синяя кривая — распределение статистики, если эффекта нет; зелёная — если эффект есть. Красные хвосты — alpha, жёлтая область — beta. Потяни alpha вниз: красное сжимается, жёлтое растёт. Это и есть компромисс, который нельзя обойти, не добавив данных.',
        'The blue curve is the distribution of the statistic when there is no effect; the green one when there is. The red tails are alpha and the yellow area is beta. Drag alpha down: red shrinks and yellow grows. That is the trade-off, and the only way around it is more data.',
      ),
    },
    {
      type: 'sim',
      sim: 'power-curve',
      title: l('Мощность против трафика', 'Power versus traffic'),
      caption: l(
        'Три кривые — три относительных эффекта. Чёрные точки получены прямой симуляцией экспериментов, а не формулой: они лежат на кривых, то есть формуле можно доверять. Цифры снизу — необходимый трафик на группу для мощности 80%, они пересчитываются при изменении базовой конверсии.',
        'Three curves for three relative effects. The black dots come from directly simulated experiments rather than the formula: they land on the curves, which is why the formula can be trusted. The numbers below are the traffic per group needed for 80% power, recomputed as the baseline conversion changes.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Запомни масштаб: чтобы задетектировать вдвое меньший эффект, нужно в четыре раза больше трафика. Для относительного эффекта в 1% на конверсии 20% речь идёт о сотнях тысяч пользователей на группу. Именно поэтому в больших продуктах так много сил уходит на снижение дисперсии (CUPED, стратификация) — это дешевле, чем ждать трафик.',
        'Remember the scale: detecting an effect half the size takes four times the traffic. For a 1% relative effect on a 20% conversion that means hundreds of thousands of users per group. This is why large products spend so much effort on variance reduction (CUPED, stratification): it is cheaper than waiting for traffic.',
      ),
    },
    {
      type: 'sim',
      sim: 'mde-calculator',
      title: l('Калькулятор MDE', 'MDE calculator'),
      caption: l(
        'Рабочий инструмент, а не иллюстрация. Введи реальную конверсию и доступный трафик — получишь MDE в абсолютных и относительных величинах. Кривая показывает, как MDE падает с трафиком: обрати внимание, насколько плоской она становится справа.',
        'A working tool rather than an illustration. Put in a real conversion rate and the traffic you have, and you get the MDE in absolute and relative terms. The curve shows how the MDE falls with traffic: note how flat it becomes on the right.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Частая ошибка: считать MDE для метрики на уровне показов, а рандомизовать по пользователям. Тогда реальный MDE хуже расчётного в sqrt(design effect) раз. Если в расчёте этого не учли, эксперимент окажется недомощным, а вывод «эффекта нет» — ничем не обоснованным.',
        'A common mistake: computing the MDE for an impression-level metric while randomising by user. The real MDE is then worse than the computed one by a factor of sqrt(design effect). Leave that out of the calculation and the experiment ends up underpowered, with a "no effect" conclusion that rests on nothing.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.power.q-traffic-scaling',
      mode: 'single',
      prompt: l(
        'Для детекта относительного роста CTR на 2% нужно 400 000 пользователей на группу. Сколько примерно нужно для роста на 1%?',
        'Detecting a 2% relative CTR lift needs 400,000 users per group. Roughly how many are needed for a 1% lift?',
      ),
      choices: [
        { id: 'a', text: l('800 тысяч', '800 thousand') },
        { id: 'b', text: l('1.6 миллиона', '1.6 million') },
        { id: 'c', text: l('400 тысяч, размер эффекта не влияет на n', '400 thousand, effect size does not affect n') },
        { id: 'd', text: l('200 тысяч', '200 thousand') },
      ],
      correct: ['b'],
      explanation: l(
        'n обратно пропорционален квадрату эффекта. Эффект уменьшили в 2 раза — n растёт в 4 раза: 400 тыс. × 4 = 1.6 млн на группу, то есть 3.2 млн пользователей всего. Это ровно тот расчёт, который стоит делать до того, как обещать продакту результат за неделю.',
        'n is inversely proportional to the square of the effect. Halve the effect and n grows fourfold: 400k × 4 = 1.6M per group, i.e. 3.2M users in total. This is exactly the calculation to run before promising a product manager a result within a week.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.power.q-underpowered',
      mode: 'multi',
      prompt: l(
        'Эксперимент недомощный: MDE 4%, ожидаемый эффект около 1%. Какие действия разумны?',
        'The experiment is underpowered: the MDE is 4% and the expected effect is around 1%. Which actions are sensible?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Перейти на более чувствительную метрику ближе к воздействию (клик вместо заказа)',
            'Switch to a more sensitive metric closer to the treatment (click instead of order)',
          ),
        },
        {
          id: 'b',
          text: l('Снизить дисперсию: CUPED, стратификация, усечение выбросов', 'Reduce variance: CUPED, stratification, outlier capping'),
        },
        {
          id: 'c',
          text: l('Поднять alpha до 0.2, чтобы результат стал значимым', 'Raise alpha to 0.2 so the result becomes significant'),
        },
        {
          id: 'd',
          text: l(
            'Запустить как есть и, если p-value окажется близко к 0.05, продлить эксперимент',
            'Launch as is and extend the experiment if the p-value lands near 0.05',
          ),
        },
        {
          id: 'e',
          text: l(
            'Честно сказать, что на этом трафике вопрос не решается, и обсудить, какой эффект вообще интересен бизнесу',
            'Say plainly that this traffic cannot answer the question, and discuss what effect size matters to the business at all',
          ),
        },
      ],
      correct: ['a', 'b', 'e'],
      explanation: l(
        'Вариант c формально увеличивает мощность, но ценой учетверённой доли ложных решений — это обман себя, а не решение. Вариант d — классический peeking: продление эксперимента по результату взгляда на p-value завышает ошибку I рода в разы, этим займёмся отдельно. Рабочие пути — чувствительнее метрика, меньше дисперсия, и разговор с продактом про то, какой эффект стоит денег.',
        'Option c formally raises power but at the price of four times as many false decisions — that is self-deception, not a solution. Option d is textbook peeking: extending an experiment based on a glance at the p-value inflates the type I error several times over, which gets its own node. The workable routes are a more sensitive metric, less variance, and a conversation with the product manager about which effect size is worth money.',
      ),
    },
    {
      kind: 'case',
      id: 'ab.power.case-week-request',
      prompt: l(
        'Продакт приходит с задачей: «Мы меняем ранжирование рекламного блока. Нужно за неделю понять, выросла ли выручка на поиск. Трафика у нас 200 тысяч пользователей в неделю на группу, конверсия в клик по рекламе 3%, средняя выручка на пользователя 40 рублей с огромным хвостом. Ожидаем рост выручки процента на полтора». Напиши, что ты ответишь: что посчитаешь, что предложишь и в каком виде вернёшь ответ. Отвечай как на собеседовании — по шагам.',
        'A product manager comes with a task: "We are changing the ranking of the ad block. We need to know within a week whether revenue per search went up. We have 200 thousand users per group per week, ad click conversion is 3%, average revenue per user is 40 roubles with a huge tail. We expect a lift of about one and a half percent." Write what you would answer: what you would compute, what you would propose and in what form you would come back. Answer as you would in an interview, step by step.',
      ),
      reference: l(
        'Разумный ответ строится так. Первое: уточнить метрику решения. «Выручка на поиск» — ratio-метрика с тяжёлым хвостом, у неё большая дисперсия, и MDE на 200 тысячах пользователей почти наверняка окажется больше 1.5%. Считаем честно: при средней 40 и коэффициенте вариации порядка 3 (типично для выручки с хвостом) относительный MDE на 200 тыс. пользователей на группу получается около 4–6%, то есть ожидаемый эффект не детектируется. Второе: предложить обходные пути вместо отказа — разложить выручку на произведение метрик (CTR рекламы × конверсия в заказ × средний чек) и проверять более чувствительные звенья; добавить CUPED по предпериодной выручке пользователя, что на выручке часто снижает дисперсию на 30–50%; усечь выбросы по заранее объявленному перцентилю. Третье: обозначить guardrail-метрики, потому что рост рекламной выручки может идти за счёт релевантности — доля органических кликов, доля запросов без клика, возвращаемость. Четвёртое: честно сказать про срок. Неделя — это ещё и эффект новизны; при изменении рекламного блока первые дни дают завышенный CTR, поэтому неделя минимум, а решение по полной неделе, а не по будням. Пятое: договориться о критерии решения заранее — что считаем успехом, что откатом, какие guardrail-ограничения блокируют раскатку. Вернуть ответ в виде короткого документа: метрика решения, MDE при текущем трафике, срок, guardrails, критерий остановки.',
        'A sound answer goes like this. First, pin down the decision metric. "Revenue per search" is a ratio metric with a heavy tail and therefore a large variance, and the MDE on 200 thousand users will almost certainly exceed 1.5%. Compute it honestly: with a mean of 40 and a coefficient of variation around 3 (typical for tailed revenue), the relative MDE at 200k users per group lands near 4–6%, so the expected effect is undetectable. Second, propose routes instead of a refusal: decompose revenue into a product of metrics (ad CTR × order conversion × average order value) and test the more sensitive links; add CUPED on the user\'s pre-period revenue, which often cuts revenue variance by 30–50%; cap outliers at a percentile declared in advance. Third, name the guardrail metrics, because a rise in ad revenue can come at the cost of relevance — share of organic clicks, share of queries with no click, return rate. Fourth, be honest about the horizon. A week also means novelty effects; an ad block change inflates CTR in the first days, so a week is the minimum and the decision is made on a full week rather than weekdays only. Fifth, agree on the decision rule up front: what counts as success, what as a rollback, which guardrail breaches block the release. Return the answer as a short document: decision metric, MDE at current traffic, horizon, guardrails, stopping rule.',
      ),
      checklist: [
        l('Назвал метрику решения и объяснил, почему она ratio и тяжёлая', 'Named the decision metric and explained why it is a ratio with a heavy tail'),
        l('Посчитал или оценил MDE на заявленном трафике и сравнил с ожидаемым эффектом', 'Computed or estimated the MDE at the stated traffic and compared it with the expected effect'),
        l('Предложил снижение дисперсии (CUPED, усечение) и декомпозицию метрики', 'Proposed variance reduction (CUPED, capping) and a metric decomposition'),
        l('Назвал guardrail-метрики на релевантность, а не только выручку', 'Named guardrail metrics for relevance, not just revenue'),
        l('Упомянул эффект новизны и полные недели вместо будней', 'Mentioned novelty effects and full weeks rather than weekdays'),
        l('Зафиксировал критерий решения до запуска', 'Fixed the decision rule before launch'),
        l('Не пообещал ответ, который на этом трафике получить нельзя', 'Did not promise an answer that this traffic cannot deliver'),
      ],
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про мощность, дисперсию и CUPED.', 'The chapters on power, variance and CUPED.'),
    },
    {
      title: 'Wikipedia: Power of a test',
      url: 'https://en.wikipedia.org/wiki/Power_of_a_test',
    },
  ],
};
