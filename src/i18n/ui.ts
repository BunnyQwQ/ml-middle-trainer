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
      'Узлы открываются по пререквизитам. Ветки можно проходить параллельно.',
      'Nodes unlock through prerequisites. Branches can be taken in parallel.',
    ),
    locked: l('Закрыто', 'Locked'),
    needs: l('Сначала нужно', 'Requires first'),
    open: l('Открыть', 'Open'),
    boss: l('Босс', 'Boss'),
    viewTree: l('Дерево', 'Tree'),
    viewList: l('Список', 'List'),
    planned: l('В плане', 'Planned'),
    plannedHint: l(
      'Эта ветка появится на следующих этапах.',
      'This branch arrives in a later stage.',
    ),
    nodes: l('узлов', 'nodes'),
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
    starsEarned: l('Звёзды за узел', 'Stars for this node'),
    taskOf: l('Задача', 'Task'),
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
    fromNode: l('Из узла', 'From node'),
    goToTask: l('Перейти к задаче', 'Go to the task'),
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
