import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abPeeking: SkillNode = {
  id: 'ab.peeking',
  branch: 'ab',
  act: 3,
  tier: 4,
  title: l('Подглядывание', 'Peeking'),
  blurb: l(
    'Почему «посмотрим и остановим, когда станет значимо» ломает эксперимент.',
    'Why "we will watch and stop when it goes significant" breaks the experiment.',
  ),
  requires: ['boss.experiment'],
  theory: [
    {
      type: 'p',
      text: l(
        'Соблазн понятный: дашборд обновляется каждый день, метрика уже выросла, p-value опустилось до 0.04 — зачем ждать ещё неделю. Проблема в том, что уровень значимости 5% обещан для одной проверки в заранее назначенный момент. Если смотреть каждый день и останавливаться на первом значимом результате, доля ложных срабатываний растёт с каждым взглядом, и при ежедневном контроле двухнедельного эксперимента она достигает 15–25% вместо обещанных пяти.',
        'The temptation is understandable: the dashboard refreshes daily, the metric is already up, the p-value has dipped to 0.04 — why wait another week. The problem is that the 5% significance level is promised for a single check at a pre-appointed moment. Look every day and stop at the first significant result, and the false positive rate grows with every look, reaching 15–25% instead of the promised five over a two-week experiment checked daily.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Дело не в том, что промежуточные цифры «неточные». Они точные. Дело в правиле остановки: многократная проверка одной и той же гипотезы — это множественное сравнение, растянутое во времени.',
        'It is not that the interim numbers are "imprecise". They are precise. It is the stopping rule: checking the same hypothesis repeatedly is a multiple comparison stretched out over time.',
      ),
    },
    {
      type: 'sim',
      sim: 'peeking-paths',
      title: l('Двадцать четыре честных A/A-теста', 'Twenty-four honest A/A tests'),
      caption: l(
        'Ни в одном из этих экспериментов эффекта нет. Каждая линия — траектория p-value по мере накопления трафика. Красные в какой-то день заходили ниже 0.05: остановись эксперимент в этот момент — и результат объявили бы победой. К концу значимыми остаются примерно 5%, как и обещано. Разница между «примерно 5% в конце» и «четверть хоть раз за время» и есть цена подглядывания.',
        'None of these experiments has any effect. Each line is the trajectory of a p-value as traffic accumulates. The red ones dipped below 0.05 on some day: stop the experiment then and the result gets declared a win. By the end roughly 5% remain significant, as promised. The gap between "about 5% at the end" and "a quarter at some point" is the price of peeking.',
      ),
    },
    {
      type: 'sim',
      sim: 'peeking',
      title: l('Цена каждого взгляда', 'The price of each look'),
      caption: l(
        'Доля ложных срабатываний в зависимости от числа промежуточных проверок, измеренная симуляцией. Рост быстрый поначалу и замедляется: первые несколько взглядов стоят дороже всего. Один взгляд в середине эксперимента уже поднимает ошибку примерно до 8%.',
        'The false positive rate against the number of interim checks, measured by simulation. The growth is fast at first and then slows: the first few looks cost the most. A single look halfway through already raises the error to about 8%.',
      ),
    },
    { type: 'h', text: l('Что с этим делать', 'What to do about it') },
    {
      type: 'list',
      items: [
        l(
          'Фиксированный горизонт. Срок и размер выборки считаются до запуска, решение принимается один раз. Самый простой и самый надёжный вариант, и именно его стоит называть по умолчанию.',
          'A fixed horizon. The duration and sample size are computed before launch and the decision is made once. The simplest and most reliable option, and the one to name by default.',
        ),
        l(
          'Групповые последовательные планы. Проверки разрешены, но в заранее назначенные моменты и с более строгими порогами: граница O\'Brien-Fleming в начале почти недостижима и смягчается к концу.',
          'Group sequential designs. Checks are allowed, but at pre-appointed moments and with stricter thresholds: the O\'Brien-Fleming boundary is nearly unreachable early on and relaxes towards the end.',
        ),
        l(
          'Alpha spending. Общий бюджет ошибки alpha распределяется по проверкам: потратил часть на промежуточный взгляд — на финальный осталось меньше.',
          'Alpha spending. The total error budget alpha is allocated across the checks: spend part of it on an interim look and less remains for the final one.',
        ),
        l(
          'Always-valid p-values и доверительные последовательности. Конструкции, корректные при любом числе проверок; цена — заметно меньшая мощность при той же выборке.',
          'Always-valid p-values and confidence sequences. Constructions that stay correct under any number of looks; the price is noticeably lower power at the same sample size.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Смотреть на эксперимент можно и нужно — но ради guardrail-метрик, а не ради основной. Если сервис падает или выручка рушится, эксперимент выключают немедленно, и это не подглядывание: решение «остановить из-за вреда» не то же самое, что решение «объявить победу». Асимметрия тут намеренная.',
        'Watching an experiment is fine and necessary — but for the guardrail metrics, not the primary one. If the service is failing or revenue is collapsing, the experiment is shut down at once, and that is not peeking: the decision "stop because of harm" is not the decision "declare a win". The asymmetry is deliberate.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.peeking.q-why',
      mode: 'single',
      prompt: l(
        'Почему ежедневная проверка p-value с остановкой на первом значимом результате завышает ошибку I рода?',
        'Why does checking the p-value daily and stopping at the first significant result inflate the type I error?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Промежуточные данные менее точны, поэтому p-value считается неверно',
            'Interim data is less precise, so the p-value is computed incorrectly',
          ),
        },
        {
          id: 'b',
          text: l(
            'Это множественная проверка одной гипотезы: даётся много шансов случайно пересечь порог',
            'It is a multiple test of one hypothesis: many chances are given to cross the threshold by chance',
          ),
        },
        {
          id: 'c',
          text: l('Потому что растёт дисперсия по мере накопления данных', 'Because the variance grows as data accumulates'),
        },
        {
          id: 'd',
          text: l('Потому что трафик неоднороден по дням недели', 'Because traffic is heterogeneous across weekdays'),
        },
      ],
      correct: ['b'],
      explanation: l(
        'Каждый промежуточный расчёт сам по себе корректен: при фиксированном n он даёт ровно 5% ложных срабатываний. Проблема в правиле остановки — мы оставляем за собой право остановиться в любой из моментов, то есть даём себе много независимых шансов пересечь порог. Дисперсия оценки, наоборот, падает с ростом данных, а сезонность по дням недели — отдельная проблема, не связанная с подглядыванием.',
        'Each interim computation is correct in itself: at a fixed n it delivers exactly 5% false positives. The problem is the stopping rule — we reserve the right to stop at any of those moments, giving ourselves many chances to cross the threshold. The variance of the estimate in fact falls as data accumulates, and weekday seasonality is a separate problem unrelated to peeking.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.peeking.q-allowed',
      mode: 'multi',
      prompt: l(
        'Что из перечисленного не является подглядыванием и допустимо во время эксперимента?',
        'Which of the following is not peeking and is permissible during an experiment?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Смотреть на guardrail-метрики и выключить эксперимент при падении выручки или росте ошибок',
            'Watching guardrail metrics and shutting the experiment down on a revenue drop or an error spike',
          ),
        },
        {
          id: 'b',
          text: l(
            'Проверять SRM и корректность сплита каждый день',
            'Checking SRM and the correctness of the split every day',
          ),
        },
        {
          id: 'c',
          text: l(
            'Остановить эксперимент раньше срока, потому что основная метрика стала значимой',
            'Stopping the experiment early because the primary metric became significant',
          ),
        },
        {
          id: 'd',
          text: l(
            'Смотреть на основную метрику, но решение принимать строго в заранее назначенный день',
            'Looking at the primary metric while making the decision strictly on the pre-appointed day',
          ),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Подглядывание — это не взгляд, а решение, принятое по результату взгляда. Смотреть можно на что угодно; нельзя менять правило остановки под увиденное. Guardrail-мониторинг и проверка SRM — это контроль корректности, а не проверка гипотезы, и останавливаться по ним не только можно, но и нужно. Вариант d формально безопасен, но на практике опасен иначе: увидев результат, команда начинает обсуждать его раньше времени, поэтому во многих компаниях основную метрику до конца эксперимента просто прячут.',
        'Peeking is not the look but the decision made from it. You may look at anything; what you may not do is change the stopping rule to fit what you saw. Guardrail monitoring and the SRM check are correctness controls rather than hypothesis tests, and stopping on them is not only allowed but required. Option d is formally safe but risky in another way: once the team sees the result it starts discussing it early, which is why many companies simply hide the primary metric until the experiment ends.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.peeking.q-fpr',
      mode: 'single',
      prompt: l(
        'Эксперимент рассчитан на две недели, но команда смотрит на основную метрику каждый день и готова остановиться на первом значимом результате. Какой примерно окажется фактическая доля ложных срабатываний?',
        'An experiment is planned for two weeks, but the team checks the primary metric daily and is ready to stop at the first significant result. Roughly what will the actual false positive rate be?',
      ),
      choices: [
        { id: 'a', text: l('Те же 5%', 'The same 5%') },
        { id: 'b', text: l('Около 8%', 'About 8%') },
        { id: 'c', text: l('Примерно 20%, то есть в четыре раза больше обещанного', 'Around 20%, i.e. four times the promise') },
        { id: 'd', text: l('Около 70%', 'About 70%') },
      ],
      correct: ['c'],
      explanation: l(
        'Симулятор выше даёт порядок величины: при 14 проверках доля ложных срабатываний поднимается примерно до 20%. Точное число зависит от того, как часто смотрят и насколько коррелированы соседние проверки — накопительные выборки сильно перекрываются, поэтому рост медленнее, чем наивные 1-(1-0.05)^14 ≈ 51%. Но порядок именно такой: каждый пятый «победивший» эксперимент окажется пустым.',
        'The simulator above gives the order of magnitude: at 14 checks the false positive rate climbs to roughly 20%. The exact number depends on how often you look and how correlated adjacent checks are — cumulative samples overlap heavily, so the growth is slower than the naive 1-(1-0.05)^14 ≈ 51%. But the order is right: one in five "winning" experiments will be empty.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Глава про правила остановки.', 'The chapter on stopping rules.'),
    },
    {
      title: 'Wikipedia: Sequential analysis',
      url: 'https://en.wikipedia.org/wiki/Sequential_analysis',
    },
  ],
};
