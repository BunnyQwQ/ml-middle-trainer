import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const adsAuctions: SkillNode = {
  id: 'ads.auctions',
  branch: 'ads',
  tier: 2,
  title: l('Аукционы GSP и VCG', 'GSP and VCG auctions'),
  blurb: l(
    'Кто сколько платит и почему при одном механизме выгодно врать, а при другом нет.',
    'Who pays what, and why one mechanism rewards lying while the other does not.',
  ),
  requires: ['ads.ecpm'],
  theory: [
    {
      type: 'p',
      text: l(
        'Аукцион первой цены — когда победитель платит свою ставку — плохо работает: рекламодателю приходится угадывать, насколько занизить ставку, и ставки всё время дёргаются. Аукцион второй цены решает это для одного места: победитель платит столько, сколько нужно, чтобы остаться первым, то есть ставку следующего. При этом говорить правду становится оптимальной стратегией.',
        'A first-price auction — where the winner pays its own bid — works badly: the advertiser has to guess how far to shade the bid, and bids keep oscillating. A second-price auction fixes that for a single slot: the winner pays just enough to stay first, i.e. the next bid. Telling the truth then becomes the optimal strategy.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Мест, однако, несколько. Прямое обобщение второй цены называется GSP: каждый платит ставку следующего, приведённую к своему качеству. Выглядит честно, но свойство правдивости при этом теряется — именно потому, что рекламодатель выбирает не «выиграть или нет», а между позициями, и занижение ставки может перевести его на более дешёвое место, где прибыль выше.',
        'There is more than one slot, though. The direct generalisation of the second price is GSP: everyone pays the next bid, adjusted to their own quality. It looks fair but the truthfulness property is lost — precisely because the advertiser is choosing not "win or not" but between slots, and shading the bid can move them to a cheaper slot where the profit is higher.',
      ),
    },
    { type: 'formula', tex: 'p_i^{GSP} = \\frac{b_{i+1}\\, q_{i+1}}{q_i}' },
    {
      type: 'p',
      text: l(
        'VCG устроен по другому принципу: каждый платит ровно тот вред, который нанёс остальным. То есть сумму ценности, которую недополучили все другие участники из-за того, что он занял место выше них. Эта конструкция возвращает правдивость: при VCG оптимально ставить свою истинную ценность, что бы ни делали конкуренты.',
        'VCG works on a different principle: everyone pays exactly the harm they do to the others. That is, the total value the other participants lose because this ad took a slot above them. The construction restores truthfulness: under VCG it is optimal to bid your true value whatever the competitors do.',
      ),
    },
    { type: 'formula', tex: 'p_i^{VCG} \\cdot \\alpha_i q_i = \\sum_{j>i} (\\alpha_{j-1} - \\alpha_j)\\, b_j q_j' },
    {
      type: 'sim',
      sim: 'auction-sim',
      title: l('Прибыль рекламодателя как функция ставки', "Advertiser profit as a function of the bid"),
      caption: l(
        'Твоя истинная ценность клика — 30 рублей, вертикальная линия. Зелёная кривая (VCG) выходит на плато ровно там: ставить больше бессмысленно, меньше — тоже. Красная кривая (GSP) обычно имеет максимум левее: выгодно занижать. Подвигай ставку и посмотри, как при этом меняются цены всех позиций в таблице — твоя ставка платится не тобой, а тем, кто стоит выше.',
        'Your true value per click is 30 roubles, the vertical line. The green curve (VCG) plateaus exactly there: bidding more is pointless, and so is bidding less. The red curve (GSP) usually peaks to the left: shading pays. Move the bid and watch the prices of all slots change in the table — your bid is paid not by you but by whoever sits above you.',
      ),
    },
    { type: 'h', text: l('Почему площадки всё равно чаще берут GSP', 'Why platforms still mostly use GSP') },
    {
      type: 'list',
      items: [
        l(
          'GSP объясним рекламодателю за минуту: «платишь на копейку больше следующего». VCG требует объяснять понятие внешнего эффекта, и счёт выглядит непредсказуемым.',
          'GSP can be explained to an advertiser in a minute: "you pay a kopeck more than the next one". VCG requires explaining externalities, and the invoice looks unpredictable.',
        ),
        l(
          'В равновесии GSP нередко приносит больше выручки, чем VCG, при одинаковых истинных ценностях.',
          'At equilibrium GSP often brings more revenue than VCG at identical true values.',
        ),
        l(
          'Правдивость VCG ломается, как только появляются бюджеты, ограничения по частоте и резервные цены — а в реальной системе они есть всегда.',
          'The truthfulness of VCG breaks as soon as budgets, frequency caps and reserve prices appear — and a real system always has them.',
        ),
        l(
          'Исторический аргумент: крупные площадки запускались на GSP, и миграция на VCG означает пересчёт всех ставок рекламодателей.',
          'A historical argument: the large platforms launched on GSP, and migrating to VCG means every advertiser has to recompute their bids.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'На собеседовании частый вопрос: «почему не первая цена». Правильный ответ не «дороже», а «нестабильно»: при первой цене оптимальная ставка зависит от ставок конкурентов, поэтому все начинают их угадывать, ставки осциллируют, и выручка площадки становится непредсказуемой. Любопытно, что в программатик-рекламе индустрия в конце 2010-х вернулась к первой цене — но вместе с автоматическими оптимизаторами ставок на стороне покупателя, которые и решают задачу угадывания.',
        'A common interview question: "why not first price". The right answer is not "more expensive" but "unstable": under first price the optimal bid depends on competitors\' bids, so everyone starts guessing, bids oscillate and platform revenue becomes unpredictable. Curiously, programmatic advertising moved back to first price in the late 2010s — but together with automated bid optimisers on the buy side, which is what solves the guessing problem.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'ads.auctions.py-gsp',
      prompt: l(
        'Реализуй расчёт позиций и цен в аукционе GSP с учётом качества. На вход список объявлений — кортежи (идентификатор, ставка, качество) — и число мест. Отранжируй по убыванию ставка × качество, при равенстве ранга — по идентификатору по возрастанию. Для каждого победителя цена за клик равна ставке следующего по рангу, умноженной на его качество и делённой на качество текущего; для последнего показанного, если следующего нет, цена равна нулю. Цена не может превышать собственную ставку — обрежь сверху. Верни список кортежей (идентификатор, позиция с единицы, цена).',
        'Implement slot allocation and pricing for a quality-weighted GSP auction. The input is a list of ads — tuples of (id, bid, quality) — and the number of slots. Rank by bid × quality descending, breaking ties by id ascending. For each winner the price per click is the next-ranked bid times its quality divided by the current ad\'s quality; for the last shown ad with nobody below, the price is zero. The price may not exceed the ad\'s own bid — cap it. Return a list of tuples (id, 1-based position, price).',
      ),
      signature:
        'def gsp_auction(ads: list[tuple[str, float, float]], slots: int) -> list[tuple[str, int, float]]:',
      starter: `def gsp_auction(ads, slots):
    """Quality-weighted generalised second price auction."""
    # TODO
    return []
`,
      reference: `def gsp_auction(ads, slots):
    """Quality-weighted generalised second price auction."""
    ranked = sorted(ads, key=lambda ad: (-ad[1] * ad[2], ad[0]))
    out = []
    for i, (ad_id, bid, quality) in enumerate(ranked[:slots]):
        if i + 1 < len(ranked):
            nxt_id, nxt_bid, nxt_quality = ranked[i + 1]
            price = nxt_bid * nxt_quality / quality if quality > 0 else 0.0
        else:
            price = 0.0
        out.append((ad_id, i + 1, min(price, bid)))
    return out
`,
      sampleTests: `ads = [('A', 30.0, 0.1), ('B', 20.0, 0.1), ('C', 10.0, 0.1)]
res = gsp_auction(ads, 2)
assert [r[0] for r in res] == ['A', 'B']
assert abs(res[0][2] - 20.0) < 1e-12   # A pays B's bid
assert abs(res[1][2] - 10.0) < 1e-12   # B pays C's bid

# Equal qualities make it an ordinary second-price ladder.
assert len(gsp_auction(ads, 5)) == 3
`,
      tests: `# 1. Equal quality reduces GSP to a plain second-price ladder.
ads = [('A', 30.0, 0.1), ('B', 20.0, 0.1), ('C', 10.0, 0.1)]
res = gsp_auction(ads, 3)
assert [r[0] for r in res] == ['A', 'B', 'C']
assert abs(res[0][2] - 20.0) < 1e-12
assert abs(res[1][2] - 10.0) < 1e-12
assert abs(res[2][2] - 0.0) < 1e-12

# 2. Quality changes the order, not just the price.
ads = [('rich', 50.0, 0.01), ('good', 20.0, 0.05)]
res = gsp_auction(ads, 2)
assert [r[0] for r in res] == ['good', 'rich'], res

# 3. The price is measured in the winner's own quality units.
ads = [('A', 30.0, 0.2), ('B', 20.0, 0.1)]
res = gsp_auction(ads, 1)
assert abs(res[0][2] - (20.0 * 0.1 / 0.2)) < 1e-12, res

# 4. Nobody ever pays more than they bid.
import random
rnd = random.Random(5)
for _ in range(300):
    pool = [(f'ad{i}', rnd.uniform(1, 100), rnd.uniform(0.01, 0.2)) for i in range(rnd.randint(1, 8))]
    for ad_id, pos, price in gsp_auction(pool, rnd.randint(1, 5)):
        bid = next(b for i, b, q in pool if i == ad_id)
        assert price <= bid + 1e-9, (ad_id, price, bid)
        assert price >= -1e-12

# 5. Positions are consecutive from one, and nobody appears twice.
res = gsp_auction([(f'a{i}', 10.0 + i, 0.1) for i in range(6)], 4)
assert [r[1] for r in res] == [1, 2, 3, 4]
assert len({r[0] for r in res}) == 4

# 6. Fewer ads than slots: everyone shown, the last one pays nothing.
res = gsp_auction([('A', 5.0, 0.1), ('B', 3.0, 0.1)], 5)
assert len(res) == 2
assert abs(res[-1][2] - 0.0) < 1e-12

# 7. Ties in rank are broken by id, deterministically.
res = gsp_auction([('b', 10.0, 0.1), ('a', 10.0, 0.1)], 2)
assert [r[0] for r in res] == ['a', 'b']

# 8. Raising your bid without changing the order does not change your price.
base = gsp_auction([('A', 30.0, 0.1), ('B', 20.0, 0.1), ('C', 10.0, 0.1)], 2)
higher = gsp_auction([('A', 45.0, 0.1), ('B', 20.0, 0.1), ('C', 10.0, 0.1)], 2)
assert abs(base[0][2] - higher[0][2]) < 1e-12

# 9. Degenerate inputs.
assert gsp_auction([], 3) == []
assert gsp_auction([('A', 10.0, 0.1)], 0) == []
`,
      writeup: l(
        'Главная идея в третьем тесте: цена считается в единицах качества победителя. Объявлению, которое кликают вдвое чаще, достаточно вдвое меньшей цены за клик, чтобы дать площадке ту же выручку с показа — поэтому делим на собственное качество. Восьмой тест показывает ключевое свойство второй цены: повышение ставки не меняет твою цену, пока не меняет порядок. Именно из-за этого в аукционе второй цены нет смысла завышать ставку ради позиции — заплатишь ты всё равно по ставке следующего, а вот риск выиграть место, которое тебе невыгодно, появится. Обрезание цены собственной ставкой нужно для краевого случая, когда качество следующего сильно выше твоего: формула может дать цену больше твоей ставки, а брать её нельзя.',
        'The key idea is in the third test: the price is measured in the winner\'s own quality units. An ad clicked twice as often needs half the price per click to give the platform the same revenue per impression — hence dividing by its own quality. The eighth test shows the defining property of a second price: raising your bid does not change your price as long as it does not change the order. That is why there is no point inflating a bid for position in a second-price auction — you still pay the next bid, while gaining the risk of winning a slot that does not pay off. Capping the price at your own bid handles the edge case where the next ad\'s quality is far above yours: the formula can produce a price above your bid, and charging it is not allowed.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ads.auctions.q-truthful',
      mode: 'single',
      prompt: l(
        'Почему при GSP рекламодателю бывает выгодно занижать ставку?',
        'Why does shading the bid sometimes pay off under GSP?',
      ),
      choices: [
        { id: 'a', text: l('Чтобы сэкономить: платишь меньше на том же месте', 'To save money: pay less for the same slot') },
        {
          id: 'b',
          text: l(
            'Занижение может сдвинуть его на место ниже, где цена клика заметно меньше, а кликов немногим меньше',
            'Shading can move them to a lower slot where the click price is much lower while the clicks are only slightly fewer',
          ),
        },
        { id: 'c', text: l('Чтобы конкуренты не узнали истинную ценность', 'To hide the true value from competitors') },
        { id: 'd', text: l('При GSP занижать невыгодно, это VCG', 'Shading does not pay under GSP, that is VCG') },
      ],
      correct: ['b'],
      explanation: l(
        'Вариант a неверен: собственная ставка не влияет на цену, пока не меняется позиция, — это свойство второй цены. Занижение работает иначе: оно меняет позицию. Если CTR второго места лишь немного ниже первого, а цена клика там заметно меньше, прибыль на втором месте выше. Именно поэтому GSP не правдив: оптимальная ставка зависит от того, как соотносятся CTR соседних позиций и ставки конкурентов. В симуляторе это видно как максимум красной кривой левее истинной ценности.',
        'Option a is wrong: your own bid does not affect your price while the position holds — that is the second-price property. Shading works differently: it changes the position. If the CTR of slot two is only slightly below slot one while the click price there is much lower, profit is higher in slot two. This is exactly why GSP is not truthful: the optimal bid depends on how the CTRs of adjacent slots relate and on competitors\' bids. In the simulator this shows up as the red curve peaking to the left of the true value.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Generalized second-price auction',
      url: 'https://en.wikipedia.org/wiki/Generalized_second-price_auction',
    },
    {
      title: 'Wikipedia: Vickrey-Clarke-Groves auction',
      url: 'https://en.wikipedia.org/wiki/Vickrey%E2%80%93Clarke%E2%80%93Groves_auction',
    },
  ],
};
