import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const boostingGradient: SkillNode = {
  id: 'boosting.gradient',
  branch: 'boosting',
  act: 4,
  tier: 1,
  title: l('Как бустинг на самом деле учится', 'How boosting actually learns'),
  blurb: l(
    'Сумма маленьких деревьев, каждое по ошибкам предыдущих. И где она ломается.',
    'A sum of small trees, each on the previous ones\' mistakes. And where it breaks.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 8,
  theory: [
    {
      type: 'p',
      text: l(
        'Бустинг объясняют двумя способами, и оба верны. Первый, инженерный: обучаем маленькое дерево, смотрим, где ошиблись, обучаем следующее дерево на этих ошибках, складываем с небольшим весом, повторяем. Второй, математический: это градиентный спуск, только шаги делаются не в пространстве параметров, а в пространстве функций, и очередное дерево приближает антиградиент функции потерь. Для квадратичной ошибки антиградиент — это в точности остаток, поэтому первое объяснение оказывается частным случаем второго.',
        'Boosting is explained in two ways, and both are right. The first, engineering one: train a small tree, see where it was wrong, train the next tree on those mistakes, add it with a small weight, repeat. The second, mathematical one: it is gradient descent, only the steps are taken in function space rather than parameter space, and each tree approximates the negative gradient of the loss. For squared error the negative gradient is exactly the residual, which makes the first explanation a special case of the second.',
      ),
    },
    {
      type: 'formula',
      tex: 'F_{m}(x) = F_{m-1}(x) + \\eta \\cdot h_m(x), \\qquad h_m \\approx -\\frac{\\partial L}{\\partial F_{m-1}}',
      caption: l(
        'η — скорость обучения, то самое «с небольшим весом». Для MSE производная даёт остаток y − F, для логлосса — разницу между меткой и предсказанной вероятностью, и только этим бустинг под классификацию отличается от бустинга под регрессию.',
        'η is the learning rate, the "with a small weight" part. For MSE the derivative gives the residual y − F; for log loss it gives the difference between the label and the predicted probability, and that is the only thing separating boosting for classification from boosting for regression.',
      ),
    },
    {
      type: 'sim',
      sim: 'gbm-steps',
      title: l('Бустинг по шагам', 'Boosting step by step'),
      caption: l(
        'Деревья здесь обучаются по-настоящему: на каждом шаге перебираются все пороги между соседними точками и выбирается тот, что лучше всего объясняет остатки. Начни с одного дерева и добавляй по одному — кривая собирается ступеньками. Потом поставь скорость 0.1 и 60 деревьев, а затем 0.6 и 10: бюджет похожий, результат разный. И главное — нижний график: ошибка на обучении падает всегда, на отложенных данных разворачивается, и место разворота зависит от шума в данных.',
        'The trees here are trained for real: at each step every threshold between neighbouring points is tried and the one that best explains the residuals wins. Start with one tree and add them one at a time — the curve assembles in steps. Then set the rate to 0.1 with 60 trees, and after that 0.6 with 10: a similar budget, a different result. And above all the lower chart: training error always falls, held-out error turns around, and where it turns depends on the noise in the data.',
      ),
    },
    {
      type: 'h',
      text: l('Три ручки, которые решают всё', 'The three knobs that decide everything'),
    },
    {
      type: 'table',
      head: [
        l('Ручка', 'Knob'),
        l('Что делает', 'What it does'),
        l('Как ошибаются', 'How people get it wrong'),
      ],
      rows: [
        [
          l('Скорость обучения', 'Learning rate'),
          l(
            'Масштабирует вклад каждого дерева. Меньше — точнее, но нужно больше деревьев.',
            'Scales each tree\'s contribution. Smaller is more accurate but needs more trees.',
          ),
          l(
            'Крутят её отдельно от числа деревьев, хотя работает произведение.',
            'Tuned separately from the number of trees, although it is the product that matters.',
          ),
        ],
        [
          l('Число деревьев', 'Number of trees'),
          l(
            'Сколько шагов сделать. Подбирается ранней остановкой по отложенной выборке.',
            'How many steps to take. Chosen by early stopping on a held-out set.',
          ),
          l(
            'Фиксируют заранее круглым числом вместо ранней остановки.',
            'Fixed in advance at a round number instead of early stopping.',
          ),
        ],
        [
          l('Глубина', 'Depth'),
          l(
            'Сколько признаков дерево может учесть вместе. Глубина d — это взаимодействия порядка d.',
            'How many features one tree can combine. Depth d means interactions of order d.',
          ),
          l(
            'Берут большую «чтобы хватило», хотя глубина 6–8 закрывает почти всё.',
            'Set large "to be safe", though a depth of 6–8 covers almost everything.',
          ),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Ранняя остановка по той же выборке, по которой потом объявляется качество, — это подглядывание. Число деревьев подбирается по валидации, а итоговое число в отчёте берётся с теста, которого алгоритм не видел. Ошибка стоит обычно немного, пару процентов завышения, но на соревновании или в сравнении двух моделей этого хватает, чтобы выбрать не ту.',
        'Early stopping on the same set the quality is later announced on is peeking. The number of trees is chosen on validation, and the figure in the report comes from a test set the algorithm never saw. The mistake usually costs little, a couple of per cent of inflation, but on a leaderboard or when comparing two models that is enough to pick the wrong one.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'boosting.gradient.py-fit',
      prompt: l(
        'Напиши градиентный бустинг на пнях (деревьях глубины 1) для квадратичной ошибки. Начальное предсказание — среднее ys. Кандидаты в пороги — середины между соседними различными значениями xs по возрастанию. На каждом шаге считаются остатки от текущего предсказания, перебором выбирается порог с минимальной суммой квадратов отклонений остатков от средних в двух половинах (x < threshold — левая), при равенстве берётся меньший порог; предсказание увеличивается на lr, умноженное на выход пня. Верни список предсказаний для точек query.',
        'Write gradient boosting on stumps (depth-1 trees) for squared error. The initial prediction is the mean of ys. The threshold candidates are the midpoints between neighbouring distinct values of xs in ascending order. At each step compute the residuals from the current prediction and pick, by exhaustive search, the threshold with the smallest sum of squared deviations of the residuals from the two halves\' means (x < threshold is the left half); on a tie take the smaller threshold. The prediction grows by lr times the stump\'s output. Return the list of predictions for the query points.',
      ),
      signature:
        'def boost(xs: list[float], ys: list[float], n_trees: int, lr: float, query: list[float]) -> list[float]:',
      starter: `def boost(xs, ys, n_trees, lr, query):
    # TODO
    return [0.0] * len(query)
`,
      reference: `def boost(xs, ys, n_trees, lr, query):
    base = sum(ys) / len(ys)
    values = sorted(set(xs))
    candidates = [(values[i - 1] + values[i]) / 2 for i in range(1, len(values))]

    preds = [base] * len(xs)
    stumps = []

    for _ in range(n_trees):
        residuals = [y - p for y, p in zip(ys, preds)]
        best = None
        for threshold in candidates:
            left = [r for x, r in zip(xs, residuals) if x < threshold]
            right = [r for x, r in zip(xs, residuals) if x >= threshold]
            if not left or not right:
                continue
            left_mean = sum(left) / len(left)
            right_mean = sum(right) / len(right)
            sse = sum((r - left_mean) ** 2 for r in left) + sum((r - right_mean) ** 2 for r in right)
            if best is None or sse < best[0]:
                best = (sse, threshold, left_mean, right_mean)
        if best is None:
            break
        _, threshold, left_mean, right_mean = best
        stumps.append((threshold, left_mean, right_mean))
        preds = [
            p + lr * (left_mean if x < threshold else right_mean)
            for x, p in zip(xs, preds)
        ]

    out = []
    for x in query:
        value = base
        for threshold, left_mean, right_mean in stumps:
            value += lr * (left_mean if x < threshold else right_mean)
        out.append(value)
    return out
`,
      sampleTests: `xs = [0.0, 1.0, 2.0, 3.0]
ys = [0.0, 0.0, 10.0, 10.0]
assert boost(xs, ys, 0, 1.0, [0.0, 3.0]) == [5.0, 5.0]
assert boost(xs, ys, 1, 1.0, [0.0, 3.0]) == [0.0, 10.0]
`,
      tests: `xs = [0.0, 1.0, 2.0, 3.0]
ys = [0.0, 0.0, 10.0, 10.0]

# No trees at all: the model is the mean of the targets.
assert boost(xs, ys, 0, 1.0, [0.0, 1.5, 3.0]) == [5.0, 5.0, 5.0]

# One stump with a full step lands exactly on both groups.
assert boost(xs, ys, 1, 1.0, [0.0, 3.0]) == [0.0, 10.0]

# A zero learning rate makes every tree useless: the model never moves.
assert boost(xs, ys, 20, 0.0, [0.0, 3.0]) == [5.0, 5.0]

# Half a step goes half the way, and two half steps arrive.
half = boost(xs, ys, 1, 0.5, [0.0, 3.0])
assert abs(half[0] - 2.5) < 1e-9 and abs(half[1] - 7.5) < 1e-9
two = boost(xs, ys, 2, 0.5, [0.0, 3.0])
assert abs(two[0] - 1.25) < 1e-9 and abs(two[1] - 8.75) < 1e-9

# Training error does not grow with more trees.
def mse(n):
    preds = boost(xs, ys, n, 0.3, xs)
    return sum((y - p) ** 2 for y, p in zip(ys, preds)) / len(ys)

errors = [mse(n) for n in (0, 1, 3, 10)]
assert errors == sorted(errors, reverse=True), errors
assert errors[-1] < errors[0] / 10

# A query point outside the training range falls into the nearest leaf:
# a stump is constant beyond its threshold, which is why boosting cannot
# extrapolate a trend.
far = boost(xs, ys, 10, 0.3, [-100.0, 100.0])
edge = boost(xs, ys, 10, 0.3, [0.0, 3.0])
assert abs(far[0] - edge[0]) < 1e-9 and abs(far[1] - edge[1]) < 1e-9

# A harder shape still fits: three levels need more than one stump.
xs2 = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]
ys2 = [1.0, 1.0, 5.0, 5.0, 2.0, 2.0]
# Thirty trees at this rate are not enough for three levels; sixty are.
assert max(abs(y - p) for y, p in zip(ys2, boost(xs2, ys2, 30, 0.3, xs2))) > 0.1
assert max(abs(y - p) for y, p in zip(ys2, boost(xs2, ys2, 60, 0.3, xs2))) < 0.05
`,
      writeup: l(
        'Главная строчка здесь — та, где считаются остатки: они берутся от текущего предсказания, а не от нуля и не от исходного y. Если взять от y, все деревья получатся одинаковыми, модель перестанет учиться после первого шага, и ошибка просто застынет — при этом ничего не упадёт, и баг легко прожить месяц.\n\nПоследний тест стоит отдельного внимания: предсказание в точке x = 100 ровно такое же, как в точке x = 3. Сумма пней — кусочно-постоянная функция, и за границами обучающей выборки она не продолжает тренд, а держит последнее значение. Поэтому бустинг не экстраполирует: на временных рядах с трендом он предскажет вчерашний уровень, и это не настройка, которую можно подкрутить, а свойство модели. Лечится либо вычитанием тренда до обучения, либо признаками, которые уже содержат нужную экстраполяцию.\n\nИ ещё: ранняя остановка здесь не реализована намеренно. В настоящем бустинге она обязательна, но для этого нужна отложенная выборка, а тест на монотонное убывание ошибки обучения в её отсутствие — именно то, что надо проверить сначала.',
        'The key line is the one computing residuals: they are taken from the current prediction, not from zero and not from the original y. Take them from y and every tree comes out identical, the model stops learning after the first step and the error simply freezes — while nothing crashes, so the bug easily survives a month.\n\nThe last test deserves attention: the prediction at x = 100 is exactly the one at x = 3. A sum of stumps is a piecewise-constant function, and beyond the training range it does not continue a trend but holds the last value. So boosting does not extrapolate: on a trending time series it predicts yesterday\'s level, and that is a property of the model rather than a setting to turn. The cures are subtracting the trend before training, or features that already contain the needed extrapolation.\n\nAlso: early stopping is deliberately not implemented here. In real boosting it is mandatory, but it needs a held-out set, and a test that the training error decreases monotonically without one is exactly what to check first.',
      ),
    },
    {
      kind: 'findbug',
      id: 'boosting.gradient.bug-residuals',
      lang: 'python',
      prompt: l(
        'Этот бустинг обучается без ошибок, но качество не растёт после первого дерева: что десять деревьев, что сто — одна и та же ошибка. Укажи строку с причиной.',
        'This boosting trains without errors but stops improving after the first tree: ten trees and a hundred give the same error. Point at the line responsible.',
      ),
      code: `def fit(xs, ys, n_trees, lr):
    base = mean(ys)
    preds = [base] * len(xs)
    trees = []
    for _ in range(n_trees):
        residuals = [y - base for y in ys]
        tree = fit_stump(xs, residuals)
        trees.append(tree)
        preds = [p + lr * tree(x) for x, p in zip(xs, preds)]
    return base, trees`,
      buggyLines: [6],
      explanation: l(
        'Остатки в строке 6 считаются от base — от начального предсказания, которое никогда не меняется, — вместо текущего preds. Поэтому каждое дерево решает ровно ту же задачу, что и первое, и получается сто копий одного дерева. Модель при этом не ломается: предсказания складываются, и при lr * n_trees около единицы результат даже похож на правильный, просто он эквивалентен одному дереву с большим шагом. Правильная строка: residuals = [y - p for y, p in zip(ys, preds)]. Признак на ревью: если в цикле бустинга переменная preds обновляется, но нигде не читается, значит обучение идёт не на том.',
        'The residuals on line 6 are computed from base — the initial prediction, which never changes — instead of the current preds. So every tree solves exactly the same problem as the first one, and you get a hundred copies of one tree. The model does not break: the predictions add up and, with lr * n_trees near one, the result even looks about right — it is simply equivalent to a single tree with a large step. The correct line is residuals = [y - p for y, p in zip(ys, preds)]. The review heuristic: if preds is updated inside the boosting loop but never read, the training is running on the wrong thing.',
      ),
    },
    {
      kind: 'quiz',
      id: 'boosting.gradient.q-knobs',
      mode: 'multi',
      prompt: l(
        'Модель обучена со скоростью 0.3 и 200 деревьями. Качество на валидации перестало расти после 120-го дерева, а на обучении продолжает. Какие утверждения верны?',
        'A model is trained with a rate of 0.3 and 200 trees. Validation quality stopped improving after tree 120 while training quality keeps going. Which statements are true?',
      ),
      choices: [
        {
          id: 'early-stop',
          text: l(
            'Правильно оставить 120 деревьев: остальные только подгоняются под шум',
            'Keeping 120 trees is right: the rest only fit noise',
          ),
        },
        {
          id: 'lower-lr',
          text: l(
            'При скорости 0.1 оптимум почти наверняка окажется дальше 120 деревьев',
            'At a rate of 0.1 the optimum will almost certainly lie beyond 120 trees',
          ),
        },
        {
          id: 'depth-fix',
          text: l(
            'Увеличение глубины деревьев сдвинет точку разворота вправо',
            'Increasing the tree depth will move the turning point to the right',
          ),
        },
        {
          id: 'train-ok',
          text: l(
            'Продолжающееся падение ошибки на обучении само по себе не признак поломки',
            'The training error continuing to fall is not by itself a sign of a problem',
          ),
        },
      ],
      correct: ['early-stop', 'lower-lr', 'train-ok'],
      explanation: l(
        'Ранняя остановка на 120 — это ровно то, для чего существует валидационная выборка. Меньшая скорость означает меньший шаг, поэтому до того же суммарного сдвига нужно больше деревьев: оптимум уедет вправо, а не влево. Падение ошибки на обучении при неподвижной валидации — нормальное поведение бустинга, а не баг: модель продолжает уточнять ответы на известных точках, просто это перестало помогать на новых. А вот увеличение глубины действует в противоположную сторону: более глубокие деревья делают больший шаг за итерацию и переобучаются раньше, поэтому точка разворота сдвинется влево. Это частая путаница: глубину и число деревьев нельзя крутить независимо, они обе управляют одной и той же ёмкостью.',
        'Early stopping at 120 is exactly what a validation set exists for. A smaller rate means a smaller step, so reaching the same total shift takes more trees: the optimum moves right, not left. Training error falling while validation stands still is normal boosting behaviour rather than a bug: the model keeps refining its answers on known points, it has simply stopped helping on new ones. Increasing the depth, however, works the other way: deeper trees take a bigger step per iteration and overfit sooner, so the turning point moves left. This is a common confusion: depth and the number of trees cannot be turned independently, they both control the same capacity.',
      ),
    },
  ],

  sources: [
    {
      title: 'The Elements of Statistical Learning',
      url: 'https://www.statlearning.com/',
      note: l(
        'Глава про бустинг: тот самый взгляд через градиентный спуск в пространстве функций.',
        'The boosting chapter: the gradient-descent-in-function-space view itself.',
      ),
    },
  ],
};
