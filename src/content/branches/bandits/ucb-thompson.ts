import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const banditsUcbThompson: SkillNode = {
  id: 'bandits.ucb-thompson',
  branch: 'bandits',
  act: 4,
  tier: 2,
  title: l('UCB и Thompson sampling', 'UCB and Thompson sampling'),
  blurb: l(
    'Две идеи, которые превращают линейное сожаление в логарифмическое.',
    'Two ideas that turn linear regret into logarithmic regret.',
  ),
  requires: ['bandits.basics'],
  theory: [
    {
      type: 'p',
      text: l(
        'Проблема ε-greedy в том, что исследование слепое: epsilon тратится одинаково на все руки, включая те, про которые давно всё понятно. Обе хорошие стратегии исправляют именно это — они исследуют адресно, выделяя показы туда, где неопределённость больше.',
        'The problem with ε-greedy is that its exploration is blind: epsilon is spent equally on every arm, including the ones that have long been settled. Both good strategies fix exactly that — they explore selectively, directing impressions where the uncertainty is larger.',
      ),
    },
    {
      type: 'p',
      text: l(
        'UCB следует принципу оптимизма перед лицом неопределённости: для каждой руки строим верхнюю границу доверительного интервала и показываем ту, у которой она выше. Рука выигрывает либо потому, что она действительно хороша, либо потому, что про неё мало известно — и во втором случае показ как раз и уточняет знание. Ширина границы убывает как корень из логарифма числа раундов, делённого на число показов руки.',
        'UCB follows the principle of optimism in the face of uncertainty: build an upper confidence bound for each arm and show the one whose bound is highest. An arm wins either because it is genuinely good or because little is known about it — and in the second case the impression is exactly what refines that knowledge. The width of the bound decays as the square root of the log of the round count over the arm\'s pull count.',
      ),
    },
    { type: 'formula', tex: 'UCB_a = \\hat\\mu_a + \\sqrt{\\frac{2\\ln t}{n_a}}' },
    {
      type: 'p',
      text: l(
        'Thompson sampling заходит с другой стороны. Для каждой руки держим апостериорное распределение её конверсии — для бинарной награды это бета-распределение с параметрами «успехи плюс один» и «неудачи плюс один». На каждом шаге берём по одной случайной выборке из каждого распределения и показываем ту руку, чья выборка оказалась больше. Доля показов руки автоматически равняется вероятности того, что она лучшая.',
        'Thompson sampling comes at it from the other side. For each arm keep a posterior distribution of its conversion rate — for a binary reward that is a Beta distribution with parameters "successes plus one" and "failures plus one". At each step draw one sample from each distribution and show the arm whose sample came out largest. The share of impressions an arm receives automatically equals the probability that it is the best one.',
      ),
    },
    {
      type: 'sim',
      sim: 'thompson-posteriors',
      title: l('Как выглядит знание алгоритма', "What the algorithm's knowledge looks like"),
      caption: l(
        'Три кривые — представления о трёх руках. Поставь пять раундов: кривые почти плоские, выбор случаен. Двигай ползунок к двум тысячам: кривая лучшей руки становится узкой и уезжает вправо, а кривые слабых остаются широкими — их перестали показывать, и знание о них больше не уточняется. Это не недостаток, а осознанный размен: уточнять то, что и так проигрывает, невыгодно.',
        'The three curves are the beliefs about three arms. Set five rounds: the curves are nearly flat and the choice is random. Drag towards two thousand: the best arm\'s curve narrows and moves right, while the weak arms\' curves stay wide — they stopped being shown and knowledge about them stopped improving. That is not a flaw but a deliberate trade: refining what is losing anyway does not pay.',
      ),
    },
    {
      type: 'sim',
      sim: 'bandit-regret',
      title: l('Четыре стратегии на одной задаче', 'Four strategies on one problem'),
      caption: l(
        'Накопленное сожаление. Жадная кривая прямая — ошибка не исправляется. У eps-greedy наклон меньше, но она тоже прямая: epsilon тратится всегда. UCB и Thompson загибаются — это и есть логарифмическое сожаление. Уменьши отрыв лучшей руки до половины процентного пункта: разница между стратегиями станет заметнее, а все кривые пойдут выше.',
        'Cumulative regret. The greedy curve is a straight line — the mistake is never corrected. eps-greedy has a gentler slope but is straight too: epsilon is always spent. UCB and Thompson bend, and that is logarithmic regret. Shrink the lead of the best arm to half a percentage point: the differences between strategies become sharper and every curve rises.',
      ),
    },
    {
      type: 'table',
      head: [l('Что сравниваем', 'Dimension'), l('UCB', 'UCB'), l('Thompson', 'Thompson')],
      rows: [
        [
          l('Природа', 'Nature'),
          l('Детерминированный: одинаковые данные дают одинаковый выбор', 'Deterministic: identical data gives an identical choice'),
          l('Случайный: выбор — это выборка из апостериорного', 'Randomised: the choice is a draw from the posterior'),
        ],
        [
          l('Настройка', 'Tuning'),
          l('Константа при корне, её приходится подбирать', 'A constant in front of the square root, which has to be tuned'),
          l('Ничего настраивать не надо, но нужна априорная модель награды', 'Nothing to tune, but a prior model of the reward is required'),
        ],
        [
          l('Батчи и задержка', 'Batches and delayed feedback'),
          l('Ломается: в батче все запросы получат одну и ту же руку', 'Breaks: every request in a batch gets the same arm'),
          l('Переносит хорошо: случайность сама распределяет трафик', 'Handles it well: the randomness spreads traffic on its own'),
        ],
        [
          l('На практике', 'In practice'),
          l('Реже, в основном там, где нужна воспроизводимость', 'Less common, mostly where reproducibility matters'),
          l('Чаще: проще масштабируется и устойчивее', 'More common: scales more easily and is more robust'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Строка про батчи важнее, чем кажется. В реальной системе решение принимается не по одному запросу за раз: модель обновляется раз в несколько минут, а между обновлениями приходят тысячи запросов. Детерминированный UCB выдаст им всем одну и ту же руку, то есть исследование остановится. Thompson на каждый запрос делает новую выборку и продолжает распределять трафик — поэтому в продовых системах он и победил.',
        'The row about batches matters more than it looks. In a real system decisions are not made one request at a time: the model updates every few minutes and thousands of requests arrive in between. A deterministic UCB hands them all the same arm, so exploration stops. Thompson draws afresh for every request and keeps spreading traffic — which is why it won in production systems.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'bandits.ucb-thompson.py-ucb',
      prompt: l(
        'Реализуй выбор руки по UCB1. На вход список числа показов каждой руки, список суммарных наград, номер текущего раунда (с нуля) и коэффициент c. Если есть руки, которые ещё ни разу не показывали, верни индекс первой такой — исследовать неизвестное надо в первую очередь. Иначе верни индекс руки с максимальным значением среднего плюс c, умноженное на корень из (2 · ln(t+1) / n). При равенстве выбирай меньший индекс. Пустой вход даёт -1.',
        'Implement UCB1 arm selection. The input is a list of pull counts per arm, a list of total rewards, the current round number (0-based) and a coefficient c. If any arms have never been pulled, return the index of the first such arm — the unknown gets explored first. Otherwise return the index of the arm maximising the mean plus c times the square root of (2 · ln(t+1) / n). Break ties by the smaller index. Empty input returns -1.',
      ),
      signature:
        'def ucb1_select(pulls: list[int], rewards: list[float], t: int, c: float = 1.0) -> int:',
      starter: `import math


def ucb1_select(pulls, rewards, t, c=1.0):
    """Pick the arm with the highest upper confidence bound."""
    # TODO
    return -1
`,
      reference: `import math


def ucb1_select(pulls, rewards, t, c=1.0):
    """Pick the arm with the highest upper confidence bound."""
    if not pulls:
        return -1
    for i, n in enumerate(pulls):
        if n == 0:
            return i
    best_index = 0
    best_value = float('-inf')
    for i, n in enumerate(pulls):
        mean = rewards[i] / n
        bonus = c * math.sqrt(2 * math.log(t + 1) / n)
        value = mean + bonus
        if value > best_value:
            best_value = value
            best_index = i
    return best_index
`,
      sampleTests: `# An arm that has never been pulled wins outright.
assert ucb1_select([3, 0, 5], [1.0, 0.0, 2.0], 10) == 1

# With equal counts the better mean wins.
assert ucb1_select([10, 10], [2.0, 5.0], 100) == 1

assert ucb1_select([], [], 5) == -1
`,
      tests: `import math

# 1. Unexplored arms come first, in index order.
assert ucb1_select([0, 0], [0.0, 0.0], 0) == 0
assert ucb1_select([5, 0, 0], [2.0, 0.0, 0.0], 9) == 1

# 2. With equal pull counts the bonus is identical, so the mean decides.
assert ucb1_select([20, 20, 20], [4.0, 9.0, 1.0], 60) == 1

# 3. With equal means the arm pulled less often wins: its bonus is larger.
assert ucb1_select([100, 10], [20.0, 2.0], 110) == 1

# 4. A rarely pulled arm with a worse mean can still win early on.
early = ucb1_select([50, 2], [20.0, 0.4], 52)
assert early == 1, early
# ... and loses once it has been explored enough.
late = ucb1_select([5000, 4000], [2000.0, 800.0], 9000)
assert late == 0, late

# 5. The exploration coefficient controls the balance.
assert ucb1_select([100, 5], [40.0, 1.0], 105, c=0.0) == 0
assert ucb1_select([100, 5], [40.0, 1.0], 105, c=3.0) == 1

# 6. Ties are broken by the smaller index, deterministically.
assert ucb1_select([10, 10], [5.0, 5.0], 50) == 0

# 7. Matches the formula exactly on a hand-computed case.
pulls, rewards, t, c = [4, 9], [2.0, 3.0], 20, 1.0
values = [rewards[i] / pulls[i] + c * math.sqrt(2 * math.log(t + 1) / pulls[i]) for i in range(2)]
assert ucb1_select(pulls, rewards, t, c) == (0 if values[0] >= values[1] else 1)

# 8. The bound shrinks as an arm gets pulled: the same arm is not chosen forever.
pulls = [1, 1]
rewards = [1.0, 0.0]
chosen = []
for step in range(2, 60):
    i = ucb1_select(pulls, rewards, step)
    chosen.append(i)
    pulls[i] += 1
    rewards[i] += 1.0 if i == 0 else 0.0
assert chosen.count(1) > 3, chosen.count(1)
assert chosen.count(0) > chosen.count(1)

# 9. Degenerate inputs.
assert ucb1_select([], [], 0) == -1
assert ucb1_select([7], [3.0], 7) == 0
`,
      writeup: l(
        'Восьмой тест показывает механику, ради которой всё и затевалось. Вторая рука не приносит награды вообще, но её бонус растёт, пока её не показывают: в числителе ln(t), в знаменателе её неизменное число показов. Рано или поздно бонус перевешивает разницу средних, рука получает показ, бонус сбрасывается — и так по кругу, со всё более редкими показами. Из этого и получается логарифмическое сожаление: число показов проигрышной руки растёт как логарифм, а не линейно. Два замечания по реализации. Первое: ветка с непоказанными руками обязательна, иначе деление на ноль, а при нулевой инициализации среднего алгоритм никогда их не попробует. Второе: ln(t+1), а не ln(t), чтобы на нулевом раунде логарифм не ушёл в минус бесконечность. Коэффициент c в классической теореме равен единице, но на практике его почти всегда подбирают: теоретическая граница рассчитана на худший случай и исследует заметно больше, чем нужно на реальных данных.',
        'The eighth test shows the mechanics the whole thing exists for. The second arm brings no reward at all, yet its bonus grows while it goes unpulled: ln(t) in the numerator, its unchanged pull count in the denominator. Sooner or later the bonus outweighs the gap in means, the arm gets an impression, the bonus resets — and round it goes, with ever rarer impressions. That is where logarithmic regret comes from: the losing arm\'s pull count grows like a logarithm rather than linearly. Two implementation notes. First, the branch for unpulled arms is mandatory, otherwise you divide by zero — and with a zero-initialised mean the algorithm would never try them. Second, ln(t+1) rather than ln(t), so the logarithm does not go to minus infinity on round zero. The coefficient c is one in the classical theorem, but in practice it is almost always tuned: the theoretical bound is built for the worst case and explores noticeably more than real data needs.',
      ),
    },
    {
      kind: 'quiz',
      id: 'bandits.ucb-thompson.q-batch',
      mode: 'single',
      prompt: l(
        'Система обновляет статистику бандита раз в пять минут, между обновлениями приходит около 50 тысяч запросов. Что произойдёт с UCB?',
        'A system refreshes its bandit statistics every five minutes, with about 50 thousand requests arriving in between. What happens to UCB?',
      ),
      choices: [
        { id: 'a', text: l('Ничего, UCB для этого и придуман', 'Nothing, that is what UCB is for') },
        {
          id: 'b',
          text: l(
            'Все 50 тысяч запросов получат одну и ту же руку: UCB детерминирован, а данные между обновлениями не меняются',
            'All 50 thousand requests get the same arm: UCB is deterministic and the data does not change between refreshes',
          ),
        },
        { id: 'c', text: l('UCB начнёт переобучаться', 'UCB starts overfitting') },
        { id: 'd', text: l('Сожаление станет логарифмическим', 'The regret becomes logarithmic') },
      ],
      correct: ['b'],
      explanation: l(
        'UCB — функция от накопленной статистики, и пока статистика не обновилась, он выдаёт один и тот же ответ. Внутри батча исследование полностью останавливается, а в худшем случае вся пятиминутка уходит на руку, которую надо было показать пару раз. Чинят это по-разному: добавляют случайность в выбор, обновляют статистику чаще, или просто берут Thompson, у которого случайность встроена в механизм. В продовых рекомендательных системах это одна из главных причин популярности Thompson sampling, а вовсе не разница в теоретических гарантиях.',
        'UCB is a function of accumulated statistics, and until they refresh it returns the same answer. Inside a batch exploration stops entirely, and in the worst case the whole five minutes goes to an arm that deserved a couple of impressions. The fixes vary: add randomness to the choice, refresh statistics more often, or simply use Thompson, where randomness is built into the mechanism. In production recommender systems this is one of the main reasons for Thompson sampling\'s popularity, rather than any difference in theoretical guarantees.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Multi-armed bandit',
      url: 'https://en.wikipedia.org/wiki/Multi-armed_bandit',
    },
    {
      title: 'Wikipedia: Thompson sampling',
      url: 'https://en.wikipedia.org/wiki/Thompson_sampling',
    },
  ],
};
