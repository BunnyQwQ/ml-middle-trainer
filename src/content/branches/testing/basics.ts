import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const testingBasics: SkillNode = {
  id: 'testing.basics',
  branch: 'testing',
  act: 4,
  tier: 1,
  title: l('Первый тест', 'The first test'),
  blurb: l(
    'Зачем они нужны, как выглядят и почему покрытие ничего не доказывает.',
    'What they are for, what they look like, and why coverage proves nothing.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 5,
  theory: [
    {
      type: 'p',
      text: l(
        'Тесты нужны не для галочки и не ради процента покрытия. У них ровно одна практическая задача: позволить менять код без страха. Пока тестов нет, каждая правка в функции, которую используют в четырёх местах, — это лотерея, и единственная защита от неё — не трогать код вообще. Именно так появляются файлы, которые никто не рефакторит годами.',
        'Tests are not a formality and not about a coverage percentage. They have exactly one practical job: to let you change code without fear. Until they exist, every edit to a function used in four places is a lottery, and the only defence is not touching the code at all. That is precisely how files nobody has refactored in years come about.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Самый простой тест — это функция, имя которой начинается с test_, и внутри assert. Никакого фреймворка для этого не нужно, но pytest находит такие функции сам, красиво показывает, что именно не сошлось, и умеет всё остальное, о чём пойдёт речь дальше.',
        'The simplest test is a function whose name starts with test_ and which contains an assert. No framework is required for that, but pytest discovers such functions by itself, shows exactly what failed in a readable way, and handles everything else discussed later.',
      ),
    },
    {
      type: 'code',
      lang: 'python',
      code: `# metrics.py
def ctr(clicks, shows):
    if shows == 0:
        return 0.0
    return clicks / shows


# test_metrics.py
from metrics import ctr


def test_ctr_counts_a_simple_case():
    assert ctr(1, 2) == 0.5


def test_ctr_survives_zero_shows():
    assert ctr(5, 0) == 0.0`,
      caption: l(
        'Запускается командой pytest в корне проекта. Он сам найдёт файлы test_*.py и функции test_*.',
        'Run it with pytest at the project root. It finds test_*.py files and test_* functions on its own.',
      ),
    },
    { type: 'h', text: l('Из чего состоит хороший тест', 'What a good test is made of') },
    {
      type: 'list',
      items: [
        l(
          'Проверяет одно утверждение. Если тест упал, из его имени должно быть понятно, что сломалось, без чтения кода.',
          'Checks one claim. When it fails, its name alone should say what broke, without reading the code.',
        ),
        l(
          'Не зависит от других тестов и от порядка запуска. Общее состояние между тестами — источник ошибок, которые воспроизводятся через раз.',
          'Does not depend on other tests or on the run order. Shared state between tests is the source of bugs that reproduce every other time.',
        ),
        l(
          'Не ходит в сеть, в базу и к текущей дате. Такой тест падает не когда код сломан, а когда упал интернет или наступил високосный год.',
          'Does not touch the network, the database or the current date. Such a test fails not when the code is broken but when the internet is down or a leap year arrives.',
        ),
        l(
          'Быстрый. Набор, который идёт десять минут, перестают запускать перед коммитом, и он превращается в украшение репозитория.',
          'Fast. A suite that takes ten minutes stops being run before commits and becomes an ornament in the repository.',
        ),
      ],
    },
    { type: 'h', text: l('Покрытие против мутаций', 'Coverage versus mutations') },
    {
      type: 'p',
      text: l(
        'Покрытие измеряет, какие строки выполнились во время тестов. Это полезная метрика с одним фатальным свойством: она не знает, проверил ли тест хоть что-нибудь. Тест, который вызывает функцию и не делает ни одного assert, даёт стопроцентное покрытие. Честный вопрос звучит иначе: если я сломаю код вот так, заметят ли тесты?',
        'Coverage measures which lines executed during the tests. It is a useful metric with one fatal property: it does not know whether the test checked anything. A test that calls a function and asserts nothing yields a hundred percent coverage. The honest question is different: if I break the code like this, will the tests notice?',
      ),
    },
    {
      type: 'sim',
      sim: 'mutation-testing',
      title: l('Какие поломки поймают твои тесты', 'Which breakages your tests will catch'),
      caption: l(
        'Пять вариантов сломанного кода и пять кандидатов в тесты. Каждая галочка реально прогоняется против каждой версии прямо здесь — таблица справа не заготовлена заранее. Начни с одного теста и добавляй, пока не поймаешь все пять: заодно увидишь, что один тест на граничный случай стоит трёх на середину диапазона.',
        'Five broken versions of the code and five candidate tests. Every tick is actually executed against every version right here — the table on the right is not precomputed. Start with one test and add more until all five are caught: you will see along the way that one edge-case test is worth three on the middle of the range.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Эта идея называется мутационным тестированием, и в задаче ниже она применяется буквально: ты пишешь тесты, а проверяющая система запускает их против правильной реализации и против нескольких сломанных. Набор, который пропускает хоть одну поломку, не засчитывается.',
        'This idea is called mutation testing, and the task below applies it literally: you write the tests and the grader runs them against the correct implementation and against several broken ones. A suite that lets a single breakage through does not count.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'write-tests',
      id: 'testing.basics.write-topk',
      prompt: l(
        'Напиши тесты для функции top_k, которая возвращает идентификаторы k документов с наибольшим скором. При равных скорах документы упорядочиваются по идентификатору. Твои тесты должны проходить на корректной реализации и падать на каждой из пяти сломанных версий. Пиши обычные assert в глобальной области — pytest тут не нужен, функция top_k уже определена.',
        'Write tests for top_k, which returns the ids of the k highest-scoring documents. Ties are ordered by id. Your tests must pass on the correct implementation and fail on every one of the five broken versions. Write plain asserts at module level — pytest is not needed here, and top_k is already defined.',
      ),
      reference: `def top_k(scores, k):
    """Ids of the k highest-scoring documents, ties broken by id."""
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [doc for doc, _ in ordered[:k]]
`,
      mutants: [
        {
          id: 'no-tiebreak',
          label: l(
            'Сортирует только по скору, без разрыва ничьей по идентификатору',
            'Sorts by score only, with no tie-break on the id',
          ),
          code: `def top_k(scores, k):
    ordered = sorted(scores.items(), key=lambda kv: -kv[1])
    return [doc for doc, _ in ordered[:k]]
`,
        },
        {
          id: 'ignores-k',
          label: l('Игнорирует k и возвращает всё', 'Ignores k and returns everything'),
          code: `def top_k(scores, k):
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [doc for doc, _ in ordered]
`,
        },
        {
          id: 'ascending',
          label: l('Сортирует по возрастанию скора', 'Sorts by ascending score'),
          code: `def top_k(scores, k):
    ordered = sorted(scores.items(), key=lambda kv: (kv[1], kv[0]))
    return [doc for doc, _ in ordered[:k]]
`,
        },
        {
          id: 'returns-scores',
          label: l('Возвращает скоры вместо идентификаторов', 'Returns scores instead of ids'),
          code: `def top_k(scores, k):
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [score for _, score in ordered[:k]]
`,
        },
        {
          id: 'off-by-one',
          label: l('Берёт на один документ больше', 'Takes one document too many'),
          code: `def top_k(scores, k):
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [doc for doc, _ in ordered[:k + 1]]
`,
        },
      ],
      starter: `# Функция top_k уже определена. Пиши проверки здесь.
# top_k is already defined. Write your checks here.

assert top_k({'a': 0.9, 'b': 0.5}, 1) == ['a']
`,
      referenceTests: `# Порядок: лучший документ первым.
assert top_k({'a': 0.2, 'b': 0.9, 'c': 0.5}, 3) == ['b', 'c', 'a']

# Ограничение по k.
assert top_k({'a': 0.2, 'b': 0.9, 'c': 0.5}, 2) == ['b', 'c']
assert len(top_k({'a': 0.2, 'b': 0.9, 'c': 0.5}, 1)) == 1

# Ничья разрывается по идентификатору, а не по порядку вставки.
assert top_k({'b': 1.0, 'a': 1.0}, 2) == ['a', 'b']

# Возвращаются именно идентификаторы.
assert top_k({'doc-1': 0.7}, 1) == ['doc-1']

# Граничные случаи.
assert top_k({}, 3) == []
assert top_k({'a': 0.5}, 0) == []
assert top_k({'a': 0.5}, 10) == ['a']
`,
      writeup: l(
        'Разберём, какой тест какую поломку ловит, потому что это и есть навык. Проверка порядка на трёх разных скорах ловит сортировку по возрастанию. Проверка длины результата ловит версию, которая игнорирует k. Проверка ровно на равных скорах с идентификаторами, вставленными в обратном алфавитном порядке, ловит отсутствие разрыва ничьей — и это единственный способ её поймать, потому что сортировка в Python устойчива и при разных скорах обе версии совпадают. Сравнение со списком строк ловит версию, возвращающую скоры. А вот версию с k + 1 простая проверка длины на словаре из трёх документов и k = 3 не поймает: срез [:4] от трёх элементов даст те же три. Нужен либо k меньше размера словаря, либо явное сравнение со списком. Это типичная ловушка: тест, который формально есть, но на выбранных данных ничего не проверяет. Общее правило, которое стоит унести: граничные случаи — пустой вход, k = 0, k больше размера, равные значения — ловят больше поломок, чем любое количество проверок на середине диапазона.',
        'Let us walk through which test catches which breakage, because that is the skill. Checking the order on three distinct scores catches the ascending sort. Checking the length of the result catches the version that ignores k. Checking a case with exactly equal scores and ids inserted in reverse alphabetical order catches the missing tie-break — and it is the only way to catch it, because Python sorting is stable and with distinct scores both versions agree. Comparing against a list of strings catches the version returning scores. The k + 1 version, though, is not caught by a plain length check on a three-document dict with k = 3: a [:4] slice of three elements still gives three. You need either a k below the dict size or an explicit comparison against a list. This is a classic trap: a test that formally exists but checks nothing on the data chosen. The general rule worth taking away: edge cases — empty input, k = 0, k larger than the collection, equal values — catch more breakages than any number of checks in the middle of the range.',
      ),
    },
    {
      kind: 'quiz',
      id: 'testing.basics.q-coverage',
      mode: 'single',
      prompt: l(
        'В проекте покрытие тестами 95%. Что это гарантирует?',
        'A project has 95% test coverage. What does that guarantee?',
      ),
      choices: [
        { id: 'a', text: l('Что в коде почти нет ошибок', 'That the code is nearly bug-free') },
        {
          id: 'b',
          text: l(
            'Только то, что 95% строк выполнялись во время прогона. Проверял ли тест результат — покрытие не знает',
            'Only that 95% of the lines executed during the run. Whether a test checked the result, coverage does not know',
          ),
        },
        { id: 'c', text: l('Что 95% поломок будут пойманы', 'That 95% of breakages will be caught') },
        { id: 'd', text: l('Что код хорошо структурирован', 'That the code is well structured') },
      ],
      correct: ['b'],
      explanation: l(
        'Покрытие — метрика исполнения, а не проверки. Тест, который просто вызывает функцию в try-except и ничего не утверждает, даёт стопроцентное покрытие и ноль пользы. Практический смысл у покрытия всё же есть, но обратный: низкое покрытие честно указывает на непротестированные куски, а высокое ничего не доказывает. Поэтому его полезно использовать как фильтр «на что посмотреть», а не как цель. Вопрос, на который стоит отвечать вместо этого, — мутационный: какие изменения кода пройдут мимо тестов.',
        'Coverage is a metric of execution, not of checking. A test that merely calls a function inside a try-except and asserts nothing yields a hundred percent coverage and zero value. Coverage does have practical use, but in the opposite direction: low coverage honestly points at untested chunks, while high coverage proves nothing. So it is useful as a "where to look" filter rather than a target. The question to answer instead is the mutation one: which changes to the code would slip past the tests.',
      ),
    },
    {
      kind: 'quiz',
      id: 'testing.basics.q-bad-tests',
      mode: 'multi',
      prompt: l(
        'Какие из этих тестов плохи и почему их придётся чинить?',
        'Which of these tests are bad and will need fixing?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Тест скачивает свежие логи из прода и проверяет на них метрику',
            'A test downloads fresh production logs and checks a metric on them',
          ),
        },
        {
          id: 'b',
          text: l(
            'Тест проверяет, что отчёт за «сегодня» содержит сегодняшнюю дату',
            'A test checks that a report for "today" contains today\'s date',
          ),
        },
        {
          id: 'c',
          text: l(
            'Тест записывает результат в файл, который читает следующий тест',
            'A test writes a result to a file that the next test reads',
          ),
        },
        {
          id: 'd',
          text: l(
            'Тест проверяет функцию на трёх заранее выписанных входах и ожидаемых выходах',
            'A test checks a function on three hard-coded inputs and expected outputs',
          ),
        },
      ],
      correct: ['a', 'b', 'c'],
      explanation: l(
        'Первый зависит от сети и от того, что сейчас в проде: он будет падать по ночам и зеленеть днём, и доверие к набору исчезнет за неделю. Второй зависит от часов — классика, которая ломается в полночь и в другом часовом поясе; лечится тем, что время передаётся в функцию параметром, а не берётся из datetime.now() внутри. Третий связывает тесты порядком запуска: по отдельности каждый зелёный, вместе — как повезёт, а при параллельном запуске совсем беда. Четвёртый вариант — это и есть нормальный тест: фиксированные данные, фиксированный ожидаемый результат, никакой зависимости от внешнего мира.',
        'The first depends on the network and on what production holds right now: it will fail at night and pass during the day, and trust in the suite evaporates within a week. The second depends on the clock — a classic that breaks at midnight and in another timezone; the cure is passing time into the function as a parameter rather than taking datetime.now() inside. The third couples tests through run order: each is green alone, together it is luck, and under parallel execution it is hopeless. The fourth option is simply a normal test: fixed data, a fixed expected result, no dependence on the outside world.',
      ),
    },
  ],

  sources: [
    {
      title: 'pytest documentation',
      url: 'https://docs.pytest.org/',
    },
  ],
};
