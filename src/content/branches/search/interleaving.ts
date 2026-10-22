import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchInterleaving: SkillNode = {
  id: 'search.interleaving',
  branch: 'search-metrics',
  act: 3,
  tier: 6,
  title: l('Интерливинг', 'Interleaving'),
  blurb: l(
    'Сравнение двух ранжирований внутри одного запроса — и почему это в десятки раз чувствительнее A/B.',
    'Comparing two rankings inside a single query — and why it is tens of times more sensitive than A/B.',
  ),
  requires: ['search.offline-online'],
  theory: [
    {
      type: 'p',
      text: l(
        'В обычном A/B одна половина пользователей видит ранжирование A, другая — B, и мы сравниваем средние. Вся разница между пользователями и между запросами при этом уходит в дисперсию: один ищет «iphone», другой «шуруповёрт для бетона», и их CTR различаются куда сильнее, чем две версии ранжирования. Интерливинг убирает именно этот источник шума: обе системы показываются одному пользователю на один запрос, в одной выдаче.',
        'In an ordinary A/B half the users see ranking A and half see B, and we compare the averages. All the variation between users and between queries goes into the variance: one searches "iphone", another "concrete screwdriver", and their CTRs differ far more than two ranking versions do. Interleaving removes exactly that source of noise: both systems are shown to one user for one query, on one result page.',
      ),
    },
    { type: 'h', text: l('Team-draft: как собирается смешанная выдача', 'Team draft: how the mixed page is built') },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'Подбрасываем монетку: кто выбирает первым на этом шаге.',
          'Toss a coin: which team picks first at this step.',
        ),
        l(
          'Команда-победитель берёт свой лучший ещё не взятый документ и ставит его в общую выдачу.',
          'The winning team takes its best not-yet-taken document and places it on the shared page.',
        ),
        l(
          'Вторая команда делает то же самое. Повторяем, пока не наберём нужную длину.',
          'The other team does the same. Repeat until the page is full.',
        ),
        l(
          'Каждый документ помнит, чья команда его привела. Клик засчитывается этой команде.',
          'Every document remembers which team brought it in. A click counts for that team.',
        ),
      ],
    },
    {
      type: 'p',
      text: l(
        'Монетка на каждом шаге нужна не для красоты: без неё одна система систематически получала бы более высокие позиции, и позиционное смещение сломало бы сравнение. При честном драфте обе команды в среднем занимают одинаковые позиции, и смещение действует на них одинаково — поэтому оно сокращается, а не смешивается с эффектом.',
        'The coin at each step is not decoration: without it one system would systematically occupy higher positions and position bias would break the comparison. With an honest draft both teams take equal positions on average, so the bias affects them equally — it cancels instead of mixing into the effect.',
      ),
    },
    {
      type: 'sim',
      sim: 'interleaving-sim',
      title: l('Сколько трафика нужно каждому методу', 'How much traffic each method needs'),
      caption: l(
        'Две кривые мощности: обычный A/B по CTR и team-draft интерливинг, обе посчитаны симуляцией на одной и той же модели кликов. Уменьши разницу между системами до пары процентов и посмотри, где каждая кривая пересекает 80%. Выигрыш по трафику обычно получается в десятки раз — отсюда и практика: ранжирование сначала просеивают интерливингом, а в A/B отправляют только то, что его прошло.',
        'Two power curves: an ordinary A/B on CTR and team-draft interleaving, both simulated on the same click model. Shrink the difference between the systems to a couple of percent and see where each curve crosses 80%. The traffic advantage usually comes out in the tens — hence the practice: rankings are first sieved with interleaving and only what survives goes to an A/B.',
      ),
    },
    { type: 'h', text: l('Чего интерливинг не умеет', 'What interleaving cannot do') },
    {
      type: 'list',
      items: [
        l(
          'Он отвечает только на вопрос «какое ранжирование пользователю нравится больше здесь и сейчас». Про выручку, удержание и долгосрочные эффекты он не говорит ничего.',
          'It answers only "which ranking do users prefer here and now". About revenue, retention and long-term effects it says nothing.',
        ),
        l(
          'Смешанная выдача не существует в проде. Пользователь видит то, чего вы не собираетесь показывать, и эффекты вроде разнообразия или цельности выдачи измерить нельзя.',
          'The mixed page does not exist in production. The user sees something you never intend to ship, so effects like diversity or page coherence cannot be measured.',
        ),
        l(
          'Не работает, когда системы различаются не порядком, а составом или оформлением: другой сниппет, другая карточка, другое число результатов.',
          'It does not work when the systems differ in composition or presentation rather than order: a different snippet, a different card, a different number of results.',
        ),
        l(
          'Клик остаётся смещённой заменой пользы: быстрый возврат к выдаче после клика учитывается только в более сложных вариантах оценки.',
          'A click remains a biased stand-in for usefulness: a quick return to the results after clicking is only accounted for in more elaborate scoring schemes.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Рабочая схема в зрелой поисковой команде трёхступенчатая: оффлайн-метрика на разметке отсеивает заведомо плохое, интерливинг быстро и дёшево отвечает «стало ли лучше для пользователя», и только прошедшее обе ступени идёт в полноценный A/B, где считаются деньги и guardrails.',
        'The working scheme in a mature search team has three steps: an offline metric on labels filters out the obviously bad, interleaving answers "did it get better for the user" quickly and cheaply, and only what survives both goes into a full A/B where money and guardrails are measured.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'search.interleaving.py-teamdraft',
      prompt: l(
        'Реализуй team-draft интерливинг. На вход два ранжирования — списки идентификаторов документов — и сид. Верни кортеж (interleaved, teams): список документов смешанной выдачи и список той же длины из строк "A" и "B", показывающих, чья команда привела документ. Правила: на каждом раунде монеткой выбирается, кто ходит первым; команда берёт свой первый документ, которого ещё нет в выдаче; затем ходит вторая команда по тому же правилу. Длина результата — длина более короткого из двух списков, умноженная на два, но не больше числа уникальных документов. Дубликатов в выдаче быть не должно. Для монетки используй random.Random(seed).random() < 0.5 — при одном сиде результат обязан повторяться.',
        'Implement team-draft interleaving. The input is two rankings — lists of document ids — and a seed. Return a tuple (interleaved, teams): the mixed result list and a list of the same length of "A" and "B" strings showing which team brought each document. The rules: each round a coin decides who picks first; that team takes its first document not already on the page; then the other team does the same. The result length is twice the length of the shorter input, capped at the number of unique documents. No duplicates on the page. Use random.Random(seed).random() < 0.5 for the coin — with one seed the result must repeat.',
      ),
      signature:
        'def team_draft_interleave(ranking_a: list[str], ranking_b: list[str], seed: int = 0) -> tuple[list[str], list[str]]:',
      starter: `import random


def team_draft_interleave(ranking_a, ranking_b, seed=0):
    """Team-draft interleaving of two rankings."""
    # TODO
    return ([], [])
`,
      reference: `import random


def team_draft_interleave(ranking_a, ranking_b, seed=0):
    """Team-draft interleaving of two rankings."""
    rnd = random.Random(seed)
    interleaved = []
    teams = []
    seen = set()
    ia = ib = 0
    limit = min(len(ranking_a), len(ranking_b)) * 2

    def take(ranking, index, team):
        while index < len(ranking) and ranking[index] in seen:
            index += 1
        if index >= len(ranking):
            return index, False
        doc = ranking[index]
        seen.add(doc)
        interleaved.append(doc)
        teams.append(team)
        return index + 1, True

    while len(interleaved) < limit:
        a_first = rnd.random() < 0.5
        order = [('A',), ('B',)] if a_first else [('B',), ('A',)]
        progressed = False
        for (team,) in order:
            if len(interleaved) >= limit:
                break
            if team == 'A':
                ia, ok = take(ranking_a, ia, 'A')
            else:
                ib, ok = take(ranking_b, ib, 'B')
            progressed = progressed or ok
        if not progressed:
            break

    return (interleaved, teams)
`,
      sampleTests: `a = ['d1', 'd2', 'd3', 'd4']
b = ['d3', 'd1', 'd5', 'd6']
page, teams = team_draft_interleave(a, b, seed=1)

assert len(page) == len(teams)
assert len(page) == len(set(page))            # no duplicates
assert set(page) <= set(a) | set(b)
assert set(teams) <= {'A', 'B'}

# deterministic for a given seed
assert team_draft_interleave(a, b, seed=1) == team_draft_interleave(a, b, seed=1)
`,
      tests: `import random

a = ['a1', 'a2', 'a3', 'a4', 'a5']
b = ['b1', 'b2', 'b3', 'b4', 'b5']

# 1. Disjoint rankings: every document appears once, teams are balanced.
page, teams = team_draft_interleave(a, b, seed=3)
assert len(page) == 10, len(page)
assert len(page) == len(set(page))
assert abs(teams.count('A') - teams.count('B')) <= 1, teams

# 2. Each team's documents keep their original relative order.
order_a = [d for d, t in zip(page, teams) if t == 'A']
order_b = [d for d, t in zip(page, teams) if t == 'B']
assert order_a == [d for d in a if d in order_a], order_a
assert order_b == [d for d in b if d in order_b], order_b

# 3. Identical rankings produce that exact ranking with no duplicates.
page, teams = team_draft_interleave(a, a, seed=5)
assert page == a, page
assert len(page) == len(set(page))

# 4. Overlapping rankings never repeat a document.
x = ['s1', 's2', 'c1', 'c2']
y = ['c1', 'c2', 't1', 't2']
page, teams = team_draft_interleave(x, y, seed=7)
assert len(page) == len(set(page))
assert set(page) <= set(x) | set(y)
assert len(page) == len(teams)

# 5. Deterministic per seed, and different seeds really do differ somewhere.
assert team_draft_interleave(a, b, seed=11) == team_draft_interleave(a, b, seed=11)
pages = {tuple(team_draft_interleave(a, b, seed=s)[1]) for s in range(30)}
assert len(pages) > 1, 'the coin is not being used'

# 6. Rankings of different lengths: the shorter one bounds the page.
short = ['p1', 'p2']
page, teams = team_draft_interleave(short, b, seed=2)
assert len(page) <= 4, len(page)
assert len(page) == len(set(page))

# 7. Degenerate inputs.
assert team_draft_interleave([], [], seed=1) == ([], [])
page, teams = team_draft_interleave([], b, seed=1)
assert page == [] and teams == []

# 8. On average, neither team systematically takes the top slot.
first_team_a = 0
runs = 400
for s in range(runs):
    page, teams = team_draft_interleave(a, b, seed=s)
    if teams[0] == 'A':
        first_team_a += 1
share = first_team_a / runs
assert 0.35 < share < 0.65, share
`,
      writeup: l(
        'Два требования делают эту конструкцию корректной, и оба проверяются тестами. Первое — относительный порядок: документы каждой команды должны идти в том же порядке, что и в её исходном ранжировании, иначе мы сравниваем уже не те системы. Поэтому указатель по каждому списку только движется вперёд, пропуская уже взятые документы. Второе — честность монетки: если первым всегда ходит A, его документы систематически оказываются выше, и позиционное смещение превращается в «победу» A. Восьмой тест ровно про это. Отдельная тонкость — дубликаты: документ, который есть в обоих ранжированиях, должен попасть в выдачу один раз и засчитаться одной команде. Это, кстати, слабое место метода: чем сильнее пересекаются два ранжирования, тем меньше различающих документов остаётся и тем ниже чувствительность. В проде поверх этой схемы считают не просто число кликов, а взвешенные по позиции или по длительности клика варианты.',
        'Two requirements make this construction correct, and both are covered by tests. First, relative order: each team\'s documents must appear in the same order as in its own ranking, otherwise you are no longer comparing those systems. Hence the per-list pointer only moves forward, skipping documents already taken. Second, an honest coin: if A always picks first its documents sit systematically higher and position bias turns into a "win" for A. The eighth test is exactly about that. A separate subtlety is duplicates: a document present in both rankings must appear once and count for one team. That is also the method\'s weak spot: the more the two rankings overlap, the fewer distinguishing documents remain and the lower the sensitivity. In production this scheme is scored not by raw click counts but by position- or dwell-weighted variants.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.interleaving.q-when',
      mode: 'multi',
      prompt: l(
        'В каких случаях интерливинг применить нельзя или бессмысленно?',
        'In which cases is interleaving inapplicable or pointless?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Сравниваем две формулы ранжирования, выдача одинаковой длины и оформления',
            'Comparing two ranking formulas with the same page length and presentation',
          ),
        },
        {
          id: 'b',
          text: l(
            'Новая версия показывает другую карточку товара с дополнительной информацией',
            'The new version shows a different item card with extra information',
          ),
        },
        {
          id: 'c',
          text: l(
            'Нужно понять, вырастет ли выручка и не упадёт ли удержание',
            'The question is whether revenue grows and retention holds',
          ),
        },
        {
          id: 'd',
          text: l(
            'Две системы возвращают почти одинаковый топ-10, различий в документах мало',
            'Two systems return a nearly identical top 10, with few differing documents',
          ),
        },
      ],
      correct: ['b', 'c', 'd'],
      explanation: l(
        'Вариант a — ровно тот случай, для которого интерливинг и создан. Вариант b ломает метод: смешать две разные карточки в одной выдаче нельзя, различие не в порядке документов. Вариант c вне его компетенции: интерливинг измеряет предпочтение, а не деньги и не удержание, для этого нужен A/B. Вариант d — ограничение чувствительности: если ранжирования почти совпадают, различающих документов в смешанной выдаче мало, и статистика собирается медленно, несмотря на все преимущества метода.',
        'Option a is precisely what interleaving was built for. Option b breaks the method: two different cards cannot be mixed on one page, since the difference is not in document order. Option c is out of its scope: interleaving measures preference, not money or retention, which is what an A/B is for. Option d is a sensitivity limit: when the rankings nearly coincide, few distinguishing documents make it onto the mixed page and statistics accumulate slowly despite all the method\'s advantages.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Learning to rank',
      url: 'https://en.wikipedia.org/wiki/Learning_to_rank',
    },
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Раздел про чувствительность и альтернативы A/B.', 'The section on sensitivity and alternatives to A/B.'),
    },
  ],
};
