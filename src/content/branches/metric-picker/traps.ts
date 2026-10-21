import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const metricTraps: SkillNode = {
  id: 'metric.traps',
  branch: 'metric-picker',
  tier: 2,
  title: l('Метрики-ловушки', 'Metrics that trap you'),
  blurb: l(
    'Прокси, которые растут без пользы, и метрики, которые видно только через месяц.',
    'Proxies that rise without benefit, and metrics you only see a month later.',
  ),
  requires: ['metric.basics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Почти любая продуктовая метрика — прокси. Нас интересует, стало ли пользователю лучше, а меряем мы клики, заказы и возвраты. Прокси оправдан, пока связь между ним и настоящей целью держится. Вся опасность в том, что оптимизация прокси эту связь и разрушает: находятся способы поднять измеряемое, не трогая настоящее.',
        'Almost every product metric is a proxy. What we care about is whether the user is better off, and what we measure is clicks, orders and returns. A proxy is justified while the link between it and the real goal holds. The danger is that optimising the proxy is what destroys that link: ways are found to lift the measured thing without touching the real one.',
      ),
    },
    {
      type: 'table',
      head: [l('Метрика', 'Metric'), l('Как её поднимают без пользы', 'How it is lifted without benefit')],
      rows: [
        [
          l('CTR выдачи', 'Result page CTR'),
          l(
            'Кликбейтные заголовки, провокационные картинки, сокращение числа результатов',
            'Clickbait titles, provocative images, shrinking the number of results',
          ),
        ],
        [
          l('Время на сайте', 'Time on site'),
          l(
            'Усложнить навигацию: пользователь ищет дольше, метрика растёт',
            'Make navigation harder: the user searches longer and the metric grows',
          ),
        ],
        [
          l('Число открытий пуша', 'Push opens'),
          l(
            'Слать чаще и тревожнее. Отписки появятся позже и в другом отчёте',
            'Send more often and more alarmingly. Unsubscribes show up later and in a different report',
          ),
        ],
        [
          l('Средний чек', 'Average order value'),
          l('Отсечь дешёвые заказы: знаменатель упал, отношение выросло', 'Cut off cheap orders: the denominator fell, the ratio rose'),
        ],
        [
          l('Конверсия в клик по рекламе', 'Ad click conversion'),
          l(
            'Поставить рекламу туда, где пользователь ожидал органику',
            'Put ads where the user expected organic results',
          ),
        ],
      ],
    },
    { type: 'h', text: l('Опережающие и запаздывающие метрики', 'Leading and lagging metrics') },
    {
      type: 'p',
      text: l(
        'Удержание, отток и доля вернувшихся через месяц — честные метрики, но по ним нельзя управлять: ответ приходит слишком поздно. Поэтому в эксперименте берут опережающую метрику, про которую известно, что она коррелирует с запаздывающей, а саму запаздывающую выносят в долгосрочный мониторинг или в holdout-группу, которая не видит изменений месяцами.',
        'Retention, churn and the share returning after a month are honest metrics, but you cannot steer by them: the answer arrives too late. So the experiment uses a leading metric known to correlate with the lagging one, while the lagging one goes into long-term monitoring or into a holdout group that sees no changes for months.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Связь опережающей и запаздывающей метрики надо проверять, а не предполагать. Самый частый провал продуктовой аналитики выглядит так: год оптимизировали клики, клики выросли, удержание не изменилось, и только holdout-группа показала, что весь год продукт стоял на месте.',
        'The link between a leading and a lagging metric has to be verified rather than assumed. The most common failure in product analytics looks like this: a year of optimising clicks, clicks up, retention flat, and only the holdout group reveals that the product stood still all year.',
      ),
    },
    {
      type: 'sim',
      sim: 'offline-online',
      title: l('Прокси и цель', 'The proxy and the goal'),
      caption: l(
        'Тот же симулятор, что и в ветке метрик поиска, но прочитанный иначе: по горизонтали прокси-метрика, по вертикали то, что нас на самом деле интересует. Корреляция 0.6 — оптимистичная оценка для большинства продуктовых прокси. Красные точки — изменения, которые прокси одобрил, а цель от них пострадала.',
        'The same simulator as in the search metrics branch, read differently: the proxy metric on the horizontal axis, what we actually care about on the vertical one. A correlation of 0.6 is an optimistic estimate for most product proxies. The red dots are changes the proxy approved while the goal suffered.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'metric-pick',
      id: 'metric.traps.pick-push',
      area: l('Пуш-уведомления о снижении цены', 'Push notifications about price drops'),
      scenario: l(
        'Команда роста запускает пуши: «товар из вашей корзины подешевел». Модель решает, кому и когда слать. Пуш — вмешательство в жизнь пользователя, и его легко переиспользовать. Эксперимент на две недели, трафика достаточно. Выбери метрики.',
        'A growth team is launching pushes: "an item in your cart got cheaper". A model decides who gets one and when. A push is an intrusion into the user\'s life and is easy to overuse. The experiment runs two weeks with ample traffic. Choose the metrics.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'pr-auc',
          label: l('PR-AUC модели отклика на пуш', 'PR-AUC of the push response model'),
          correctFor: ['offline'],
          note: l(
            'Отклик на пуш — редкое событие, классы сильно несбалансированы. PR-AUC в таких задачах информативнее ROC-AUC, который на редком положительном классе выглядит обманчиво хорошо.',
            'A push response is a rare event and the classes are heavily imbalanced. PR-AUC is more informative in such tasks than ROC-AUC, which looks deceptively good on a rare positive class.',
          ),
        },
        {
          id: 'orders-per-user',
          label: l('Заказы на пользователя за две недели', 'Orders per user over two weeks'),
          correctFor: ['online'],
          note: l(
            'Пуш оправдан, только если приводит к покупкам, которых иначе не было бы. Метрика на уровне пользователя, совпадает с единицей рандомизации и не поднимается от самого факта отправки.',
            'A push is justified only if it leads to purchases that would not have happened otherwise. A user-level metric that matches the randomisation unit and does not rise from the mere act of sending.',
          ),
        },
        {
          id: 'unsubscribe',
          label: l('Доля отписавшихся от уведомлений', 'Share of users turning notifications off'),
          correctFor: ['guardrail'],
          note: l(
            'Главная цена пушей и почти необратимая: отписавшийся пользователь потерян для всего канала навсегда, а не только для этой кампании. Обязательный guardrail.',
            'The main cost of pushes and a nearly irreversible one: an unsubscribed user is lost to the entire channel forever, not just this campaign. A mandatory guardrail.',
          ),
        },
        {
          id: 'app-uninstall',
          label: l('Доля удалений приложения', 'Share of app uninstalls'),
          correctFor: ['guardrail'],
          note: l(
            'Крайняя форма того же вреда. Событие редкое, поэтому метрика малочувствительна, но цена ошибки настолько высока, что её держат в отчёте даже с широким интервалом.',
            'The extreme form of the same harm. The event is rare so the metric is insensitive, but the cost of missing it is high enough that it stays in the report even with a wide interval.',
          ),
        },
        {
          id: 'push-open-rate',
          label: l('Доля открытых пушей', 'Push open rate'),
          correctFor: [],
          note: l(
            'Классическая метрика-ловушка. Поднимается тревожными формулировками и временем отправки, не связана с покупками и совершенно не видит раздражения. Как метрика решения — прямой путь к выжиганию канала.',
            'The classic trap metric. Lifted by alarming wording and send timing, unrelated to purchases and completely blind to irritation. As a decision metric it is a direct route to burning the channel down.',
          ),
        },
        {
          id: 'pushes-sent',
          label: l('Число отправленных пушей', 'Number of pushes sent'),
          correctFor: [],
          note: l(
            'Метрика объёма работы, а не результата. Растёт ровно настолько, насколько команда решила слать больше.',
            'A measure of work done rather than outcome. It grows exactly as much as the team decided to send more.',
          ),
        },
        {
          id: 'revenue-attributed',
          label: l('Выручка, атрибутированная пушу', 'Revenue attributed to the push'),
          correctFor: [],
          note: l(
            'Атрибуция приписывает пушу покупки, которые часто случились бы и без него: человек и так собирался купить товар из корзины. Правильный ответ даёт сравнение групп, а не атрибуция внутри одной.',
            'Attribution credits the push with purchases that would often have happened anyway: the person was going to buy that cart item regardless. The honest answer comes from comparing groups, not from attributing inside one.',
          ),
        },
      ],
      writeup: l(
        'Сценарий построен вокруг двух ловушек. Первая — open rate: метрика, которую канал коммуникаций почти всегда и оптимизирует, и которая почти не связана с пользой. Её можно поднять формулировкой «последний шанс» и отправкой в девять вечера, и ни то ни другое не прибавит ни одной покупки. Вторая — атрибутированная выручка: она измеряет не эффект, а совпадение, и растёт просто от увеличения числа отправок. Эффект пуша виден только в сравнении с группой, которой не слали, — то есть в заказах на пользователя. Guardrails здесь особенно важны, потому что вред пушей отложенный и необратимый: отписка и удаление приложения случаются позже, чем заканчивается эксперимент, и почти всегда навсегда. Из-за этого для пушей часто делают исключение из обычного правила про alpha: порог по guardrail-метрикам смягчают, принимая больше ложных тревог, лишь бы не пропустить настоящий вред.',
        'This scenario is built around two traps. The first is open rate: the metric a communications channel almost always optimises and which is almost unrelated to usefulness. It can be lifted with "last chance" wording and a 9 pm send time, and neither adds a single purchase. The second is attributed revenue: it measures coincidence rather than effect and grows simply by sending more. The effect of a push is visible only against a group that got none — that is, in orders per user. Guardrails matter especially here, because the harm from pushes is delayed and irreversible: unsubscribes and uninstalls happen after the experiment ends, and almost always for good. For this reason pushes often get an exception from the usual alpha rule: guardrail thresholds are loosened, accepting more false alarms rather than missing real harm.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'metric.traps.pick-latency',
      area: l('Ускорение выдачи поиска', 'Speeding up search results'),
      scenario: l(
        'Инфраструктурная команда ускорила поиск: p95 времени ответа упал с 400 до 250 миллисекунд. Релевантность не менялась ни на строчку. Нужно доказать, что изменение стоит раскатывать, и выбрать, по чему это мерить.',
        'An infrastructure team sped search up: p95 latency fell from 400 to 250 milliseconds. Relevance did not change by a single line. You need to show the change is worth shipping and choose what to measure it by.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'p95',
          label: l('p95 времени ответа на синтетической нагрузке', 'p95 latency under synthetic load'),
          correctFor: ['offline'],
          note: l(
            'Проверяется до выкатки на нагрузочном стенде, воспроизводимо и дёшево. Это и есть оффлайн-проверка для инфраструктурного изменения.',
            'Verified before shipping on a load test rig, reproducibly and cheaply. That is the offline check for an infrastructure change.',
          ),
        },
        {
          id: 'sessions-per-user',
          label: l('Сессии на пользователя', 'Sessions per user'),
          correctFor: ['online'],
          note: l(
            'Эффект скорости проявляется именно в возвращаемости: быстрым сервисом пользуются чаще. Метрика на уровне пользователя, совпадает с единицей рандомизации и ловит накопленный эффект за срок эксперимента.',
            'The effect of speed shows up in return behaviour: a fast service gets used more often. A user-level metric matching the randomisation unit, capturing the accumulated effect over the experiment window.',
          ),
        },
        {
          id: 'error-rate',
          label: l('Доля ошибок и таймаутов поиска', 'Share of search errors and timeouts'),
          correctFor: ['guardrail'],
          note: l(
            'Ускорение часто достигается урезанием: меньше кандидатов, агрессивнее таймауты. Если скорость куплена ростом ошибок, это не улучшение.',
            'Speed is often bought by cutting corners: fewer candidates, more aggressive timeouts. If it was paid for with more errors, it is not an improvement.',
          ),
        },
        {
          id: 'search-quality',
          label: l('Доля запросов без клика', 'Share of queries with no click'),
          correctFor: ['guardrail'],
          note: l(
            'Второй способ ускориться — ухудшить выдачу незаметно для инфраструктурных метрик: меньше кандидатов, проще модель. Метрика качества обязана быть в guardrails даже у чисто технического изменения.',
            'The second way to speed things up is to quietly degrade the results in a way infrastructure metrics never see: fewer candidates, a simpler model. A quality metric must sit in the guardrails even for a purely technical change.',
          ),
        },
        {
          id: 'cpu',
          label: l('Загрузка CPU на поисковых машинах', 'CPU load on the search fleet'),
          correctFor: [],
          note: l(
            'Техническая характеристика, а не метрика продукта: она может как вырасти, так и упасть при одинаковой пользе для пользователя. Полезна для планирования мощностей, но решения по ней не принимают.',
            'A technical characteristic rather than a product metric: it can go either way at identical user benefit. Useful for capacity planning, but decisions are not made on it.',
          ),
        },
        {
          id: 'time-on-site',
          label: l('Среднее время на сайте', 'Average time on site'),
          correctFor: [],
          note: l(
            'Здесь она не просто без направления, а направлена неправильно: ускорение поиска должно уменьшать время на поиск. Падение этой метрики — признак успеха, а не провала.',
            'Here it is not merely directionless but pointed the wrong way: speeding up search should reduce the time spent searching. A fall in this metric signals success, not failure.',
          ),
        },
        {
          id: 'ctr',
          label: l('CTR выдачи', 'Result page CTR'),
          correctFor: [],
          note: l(
            'Релевантность не менялась, поэтому ждать роста CTR неоткуда. Если он всё же вырос, это повод искать баг в эксперименте, а не праздновать.',
            'Relevance did not change, so there is no reason to expect CTR to rise. If it did, that is grounds to look for a bug in the experiment rather than to celebrate.',
          ),
        },
      ],
      writeup: l(
        'Сценарий тренирует две вещи. Первая: у инфраструктурного изменения тоже должна быть продуктовая метрика решения, иначе нечем обосновать затраты. Скорость влияет на поведение через возвращаемость, и правильная метрика — сессии или визиты на пользователя, а не технические характеристики. Вторая: у технического изменения тоже должны быть guardrails на качество. Ускорение почти всегда достигается чем-то вроде «берём меньше кандидатов» или «ужесточаем таймаут», и ровно это может незаметно уронить релевантность — инфраструктурные метрики такого не видят по построению. Отдельно стоит заметить ловушку со временем на сайте: это редкий случай, когда метрика не просто плоха, а направлена против цели изменения. Ожидаемый эффект ускорения — уменьшение времени, потраченного на поиск, при росте числа визитов.',
        'This scenario drills two things. First, an infrastructure change needs a product decision metric too, otherwise there is nothing to justify the cost with. Speed influences behaviour through return visits, and the right metric is sessions or visits per user rather than technical characteristics. Second, a technical change needs quality guardrails too. Speed is almost always bought with something like "take fewer candidates" or "tighten the timeout", and that is exactly what can quietly drop relevance — infrastructure metrics cannot see it by construction. The time-on-site trap is worth noting separately: it is the rare case where a metric is not merely poor but points against the goal of the change. The expected effect of a speed-up is less time spent searching alongside more visits.',
      ),
    },
    {
      kind: 'quiz',
      id: 'metric.traps.q-leading',
      mode: 'single',
      prompt: l(
        'Настоящая цель команды — удержание пользователей через три месяца. Эксперимент идёт две недели. Что делать?',
        'The team\'s real goal is user retention after three months. The experiment runs for two weeks. What should be done?',
      ),
      choices: [
        { id: 'a', text: l('Мерить удержание за две недели — это то же самое', 'Measure two-week retention, it is the same thing') },
        {
          id: 'b',
          text: l(
            'Взять опережающую метрику с проверенной связью с удержанием, а само удержание держать в долгосрочном holdout',
            'Take a leading metric with a verified link to retention and keep retention itself in a long-term holdout',
          ),
        },
        { id: 'c', text: l('Продлить эксперимент на три месяца', 'Extend the experiment to three months') },
        { id: 'd', text: l('Отказаться от эксперимента', 'Abandon the experiment') },
      ],
      correct: ['b'],
      explanation: l(
        'Двухнедельное удержание — не то же самое, что трёхмесячное, и связь между ними надо проверять, а не предполагать. Трёхмесячный эксперимент теоретически возможен, но практически означает, что команда делает четыре эксперимента в год и блокирует релизы; к тому же за три месяца накопится столько посторонних изменений, что сравнение потеряет смысл. Рабочая схема такая: в эксперименте опережающая метрика, параллельно постоянный holdout — группа, которой месяцами не раскатывают изменения, и по ней раз в квартал проверяют, что накопленный эффект всех релизов действительно положительный. Это дорого по трафику, поэтому holdout обычно маленький, но он единственный способ поймать расхождение между прокси и целью.',
        'Two-week retention is not the same as three-month retention, and the link between them must be verified rather than assumed. A three-month experiment is theoretically possible but practically means four experiments a year and blocked releases; besides, three months accumulate so many unrelated changes that the comparison loses meaning. The working scheme is this: a leading metric inside the experiment, plus a permanent holdout alongside — a group that receives no changes for months, checked quarterly to confirm the accumulated effect of all releases is genuinely positive. It costs traffic, so the holdout is usually small, but it is the only way to catch a divergence between the proxy and the goal.',
      ),
    },
  ],

  sources: [
    {
      title: "Goodhart's law",
      url: 'https://en.wikipedia.org/wiki/Goodhart%27s_law',
    },
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про OEC, guardrails и долгосрочные эффекты.', 'The chapters on the OEC, guardrails and long-term effects.'),
    },
  ],
};
