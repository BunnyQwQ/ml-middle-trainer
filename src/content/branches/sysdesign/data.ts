import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sysdData: SkillNode = {
  id: 'sysd.data',
  branch: 'system-design',
  act: 5,
  tier: 2,
  title: l('Данные, сплит и разметка', 'Data, splits and labels'),
  blurb: l(
    'Где брать обучающую выборку и как не измерить сам себя.',
    'Where the training set comes from, and how not to measure yourself.',
  ),
  requires: ['sysd.framing'],
  theory: [
    {
      type: 'p',
      text: l(
        'На собеседовании вопрос «как вы разобьёте данные» звучит скучно, а в работе именно он отделяет модель, которая повторила прод, от модели, которая показала 0.97 на валидации и ничего не изменила. Разбиение — это не техническая деталь, а определение того, какой вопрос ты задаёшь данным. Случайный сплит отвечает на вопрос «смогу ли я предсказать строку из прошлого, если видел соседние строки из того же прошлого», а в проде вопрос всегда другой: «смогу ли я предсказать завтра, зная вчера».',
        'At an interview "how will you split the data" sounds dull, but at work it is exactly what separates a model that reproduces production from a model that showed 0.97 on validation and changed nothing. A split is not a technical detail but a definition of the question you are asking the data. A random split answers "can I predict a row from the past given neighbouring rows of the same past", while production always asks something else: "can I predict tomorrow knowing yesterday".',
      ),
    },
    {
      type: 'sim',
      sim: 'time-split',
      title: l('Случайный сплит против временного', 'Random split versus split by time'),
      caption: l(
        'Мир дрейфует: коэффициент связи признака с таргетом медленно меняется день ото дня. Поставь дрейф в ноль — оба сплита дают одно и то же, и именно поэтому случайный кажется безобидным. Подними дрейф и смотри на последнюю плашку: во сколько раз оценка на случайном сплите оптимистичнее того, что реально будет в проде. Все числа здесь получены подгонкой МНК на симулированных строках.',
        'The world drifts: the coefficient linking the feature to the target moves slowly from day to day. Set the drift to zero and both splits agree — which is why a random split looks harmless. Raise the drift and watch the last readout: how many times more optimistic the random-split estimate is than what production actually gets. Every number here comes from a least-squares fit on the simulated rows.',
      ),
    },
    {
      type: 'h',
      text: l('Четыре способа подсмотреть ответ', 'Four ways to peek at the answer'),
    },
    {
      type: 'list',
      items: [
        l(
          'Во времени: обучающая выборка содержит строки из будущего относительно тестовой. Лечится сплитом по времени.',
          'In time: the training set contains rows from the future relative to the test set. Cured by a time-based split.',
        ),
        l(
          'По группам: один пользователь или один товар попал и в train, и в test. Модель запоминает группу, а не закономерность. Лечится сплитом по группе.',
          'By group: one user or one item landed in both train and test. The model memorises the group rather than the pattern. Cured by a group split.',
        ),
        l(
          'Через препроцессинг: нормализация, отбор признаков или импьютация посчитаны по всем данным до разбиения. Лечится тем, что всё это — часть пайплайна и учится только на train.',
          'Through preprocessing: scaling, feature selection or imputation computed over all data before the split. Cured by making all of it part of the pipeline, fitted on train only.',
        ),
        l(
          'Через признак: в признаке лежит агрегат по таргету или что-то, чего в момент предсказания ещё не существует. Лечится честным ответом на вопрос «а это уже известно в момент инференса?».',
          'Through a feature: it holds a target aggregate, or something that does not yet exist at prediction time. Cured by honestly answering "is this known at inference time?".',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Разметка кликами смещена по построению: клик зависит от позиции, а позицию выдала текущая модель. Обучаясь на кликах без поправки, новая модель воспроизводит вкусы старой — это замкнутый контур, и со временем он сужает выдачу. Отсюда и берутся экзогенные источники: асессоры, интерливинг, случайная перестановка на малой доле трафика.',
        'Click labels are biased by construction: a click depends on position and the position came from the current model. Training on raw clicks makes the new model reproduce the old one\'s tastes — a closed loop that narrows results over time. That is where exogenous sources come from: raters, interleaving, random shuffling on a small traffic share.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'sysd.data.py-time-split',
      prompt: l(
        'Разбей строки по времени: последние test_days различных дней уходят в тест, остальные в обучение. На вход список словарей с ключом day (целое) и произвольными другими ключами, на выходе кортеж (train, test), в каждом списке строки в исходном порядке. Дни могут идти не подряд и строки приходят в произвольном порядке. Если test_days не меньше числа различных дней, обучающая часть пустая.',
        'Split rows by time: the last test_days distinct days go to the test set, the rest to training. The input is a list of dicts with a day key (an integer) and any other keys; the output is a tuple (train, test) with rows in their original order inside each list. Days need not be contiguous and rows arrive in arbitrary order. If test_days is at least the number of distinct days, the training part is empty.',
      ),
      signature: 'def time_split(rows: list[dict], test_days: int) -> tuple[list, list]:',
      starter: `def time_split(rows, test_days):
    # TODO
    return [], []
`,
      reference: `def time_split(rows, test_days):
    days = sorted({row['day'] for row in rows})
    if test_days <= 0:
        return list(rows), []
    test_days_set = set(days[-test_days:])
    train = [row for row in rows if row['day'] not in test_days_set]
    test = [row for row in rows if row['day'] in test_days_set]
    return train, test
`,
      sampleTests: `rows = [{'day': 1}, {'day': 2}, {'day': 3}]
train, test = time_split(rows, 1)
assert train == [{'day': 1}, {'day': 2}]
assert test == [{'day': 3}]
`,
      tests: `rows = [
    {'day': 5, 'x': 'a'},
    {'day': 1, 'x': 'b'},
    {'day': 9, 'x': 'c'},
    {'day': 5, 'x': 'd'},
    {'day': 1, 'x': 'e'},
]

train, test = time_split(rows, 1)
assert [r['x'] for r in test] == ['c'], test
assert [r['x'] for r in train] == ['a', 'b', 'd', 'e'], train

# Two test days, non-contiguous days in the data.
train, test = time_split(rows, 2)
assert sorted(r['day'] for r in test) == [5, 5, 9]
assert sorted(r['day'] for r in train) == [1, 1]

# Nothing is lost or duplicated.
assert len(train) + len(test) == len(rows)

# Asking for more days than exist leaves no training data.
train, test = time_split(rows, 10)
assert train == [] and len(test) == len(rows)

# Zero test days is a no-op split.
train, test = time_split(rows, 0)
assert len(train) == len(rows) and test == []

# The original order inside each part is preserved.
ordered = [{'day': 2, 'i': 0}, {'day': 1, 'i': 1}, {'day': 2, 'i': 2}]
train, test = time_split(ordered, 1)
assert [r['i'] for r in test] == [0, 2]
`,
      writeup: l(
        'Деталь, на которой ломаются почти все первые версии: сплит делается по множеству различных дней, а не по доле строк. Если взять «последние 20% строк», то при неравномерном трафике в тест уедет полтора дня выходных, и оценка будет про выходные, а не про будущее. Вторая деталь — дни не обязаны идти подряд: в логах бывают дыры, и отсчитывать «последние N дней» от максимальной даты арифметикой неправильно, надо брать последние N из тех, что реально есть. Третья — сохранённый порядок внутри частей: на временных рядах он несёт смысл, и перемешивание здесь ничего не улучшает, зато мешает отладке.',
        'The detail almost every first version gets wrong: the split goes over the set of distinct days, not over a share of rows. Take "the last 20% of rows" and with uneven traffic a day and a half of weekend lands in the test set, so the estimate is about weekends rather than about the future. The second detail: days need not be contiguous — logs have holes, and counting "the last N days" arithmetically from the maximum date is wrong; take the last N of those that actually exist. The third: order inside each part is preserved — on time series it carries meaning, and shuffling here improves nothing while hurting debugging.',
      ),
    },
    {
      kind: 'findbug',
      id: 'sysd.data.bug-group-leak',
      lang: 'python',
      prompt: l(
        'Модель предсказывает, купит ли пользователь товар. На валидации ROC AUC 0.94, на следующей неделе в проде 0.68. Укажи строку, из-за которой валидация завышена.',
        'The model predicts whether a user will buy an item. Validation ROC AUC is 0.94, production the next week is 0.68. Point at the line that inflates the validation score.',
      ),
      code: `from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier


def fit(events):
    features = events[['price', 'position', 'hour']]
    target = events['bought']
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=0
    )
    model = GradientBoostingClassifier().fit(x_train, y_train)
    return model, model.score(x_test, y_test)`,
      buggyLines: [8],
      explanation: l(
        'В events одна строка — это одно событие, и у одного пользователя их десятки. Случайное разбиение в строке 8 раскидывает события одного и того же пользователя и в train, и в test, поэтому модель на тесте узнаёт знакомых пользователей по сочетанию цены, позиции и часа, а не предсказывает поведение нового человека. В проде каждый пользователь либо новый, либо с другим поведением — отсюда провал с 0.94 до 0.68. Чинится группировкой: GroupShuffleSplit или GroupKFold по user_id, а для этой задачи правильнее ещё и по времени, потому что прод всегда про будущее. Признаки здесь, кстати, честные: цена, позиция и час известны в момент показа, так что утечки через признак нет — ошибка ровно в разбиении.',
        'In events one row is one event, and a single user has dozens of them. The random split on line 8 scatters one user\'s events across train and test, so on the test set the model recognises familiar users by their combination of price, position and hour rather than predicting a new person\'s behaviour. In production every user is either new or behaving differently — hence the drop from 0.94 to 0.68. The cure is grouping: GroupShuffleSplit or GroupKFold on user_id, and for this task a time-based split on top, because production is always about the future. The features here are honest, incidentally: price, position and hour are known at display time, so there is no feature leakage — the mistake is exactly the split.',
      ),
    },
    {
      kind: 'sql',
      id: 'sysd.data.sql-daily',
      prompt: l(
        'Прежде чем выбирать окно обучения, посмотри на данные по дням. Для каждого дня верни дату day, число запросов queries, число запросов хотя бы с одним кликом with_click и долю таких запросов click_rate, округлённую до четырёх знаков. Отсортируй по дате по возрастанию.',
        'Before choosing a training window, look at the data day by day. For each day return the date as day, the number of queries as queries, the number of queries with at least one click as with_click, and the share of those as click_rate rounded to four decimals. Sort by date ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `SELECT
  CAST(q.ts AS DATE) AS day
FROM queries q
GROUP BY 1
ORDER BY 1`,
      reference: `WITH clicked AS (
  SELECT DISTINCT i.query_id
  FROM impressions i
  JOIN clicks c ON c.impression_id = i.impression_id
)
SELECT
  CAST(q.ts AS DATE) AS day,
  count(*) AS queries,
  count(cl.query_id) AS with_click,
  round(count(cl.query_id) * 1.0 / count(*), 4) AS click_rate
FROM queries q
LEFT JOIN clicked cl ON cl.query_id = q.query_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Запрос выглядит простым, но в нём спрятан тот же мультипликативный джойн, что в ветке SQL: если соединять queries с clicks напрямую через impressions, запрос с тремя кликами посчитается трижды, и click_rate легко перевалит за единицу. Поэтому клики сначала сворачиваются в множество query_id с DISTINCT, и только потом присоединяются левым джойном. Сам по себе этот отчёт — первое, что стоит посмотреть перед выбором окна обучения: он показывает и объём трафика по дням, и стабильность доли кликов. День, выбивающийся из ряда, почти всегда означает не изменение поведения пользователей, а инцидент сбора логов, и такие дни в обучение брать нельзя.',
        'The query looks simple but hides the same multiplying join as in the SQL branch: joining queries to clicks straight through impressions counts a query with three clicks three times, and click_rate easily goes above one. So the clicks are first collapsed into a set of query_ids with DISTINCT and only then attached with a left join. The report itself is the first thing to look at before choosing a training window: it shows both the daily traffic volume and the stability of the click share. A day that stands out almost always means a logging incident rather than a change in user behaviour, and such days must not go into training.',
      ),
      clickhouse: {
        code: `SELECT
  toDate(q.ts) AS day,
  count() AS queries,
  uniqExact(cl.query_id) AS with_click,
  round(uniqExact(cl.query_id) / count(), 4) AS click_rate
FROM queries AS q
LEFT JOIN (
  SELECT DISTINCT i.query_id
  FROM impressions AS i
  INNER JOIN clicks AS c ON c.impression_id = i.impression_id
) AS cl ON cl.query_id = q.query_id
GROUP BY day
ORDER BY day`,
        note: l(
          'toDate вместо CAST и uniqExact вместо count по подзапросу — в ClickHouse это дешевле и читается привычнее. Обрати внимание, что деление целых в ClickHouse сразу даёт Float64, так что множитель 1.0 не нужен.',
          'toDate instead of CAST and uniqExact instead of counting a subquery — in ClickHouse that is cheaper and reads more naturally. Note that integer division in ClickHouse already yields Float64, so the 1.0 multiplier is unnecessary.',
        ),
      },
    },
    {
      kind: 'quiz',
      id: 'sysd.data.q-labels',
      mode: 'multi',
      prompt: l(
        'Модель ранжирования обучается на кликах из собственной выдачи. Какие утверждения верны?',
        'A ranking model is trained on clicks from its own result pages. Which statements are true?',
      ),
      choices: [
        {
          id: 'loop',
          text: l(
            'Без поправки на позицию модель воспроизводит предпочтения текущей выдачи, а не пользователя',
            'Without a position correction the model reproduces the current ranking\'s preferences rather than the user\'s',
          ),
        },
        {
          id: 'unseen',
          text: l(
            'Документы, которые текущая выдача никогда не показывает, не получают положительных меток вообще',
            'Documents the current ranking never shows get no positive labels at all',
          ),
        },
        {
          id: 'fix-more-data',
          text: l(
            'Проблема решается накоплением большего объёма тех же логов',
            'The problem is solved by accumulating more of the same logs',
          ),
        },
        {
          id: 'exogenous',
          text: l(
            'Случайная перестановка на малой доле трафика даёт менее смещённые метки',
            'Randomly shuffling results on a small traffic share yields less biased labels',
          ),
        },
      ],
      correct: ['loop', 'unseen', 'exogenous'],
      explanation: l(
        'Клик зависит и от релевантности, и от позиции, а позицию выдала текущая модель — поэтому в сырых кликах сидит её мнение. Документы, которых она не показывает, не могут быть кликнуты и навсегда остаются с нулями: это не «мало данных», это структурная дыра, и она не закрывается объёмом, сколько логов ни накапливай. Отсюда два рабочих выхода: модель позиционного смещения, которая делит клик на вероятность просмотра, и экзогенный источник — небольшая доля трафика со случайной перестановкой или с принудительным показом кандидатов, которых обычно не видно. Второй способ дороже, зато даёт метки, не зависящие от текущей модели.',
        'A click depends both on relevance and on position, and the position came from the current model — so raw clicks carry its opinion. Documents it never shows cannot be clicked and stay at zero forever: that is not "too little data" but a structural hole, and no volume of logs closes it. Hence two working exits: a position-bias model dividing the click by the probability of examination, and an exogenous source — a small traffic share with randomised order or with forced display of candidates that are normally invisible. The second is more expensive but produces labels independent of the current model.',
      ),
    },
  ],

  sources: [
    {
      title: 'scikit-learn: common pitfalls and recommended practices',
      url: 'https://scikit-learn.org/stable/common_pitfalls.html',
      note: l(
        'Разделы про утечку данных и про группы в кросс-валидации.',
        'The sections on data leakage and on groups in cross-validation.',
      ),
    },
  ],
};
