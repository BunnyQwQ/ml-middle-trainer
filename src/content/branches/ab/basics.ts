import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abBasics: SkillNode = {
  id: 'ab.basics',
  branch: 'ab',
  act: 2,
  tier: 1,
  title: l('Единица рандомизации и единица анализа', 'Unit of randomisation and unit of analysis'),
  blurb: l(
    'Самая частая причина, по которой значимый результат не воспроизводится.',
    'The most common reason a significant result fails to reproduce.',
  ),
  requires: ['boss.first-report'],
  theory: [
    {
      type: 'p',
      text: l(
        'A/B-тест — единственный инструмент, который даёт причинность, а не корреляцию. Работает он за счёт одной вещи: случайного распределения по группам. Случайность гарантирует, что группы отличаются только воздействием, а всё остальное — активность, платформа, география, время суток — распределено одинаково в среднем. Всё, что ломает случайность или независимость, ломает и вывод.',
        'An A/B test is the only tool that gives causality rather than correlation, and it works because of exactly one thing: random assignment to groups. Randomness guarantees that the groups differ only in the treatment, while everything else — activity, platform, geography, time of day — is distributed the same way on average. Anything that breaks the randomness or the independence breaks the conclusion too.',
      ),
    },
    {
      type: 'h',
      text: l('Два разных вопроса, которые постоянно путают', 'Two different questions that get mixed up constantly'),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'Единица рандомизации: что именно мы бросаем в группу A или B. Пользователь, устройство, сессия, запрос, город.',
          'Unit of randomisation: what exactly gets tossed into group A or B. A user, a device, a session, a query, a city.',
        ),
        l(
          'Единица анализа: что мы считаем одним наблюдением при расчёте значимости. Пользователь, запрос, показ.',
          'Unit of analysis: what counts as one observation when significance is computed. A user, a query, an impression.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Правило: единица анализа должна быть не мельче единицы рандомизации. Рандомизируем по пользователю — считаем по пользователю. Если считать по показам, формула дисперсии предполагает независимость, которой нет, и p-value получается искусственно маленьким.',
        'The rule: the unit of analysis must not be finer than the unit of randomisation. Randomise by user, analyse by user. Analyse by impression instead and the variance formula assumes an independence that is not there, so the p-value comes out artificially small.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Насколько искусственно — считается. Если на одного пользователя приходится m наблюдений, а внутриклассовая корреляция равна rho, то истинная дисперсия средней больше наивной в 1 + (m-1)·rho раз. Эта величина называется design effect. При m = 10 и rho = 0.1 дисперсия выше в 1.9 раза, стандартная ошибка — в 1.38 раза, и то, что выглядит как p = 0.01, на самом деле ближе к p = 0.08.',
        'By how much is computable. With m observations per user and an intra-class correlation of rho, the true variance of the mean is 1 + (m-1)·rho times the naive one. That quantity is called the design effect. At m = 10 and rho = 0.1 the variance is 1.9 times larger and the standard error 1.38 times larger, so what looks like p = 0.01 is really closer to p = 0.08.',
      ),
    },
    { type: 'formula', tex: '\\text{design effect} = 1 + (m-1)\\rho, \\qquad SE_{\\text{true}} = SE_{\\text{naive}}\\sqrt{1 + (m-1)\\rho}' },
    {
      type: 'sim',
      sim: 'randomization-unit',
      title: l('Что происходит с p-value при неверной единице анализа', 'What happens to p-values with the wrong unit of analysis'),
      caption: l(
        'Прогоняется 250 честных A/A-экспериментов: разницы между группами нет вообще. Красная гистограмма — анализ по событиям, зелёная — по пользователям. Зелёная равномерна, как и должна быть при верной нулевой гипотезе; красная завалена к нулю, и доля ложных срабатываний вместо 5% достигает десятков процентов. Поставь события на пользователя = 1 — и красная станет зелёной.',
        'This runs 250 honest A/A experiments: there is no difference between the groups at all. The red histogram is the per-event analysis, the green one is per-user. Green is uniform, as it must be under a true null; red piles up near zero and the false positive rate reaches tens of percent instead of 5%. Set events per user to 1 and red becomes green.',
      ),
    },
    {
      type: 'h',
      text: l('Как выбирать единицу рандомизации', 'How to choose the unit of randomisation'),
    },
    {
      type: 'table',
      head: [l('Единица', 'Unit'), l('Когда уместна', 'When it fits'), l('Чем плоха', 'What it costs')],
      rows: [
        [
          l('Пользователь', 'User'),
          l(
            'Почти всегда для изменений в ранжировании и интерфейсе: опыт консистентен, эффекты обучения и привыкания видны',
            'Almost always for ranking and interface changes: the experience stays consistent and learning or habituation effects are visible',
          ),
          l('Дороже по трафику, чем запрос', 'Needs more traffic than per-query'),
        ],
        [
          l('Запрос или сессия', 'Query or session'),
          l(
            'Когда эффект локален и не переносится между запросами, например изменение парсера одного типа запросов',
            'When the effect is local and does not carry over between queries, e.g. a change to the parser for one query type',
          ),
          l(
            'Один пользователь видит обе версии, эффекты обучения смазываются, пользовательские метрики посчитать нельзя',
            'One user sees both versions, learning effects wash out, and user-level metrics cannot be computed',
          ),
        ],
        [
          l('Город или регион', 'City or region'),
          l(
            'Когда есть сетевые эффекты или общий рынок: логистика, цены, маркетплейс с ограниченным предложением',
            'When there are network effects or a shared market: logistics, pricing, a marketplace with limited supply',
          ),
          l(
            'Единиц мало, дисперсия огромна, нужна стратификация и switchback',
            'Few units, huge variance, needs stratification and switchback designs',
          ),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Отдельная ловушка: рандомизация должна быть устойчивой (sticky). Если бакет пересчитывается от сессии к сессии, пользователь будет видеть обе версии поочерёдно, эффект размоется, а дисперсия вырастет. Проверяется это так: взять случайных пользователей из лога и убедиться, что бакет у них один и тот же за весь эксперимент.',
        'A separate trap: assignment must be sticky. If the bucket is recomputed per session, a user alternates between versions, the effect washes out and the variance grows. The check is simple: take random users from the log and confirm their bucket is the same throughout the experiment.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.basics.q-unit-choice',
      mode: 'single',
      prompt: l(
        'Меняем формулу ранжирования в товарном поиске. Что брать единицей рандомизации?',
        'We are changing the ranking formula in product search. What should the unit of randomisation be?',
      ),
      choices: [
        { id: 'a', text: l('Запрос: так получится больше наблюдений', 'The query: that yields more observations') },
        {
          id: 'b',
          text: l(
            'Пользователь: ранжирование влияет на весь опыт, есть эффекты обучения и возвращаемости',
            'The user: ranking affects the whole experience, with learning and retention effects',
          ),
        },
        { id: 'c', text: l('Показ: самая мелкая единица, максимум мощности', 'The impression: the finest unit, maximum power') },
        { id: 'd', text: l('Без разницы, если трафика хватает', 'It does not matter when there is enough traffic') },
      ],
      correct: ['b'],
      explanation: l(
        'Изменение ранжирования меняет поведение пользователя в целом: он возвращается чаще или реже, формулирует запросы иначе, учится доверять выдаче. Рандомизация по запросу всё это стирает, а главное — делает невозможными пользовательские метрики вроде доли вернувшихся. Больше наблюдений при рандомизации по показу — ловушка: наблюдения зависимы, реальная мощность не растёт, а ошибка I рода растёт.',
        'A ranking change shifts user behaviour as a whole: they come back more or less often, phrase queries differently, learn to trust the results. Randomising by query erases all of that and, worse, makes user-level metrics such as return rate impossible. The extra observations from impression-level randomisation are a trap: the observations are dependent, so real power does not grow while the type I error does.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.basics.q-valid-analysis',
      mode: 'multi',
      prompt: l(
        'Рандомизация по пользователю. Какие способы посчитать результат корректны?',
        'Randomisation is by user. Which ways of computing the result are correct?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Среднее по пользователям от «доля кликов на показ» + t-тест', 'Per-user mean of "clicks per impression" plus a t-test'),
        },
        {
          id: 'b',
          text: l(
            'Суммарные клики / суммарные показы + z-тест для двух пропорций',
            'Total clicks over total impressions plus a two-proportion z-test',
          ),
        },
        {
          id: 'c',
          text: l(
            'Суммарные клики / суммарные показы, но дисперсия через бутстрап по пользователям',
            'Total clicks over total impressions, with the variance from a bootstrap over users',
          ),
        },
        {
          id: 'd',
          text: l(
            'Суммарные клики / суммарные показы, дисперсия через дельта-метод с кластеризацией по пользователю',
            'Total clicks over total impressions, with the variance from the delta method clustered by user',
          ),
        },
      ],
      correct: ['a', 'c', 'd'],
      explanation: l(
        'Вариант b — ровно та ошибка, которую показывает симулятор выше: формула для двух пропорций считает каждый показ независимым наблюдением. Варианты c и d считают ту же ratio-метрику, но с правильной дисперсией — именно так CTR и считают в продовых платформах экспериментов. Вариант a корректен, но отвечает на другой вопрос: это средний по пользователям CTR, где активный и редкий пользователь весят одинаково. Выбор между a и c/d — продуктовый, а не технический.',
        'Option b is exactly the mistake the simulator above demonstrates: the two-proportion formula treats every impression as an independent observation. Options c and d compute the same ratio metric with the right variance — that is how CTR is actually computed in production experiment platforms. Option a is valid but answers a different question: it is the per-user average CTR, where a heavy user and an occasional one carry equal weight. Choosing between a and c/d is a product decision, not a technical one.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.basics.q-design-effect',
      mode: 'number',
      prompt: l(
        'На одного пользователя приходится m = 10 показов, внутриклассовая корреляция rho = 0.1. Во сколько раз истинная стандартная ошибка больше наивной, посчитанной по показам? Ответ с двумя знаками после запятой.',
        'There are m = 10 impressions per user and the intra-class correlation is rho = 0.1. How many times larger is the true standard error than the naive one computed over impressions? Answer to two decimal places.',
      ),
      value: 1.38,
      tolerance: 0.03,
      explanation: l(
        'Design effect = 1 + (m-1)·rho = 1 + 9·0.1 = 1.9 — это множитель для дисперсии. Стандартная ошибка растёт как корень: sqrt(1.9) ≈ 1.38. Практический вывод: доверительный интервал на 38% шире, чем показывает наивный расчёт, а нужный трафик — почти в два раза больше.',
        'Design effect = 1 + (m-1)·rho = 1 + 9·0.1 = 1.9, which is the multiplier for the variance. The standard error grows as its square root: sqrt(1.9) ≈ 1.38. The practical consequence: the confidence interval is 38% wider than the naive calculation shows, and the traffic needed is nearly double.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Книга-стандарт по A/B в индустрии.', 'The industry standard book on A/B testing.'),
    },
    {
      title: "Ron Kohavi's paper archive (exp-platform)",
      url: 'https://exp-platform.com/',
      note: l('Открытые статьи про практику экспериментов.', 'Open papers on experimentation practice.'),
    },
  ],
};
