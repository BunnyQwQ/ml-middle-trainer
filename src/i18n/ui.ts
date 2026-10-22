import { isL, l, type L } from './types';

/** Interface strings. Same ru/en shape as content, so one checker covers both. */
export const UI = {
  appName: l('ML Middle Trainer', 'ML Middle Trainer'),
  tagline: l(
    'Тренажёр для выхода на middle ML-инженера',
    'A trainer for reaching middle ML engineer',
  ),
  nav: {
    map: l('Карта', 'Map'),
    metrics: l('Метрики', 'Metrics'),
    review: l('Повторение', 'Review'),
    dashboard: l('Прогресс', 'Progress'),
    settings: l('Настройки', 'Settings'),
  },
  theme: {
    toggle: l('Тема', 'Theme'),
    dark: l('Тёмная', 'Dark'),
    light: l('Светлая', 'Light'),
    system: l('Как в системе', 'System'),
  },
  lang: {
    switch: l('Язык', 'Language'),
    showOtherTitle: l('Показать на другом языке', 'Show in the other language'),
    hideOther: l('Скрыть перевод', 'Hide translation'),
  },
  map: {
    title: l('Карта навыков', 'Skill map'),
    subtitle: l(
      'Акты идут по порядку, внутри акта ветки открыты параллельно. Между актами стоят испытания.',
      'Acts run in order; inside an act the branches are open in parallel. Trials stand between the acts.',
    ),
    locked: l('Закрыто', 'Locked'),
    needs: l('Сначала нужно', 'Requires first'),
    open: l('Открыть', 'Open'),
    viewTree: l('Дерево', 'Tree'),
    viewList: l('Список', 'List'),
    planned: l('В плане', 'Planned'),
    plannedHint: l(
      'Эта ветка появится на следующих этапах.',
      'This branch arrives in a later stage.',
    ),
    nodes: l('узлов', 'nodes'),
    acts: [
      l('Акт I — Фундамент', 'Act I — Foundations'),
      l('Акт II — Эксперименты', 'Act II — Experiments'),
      l('Акт III — Качество и решения', 'Act III — Quality and decisions'),
      l('Акт IV — Специализации', 'Act IV — Specialisations'),
    ],
    actBlurbs: [
      l(
        'Выборочный шум, доверительные интервалы и первые запросы по логам.',
        'Sampling noise, confidence intervals and the first queries over logs.',
      ),
      l(
        'Гипотезы, оконные функции, сессии и устройство A/B-теста.',
        'Hypotheses, window functions, sessions and how an A/B test works.',
      ),
      l(
        'Ловушки экспериментов, метрики качества поиска и выбор метрики.',
        'Experiment pitfalls, search quality metrics and choosing a metric.',
      ),
      l(
        'Отдельные области: реклама, retrieval, бандиты, классификация запросов.',
        'Separate areas: ads, retrieval, bandits, query classification.',
      ),
    ],
    boss: l('Испытание', 'Trial'),
    bossHint: l(
      'Закрывает акт и открывает следующий. Нужно решить все задания.',
      'Closes the act and opens the next one. Every task has to be solved.',
    ),
    bossLocked: l('Сначала закрой узлы, которые в него ведут', 'First finish the nodes that lead into it'),
    actLocked: l('Откроется после испытания', 'Opens after the trial'),
    needLevel: l('Или уровень', 'Or level'),
    sideBranch: l('Боковая ветка', 'Side branch'),
  },
  node: {
    theory: l('Теория', 'Theory'),
    tasks: l('Задачи', 'Tasks'),
    task: l('Задача', 'Task'),
    check: l('Проверить', 'Check'),
    checking: l('Проверяю…', 'Checking…'),
    next: l('Дальше', 'Next'),
    prev: l('Назад', 'Back'),
    showSolution: l('Показать разбор', 'Show the write-up'),
    hideSolution: l('Скрыть разбор', 'Hide the write-up'),
    writeup: l('Разбор', 'Write-up'),
    explanation: l('Объяснение', 'Explanation'),
    reset: l('Сбросить', 'Reset'),
    completed: l('Узел пройден', 'Node completed'),
    toMap: l('К карте', 'Back to map'),
    toTasks: l('К задачам', 'To the tasks'),
    yourAnswer: l('Твой ответ', 'Your answer'),
    multiHint: l('Можно выбрать несколько вариантов', 'Several answers may apply'),
    numberHint: l('Введи число', 'Enter a number'),
    submitAnswer: l('Ответить', 'Answer'),
    correct: l('Верно', 'Correct'),
    incorrect: l('Неверно', 'Incorrect'),
    scheduledRepeat: l('Вернётся на повторение', 'Scheduled for review'),
    clickhouseNote: l('То же самое в ClickHouse', 'The same thing in ClickHouse'),
    schema: l('Схема данных', 'Schema'),
    editorHint: l('Ctrl+Enter — проверить', 'Ctrl+Enter to check'),
    checklist: l('Чек-лист самопроверки', 'Self-check list'),
    referenceAnswer: l('Эталонный разбор', 'Reference answer'),
    selfGradePrompt: l(
      'Сравни свой ответ с эталоном и отметь себя честно: карточка вернётся на повторение только если ты сам признаешь, что упустил существенное.',
      'Compare your answer with the reference and grade yourself honestly: the card comes back for review only if you admit you missed something substantial.',
    ),
    selfGradeHit: l('Раскрыл основное', 'I covered the main points'),
    selfGradeMiss: l('Упустил существенное', 'I missed something substantial'),
    starsEarned: l('Звёзды за узел', 'Stars for this node'),
    taskOf: l('Задача', 'Task'),
    metricsBreakdown: l('Разбор вариантов', 'Option by option'),
    metricNotHere: l('Не подходит ни для одного слота', 'Fits none of the slots'),
    codeUnderTest: l('Код, который надо покрыть тестами', 'The code the tests must cover'),
    mutantsHint: l(
      'Твои тесты должны проходить на этом коде и падать на каждой из сломанных версий',
      'Your tests must pass on this code and fail on every broken version',
    ),
    mutant: l('Сломанная версия', 'Broken version'),
    mutantCaught: l('Поймана тестами', 'Caught by the tests'),
    caught: l('да', 'yes'),
    survived: l('нет, прошла', 'no, it survived'),
    mutantsList: l('Какие версии ломались', 'What the broken versions were'),
  },
  verdict: {
    OK: l('OK', 'OK'),
    WA: l('WA — неверный ответ', 'WA — wrong answer'),
    RE: l('RE — ошибка выполнения', 'RE — runtime error'),
    TL: l('TL — превышено время', 'TL — time limit exceeded'),
    PENDING: l('Выполняется…', 'Running…'),
    onSample: l('Открытый тест', 'Sample test'),
    onHidden: l('Скрытые тесты', 'Hidden tests'),
    expected: l('Ожидалось', 'Expected'),
    got: l('Получено', 'Got'),
    passedTests: l('Пройдено тестов', 'Tests passed'),
    firstFail: l('Первое расхождение', 'First mismatch'),
    rowOrderMatters: l('Порядок строк важен', 'Row order matters'),
    rowOrderIgnored: l('Порядок строк не важен', 'Row order is ignored'),
    engineLoading: l(
      'Загружаю движок, первый запуск занимает несколько секунд',
      'Loading the engine, the first run takes a few seconds',
    ),
    engineFailed: l(
      'Не удалось загрузить движок. Проверь подключение к сети.',
      'Could not load the engine. Check your network connection.',
    ),
  },
  review: {
    title: l('Повторение', 'Review'),
    dueToday: l('К повторению сегодня', 'Due today'),
    empty: l('На сегодня всё повторено', 'Nothing left to review today'),
    emptyHint: l(
      'Ошибки в квизах и задачах возвращаются сюда через 1, 3, 7 и 14 дней.',
      'Quiz and task mistakes come back here after 1, 3, 7 and 14 days.',
    ),
    nextDue: l('Следующее повторение', 'Next review'),
    items: l('карточек', 'cards'),
    sessionIntro: l(
      'Задачи решаются здесь же, как в уроке. Решишь верно — карточка уедет на следующий интервал, ошибёшься — вернётся завтра.',
      'The tasks are solved right here, just as in the lesson. Get one right and the card moves to the next interval; get it wrong and it comes back tomorrow.',
    ),
    startSession: l('Начать повторение', 'Start the session'),
    sessionDone: l('Сессия закончена', 'Session finished'),
    gotRight: l('Верно', 'Right'),
    gotWrong: l('С ошибкой', 'Wrong'),
    skipped: l('Пропущено', 'Skipped'),
    stillDue: l('Осталось на сегодня', 'Still due today'),
    againRound: l('Ещё круг', 'Another round'),
    stage: l('Интервал', 'Interval'),
    lapses: l('Ошибок всего', 'Lapses'),
    openTheory: l('Открыть теорию', 'Open the theory'),
    nextCard: l('Следующая', 'Next'),
    finish: l('Завершить', 'Finish'),
    skip: l('Пропустить', 'Skip'),
    movedOn: l('Уехала на следующий интервал', 'Moved to the next interval'),
    backTomorrow: l('Вернётся завтра', 'Back tomorrow'),
  },
  dashboard: {
    title: l('Прогресс', 'Progress'),
    level: l('Уровень', 'Level'),
    xp: l('Опыт', 'XP'),
    streak: l('Серия дней', 'Day streak'),
    days: l('дн.', 'd'),
    stars: l('Звёзды', 'Stars'),
    byBranch: l('По веткам', 'By branch'),
    weakSpots: l('Слабые места', 'Weak spots'),
    weakSpotsEmpty: l('Пока нет данных об ошибках', 'No mistakes recorded yet'),
    weakSpotsHint: l(
      'Узлы с самой низкой долей верных ответов с первой попытки.',
      'Nodes with the lowest share of first-try correct answers.',
    ),
    accuracy: l('С первой попытки', 'First-try accuracy'),
    attempts: l('Попыток', 'Attempts'),
    nodesDone: l('Узлов пройдено', 'Nodes completed'),
  },
  settings: {
    title: l('Настройки', 'Settings'),
    export: l('Экспорт прогресса', 'Export progress'),
    exportHint: l(
      'Скачает JSON-файл. Им же переносится прогресс на другой ноутбук.',
      'Downloads a JSON file. Use it to move your progress to another laptop.',
    ),
    import: l('Импорт прогресса', 'Import progress'),
    importOk: l('Прогресс загружен', 'Progress imported'),
    importFail: l('Не удалось прочитать файл', 'Could not read the file'),
    wipe: l('Стереть прогресс', 'Erase progress'),
    wipeConfirm: l('Точно стереть весь прогресс?', 'Really erase all progress?'),
    storage: l('Хранилище', 'Storage'),
    storageIdb: l('IndexedDB', 'IndexedDB'),
    storageLocal: l('localStorage (резервный)', 'localStorage (fallback)'),
    storageMemory: l(
      'Хранилище браузера недоступно: прогресс не сохранится после перезагрузки.',
      'Browser storage is unavailable: progress will not survive a reload.',
    ),
  },
  common: {
    loading: l('Загрузка…', 'Loading…'),
    error: l('Ошибка', 'Error'),
    close: l('Закрыть', 'Close'),
    of: l('из', 'of'),
    sources: l('Источники', 'Sources'),
    notFound: l('Страница не найдена', 'Page not found'),
    copy: l('Скопировать', 'Copy'),
    copied: l('Скопировано', 'Copied'),
  },
  metrics: {
    title: l('Тренажёр выбора метрики', 'Metric choice trainer'),
    subtitle: l(
      'Продуктовый сценарий — и три решения: по чему итерироваться, по чему принимать решение, что не должно сломаться.',
      'A product scenario and three decisions: what to iterate on, what to decide by, and what must not break.',
    ),
    all: l('Все сценарии', 'All scenarios'),
    solved: l('Разобрано', 'Solved'),
    fromNode: l('Из узла', 'From node'),
    empty: l('Сценарии появятся вместе с ветками', 'Scenarios arrive together with the branches'),
    next: l('Следующий сценарий', 'Next scenario'),
  },
  sim: {
    run: l('Прогнать', 'Run'),
    reset: l('Сбросить', 'Reset'),
    seed: l('Сид', 'Seed'),
    newSeed: l('Новый сид', 'New seed'),
    samples: l('Выборок', 'Samples'),
    sampleSize: l('Размер выборки n', 'Sample size n'),
    distribution: l('Распределение', 'Distribution'),
    play: l('Авто', 'Auto'),
    pause: l('Пауза', 'Pause'),
    addOne: l('+1 выборка', '+1 sample'),
    addMany: l('+200 выборок', '+200 samples'),
  },
} as const;

/** Flatten any object to the list of localized pairs inside it. */
export function flattenL(
  obj: unknown,
  path = '',
  out: Array<{ path: string; value: L }> = [],
): Array<{ path: string; value: L }> {
  if (isL(obj)) {
    out.push({ path, value: obj });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => flattenL(item, `${path}[${i}]`, out));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flattenL(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}
