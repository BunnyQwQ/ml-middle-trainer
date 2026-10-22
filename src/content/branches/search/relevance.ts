import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchRelevance: SkillNode = {
  id: 'search.relevance',
  branch: 'search-metrics',
  act: 3,
  tier: 1,
  title: l('Релевантность и разметка', 'Relevance and labelling'),
  blurb: l(
    'Откуда вообще берётся «правильный ответ», по которому меряют поиск.',
    'Where the "right answer" that search is measured against actually comes from.',
  ),
  requires: ['boss.experiment'],
  theory: [
    {
      type: 'p',
      text: l(
        'Любая оффлайн-метрика поиска считается относительно разметки, и качество разметки ограничивает всё остальное. Если асессоры расходятся в половине случаев, то разница в nDCG на 0.5% между двумя моделями не значит ничего: она меньше шума в самих метках. Поэтому разговор про метрики начинается не с формул, а с того, кто и как ставит оценки.',
        'Every offline search metric is computed against labels, and the quality of those labels caps everything else. If raters disagree half the time, a 0.5% difference in nDCG between two models means nothing: it is smaller than the noise in the labels themselves. So a conversation about metrics starts not with formulas but with who assigns the grades and how.',
      ),
    },
    { type: 'h', text: l('Шкалы оценок', 'Grading scales') },
    {
      type: 'table',
      head: [l('Шкала', 'Scale'), l('Как выглядит', 'What it looks like'), l('Где уместна', 'Where it fits')],
      rows: [
        [
          l('Бинарная', 'Binary'),
          l('Релевантно / нет', 'Relevant / not'),
          l(
            'Простые задачи, быстрый сбор, обучение классификатора',
            'Simple tasks, fast collection, training a classifier',
          ),
        ],
        [
          l('Градуированная', 'Graded'),
          l(
            'Обычно 4–5 делений: идеально, отлично, хорошо, плохо, спам',
            'Usually 4–5 levels: perfect, excellent, good, bad, spam',
          ),
          l(
            'Веб-поиск и товарный поиск: нужна разница между «подходит» и «идеально подходит»',
            'Web and product search: the difference between "fits" and "fits perfectly" matters',
          ),
        ],
        [
          l('Парное сравнение', 'Pairwise'),
          l('Какой из двух документов лучше для запроса', 'Which of two documents is better for the query'),
          l(
            'Когда абсолютную оценку поставить трудно, а сравнить легко',
            'When an absolute grade is hard to assign but a comparison is easy',
          ),
        ],
        [
          l('Side-by-side выдач', 'Side-by-side of result pages'),
          l('Какая из двух выдач целиком лучше', 'Which of two whole result pages is better'),
          l(
            'Оценка изменения ранжирования в целом, а не отдельного документа',
            'Judging a ranking change as a whole rather than one document',
          ),
        ],
      ],
    },
    {
      type: 'p',
      text: l(
        'Градуированная шкала выигрывает у бинарной там, где важен порядок внутри топа: без градаций метрика не отличит выдачу, где на первом месте идеальный ответ, от выдачи, где на первом месте просто приемлемый. Парные сравнения дают более согласованную разметку — людям проще сказать «этот лучше», чем «этот на 3 из 5», — но из них сложнее собрать абсолютную метрику качества выдачи.',
        'A graded scale beats a binary one wherever the order inside the top matters: without grades a metric cannot tell a page with a perfect answer first from one with a merely acceptable answer first. Pairwise comparisons give more consistent labels — people find "this one is better" easier than "this is a 3 out of 5" — but an absolute page-quality metric is harder to assemble from them.',
      ),
    },
    { type: 'h', text: l('Согласованность разметчиков', 'Rater agreement') },
    {
      type: 'p',
      text: l(
        'Главная ошибка при измерении согласованности — смотреть на долю совпадений. Если 95% документов нерелевантны, два разметчика, которые всегда ставят «нерелевантно», совпадут в 95% случаев, не сделав никакой работы. Поправка на случайное совпадение называется каппой Коэна: из наблюдаемого согласия вычитается то, которое получилось бы при независимых ответах с теми же частотами.',
        'The main mistake in measuring agreement is looking at the share of matches. If 95% of documents are irrelevant, two raters who always say "not relevant" will match 95% of the time without doing any work at all. The correction for chance agreement is Cohen\'s kappa: the agreement that independent answers with the same marginal frequencies would produce is subtracted from the observed one.',
      ),
    },
    {
      type: 'formula',
      tex: '\\kappa = \\frac{p_o - p_e}{1 - p_e}',
      caption: l(
        'p_o — наблюдаемое согласие, p_e — согласие по случайности. Каппа 0 означает «не лучше монетки».',
        'p_o is the observed agreement, p_e the chance agreement. A kappa of 0 means "no better than a coin".',
      ),
    },
    {
      type: 'sim',
      sim: 'rater-agreement',
      title: l('Почему процент совпадений обманывает', 'Why a percentage of matches lies'),
      caption: l(
        'Поставь долю релевантных в 5% и смотри на два числа: простое согласие уходит за 90%, каппа остаётся низкой. Теперь верни 50% — и оба показателя сходятся. Отсюда два практических вывода: отчитываться надо каппой, а выборку для разметки стратифицировать, иначе почти вся работа асессоров уйдёт на очевидно нерелевантные документы.',
        'Set the share of relevant items to 5% and watch two numbers: raw agreement climbs past 90% while kappa stays low. Now put it back to 50% and the two converge. Two practical conclusions: report kappa, and stratify the labelling sample, otherwise nearly all the rater effort goes into obviously irrelevant documents.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'Каппа ниже 0.4 означает, что инструкция неоднозначна. Чинится не статистикой, а переписыванием инструкции и примерами пограничных случаев.',
          'A kappa below 0.4 means the instruction is ambiguous. The fix is not statistics but rewriting the instruction and adding borderline examples.',
        ),
        l(
          'Перекрытие: часть заданий дают нескольким асессорам. Без перекрытия согласованность неизвестна в принципе.',
          'Overlap: some tasks go to several raters. Without overlap, agreement is simply unknown.',
        ),
        l(
          'Золотой набор: задания с заранее известным ответом, подмешанные в поток. Так ловят недобросовестных и уставших.',
          'A golden set: tasks with a known answer mixed into the stream. That is how careless and tired raters are caught.',
        ),
        l(
          'Агрегация: большинством голосов для простых шкал, модели вроде Dawid-Skene — когда нужно учесть, что асессоры различаются по качеству.',
          'Aggregation: majority vote for simple scales, models such as Dawid-Skene when rater quality differences need accounting for.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Разметка стареет. Запрос «iphone» год назад и сегодня означает разные модели, и документ, бывший идеальным, становится устаревшим. Поэтому золотые наборы переразмечают, а метрики на старой разметке systematически переоценивают старые модели — те, на которых эта разметка и собиралась.',
        'Labels go stale. The query "iphone" meant different models a year ago than today, and a document that was perfect becomes outdated. So golden sets get re-labelled, and metrics on old labels systematically favour old models — the very ones the labels were collected on.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'search.relevance.q-kappa',
      mode: 'single',
      prompt: l(
        'Два асессора размечали 1000 документов, совпали в 92% случаев. Каппа Коэна оказалась 0.21. Что это означает?',
        'Two raters labelled 1000 documents and agreed in 92% of cases. Cohen\'s kappa came out at 0.21. What does that mean?',
      ),
      choices: [
        { id: 'a', text: l('Отличная согласованность, 92% — высокий показатель', 'Excellent agreement, 92% is a high number') },
        {
          id: 'b',
          text: l(
            'Почти всё совпадение объясняется перекосом классов: оба почти всегда ставят одну и ту же метку',
            'Almost all of the agreement is explained by class imbalance: both raters almost always give the same label',
          ),
        },
        { id: 'c', text: l('Каппа посчитана неверно', 'The kappa was computed incorrectly') },
        { id: 'd', text: l('Нужно больше документов', 'More documents are needed') },
      ],
      correct: ['b'],
      explanation: l(
        'При сильном перекосе классов согласие по случайности p_e близко к наблюдаемому p_o, и каппа оказывается низкой даже при высоком проценте совпадений. Содержательно это значит, что на спорных документах — а они и есть интересные — асессоры расходятся. Лечится двумя вещами: стратифицированной выборкой, где доля релевантных поднята искусственно, и переписыванием инструкции для пограничных случаев.',
        'Under strong class imbalance the chance agreement p_e sits close to the observed p_o, and kappa stays low even at a high match rate. Substantively this means the raters disagree on the contested documents — which are the interesting ones. Two things fix it: a stratified sample where the share of relevant items is raised deliberately, and rewriting the instruction for borderline cases.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.relevance.q-scale',
      mode: 'single',
      prompt: l(
        'Команда меняет ранжирование товарного поиска и хочет оценить изменение оффлайн. Какая разметка подойдёт лучше?',
        'A team is changing product search ranking and wants to evaluate the change offline. Which labelling fits best?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Бинарная: релевантен товар или нет', 'Binary: is the item relevant or not'),
        },
        {
          id: 'b',
          text: l(
            'Градуированная шкала плюс side-by-side сравнение двух выдач целиком',
            'A graded scale plus a side-by-side comparison of the two result pages as a whole',
          ),
        },
        { id: 'c', text: l('Только клики пользователей', 'User clicks only') },
        { id: 'd', text: l('Оценки продакта по десяти запросам', "The product manager's judgement on ten queries") },
      ],
      correct: ['b'],
      explanation: l(
        'При изменении ранжирования меняется порядок, а не состав выдачи, поэтому бинарная шкала почти ничего не покажет: релевантные документы остались релевантными. Нужны градации, чтобы отличить «идеально» от «приемлемо», и side-by-side, потому что пользователь воспринимает выдачу целиком, а не документ по отдельности. Клики нельзя использовать как эталон напрямую из-за позиционного смещения — это следующие узлы. Десять запросов — не выборка: на таком объёме доверительный интервал по любой метрике перекроет любой реальный эффект.',
        'A ranking change alters the order rather than the contents of the page, so a binary scale shows almost nothing: the relevant documents stayed relevant. Grades are needed to tell "perfect" from "acceptable", and side-by-side because users perceive the page as a whole rather than document by document. Clicks cannot serve as ground truth directly because of position bias — that comes in later nodes. Ten queries is not a sample: at that size the confidence interval on any metric swamps any real effect.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.relevance.q-practices',
      mode: 'multi',
      prompt: l(
        'Какие практики реально улучшают качество разметки?',
        'Which practices genuinely improve labelling quality?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Перекрытие: часть заданий размечают несколько асессоров', 'Overlap: some tasks are labelled by several raters'),
        },
        {
          id: 'b',
          text: l('Золотой набор с известными ответами в потоке заданий', 'A golden set with known answers mixed into the task stream'),
        },
        {
          id: 'c',
          text: l(
            'Инструкция с разобранными пограничными случаями, а не только с определениями',
            'An instruction with worked borderline cases rather than definitions alone',
          ),
        },
        {
          id: 'd',
          text: l(
            'Увеличить объём разметки вдвое, не меняя инструкцию',
            'Double the labelling volume without touching the instruction',
          ),
        },
        {
          id: 'e',
          text: l('Регулярно переразмечать золотой набор', 'Re-label the golden set regularly'),
        },
      ],
      correct: ['a', 'b', 'c', 'e'],
      explanation: l(
        'Объём не лечит системную ошибку: если инструкция неоднозначна, удвоение числа оценок удвоит и шум, и смещение. Перекрытие даёт возможность измерить согласованность, золотой набор — поймать недобросовестных, разобранные пограничные случаи — снизить расхождение в трактовке, а переразметка — бороться со старением меток. Полезно помнить порядок действий: сначала измерить каппу, потом чинить инструкцию, и только потом масштабировать.',
        'Volume does not cure a systematic error: if the instruction is ambiguous, doubling the number of judgements doubles both the noise and the bias. Overlap makes agreement measurable, a golden set catches careless raters, worked borderline cases reduce divergence in interpretation, and re-labelling fights label staleness. The order is worth remembering: measure kappa first, fix the instruction second, scale only then.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Cohen\'s kappa',
      url: 'https://en.wikipedia.org/wiki/Cohen%27s_kappa',
    },
    {
      title: 'Wikipedia: Inter-rater reliability',
      url: 'https://en.wikipedia.org/wiki/Inter-rater_reliability',
    },
  ],
};
