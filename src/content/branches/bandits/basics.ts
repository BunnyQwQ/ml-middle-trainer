import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const banditsBasics: SkillNode = {
  id: 'bandits.basics',
  branch: 'bandits',
  act: 4,
  tier: 1,
  title: l('Исследование и эксплуатация', 'Exploration and exploitation'),
  blurb: l(
    'Задача про выбор, в которой сбор информации стоит денег.',
    'A choice problem where gathering information costs money.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 7,
  theory: [
    {
      type: 'p',
      text: l(
        'Многорукий бандит — это задача, где на каждом шаге надо выбрать один из вариантов и получить награду, а истинные вероятности неизвестны. Напряжение в том, что единственный способ узнать про вариант — показать его, а каждый показ слабого варианта стоит упущенной награды. Отсюда два полюса: эксплуатация — показывать лучшее из известного, исследование — тратить показы на то, в чём не уверен.',
        'A multi-armed bandit is a problem where at each step you pick one option and get a reward, while the true probabilities are unknown. The tension is that the only way to learn about an option is to show it, and every impression of a weak option costs forgone reward. Hence the two poles: exploitation, showing the best known option, and exploration, spending impressions on what you are unsure about.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Качество стратегии меряют не наградой, а сожалением: насколько меньше мы получили по сравнению с тем, кто с самого начала знал лучший вариант. Сожаление накапливается, и вся теория бандитов — про то, как быстро оно растёт. Линейный рост означает, что алгоритм ошибается постоянно; логарифмический — что со временем он почти перестаёт ошибаться.',
        'The quality of a strategy is measured not by reward but by regret: how much less we earned compared with someone who knew the best option from the start. Regret accumulates, and the whole theory of bandits is about how fast it grows. Linear growth means the algorithm keeps making mistakes forever; logarithmic growth means it practically stops.',
      ),
    },
    { type: 'formula', tex: 'R_T = \\sum_{t=1}^{T}\\left(\\mu^* - \\mu_{a_t}\\right)' },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Жадная стратегия — показывать текущего лидера — даёт линейное сожаление и в этом смысле худшая из разумных. Причина в том, что лучший вариант может неудачно начать: две неудачи подряд на старте, и он больше никогда не получит показа, потому что для этого его надо показать.',
        'The greedy strategy — always show the current leader — gives linear regret and is in that sense the worst of the sensible ones. The reason is that the best option can start badly: two failures in a row at the beginning and it never gets another impression, because getting one requires being shown.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Простейшее лекарство — ε-greedy: с вероятностью epsilon показываем случайный вариант, иначе лучший. Сожаление остаётся линейным, потому что доля epsilon тратится впустую всегда, даже когда ответ давно известен. Зато стратегия понятна, тривиально реализуется и не ломается в неприятных случаях, поэтому в проде встречается чаще, чем теоретически оптимальные варианты.',
        'The simplest remedy is ε-greedy: with probability epsilon show a random option, otherwise the best one. The regret stays linear, because the epsilon share is always wasted, even long after the answer is known. But the strategy is easy to understand, trivial to implement and does not break in awkward cases, which is why it appears in production more often than the theoretically optimal ones.',
      ),
    },
    {
      type: 'sim',
      sim: 'epsilon-tradeoff',
      title: l('Где оптимум epsilon', 'Where the optimal epsilon sits'),
      caption: l(
        'Средняя награда как функция epsilon, посчитанная прогоном. Слева жадная стратегия, которая часто фиксируется не на той руке, справа — полностью случайный показ. Удлини эксперимент: оптимум сдвигается влево, потому что на длинном горизонте исследовать нужно меньше. Уменьши отрыв лучшей руки: оптимум сдвигается вправо, потому что различить руки становится труднее.',
        'Average reward as a function of epsilon, computed by simulation. On the left is the greedy strategy, which often locks onto the wrong arm; on the right is fully random serving. Lengthen the horizon: the optimum moves left, because a long run needs less exploration. Shrink the lead of the best arm: the optimum moves right, because telling the arms apart gets harder.',
      ),
    },
    { type: 'h', text: l('Чем это отличается от A/B-теста', 'How this differs from an A/B test') },
    {
      type: 'table',
      head: [l('Что сравниваем', 'Dimension'), l('A/B-тест', 'A/B test'), l('Бандит', 'Bandit')],
      rows: [
        [
          l('Распределение трафика', 'Traffic allocation'),
          l('Фиксированное на всё время', 'Fixed for the whole run'),
          l('Меняется по мере накопления данных', 'Shifts as data accumulates'),
        ],
        [
          l('Цель', 'Goal'),
          l('Оценить эффект и принять решение', 'Estimate the effect and make a decision'),
          l('Максимизировать суммарную награду', 'Maximise total reward'),
        ],
        [
          l('Цена ожидания', 'Cost of waiting'),
          l('Половина трафика видит худший вариант до конца', 'Half the traffic sees the worse variant to the end'),
          l('Доля худшего варианта падает со временем', 'The share of the worse variant falls over time'),
        ],
        [
          l('Что получаем на выходе', 'What you get at the end'),
          l('Несмещённую оценку эффекта с интервалом', 'An unbiased effect estimate with an interval'),
          l('Хорошую награду и смещённые оценки', 'Good reward and biased estimates'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Последняя строка — та, которую забывают. Бандит собирает данные адаптивно, поэтому выборка по каждой руке не случайна: плохие руки перестают показывать ровно тогда, когда им не везёт. Из-за этого средние по рукам смещены, и обычные доверительные интервалы к ним неприменимы. Если нужна именно оценка эффекта, а не максимум награды, честнее фиксированный A/B.',
        'The last line is the one people forget. A bandit collects data adaptively, so the sample for each arm is not random: a weak arm stops being shown exactly when it is unlucky. The per-arm means are therefore biased, and ordinary confidence intervals do not apply. If what you need is an effect estimate rather than maximum reward, a fixed A/B is the honest choice.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'bandits.basics.q-greedy',
      mode: 'single',
      prompt: l(
        'Почему чисто жадная стратегия даёт линейное сожаление?',
        'Why does a purely greedy strategy give linear regret?',
      ),
      choices: [
        { id: 'a', text: l('Она слишком много исследует', 'It explores too much') },
        {
          id: 'b',
          text: l(
            'Она может навсегда зафиксироваться на неверной руке: чтобы переоценить руку, её надо показать, а она не показывается',
            'It can lock onto the wrong arm forever: re-evaluating an arm requires showing it, and it is never shown',
          ),
        },
        { id: 'c', text: l('Она не умеет работать с более чем двумя руками', 'It cannot handle more than two arms') },
        { id: 'd', text: l('Она слишком медленная', 'It is too slow') },
      ],
      correct: ['b'],
      explanation: l(
        'Жадная стратегия исследует ровно ноль. Если лучшая рука на первых показах не сработала, её оценка окажется ниже оценки соперницы, и больше ей показов не достанется — а значит, оценка никогда не исправится. Вероятность такого залипания не мала: при конверсии 20% и трёх первых показах шанс не получить ни одного успеха равен 0.8³ ≈ 51%. Отсюда и линейность: ошибка не исправляется, и потери копятся с постоянной скоростью.',
        'A greedy strategy explores exactly zero. If the best arm fails on its first impressions, its estimate falls below a rival\'s and it never gets another impression — so the estimate is never corrected. The chance of such lock-in is not small: at a 20% conversion and three first impressions, the probability of no success at all is 0.8³ ≈ 51%. Hence linearity: the error is never fixed and losses accumulate at a constant rate.',
      ),
    },
    {
      kind: 'quiz',
      id: 'bandits.basics.q-when-bandit',
      mode: 'multi',
      prompt: l(
        'В каких ситуациях бандит уместнее фиксированного A/B-теста?',
        'In which situations is a bandit more appropriate than a fixed A/B test?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Выбор из двадцати вариантов баннера на распродажу, которая идёт три дня',
            'Choosing among twenty banner variants for a three-day sale',
          ),
        },
        {
          id: 'b',
          text: l(
            'Нужно оценить, насколько именно новая модель ранжирования лучше старой, с доверительным интервалом',
            'You need to estimate by exactly how much the new ranking model beats the old one, with a confidence interval',
          ),
        },
        {
          id: 'c',
          text: l(
            'Подбор порядка блоков на главной, где варианты можно менять постоянно',
            'Choosing the order of blocks on a home page, where variants can be changed continuously',
          ),
        },
        {
          id: 'd',
          text: l(
            'Решение о раскатке изменения, которое повлияет на выручку и требует согласования',
            'A rollout decision for a change that affects revenue and needs sign-off',
          ),
        },
      ],
      correct: ['a', 'c'],
      explanation: l(
        'Бандит выигрывает там, где цель — суммарная награда, вариантов много, а горизонт короткий: за три дня распродажи фиксированный A/B на двадцать вариантов не успеет набрать мощность, и половина трафика будет потрачена на заведомо плохие баннеры. Там же, где нужен именно ответ «на сколько лучше» с интервалом — для согласования, для расчёта экономики, для решения о раскатке, — бандит не подходит: его оценки смещены адаптивным сбором. Существуют и гибриды: бандит с ограничением снизу на долю трафика каждой руки даёт и приличную награду, и пригодные для анализа данные.',
        'A bandit wins where the goal is total reward, the variants are many and the horizon is short: over a three-day sale a fixed A/B across twenty variants will never reach power, and half the traffic goes to obviously bad banners. Where the answer needed is "by how much, with an interval" — for sign-off, for unit economics, for a rollout decision — a bandit does not fit: its estimates are biased by adaptive collection. Hybrids exist too: a bandit with a floor on each arm\'s traffic share gives both decent reward and analysable data.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Multi-armed bandit',
      url: 'https://en.wikipedia.org/wiki/Multi-armed_bandit',
    },
  ],
};
