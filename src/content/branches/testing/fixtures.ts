import { l, same } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const testingFixtures: SkillNode = {
  id: 'testing.fixtures',
  branch: 'testing',
  act: 4,
  tier: 2,
  title: l('Фикстуры, параметризация, моки', 'Fixtures, parametrisation, mocks'),
  blurb: l(
    'Инструменты, которые убирают копипасту из тестов — и три способа ими злоупотребить.',
    'The tools that remove copy-paste from tests — and three ways to misuse them.',
  ),
  requires: ['testing.basics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Когда тестов становится больше десяти, в них появляется копипаста: одни и те же данные, одна и та же подготовка. Фикстура — это функция, результат которой pytest подставляет в тест по имени аргумента. Выглядит как магия, работает просто: pytest смотрит на имена параметров тестовой функции и ищет фикстуры с такими именами.',
        'Once there are more than ten tests, copy-paste appears in them: the same data, the same setup. A fixture is a function whose result pytest passes into a test by the name of its argument. It looks like magic and works plainly: pytest reads the parameter names of the test function and looks for fixtures with those names.',
      ),
    },
    {
      type: 'code',
      lang: 'python',
      code: `import pytest


@pytest.fixture
def sample_logs():
    return [
        {"query_id": 1, "position": 1, "clicked": True},
        {"query_id": 1, "position": 2, "clicked": False},
        {"query_id": 2, "position": 1, "clicked": False},
    ]


def test_ctr_on_sample(sample_logs):
    assert ctr_of(sample_logs) == pytest.approx(1 / 3)


@pytest.mark.parametrize(
    "clicks,shows,expected",
    [(1, 2, 0.5), (0, 10, 0.0), (5, 0, 0.0), (3, 3, 1.0)],
)
def test_ctr_table(clicks, shows, expected):
    assert ctr(clicks, shows) == pytest.approx(expected)`,
      caption: l(
        'Параметризация превращает четыре почти одинаковых теста в один с таблицей случаев. В отчёте они всё равно показываются по отдельности.',
        'Parametrisation turns four near-identical tests into one with a table of cases. The report still shows them separately.',
      ),
    },
    { type: 'h', text: l('Scope: как часто выполняется подготовка', 'Scope: how often the setup runs') },
    {
      type: 'p',
      text: l(
        'У фикстуры есть область видимости. По умолчанию function — фикстура выполняется заново перед каждым тестом, и это правильное умолчание: тесты изолированы. Но если фикстура поднимает базу или грузит модель на два гигабайта, выполнять её пятьдесят раз глупо, и scope расширяют до module или session. Цена известна: тесты начинают делить состояние, и один может испортить его другому.',
        'A fixture has a scope. The default is function — the fixture runs afresh before every test, and that is the right default: the tests stay isolated. But if the fixture starts a database or loads a two-gigabyte model, running it fifty times is silly, and the scope is widened to module or session. The price is known: the tests start sharing state and one can spoil it for another.',
      ),
    },
    {
      type: 'sim',
      sim: 'fixture-scope',
      title: l('Порядок setup и teardown', 'The order of setup and teardown'),
      caption: l(
        'Пять тестов в двух файлах. Переключай scope и смотри на последовательность слева: при function подготовка идёт перед каждым тестом, при session — один раз на весь прогон. Справа — цена вопроса в секундах и то, что за неё отдают: изоляцию.',
        'Five tests in two files. Switch the scope and watch the sequence on the left: with function the setup runs before every test, with session once for the whole run. On the right is the cost in seconds and what is given up for it: isolation.',
      ),
    },
    { type: 'h', text: l('Моки: чем заменяют внешний мир', 'Mocks: what replaces the outside world') },
    {
      type: 'p',
      text: l(
        'Мок — это подделка, которую подсовывают вместо настоящего объекта: вместо похода в сеть — заранее готовый ответ, вместо текущего времени — фиксированное. Правило, когда это уместно, простое: мокают то, что ты не контролируешь и что делает тест медленным или нестабильным. Сеть, файловая система, время, случайность, внешние сервисы.',
        'A mock is a fake slipped in place of the real object: a prepared answer instead of a network call, a fixed value instead of the current time. The rule for when it fits is simple: mock what you do not control and what makes the test slow or flaky. The network, the file system, time, randomness, external services.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Чем злоупотребляют: мокают собственную логику. Если тест подменяет три функции из четырёх, он проверяет не поведение системы, а то, что код вызывает те функции, которые вызывает, — то есть собственную реализацию. Такой тест падает при любом рефакторинге и не падает при настоящей поломке. Признак: в тесте моков больше, чем assert.',
        'What gets misused: mocking your own logic. If a test replaces three functions out of four, it checks not the behaviour of the system but that the code calls the functions it calls — that is, its own implementation. Such a test fails on any refactor and stays green on a real breakage. The tell: more mocks than asserts in the test.',
      ),
    },
    {
      type: 'table',
      head: [l('Что мокать', 'What to mock'), l('Что не мокать', 'What not to mock')],
      rows: [
        [
          l('HTTP-запросы к чужому сервису', 'HTTP calls to someone else\'s service'),
          l('Чистые функции своего модуля', 'Pure functions of your own module'),
        ],
        [
          l('datetime.now и random — через параметр или подмену', 'datetime.now and random — via a parameter or a patch'),
          l('Структуры данных: словарь проще мока', 'Data structures: a dict is simpler than a mock'),
        ],
        [
          l('Запись в S3, отправку письма, списание денег', 'Writing to S3, sending mail, charging money'),
          l(
            'Базу, если есть лёгкий слой вроде sqlite в памяти',
            'The database, when a light layer such as in-memory sqlite exists',
          ),
        ],
      ],
    },
  ],

  tasks: [
    {
      kind: 'write-tests',
      id: 'testing.fixtures.write-normalize',
      prompt: l(
        'Напиши тесты для normalize_query — функции, которая приводит поисковый запрос к канонической форме перед сопоставлением: обрезает пробелы по краям, схлопывает повторяющиеся пробелы, переводит в нижний регистр и заменяет «ё» на «е». Твои тесты должны проходить на корректной версии и падать на каждой из четырёх сломанных. Это как раз тот случай, где напрашивается параметризация: думай таблицей «вход — ожидаемый выход».',
        'Write tests for normalize_query, the function that brings a search query to a canonical form before matching: it trims the edges, collapses repeated spaces, lowercases, and replaces "ё" with "е". Your tests must pass on the correct version and fail on every one of the four broken ones. This is exactly the case that calls for parametrisation: think in a table of input and expected output.',
      ),
      reference: `def normalize_query(text):
    """Canonical form of a search query."""
    lowered = text.lower().replace('\\u0451', '\\u0435')
    return ' '.join(lowered.split())
`,
      mutants: [
        {
          id: 'no-lower',
          label: l('Забыли привести к нижнему регистру', 'Forgot to lowercase'),
          code: `def normalize_query(text):
    return ' '.join(text.replace('\\u0451', '\\u0435').split())
`,
        },
        {
          id: 'no-yo',
          label: l('Не заменяет «ё» на «е»', 'Does not replace "ё" with "е"'),
          code: `def normalize_query(text):
    return ' '.join(text.lower().split())
`,
        },
        {
          id: 'strip-only',
          label: l(
            'Только обрезает края, внутренние двойные пробелы остаются',
            'Only trims the edges, leaving double spaces inside',
          ),
          code: `def normalize_query(text):
    return text.lower().replace('\\u0451', '\\u0435').strip()
`,
        },
        {
          id: 'drops-spaces',
          label: l('Удаляет все пробелы, а не схлопывает', 'Removes every space instead of collapsing them'),
          code: `def normalize_query(text):
    return text.lower().replace('\\u0451', '\\u0435').replace(' ', '')
`,
        },
      ],
      starter: `# normalize_query уже определена. Таблица случаев — хороший способ начать.
# normalize_query is already defined. A table of cases is a good way to start.

cases = [
    ('  Iphone  ', 'iphone'),
]

for raw, expected in cases:
    assert normalize_query(raw) == expected, raw
`,
      referenceTests: `cases = [
    # нижний регистр
    ('IPHONE', 'iphone'),
    # обрезка краёв
    ('  iphone  ', 'iphone'),
    # схлопывание внутренних пробелов, но не удаление
    ('iphone   15  pro', 'iphone 15 pro'),
    # буква ё
    ('\\u0451\\u043b\\u043a\\u0430', '\\u0435\\u043b\\u043a\\u0430'),
    # всё сразу
    ('  \\u0427\\u0401РНЫЙ   \\u0427\\u0430\\u0439  ', '\\u0447\\u0435рный \\u0447\\u0430\\u0439'),
]

for raw, expected in cases:
    assert normalize_query(raw) == expected, (raw, normalize_query(raw))

# Пробел между словами обязан сохраниться ровно один.
assert normalize_query('a    b') == 'a b'
assert ' ' in normalize_query('two words')
`,
      writeup: l(
        'Главная ловушка здесь — четвёртая версия, которая удаляет пробелы вместо схлопывания. Тест вида normalize_query("iphone   15") == "iphone 15" ловит её сразу, а вот тест только на обрезку краёв — нет: у строки без внутренних пробелов обе версии дают одинаковый результат. Это типичная ситуация, когда кажется, что случай покрыт, а на самом деле выбранные данные не различают реализации. Второй урок в том, как устроен сам набор: пять строк таблицы вместо пяти почти одинаковых тестов. В pytest это пишется декоратором parametrize, и у него есть практическое преимущество перед циклом — каждый случай показывается в отчёте отдельной строкой, поэтому при падении сразу видно, на каком входе. Цикл с assert, как в этой задаче, тоже работает, но при падении остановится на первом же случае и остальные не проверит; поэтому в сообщение assert полезно класть сам вход.',
        'The main trap here is the fourth version, which deletes spaces instead of collapsing them. A test like normalize_query("iphone   15") == "iphone 15" catches it immediately, while a test only on trimming does not: on a string without inner spaces both versions agree. This is the classic situation where a case feels covered while the chosen data does not actually distinguish the implementations. The second lesson is the shape of the suite: five rows of a table instead of five near-identical tests. In pytest that is written with the parametrize decorator, which has a practical advantage over a loop — each case appears as its own line in the report, so a failure immediately shows which input broke. A loop with an assert, as in this task, works too, but it stops at the first failing case and never checks the rest; hence putting the input into the assert message is worth doing.',
      ),
    },
    {
      kind: 'quiz',
      id: 'testing.fixtures.q-scope',
      mode: 'single',
      prompt: l(
        'Фикстура поднимает тестовую базу за 4 секунды и используется в 30 тестах. Какой scope выбрать?',
        'A fixture starts a test database in 4 seconds and is used by 30 tests. Which scope should it have?',
      ),
      choices: [
        { id: 'a', text: l('function: изоляция важнее всего', 'function: isolation above all') },
        {
          id: 'b',
          text: l(
            'session или module, но с откатом данных между тестами — например, транзакцией',
            'session or module, but with the data rolled back between tests — in a transaction, say',
          ),
        },
        { id: 'c', text: l('session, и пусть тесты делят данные', 'session, and let the tests share the data') },
        { id: 'd', text: l('Не использовать фикстуру вовсе', 'Do not use a fixture at all') },
      ],
      correct: ['b'],
      explanation: l(
        'Чистый function здесь стоит две минуты на каждый прогон — набор перестанут запускать. Чистый session даёт связанные тесты: один создал пользователя, другой на него наткнулся, и падение воспроизводится только при полном прогоне в определённом порядке. Рабочее решение разделяет дорогое и дешёвое: поднятие базы один раз на сессию, а изоляция данных — через откат транзакции после каждого теста, что занимает миллисекунды. Тот же приём применим к загрузке модели: сам объект создаётся один раз, а состояние, которое тест меняет, восстанавливается.',
        'Pure function scope costs two minutes per run here — the suite stops being run. Pure session gives coupled tests: one creates a user, another stumbles on it, and the failure reproduces only on a full run in a particular order. The working solution separates the expensive from the cheap: start the database once per session, and isolate the data by rolling back a transaction after each test, which takes milliseconds. The same device applies to loading a model: the object is created once while whatever state a test mutates is restored.',
      ),
    },
    {
      kind: 'quiz',
      id: 'testing.fixtures.q-mocks',
      mode: 'multi',
      prompt: l(
        'Функция считает дневной отчёт: читает логи из S3, агрегирует метрики, пишет результат в базу и шлёт сообщение в Slack. Что мокать в тесте на логику агрегации?',
        'A function builds a daily report: it reads logs from S3, aggregates metrics, writes the result to a database and posts a message to Slack. What should be mocked in a test of the aggregation logic?',
      ),
      choices: [
        { id: 'a', text: l('Чтение из S3', 'The S3 read') },
        { id: 'b', text: l('Отправку в Slack', 'The Slack post') },
        { id: 'c', text: l('Саму функцию агрегации', 'The aggregation function itself') },
        { id: 'd', text: l('Запись в базу', 'The database write') },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Мокать надо всё, что выходит за границу процесса: S3, базу, Slack. Агрегацию — ни в коем случае, это и есть то, что мы проверяем; подменив её, тест превратится в проверку того, что код вызывает функцию, которую вызывает. Но есть решение лучше моков: если вынести агрегацию в отдельную чистую функцию, принимающую список записей и возвращающую словарь метрик, её можно тестировать вообще без подмен — просто передать список. Моки тогда остаются только для тонкой обвязки, которую тестируют отдельно и редко. Это общее правило: необходимость мокать много — почти всегда признак того, что логика смешана с вводом-выводом.',
        'Everything crossing the process boundary gets mocked: S3, the database, Slack. The aggregation must not be — it is the thing under test; replace it and the test becomes a check that the code calls the function it calls. But there is a better answer than mocks: extract the aggregation into a pure function taking a list of records and returning a dict of metrics, and it becomes testable with no patching at all — just pass a list. Mocks then remain only for the thin wiring, which is tested separately and rarely. That is the general rule: needing many mocks is almost always a sign that logic is entangled with I/O.',
      ),
    },
  ],

  sources: [
    {
      title: 'pytest: fixtures',
      url: 'https://docs.pytest.org/',
      note: same('@pytest.fixture, scope, parametrize, monkeypatch'),
    },
  ],
};
