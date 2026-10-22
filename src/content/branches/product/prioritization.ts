import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const productPrioritization: SkillNode = {
  id: 'product.prioritization',
  branch: 'product',
  act: 5,
  tier: 3,
  title: l('Приоритизация гипотез', 'Prioritising hypotheses'),
  blurb: l(
    'Эффект, уверенность и недели. Два из трёх обычно забывают.',
    'Effect, confidence and weeks. Two of the three usually get forgotten.',
  ),
  requires: ['product.tradeoffs'],
  theory: [
    {
      type: 'p',
      text: l(
        'Квартальное планирование выглядит как спор о важности, а на самом деле это задача о рюкзаке с неизвестными весами. У каждой гипотезы есть заявленный эффект, уверенность в нём и стоимость в неделях; ёмкость команды конечна. Спор о важности — это спор про первый множитель, а решает произведение всех трёх, делённое на стоимость.',
        'Quarterly planning looks like an argument about importance, but it is really a knapsack problem with unknown weights. Every hypothesis has a claimed effect, a confidence in it and a cost in weeks; the team\'s capacity is finite. The argument about importance is an argument about the first factor, while what decides is the product of all three divided by the cost.',
      ),
    },
    {
      type: 'sim',
      sim: 'prioritization',
      title: l('Сортировка «по вау» против ожидаемой ценности', 'Sorting by wow versus by expected value'),
      caption: l(
        'Восемь гипотез, у каждой заявленный эффект и реально полученный — чем громче заявка, тем больше в ней воздуха при высоком оптимизме. Плашки усреднены по двумстам случайным кварталам: на одном раскладе выиграть может любой порядок, и это само по себе важный факт. Сравни три порядка и посмотри, сколько добавляет учёт уверенности и сколько — деление на недели. Потом посмотри на последнюю плашку: примерно в половине кварталов наивная сортировка не хуже, и именно поэтому спор о приоритизации нельзя выиграть примером одного квартала.',
        'Eight hypotheses, each with a claimed effect and a realised one — the louder the claim, the more air in it when optimism is high. The readouts are averaged over two hundred random quarters: on a single draw any ordering can win, which is itself an important fact. Compare the three orderings and see how much taking confidence in adds and how much dividing by weeks adds. Then look at the last readout: in about half the quarters the naive ordering is no worse, which is why an argument about prioritisation cannot be won with one quarter as an example.',
      ),
    },
    {
      type: 'formula',
      tex: '\\text{priority} = \\frac{\\text{effect} \\times \\text{confidence}}{\\text{weeks}}',
      caption: l(
        'Любая из популярных рамок — RICE, ICE — это одна и та же дробь с разными названиями множителей. Ценность не в формуле, а в том, что она заставляет назвать уверенность и стоимость вслух, а не держать их в голове.',
        'Every popular framework — RICE, ICE — is the same fraction with different names for the factors. The value is not in the formula but in its forcing you to state the confidence and the cost out loud instead of keeping them in your head.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Самый полезный столбец в такой таблице — не приоритет, а «что мы узнаем, если гипотеза не подтвердится». Дешёвый эксперимент с отрицательным результатом, закрывающий целое направление, часто ценнее дорогого с положительным: он экономит кварталы. Это и есть причина, по которой первыми делают быстрые проверки, а не главные фичи.',
        'The most useful column in such a table is not the priority but "what we learn if the hypothesis fails". A cheap experiment with a negative result that closes off a whole direction is often worth more than an expensive one with a positive result: it saves quarters. That is the reason quick checks come before flagship features.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'product.prioritization.py-plan',
      prompt: l(
        'Собери план на квартал. На вход список гипотез с ключами name, value (заявленный эффект), confidence (от 0 до 1) и weeks, а также ёмкость команды в неделях. Бери гипотезы жадно по убыванию ожидаемой ценности за неделю, то есть value * confidence / weeks; при равенстве — по имени по возрастанию. Гипотеза, которая не помещается в остаток, пропускается, но перебор продолжается. Верни список имён в порядке взятия.',
        'Build a quarter plan. The input is a list of hypotheses with the keys name, value (the claimed effect), confidence (0 to 1) and weeks, plus the team capacity in weeks. Take hypotheses greedily by decreasing expected value per week, that is value * confidence / weeks; ties are broken by name ascending. A hypothesis that does not fit in what remains is skipped, but the scan continues. Return the list of names in the order taken.',
      ),
      signature: 'def plan(hypotheses: list[dict], capacity: int) -> list[str]:',
      starter: `def plan(hypotheses, capacity):
    # TODO
    return []
`,
      reference: `def plan(hypotheses, capacity):
    ordered = sorted(
        hypotheses,
        key=lambda h: (-(h['value'] * h['confidence'] / h['weeks']), h['name']),
    )

    left = capacity
    taken = []
    for item in ordered:
        if item['weeks'] > left:
            continue
        left -= item['weeks']
        taken.append(item['name'])
    return taken
`,
      sampleTests: `items = [
    {'name': 'A', 'value': 10.0, 'confidence': 0.5, 'weeks': 5},
    {'name': 'B', 'value': 4.0, 'confidence': 1.0, 'weeks': 1},
]
assert plan(items, 6) == ['B', 'A']
assert plan(items, 1) == ['B']
`,
      tests: `items = [
    {'name': 'big', 'value': 12.0, 'confidence': 0.4, 'weeks': 8},    # 0.60 per week
    {'name': 'cheap', 'value': 2.0, 'confidence': 0.9, 'weeks': 1},   # 1.80 per week
    {'name': 'medium', 'value': 6.0, 'confidence': 0.6, 'weeks': 3},  # 1.20 per week
    {'name': 'weak', 'value': 9.0, 'confidence': 0.1, 'weeks': 2},    # 0.45 per week
]

# Ordered by expected value per week, not by the claimed effect.
assert plan(items, 20) == ['cheap', 'medium', 'big', 'weak']

# Capacity is respected exactly.
assert plan(items, 4) == ['cheap', 'medium']
# With three weeks medium no longer fits after cheap, but weak does.
assert plan(items, 3) == ['cheap', 'weak']
assert plan(items, 1) == ['cheap']

# A hypothesis that does not fit is skipped, but cheaper ones after it are taken.
only_small = plan([
    {'name': 'huge', 'value': 100.0, 'confidence': 1.0, 'weeks': 50},
    {'name': 'tiny', 'value': 1.0, 'confidence': 1.0, 'weeks': 1},
], 2)
assert only_small == ['tiny'], only_small

# Ties are broken by name, so the plan is reproducible.
tied = [
    {'name': 'zeta', 'value': 4.0, 'confidence': 0.5, 'weeks': 2},
    {'name': 'alpha', 'value': 2.0, 'confidence': 1.0, 'weeks': 2},
]
assert plan(tied, 4) == ['alpha', 'zeta']

# Degenerate inputs do not raise.
assert plan([], 10) == []
assert plan(items, 0) == []
`,
      writeup: l(
        'Жадный выбор по ценности за единицу стоимости — это приближение задачи о рюкзаке, и он не даёт оптимума в общем случае: классический контрпример — две дешёвые гипотезы, которые вместе лучше одной дорогой, но жадность берёт дорогую первой. В планировании это почти никогда не важно, потому что погрешность в оценках эффекта на порядок больше, чем разница между жадным и оптимальным планом. Важнее другое: детерминированный разрыв ничьих по имени. Без него один и тот же набор гипотез даёт разный план при разном порядке строк в таблице, и на планировании это выглядит так, будто приоритеты поменялись сами собой — а на самом деле поменялась сортировка в экспорте. Пропуск не влезающей гипотезы с продолжением перебора — тоже сознательное решение: остановиться на первой не влезшей значит потерять все дешёвые хвосты.',
        'Greedy selection by value per unit cost is an approximation of the knapsack problem and is not optimal in general: the classic counterexample is two cheap hypotheses that together beat one expensive one, where greed takes the expensive one first. In planning this almost never matters, because the error in the effect estimates is an order of magnitude larger than the gap between the greedy and the optimal plan. What matters more is the deterministic tie-break by name. Without it the same set of hypotheses yields a different plan depending on the row order in the spreadsheet, and at a planning meeting that looks as if the priorities changed by themselves — when what changed was the sort order in an export. Skipping a hypothesis that does not fit and continuing is a deliberate choice too: stopping at the first one that does not fit loses every cheap tail.',
      ),
    },
    {
      kind: 'quiz',
      id: 'product.prioritization.q-learning',
      mode: 'single',
      prompt: l(
        'Две гипотезы: A — переписать ранжирование на новую архитектуру, 8 недель, ожидаемый эффект большой, уверенность 0.2. B — за 1 неделю проверить на логах, упирается ли качество в понимание запроса, эффекта у самой проверки нет. Что брать первым и почему?',
        'Two hypotheses: A — rewrite ranking on a new architecture, 8 weeks, large expected effect, confidence 0.2. B — spend one week checking from the logs whether quality is limited by query understanding; the check itself has no effect. Which comes first and why?',
      ),
      choices: [
        {
          id: 'a-first',
          text: l(
            'A: у B нулевой эффект, значит нулевая ожидаемая ценность',
            'A: B has zero effect, so zero expected value',
          ),
        },
        {
          id: 'b-first',
          text: l(
            'B: неделя проверки меняет уверенность в A, а значит и ожидаемую ценность восьми недель',
            'B: a week of checking changes the confidence in A, and therefore the expected value of eight weeks',
          ),
        },
        {
          id: 'parallel',
          text: l('Обе параллельно: это разные люди', 'Both in parallel: different people'),
        },
        {
          id: 'skip-both',
          text: l('Ни то ни другое: уверенность 0.2 слишком мала', 'Neither: a confidence of 0.2 is too low'),
        },
      ],
      correct: ['b-first'],
      explanation: l(
        'Формула ожидаемой ценности применяется к каждой гипотезе по отдельности и поэтому не видит гипотез, которые меняют уверенность в других. У B собственный эффект нулевой, но она стоит неделю и превращает 0.2 либо в число заметно выше, либо заметно ниже. В первом случае восемь недель становятся обоснованными, во втором — экономятся целиком. Это и есть ценность информации, и она тем выше, чем дороже решение, на которое она влияет, и чем ближе уверенность к середине. Вариант «ни то ни другое» неверен именно потому, что уверенность 0.2 — это не приговор, а повод её уточнить; дорого не ошибиться, дорого ошибаться восемь недель.',
        'The expected-value formula applies to each hypothesis separately and therefore cannot see hypotheses that change the confidence in others. B\'s own effect is zero, but it costs a week and turns 0.2 into either a markedly higher number or a markedly lower one. In the first case the eight weeks become justified; in the second they are saved entirely. That is the value of information, and it is higher the more expensive the decision it affects and the closer the confidence is to the middle. "Neither" is wrong precisely because a confidence of 0.2 is not a verdict but a reason to refine it; being wrong is not what costs, being wrong for eight weeks is.',
      ),
    },
    {
      kind: 'case',
      id: 'product.prioritization.case-quarter',
      prompt: l(
        'Тебе дали квартал (12 недель работы одного человека — тебя) в поисковой команде маркетплейса и список из пяти направлений: исправление опечаток, переранжирование по свежести, ускорение выдачи, новая модель релевантности на трансформере, улучшение подсказок. Данных о фактическом эффекте нет ни по одному. Напиши, как ты составишь план: что сделаешь в первые две недели, по какому принципу расставишь остальное, что запишешь в столбец «что узнаем, если не подтвердится», и как изменится план, если на третьей неделе выяснится, что половина пустых выдач — это опечатки.',
        'You are given a quarter (12 weeks of one person\'s work — yours) in the search team of a marketplace and a list of five directions: typo correction, re-ranking by freshness, speeding up the result page, a new transformer relevance model, improving suggestions. There is no data on the actual effect of any of them. Write how you would build the plan: what you do in the first two weeks, on what principle you order the rest, what you put in the "what we learn if it fails" column, and how the plan changes if in week three it turns out that half the empty result pages are typos.',
      ),
      reference: l(
        'Первые две недели не на разработку, а на счёт: беру логи и считаю, сколько запросов приходится на каждую гипотетическую проблему. Доля запросов с опечатками и их доля среди запросов без клика; доля запросов, где свежесть вообще может что-то поменять (не на всех категориях это так); распределение времени ответа и доля запросов, где оно выше бюджета; доля запросов, где пользователь переформулировал — грубый прокси непонятого запроса; доля сессий, начинающихся с подсказки. Это две недели, которые нельзя пропускать: без них пять направлений равноправны и выбор будет сделан по вкусу.\n\nОстальное расставляю по ожидаемой ценности за неделю, где ценность — доля затронутых запросов, умноженная на правдоподобный эффект, а уверенность берётся из того же подсчёта. На восьминедельную модель на трансформере в квартале из двенадцати недель места нет: она съедает всё и оставляет ноль права на ошибку. Если её очень хочется, в план попадает не она, а дешёвая проверка того, что качество действительно упирается в понимание запроса.\n\nСтолбец «что узнаем, если не подтвердится» для каждого: опечатки — узнаем, что проблема не в написании, а в ассортименте, и это закрывает заодно часть направления подсказок; свежесть — узнаем, что категория ведёт себя не так, как мы думали, и переранжирование по любому сигналу этого типа бесполезно; скорость — узнаем, что пользователи не упираются в задержку, и можно больше не тратить на это квартал инфраструктуры; подсказки — узнаем, нужны ли они вообще вне мобильных.\n\nЕсли на третьей неделе выясняется, что половина пустых выдач — опечатки, план меняется сразу: опечатки поднимаются на первое место, потому что доля затронутых запросов измерена, а не оценена, и уверенность из 0.3 превращается в 0.8. Трансформер уходит из квартала целиком — не потому что он плох, а потому что теперь известно направление с измеренной отдачей и ценой в пару недель. Это и есть смысл первых двух недель: план пересобирается по числу, а не по спору.',
        'The first two weeks are not for building but for counting: I take the logs and count how many queries each hypothetical problem accounts for. The share of queries with typos and their share among queries with no click; the share of queries where freshness can change anything at all (it does not in every category); the distribution of response time and the share of queries above the budget; the share of queries the user reformulated — a crude proxy for a misunderstood query; the share of sessions that start from a suggestion. Those two weeks cannot be skipped: without them the five directions are equal and the choice gets made by taste.\n\nThe rest I order by expected value per week, where value is the share of affected queries times a plausible effect, and confidence comes from the same counting. There is no room in a twelve-week quarter for an eight-week transformer model: it eats everything and leaves no right to be wrong. If it is badly wanted, what enters the plan is not the model but the cheap check that quality really is limited by query understanding.\n\nThe "what we learn if it fails" column for each: typos — we learn the problem is not spelling but assortment, which also closes part of the suggestions direction; freshness — we learn the category behaves differently than we thought, so re-ranking on any signal of that type is useless; speed — we learn users are not blocked by latency, and an infrastructure quarter need not go there; suggestions — we learn whether they are needed at all outside mobile.\n\nIf week three shows that half the empty pages are typos, the plan changes at once: typos go first, because the share of affected queries is now measured rather than estimated, and the confidence goes from 0.3 to 0.8. The transformer leaves the quarter entirely — not because it is bad but because there is now a direction with a measured payoff and a two-week price. That is the point of the first two weeks: the plan is rebuilt by a number rather than by an argument.',
      ),
      checklist: [
        l(
          'Первые недели потрачены на счёт по логам, а не на разработку.',
          'The first weeks go on counting from the logs rather than on building.',
        ),
        l(
          'Доля затронутых запросов названа как множитель ожидаемого эффекта.',
          'The share of affected queries is named as a factor of the expected effect.',
        ),
        l(
          'Восьминедельная гипотеза не берётся в двенадцатинедельный квартал целиком.',
          'The eight-week hypothesis is not taken whole into a twelve-week quarter.',
        ),
        l(
          'Дорогая гипотеза заменена дешёвой проверкой её предпосылки.',
          'The expensive hypothesis is replaced by a cheap check of its premise.',
        ),
        l(
          'Для каждого направления записано, что даёт отрицательный результат.',
          'For every direction there is a note on what a negative result gives.',
        ),
        l(
          'План пересобирается при новой информации, и названо, какое именно число изменилось.',
          'The plan is rebuilt on new information, with the specific number that changed named.',
        ),
      ],
      writeup: l(
        'Эта задача проверяет не умение заполнять таблицу RICE, а две вещи. Первая: готовность потратить первые недели на счёт, когда хочется начать делать. Вторая: понимание, что уверенность — это то, что можно купить за неделю работы, а не свойство характера. Ответ, где квартал целиком отдан самому интересному направлению, слаб даже если направление угадано: он не оставляет права на ошибку, а в планировании без данных ошибка — это норма, а не исключение.',
        'This task tests not the ability to fill in a RICE table but two things. First, the willingness to spend the first weeks counting when you want to start building. Second, understanding that confidence is something a week of work can buy rather than a trait of character. An answer that gives the whole quarter to the most interesting direction is weak even if the direction is right: it leaves no right to be wrong, and in planning without data being wrong is the norm rather than the exception.',
      ),
    },
  ],
};
