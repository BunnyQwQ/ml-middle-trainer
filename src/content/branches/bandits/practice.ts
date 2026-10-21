import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const banditsPractice: SkillNode = {
  id: 'bandits.practice',
  branch: 'bandits',
  tier: 3,
  title: l('Бандиты в продакшене', 'Bandits in production'),
  blurb: l(
    'Нестационарность, контекст и место бандитов между A/B и RL.',
    'Non-stationarity, context, and where bandits sit between A/B and RL.',
  ),
  requires: ['bandits.ucb-thompson'],
  theory: [
    {
      type: 'p',
      text: l(
        'Теория бандитов предполагает, что вероятности не меняются. В продукте они меняются всегда: выходит новая коллекция, начинается сезон, конкурент запускает акцию. Алгоритм, накопивший уверенность за миллион показов, на такое изменение почти не реагирует — апостериорное распределение стало настолько узким, что новые наблюдения его не двигают.',
        'Bandit theory assumes the probabilities do not change. In a product they always do: a new collection launches, a season starts, a competitor runs a promotion. An algorithm that accumulated confidence over a million impressions barely reacts to such a change — its posterior has grown so narrow that new observations cannot move it.',
      ),
    },
    {
      type: 'sim',
      sim: 'nonstationary-bandit',
      title: l('Что будет, если мир изменится', 'What happens when the world changes'),
      caption: l(
        'В момент переключения руки меняются местами: лучшая становится худшей. Алгоритм с полной памятью продолжает показывать старого лидера тысячами показов — он слишком уверен. Скользящее окно забывает прошлое и перестраивается. Уменьши окно: перестройка быстрее, но до переключения алгоритм шумнее, потому что опирается на меньше данных. Это тот же размен исследования и эксплуатации, только во времени.',
        'At the switch point the arms swap: the best becomes the worst. The full-memory algorithm keeps serving the old leader for thousands of impressions — it is too confident. The sliding window forgets the past and readjusts. Shrink the window: readjustment is faster, but before the switch the algorithm is noisier because it leans on less data. It is the same exploration-exploitation trade, moved into the time dimension.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'Скользящее окно: учитываем только последние N наблюдений. Просто, предсказуемо, требует выбора N.',
          'A sliding window: count only the last N observations. Simple, predictable, requires choosing N.',
        ),
        l(
          'Дисконтирование: старые наблюдения входят с весом gamma в степени возраста. Мягче окна и не требует резкой границы.',
          'Discounting: old observations enter with a weight of gamma to the power of their age. Gentler than a window and needs no hard boundary.',
        ),
        l(
          'Минимальная доля трафика на каждую руку: гарантирует, что ни один вариант не умрёт окончательно и изменение будет замечено.',
          'A floor on each arm\'s traffic share: guarantees no variant dies completely and that a change gets noticed.',
        ),
        l(
          'Периодический сброс статистики по расписанию или по детектору смены распределения.',
          'Periodic resets of the statistics, on a schedule or triggered by a change detector.',
        ),
      ],
    },
    { type: 'h', text: l('Контекстные бандиты и связь с ранжированием', 'Contextual bandits and the link to ranking') },
    {
      type: 'p',
      text: l(
        'Обычный бандит выбирает один вариант для всех. Контекстный получает признаки запроса и пользователя и выбирает вариант под них — то есть предсказывает награду как функцию контекста и действия, а неопределённость этого предсказания использует для исследования. Это уже почти задача ранжирования: модель оценивает ожидаемую награду каждого кандидата, а бандитская надстройка решает, когда показать кандидата, в котором модель не уверена.',
        'A plain bandit picks one variant for everybody. A contextual one receives features of the query and the user and picks a variant for them — that is, it predicts the reward as a function of context and action, and uses the uncertainty of that prediction to explore. This is nearly a ranking problem already: the model scores the expected reward of each candidate, and the bandit layer decides when to show a candidate the model is unsure about.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Отсюда прямая связь с предыдущими ветками. Модель, обученная на собственных показах, видит только то, что сама же и показала, — это позиционное смещение и петля обратной связи из ветки метрик поиска. Исследование в бандитском смысле решает ровно эту проблему: оно создаёт данные о тех кандидатах, которые иначе никогда не были бы показаны.',
        'Hence the direct link to the earlier branches. A model trained on its own impressions only ever sees what it chose to show — that is the position bias and feedback loop from the search metrics branch. Exploration in the bandit sense solves exactly that problem: it creates data about candidates that would otherwise never be shown.',
      ),
    },
    { type: 'h', text: l('Где кончается бандит и начинается RL', 'Where a bandit ends and RL begins') },
    {
      type: 'p',
      text: l(
        'Разница в одном: у бандита действие не влияет на то, какое состояние наступит дальше. Показали баннер, получили клик или нет, следующий запрос приходит независимо. В обучении с подкреплением действие меняет состояние, и приходится думать о последовательности решений и отложенной награде. Бандит — это RL с одним шагом, и именно поэтому он на порядок проще и почти всегда достаточен для задач показа и ранжирования.',
        'The difference is one thing: in a bandit the action does not influence which state comes next. You show a banner, you get a click or not, and the next request arrives independently. In reinforcement learning the action changes the state, and you have to reason about sequences of decisions and delayed rewards. A bandit is one-step RL, which is exactly why it is an order of magnitude simpler and almost always sufficient for serving and ranking problems.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Полноценный RL в рекомендациях оправдан, когда действие меняет будущее состояние пользователя: показали дешёвый товар — изменили представление о ценовом сегменте, и следующая сессия пойдёт иначе. Но цена высока: нужна симуляция среды или офлайн-оценка политики, а она в рекомендациях очень хрупкая. На практике почти всегда начинают с контекстного бандита, и до RL доходят единицы.',
        'Full RL in recommendations is justified when the action changes the user\'s future state: show a cheap item and you have changed their perceived price segment, so the next session unfolds differently. But the price is high: you need either a simulator of the environment or off-policy evaluation, and the latter is very fragile in recommendations. In practice almost everyone starts with a contextual bandit, and few get as far as RL.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'bandits.practice.q-nonstationary',
      mode: 'single',
      prompt: l(
        'Бандит работает полгода и уверенно показывает один баннер. Маркетинг запустил новую акцию, и объективно лучшим стал другой вариант. Алгоритм не замечает этого неделями. Почему?',
        'A bandit has been running for six months and confidently serves one banner. Marketing launched a new promotion and a different variant became objectively better. The algorithm does not notice for weeks. Why?',
      ),
      choices: [
        { id: 'a', text: l('Баг в реализации', 'A bug in the implementation') },
        {
          id: 'b',
          text: l(
            'Накопленная статистика слишком велика: новые наблюдения почти не двигают апостериорное распределение, а проигравшей руке к тому же почти не достаётся показов',
            'The accumulated statistics are too large: new observations barely move the posterior, and the losing arm hardly gets impressions anyway',
          ),
        },
        { id: 'c', text: l('Thompson sampling не работает на длинных горизонтах', 'Thompson sampling does not work over long horizons') },
        { id: 'd', text: l('Нужно увеличить число рук', 'The number of arms should be increased') },
      ],
      correct: ['b'],
      explanation: l(
        'Две причины складываются. Первая: при миллионе наблюдений бета-распределение настолько узкое, что сотня новых показов сдвигает его на доли процента. Вторая, более коварная: проигравшей руке и так достаётся доля показов, близкая к нулю, поэтому новые данные по ней накапливаются крайне медленно — она не может доказать, что стала лучше, потому что ей не дают такой возможности. Лечится забыванием: окно, дисконтирование или минимальная гарантированная доля трафика. Последнее особенно полезно, потому что защищает ещё и от ситуации, когда вариант сломался технически и перестал получать клики.',
        'Two causes compound. First, with a million observations the Beta distribution is so narrow that a hundred new impressions shift it by fractions of a percent. Second and more insidious: the losing arm already receives a share of impressions near zero, so new data about it accumulates extremely slowly — it cannot prove it got better because it is never given the chance. The cure is forgetting: a window, discounting, or a guaranteed minimum traffic share. The last is particularly useful because it also protects against a variant breaking technically and silently losing its clicks.',
      ),
    },
    {
      kind: 'quiz',
      id: 'bandits.practice.q-rl',
      mode: 'single',
      prompt: l(
        'Чем задача контекстного бандита отличается от полноценного обучения с подкреплением?',
        'How does a contextual bandit problem differ from full reinforcement learning?',
      ),
      choices: [
        { id: 'a', text: l('Бандит не использует признаки', 'A bandit uses no features') },
        {
          id: 'b',
          text: l(
            'В бандите действие не влияет на следующее состояние, поэтому нет последовательности решений и отложенной награды',
            'In a bandit the action does not affect the next state, so there is no sequence of decisions and no delayed reward',
          ),
        },
        { id: 'c', text: l('Бандит работает только с двумя вариантами', 'A bandit only works with two variants') },
        { id: 'd', text: l('В RL не бывает исследования', 'There is no exploration in RL') },
      ],
      correct: ['b'],
      explanation: l(
        'Контекстный бандит признаки как раз использует — это и делает его контекстным. Принципиальное отличие в отсутствии динамики состояния: награда приходит сразу и не зависит от того, что мы делали раньше. Из этого следует, что задача распадается на независимые эпизоды длины один, и не нужны ни уравнение Беллмана, ни оценка ценности состояния. Практический вывод: если в твоей задаче действие не меняет будущее поведение пользователя заметным образом, RL не нужен — он добавит сложности и хрупкости без выигрыша.',
        'A contextual bandit does use features — that is what makes it contextual. The fundamental difference is the absence of state dynamics: the reward arrives immediately and does not depend on what we did earlier. It follows that the problem decomposes into independent episodes of length one, and neither the Bellman equation nor a state value estimate is needed. The practical conclusion: if in your problem the action does not noticeably change the user\'s future behaviour, RL is unnecessary — it adds complexity and fragility with no gain.',
      ),
    },
    {
      kind: 'quiz',
      id: 'bandits.practice.q-exploration-ranking',
      mode: 'multi',
      prompt: l(
        'Как исследование в бандитском смысле помогает ранжированию?',
        'How does bandit-style exploration help ranking?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Создаёт данные о документах, которые текущая модель никогда бы не показала',
            'It creates data about documents the current model would never have shown',
          ),
        },
        {
          id: 'b',
          text: l(
            'Разрывает петлю обратной связи, в которой модель учится на собственных показах',
            'It breaks the feedback loop in which the model learns from its own impressions',
          ),
        },
        {
          id: 'c',
          text: l(
            'Даёт частично несмещённую оценку того, что было бы при другом ранжировании',
            'It yields a partly unbiased estimate of what would have happened under a different ranking',
          ),
        },
        {
          id: 'd',
          text: l('Улучшает качество выдачи прямо сейчас', 'It improves the quality of the results right now'),
        },
      ],
      correct: ['a', 'b', 'c'],
      explanation: l(
        'Исследование по определению ухудшает качество сейчас — в этом и состоит его цена, поэтому вариант d неверен. Платим мы за три вещи. Первая: данные о неизвестном, без которых модель не может узнать, что документ на двадцатой позиции на самом деле хорош. Вторая: разрыв петли, в которой текущий порядок воспроизводит сам себя. Третья, техническая: если доля исследования известна, по собранным данным можно оценивать альтернативные политики методами вроде inverse propensity scoring. В проде долю исследования держат небольшой, порядка процента трафика, и часто ограничивают её теми запросами, где цена ошибки мала.',
        'Exploration by definition makes quality worse right now — that is its price, so option d is wrong. What we buy is three things. First, data about the unknown, without which a model cannot learn that the document at position twenty is actually good. Second, breaking the loop in which the current order reproduces itself. Third, a technical one: when the exploration share is known, the collected data supports evaluating alternative policies with methods such as inverse propensity scoring. In production the exploration share is kept small, on the order of a percent of traffic, and is often restricted to queries where the cost of a mistake is low.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Multi-armed bandit',
      url: 'https://en.wikipedia.org/wiki/Multi-armed_bandit',
      note: l('Разделы про контекстные и нестационарные варианты.', 'The sections on contextual and non-stationary variants.'),
    },
    {
      title: 'Wikipedia: Reinforcement learning',
      url: 'https://en.wikipedia.org/wiki/Reinforcement_learning',
    },
  ],
};
