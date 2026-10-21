import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchOfflineOnline: SkillNode = {
  id: 'search.offline-online',
  branch: 'search-metrics',
  tier: 5,
  title: l('Оффлайн против онлайна', 'Offline versus online'),
  blurb: l(
    'Почему nDCG вырос, а в эксперименте ничего не произошло.',
    'Why nDCG went up while the experiment showed nothing.',
  ),
  requires: ['search.ndcg'],
  theory: [
    {
      type: 'p',
      text: l(
        'Оффлайн-метрика и онлайн-эффект связаны слабее, чем хочется. Причин три, и они разного рода. Первая: разметка отвечает на вопрос «релевантно ли», а бизнес — на вопрос «купил ли, вернулся ли». Вторая: асессор не пользователь, у него нет задачи и контекста. Третья, самая техническая: клики, по которым обычно и приближают оффлайн-метрики на больших объёмах, смещены позицией.',
        'An offline metric and an online effect are linked more weakly than one would like. There are three reasons, of different kinds. First, labels answer "is this relevant" while the business asks "did they buy, did they come back". Second, a rater is not a user: no task, no context. Third, the most technical one: clicks, which is what offline metrics are usually approximated with at scale, are biased by position.',
      ),
    },
    { type: 'h', text: l('Позиционное смещение', 'Position bias') },
    {
      type: 'p',
      text: l(
        'Пользователь кликает документ, если он его увидел и документ ему подошёл. Вероятность увидеть резко падает с позицией. Отсюда простая модель: P(клик) = P(просмотр | позиция) · P(релевантен). Наблюдаемый CTR смешивает два разных сомножителя, и сравнивать документы по нему напрямую нельзя: документ на первой позиции получит больше кликов, даже если он хуже того, что стоит третьим.',
        'A user clicks a document if they saw it and it suited them. The chance of seeing falls steeply with position. Hence a simple model: P(click) = P(examined | position) · P(relevant). The observed CTR mixes two different factors, and documents cannot be compared by it directly: a document at position one collects more clicks even when it is worse than the one at position three.',
      ),
    },
    { type: 'formula', tex: 'P(\\text{click} \\mid d, i) = P(\\text{examine} \\mid i)\\cdot P(\\text{relevant} \\mid d)' },
    {
      type: 'sim',
      sim: 'position-bias',
      title: l('Что видно в логах и что есть на самом деле', 'What the logs show and what is actually there'),
      caption: l(
        'Зелёные столбики — истинная релевантность документов, красные — наблюдаемый CTR. Третий документ релевантнее первого, но кликов у него меньше. Выкрути затухание внимания в ноль — и порядки совпадут: смещение исчезает ровно тогда, когда все позиции просматриваются одинаково. Это же объясняет обратную связь: модель, обученная на сырых кликах, закрепляет текущий порядок и перестаёт учиться.',
        'The green bars are the true relevance of the documents, the red ones the observed CTR. The third document is more relevant than the first yet gets fewer clicks. Turn the attention decay to zero and the two orders coincide: the bias vanishes exactly when every position is examined equally. The same picture explains the feedback loop: a model trained on raw clicks cements the current order and stops learning.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'Поправка на позицию: делим наблюдаемый CTR на оценку вероятности просмотра. Вероятности оценивают по экспериментам со случайной перестановкой выдачи или по модели EM.',
          'A position correction: divide the observed CTR by an estimate of the examination probability. Those probabilities are estimated from experiments with randomly permuted results or with an EM model.',
        ),
        l(
          'Inverse propensity scoring: то же самое, но как общая схема переоценки политики по логам, собранным другой политикой. Цена — рост дисперсии, особенно для редких позиций.',
          'Inverse propensity scoring: the same idea as a general scheme for re-evaluating a policy from logs collected by another one. The price is inflated variance, especially for rare positions.',
        ),
        l(
          'Небольшая рандомизация выдачи на части трафика: даёт несмещённые данные для обучения ценой лёгкого ухудшения опыта.',
          'A small randomisation of results on part of the traffic: it yields unbiased training data at the cost of a slightly worse experience.',
        ),
        l(
          'Интерливинг: сравнение двух ранжирований внутри одного запроса, где позиционное смещение действует на обе системы одинаково. Следующий узел.',
          'Interleaving: comparing two rankings inside one query, where position bias acts on both systems equally. The next node.',
        ),
      ],
    },
    { type: 'h', text: l('Зачем тогда оффлайн-метрики', 'Why have offline metrics at all') },
    {
      type: 'sim',
      sim: 'offline-online',
      title: l('Насколько оффлайн предсказывает онлайн', 'How well offline predicts online'),
      caption: l(
        'Каждая точка — изменение, прошедшее оффлайн-оценку. По горизонтали рост оффлайн-метрики, по вертикали настоящий онлайн-эффект. Красные точки — то, что прошло порог и при этом вредит. Даже при корреляции 0.6 таких заметная доля, и это нормально: задача оффлайн-метрики не угадать эффект, а дёшево отсеять заведомо плохое до дорогого эксперимента.',
        'Each dot is a change that went through offline evaluation. The horizontal axis is the rise in the offline metric, the vertical one the real online effect. The red dots passed the threshold and do harm anyway. Even at a correlation of 0.6 there is a noticeable share of them, and that is fine: the job of an offline metric is not to predict the effect but to cheaply filter out the obviously bad before an expensive experiment.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Правильная роль метрик: оффлайн — для итераций и отсева, онлайн — для решений, guardrail — чтобы поймать вред, который ни одна из первых двух не ищет. Требовать от оффлайн-метрики предсказания выручки бессмысленно; требовать от неё монотонности по качеству — осмысленно и проверяемо.',
        'The right division of roles: offline for iteration and filtering, online for decisions, guardrails to catch the harm neither of the first two is looking for. Demanding that an offline metric predict revenue is pointless; demanding that it be monotone in quality is meaningful and testable.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'search.offline-online.q-position-bias',
      mode: 'single',
      prompt: l(
        'Аналитик предлагает обучать ранжирование напрямую на кликах: клик — положительный пример, показ без клика — отрицательный. Что с этим не так?',
        'An analyst proposes training the ranker straight on clicks: a click is a positive example, an impression without a click a negative one. What is wrong with that?',
      ),
      choices: [
        { id: 'a', text: l('Ничего, так и делают', 'Nothing, that is how it is done') },
        {
          id: 'b',
          text: l(
            'Клики смещены позицией: модель выучит текущий порядок выдачи, а не релевантность',
            'Clicks are biased by position: the model learns the current ranking rather than relevance',
          ),
        },
        { id: 'c', text: l('Кликов слишком мало для обучения', 'There are too few clicks to train on') },
        { id: 'd', text: l('Клики нельзя использовать в машинном обучении', 'Clicks cannot be used in machine learning') },
      ],
      correct: ['b'],
      explanation: l(
        'Документ на первой позиции собирает больше кликов просто потому, что его видят. Обучившись на таких данных, модель воспроизведёт существующий порядок и закрепит его — классическая обратная связь, из-за которой система перестаёт находить новое. Клики использовать можно и нужно, их много и они бесплатны, но с поправкой: либо делить на вероятность просмотра, либо собирать данные с рандомизацией, либо строить модель клика, где позиция и релевантность разделены явно.',
        'A document at position one collects more clicks simply because it is seen. Trained on such data a model reproduces the existing order and locks it in — the classic feedback loop that stops a system from discovering anything new. Clicks can and should be used, there are many and they are free, but with a correction: divide by the examination probability, collect data with randomisation, or build a click model that separates position from relevance explicitly.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.offline-online.q-disagreement',
      mode: 'multi',
      prompt: l(
        'nDCG вырос на 2%, онлайн-эксперимент не показал эффекта. Какие объяснения правдоподобны?',
        'nDCG went up 2% while the online experiment showed no effect. Which explanations are plausible?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Эксперимент недомощный: MDE больше ожидаемого эффекта',
            'The experiment is underpowered: the MDE exceeds the expected effect',
          ),
        },
        {
          id: 'b',
          text: l(
            'Улучшение пришлось на хвост запросов, который даёт мало трафика',
            'The improvement landed in the tail of queries, which carries little traffic',
          ),
        },
        {
          id: 'c',
          text: l(
            'Асессорская релевантность и пользовательская полезность расходятся: формально релевантный товар дороже или без доставки',
            'Rater relevance and user usefulness diverge: a formally relevant item is pricier or not deliverable',
          ),
        },
        {
          id: 'd',
          text: l(
            'Онлайн-метрика измеряет другое: nDCG про порядок, а метрика решения — про заказы',
            'The online metric measures something else: nDCG is about order while the decision metric is about orders placed',
          ),
        },
        {
          id: 'e',
          text: l('Оффлайн-метрика посчитана неправильно, иначе эффект был бы', 'The offline metric must be miscomputed, otherwise there would be an effect'),
        },
      ],
      correct: ['a', 'b', 'c', 'd'],
      explanation: l(
        'Расхождение оффлайна и онлайна — норма, а не признак ошибки. Первое, что проверяют, — мощность: часто «эффекта нет» означает «не смогли увидеть». Дальше идут содержательные причины: улучшение в низкочастотном хвосте почти не влияет на суммарную метрику; асессор оценивает соответствие запросу, а пользователь — ещё и цену, наличие, доставку, бренд. И наконец, метрики просто про разное. Практический ход: посчитать оффлайн-метрику отдельно по частотным сегментам запросов и посмотреть, где именно вырос nDCG.',
        'A divergence between offline and online is the norm rather than a sign of error. The first thing to check is power: "no effect" often means "could not see it". Then come the substantive reasons: an improvement in the low-frequency tail barely moves the aggregate metric; a rater judges the match to the query while a user also weighs price, availability, delivery and brand. And finally the metrics simply measure different things. The practical move: compute the offline metric separately by query frequency segments and see where the nDCG actually rose.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'search.offline-online.metric-ranking',
      area: l('Поиск: ранжирование выдачи', 'Search: result ranking'),
      scenario: l(
        'Команда товарного поиска меняет модель ранжирования: вместо градиентного бустинга на текстовых признаках — модель с эмбеддингами запроса и товара. Трафика много, разметка асессорами есть и обновляется. Нужно выбрать, по чему итерироваться при обучении, по чему принимать решение о раскатке и что контролировать, чтобы не сломать продукт.',
        'A product search team is changing the ranking model: instead of gradient boosting on text features, a model with query and item embeddings. Traffic is plentiful and rater labels exist and are refreshed. You need to choose what to iterate on during training, what to base the rollout decision on, and what to keep an eye on so the product does not break.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'ndcg',
          label: l('nDCG@10 по асессорской разметке', 'nDCG@10 on rater labels'),
          correctFor: ['offline'],
          note: l(
            'Ровно то, для чего nDCG придуман: градации плюс чувствительность к порядку в топе. Дёшево считается на каждой итерации обучения. Решение по ней принимать нельзя — она не про деньги.',
            'Exactly what nDCG was built for: grades plus sensitivity to order at the top. Cheap to compute on every training iteration. It cannot carry the decision, though — it is not about money.',
          ),
        },
        {
          id: 'orders-per-session',
          label: l('Конверсия сессии в заказ', 'Session-to-order conversion'),
          correctFor: ['online'],
          note: l(
            'Пользовательская метрика, знаменатель которой совпадает с единицей рандомизации, напрямую связана с бизнесом и достаточно чувствительна при большом трафике. Хороший выбор как метрика решения.',
            'A user-level metric whose denominator matches the randomisation unit, tied directly to the business and sensitive enough at large traffic. A good decision metric.',
          ),
        },
        {
          id: 'latency',
          label: l('Время ответа поиска, p99', 'Search latency, p99'),
          correctFor: ['guardrail'],
          note: l(
            'Модель с эмбеддингами тяжелее предыдущей, и деградация скорости — главный технический риск этого изменения. Классический guardrail: он не должен расти, даже если релевантность улучшилась.',
            'An embedding model is heavier than its predecessor, and a latency regression is the main technical risk of this change. A classic guardrail: it must not grow even if relevance improved.',
          ),
        },
        {
          id: 'zero-click',
          label: l('Доля запросов без единого клика', 'Share of queries with no click at all'),
          correctFor: ['guardrail'],
          note: l(
            'Ловит случай, когда средние метрики выросли за счёт частотных запросов, а на хвосте выдача развалилась. Хороший guardrail на деградацию качества там, куда основная метрика не смотрит.',
            'Catches the case where the averages rose on head queries while the tail fell apart. A good guardrail against quality decay where the primary metric does not look.',
          ),
        },
        {
          id: 'ctr-position-1',
          label: l('CTR первой позиции', 'CTR of position one'),
          correctFor: [],
          note: l(
            'Смещена позицией и легко растёт от изменения оформления, а не качества. Как метрика решения опасна: её можно поднять, поставив наверх кликабельное, а не релевантное.',
            'Biased by position and easily moved by presentation rather than quality. Dangerous as a decision metric: you can lift it by putting clickable rather than relevant items on top.',
          ),
        },
        {
          id: 'model-loss',
          label: l('Значение функции потерь на валидации', 'Validation loss of the model'),
          correctFor: [],
          note: l(
            'Техническая величина обучения, а не метрика качества поиска. Она может падать при неизменном или ухудшившемся ранжировании, и сравнивать по ней две разные архитектуры бессмысленно.',
            'A training quantity, not a search quality metric. It can fall while the ranking stays the same or gets worse, and comparing two different architectures by it is meaningless.',
          ),
        },
        {
          id: 'avg-check',
          label: l('Средний чек', 'Average order value'),
          correctFor: [],
          note: l(
            'Ratio-метрика с подвижным знаменателем: она вырастет, если просто отвалятся дешёвые заказы. Как метрика решения для ранжирования не годится.',
            'A ratio metric with a moving denominator: it rises if cheap orders simply stop happening. Not a usable decision metric for ranking.',
          ),
        },
      ],
      writeup: l(
        'Разделение ролей здесь каноническое. nDCG@10 — оффлайн: считается на разметке, доступна на каждой итерации обучения, чувствительна к порядку в топе. Конверсия сессии в заказ — онлайн: это пользовательская метрика, её знаменатель совпадает с единицей рандомизации, и она связана с деньгами. Guardrails закрывают два разных риска: технический (скорость ответа, потому что новая модель тяжелее) и качественный на хвосте (доля запросов без клика, потому что средние метрики умеют расти за счёт частотных запросов). Отдельно стоит понимать, почему отвергнуты остальные. CTR первой позиции — метрика внимания, а не качества, и растёт от кликбейта. Лосс на валидации вообще не метрика продукта: он измеряет, насколько хорошо модель приближает свою обучающую цель, а не насколько выдача полезна. Средний чек — ratio с подвижным знаменателем, и его рост совместим с падением выручки. Если бы трафика было мало, к этому набору добавился бы интерливинг как способ получить ответ на порядок быстрее.',
        'The division of roles here is canonical. nDCG@10 is the offline metric: computed on labels, available at every training iteration, sensitive to order at the top. Session-to-order conversion is the online one: a user-level metric whose denominator matches the randomisation unit and which is tied to money. The guardrails cover two different risks: a technical one (latency, because the new model is heavier) and a quality one in the tail (share of queries with no click, because averages can rise on head queries alone). It is worth understanding why the rest were rejected. CTR of position one is a metric of attention rather than quality and rises with clickbait. Validation loss is not a product metric at all: it measures how well the model approximates its training objective, not how useful the results are. Average order value is a ratio with a moving denominator, and its rise is compatible with falling revenue. With little traffic, interleaving would join this set as a way to get an answer an order of magnitude faster.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Learning to rank',
      url: 'https://en.wikipedia.org/wiki/Learning_to_rank',
    },
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про связь оффлайн- и онлайн-оценки.', 'The chapters on linking offline and online evaluation.'),
    },
  ],
};
