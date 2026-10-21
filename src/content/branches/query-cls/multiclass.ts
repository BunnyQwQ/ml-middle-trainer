import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const qclsMulticlass: SkillNode = {
  id: 'qcls.multiclass',
  branch: 'query-cls',
  tier: 2,
  title: l('Macro и micro F1', 'Macro and micro F1'),
  blurb: l(
    'Две метрики, которые отвечают на разные вопросы и расходятся в разы.',
    'Two metrics that answer different questions and differ several-fold.',
  ),
  requires: ['qcls.imbalance'],
  theory: [
    {
      type: 'p',
      text: l(
        'Когда категорий сотни, агрегировать качество можно двумя способами. Micro складывает все верные и все неверные предсказания в одну кучу и считает метрику по ней: каждый запрос весит одинаково, поэтому результат определяют крупные категории. Macro считает F1 внутри каждой категории отдельно и усредняет: каждая категория весит одинаково, независимо от размера.',
        'With hundreds of categories there are two ways to aggregate quality. Micro pools every correct and incorrect prediction into one heap and computes the metric on it: every query weighs the same, so large categories determine the result. Macro computes F1 inside each category separately and averages: every category weighs the same regardless of size.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'В многоклассовой задаче с одной меткой на объект micro F1 в точности равен accuracy. Это не совпадение: когда каждый объект имеет ровно одно верное и одно предсказанное значение, сумма ложноположительных равна сумме ложноотрицательных, и формула F1 схлопывается в долю верных. Поэтому фраза «у нас micro F1 0.91» ровно ничего не добавляет к «accuracy 0.91».',
        'In a single-label multiclass problem micro F1 exactly equals accuracy. That is no coincidence: when each object has exactly one true and one predicted value, the total false positives equal the total false negatives and the F1 formula collapses into the share of correct answers. So "our micro F1 is 0.91" adds nothing whatsoever to "accuracy is 0.91".',
      ),
    },
    {
      type: 'sim',
      sim: 'macro-micro',
      title: l('Как расходятся macro и micro', 'How macro and micro come apart'),
      caption: l(
        'Ухудшай качество на редких категориях: macro проваливается, micro почти не шевелится — на три крупных класса приходится почти весь трафик. Теперь увеличь размер редких категорий в двадцать раз: micro начинает их замечать. Weighted F1 — промежуточный вариант, он взвешивает по размеру и поэтому ближе к micro, чем кажется по названию.',
        'Degrade the quality on the rare categories: macro collapses while micro hardly moves — three large classes carry almost all the traffic. Now grow the rare categories twentyfold: micro starts to notice them. Weighted F1 is the in-between option; it weights by size and therefore sits closer to micro than its name suggests.',
      ),
    },
    {
      type: 'table',
      head: [l('Вопрос', 'Question'), l('Метрика', 'Metric')],
      rows: [
        [
          l('Какую долю запросов мы обрабатываем верно?', 'What share of queries do we handle correctly?'),
          l('micro F1, он же accuracy', 'micro F1, i.e. accuracy'),
        ],
        [
          l('Насколько хорошо мы умеем каждую категорию?', 'How well do we handle each category?'),
          l('macro F1', 'macro F1'),
        ],
        [
          l('Компромисс с учётом размеров, но без провала хвоста', 'A compromise accounting for size without ignoring the tail'),
          l('weighted F1 или macro по укрупнённым группам', 'weighted F1, or macro over coarsened groups'),
        ],
      ],
    },
    {
      type: 'p',
      text: l(
        'Выбор между ними — продуктовый, а не технический. Если цена ошибки одинакова для любого запроса, честнее micro: он прямо отвечает, сколько пользователей получили верный результат. Если у каждой категории есть владелец и редкая категория для своего пользователя так же важна, как частая, — macro. В товарном поиске обычно смотрят на обе и дополнительно на accuracy на топ-20 категорий: они дают разные сигналы и расхождение между ними само по себе информативно.',
        'Choosing between them is a product decision, not a technical one. If the cost of an error is the same for any query, micro is the honest choice: it directly answers how many users got the right result. If every category has an owner and a rare category matters as much to its user as a common one does, macro. In product search people usually watch both plus accuracy on the top-20 categories: they carry different signals, and a divergence between them is informative in itself.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Macro F1 крайне чувствителен к категориям с несколькими примерами. Категория с тремя запросами в валидации даст F1 либо 0, либо 0.5, либо 1, и этот шум войдёт в среднее с тем же весом, что и категория с пятью тысячами примеров. Поэтому категории с размером меньше порога либо объединяют, либо выносят в отдельную метрику, а не смешивают с остальными.',
        'Macro F1 is extremely sensitive to categories with a handful of examples. A category with three queries in validation gives an F1 of 0, 0.5 or 1, and that noise enters the average with the same weight as a category with five thousand examples. So categories below a size threshold are either merged or reported as a separate metric rather than mixed in with the rest.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'qcls.multiclass.py-f1',
      prompt: l(
        'Реализуй подсчёт macro и micro F1 для многоклассовой задачи с одной меткой. На вход два списка одинаковой длины: истинные метки и предсказанные. Верни кортеж (macro_f1, micro_f1). Macro: посчитай precision, recall и F1 для каждого класса, встречающегося в истинных метках или в предсказаниях, и усредни F1 по всем таким классам. Micro: сложи TP, FP и FN по всем классам и посчитай F1 по суммам. Если precision и recall равны нулю, F1 класса равен 0.0. Пустой вход даёт (0.0, 0.0). Внешние библиотеки запрещены.',
        'Implement macro and micro F1 for a single-label multiclass problem. The input is two equal-length lists: true labels and predicted ones. Return a tuple (macro_f1, micro_f1). Macro: compute precision, recall and F1 for each class appearing in the true labels or the predictions, and average the F1 over all such classes. Micro: sum TP, FP and FN across classes and compute F1 from the totals. If precision and recall are both zero, the class F1 is 0.0. Empty input gives (0.0, 0.0). No external libraries.',
      ),
      signature: 'def macro_micro_f1(y_true: list[str], y_pred: list[str]) -> tuple[float, float]:',
      starter: `def macro_micro_f1(y_true, y_pred):
    """Macro and micro averaged F1 for single-label multiclass."""
    # TODO
    return (0.0, 0.0)
`,
      reference: `def macro_micro_f1(y_true, y_pred):
    """Macro and micro averaged F1 for single-label multiclass."""
    if not y_true:
        return (0.0, 0.0)
    labels = set(y_true) | set(y_pred)
    total_tp = total_fp = total_fn = 0
    f1s = []
    for label in labels:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == label and p == label)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != label and p == label)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == label and p != label)
        total_tp += tp
        total_fp += fp
        total_fn += fn
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        f1s.append(f1)
    macro = sum(f1s) / len(f1s) if f1s else 0.0
    micro_p = total_tp / (total_tp + total_fp) if total_tp + total_fp else 0.0
    micro_r = total_tp / (total_tp + total_fn) if total_tp + total_fn else 0.0
    micro = 2 * micro_p * micro_r / (micro_p + micro_r) if micro_p + micro_r else 0.0
    return (macro, micro)
`,
      sampleTests: `macro, micro = macro_micro_f1(['a', 'a', 'b'], ['a', 'a', 'b'])
assert abs(macro - 1.0) < 1e-12 and abs(micro - 1.0) < 1e-12

macro, micro = macro_micro_f1(['a', 'a', 'b', 'b'], ['a', 'a', 'a', 'a'])
assert abs(micro - 0.5) < 1e-12          # two of four correct
assert macro < micro                      # class b is never predicted

assert macro_micro_f1([], []) == (0.0, 0.0)
`,
      tests: `# 1. A perfect prediction scores one on both.
macro, micro = macro_micro_f1(['a', 'b', 'c'], ['a', 'b', 'c'])
assert abs(macro - 1.0) < 1e-12 and abs(micro - 1.0) < 1e-12

# 2. In single-label multiclass, micro F1 equals accuracy.
y_true = ['a', 'a', 'b', 'c', 'c', 'c', 'b', 'a']
y_pred = ['a', 'b', 'b', 'c', 'a', 'c', 'b', 'a']
accuracy = sum(1 for t, p in zip(y_true, y_pred) if t == p) / len(y_true)
_, micro = macro_micro_f1(y_true, y_pred)
assert abs(micro - accuracy) < 1e-12, (micro, accuracy)

# 3. A failed rare class drags macro down but barely touches micro.
big_true = ['a'] * 990 + ['rare'] * 10
big_pred = ['a'] * 1000
macro, micro = macro_micro_f1(big_true, big_pred)
assert micro > 0.98, micro
assert macro < 0.55, macro

# 4. Classes that appear only in the predictions are counted too.
macro, micro = macro_micro_f1(['a', 'a'], ['a', 'ghost'])
assert micro < 1.0
# three classes considered: a, ghost -> macro averages over both
assert macro < micro

# 5. Both values always sit in [0, 1].
import random
rnd = random.Random(4)
labels = ['x', 'y', 'z', 'w']
for _ in range(300):
    n = rnd.randint(1, 50)
    t = [rnd.choice(labels) for _ in range(n)]
    p = [rnd.choice(labels) for _ in range(n)]
    ma, mi = macro_micro_f1(t, p)
    assert 0.0 <= ma <= 1.0 + 1e-12 and 0.0 <= mi <= 1.0 + 1e-12

# 6. A hand-computed case.
#    true: a a b, pred: a b b
#    a: tp=1 fp=0 fn=1 -> p=1, r=0.5, f1=2/3
#    b: tp=1 fp=1 fn=0 -> p=0.5, r=1, f1=2/3
macro, micro = macro_micro_f1(['a', 'a', 'b'], ['a', 'b', 'b'])
assert abs(macro - 2 / 3) < 1e-12, macro
assert abs(micro - 2 / 3) < 1e-12, micro

# 7. Label order and naming do not matter.
m1 = macro_micro_f1(['cat', 'dog'], ['cat', 'cat'])
m2 = macro_micro_f1(['1', '2'], ['1', '1'])
assert abs(m1[0] - m2[0]) < 1e-12 and abs(m1[1] - m2[1]) < 1e-12

# 8. Completely wrong predictions score zero.
macro, micro = macro_micro_f1(['a', 'a'], ['b', 'b'])
assert abs(macro) < 1e-12 and abs(micro) < 1e-12

# 9. Degenerate inputs.
assert macro_micro_f1([], []) == (0.0, 0.0)
assert macro_micro_f1(['a'], ['a']) == (1.0, 1.0)
`,
      writeup: l(
        'Второй тест — главный вывод узла: в однометочной многоклассовой задаче micro F1 тождественно равен accuracy. Проверить это легко на формулах: каждый объект даёт ровно одно предсказание, поэтому сумма FP по всем классам равна сумме FN — каждая ошибка одновременно и ложноположительная для предсказанного класса, и ложноотрицательная для истинного. Тогда micro precision равен micro recall, а F1 от двух равных чисел равен им самим. Отсюда практическое следствие: отчитываться micro F1 в такой задаче — значит называть accuracy сложным словом. Третий тест показывает, зачем тогда macro: падение на классе из десяти примеров роняет macro почти вдвое, а micro остаётся выше 0.98. Четвёртый тест фиксирует деталь, которую часто теряют: класс, который модель предсказывает, но которого нет в истинных метках, обязан попасть в усреднение — иначе модель, выдумывающая несуществующие категории, не будет за это наказана.',
        'The second test is the node\'s main takeaway: in a single-label multiclass problem micro F1 is identically accuracy. It is easy to verify on the formulas: each object yields exactly one prediction, so the total FP across classes equals the total FN — every error is simultaneously a false positive for the predicted class and a false negative for the true one. Then micro precision equals micro recall, and the F1 of two equal numbers is that number. The practical consequence: reporting micro F1 in such a task means calling accuracy by a longer name. The third test shows what macro is for: a failure on a ten-example class nearly halves macro while micro stays above 0.98. The fourth pins down a detail that is often lost: a class the model predicts but which never appears in the true labels must enter the average — otherwise a model inventing non-existent categories goes unpunished.',
      ),
    },
    {
      kind: 'quiz',
      id: 'qcls.multiclass.q-choose',
      mode: 'single',
      prompt: l(
        'У классификатора 300 категорий, 10 из них дают 80% трафика. Команда отчитывается accuracy 0.91 и хочет добавить вторую метрику. Какую?',
        'A classifier has 300 categories, 10 of which carry 80% of the traffic. The team reports accuracy 0.91 and wants a second metric. Which one?',
      ),
      choices: [
        { id: 'a', text: l('micro F1: он дополнит accuracy', 'micro F1: it complements accuracy') },
        {
          id: 'b',
          text: l(
            'macro F1 по категориям с достаточным числом примеров: он покажет, что происходит на хвосте',
            'macro F1 over categories with enough examples: it shows what happens in the tail',
          ),
        },
        { id: 'c', text: l('ROC AUC', 'ROC AUC') },
        { id: 'd', text: l('Вторая метрика не нужна', 'A second metric is unnecessary') },
      ],
      correct: ['b'],
      explanation: l(
        'micro F1 здесь буквально равен accuracy, то есть второй метрикой быть не может — это та же цифра под другим именем. ROC AUC для многоклассовой задачи определён только через усреднение один-против-всех и к тому же не отвечает на вопрос о качестве конкретных категорий. Нужен именно macro, причём с оговоркой про минимальный размер категории: иначе категории с тремя примерами внесут в среднее чистый шум. Хорошая практика — показывать три числа: accuracy, macro F1 по категориям от некоторого размера и отдельно долю трафика, приходящуюся на категории, которые модель вообще не умеет.',
        'micro F1 here is literally equal to accuracy, so it cannot be the second metric — it is the same number under a different name. ROC AUC in a multiclass setting is only defined through one-vs-rest averaging and does not answer the question about specific categories anyway. Macro is what is needed, with the caveat about a minimum category size: otherwise categories with three examples contribute pure noise to the average. A good practice is to report three numbers: accuracy, macro F1 over categories above a size threshold, and separately the share of traffic belonging to categories the model cannot handle at all.',
      ),
    },
  ],

  sources: [
    {
      title: 'scikit-learn: model evaluation',
      url: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
      note: l('Раздел про усреднение в многоклассовых метриках.', 'The section on averaging in multiclass metrics.'),
    },
    {
      title: 'Wikipedia: F-score',
      url: 'https://en.wikipedia.org/wiki/F-score',
    },
  ],
};
