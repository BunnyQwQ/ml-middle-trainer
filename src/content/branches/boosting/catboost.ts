import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const boostingCatboost: SkillNode = {
  id: 'boosting.catboost',
  branch: 'boosting',
  act: 4,
  tier: 2,
  title: l('CatBoost: порядок, категории, симметрия', 'CatBoost: order, categories, symmetry'),
  blurb: l(
    'Откуда берётся утечка в кодировании категорий и чем на неё отвечают.',
    'Where the leak in categorical encoding comes from and what answers it.',
  ),
  requires: ['boosting.gradient'],
  theory: [
    {
      type: 'p',
      text: l(
        'Три вещи, которыми CatBoost отличается от остальных реализаций бустинга, решают три разные задачи, и их часто путают. Упорядоченные статистики по таргету — про кодирование категорий без утечки. Ordered boosting — про утечку в самих градиентах, которая существует даже без категорий. Симметричные деревья — про скорость предсказания и заодно про регуляризацию. Понимать стоит все три по отдельности: на собеседовании «потому что CatBoost хорошо работает с категориями» — это ответ джуна.',
        'The three things that set CatBoost apart from other boosting implementations solve three different problems, and they are often conflated. Ordered target statistics are about encoding categories without a leak. Ordered boosting is about the leak in the gradients themselves, which exists even without categories. Symmetric trees are about prediction speed and, incidentally, regularisation. All three are worth understanding separately: at an interview, "because CatBoost handles categories well" is a junior\'s answer.',
      ),
    },
    {
      type: 'h',
      text: l('Кодирование категорий', 'Encoding categories'),
    },
    {
      type: 'p',
      text: l(
        'Категорию вроде «город» или «идентификатор продавца» дереву нужно превратить в число. Самый сильный способ — заменить её средним значением таргета по этой категории: признак сразу содержит ровно то, что предсказывается. В этом и беда: если считать среднее по всей выборке, в признак строки попадает её собственная метка. При тысяче строк на категорию вклад одной метки незаметен, при трёх — признак почти равен ответу.',
        'A category like "city" or "seller id" has to become a number for a tree. The strongest way is to replace it with the mean target for that category: the feature then contains exactly what is being predicted. That is the trouble: computing the mean over the whole sample puts a row\'s own label into its own feature. With a thousand rows per category one label contributes nothing noticeable; with three, the feature nearly equals the answer.',
      ),
    },
    {
      type: 'formula',
      tex: '\\hat{x}_i = \\frac{\\sum_{j \\prec i, \\; c_j = c_i} y_j + a \\cdot p}{\\left|\\{ j \\prec i : c_j = c_i \\}\\right| + a}',
      caption: l(
        'Упорядоченная статистика: j ≺ i означает «раньше по случайной перестановке». В числителе — только прошлое, a и p — сила сглаживания и априорное значение. Именно отсюда берётся свойство, которого нет у наивного кодирования: признак строки не зависит от её метки.',
        'The ordered statistic: j ≺ i means "earlier in a random permutation". The numerator holds the past only; a and p are the smoothing strength and the prior. This is where the property naive encoding lacks comes from: a row\'s feature does not depend on its label.',
      ),
    },
    {
      type: 'sim',
      sim: 'target-encoding',
      title: l('Три способа закодировать категорию', 'Three ways to encode a category'),
      caption: l(
        'Оставь три строки на категорию и переключай способ кодирования, глядя на знак разрыва. У наивного он положительный: обучение выглядит лучше прода, потому что в признаке строки лежит её собственная метка. У leave-one-out и у упорядоченного знак отрицательный — обучающая оценка пессимистична, и это безопасная сторона ошибки. Разница между ними не в числах, а в природе: leave-one-out всё ещё выдаёт свою метку, только наоборот, а упорядоченный просто мало знает в начале. Поставь сглаживание в ноль, чтобы увидеть оба эффекта в полный рост, а потом увеличь число строк на категорию — разрывы сойдутся, и станет понятно, почему про эту проблему вспоминают только на редких категориях.',
        'Keep three rows per category and switch the encoding scheme while watching the sign of the gap. For the naive one it is positive: training looks better than production, because a row\'s own label sits in its feature. For leave-one-out and for the ordered scheme the sign is negative — the training estimate is pessimistic, which is the safe side of the error. The difference between them is not in the numbers but in their nature: leave-one-out still reveals your own label, merely inverted, while the ordered scheme simply knows little at the start. Set the smoothing to zero to see both effects at full size, then raise the rows per category — the gaps converge, which shows why the problem is only ever remembered on rare categories.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Ordered boosting — это та же идея, но на уровень выше. Градиент для строки i считается моделью, обученной только на строках, идущих раньше i: иначе модель уже видела метку i, её остаток систематически занижен, и смещение накапливается с каждой итерацией. Это и есть «prediction shift», ради которого городится вся конструкция с перестановками. Платить приходится скоростью, поэтому на больших выборках, где смещение и так мало, ordered boosting обычно выключают.',
        'Ordered boosting is the same idea one level up. The gradient for row i is computed by a model trained only on rows preceding i: otherwise the model has already seen i\'s label, its residual is systematically understated, and the bias accumulates with every iteration. This is the "prediction shift" the whole permutation machinery exists for. It costs speed, so on large samples, where the bias is small anyway, ordered boosting is usually switched off.',
      ),
    },
    {
      type: 'sim',
      sim: 'oblivious-trees',
      title: l('Симметричные деревья', 'Symmetric trees'),
      caption: l(
        'На каждом уровне один и тот же признак и один и тот же порог для всех узлов. Числа слева посчитаны, а не взяты из головы: классическому дереву глубины d нужно 2^d − 1 порогов, симметричному — ровно d. Посмотри на код под графиком: предсказание превращается в индекс, собранный из битов сравнений, без единого ветвления.',
        'The same feature and the same threshold for every node of a level. The numbers on the left are counted rather than asserted: a classic tree of depth d needs 2^d − 1 splits, a symmetric one exactly d. Look at the code under the chart: a prediction becomes an index assembled from comparison bits, with no branching at all.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'boosting.catboost.py-ordered',
      prompt: l(
        'Реализуй упорядоченную статистику по таргету. На вход список категорий, список меток 0/1 в том же порядке, вес сглаживания a и априорное значение p. Для каждой строки верни (сумма меток предыдущих строк той же категории + a * p) / (число таких строк + a). Порядок строк — это и есть перестановка, менять его нельзя. Если a не больше нуля, подними ValueError.',
        'Implement the ordered target statistic. The input is a list of categories, a list of 0/1 labels in the same order, a smoothing weight a and a prior value p. For each row return (the sum of labels of earlier rows in the same category + a * p) / (the number of such rows + a). The row order is the permutation and must not be changed. If a is not greater than zero, raise ValueError.',
      ),
      signature:
        'def ordered_target_stats(categories: list, labels: list[int], a: float, p: float) -> list[float]:',
      starter: `def ordered_target_stats(categories, labels, a, p):
    # TODO
    return []
`,
      reference: `def ordered_target_stats(categories, labels, a, p):
    if a <= 0:
        raise ValueError('smoothing weight must be positive')

    seen = {}
    out = []
    for category, label in zip(categories, labels):
        total, count = seen.get(category, (0, 0))
        out.append((total + a * p) / (count + a))
        seen[category] = (total + label, count + 1)
    return out
`,
      sampleTests: `stats = ordered_target_stats(['a', 'a', 'b'], [1, 0, 1], 1.0, 0.5)
assert abs(stats[0] - 0.5) < 1e-12      # nothing seen yet: the prior
assert abs(stats[1] - 0.75) < 1e-12     # one earlier row with label 1
`,
      tests: `cats = ['x', 'y', 'x', 'x', 'y']
labels = [1, 0, 0, 1, 1]
stats = ordered_target_stats(cats, labels, 1.0, 0.5)

# The first row of each category sees nothing but the prior.
assert abs(stats[0] - 0.5) < 1e-12
assert abs(stats[1] - 0.5) < 1e-12

# Row 2 of 'x' sees one earlier row with label 1: (1 + 0.5) / 2.
assert abs(stats[2] - 0.75) < 1e-12
# Row 3 of 'x' sees labels 1 and 0: (1 + 0.5) / 3.
assert abs(stats[3] - 0.5) < 1e-12
# Row 4 of 'y' sees a single zero: (0 + 0.5) / 2.
assert abs(stats[4] - 0.25) < 1e-12

# A row's own label never enters its own feature: flipping it changes
# everything after it and nothing at or before it.
flipped = list(labels)
flipped[2] = 1
other = ordered_target_stats(cats, flipped, 1.0, 0.5)
assert other[:3] == stats[:3], (other[:3], stats[:3])
assert other[3] != stats[3]

# The order is the permutation: reversing it gives different features.
back = ordered_target_stats(cats[::-1], labels[::-1], 1.0, 0.5)
assert back != stats[::-1]

# Everything stays inside [0, 1] for binary labels and a prior inside it.
assert all(0.0 <= v <= 1.0 for v in ordered_target_stats(cats * 20, labels * 20, 2.0, 0.3))

# Heavy smoothing pulls everything towards the prior.
heavy = ordered_target_stats(cats, labels, 1000.0, 0.5)
assert all(abs(v - 0.5) < 0.01 for v in heavy)

# A non-positive weight is an error, not a division by zero.
for bad in (0.0, -1.0):
    try:
        ordered_target_stats(cats, labels, bad, 0.5)
        raise AssertionError('expected ValueError')
    except ValueError:
        pass
`,
      writeup: l(
        'Тест с перевёрнутым порядком — тот самый, ради которого всё это и написано. Признак зависит от перестановки, то есть у одной и той же строки он разный при разном порядке. Это выглядит как недостаток, но именно так и устроено: CatBoost генерирует несколько случайных перестановок и усредняет, чтобы ни одна строка не оказалась систематически в начале, где статистики почти нет, или в конце, где их много.\n\nВторой важный тест — про собственную метку: меняем метку третьей строки, и ничего до неё включительно не сдвигается. Это свойство нельзя получить ни наивным средним, ни leave-one-out: в LOO среднее тоже меняется при смене своей метки, просто в обратную сторону, и модель глубины два легко восстанавливает по нему ответ.\n\nСглаживание a здесь не косметика. При a = 0 первая строка категории даёт 0/0, а вторая — метку первой строки в чистом виде, то есть признак становится идеальным предсказателем для пар. Положительное a одновременно убирает деление на ноль и притягивает редкие категории к общему среднему, где им и место.',
        'The reversed-order test is the one all of this exists for. The feature depends on the permutation, so the same row gets a different value under a different order. That looks like a defect but is exactly the design: CatBoost generates several random permutations and averages, so no row is systematically at the start, where there are almost no statistics, or at the end, where there are many.\n\nThe second important test is about a row\'s own label: flip the third row\'s label and nothing up to and including it moves. Neither a naive mean nor leave-one-out can give that property: in LOO the mean also changes when your own label changes, merely in the opposite direction, and a depth-two model recovers the answer from it easily.\n\nThe smoothing a is not cosmetic here. At a = 0 the first row of a category gives 0/0 and the second gives the first row\'s label verbatim, making the feature a perfect predictor for pairs. A positive a removes the division by zero and pulls rare categories towards the global mean, which is where they belong.',
      ),
    },
    {
      kind: 'findbug',
      id: 'boosting.catboost.bug-cat-as-number',
      lang: 'python',
      prompt: l(
        'Качество модели с категориальным признаком «идентификатор продавца» заметно хуже, чем ожидалось, хотя признак сильный. Укажи строку, из-за которой модель видит не то, что задумано.',
        'A model with a "seller id" categorical feature performs noticeably worse than expected, although the feature is strong. Point at the line that makes the model see something other than what was intended.',
      ),
      code: `from catboost import CatBoostClassifier


def train(df):
    codes = {name: i for i, name in enumerate(sorted(df['seller'].unique()))}
    df = df.assign(seller_id=df['seller'].map(codes))
    features = df[['price', 'position', 'seller_id']]
    model = CatBoostClassifier(depth=6, iterations=500)
    model.fit(features, df['bought'])
    return model`,
      buggyLines: [5, 6],
      explanation: l(
        'Строки 5 и 6 превращают названия продавцов в порядковые номера, и дальше модель получает их как обычное число. Дерево умеет задавать таким признакам только вопросы вида «seller_id < 137», то есть делит продавцов по алфавиту их названий — порядок, в котором нет никакого смысла. Информация в признаке остаётся, но добраться до конкретного продавца дерево может только десятком вложенных разбиений, и при тысяче продавцов оно до большинства просто не доходит.\n\nПравильно либо передать исходную колонку как категориальную (cat_features=[\'seller\']), и тогда CatBoost сам построит упорядоченные статистики по таргету, либо закодировать её целевой статистикой вручную — но тогда со всеми предосторожностями из предыдущей задачи. Строка 7 сама по себе не ошибка: в features попадает уже испорченный числовой признак, а исходной категориальной колонки там нет вовсе, так что указывать cat_features было бы нечего.',
        'Lines 5 and 6 turn seller names into ordinal numbers, and the model then receives them as an ordinary number. A tree can only ask such a feature questions like "seller_id < 137", which splits sellers by the alphabet of their names — an order with no meaning whatsoever. The information is still in the feature, but reaching a particular seller takes a dozen nested splits, and with a thousand sellers the tree simply never gets to most of them.\n\nThe fix is either to pass the original column as categorical (cat_features=[\'seller\']), letting CatBoost build ordered target statistics itself, or to encode it with a target statistic by hand — with every precaution from the previous task. Line 7 is not itself the mistake: the already-spoiled numeric feature is what lands in features, and the original categorical column is not there at all, so there would be nothing for cat_features to point at.',
      ),
    },
    {
      kind: 'quiz',
      id: 'boosting.catboost.q-three',
      mode: 'multi',
      prompt: l(
        'Какие утверждения про механизмы CatBoost верны?',
        'Which statements about CatBoost\'s mechanisms are true?',
      ),
      choices: [
        {
          id: 'shift-without-cats',
          text: l(
            'Смещение предсказаний, ради которого сделан ordered boosting, возникает и без категориальных признаков',
            'The prediction shift that ordered boosting addresses occurs even without categorical features',
          ),
        },
        {
          id: 'symmetric-weaker',
          text: l(
            'Симметричное дерево выразительно беднее классического той же глубины',
            'A symmetric tree is less expressive than a classic one of the same depth',
          ),
        },
        {
          id: 'ordered-always',
          text: l(
            'Ordered boosting стоит включать всегда: он строго лучше обычного',
            'Ordered boosting should always be on: it is strictly better than the plain mode',
          ),
        },
        {
          id: 'permutations',
          text: l(
            'Несколько перестановок нужны, чтобы строки в начале перестановки не получали систематически худшие признаки',
            'Several permutations exist so that rows at the start of a permutation do not systematically get worse features',
          ),
        },
      ],
      correct: ['shift-without-cats', 'symmetric-weaker', 'permutations'],
      explanation: l(
        'Смещение предсказаний возникает из-за того, что градиент для строки считается моделью, которая эту строку уже видела, — категориальные признаки тут ни при чём, они лишь добавляют второй источник той же проблемы. Симметричные деревья действительно беднее: один порог на уровень — это сильное ограничение, и работает оно как регуляризация, а не только как трюк для скорости. Перестановки нужны именно для выравнивания: первая строка категории видит только априорное значение, и без усреднения по нескольким порядкам часть данных постоянно оказывалась бы в невыгодном положении. А вот «всегда включать ordered boosting» неверно: он заметно дороже по времени, а выигрыш падает с ростом выборки, потому что и само смещение убывает. На миллионах строк его обычно выключают, и документация прямо это допускает.',
        'The prediction shift arises because a row\'s gradient is computed by a model that has already seen that row — categorical features have nothing to do with it, they merely add a second source of the same problem. Symmetric trees really are poorer: one threshold per level is a strong restriction, and it works as regularisation rather than only as a speed trick. The permutations exist precisely to even things out: the first row of a category sees nothing but the prior, and without averaging over several orders part of the data would always be at a disadvantage. "Always switch ordered boosting on" is wrong, though: it is noticeably more expensive, and its benefit shrinks as the sample grows, because the bias itself shrinks. On millions of rows it is usually off, and the documentation explicitly allows that.',
      ),
    },
  ],

  sources: [
    {
      title: 'CatBoost documentation',
      url: 'https://catboost.ai/docs/',
      note: l(
        'Разделы про transforming categorical features и про ordered boosting.',
        'The sections on transforming categorical features and on ordered boosting.',
      ),
    },
  ],
};
