import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const boostingRanking: SkillNode = {
  id: 'boosting.ranking',
  branch: 'boosting',
  act: 4,
  tier: 3,
  title: l('Ранжирующие функции потерь', 'Ranking losses'),
  blurb: l(
    'PairLogit, YetiRank и почему регрессия на метки — не ранжирование.',
    'PairLogit, YetiRank, and why regression on labels is not ranking.',
  ),
  requires: ['boosting.catboost'],
  theory: [
    {
      type: 'p',
      text: l(
        'Ранжирование отличается от регрессии одним свойством: пользователю всё равно, какие абсолютные числа выдала модель, важен только порядок. Поточечная функция потерь этого не знает и честно штрафует модель за то, что она предсказала 2.7 вместо 3, даже когда порядок идеальный. Ёмкость модели тратится на подгонку чисел, которых никто не увидит.',
        'Ranking differs from regression in one property: the user does not care what absolute numbers the model produced, only the order matters. A pointwise loss does not know this and dutifully punishes the model for predicting 2.7 instead of 3, even when the order is perfect. Model capacity goes on fitting numbers nobody will see.',
      ),
    },
    {
      type: 'sim',
      sim: 'ranking-losses',
      title: l('Что видит каждая функция потерь', 'What each loss sees'),
      caption: l(
        'Один запрос, шесть документов, порядок почти правильный — три пары из тринадцати перепутаны. Подвигай сдвиг: nDCG, число неправильных пар и попарный логлосс не меняются вообще, а поточечный MSE гуляет, потому что ему важно попасть в абсолютное значение метки. Теперь подвигай масштаб: порядок снова тот же, nDCG на месте, но попарный логлосс падает — растянутые скоры дают большие зазоры. Отсюда полезный вывод: попарный логлосс не метрика качества, его можно улучшить, не улучшив ранжирования.',
        'One query, six documents, an almost correct order — three pairs out of thirteen are swapped. Move the shift: nDCG, the count of mis-ordered pairs and the pairwise log loss do not change at all, while pointwise MSE wanders, because it cares about hitting the absolute label value. Now move the scale: the order is the same again and nDCG holds, but the pairwise log loss falls — stretched scores give wider margins. Hence a useful conclusion: the pairwise log loss is not a quality metric, it can be improved without improving the ranking.',
      ),
    },
    {
      type: 'h',
      text: l('Три семейства', 'Three families'),
    },
    {
      type: 'table',
      head: [
        l('Семейство', 'Family'),
        l('Что оптимизирует', 'What it optimises'),
        l('Когда брать', 'When to use it'),
      ],
      rows: [
        [
          l('Поточечные (RMSE, Logloss)', 'Pointwise (RMSE, Logloss)'),
          l(
            'Абсолютное значение метки для каждого документа отдельно.',
            'The absolute label value for each document separately.',
          ),
          l(
            'Когда само значение нужно: pCTR для аукциона, оценка вероятности покупки.',
            'When the value itself is needed: pCTR for an auction, a purchase probability.',
          ),
        ],
        [
          l('Попарные (PairLogit)', 'Pairwise (PairLogit)'),
          l(
            'Вероятность, что более релевантный документ получит больший скор.',
            'The probability that the more relevant document gets the higher score.',
          ),
          l(
            'Когда есть надёжные сравнения внутри запроса; дешевле списочных.',
            'When reliable comparisons inside a query exist; cheaper than listwise.',
          ),
        ],
        [
          l('Списочные (YetiRank, LambdaMART)', 'Listwise (YetiRank, LambdaMART)'),
          l(
            'Метрику всего списка: веса пар зависят от позиций, на которые они влияют.',
            'The whole list\'s metric: pair weights depend on the positions they affect.',
          ),
          l(
            'Когда решает топ выдачи и метрика — nDCG; обычно лучший выбор для поиска.',
            'When the top of the page decides and the metric is nDCG; usually the best choice for search.',
          ),
        ],
      ],
    },
    {
      type: 'p',
      text: l(
        'Разница между попарным и списочным подходом тоньше, чем кажется. PairLogit считает все пары равноценными: перепутать первое место со вторым и девяностое с девяносто первым — одинаковая ошибка. Но nDCG устроен иначе, у него логарифмический дисконт, и ошибка наверху стоит в разы дороже. Списочные функции потерь — это, по сути, тот же попарный штраф, но с весами: каждая пара входит с коэффициентом, равным тому, насколько изменится метрика, если эти два документа поменять местами. YetiRank поверх этого ещё и учитывает, что метки получены из шумного источника, и взвешивает пары с учётом неопределённости.',
        'The difference between the pairwise and the listwise approach is subtler than it looks. PairLogit treats all pairs as equal: confusing first place with second and ninetieth with ninety-first is the same error. But nDCG works differently, with a logarithmic discount, and an error at the top costs several times more. Listwise losses are essentially the same pairwise penalty with weights: each pair enters with a coefficient equal to how much the metric would change if those two documents swapped. YetiRank adds to this an account of the labels coming from a noisy source, weighting pairs by that uncertainty.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Группы обязаны быть заданы правильно. Ранжирующие функции потерь сравнивают документы внутри одного запроса, и если идентификатор группы потерялся или данные перемешаны без сортировки по группе, модель начнёт сравнивать документы из разных запросов. Обучение не упадёт, метрика просто будет хуже без объяснений — это одна из самых частых и самых незаметных ошибок в ранжировании.',
        'Groups must be set correctly. Ranking losses compare documents inside one query, and if the group id is lost or the data is shuffled without sorting by group, the model starts comparing documents from different queries. Training will not fail, the metric will simply be worse with no explanation — one of the most common and least visible mistakes in ranking.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'boosting.ranking.py-pairlogit',
      prompt: l(
        'Посчитай PairLogit. На вход скоры, метки релевантности и идентификаторы групп (запросов) — три списка одинаковой длины. Для каждой упорядоченной пары документов одной группы, где метка первого строго больше метки второго, берётся log(1 + exp(-(score_i - score_j))). Верни среднее по всем таким парам; если подходящих пар нет, верни 0.0. Пары из разных групп не считаются.',
        'Compute PairLogit. The input is scores, relevance labels and group (query) ids — three lists of the same length. For every ordered pair of documents in one group where the first label is strictly greater than the second, take log(1 + exp(-(score_i - score_j))). Return the mean over all such pairs; if there are none, return 0.0. Pairs from different groups do not count.',
      ),
      signature:
        'def pairlogit(scores: list[float], labels: list[float], groups: list) -> float:',
      starter: `def pairlogit(scores, labels, groups):
    # TODO
    return 0.0
`,
      reference: `import math


def pairlogit(scores, labels, groups):
    total = 0.0
    pairs = 0
    for i in range(len(scores)):
        for j in range(len(scores)):
            if groups[i] != groups[j]:
                continue
            if labels[i] <= labels[j]:
                continue
            diff = scores[i] - scores[j]
            # log(1 + exp(-diff)), written so a large negative diff does not overflow.
            total += math.log1p(math.exp(-abs(diff))) + max(0.0, -diff)
            pairs += 1
    return total / pairs if pairs else 0.0
`,
      sampleTests: `import math

# One pair, equal scores: log(2).
value = pairlogit([0.0, 0.0], [1, 0], ['q', 'q'])
assert abs(value - math.log(2)) < 1e-12, value
`,
      tests: `import math

# Equal scores on one pair give log 2 exactly.
assert abs(pairlogit([0.0, 0.0], [1, 0], ['q', 'q']) - math.log(2)) < 1e-12

# A correct order costs less than a wrong one.
right = pairlogit([2.0, 0.0], [1, 0], ['q', 'q'])
wrong = pairlogit([0.0, 2.0], [1, 0], ['q', 'q'])
assert right < math.log(2) < wrong

# Shift invariance: adding a constant to every score changes nothing,
# which is the whole point of a pairwise loss.
scores = [0.9, 0.7, 0.8, 0.1]
labels = [3, 2, 3, 0]
groups = ['q', 'q', 'q', 'q']
base = pairlogit(scores, labels, groups)
shifted = pairlogit([s + 17.0 for s in scores], labels, groups)
assert abs(base - shifted) < 1e-12, (base, shifted)

# Documents from different queries are never compared: splitting the same
# documents into two groups removes the cross pairs and changes the answer.
split = pairlogit(scores, labels, ['q1', 'q1', 'q2', 'q2'])
assert abs(split - base) > 1e-6

# Equal labels produce no pair at all.
assert pairlogit([1.0, 5.0], [2, 2], ['q', 'q']) == 0.0
assert pairlogit([1.0, 5.0], [2, 2], ['q1', 'q2']) == 0.0

# One document, or none, is not an error.
assert pairlogit([1.0], [3], ['q']) == 0.0
assert pairlogit([], [], []) == 0.0

# Large margins do not overflow: the answer stays finite and tiny.
huge = pairlogit([800.0, -800.0], [1, 0], ['q', 'q'])
assert math.isfinite(huge) and huge >= 0.0 and huge < 1e-9

# And a large margin the wrong way round grows linearly rather than exploding.
bad = pairlogit([-800.0, 800.0], [1, 0], ['q', 'q'])
assert math.isfinite(bad) and abs(bad - 1600.0) < 1e-6
`,
      writeup: l(
        'Два теста здесь про математику, а не про ранжирование, и оба проверяют одно и то же место. Прямая запись log(1 + exp(-diff)) взрывается при diff = -800: exp(800) — это переполнение, и в Python получится OverflowError, а в numpy — inf. Устойчивая форма log1p(exp(-|diff|)) + max(0, -diff) даёт то же самое число и никогда не переполняется: при большом отрицательном diff экспонента берётся от маленького аргумента, а линейная часть выносится отдельно. Это стандартный приём для софтплюса, и его стоит узнавать в коде, потому что ровно он лежит внутри всех реализаций логистических потерь.\n\nТест на сдвиг — главный содержательный: прибавь ко всем скорам 17, и ничего не изменится. Поточечный MSE на тех же данных изменился бы катастрофически. Отсюда прямое следствие для практики: модель, обученная на PairLogit, выдаёт скоры, у которых нет абсолютного смысла, и использовать их как вероятности нельзя — ни в аукционе, ни в пороге отсечения. Если нужны и порядок, и калиброванная вероятность, это две модели или дополнительная калибровка сверху.\n\nИ тест про группы: та самая ошибка из предупреждения выше. Если идентификаторы групп потерять, функция честно посчитает пары между документами разных запросов, ничего не упадёт, а модель будет учиться сравнивать несравнимое.',
        'Two of these tests are about mathematics rather than ranking, and both probe the same spot. Writing log(1 + exp(-diff)) directly explodes at diff = -800: exp(800) overflows, giving an OverflowError in Python and inf in numpy. The stable form log1p(exp(-|diff|)) + max(0, -diff) produces the same number and never overflows: for a large negative diff the exponential takes a small argument and the linear part is factored out. This is the standard softplus trick and worth recognising in code, because it sits inside every implementation of a logistic loss.\n\nThe shift test is the substantive one: add 17 to every score and nothing changes. Pointwise MSE on the same data would change catastrophically. A direct practical consequence follows: a model trained on PairLogit produces scores with no absolute meaning, and they cannot be used as probabilities — not in an auction, not as a cut-off threshold. If both the order and a calibrated probability are needed, that is two models, or calibration on top.\n\nAnd the group test is the mistake from the warning above. Lose the group ids and the function dutifully counts pairs between documents of different queries, nothing crashes, and the model learns to compare the incomparable.',
      ),
    },
    {
      kind: 'quiz',
      id: 'boosting.ranking.q-family',
      mode: 'single',
      prompt: l(
        'Задача: переранжирование топ-100 кандидатов в поиске. Метрика качества — nDCG@10, метки асессорские, пятибалльные. Какое семейство функций потерь выбрать и почему?',
        'Task: re-ranking the top 100 candidates in search. The quality metric is nDCG@10, with five-grade rater labels. Which family of losses to choose, and why?',
      ),
      choices: [
        {
          id: 'pointwise',
          text: l(
            'Поточечное: метки числовые, значит это регрессия',
            'Pointwise: the labels are numeric, so it is a regression',
          ),
        },
        {
          id: 'pairwise',
          text: l(
            'Попарное: оно оптимизирует порядок, а именно порядок и важен',
            'Pairwise: it optimises order, and order is what matters',
          ),
        },
        {
          id: 'listwise',
          text: l(
            'Списочное: оно взвешивает пары по их вкладу в метрику, а в nDCG@10 вклад зависит от позиции',
            'Listwise: it weights pairs by their contribution to the metric, and in nDCG@10 that depends on position',
          ),
        },
        {
          id: 'any',
          text: l(
            'Любое: на практике разница в пределах шума',
            'Any of them: in practice the difference is within the noise',
          ),
        },
      ],
      correct: ['listwise'],
      explanation: l(
        'Решает не то, что метки числовые, а то, какая метрика считается в конце. nDCG@10 дисконтирует позиции логарифмически и вовсе не смотрит дальше десятой, поэтому перестановка первого и второго документа стоит в разы дороже перестановки сороковых — а для PairLogit это одинаковые пары. Списочные функции потерь взвешивают пары ровно на то, насколько изменится метрика от их перестановки, и на задаче переранжирования топа это даёт заметный выигрыш именно там, где он считается.\n\nПоточечный вариант не абсурден и иногда используется как бейзлайн, но тратит ёмкость на попадание в абсолютные значения меток. Вариант «разница в пределах шума» неверен для переранжирования топа, хотя на задачах, где метрика смотрит на весь список целиком и без дисконта, разрыв между попарным и списочным действительно невелик.',
        'What decides is not the labels being numeric but which metric is computed at the end. nDCG@10 discounts positions logarithmically and does not look past the tenth at all, so swapping the first and second documents costs several times more than swapping the fortieth and forty-first — while for PairLogit those are identical pairs. Listwise losses weight each pair by exactly how much the metric would change if they swapped, and on a top re-ranking task that pays off precisely where the score is counted.\n\nThe pointwise option is not absurd and is sometimes used as a baseline, but it spends capacity on hitting absolute label values. "Within the noise" is wrong for top re-ranking, although on tasks where the metric looks at the whole list without a discount the gap between pairwise and listwise really is small.',
      ),
    },
    {
      kind: 'case',
      id: 'boosting.ranking.case-choose',
      prompt: l(
        'Тебе нужно обучить модель для двух задач сразу, и выбрать функцию потерь для каждой. Первая: ранжирование органической выдачи, метрика nDCG@10 по асессорам. Вторая: предсказание pCTR для рекламного аукциона, где скор умножается на ставку. Напиши, что берёшь в каждом случае, почему нельзя взять одну модель на обе задачи, и какую проверку добавишь в пайплайн, чтобы поймать перепутанные группы.',
        'You have to train a model for two tasks at once and choose a loss for each. First: ranking organic results, with nDCG@10 on rater labels as the metric. Second: predicting pCTR for an ad auction, where the score is multiplied by a bid. Write what you take in each case, why one model cannot serve both, and what check you would add to the pipeline to catch mixed-up groups.',
      ),
      reference: l(
        'Для органики беру списочную функцию потерь — YetiRank или LambdaMART. Причина не в том, что она «лучше», а в том, что метрика дисконтирует позиции: ошибка на первой паре стоит в разы дороже, чем на сороковой, и взвешивание пар по вкладу в метрику ровно это и учитывает. Группа — запрос, сортировка по группе обязательна.\n\nДля pCTR беру поточечный логлосс. Здесь важно не упорядочить объявления, а получить калиброванную вероятность: скор умножается на ставку, и если вероятности завышены вдвое, аукцион систематически выберет не то объявление и сломается биллинг по второй цене. Ранжирующий лосс на этой задаче непригоден в принципе: он инвариантен к сдвигу и масштабу скоров, то есть не определяет абсолютный уровень вообще.\n\nОдна модель на обе задачи не годится именно поэтому: ранжирующая функция потерь намеренно не фиксирует абсолютные значения, а в аукционе нужны именно они. Обратный вариант — поточечная модель для органики — технически работает, но тратит ёмкость на подгонку значений меток и хуже расставляет верх выдачи. Если очень хочется одну модель, то честный путь — обучать ранжирующую и добавлять сверху калибровку (изотоническую или Платта) на отложенной выборке, но тогда калибровку надо мониторить отдельно, и получается всё равно две сущности.\n\nПроверка на группы в пайплайне: во-первых, тест на том, что данные отсортированы по идентификатору группы и каждая группа идёт одним непрерывным блоком — именно это требуют реализации. Во-вторых, проверка, что в каждой группе есть хотя бы две разные метки: группы с одинаковыми метками не дают ни одной пары и просто занимают память, а если таких групп большинство, значит разметка или сборка данных сломаны. В-третьих, сравнение числа пар до и после сборки датасета с ожидаемым: резкое расхождение означает, что группы склеились или рассыпались.',
        'For organic results I take a listwise loss — YetiRank or LambdaMART. The reason is not that it is "better" but that the metric discounts positions: an error on the first pair costs several times more than on the fortieth, and weighting pairs by their contribution to the metric accounts for exactly that. The group is a query, and sorting by group is mandatory.\n\nFor pCTR I take a pointwise log loss. Here the point is not to order the ads but to get a calibrated probability: the score is multiplied by a bid, and if probabilities are twice too high the auction systematically picks the wrong ad and second-price billing breaks. A ranking loss is unusable here in principle: it is invariant to shifting and scaling the scores, so it does not determine the absolute level at all.\n\nOne model cannot serve both for exactly that reason: a ranking loss deliberately leaves absolute values unfixed, and an auction needs precisely those. The reverse — a pointwise model for organic — technically works but spends capacity fitting label values and arranges the top of the page worse. If one model is really wanted, the honest route is training the ranking one and adding calibration (isotonic or Platt) on a held-out set, but then the calibration needs its own monitoring, so it is two entities anyway.\n\nGroup checks in the pipeline: first, a test that the data is sorted by group id and each group forms one contiguous block — that is what the implementations require. Second, a check that every group has at least two distinct labels: groups with identical labels produce no pairs and merely take up memory, and if most groups are like that the labelling or the data assembly is broken. Third, comparing the number of pairs before and after building the dataset against the expected count: a sharp discrepancy means groups were glued together or fell apart.',
      ),
      checklist: [
        l('Для органики выбран списочный лосс с объяснением через дисконт позиций.', 'A listwise loss for organic, justified through the position discount.'),
        l('Для pCTR выбран поточечный лосс с объяснением через калибровку.', 'A pointwise loss for pCTR, justified through calibration.'),
        l(
          'Названа инвариантность ранжирующего лосса к сдвигу и масштабу как причина, почему он не годится для аукциона.',
          'The ranking loss\'s invariance to shift and scale is named as why it is unfit for the auction.',
        ),
        l(
          'Упомянут вариант с калибровкой поверх ранжирующей модели и его цена.',
          'The option of calibrating on top of the ranking model is mentioned, with its cost.',
        ),
        l(
          'Проверка на непрерывность групп в данных.',
          'A check that groups are contiguous in the data.',
        ),
        l(
          'Проверка, что в группе есть разные метки, иначе пар нет.',
          'A check that a group has distinct labels, or there are no pairs.',
        ),
      ],
      writeup: l(
        'Разделение «порядок против абсолютного значения» — главный вывод всей ветки, и он переживает смену библиотек и мод. Любой ранжирующий лосс намеренно не определяет уровень скоров; любое применение, где скор умножают, сравнивают с порогом или трактуют как вероятность, требует калибровки. Половина споров про «какой лосс лучше» на самом деле про то, что эти два требования пытаются удовлетворить одной моделью.',
        'The split between order and absolute value is the main conclusion of the whole branch, and it outlives changes of library and fashion. Any ranking loss deliberately leaves the level of the scores undetermined; any use where the score is multiplied, compared with a threshold or read as a probability needs calibration. Half the arguments about "which loss is better" are really about trying to satisfy those two requirements with one model.',
      ),
    },
  ],

  sources: [
    {
      title: 'CatBoost documentation: objectives and metrics',
      url: 'https://catboost.ai/docs/',
      note: l(
        'Список ранжирующих функций потерь с формулами, включая PairLogit и YetiRank.',
        'The list of ranking losses with formulas, including PairLogit and YetiRank.',
      ),
    },
  ],
};
