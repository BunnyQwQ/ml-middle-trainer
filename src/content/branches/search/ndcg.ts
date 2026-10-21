import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchNdcg: SkillNode = {
  id: 'search.ndcg',
  branch: 'search-metrics',
  tier: 4,
  title: l('DCG и nDCG', 'DCG and nDCG'),
  blurb: l(
    'Главная оффлайн-метрика ранжирования: градации релевантности плюс дисконт по позиции.',
    'The main offline ranking metric: graded relevance plus a position discount.',
  ),
  requires: ['search.rank-metrics'],
  theory: [
    {
      type: 'p',
      text: l(
        'nDCG собран из трёх решений, и каждое из них стоит понимать отдельно. Первое: выигрыш (gain) — сколько пользы приносит документ с оценкой rel. Второе: дисконт — во сколько раз эта польза обесценивается из-за позиции. Третье: нормировка — делим на идеальный порядок, чтобы метрику можно было усреднять по запросам с разным числом релевантных документов.',
        'nDCG is assembled from three decisions, and each is worth understanding separately. First, the gain: how much value a document with grade rel brings. Second, the discount: how much that value is devalued by its position. Third, the normalisation: dividing by the ideal order so the metric can be averaged across queries with different numbers of relevant documents.',
      ),
    },
    {
      type: 'formula',
      tex: 'DCG@k = \\sum_{i=1}^{k} \\frac{2^{rel_i} - 1}{\\log_2(i+1)}, \\qquad nDCG@k = \\frac{DCG@k}{IDCG@k}',
    },
    {
      type: 'p',
      text: l(
        'Экспоненциальный выигрыш 2^rel - 1 означает, что оценки нелинейны: документ с оценкой 3 полезнее документа с оценкой 2 не в полтора раза, а вдвое с лишним. Это сознательный выбор, который заставляет модель бороться за идеальные ответы, а не набирать посредственные. Линейный вариант, где выигрыш равен самой оценке, тоже встречается, и при сравнении чужих цифр первым делом надо уточнять, какой из них использован — числа различаются заметно.',
        'The exponential gain 2^rel - 1 means grades are non-linear: a document graded 3 is not one and a half times more useful than one graded 2 but more than twice. That is a deliberate choice which pushes a model to fight for perfect answers rather than accumulate mediocre ones. The linear variant, where the gain equals the grade itself, also exists, and when comparing someone else\'s numbers the first thing to establish is which was used — the values differ noticeably.',
      ),
    },
    {
      type: 'sim',
      sim: 'ndcg-reorder',
      title: l('Переставь документы и смотри на nDCG', 'Reorder the documents and watch nDCG'),
      caption: l(
        'Стрелки меняют порядок, клик по оценке повышает её по кругу. Главное упражнение: поменяй местами первый и второй документ, запиши изменение nDCG, верни обратно и поменяй девятый с десятым. Разница в цене ошибки на разных позициях — это и есть весь смысл дисконта. Второе упражнение: поставь k = 3 и подвинь хороший документ с четвёртой позиции на третью — метрика прыгнет, потому что документ пересёк границу отсечения.',
        'The arrows reorder, clicking a grade cycles it. The main exercise: swap the first and second document, note the change in nDCG, put it back and swap the ninth with the tenth. The difference in the cost of a mistake at different positions is the whole point of the discount. Second exercise: set k = 3 and move a good document from position four to three — the metric jumps, because the document crossed the cutoff.',
      ),
    },
    { type: 'h', text: l('Почему именно логарифм', 'Why a logarithm specifically') },
    {
      type: 'p',
      text: l(
        'Дисконт 1/log2(i+1) — это модель того, как пользователь просматривает выдачу: внимание падает с позицией, но не обрывается. Выбор логарифма не выведен из первых принципов, это компромисс: он мягче, чем 1/i, и потому не превращает метрику в «важна только первая позиция», но достаточно крут, чтобы перестановки в топе стоили дороже перестановок в хвосте.',
        'The 1/log2(i+1) discount is a model of how a user scans a page: attention falls with position but does not cut off. The choice of a logarithm is not derived from first principles, it is a compromise: gentler than 1/i, so the metric does not collapse into "only the first position matters", yet steep enough that swaps at the top cost more than swaps in the tail.',
      ),
    },
    {
      type: 'sim',
      sim: 'discount-curves',
      title: l('Три дисконта рядом', 'Three discounts side by side'),
      caption: l(
        'Нижние числа считают, во сколько раз перестановка на первых позициях дороже перестановки в конце при выбранном дисконте. Без дисконта это отношение равно единице — отсюда и слепота precision@k к порядку.',
        'The numbers below compute how many times dearer a swap at the top is than one at the end under the chosen discount. Without a discount the ratio is one — which is where precision@k gets its blindness to order from.',
      ),
    },
    { type: 'h', text: l('Где nDCG ломается', 'Where nDCG breaks') },
    {
      type: 'list',
      items: [
        l(
          'Нормировка скрывает разницу между запросами. Запрос с одним идеальным документом и запрос с двадцатью релевантными оба дают nDCG = 1 при идеальном порядке. Поэтому усреднять nDCG по запросам можно, а делать из этого вывод «запросы одинаково хороши» нельзя.',
          'The normalisation hides the difference between queries. A query with one perfect document and one with twenty relevant ones both give nDCG = 1 under the ideal order. So averaging nDCG across queries is fine, but concluding "the queries are equally good" from it is not.',
        ),
        l(
          'Неразмеченные документы считаются нерелевантными. Если новая модель поднимает документ, которого не было в пуле разметки, метрика его накажет. Отсюда систематическое преимущество старых моделей на старой разметке.',
          'Unlabelled documents count as irrelevant. If a new model promotes a document that was never in the labelling pool, the metric punishes it. Hence the systematic advantage of old models on old labels.',
        ),
        l(
          'nDCG@k зависит от k сильнее, чем кажется: при k = 3 метрика почти не отличает четвёртую позицию от десятой. Сравнивать можно только одинаковые k.',
          'nDCG@k depends on k more than it looks: at k = 3 the metric barely distinguishes position four from position ten. Only equal k values are comparable.',
        ),
        l(
          'Метрика не видит разнообразия и дублей. Десять одинаково релевантных копий одного товара дадут nDCG = 1, хотя выдача бесполезна.',
          'The metric sees neither diversity nor duplicates. Ten equally relevant copies of one item give nDCG = 1 even though the page is useless.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Практическое правило: nDCG — метрика для итераций над моделью, а не для принятия продуктовых решений. Рост nDCG на 1% не означает роста выручки или удержания, он означает, что документы с высокими асессорскими оценками поднялись выше. Связь с деньгами проверяется онлайн-экспериментом.',
        'A practical rule: nDCG is a metric for iterating on a model, not for making product decisions. A 1% rise in nDCG does not mean more revenue or retention, it means documents with high rater grades moved up. The link to money is verified by an online experiment.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'search.ndcg.py-ndcg',
      prompt: l(
        'Реализуй nDCG@k. На вход список градуированных оценок релевантности в порядке выдачи, глубина k и флаг exponential. При exponential=True выигрыш равен 2^rel - 1, иначе просто rel. Дисконт — 1/log2(i+1), где i — позиция с единицы. Нормировать надо на DCG идеального порядка тех же оценок, усечённого до того же k. Если идеальный DCG равен нулю, верни 0.0. При k <= 0 тоже 0.0; k больше длины списка означает весь список. Из библиотек доступен только math.',
        'Implement nDCG@k. The input is a list of graded relevance scores in result order, a cutoff k and an exponential flag. With exponential=True the gain is 2^rel - 1, otherwise just rel. The discount is 1/log2(i+1) with i a 1-based position. Normalise by the DCG of the ideal ordering of the same grades, truncated to the same k. If the ideal DCG is zero return 0.0. For k <= 0 return 0.0 as well; a k larger than the list means the whole list. Only math is available.',
      ),
      signature: 'def ndcg_at_k(relevance: list[float], k: int, exponential: bool = True) -> float:',
      starter: `import math


def ndcg_at_k(relevance, k, exponential=True):
    """Normalised discounted cumulative gain at k."""
    # TODO
    return 0.0
`,
      reference: `import math


def ndcg_at_k(relevance, k, exponential=True):
    """Normalised discounted cumulative gain at k."""
    if k <= 0 or not relevance:
        return 0.0

    def dcg(items):
        total = 0.0
        for i, rel in enumerate(items[:k]):
            gain = (2 ** rel - 1) if exponential else rel
            total += gain / math.log2(i + 2)
        return total

    ideal = dcg(sorted(relevance, reverse=True))
    if ideal == 0:
        return 0.0
    return dcg(relevance) / ideal
`,
      sampleTests: `# The ideal order scores exactly one.
assert abs(ndcg_at_k([3, 2, 1, 0], 4) - 1.0) < 1e-12

# The reversed order scores less.
assert ndcg_at_k([0, 1, 2, 3], 4) < 1.0

# No relevance at all.
assert ndcg_at_k([0, 0, 0], 3) == 0.0
assert ndcg_at_k([3, 2], 0) == 0.0
`,
      tests: `import math

# 1. A hand-computable value with the exponential gain.
#    grades [3, 0, 2] -> (2^3-1)/log2(2) + 0 + (2^2-1)/log2(4)
got = ndcg_at_k([3, 0, 2], 3)
dcg = 7 / math.log2(2) + 0 / math.log2(3) + 3 / math.log2(4)
idcg = 7 / math.log2(2) + 3 / math.log2(3) + 0 / math.log2(4)
assert abs(got - dcg / idcg) < 1e-12, (got, dcg / idcg)

# 2. The ideal order is always exactly 1, whatever the grades.
for grades in ([3, 2, 1], [1, 1, 1], [4, 4, 0, 0], [2]):
    assert abs(ndcg_at_k(sorted(grades, reverse=True), len(grades)) - 1.0) < 1e-12, grades

# 3. Always inside [0, 1].
import random
rnd = random.Random(11)
for _ in range(400):
    n = rnd.randint(1, 15)
    grades = [rnd.randint(0, 3) for _ in range(n)]
    for k in (1, 3, n):
        v = ndcg_at_k(grades, k)
        assert -1e-12 <= v <= 1 + 1e-12, (grades, k, v)

# 4. Promoting a better document never hurts.
base = [1, 3, 0, 2]
better = [3, 1, 0, 2]
assert ndcg_at_k(better, 4) > ndcg_at_k(base, 4)

# 5. A swap at the top costs more than the same swap in the tail.
#    Same multiset of grades in all three, only the order differs.
ideal = ndcg_at_k([3, 2, 1, 1, 1, 1, 1, 1, 1, 0], 10)
top_swap = ndcg_at_k([2, 3, 1, 1, 1, 1, 1, 1, 1, 0], 10)
tail_swap = ndcg_at_k([3, 2, 1, 1, 1, 1, 1, 1, 0, 1], 10)
assert abs(ideal - 1.0) < 1e-12
assert top_swap < ideal and tail_swap < ideal
assert (ideal - top_swap) > 10 * (ideal - tail_swap)

# 6. The linear gain gives a different number but the same ideal order.
assert abs(ndcg_at_k([3, 2, 1], 3, exponential=False) - 1.0) < 1e-12
lin = ndcg_at_k([1, 3, 2], 3, exponential=False)
exp = ndcg_at_k([1, 3, 2], 3, exponential=True)
assert abs(lin - exp) > 1e-6, (lin, exp)

# 7. The cutoff truncates the ideal list too, so nDCG@1 of a perfect head is 1.
assert abs(ndcg_at_k([3, 0, 0, 0], 1) - 1.0) < 1e-12
# A relevant document below the cutoff adds nothing to DCG, but it does raise
# the ideal: nDCG@k goes down rather than staying put.
assert ndcg_at_k([3, 0, 0, 3], 2) < ndcg_at_k([3, 0, 0, 0], 2) - 1e-9
# Bring it inside the cutoff and the score recovers.
assert ndcg_at_k([3, 3, 0, 0], 2) > ndcg_at_k([3, 0, 0, 3], 2)

# 8. Degenerate inputs.
assert ndcg_at_k([], 5) == 0.0
assert ndcg_at_k([0, 0], 2) == 0.0
assert ndcg_at_k([1, 2], -3) == 0.0
# k beyond the list length is the whole list.
assert abs(ndcg_at_k([3, 1], 99) - ndcg_at_k([3, 1], 2)) < 1e-12
`,
      writeup: l(
        'Две вещи, на которых чаще всего ошибаются. Первая: идеальный порядок надо усекать тем же k. Если посчитать IDCG по всему списку, а DCG — по первым k, метрика перестанет достигать единицы даже на идеальной выдаче, и сравнивать запросы между собой станет нельзя. Седьмой тест проверяет именно это и заодно фиксирует тонкость, на которой легко ошибиться: релевантный документ ниже отсечения не добавляет ничего к DCG, но попадает в идеальный порядок и поднимает IDCG, поэтому nDCG@k от него падает. То есть метрика всё-таки знает о хороших документах за границей k — через знаменатель, а не через числитель. Вторая: нумерация позиций с единицы, то есть log2(i+1) для i, начинающегося с 1, что в коде с нулевой индексацией превращается в log2(i+2). Ошибка на единицу здесь не роняет тест на монотонность, но ломает абсолютные значения, и расхождение с чужой реализацией потом ищут часами. Пятый тест фиксирует главное содержательное свойство: одинаковая по смыслу перестановка в топе стоит дороже, чем в хвосте. В проде обычно берут готовое: sklearn.metrics.ndcg_score, но у него свои умолчания — линейный выигрыш по умолчанию, — поэтому читать документацию всё равно придётся.',
        'Two things people get wrong most often. First, the ideal order must be truncated by the same k. Compute IDCG over the whole list while DCG covers only the first k, and the metric stops reaching one even on a perfect page, making queries incomparable. The seventh test checks exactly that, and also pins down a subtlety that is easy to get wrong: a relevant document below the cutoff adds nothing to DCG but does enter the ideal ordering and raises IDCG, so nDCG@k falls because of it. The metric does know about good documents beyond k — through the denominator rather than the numerator. Second, positions are 1-based, i.e. log2(i+1) for i starting at 1, which in zero-indexed code becomes log2(i+2). An off-by-one here does not break the monotonicity test but ruins the absolute values, and the mismatch with someone else\'s implementation then takes hours to find. The fifth test pins down the key substantive property: the same swap costs more at the top than in the tail. In production you usually reach for sklearn.metrics.ndcg_score, but it has defaults of its own — a linear gain by default — so reading the documentation is unavoidable anyway.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.ndcg.q-normalisation',
      mode: 'single',
      prompt: l(
        'По запросу A есть один идеальный документ, по запросу B — двадцать релевантных. Обе выдачи отранжированы идеально. Что покажет nDCG@10?',
        'Query A has one perfect document, query B has twenty relevant ones. Both pages are ranked ideally. What does nDCG@10 show?',
      ),
      choices: [
        { id: 'a', text: l('У B выше, релевантных больше', 'B is higher, it has more relevant documents') },
        { id: 'b', text: l('Обе равны 1: нормировка на идеальный порядок убирает разницу', 'Both equal 1: normalising by the ideal order removes the difference') },
        { id: 'c', text: l('У A выше', 'A is higher') },
        { id: 'd', text: l('Зависит от градаций', 'It depends on the grades') },
      ],
      correct: ['b'],
      explanation: l(
        'В этом и смысл нормировки: метрика отвечает на вопрос «насколько порядок близок к лучшему возможному для этого запроса», а не «сколько хорошего нашлось». Благодаря этому nDCG можно усреднять по запросам разной сложности. Обратная сторона — метрика ничего не говорит про абсолютное качество: выдача из одних посредственных документов, отранжированных идеально, тоже даст единицу. Поэтому рядом с nDCG всегда смотрят на долю запросов без единого релевантного документа и на среднюю оценку топ-1.',
        'That is the point of the normalisation: the metric answers "how close is the order to the best possible for this query" rather than "how much good was found". This is what makes nDCG averageable across queries of differing difficulty. The flip side is that it says nothing about absolute quality: a page of uniformly mediocre documents ranked ideally also scores one. So nDCG is always read alongside the share of queries with no relevant document at all and the mean grade of the top result.',
      ),
    },
    {
      kind: 'quiz',
      id: 'search.ndcg.q-pitfalls',
      mode: 'multi',
      prompt: l(
        'Новая модель даёт nDCG@10 выше на 1.5%. В каких случаях этот рост может не означать улучшения для пользователя?',
        'A new model raises nDCG@10 by 1.5%. In which cases might that rise not mean an improvement for the user?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Модель подняла документы, которые есть в разметке, а новые хорошие документы остались неразмеченными и считаются нерелевантными',
            'The model promoted documents present in the labels, while new good documents stayed unlabelled and count as irrelevant',
          ),
        },
        {
          id: 'b',
          text: l(
            'Выдача стала менее разнообразной: наверху десять почти одинаковых товаров с высокими оценками',
            'The page became less diverse: ten nearly identical high-graded items at the top',
          ),
        },
        {
          id: 'c',
          text: l('Разметка собрана год назад и устарела', 'The labels were collected a year ago and are stale'),
        },
        {
          id: 'd',
          text: l(
            'Рост в 1.5% меньше доверительного интервала метрики на этой выборке запросов',
            'A 1.5% rise is smaller than the confidence interval of the metric on this query sample',
          ),
        },
        {
          id: 'e',
          text: l('Метрика считалась с экспоненциальным выигрышем', 'The metric used the exponential gain'),
        },
      ],
      correct: ['a', 'b', 'c', 'd'],
      explanation: l(
        'Экспоненциальный выигрыш — просто соглашение, он не делает рост фиктивным, лишь меняет масштаб. Остальные четыре пункта — реальные механизмы, по которым оффлайн-метрика растёт без пользы. Про последний стоит сказать отдельно: nDCG считается по выборке запросов и имеет доверительный интервал, но в отчётах его почти никогда не показывают. На тысяче запросов интервал легко перекрывает процент, поэтому рост на 1.5% без интервала — не результат. Практический вывод: оффлайн-метрика отсеивает заведомо плохое, а решение принимается в онлайне.',
        'The exponential gain is merely a convention; it does not make the rise fictitious, only changes the scale. The other four are real mechanisms by which an offline metric rises without benefit. The last one deserves a note: nDCG is computed over a sample of queries and has a confidence interval, which reports almost never show. On a thousand queries that interval easily spans a percent, so a 1.5% rise without one is not a result. The practical conclusion: the offline metric filters out the obviously bad, and the decision happens online.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Discounted cumulative gain',
      url: 'https://en.wikipedia.org/wiki/Discounted_cumulative_gain',
    },
    {
      title: 'scikit-learn: ndcg_score',
      url: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
      note: l('Обрати внимание на умолчания по выигрышу.', 'Note its defaults for the gain function.'),
    },
  ],
};
