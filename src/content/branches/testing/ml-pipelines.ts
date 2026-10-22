import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const testingMlPipelines: SkillNode = {
  id: 'testing.ml-pipelines',
  branch: 'testing',
  act: 4,
  tier: 3,
  title: l('Тесты на данные и ML-пайплайны', 'Testing data and ML pipelines'),
  blurb: l(
    'Модель нельзя проверить на равенство эталону — но почти всё вокруг неё можно.',
    'A model cannot be checked against an expected value — but almost everything around it can.',
  ),
  requires: ['testing.fixtures'],
  theory: [
    {
      type: 'p',
      text: l(
        'Главная причина, по которой ML-код часто остаётся без тестов, звучит убедительно: результат модели нельзя сравнить с эталоном, он зависит от данных и от обучения. Это правда ровно про одно — про предсказания. Всё остальное в пайплайне проверяется обычными тестами, и именно там живут ошибки, которые дороже всего обходятся.',
        'The main reason ML code often goes untested sounds convincing: a model\'s output cannot be compared against an expected value, it depends on the data and the training. That is true of exactly one thing — the predictions. Everything else in a pipeline is checkable by ordinary tests, and that is where the most expensive mistakes live.',
      ),
    },
    { type: 'h', text: l('Четыре вида тестов, которые работают', 'Four kinds of test that work') },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'Инварианты. Предсказание вероятности лежит в [0, 1]. Сумма вероятностей классов равна единице. Ранжирование не меняется от перестановки входных документов. Эти утверждения верны при любых данных и ловят целый класс ошибок.',
          'Invariants. A probability prediction lies in [0, 1]. Class probabilities sum to one. A ranking does not change when the input documents are permuted. These claims hold for any data and catch a whole class of bugs.',
        ),
        l(
          'Схема и качество данных. Колонки на месте, типы те, диапазоны разумные, доля пропусков ниже порога, распределение не уехало. Самые дешёвые тесты с самой высокой отдачей.',
          'Schema and data quality. The columns are there, the types are right, the ranges are sane, the share of missing values is below a threshold, the distribution has not drifted. The cheapest tests with the highest payoff.',
        ),
        l(
          'Детерминированность. Два запуска с одним сидом дают один результат. Нарушается чаще, чем кажется: незафиксированный сид, порядок словаря, многопоточность, недетерминированные операции на GPU.',
          'Determinism. Two runs with the same seed give the same result. It breaks more often than you would think: an unfixed seed, dictionary order, threading, non-deterministic GPU kernels.',
        ),
        l(
          'Smoke-тест обучения. Пайплайн прогоняется на крошечной выборке за секунды и должен просто доработать до конца без исключений, а лосс — упасть хоть немного. Ловит сломанный препроцессинг, несовпадение размерностей и забытый шаг.',
          'A training smoke test. The pipeline runs on a tiny sample in seconds and must simply finish without exceptions, with the loss falling at least a little. It catches broken preprocessing, shape mismatches and a forgotten step.',
        ),
      ],
    },
    {
      type: 'sim',
      sim: 'data-checks',
      title: l('Какая проверка сработает первой', 'Which check fires first'),
      caption: l(
        'Пять типовых проверок на одном батче данных. Двигай ползунок порчи от нуля: проверка на распределение начинает ругаться задолго до того, как появятся пропуски или исчезнет колонка. Это и есть порядок, в котором данные ломаются в жизни — сначала тихо, потом громко.',
        'Five typical checks over one batch of data. Move the degradation slider up from zero: the distribution check starts complaining long before any nulls appear or a column vanishes. That is the order in which data breaks in real life — quietly first, loudly later.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Проверки данных отличаются от обычных тестов тем, что живут не только в CI, но и в проде: тот же код запускается на каждом свежем батче перед обучением и перед инференсом. Тест, который прошёл на зафиксированной выборке год назад, ничего не говорит о данных, пришедших сегодня утром.',
        'Data checks differ from ordinary tests in that they live not only in CI but in production: the same code runs on every fresh batch before training and before inference. A test that passed on a frozen sample a year ago says nothing about the data that arrived this morning.',
      ),
    },
    { type: 'h', text: l('Чистый код как условие тестируемости', 'Clean code as a precondition for testability') },
    {
      type: 'p',
      text: l(
        'Функция, которая читает файл, считает метрику и печатает результат, непроверяема в принципе: чтобы её протестировать, нужен файл и перехват вывода. Та же логика, разложенная на чтение, чистый расчёт и вывод, тестируется тривиально — расчёт принимает список и возвращает число. Поэтому требование «покрой это тестами» часто означает на деле «разложи это на части». Типизация помогает тому же: аннотация list[dict] вместо data сообщает, что подавать, а mypy ловит половину ошибок до запуска тестов.',
        'A function that reads a file, computes a metric and prints the result is untestable in principle: testing it needs a file and captured output. The same logic split into reading, a pure computation and output is trivially testable — the computation takes a list and returns a number. So the request "cover this with tests" often really means "split this up". Typing helps the same way: an annotation of list[dict] instead of data says what to pass, and mypy catches half the mistakes before the tests even run.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'write-tests',
      id: 'testing.ml-pipelines.write-validate',
      prompt: l(
        'Напиши тесты для validate_batch — функции, которая проверяет батч записей перед обучением и возвращает список кодов проблем. Правила: пустой батч даёт ["empty"]; если в записи нет ключа "score" или он не число — "schema"; если скор вне диапазона [0, 1] — "range"; если доля записей с label = None больше 1% — "nulls". Коды возвращаются отсортированными и без повторов, на корректном батче список пуст. Твои тесты должны проходить на корректной версии и падать на каждой из четырёх сломанных.',
        'Write tests for validate_batch, a function that checks a batch of records before training and returns a list of problem codes. The rules: an empty batch gives ["empty"]; a record missing the "score" key or holding a non-number gives "schema"; a score outside [0, 1] gives "range"; a share of records with label = None above 1% gives "nulls". The codes come back sorted and deduplicated, and a correct batch yields an empty list. Your tests must pass on the correct version and fail on every one of the four broken ones.',
      ),
      reference: `def validate_batch(rows):
    """Problem codes for a batch of training records."""
    if not rows:
        return ['empty']
    problems = set()
    missing_labels = 0
    for row in rows:
        score = row.get('score')
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            problems.add('schema')
        elif score < 0 or score > 1:
            problems.add('range')
        if row.get('label') is None:
            missing_labels += 1
    if missing_labels / len(rows) > 0.01:
        problems.add('nulls')
    return sorted(problems)
`,
      mutants: [
        {
          id: 'no-empty',
          label: l('Пустой батч считает корректным', 'Treats an empty batch as valid'),
          code: `def validate_batch(rows):
    problems = set()
    missing_labels = 0
    for row in rows:
        score = row.get('score')
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            problems.add('schema')
        elif score < 0 or score > 1:
            problems.add('range')
        if row.get('label') is None:
            missing_labels += 1
    if rows and missing_labels / len(rows) > 0.01:
        problems.add('nulls')
    return sorted(problems)
`,
        },
        {
          id: 'range-inclusive',
          label: l('Считает проблемой скор ровно 0 и ровно 1', 'Flags a score of exactly 0 or exactly 1'),
          code: `def validate_batch(rows):
    if not rows:
        return ['empty']
    problems = set()
    missing_labels = 0
    for row in rows:
        score = row.get('score')
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            problems.add('schema')
        elif score <= 0 or score >= 1:
            problems.add('range')
        if row.get('label') is None:
            missing_labels += 1
    if missing_labels / len(rows) > 0.01:
        problems.add('nulls')
    return sorted(problems)
`,
        },
        {
          id: 'nulls-any',
          label: l('Ругается на любой пропуск, а не на долю выше 1%', 'Complains about any null rather than a share above 1%'),
          code: `def validate_batch(rows):
    if not rows:
        return ['empty']
    problems = set()
    for row in rows:
        score = row.get('score')
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            problems.add('schema')
        elif score < 0 or score > 1:
            problems.add('range')
        if row.get('label') is None:
            problems.add('nulls')
    return sorted(problems)
`,
        },
        {
          id: 'unsorted-dupes',
          label: l('Возвращает список с повторами и без сортировки', 'Returns an unsorted list with duplicates'),
          code: `def validate_batch(rows):
    if not rows:
        return ['empty']
    problems = []
    missing_labels = 0
    for row in rows:
        score = row.get('score')
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            problems.append('schema')
        elif score < 0 or score > 1:
            problems.append('range')
        if row.get('label') is None:
            missing_labels += 1
    if missing_labels / len(rows) > 0.01:
        problems.append('nulls')
    return problems
`,
        },
      ],
      starter: `# validate_batch уже определена.
# validate_batch is already defined.

assert validate_batch([]) == ['empty']
`,
      referenceTests: `ok_row = {'score': 0.5, 'label': 1}

# Пустой батч.
assert validate_batch([]) == ['empty']

# Корректный батч не даёт проблем.
assert validate_batch([ok_row] * 10) == []

# Границы диапазона допустимы.
assert validate_batch([{'score': 0.0, 'label': 1}, {'score': 1.0, 'label': 0}]) == []

# Схема и диапазон.
assert validate_batch([{'score': 'high', 'label': 1}]) == ['schema']
assert validate_batch([{'label': 1}]) == ['schema']
assert validate_batch([{'score': 1.5, 'label': 1}]) == ['range']

# Один пропуск из ста — это ровно 1%, порога не превышает.
batch = [ok_row] * 99 + [{'score': 0.5, 'label': None}]
assert validate_batch(batch) == []

# Два пропуска из ста — уже превышает.
batch = [ok_row] * 98 + [{'score': 0.5, 'label': None}] * 2
assert validate_batch(batch) == ['nulls']

# Несколько проблем: отсортированы и без повторов.
batch = [{'score': 2.0, 'label': None}, {'score': 3.0, 'label': None}]
assert validate_batch(batch) == ['nulls', 'range']
`,
      writeup: l(
        'Три из четырёх поломок ловятся граничными случаями, и это не совпадение. Версия, считающая пустой батч корректным, видна только на пустом входе. Версия с нестрогими неравенствами — только на скоре ровно 0 или ровно 1, на 0.5 обе ведут себя одинаково. Версия, ругающаяся на любой пропуск, — только на доле ровно у порога, поэтому в наборе есть и 1 из 100, и 2 из 100: первый случай должен пройти, второй — нет. Четвёртая версия, с повторами и без сортировки, ловится проверкой на точное равенство списку из двух кодов: если сравнивать через множество или проверять вхождение, она пройдёт незамеченной. Отсюда практический вывод про такие функции: сравнивать надо результат целиком, а не наличие отдельных элементов в нём. Отдельно стоит отметить isinstance(score, bool) в реализации: в Python True — это подкласс int, и без явной проверки булево значение прошло бы как корректный скор. Такие вещи тесты ловят только тогда, когда о них подумали, и это нормально — тестов, которые ловят неизвестные заранее ошибки, не бывает.',
        'Three of the four breakages are caught by edge cases, and that is no accident. The version treating an empty batch as valid is visible only on an empty input. The version with non-strict inequalities only on a score of exactly 0 or exactly 1; at 0.5 both behave identically. The version complaining about any null only at a share exactly on the threshold, which is why the suite has both 1 in 100 and 2 in 100: the first must pass, the second must not. The fourth version, unsorted and with duplicates, is caught by comparing against an exact list of two codes: check membership or compare as sets and it slips through. Hence a practical conclusion about functions like this: compare the whole result rather than the presence of individual elements. Worth noting separately is the isinstance(score, bool) in the implementation: in Python True is a subclass of int, and without the explicit check a boolean would pass as a valid score. Tests catch such things only when someone thought of them, and that is fine — there are no tests that catch errors nobody anticipated.',
      ),
    },
    {
      kind: 'python',
      id: 'testing.ml-pipelines.py-refactor',
      prompt: l(
        'Отрефактори скрипт. Сейчас статистика по сессиям считается функцией, которая использует глобальные переменные, печатает результат и ничего не возвращает — протестировать её нельзя. Напиши вместо неё чистую функцию session_stats(events), которая принимает список событий и возвращает словарь с ключами sessions, avg_queries и click_rate. Событие — словарь с ключами session_id и clicked. sessions — число различных сессий; avg_queries — среднее число событий на сессию, округлённое до 4 знаков; click_rate — доля событий с кликом, округлённая до 4 знаков. Для пустого списка верни нули. Ничего не печатай и не используй глобальные переменные.',
        'Refactor the script. Session statistics are currently computed by a function that uses globals, prints the result and returns nothing — it cannot be tested. Write a pure function session_stats(events) instead, taking a list of events and returning a dict with the keys sessions, avg_queries and click_rate. An event is a dict with session_id and clicked. sessions is the number of distinct sessions; avg_queries is the mean number of events per session rounded to 4 decimals; click_rate is the share of events with a click rounded to 4 decimals. For an empty list return zeros. Print nothing and use no globals.',
      ),
      signature: 'def session_stats(events: list[dict]) -> dict:',
      starter: `# Было так — так тестировать нельзя:
#
# TOTAL = 0
# CLICKS = 0
# SESSIONS = set()
#
# def report(events):
#     global TOTAL, CLICKS
#     for e in events:
#         TOTAL += 1
#         SESSIONS.add(e['session_id'])
#         if e['clicked']:
#             CLICKS += 1
#     print('sessions', len(SESSIONS), 'ctr', CLICKS / TOTAL)


def session_stats(events):
    """Pure session statistics."""
    # TODO
    return {'sessions': 0, 'avg_queries': 0.0, 'click_rate': 0.0}
`,
      reference: `def session_stats(events):
    """Pure session statistics."""
    if not events:
        return {'sessions': 0, 'avg_queries': 0.0, 'click_rate': 0.0}
    sessions = {event['session_id'] for event in events}
    clicks = sum(1 for event in events if event['clicked'])
    return {
        'sessions': len(sessions),
        'avg_queries': round(len(events) / len(sessions), 4),
        'click_rate': round(clicks / len(events), 4),
    }
`,
      sampleTests: `events = [
    {'session_id': 1, 'clicked': True},
    {'session_id': 1, 'clicked': False},
    {'session_id': 2, 'clicked': False},
]
assert session_stats(events) == {'sessions': 2, 'avg_queries': 1.5, 'click_rate': 0.3333}

assert session_stats([]) == {'sessions': 0, 'avg_queries': 0.0, 'click_rate': 0.0}
`,
      tests: `import io
import contextlib

events = [
    {'session_id': 1, 'clicked': True},
    {'session_id': 1, 'clicked': False},
    {'session_id': 2, 'clicked': False},
]

# 1. The documented numbers.
assert session_stats(events) == {'sessions': 2, 'avg_queries': 1.5, 'click_rate': 0.3333}

# 2. Empty input.
assert session_stats([]) == {'sessions': 0, 'avg_queries': 0.0, 'click_rate': 0.0}

# 3. Pure: calling it twice gives the same answer, with no state carried over.
first = session_stats(events)
second = session_stats(events)
assert first == second, (first, second)

# 4. The input is not mutated.
snapshot = [dict(e) for e in events]
session_stats(events)
assert events == snapshot

# 5. Nothing is printed.
buffer = io.StringIO()
with contextlib.redirect_stdout(buffer):
    session_stats(events)
assert buffer.getvalue() == '', repr(buffer.getvalue())

# 6. Order of events does not matter.
assert session_stats(list(reversed(events))) == session_stats(events)

# 7. One session, every event clicked.
single = [{'session_id': 'x', 'clicked': True} for _ in range(5)]
assert session_stats(single) == {'sessions': 1, 'avg_queries': 5.0, 'click_rate': 1.0}

# 8. Rounding to four decimals.
odd = [{'session_id': i % 3, 'clicked': i % 7 == 0} for i in range(100)]
stats = session_stats(odd)
assert stats['sessions'] == 3
assert abs(stats['avg_queries'] - round(100 / 3, 4)) < 1e-9
assert abs(stats['click_rate'] - round(15 / 100, 4)) < 1e-9
`,
      writeup: l(
        'Рефакторинг здесь сводится к трём вещам, и каждая проверяется тестом. Первая: никаких глобальных переменных — третий тест вызывает функцию дважды и требует одинакового ответа, а исходная версия на втором вызове удвоила бы счётчики. Вторая: возвращать, а не печатать — пятый тест перехватывает stdout и требует пустоты. Третья: не менять вход — четвёртый тест сравнивает список до и после, и это важнее, чем кажется: функция, которая втихую модифицирует переданный ей список, ломает вызывающий код в самом неожиданном месте. Обрати внимание, что ни один из этих тестов не проверяет «красоту» кода, и это принципиально: тестируемые свойства — чистота, отсутствие побочных эффектов, стабильность на повторном вызове — и есть операционное определение чистого кода. Когда просят «отрефакторить», полезно сначала написать такие тесты, а потом уже двигать код: они зафиксируют поведение и не дадут сломать его по дороге.',
        'The refactor comes down to three things, and each is checked by a test. First, no globals — the third test calls the function twice and demands the same answer, while the original version would have doubled its counters on the second call. Second, return rather than print — the fifth test captures stdout and requires it empty. Third, do not mutate the input — the fourth test compares the list before and after, which matters more than it looks: a function that quietly modifies the list it was handed breaks the calling code in the least expected place. Note that none of these tests judges the beauty of the code, and that is the point: the testable properties — purity, absence of side effects, stability on repeated calls — are the operational definition of clean code. When asked to "refactor", it pays to write such tests first and move the code afterwards: they pin the behaviour down and stop you breaking it along the way.',
      ),
    },
    {
      kind: 'quiz',
      id: 'testing.ml-pipelines.q-what-to-test',
      mode: 'multi',
      prompt: l(
        'Что из этого можно и стоит покрыть автоматическими тестами в ML-пайплайне?',
        'Which of these can and should be covered by automated tests in an ML pipeline?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Что предсказанная вероятность лежит в [0, 1]', 'That a predicted probability lies in [0, 1]'),
        },
        {
          id: 'b',
          text: l(
            'Что обучение на крошечной выборке доходит до конца и лосс падает',
            'That training on a tiny sample runs to completion and the loss falls',
          ),
        },
        {
          id: 'c',
          text: l(
            'Что два запуска с одним сидом дают одинаковые веса',
            'That two runs with the same seed produce identical weights',
          ),
        },
        {
          id: 'd',
          text: l('Что nDCG модели на проде будет не ниже 0.72', 'That the model nDCG in production will be at least 0.72'),
        },
        {
          id: 'e',
          text: l(
            'Что препроцессинг выдаёт то же число колонок, что ожидает модель',
            'That preprocessing emits the same number of columns the model expects',
          ),
        },
      ],
      correct: ['a', 'b', 'c', 'e'],
      explanation: l(
        'Четвёртый вариант — не тест, а мониторинг. Значение метрики на проде зависит от данных, которые придут завтра, и зафиксировать его в CI значит получить красный билд в день, когда изменился состав трафика. Такие вещи живут в дашбордах и алертах, а не в тестах. Остальные четыре — обычные автоматические проверки: инвариант на диапазон, smoke-тест обучения, тест на детерминированность и проверка контракта между препроцессингом и моделью. Последний, кстати, ловит самую частую поломку ML-пайплайнов: добавили признак в препроцессинг, забыли переобучить модель, и в проде падает несоответствие размерностей — в лучшем случае с исключением, в худшем молча, если размерность совпала случайно.',
        'The fourth option is monitoring, not a test. A production metric value depends on the data arriving tomorrow, and freezing it in CI means a red build on the day the traffic mix changes. Such things live in dashboards and alerts rather than tests. The other four are ordinary automated checks: a range invariant, a training smoke test, a determinism test and a contract check between preprocessing and the model. The last one, incidentally, catches the most common ML pipeline breakage: a feature was added to preprocessing, the model was not retrained, and production hits a shape mismatch — with an exception if you are lucky, silently if the shapes happened to match.',
      ),
    },
  ],

  sources: [
    {
      title: 'pytest documentation',
      url: 'https://docs.pytest.org/',
    },
    {
      title: 'scikit-learn: common pitfalls and recommended practices',
      url: 'https://scikit-learn.org/stable/common_pitfalls.html',
    },
  ],
};
