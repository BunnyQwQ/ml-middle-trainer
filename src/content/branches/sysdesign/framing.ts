import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sysdFraming: SkillNode = {
  id: 'sysd.framing',
  branch: 'system-design',
  act: 5,
  tier: 1,
  title: l('Постановка: от просьбы к ML-задаче', 'Framing: from a request to an ML task'),
  blurb: l(
    'Что здесь вообще предсказывается, на чём учиться и чем мерить успех.',
    'What is being predicted here at all, what to learn from, and what success is measured by.',
  ),
  requires: ['boss.production'],
  theory: [
    {
      type: 'p',
      text: l(
        'Секция ML system design на собеседовании и первая неделя реальной задачи устроены одинаково: приходит фраза вроде «пользователи жалуются, что поиск плохой, сделай лучше», и первое, что нужно, — превратить её во что-то, у чего есть вход, выход и измеримый результат. Большая часть провалов на этой секции не в том, что кандидат не знает архитектур, а в том, что он начинает с архитектуры.',
        'The ML system design section of an interview and the first week of a real task are built the same way: a sentence arrives like "users complain that search is bad, make it better", and the first thing needed is to turn it into something with an input, an output and a measurable result. Most failures in that section are not about not knowing architectures but about starting from the architecture.',
      ),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'Кто и в какой момент видит результат работы системы. Без этого непонятно, что считать ошибкой.',
          'Who sees the system\'s output, and when. Without that there is no saying what counts as an error.',
        ),
        l(
          'Что предсказываем для одного объекта: один запрос, одну пару «запрос — документ», одного пользователя в день.',
          'What is predicted for one object: one query, one query-document pair, one user per day.',
        ),
        l(
          'Откуда берётся таргет и честен ли он: клик, покупка, оценка асессора, явная жалоба.',
          'Where the target comes from and whether it is honest: a click, a purchase, a rater label, an explicit complaint.',
        ),
        l(
          'Чем мерим оффлайн, чем онлайн и что не должно сломаться. Эти три метрики почти никогда не совпадают.',
          'What is measured offline, what online, and what must not break. These three metrics almost never coincide.',
        ),
        l(
          'Какие ограничения жёсткие: задержка, стоимость инференса, частота обновления, требования к объяснимости.',
          'Which constraints are hard: latency, inference cost, update frequency, explainability requirements.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Самый сильный ответ на вопрос «как бы вы это сделали» начинается не с модели, а с предложения, которое можно проверить за день: «возьмём текущую выдачу, посчитаем, в скольких запросах нет ни одного клика, и посмотрим на сотню таких запросов руками». Это и есть разница между мидлом и джуном на этой секции.',
        'The strongest answer to "how would you build this" starts not with a model but with a proposal that can be checked in a day: "take the current results, count how many queries get no click at all, and look at a hundred of them by hand". That is the difference between a middle and a junior engineer in this section.',
      ),
    },
    {
      type: 'sim',
      sim: 'baseline-ladder',
      title: l('Лестница подходов и где на ней деньги', 'The ladder of approaches and where the value sits'),
      caption: l(
        'nDCG@5 здесь честно считается ранжированием симулированных документов, а не вписан руками. Посмотри на разрыв между случайным порядком и одним признаком текстового совпадения — и на то, сколько добавляет сверху обученная модель. Это не аргумент против моделей, это аргумент за то, чтобы бейзлайн был первым: без него нечем измерить, стоила ли модель своей сложности.',
        'The nDCG@5 here is honestly computed by ranking simulated documents rather than typed in. Look at the gap between random order and a single text-match feature — and at how much the fitted model adds on top. This is not an argument against models but an argument for the baseline coming first: without it there is nothing to measure the model\'s complexity against.',
      ),
    },
    {
      type: 'table',
      head: [
        l('Формулировка', 'Phrasing'),
        l('Что с ней не так', 'What is wrong with it'),
        l('Рабочая версия', 'A working version'),
      ],
      rows: [
        [
          l('Сделать поиск умнее', 'Make search smarter'),
          l('Нет объекта, нет метрики, нечего измерять.', 'No object, no metric, nothing to measure.'),
          l(
            'Снизить долю запросов без единого клика в топ-10 на 15% без падения выручки.',
            'Cut the share of queries with no click in the top 10 by 15% without losing revenue.',
          ),
        ],
        [
          l('Предсказывать удовлетворённость', 'Predict satisfaction'),
          l(
            'Таргета не существует в логах: удовлетворённость никто не размечает.',
            'The target does not exist in the logs: nobody labels satisfaction.',
          ),
          l(
            'Предсказывать клик с последующим долгим просмотром как прокси, помня, что прокси смещён.',
            'Predict a click followed by a long dwell as a proxy, remembering that the proxy is biased.',
          ),
        ],
        [
          l('Внедрить трансформер', 'Roll out a transformer'),
          l('Решение названо раньше задачи.', 'The solution is named before the problem.'),
          l(
            'Проверить, упирается ли качество в понимание запроса: разобрать сто худших запросов руками.',
            'Check whether quality is limited by query understanding: review the hundred worst queries by hand.',
          ),
        ],
      ],
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'sysd.framing.q-object',
      mode: 'single',
      prompt: l(
        'Задача: подсказки в поисковой строке. Что здесь разумнее всего считать одним объектом обучающей выборки?',
        'Task: suggestions in the search box. What is the most sensible thing to call one training example here?',
      ),
      choices: [
        { id: 'user', text: l('Пользователь', 'A user') },
        { id: 'session', text: l('Сессия поиска', 'A search session') },
        {
          id: 'prefix-sugg',
          text: l('Пара «введённый префикс — показанная подсказка»', 'A pair of "typed prefix — shown suggestion"'),
        },
        { id: 'query', text: l('Законченный запрос', 'A completed query') },
      ],
      correct: ['prefix-sugg'],
      explanation: l(
        'Система принимает решение в момент, когда пользователь ввёл префикс, и для каждой подсказки отвечает на вопрос «показывать ли её здесь и на каком месте». Значит объект — пара «префикс — подсказка», а таргет — выбрал ли пользователь эту подсказку. Пользователь и сессия слишком крупные: внутри них десятки решений, и ошибку не к чему привязать. Законченный запрос — это уже результат работы системы, а не единица решения; на нём удобно считать метрику качества, но учиться на нём нельзя, потому что для одного префикса подсказок много.',
        'The system makes its decision at the moment a prefix has been typed, and for each suggestion it answers "show it here, and in which position". So the object is a prefix-suggestion pair and the target is whether the user picked that suggestion. A user or a session is far too coarse: each contains dozens of decisions and an error has nothing to attach to. A completed query is the system\'s output rather than its unit of decision; it is convenient for a quality metric but cannot be trained on, because one prefix has many suggestions.',
      ),
    },
    {
      kind: 'python',
      id: 'sysd.framing.py-labels',
      prompt: l(
        'Разметь запросы по логам: запрос считается успешным, если по нему был клик не позже чем через horizon секунд после запроса. Клики раньше запроса и клики по другим запросам не считаются; граница включительная. На вход список запросов [{query_id, ts}] и список кликов [{query_id, ts}], на выходе словарь query_id → 0/1 для всех запросов из первого списка.',
        'Label queries from the logs: a query counts as successful if it had a click no later than horizon seconds after it. Clicks before the query and clicks belonging to other queries do not count; the boundary is inclusive. The input is a list of queries [{query_id, ts}] and a list of clicks [{query_id, ts}]; the output is a dict query_id -> 0/1 for every query in the first list.',
      ),
      signature: 'def label_queries(queries: list[dict], clicks: list[dict], horizon: float) -> dict[int, int]:',
      starter: `def label_queries(queries, clicks, horizon):
    # TODO
    return {}
`,
      reference: `def label_queries(queries, clicks, horizon):
    by_query = {}
    for click in clicks:
        by_query.setdefault(click['query_id'], []).append(click['ts'])

    labels = {}
    for query in queries:
        qid = query['query_id']
        start = query['ts']
        hit = any(start <= ts <= start + horizon for ts in by_query.get(qid, []))
        labels[qid] = 1 if hit else 0
    return labels
`,
      sampleTests: `queries = [{'query_id': 1, 'ts': 100.0}, {'query_id': 2, 'ts': 200.0}]
clicks = [{'query_id': 1, 'ts': 103.0}]
assert label_queries(queries, clicks, 5.0) == {1: 1, 2: 0}
`,
      tests: `queries = [
    {'query_id': 1, 'ts': 100.0},
    {'query_id': 2, 'ts': 200.0},
    {'query_id': 3, 'ts': 300.0},
    {'query_id': 4, 'ts': 400.0},
]
clicks = [
    {'query_id': 1, 'ts': 105.0},   # exactly on the boundary
    {'query_id': 2, 'ts': 212.0},   # too late
    {'query_id': 3, 'ts': 299.0},   # before its own query
    {'query_id': 9, 'ts': 400.0},   # belongs to no query in the list
]
labels = label_queries(queries, clicks, 5.0)
assert labels == {1: 1, 2: 0, 3: 0, 4: 0}, labels

# Every query is labelled, including the ones with no clicks at all.
assert set(labels) == {1, 2, 3, 4}

# A wider horizon catches the late click, a zero horizon catches nothing.
assert label_queries(queries, clicks, 15.0)[2] == 1
assert sum(label_queries(queries, clicks, 0.0).values()) == 0

# Several clicks on one query do not double count.
many = label_queries([{'query_id': 7, 'ts': 0.0}], [{'query_id': 7, 'ts': 1.0}, {'query_id': 7, 'ts': 2.0}], 5.0)
assert many == {7: 1}
`,
      writeup: l(
        'Код простой, а решений в нём три, и каждое меняет датасет. Первое: клик раньше запроса не считается — в логах такое встречается из-за рассинхрона часов и из-за того, что пользователь кликнул по предыдущей выдаче; если это не отфильтровать, часть «успехов» окажется из прошлого. Второе: горизонт. Пять секунд и пять минут дают заметно разную долю положительных меток, и выбирать его надо, глядя на распределение задержки до клика, а не из головы. Третье: запросы без кликов обязаны попасть в разметку с нулём, а не выпасть — иначе обучающая выборка состоит из одних успехов, и модель учится ранжировать внутри удачных случаев, не видя неудачных вовсе.',
        'The code is simple but holds three decisions, each of which changes the dataset. First: a click earlier than its query does not count — logs contain those because of clock skew and because the user clicked the previous result page; leaving them in imports "successes" from the past. Second: the horizon. Five seconds and five minutes give noticeably different positive rates, and it should be chosen by looking at the distribution of time-to-click rather than from the air. Third: queries without clicks must enter the labels as zeros rather than drop out — otherwise the training set consists of successes only, and the model learns to rank within the lucky cases without ever seeing the unlucky ones.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'sysd.framing.pick-suggest',
      area: l('Подсказки в поисковой строке', 'Search box suggestions'),
      scenario: l(
        'Команда делает подсказки в поисковой строке маркетплейса. Подсказка показывается после каждого введённого символа, бюджет на ответ — 50 мс. Нужна метрика, по которой итерируется модель между выкатками, метрика, по которой принимается решение о раскатке, и два ограничителя. Учти, что подсказки могут увести пользователя с длинного точного запроса на короткий популярный.',
        'A team is building search box suggestions for a marketplace. A suggestion is shown after every typed character with a 50 ms response budget. Pick the metric the model iterates on between releases, the metric the rollout decision rests on, and two guardrails. Note that suggestions can pull a user away from a long precise query onto a short popular one.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'mrr-sugg',
          label: l('MRR выбранной подсказки', 'MRR of the chosen suggestion'),
          correctFor: ['offline'],
          note: l(
            'Считается по логам на каждой итерации, чувствительна к порядку в коротком списке — ровно то, что нужно для оффлайна. Решать по ней нельзя: она растёт и тогда, когда подсказки просто агрессивнее перехватывают уже введённый запрос.',
            'Computed from logs at every iteration and sensitive to order in a short list — exactly what an offline metric needs to be. It cannot carry the decision: it also rises when the suggestions merely hijack a query the user was already typing.',
          ),
        },
        {
          id: 'orders-per-user',
          label: l('Заказы на пользователя', 'Orders per user'),
          correctFor: ['online'],
          note: l(
            'Конечная цель всей воронки и то, ради чего подсказки существуют. Медленнее и шумнее, но решение о раскатке принимается именно по ней.',
            'The end of the funnel and the reason suggestions exist at all. Slower and noisier, but this is what the rollout decision rests on.',
          ),
        },
        {
          id: 'latency-p99',
          label: l('p99 времени ответа подсказок', 'p99 suggestion latency'),
          correctFor: ['guardrail'],
          note: l(
            'Жёсткое ограничение из условия: подсказка после каждого символа. Модель, которая лучше, но медленнее бюджета, не выкатывается независимо от метрик.',
            'A hard constraint from the statement: a suggestion after every character. A model that is better but slower than the budget does not ship whatever the metrics say.',
          ),
        },
        {
          id: 'long-query-share',
          label: l('Доля длинных уточнённых запросов', 'Share of long, specific queries'),
          correctFor: ['guardrail'],
          note: l(
            'Прямо закрывает названный в условии риск: подсказки уводят с точного длинного запроса на популярный короткий, и выдача по нему хуже отвечает на исходную потребность.',
            'Closes the risk named in the statement: suggestions pull users off a precise long query onto a popular short one, whose results answer the original need less well.',
          ),
        },
        {
          id: 'ctr-sugg',
          label: l('CTR блока подсказок', 'CTR of the suggestion block'),
          correctFor: [],
          note: l(
            'Растёт, если показывать подсказки навязчивее и чаще перехватывать запрос, который пользователь и так допечатал бы. Как ограничитель бесполезен, как цель вреден.',
            'Rises if suggestions are shown more aggressively and hijack queries the user would have finished typing anyway. Useless as a guardrail and harmful as a goal.',
          ),
        },
        {
          id: 'model-size',
          label: l('Размер модели в мегабайтах', 'Model size in megabytes'),
          correctFor: [],
          note: l(
            'Это характеристика решения, а не качества продукта. Ограничение по размеру имеет смысл только через то, на что оно влияет, — через задержку, которая здесь уже взята отдельно.',
            'A property of the solution, not of the product\'s quality. A size constraint only matters through what it affects — latency, which is already taken here separately.',
          ),
        },
        {
          id: 'offline-auc',
          label: l('ROC AUC выбора подсказки', 'ROC AUC of suggestion choice'),
          correctFor: [],
          note: l(
            'Порядок внутри короткого списка из десяти подсказок AUC почти не различает: она усредняет по всем парам, а важны только первые две-три позиции. Для этой задачи MRR строго информативнее.',
            'AUC barely distinguishes order inside a short list of ten suggestions: it averages over all pairs while only the first two or three positions matter. For this task MRR is strictly more informative.',
          ),
        },
      ],
      writeup: l(
        'Разделение «по чему итерируемся» и «по чему решаем» — главный приём этой секции. Оффлайн-метрика должна считаться по логам за минуты и быть чувствительной к тому, что модель меняет; онлайн-метрика должна быть тем, ради чего всё затевалось, даже если она шумная и медленная. Ограничители выбираются не из общего списка хороших вещей, а по рискам, названным в условии: здесь это бюджет 50 мс и риск увести пользователя с точного запроса. Если ограничитель нельзя связать с конкретным способом сломать продукт, он лишний.',
        'Separating "what we iterate on" from "what we decide on" is the key move of this section. The offline metric has to be computable from logs in minutes and sensitive to what the model changes; the online metric has to be the thing it was all started for, even if it is noisy and slow. Guardrails are chosen not from a general list of good things but from the risks named in the statement: here the 50 ms budget and the risk of pulling users off a precise query. A guardrail you cannot tie to a concrete way of breaking the product is dead weight.',
      ),
    },
    {
      kind: 'case',
      id: 'sysd.framing.case-empty',
      prompt: l(
        'Продакт приходит с фразой: «в поиске много пустых выдач, надо что-то сделать». Данных у тебя нет, кроме логов поиска. Напиши, как ты развернёшь это в задачу: что измеришь в первый день, что окажется объектом и таргетом, какой бейзлайн предложишь до любой модели и по каким двум метрикам будешь решать, что стало лучше. Отдельно напиши, в каком случае ML здесь вообще не нужен.',
        'A product manager arrives with: "search has a lot of empty result pages, we need to do something". You have nothing but the search logs. Write out how you would unfold this into a task: what you measure on day one, what the object and the target turn out to be, what baseline you propose before any model, and which two metrics will tell you it got better. Separately, write when ML is not needed here at all.',
      ),
      reference: l(
        'Первый день уходит на определение «пустой выдачи» и на счёт. Пустая выдача — это не только ноль документов: гораздо чаще это выдача, где документы есть, но ни один не кликнут, и ровно эти запросы раздражают пользователя. Поэтому считаю три числа по логам: доля запросов с нулём результатов, доля запросов с результатами, но без кликов, и доля запросов, после которых пользователь переформулировал запрос в той же сессии. Затем руками смотрю сотню запросов из каждой группы — почти всегда выясняется, что группы разные по природе: опечатки, запросы товаров, которых нет в каталоге, слишком узкие фильтры, редкие формулировки.\n\nОбъект — запрос. Таргет для модели поиска — клик с долгим просмотром, но для этой конкретной задачи правильнее сначала не модель, а разбор классов. Бейзлайн: исправление опечаток по словарю частотных запросов плюс автоматическое ослабление самого узкого фильтра, когда результатов меньше трёх. Это чинится за неделю и закрывает заметную часть случаев без обучения чего-либо.\n\nМетрики: оффлайн — доля запросов без клика в топ-10 на фиксированном срезе логов; онлайн — доля сессий с переформулировкой и заказы на пользователя как решающая. Ограничители — выручка и доля запросов, где выдача стала шире, но менее релевантной: ослабление фильтров легко превращает пустую выдачу в мусорную, и это хуже для пользователя, чем честное «ничего не найдено».\n\nML не нужен, если разбор показывает, что большинство пустых выдач — про отсутствие товара в каталоге. Тогда это задача закупки и ассортимента, а не поиска, и любая модель будет честно показывать пустоту. Второй случай — если доминируют опечатки и их чинит словарь: статистический корректор без обучения даст почти весь эффект.',
        'Day one goes on defining "empty results" and on counting. An empty result page is not only zero documents: far more often it is a page with documents where none is clicked, and those are exactly the queries that irritate users. So I count three numbers from the logs: the share of queries with zero results, the share with results but no clicks, and the share after which the user reformulated within the same session. Then I read a hundred queries from each group by hand — it almost always turns out the groups differ in nature: typos, queries for goods absent from the catalogue, over-narrow filters, rare phrasings.\n\nThe object is a query. The target for a search model is a click with a long dwell, but for this particular task the right first step is the breakdown rather than a model. Baseline: typo correction against a dictionary of frequent queries, plus automatically relaxing the narrowest filter when fewer than three results come back. That ships in a week and closes a visible share of the cases without learning anything.\n\nMetrics: offline — the share of queries with no click in the top 10 on a fixed slice of logs; online — the share of sessions with a reformulation, with orders per user as the deciding metric. Guardrails: revenue, and the share of queries whose results got broader but less relevant — relaxing filters easily turns an empty page into a junk page, which is worse for the user than an honest "nothing found".\n\nML is not needed if the breakdown shows most empty pages are about goods missing from the catalogue. Then it is a merchandising problem rather than a search problem, and any model will honestly show emptiness. The second case is typos dominating and a dictionary fixing them: a statistical corrector with no training gives almost the whole effect.',
      ),
      checklist: [
        l(
          'Определил «пустую выдачу» больше чем одним способом и посчитал каждый.',
          'Defined "empty results" in more than one way and counted each.',
        ),
        l(
          'Предложил посмотреть на запросы руками до любой модели.',
          'Proposed reading the queries by hand before any model.',
        ),
        l('Назвал объект и таргет явно.', 'Named the object and the target explicitly.'),
        l(
          'Бейзлайн без обучения, который можно выкатить за неделю.',
          'A baseline with no training that can ship in a week.',
        ),
        l(
          'Разделил оффлайн-метрику и решающую онлайн-метрику.',
          'Separated the offline metric from the deciding online metric.',
        ),
        l(
          'Назвал риск «пустая выдача превращается в мусорную» и закрыл его ограничителем.',
          'Named the risk of an empty page becoming a junk page and covered it with a guardrail.',
        ),
        l(
          'Назвал хотя бы один случай, когда задача вообще не про ML.',
          'Named at least one case where the task is not about ML at all.',
        ),
      ],
      writeup: l(
        'На этой секции проверяют не знание архитектур, а способность не начать с них. Сильный ответ почти всегда содержит три вещи: счёт по логам до любых предложений, разбор руками и бейзлайн, который можно выкатить за неделю. Ответ, в котором сразу предлагается модель, слаб даже если модель правильная: он не показывает, что кандидат понимает, какую часть проблемы она закроет.',
        'This section tests not knowing architectures but being able not to start from them. A strong answer almost always contains three things: counting from the logs before any proposals, reading cases by hand, and a baseline that ships in a week. An answer that proposes a model immediately is weak even when the model is right: it does not show that the candidate knows which part of the problem it would close.',
      ),
    },
  ],

  sources: [
    {
      title: 'Google: Rules of Machine Learning',
      url: 'https://developers.google.com/machine-learning/guides/rules-of-ml',
      note: l(
        'Правила 1–3 ровно про то, что бейзлайн идёт первым.',
        'Rules 1–3 are exactly about the baseline coming first.',
      ),
    },
  ],
};
