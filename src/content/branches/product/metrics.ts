import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const productMetrics: SkillNode = {
  id: 'product.metrics',
  branch: 'product',
  act: 5,
  tier: 1,
  title: l('От метрики к деньгам', 'From a metric to money'),
  blurb: l(
    'Как превратить «CTR вырос на 2%» в сумму и почему это меняет спор.',
    'How to turn "CTR is up 2%" into a sum of money, and why that changes the argument.',
  ),
  requires: ['boss.production'],
  theory: [
    {
      type: 'p',
      text: l(
        'Вопрос «сколько это в деньгах» на ревью эксперимента звучит как придирка менеджера, а на самом деле это единственный способ сравнить несравнимое: прирост nDCG, ускорение выдачи на 20 мс и новую кнопку. Пока всё измеряется в своих единицах, спор выигрывает тот, кто громче. Как только всё приведено к одной шкале, спор становится проверяемым.',
        'At an experiment review "how much is this in money" sounds like a manager nitpicking, but it is the only way to compare the incomparable: an nDCG gain, 20 ms shaved off the response, and a new button. While everything is measured in its own units the argument is won by whoever is loudest. Once everything is on one scale the argument becomes checkable.',
      ),
    },
    {
      type: 'formula',
      tex: 'R = U \\cdot s \\cdot \\mathrm{CTR} \\cdot c \\cdot \\mathrm{AOV} \\cdot m',
      caption: l(
        'Выручка как произведение: пользователи, поисков на пользователя, CTR выдачи, конверсия клика в заказ, средний чек, маржа. Любая продуктовая метрика — это один из множителей или их комбинация.',
        'Revenue as a product: users, searches per user, result-page CTR, click-to-order conversion, average order value, margin. Any product metric is one of these factors or a combination of them.',
      ),
    },
    {
      type: 'sim',
      sim: 'money-bridge',
      title: l('Один процент в каждом множителе', 'One per cent in each factor'),
      caption: l(
        'Сначала подвигай верхний ползунок и посмотри на плашку «разброс между множителями». Она равна нулю при любом приросте, и это не баг: в произведении один процент где угодно стоит одинаково. Потом поставь реалистичные приросты по каждому множителю отдельно — и станет видно, что спор про «самую важную метрику» на самом деле про достижимость, а не про важность.',
        'First move the top slider and watch the "spread between the factors" readout. It is zero at any lift, and that is not a bug: in a product, one per cent anywhere is worth the same. Then set realistic lifts for each factor separately — and it becomes visible that the argument about "the most important metric" is really about achievability rather than importance.',
      ),
    },
    {
      type: 'sim',
      sim: 'metric-decomposition',
      title: l('Во что обходится чувствительность', 'What sensitivity costs'),
      caption: l(
        'Обратная сторона: множители стоят одинаково, но измеряются по-разному. Выручка на пользователя — худшая по чувствительности метрика во всей воронке, потому что в ней сложены нули непокупателей и тяжёлый хвост чеков. Отсюда рабочая связка: эффект измеряют в том множителе, где он ожидается, а решение принимают по верхнеуровневой метрике.',
        'The flip side: the factors are worth the same but measure very differently. Revenue per user is the least sensitive metric in the whole funnel, because it stacks non-buyers\' zeros on a heavy order-value tail. Hence the working pairing: measure the effect in the factor where it is expected, decide on the top-level metric.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Перевод в деньги честен ровно настолько, насколько честно предположение о переносе. Эффект, измеренный на 5% трафика за две недели, умножают на год и на всех пользователей — и получают число, которое выглядит точным до рубля. Правильная форма ответа — интервал и явно названное предположение: «при сохранении эффекта это 40–90 млн в год, но эффект измерен на двух неделях и без учёта сезонности».',
        'Converting to money is honest exactly as far as the transfer assumption is. An effect measured on 5% of traffic over two weeks gets multiplied by a year and by all users — producing a number that looks precise to the rouble. The right shape of answer is an interval with the assumption stated: "if the effect holds, that is 40–90M a year, but it was measured over two weeks and without seasonality".',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'product.metrics.py-impact',
      prompt: l(
        'Посчитай годовой эффект в деньгах. На вход словарь воронки с ключами users, searches_per_user, ctr, conversion, aov, margin, days и словарь относительных приростов changes (ключ — имя множителя, значение — относительный прирост, например 0.02). Верни разницу между выручкой после изменений и до. Множители, которых нет в changes, не меняются; неизвестный ключ в changes — ValueError.',
        'Compute the annual effect in money. The input is a funnel dict with the keys users, searches_per_user, ctr, conversion, aov, margin, days, and a dict of relative lifts, changes (the key is a factor name, the value a relative lift such as 0.02). Return the difference between revenue after the changes and before. Factors absent from changes do not move; an unknown key in changes is a ValueError.',
      ),
      signature: 'def annual_impact(funnel: dict, changes: dict) -> float:',
      starter: `def annual_impact(funnel, changes):
    # TODO
    return 0.0
`,
      reference: `FACTORS = ('users', 'searches_per_user', 'ctr', 'conversion', 'aov', 'margin', 'days')


def annual_impact(funnel, changes):
    for key in changes:
        if key not in FACTORS:
            raise ValueError(f'unknown factor: {key}')

    before = 1.0
    after = 1.0
    for factor in FACTORS:
        value = funnel[factor]
        before *= value
        after *= value * (1 + changes.get(factor, 0.0))
    return after - before
`,
      sampleTests: `funnel = {
    'users': 1_000_000, 'searches_per_user': 3.0, 'ctr': 0.3,
    'conversion': 0.05, 'aov': 2000.0, 'margin': 0.1, 'days': 365,
}
base = annual_impact(funnel, {})
assert base == 0.0
assert annual_impact(funnel, {'ctr': 0.01}) > 0
`,
      tests: `funnel = {
    'users': 1_000_000, 'searches_per_user': 3.0, 'ctr': 0.3,
    'conversion': 0.05, 'aov': 2000.0, 'margin': 0.1, 'days': 365,
}

# No changes, no money.
assert annual_impact(funnel, {}) == 0.0

# One per cent in any factor is worth exactly the same: revenue is a product.
one_percent = [annual_impact(funnel, {f: 0.01}) for f in ('ctr', 'conversion', 'aov', 'searches_per_user')]
assert max(one_percent) - min(one_percent) < 1e-6, one_percent

# And it equals one per cent of the whole revenue.
revenue = 1_000_000 * 3.0 * 0.3 * 0.05 * 2000.0 * 0.1 * 365
assert abs(one_percent[0] - revenue * 0.01) < 1e-6

# Two lifts stack multiplicatively, so they beat the sum of the parts.
both = annual_impact(funnel, {'ctr': 0.01, 'conversion': 0.01})
assert both > one_percent[0] + one_percent[1]
assert abs(both - revenue * (1.01 * 1.01 - 1)) < 1e-6

# A drop is negative.
assert annual_impact(funnel, {'ctr': -0.05}) < 0

# An unknown factor is an error rather than a silent zero.
try:
    annual_impact(funnel, {'retention': 0.01})
    raise AssertionError('expected ValueError')
except ValueError:
    pass
`,
      writeup: l(
        'Два теста здесь важнее самой функции. Первый показывает, что один процент в любом множителе стоит одинаково — это прямое следствие того, что выручка есть произведение, и оно разом закрывает бесконечный спор о том, какая метрика «главнее». Второй показывает, что два улучшения не складываются, а перемножаются: 1% и 1% дают не 2%, а 2.01%. На маленьких числах разница незаметна, на 10% и 10% — уже 21%, и именно здесь появляются отчёты, где сумма эффектов отдельных экспериментов за год превышает всю выручку компании. Явная ошибка на неизвестный множитель — не придирка: молчаливый ноль в этом месте превращает опечатку в ключе в «эффекта нет», и такую ошибку в отчёте никто не заметит.',
        'Two of the tests matter more than the function. The first shows that one per cent in any factor is worth the same — a direct consequence of revenue being a product, and it settles the endless argument about which metric is "more important". The second shows that two improvements do not add but multiply: 1% and 1% give 2.01%, not 2%. At small numbers the difference is invisible; at 10% and 10% it is already 21%, and this is where reports come from in which the summed effects of a year\'s experiments exceed the company\'s entire revenue. Raising on an unknown factor is not pedantry: a silent zero there turns a typo in a key into "no effect", and nobody spots that in a report.',
      ),
    },
    {
      kind: 'quiz',
      id: 'product.metrics.q-transfer',
      mode: 'multi',
      prompt: l(
        'Эксперимент на 5% трафика за две недели дал +1.2% к заказам на пользователя, p-value 0.03. Что корректно при переводе в годовые деньги?',
        'An experiment on 5% of traffic over two weeks gave +1.2% in orders per user with a p-value of 0.03. What is correct when converting this into annual money?',
      ),
      choices: [
        {
          id: 'interval',
          text: l(
            'Считать деньги по границам доверительного интервала, а не по точечной оценке',
            'Compute money from the confidence interval bounds rather than from the point estimate',
          ),
        },
        {
          id: 'scale-users',
          text: l(
            'Умножать на всех пользователей корректно: эффект измерен на случайной доле',
            'Multiplying by all users is correct: the effect was measured on a random share',
          ),
        },
        {
          id: 'scale-year',
          text: l(
            'Умножать на год безопасно, если две недели попали в типичный период',
            'Multiplying by a year is safe provided the two weeks fell in a typical period',
          ),
        },
        {
          id: 'sum-experiments',
          text: l(
            'Годовой эффект команды можно получить суммированием таких оценок по всем выигравшим экспериментам',
            'The team\'s annual effect can be obtained by summing such estimates over all winning experiments',
          ),
        },
      ],
      correct: ['interval', 'scale-users', 'scale-year'],
      explanation: l(
        'Перенос на всех пользователей законен — рандомизация на то и нужна, доля была случайной. Перенос на год законен условно: две недели не видят сезонность, и это предположение надо называть вслух, но сама операция не абсурдна. Интервал обязателен: при p = 0.03 нижняя граница эффекта близка к нулю, и честная оценка денег — это диапазон, где нижний конец может оказаться в разы меньше точечного. А вот суммировать эксперименты нельзя, и это самая частая ошибка годовых отчётов. Эффекты пересекаются, часть из них отменяет друг друга, выигравшие эксперименты отобраны по значимости и потому систематически завышены (эффект победителя), а база, к которой применяется процент, меняется после каждой выкатки. Суммы такого рода регулярно дают «рост выручки на 60% за год» при фактическом росте на 8%.',
        'Scaling to all users is legitimate — that is what randomisation is for, and the share was random. Scaling to a year is conditionally legitimate: two weeks cannot see seasonality, and that assumption has to be said out loud, but the operation itself is not absurd. The interval is mandatory: at p = 0.03 the lower bound of the effect is close to zero, and an honest money estimate is a range whose lower end can be several times smaller than the point estimate. Summing experiments, however, is not allowed, and it is the most common mistake in annual reports. The effects overlap, some cancel each other, winning experiments are selected on significance and therefore systematically inflated (the winner\'s curse), and the base the percentage applies to changes after every rollout. Sums like these regularly produce "revenue up 60% this year" against an actual 8%.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'product.metrics.pick-latency',
      area: l('Ускорение выдачи', 'Speeding up the result page'),
      scenario: l(
        'Команда инфраструктуры предлагает проект на квартал: ускорить выдачу на 80 мс за счёт более дешёвой второй стадии ранжирования. Качество ранжирования при этом слегка упадёт. Нужно выбрать метрику, по которой команда будет итерироваться во время работы, метрику, по которой будет принято решение о запуске проекта, и два ограничителя.',
        'The infrastructure team proposes a quarter-long project: cut 80 ms off the result page by making the second ranking stage cheaper. Ranking quality will dip slightly as a result. Pick the metric the team iterates on during the work, the metric the go/no-go decision rests on, and two guardrails.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'p95',
          label: l('p95 времени ответа', 'p95 response time'),
          correctFor: ['offline'],
          note: l(
            'Ровно то, что команда меняет, и видно на каждой итерации без выкатки на пользователей. Решать по ней нельзя: ускорение само по себе не цель.',
            'Exactly what the team is changing, visible at every iteration without shipping to users. It cannot carry the decision: speed by itself is not the goal.',
          ),
        },
        {
          id: 'orders',
          label: l('Заказы на пользователя', 'Orders per user'),
          correctFor: ['online'],
          note: l(
            'Единственная метрика, в которой сравнимы выигрыш от скорости и проигрыш от качества. Именно по ней видно, перевешивает ли одно другое.',
            'The only metric in which the speed gain and the quality loss are comparable. It is what shows whether one outweighs the other.',
          ),
        },
        {
          id: 'ndcg-guard',
          label: l('nDCG@10 по асессорам', 'nDCG@10 on rater labels'),
          correctFor: ['guardrail'],
          note: l(
            'Названный в условии риск: качество падает. Как ограничитель уместен — «падение не больше чем на столько-то», как цель здесь бессмысленнен.',
            'The risk named in the statement: quality drops. It fits as a guardrail — "no worse than this much" — and makes no sense as a goal here.',
          ),
        },
        {
          id: 'infra-cost',
          label: l('Стоимость инфраструктуры на запрос', 'Infrastructure cost per query'),
          correctFor: ['guardrail'],
          note: l(
            'Вторая сторона того же проекта: дешёвая стадия может оказаться дешёвой по задержке и дорогой по железу, если её запускают на большем числе кандидатов. Ограничитель ловит именно это.',
            'The other side of the same project: a cheap stage can be cheap in latency and expensive in hardware if it is run over more candidates. The guardrail catches exactly that.',
          ),
        },
        {
          id: 'ctr-serp',
          label: l('CTR выдачи', 'Result-page CTR'),
          correctFor: [],
          note: l(
            'Вырастет и от ускорения, и от ухудшения выдачи, по которой приходится кликать больше. В задаче с явным компромиссом между скоростью и качеством она не различает хороший исход и плохой.',
            'It rises both from the speed-up and from worse results that force more clicking. In a task with an explicit speed-versus-quality trade-off it cannot tell a good outcome from a bad one.',
          ),
        },
        {
          id: 'cpu',
          label: l('Загрузка CPU кластера', 'Cluster CPU utilisation'),
          correctFor: [],
          note: l(
            'Техническая характеристика, из которой ничего не следует само по себе: она растёт и при росте трафика, и при починке неэффективности. Важна стоимость на запрос, а она уже взята отдельно.',
            'A technical reading that implies nothing on its own: it rises both with traffic growth and when an inefficiency is fixed. What matters is cost per query, already taken separately.',
          ),
        },
      ],
      writeup: l(
        'Этот сценарий — про то, что проект инфраструктуры тоже продуктовый. Ускорение само по себе не цель; целью оно становится только через ту метрику, в которой выигрыш от скорости и проигрыш от качества выражаются одинаково. Поэтому решающая метрика здесь — заказы, а не время ответа, хотя меняют именно время. И поэтому ограничители берутся из условия: качество названо как риск прямо в формулировке, а стоимость — скрытая вторая сторона того же изменения.',
        'This scenario is about an infrastructure project being a product project too. Speed is not a goal in itself; it becomes one only through the metric in which the speed gain and the quality loss are expressed alike. So the deciding metric is orders, not response time, even though response time is what changes. And so the guardrails come from the statement: quality is named as a risk in the wording, and cost is the hidden other side of the same change.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l(
        'Главы про OEC и про перенос результатов эксперимента на продукт.',
        'The chapters on the OEC and on transferring experiment results to the product.',
      ),
    },
  ],
};
