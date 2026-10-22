import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const bossProduction: SkillNode = {
  id: 'boss.production',
  branch: 'boss',
  act: 4,
  tier: 4,
  boss: true,
  contest: { minutes: 50 },
  title: l('Испытание IV: инцидент в проде', 'Trial IV: a production incident'),
  blurb: l(
    'Метрика просела ночью. Найти сегмент, найти причину, решить, откатывать ли.',
    'A metric sagged overnight. Find the segment, find the cause, decide whether to roll back.',
  ),
  requires: ['ads.calibration', 'retrieval.ann', 'qcls.thresholds', 'testing.ml-pipelines'],
  theory: [
    {
      type: 'p',
      text: l(
        'Вчера выкатили новую версию поиска: сменили кандидатогенерацию на ANN-индекс, подняли порог классификатора коммерческих запросов и переобучили модель pCTR. Ночью алерт: доля запросов без клика выросла. Три изменения, одна метрика — и никакой возможности понять по ней одной, какое из них виновато. Дальше четыре задания, каждое закрывает один слой: где именно просело, почему модель стала так себя вести, что сломано в коде и что делать.',
        'Yesterday a new version of search shipped: candidate generation moved to an ANN index, the commercial-query classifier threshold went up, and the pCTR model was retrained. Overnight an alert: the share of queries with no click is up. Three changes, one metric, and no way to tell from that metric alone which is to blame. Four assignments follow, each closing one layer: where exactly it sagged, why the model behaves this way, what is broken in the code and what to do.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Это испытание закрывает четвёртый акт: реклама, retrieval, бандиты, классификация запросов и продовые тесты. После него открывается последний акт — ML system design и продуктовое мышление. Часы запускаются кнопкой выше; без них задания тоже решаются, просто попытка не засчитается как попытка на время.',
        'This trial closes the fourth act: ads, retrieval, bandits, query classification and production testing. After it the last act opens — ML system design and product thinking. The clock starts with the button above; without it the tasks still work, the attempt just does not count as a timed one.',
      ),
    },
    {
      type: 'sim',
      sim: 'threshold-coverage',
      title: l('Напоминание: порог и покрытие', 'A reminder: threshold and coverage'),
      caption: l(
        'Одно из трёх изменений — поднятый порог классификатора. Покрути порог и посмотри, как одновременно растёт точность и падает доля классифицированных запросов. Запросы, оставшиеся без категории, идут по дефолтной ветке ранжирования — и именно там обычно и обнаруживается просадка.',
        'One of the three changes is a raised classifier threshold. Move the threshold and watch precision rise while the share of classified queries falls. Queries left without a category go down the default ranking path — and that is usually where the sag turns up.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'boss.production.sql-segments',
      prompt: l(
        'Шаг первый: найди, где просело. По категориям посчитай долю запросов без единого клика. Верни название категории category, число запросов queries и долю запросов без клика no_click_rate, округлённую до четырёх знаков. Категории, где меньше пяти запросов, не показывай. Сортируй по no_click_rate по убыванию, при равенстве — по названию категории по возрастанию.',
        'Step one: find where it sagged. By category, compute the share of queries with no click at all. Return the category name as category, the number of queries as queries, and the share without a click as no_click_rate, rounded to four decimals. Omit categories with fewer than five queries. Sort by no_click_rate descending, then by category name ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `SELECT
  cat.name AS category,
  count(*) AS queries
FROM queries q
JOIN categories cat ON cat.category_id = q.category_id
GROUP BY 1
ORDER BY 1`,
      reference: `WITH clicked AS (
  SELECT DISTINCT i.query_id
  FROM impressions i
  JOIN clicks c ON c.impression_id = i.impression_id
)
SELECT
  cat.name AS category,
  count(*) AS queries,
  round(count(*) FILTER (WHERE cl.query_id IS NULL) * 1.0 / count(*), 4) AS no_click_rate
FROM queries q
JOIN categories cat ON cat.category_id = q.category_id
LEFT JOIN clicked cl ON cl.query_id = q.query_id
GROUP BY 1
HAVING count(*) >= 5
ORDER BY no_click_rate DESC, category`,
      orderMatters: true,
      writeup: l(
        'Разрез по сегментам — первое, что делают при просадке средней метрики, потому что среднее почти никогда не падает равномерно. Три детали, на которых здесь спотыкаются. FILTER (WHERE ...) считает строки по условию внутри той же группировки — без него приходится писать sum(CASE WHEN ...), что длиннее и легче сломать. Порог в пять запросов нужен не для красоты: категория с двумя запросами даёт долю 0.0 или 1.0 и всегда оказывается наверху сортировки, пряча настоящую проблему. И второй ключ сортировки обязателен: при одинаковой доле порядок без него не определён, а значит отчёт будет разным при каждом запуске.',
        'A segment breakdown is the first thing to do when an average sags, because an average almost never falls evenly. Three details trip people up here. FILTER (WHERE ...) counts rows matching a condition inside the same grouping — without it you write sum(CASE WHEN ...), which is longer and easier to break. The five-query threshold is not decoration: a category with two queries yields a share of 0.0 or 1.0 and always floats to the top of the sort, hiding the real problem. And the second sort key is mandatory: with equal shares the order is otherwise undefined, so the report differs on every run.',
      ),
      clickhouse: {
        code: `WITH clicked AS (
  SELECT DISTINCT i.query_id AS query_id
  FROM impressions AS i
  INNER JOIN clicks AS c ON c.impression_id = i.impression_id
)
SELECT
  cat.name AS category,
  count() AS queries,
  round(countIf(cl.query_id = 0) / count(), 4) AS no_click_rate
FROM queries AS q
INNER JOIN categories AS cat ON cat.category_id = q.category_id
LEFT JOIN clicked AS cl ON cl.query_id = q.query_id
GROUP BY category
HAVING count() >= 5
ORDER BY no_click_rate DESC, category`,
        note: l(
          'countIf — родной для ClickHouse аналог FILTER. И снова разница в LEFT JOIN: несовпавшая строка приходит нулём, а не NULL, поэтому проверка на отсутствие клика пишется как = 0.',
          'countIf is ClickHouse\'s native equivalent of FILTER. And again the LEFT JOIN difference: an unmatched row arrives as zero rather than NULL, so the "no click" check is written as = 0.',
        ),
      },
    },
    {
      kind: 'python',
      id: 'boss.production.py-threshold',
      prompt: l(
        'Шаг второй: подбери порог классификатора заново. На вход скоры, бинарные метки и требуемая точность. Перебирай порогами сами значения скоров (предсказание — score >= threshold) и верни кортеж (threshold, precision, recall) для порога, который даёт точность не ниже требуемой и максимальный recall; при равном recall бери больший порог. Если ни один порог не даёт нужной точности, верни None. Пороги, при которых нет ни одного положительного предсказания, не рассматриваются.',
        'Step two: pick the classifier threshold again. The input is scores, binary labels and a required precision. Use the score values themselves as candidate thresholds (a prediction is score >= threshold) and return the tuple (threshold, precision, recall) for the threshold that reaches at least the required precision with the highest recall; on equal recall take the larger threshold. If no threshold reaches the precision, return None. Thresholds producing no positive predictions are not considered.',
      ),
      signature: 'def pick_threshold(scores: list[float], labels: list[int], min_precision: float) -> tuple | None:',
      starter: `def pick_threshold(scores, labels, min_precision):
    # TODO
    return None
`,
      reference: `def pick_threshold(scores, labels, min_precision):
    positives = sum(labels)
    best = None

    for threshold in sorted(set(scores)):
        tp = 0
        predicted = 0
        for score, label in zip(scores, labels):
            if score >= threshold:
                predicted += 1
                tp += label
        if predicted == 0:
            continue
        precision = tp / predicted
        recall = tp / positives if positives else 0.0
        if precision < min_precision:
            continue
        if best is None or recall > best[2] or (recall == best[2] and threshold > best[0]):
            best = (threshold, precision, recall)
    return best
`,
      sampleTests: `scores = [0.1, 0.4, 0.6, 0.9]
labels = [0, 0, 1, 1]
assert pick_threshold(scores, labels, 1.0) == (0.6, 1.0, 1.0)
`,
      tests: `scores = [0.1, 0.4, 0.6, 0.9]
labels = [0, 0, 1, 1]

# Perfect separation: the lowest threshold that keeps precision at one.
assert pick_threshold(scores, labels, 1.0) == (0.6, 1.0, 1.0)

# A lower precision requirement buys no extra recall here, so the answer holds.
best = pick_threshold(scores, labels, 0.5)
assert best[2] == 1.0 and best[1] >= 0.5

# Impossible precision gives None rather than a wrong answer.
assert pick_threshold([0.2, 0.3], [0, 0], 0.5) is None

# Overlapping classes: precision and recall trade off.
scores = [0.1, 0.3, 0.35, 0.5, 0.6, 0.8]
labels = [0, 1, 0, 1, 0, 1]
strict = pick_threshold(scores, labels, 0.6)
assert strict is not None
assert strict[1] >= 0.6 - 1e-12, strict
loose = pick_threshold(scores, labels, 0.4)
assert loose[2] >= strict[2], (loose, strict)

# The returned precision and recall match the returned threshold.
threshold, precision, recall = loose
predicted = [s >= threshold for s in scores]
tp = sum(1 for p, y in zip(predicted, labels) if p and y)
assert abs(precision - tp / sum(predicted)) < 1e-12
assert abs(recall - tp / sum(labels)) < 1e-12

# A single class of scores still works.
assert pick_threshold([0.5, 0.5], [1, 0], 0.5) == (0.5, 0.5, 1.0)
`,
      writeup: l(
        'Порог никогда не выбирается «по F1» в проде, он выбирается по требованию с той стороны, где живёт цена ошибки: «точность не ниже 0.9, а дальше максимум покрытия». Здесь важны две вещи. Первая: кандидатами берутся сами значения скоров, а не равномерная сетка — между двумя соседними значениями ничего не меняется, а сетка либо пропускает оптимум, либо тратит время впустую. Вторая: порог, при котором положительных предсказаний нет вовсе, формально даёт точность 0/0 и в наивной реализации либо падает, либо считается идеальным — и тогда функция радостно возвращает порог, при котором классификатор не делает ничего. В инциденте из этого испытания произошло ровно это: порог подняли, точность на бумаге выросла, а доля классифицированных запросов упала, и всё, что осталось без категории, поехало по дефолтной ветке.',
        'A threshold is never chosen "by F1" in production; it is chosen against a requirement from the side where the cost of an error lives: "precision no lower than 0.9, then maximise coverage". Two things matter here. First, the candidates are the score values themselves rather than a uniform grid — nothing changes between two neighbouring values, and a grid either misses the optimum or wastes time. Second, a threshold with no positive predictions at all formally gives a precision of 0/0 and a naive implementation either crashes or calls it perfect — whereupon the function happily returns a threshold at which the classifier does nothing. In this trial\'s incident exactly that happened: the threshold went up, precision grew on paper, the share of classified queries fell, and everything left without a category went down the default path.',
      ),
    },
    {
      kind: 'findbug',
      id: 'boss.production.bug-skew',
      lang: 'python',
      prompt: l(
        'Шаг третий: модель pCTR в проде выдаёт осмысленные, но систематически смещённые вероятности, хотя на валидации калибровка была в порядке. Укажи строку, из-за которой инференс не соответствует обучению.',
        'Step three: the pCTR model in production returns plausible but systematically biased probabilities, although calibration was fine on validation. Point at the line that makes inference disagree with training.',
      ),
      code: `FEATURES = ['position', 'price', 'ctr_7d', 'is_ad']


def train(df, model):
    x = df[FEATURES]
    return model.fit(x, df['clicked'])


def predict_one(model, request):
    row = [request['price'], request['position'], request['ctr_7d'], request['is_ad']]
    return model.predict_proba([row])[0][1]`,
      buggyLines: [10],
      explanation: l(
        'В обучении признаки берутся по именам колонок из FEATURES, то есть в порядке position, price, ctr_7d, is_ad. В строке 10 вектор для инференса собирается руками, и первые два признака переставлены местами: цена оказывается там, где модель ждёт позицию. Исключения не будет — длина совпадает, типы числовые, — поэтому модель вернёт вполне правдоподобные вероятности, просто неправильные. Это каноническая train/serving skew, и ловится она не глазами, а тем, что вектор для инференса собирается тем же кодом и по тому же списку имён, что и при обучении, плюс проверкой распределения скоров в теневом режиме: именно она отличается от обучающей, когда признаки переставлены. В строках 4–6 всё честно: обучение использует именованные колонки, и порядок задаётся одним списком.',
        'Training takes features by column name from FEATURES, that is in the order position, price, ctr_7d, is_ad. On line 10 the inference vector is assembled by hand and the first two features are swapped: price lands where the model expects position. There will be no exception — the length matches and the types are numeric — so the model returns entirely plausible probabilities that are simply wrong. This is the canonical train/serving skew, and it is caught not by eye but by assembling the inference vector with the same code and the same list of names as training, plus by checking the score distribution in shadow mode: that is what differs from the training distribution when features are swapped. Lines 4–6 are honest: training uses named columns and the order comes from a single list.',
      ),
    },
    {
      kind: 'case',
      id: 'boss.production.case-decide',
      prompt: l(
        'Шаг четвёртый: решение. Известно: доля запросов без клика выросла на 1.8% в целом и на 6% в одной категории; порог классификатора подняли с 0.5 до 0.8 и доля классифицированных запросов упала с 92% до 71%; в коде инференса pCTR переставлены два признака; выручка не изменилась значимо; ANN-индекс даёт recall@100 равный 0.94 против 0.99 у полного перебора. Напиши, что откатываешь прямо сейчас, что оставляешь, в каком порядке проверяешь гипотезы и какой пост-мортем напишешь, чтобы это не повторилось.',
        'Step four: the decision. What is known: the share of queries with no click is up 1.8% overall and 6% in one category; the classifier threshold went from 0.5 to 0.8 and the share of classified queries fell from 92% to 71%; two features are swapped in the pCTR inference code; revenue did not move significantly; the ANN index gives recall@100 of 0.94 against 0.99 for exhaustive search. Write what you roll back right now, what you keep, in what order you test the hypotheses, and what post-mortem you would write so that this does not happen again.',
      ),
      reference: l(
        'Прямо сейчас откатываю две вещи, и по разным причинам. Перестановка признаков в инференсе — безусловный откат: это баг, а не компромисс, модель работает не с теми числами, и любые измерения поверх него бессмысленны. Порог 0.8 — тоже откат, но как решение, а не как баг: двадцать процентов запросов потеряли категорию и поехали по дефолтной ветке, а просадка на 6% сосредоточена в одной категории, что ровно на это и указывает. ANN-индекс оставляю: recall@100 0.94 против 0.99 — это потеря пяти документов из ста на глубине, где они почти не влияют на топ, и выключать его до измерений значит выключить единственное изменение, которое давало скорость.\n\nПорядок проверки — от дешёвого и однозначного к дорогому. Сначала чиню признаки и смотрю калибровку в теневом режиме: это час работы и не требует эксперимента. Потом возвращаю порог и смотрю, вернулась ли доля классифицированных запросов и просадка в категории — если да, причина найдена. Только после этого, на чистом фоне, измеряю эффект ANN отдельным экспериментом, потому что до этого момента его эффект смешан с двумя другими изменениями и неизмерим в принципе.\n\nОтдельно отмечаю, что неизменившаяся выручка — не утешение, а подозрительный факт: при росте доли запросов без клика на 1.8% выручка должна была бы просесть, и если она цела, скорее всего часть потерянных органических кликов перешла в рекламные. Это надо проверить тем же разрезом, что и в первом задании.\n\nПост-мортем: три изменения выкатили одновременно, поэтому любая метрика оказалась неатрибутируемой — это и есть главный вывод, и он не про конкретный баг. Что меняю в процессе: выкатывать изменения по одному или с взаимно непересекающимися сегментами; добавить тест, который собирает вектор инференса тем же кодом, что обучение, и сравнивает предсказание на фиксированной строке с эталоном; добавить алерт на долю классифицированных запросов, а не только на итоговую метрику, потому что покрытие просело первым, за несколько часов до того, как стало видно в кликах.',
        'Right now I roll back two things, for different reasons. The swapped features in inference are an unconditional rollback: that is a bug, not a trade-off, the model is working with the wrong numbers, and any measurement on top of it is meaningless. The 0.8 threshold is also a rollback, but as a decision rather than as a bug: twenty per cent of queries lost their category and went down the default path, and the 6% sag concentrated in a single category points exactly there. I keep the ANN index: recall@100 of 0.94 against 0.99 means losing five documents in a hundred at a depth where they barely affect the top, and switching it off before measuring means switching off the only change that delivered speed.\n\nThe order of investigation goes from cheap and unambiguous to expensive. First I fix the features and look at calibration in shadow mode: an hour of work, no experiment needed. Then I restore the threshold and watch whether the classified share and the category sag come back — if they do, the cause is found. Only then, on a clean background, do I measure the ANN effect with its own experiment, because until that point its effect is mixed with two other changes and is unmeasurable in principle.\n\nSeparately I note that unchanged revenue is not a comfort but a suspicious fact: with the no-click share up 1.8%, revenue should have sagged, and if it is intact then some of the lost organic clicks probably moved to ads. That needs checking with the same breakdown as in the first assignment.\n\nPost-mortem: three changes shipped at once, so every metric became unattributable — that is the main conclusion, and it is not about the particular bug. What I change in the process: ship changes one at a time or on mutually disjoint segments; add a test that builds the inference vector with the same code as training and compares the prediction on a fixed row against a reference; add an alert on the share of classified queries rather than only on the final metric, because coverage sagged first, hours before it became visible in clicks.',
      ),
      checklist: [
        l(
          'Баг в признаках откачен безусловно и отделён от спорных решений.',
          'The feature bug is rolled back unconditionally and separated from debatable decisions.',
        ),
        l(
          'Просадка в одной категории связана с падением покрытия классификатора.',
          'The single-category sag is linked to the classifier\'s drop in coverage.',
        ),
        l(
          'ANN не откатывается рефлекторно: названа цена потери recall на глубине.',
          'The ANN is not rolled back reflexively: the cost of losing recall at depth is named.',
        ),
        l(
          'Назван порядок проверки от дешёвого к дорогому.',
          'An order of investigation from cheap to expensive is named.',
        ),
        l(
          'Замечено, что неизменившаяся выручка подозрительна, и предложена проверка.',
          'Noticed that unchanged revenue is suspicious, with a check proposed.',
        ),
        l(
          'Главный вывод пост-мортема — одновременная выкатка трёх изменений.',
          'The post-mortem\'s main conclusion is the simultaneous rollout of three changes.',
        ),
        l(
          'Предложен алерт на промежуточную метрику (покрытие), а не только на итоговую.',
          'An alert on an intermediate metric (coverage) is proposed, not only on the final one.',
        ),
      ],
      writeup: l(
        'Инцидент почти никогда не состоит из одной причины, и главная ошибка на разборе — искать её в единственном числе. Здесь три изменения и минимум две настоящие причины, а третье изменение, ANN, скорее всего невиновно, но выглядит подозрительно просто потому, что выкатилось вместе с остальными. Способность разделить «баг», «спорное решение» и «изменение, которое просто попало под раздачу» — это ровно то, чем мидл отличается от джуна на дежурстве.',
        'An incident almost never has a single cause, and the main mistake at a review is looking for one. There are three changes here and at least two real causes, while the third change, the ANN, is probably innocent and merely looks suspicious because it shipped alongside the others. Separating "a bug", "a debatable decision" and "a change that was simply in the way" is exactly what distinguishes a middle engineer from a junior on call.',
      ),
    },
  ],
};
