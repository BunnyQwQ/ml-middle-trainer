import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchPrecisionRecall: SkillNode = {
  id: 'search.precision-recall',
  branch: 'search-metrics',
  act: 3,
  tier: 2,
  title: l('precision@k и recall@k', 'precision@k and recall@k'),
  blurb: l(
    'Самые простые метрики ранжирования и ровно то, чего они не видят.',
    'The simplest ranking metrics and exactly what they fail to see.',
  ),
  requires: ['search.relevance'],
  theory: [
    {
      type: 'p',
      text: l(
        'precision@k — доля релевантных среди первых k документов. recall@k — доля найденных релевантных от всех релевантных, которые вообще существуют. Обе метрики считаются по бинарной разметке и обе игнорируют порядок внутри топ-k: выдача с идеальным документом на первом месте и та же выдача с ним на k-м дают одинаковые числа.',
        'precision@k is the share of relevant documents among the first k. recall@k is the share of relevant documents found out of all that exist. Both are computed on binary labels and both ignore the order inside the top k: a page with the perfect document first and the same page with it at position k give identical numbers.',
      ),
    },
    { type: 'formula', tex: 'P@k = \\frac{|\\text{релевантные в топ-}k|}{k}, \\qquad R@k = \\frac{|\\text{релевантные в топ-}k|}{|\\text{все релевантные}|}' },
    {
      type: 'sim',
      sim: 'precision-recall-k',
      title: l('Пощупать обе метрики', 'Get a feel for both metrics'),
      caption: l(
        'Кликай по документам, отмечая их релевантными. Сделай релевантными документы 1 и 2, запомни числа, потом перенеси релевантность на 9 и 10 — precision@10 и recall@10 не изменятся совсем. Именно поэтому для оценки ранжирования этих метрик мало: они отвечают на вопрос «что попало в топ», а не «в каком порядке».',
        'Click documents to mark them relevant. Make documents 1 and 2 relevant, remember the numbers, then move the relevance to 9 and 10 — precision@10 and recall@10 do not move at all. This is why these metrics are not enough to evaluate ranking: they answer "what got into the top", not "in what order".',
      ),
    },
    { type: 'h', text: l('Почему recall в поиске почти неизмерим', 'Why recall is nearly unmeasurable in search') },
    {
      type: 'p',
      text: l(
        'Знаменатель recall требует знать все релевантные документы в коллекции. В веб-поиске это миллиарды документов, разметить их нельзя. Выход — pooling: берут топ-k нескольких разных систем, объединяют, размечают только этот пул и считают его приближением множества релевантных. Оговорка существенная: документ, который не нашла ни одна из систем, в пул не попадёт и будет считаться нерелевантным.',
        'The denominator of recall requires knowing every relevant document in the collection. In web search that is billions of documents and labelling them is impossible. The way out is pooling: take the top k of several different systems, merge them, label only that pool and treat it as an approximation of the relevant set. The caveat is substantial: a document no system retrieved never enters the pool and counts as irrelevant.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Практическое следствие: recall осмысленно считать на стадии отбора кандидатов, где знаменатель задан явно — например, «сколько из купленных товаров вообще попало в кандидаты». На стадии ранжирования работает precision и метрики с учётом порядка.',
        'The practical consequence: recall makes sense at the candidate retrieval stage, where the denominator is explicit — for instance "how many of the purchased items made it into the candidate set at all". At the ranking stage, precision and order-aware metrics are what work.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Для двухстадийной схемы это разделение труда формулируется так: первая стадия отвечает за recall при ограниченном бюджете кандидатов, вторая — за precision и порядок внутри них. Если нужный документ не попал в кандидаты, никакое ранжирование его не вернёт, поэтому recall@1000 кандидатов — ключевая метрика ретривала, а nDCG@10 — метрика ранжирования.',
        'For a two-stage system the division of labour reads like this: the first stage is responsible for recall within a limited candidate budget, the second for precision and the order inside it. If the needed document never made it into the candidates, no ranker can bring it back, which is why recall@1000 candidates is the key retrieval metric while nDCG@10 is the ranking one.',
      ),
    },
    {
      type: 'table',
      head: [l('Метрика', 'Metric'), l('Видит порядок', 'Sees order'), l('Нужен полный список релевантных', 'Needs the full relevant set')],
      rows: [
        [l('precision@k', 'precision@k'), l('нет', 'no'), l('нет', 'no')],
        [l('recall@k', 'recall@k'), l('нет', 'no'), l('да', 'yes')],
        [l('MRR', 'MRR'), l('да, только до первого релевантного', 'yes, only up to the first relevant'), l('нет', 'no')],
        [l('MAP', 'MAP'), l('да', 'yes'), l('да', 'yes')],
        [l('nDCG@k', 'nDCG@k'), l('да, с градациями', 'yes, with grades'), l('нет, достаточно размеченного топа', 'no, a labelled top is enough')],
      ],
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'search.precision-recall.py-pr',
      prompt: l(
        'Реализуй precision@k и recall@k. На вход список бинарных меток релевантности в порядке выдачи и число k. Второй аргумент total_relevant — сколько релевантных документов существует всего; если он равен None, бери число релевантных в самом списке. Верни кортеж (precision, recall). Если k больше длины списка, считай по всему списку. При k <= 0 верни (0.0, 0.0). Если релевантных нет вовсе, recall считай равным 0.0.',
        'Implement precision@k and recall@k. The input is a list of binary relevance labels in result order and a number k. The second argument total_relevant says how many relevant documents exist overall; when it is None, use the number of relevant items in the list itself. Return a tuple (precision, recall). If k exceeds the list length, use the whole list. For k <= 0 return (0.0, 0.0). If there are no relevant documents at all, recall is 0.0.',
      ),
      signature:
        'def precision_recall_at_k(relevance: list[int], k: int, total_relevant: int | None = None) -> tuple[float, float]:',
      starter: `def precision_recall_at_k(relevance, k, total_relevant=None):
    """precision@k and recall@k for a ranked list of binary labels."""
    # TODO
    return (0.0, 0.0)
`,
      reference: `def precision_recall_at_k(relevance, k, total_relevant=None):
    """precision@k and recall@k for a ranked list of binary labels."""
    if k <= 0:
        return (0.0, 0.0)
    cut = relevance[:k]
    hits = sum(1 for r in cut if r)
    precision = hits / min(k, len(relevance)) if relevance else 0.0
    denom = total_relevant if total_relevant is not None else sum(1 for r in relevance if r)
    recall = hits / denom if denom else 0.0
    return (precision, recall)
`,
      sampleTests: `p, r = precision_recall_at_k([1, 0, 1, 0, 0], 2)
assert abs(p - 0.5) < 1e-12
assert abs(r - 0.5) < 1e-12

# k beyond the list length uses the whole list
p, r = precision_recall_at_k([1, 0, 1], 10)
assert abs(p - 2 / 3) < 1e-12 and abs(r - 1.0) < 1e-12

assert precision_recall_at_k([1, 1], 0) == (0.0, 0.0)
`,
      tests: `# 1. Textbook values.
p, r = precision_recall_at_k([1, 1, 0, 0, 1], 3)
assert abs(p - 2 / 3) < 1e-12, p
assert abs(r - 2 / 3) < 1e-12, r

# 2. An explicit total_relevant changes recall but not precision.
p1, r1 = precision_recall_at_k([1, 0, 1], 3)
p2, r2 = precision_recall_at_k([1, 0, 1], 3, total_relevant=10)
assert abs(p1 - p2) < 1e-12
assert abs(r2 - 0.2) < 1e-12, r2

# 3. Order inside the cut does not matter; crossing the cut does.
a, _ = precision_recall_at_k([1, 0, 0, 1], 2)
b, _ = precision_recall_at_k([0, 1, 0, 1], 2)
assert abs(a - b) < 1e-12
c, _ = precision_recall_at_k([0, 0, 1, 1], 2)
assert c < a

# 4. recall@k never decreases as k grows; precision may go either way.
rel = [1, 0, 0, 1, 0, 1, 0, 0, 0, 0]
recalls = [precision_recall_at_k(rel, k)[1] for k in range(1, 11)]
assert all(recalls[i] <= recalls[i + 1] + 1e-12 for i in range(len(recalls) - 1))
assert abs(recalls[-1] - 1.0) < 1e-12

# 5. Degenerate inputs.
assert precision_recall_at_k([], 5) == (0.0, 0.0)
assert precision_recall_at_k([0, 0, 0], 3) == (0.0, 0.0)
assert precision_recall_at_k([1, 1, 1], -1) == (0.0, 0.0)

# 6. A perfect ranking of all relevant documents.
p, r = precision_recall_at_k([1] * 5 + [0] * 5, 5)
assert abs(p - 1.0) < 1e-12 and abs(r - 1.0) < 1e-12

# 7. Works on a long list without blowing up.
long_rel = [1 if i % 7 == 0 else 0 for i in range(10000)]
p, r = precision_recall_at_k(long_rel, 700)
assert abs(p - 100 / 700) < 1e-9, p
assert 0.0 < r < 1.0
`,
      writeup: l(
        'Ловушка в знаменателе precision: при k больше длины списка делить надо на реальную длину, иначе метрика штрафует систему за то, что документов в коллекции просто меньше k. Второй параметр total_relevant существует ровно потому, что в поиске полный список релевантных обычно неизвестен и приходит извне — из пула разметки или из логов покупок. Обрати внимание на четвёртый тест: recall@k монотонно не убывает, а precision@k может как расти, так и падать. Из этого следует практическая вещь: по precision@k нельзя сравнивать выдачи разной длины, и если одна система возвращает 5 документов, а другая 20, сравнивать их надо на одном k.',
        'The trap is the denominator of precision: when k exceeds the list length you must divide by the real length, otherwise the metric punishes a system for the collection simply holding fewer than k documents. The total_relevant parameter exists precisely because in search the full relevant set is usually unknown and arrives from outside — from a labelling pool or from purchase logs. Note the fourth test: recall@k is non-decreasing while precision@k can move either way. A practical consequence follows: precision@k cannot compare result pages of different lengths, and if one system returns 5 documents and another 20, they must be compared at the same k.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.precision-recall.q-order',
      mode: 'single',
      prompt: l(
        'Две выдачи по десять документов. В первой релевантные стоят на местах 1 и 2, во второй — на местах 9 и 10. Как соотносятся их precision@10 и recall@10?',
        'Two result pages of ten documents each. In the first, the relevant documents sit at positions 1 and 2; in the second, at 9 and 10. How do their precision@10 and recall@10 compare?',
      ),
      choices: [
        { id: 'a', text: l('У первой обе метрики выше', 'The first has both metrics higher') },
        { id: 'b', text: l('Метрики совпадают, хотя первая выдача очевидно лучше', 'The metrics are identical, although the first page is obviously better') },
        { id: 'c', text: l('У второй выше recall', 'The second has higher recall') },
        { id: 'd', text: l('Сравнить нельзя без разметки', 'They cannot be compared without labels') },
      ],
      correct: ['b'],
      explanation: l(
        'Обе метрики считают только попадание в топ-k, а не позицию внутри него. Это их фундаментальное ограничение и причина появления MRR, MAP и nDCG. Практический вывод: precision@k имеет смысл при маленьком k, где порядок почти не важен (например, precision@1 для навигационных запросов), а для оценки ранжирования нужны метрики с дисконтом по позиции.',
        'Both metrics count membership in the top k, not the position inside it. That is their fundamental limitation and the reason MRR, MAP and nDCG exist. The practical conclusion: precision@k is meaningful at small k where order hardly matters (precision@1 for navigational queries, say), while evaluating ranking requires metrics with a position discount.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.precision-recall.q-recall-stage',
      mode: 'single',
      prompt: l(
        'Двухстадийная схема: отбор тысячи кандидатов, затем ранжирование топ-10. Какая метрика главная для первой стадии?',
        'A two-stage system: a thousand candidates are retrieved, then the top 10 are ranked. Which metric is the main one for the first stage?',
      ),
      choices: [
        { id: 'a', text: l('nDCG@10 кандидатов', 'nDCG@10 of the candidates') },
        {
          id: 'b',
          text: l(
            'recall@1000: что не попало в кандидаты, ранжирование уже не вернёт',
            'recall@1000: what never entered the candidate set cannot be recovered by ranking',
          ),
        },
        { id: 'c', text: l('precision@1000', 'precision@1000') },
        { id: 'd', text: l('MRR по кандидатам', 'MRR over the candidates') },
      ],
      correct: ['b'],
      explanation: l(
        'Первая стадия отвечает за полноту: её задача — не потерять нужное, порядок внутри тысячи кандидатов не важен, потому что его всё равно переопределит вторая стадия. precision@1000 бессмысленна: при тысяче кандидатов и десятке релевантных она всегда около нуля и ничего не различает. Отсюда же правило: качество ретривала меряют recall@K при фиксированном бюджете K, а не абсолютной точностью.',
        'The first stage is responsible for completeness: its job is not to lose what is needed, and the order inside a thousand candidates does not matter because the second stage will redefine it anyway. precision@1000 is meaningless: with a thousand candidates and a dozen relevant ones it is always near zero and discriminates nothing. Hence the rule: retrieval quality is measured by recall@K at a fixed budget K rather than by absolute precision.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Evaluation measures (information retrieval)',
      url: 'https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)',
    },
    {
      title: 'scikit-learn: ranking metrics',
      url: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
    },
  ],
};
