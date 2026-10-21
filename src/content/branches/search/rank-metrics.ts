import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const searchRankMetrics: SkillNode = {
  id: 'search.rank-metrics',
  branch: 'search-metrics',
  tier: 3,
  title: l('MRR и MAP', 'MRR and MAP'),
  blurb: l(
    'Первые метрики, которые замечают позицию. И две разные задачи, под которые они заточены.',
    'The first metrics that notice position. And two different jobs they are built for.',
  ),
  requires: ['search.precision-recall'],
  theory: [
    {
      type: 'p',
      text: l(
        'MRR отвечает на вопрос «как быстро пользователь находит ответ». Для одного запроса считается reciprocal rank: единица, делённая на позицию первого релевантного документа. По всем запросам берётся среднее. Всё, что ниже первого релевантного, MRR не видит вообще.',
        'MRR answers "how quickly does the user find the answer". For one query it is the reciprocal rank: one over the position of the first relevant document. The mean is taken across queries. Everything below the first relevant document is invisible to MRR.',
      ),
    },
    { type: 'formula', tex: 'MRR = \\frac{1}{|Q|}\\sum_{q \\in Q} \\frac{1}{\\text{rank}_q}' },
    {
      type: 'p',
      text: l(
        'MAP устроен иначе. Для одного запроса считается average precision: берутся позиции всех релевантных документов, в каждой считается precision@k, и всё это усредняется по числу релевантных. Получается метрика, которая награждает за то, что релевантные документы стоят выше, и учитывает их все, а не только первый.',
        'MAP works differently. For one query you compute average precision: take the positions of all relevant documents, compute precision@k at each, and average over the number of relevant documents. The result rewards relevant documents sitting higher and accounts for all of them, not just the first.',
      ),
    },
    { type: 'formula', tex: 'AP = \\frac{1}{|R|}\\sum_{k:\\, \\text{док } k \\text{ релевантен}} P@k' },
    {
      type: 'sim',
      sim: 'mrr-map',
      title: l('RR и AP на одной выдаче', 'RR and AP on one result page'),
      caption: l(
        'Отметь релевантным только третий документ: RR = 1/3, AP тоже 1/3. Теперь добавь релевантные на позиции 5 и 8 — RR не изменится, а AP вырастет, потому что он видит все найденные. Таблица показывает, из каких слагаемых собирается AP: это precision@k в точках попадания.',
        'Mark only the third document relevant: RR = 1/3 and AP is 1/3 too. Now add relevant documents at positions 5 and 8 — RR does not move while AP grows, because it sees all of them. The table shows the terms AP is assembled from: precision@k at the hit positions.',
      ),
    },
    { type: 'h', text: l('Какая метрика под какую задачу', 'Which metric for which job') },
    {
      type: 'table',
      head: [l('Тип запроса', 'Query type'), l('Что нужно пользователю', 'What the user needs'), l('Метрика', 'Metric')],
      rows: [
        [
          l('Навигационный: «озон личный кабинет»', 'Navigational: "ozon my account"'),
          l('Один конкретный ответ, и как можно выше', 'One specific answer, as high as possible'),
          l('MRR или precision@1', 'MRR or precision@1'),
        ],
        [
          l('Транзакционный: «купить кроссовки 42»', 'Transactional: "buy sneakers size 42"'),
          l('Набор подходящих вариантов для сравнения', 'A set of suitable options to compare'),
          l('MAP или nDCG', 'MAP or nDCG'),
        ],
        [
          l('Информационный: «как выбрать ноутбук»', 'Informational: "how to choose a laptop"'),
          l('Несколько источников с разной полнотой', 'Several sources with differing completeness'),
          l('nDCG с градациями', 'nDCG with grades'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Общая ловушка обеих метрик: запросы без единого релевантного документа. MRR для них равен нулю, и это правильно — пользователь ничего не нашёл. Но если такие запросы молча выбросить из выборки, метрика вырастет на ровном месте. В отчёте всегда должно быть две цифры: значение метрики и доля запросов, попавших в расчёт.',
        'A trap both metrics share: queries with no relevant document at all. MRR is zero for them, and rightly so — the user found nothing. But quietly dropping such queries from the sample inflates the metric out of thin air. A report must always carry two numbers: the metric and the share of queries that entered the computation.',
      ),
    },
    {
      type: 'p',
      text: l(
        'По логам обе метрики приближают кликами: позиция первого клика вместо позиции первого релевантного документа. Это дёшево и доступно на всём трафике, но клик — смещённая замена релевантности: его вероятность зависит от позиции. Поэтому MRR по кликам годится как метрика мониторинга и для сравнения во времени, но сравнивать по ней два ранжирования напрямую нельзя — об этом отдельный узел.',
        'Over logs both metrics are approximated with clicks: the position of the first click instead of the first relevant document. That is cheap and available over all traffic, but a click is a biased stand-in for relevance: its probability depends on position. So click-based MRR works as a monitoring metric and for comparison over time, yet it cannot compare two rankings directly — there is a separate node on that.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'search.rank-metrics.py-ap',
      prompt: l(
        'Реализуй average precision для одной выдачи. На вход список бинарных меток в порядке выдачи и необязательный total_relevant — сколько релевантных документов существует всего. Если total_relevant не задан, дели на число релевантных в списке. Если релевантных нет, верни 0.0. Напомню формулу: сумма precision@k по всем позициям k, где документ релевантен, делённая на число релевантных.',
        'Implement average precision for a single result page. The input is a list of binary labels in result order and an optional total_relevant saying how many relevant documents exist overall. When total_relevant is not given, divide by the number of relevant items in the list. If there are none, return 0.0. The formula: the sum of precision@k over all positions k where the document is relevant, divided by the number of relevant documents.',
      ),
      signature: 'def average_precision(relevance: list[int], total_relevant: int | None = None) -> float:',
      starter: `def average_precision(relevance, total_relevant=None):
    """Average precision for one ranked list of binary labels."""
    # TODO
    return 0.0
`,
      reference: `def average_precision(relevance, total_relevant=None):
    """Average precision for one ranked list of binary labels."""
    hits = 0
    acc = 0.0
    for i, rel in enumerate(relevance):
        if rel:
            hits += 1
            acc += hits / (i + 1)
    denom = total_relevant if total_relevant is not None else hits
    if not denom:
        return 0.0
    return acc / denom
`,
      sampleTests: `# A perfect ranking of two relevant documents.
assert abs(average_precision([1, 1, 0, 0]) - 1.0) < 1e-12

# One relevant document at position 3.
assert abs(average_precision([0, 0, 1]) - 1 / 3) < 1e-12

assert average_precision([0, 0, 0]) == 0.0
`,
      tests: `# 1. Hand-computable cases.
assert abs(average_precision([1, 1, 0, 0]) - 1.0) < 1e-12
assert abs(average_precision([0, 0, 1]) - 1 / 3) < 1e-12
# positions 1 and 3: (1/1 + 2/3) / 2
assert abs(average_precision([1, 0, 1, 0]) - (1 + 2 / 3) / 2) < 1e-12
# positions 2 and 4: (1/2 + 2/4) / 2
assert abs(average_precision([0, 1, 0, 1]) - 0.5) < 1e-12

# 2. Moving a relevant document up can only help.
assert average_precision([1, 0, 0, 1]) > average_precision([0, 1, 0, 1])
assert average_precision([0, 0, 1, 1]) < average_precision([1, 1, 0, 0])

# 3. AP never leaves [0, 1].
import random
rnd = random.Random(7)
for _ in range(300):
    n = rnd.randint(1, 20)
    rel = [1 if rnd.random() < 0.3 else 0 for _ in range(n)]
    ap = average_precision(rel)
    assert 0.0 <= ap <= 1.0 + 1e-12, (rel, ap)

# 4. An explicit total_relevant only shrinks the value.
rel = [1, 0, 1, 0, 0]
assert average_precision(rel, total_relevant=10) < average_precision(rel)
assert abs(average_precision(rel, total_relevant=2) - average_precision(rel)) < 1e-12

# 5. Degenerate inputs.
assert average_precision([]) == 0.0
assert average_precision([0] * 10) == 0.0
assert average_precision([0, 0], total_relevant=5) == 0.0

# 6. With exactly one relevant document AP equals the reciprocal rank.
for pos in range(1, 9):
    rel = [0] * (pos - 1) + [1] + [0] * (9 - pos)
    assert abs(average_precision(rel) - 1 / pos) < 1e-12, pos

# 7. All documents relevant gives exactly 1.
assert abs(average_precision([1] * 15) - 1.0) < 1e-12
`,
      writeup: l(
        'Ключ к формуле — шестой тест: при единственном релевантном документе AP совпадает с reciprocal rank. То есть MRR это частный случай MAP, а не отдельная конструкция, и различаются они тем, сколько релевантных документов существует. Второй важный момент — знаменатель. Если делить на число найденных релевантных, система, которая нашла один документ из десяти и поставила его первым, получит AP = 1.0, то есть идеальную оценку за потерю девяти. Поэтому в задачах с известным полным множеством релевантных (например, по логам покупок) делить надо на него, и тогда AP честно штрафует за неполноту. Реализация в одну строку через накопление hits заодно показывает, почему AP дороже precision@k: нужен один проход, но с состоянием.',
        'The key to the formula is the sixth test: with a single relevant document AP equals the reciprocal rank. So MRR is a special case of MAP rather than a separate construction, and they differ only in how many relevant documents exist. The second thing that matters is the denominator. Divide by the number of relevant documents found, and a system that located one out of ten and placed it first scores AP = 1.0 — a perfect mark for losing nine. So when the full relevant set is known (from purchase logs, say) that is what you divide by, and AP then honestly penalises incompleteness. The one-pass implementation with a running hit count also shows why AP costs more than precision@k: one pass, but a stateful one.',
      ),
    },
    {
      kind: 'sql',
      id: 'search.rank-metrics.sql-mrr',
      prompt: l(
        'Посчитай MRR по кликам на открытых логах. Для каждого запроса возьми позицию первого кликнутого документа; запросы без кликов дают вклад 0. Три колонки в одной строке: queries — всего запросов, queries_with_click — сколько с кликом, mrr — среднее значение 1/позиция по всем запросам, округлить до 5 знаков.',
        'Compute click-based MRR over the open logs. For every query take the position of the first clicked document; queries with no clicks contribute 0. Three columns in one row: queries — total queries, queries_with_click — how many had a click, mrr — the mean of 1/position across all queries, rounded to 5 decimals.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Знаменатель — все запросы, а не только те, где был клик.
-- The denominator is every query, not just the ones with a click.
WITH first_click AS (
  SELECT
  FROM queries
)
SELECT
FROM first_click
`,
      reference: `WITH first_click AS (
  SELECT i.query_id, min(i.position) AS pos
  FROM impressions i
  JOIN clicks c ON c.impression_id = i.impression_id
  GROUP BY 1
)
SELECT count(*) AS queries,
       count(f.pos) AS queries_with_click,
       round(sum(coalesce(1.0 / f.pos, 0)) / count(*), 5) AS mrr
FROM queries q
LEFT JOIN first_click f ON f.query_id = q.query_id`,
      orderMatters: false,
      writeup: l(
        'Вся суть задачи в знаменателе. Если написать INNER JOIN вместо LEFT JOIN, из расчёта выпадут запросы без кликов, и MRR вырастет — иногда вдвое. Это ровно та ошибка, про которую предупреждает теория: выброшенные запросы не нейтральны, это как раз те случаи, когда поиск не справился. coalesce превращает отсутствующую позицию в нулевой вклад. Обрати внимание и на min(position): первый клик по времени и клик на самой высокой позиции — не одно и то же, пользователь может кликнуть третий документ, потом первый. В классическом определении MRR берётся позиция, а не время, поэтому min по позиции правильнее. Если нужна именно хронология, берут argMin по времени клика, и это другая метрика — её иногда зовут «позиция первого выбора».',
        'The whole point of the task is the denominator. Write INNER JOIN instead of LEFT JOIN and queries with no clicks drop out of the computation, lifting MRR — sometimes by a factor of two. That is exactly the mistake the theory warns about: the discarded queries are not neutral, they are precisely the cases where search failed. coalesce turns a missing position into a zero contribution. Note min(position) too: the first click in time and the click at the highest position are not the same thing, since a user may click the third document and then the first. The classic MRR definition takes position rather than time, so min over position is the right choice. When chronology is genuinely wanted you take argMin over the click timestamp, and that is a different metric, sometimes called "position of first choice".',
      ),
      clickhouse: {
        code: `SELECT count() AS queries,
       countIf(pos > 0) AS queries_with_click,
       round(avg(if(pos > 0, 1.0 / pos, 0)), 5) AS mrr
FROM (
    SELECT q.query_id,
           minIf(i.position, c.click_id != 0) AS pos
    FROM queries AS q
    LEFT JOIN impressions AS i ON i.query_id = q.query_id
    LEFT JOIN clicks AS c ON c.impression_id = i.impression_id
    GROUP BY q.query_id
)`,
        note: l(
          'В ClickHouse удобнее minIf: условный агрегат убирает отдельный подзапрос с джойном кликов. Но помни про нули вместо NULL после LEFT JOIN — проверка pos > 0 здесь не косметика, а необходимость, иначе запросы без кликов получат позицию 0 и дадут деление на ноль.',
          'ClickHouse makes minIf the convenient form: a conditional aggregate removes the separate subquery joining clicks. But remember the zeros instead of NULLs after a LEFT JOIN — the pos > 0 check here is not cosmetic but necessary, otherwise queries with no clicks get position 0 and produce a division by zero.',
        ),
      },
    },
    {
      kind: 'quiz',
      id: 'search.rank-metrics.q-choose',
      mode: 'single',
      prompt: l(
        'Поиск по маркетплейсу, запрос «кроссовки для бега 42». Пользователь обычно открывает несколько товаров и сравнивает. Какая метрика уместнее?',
        'Marketplace search, the query "running sneakers size 42". The user typically opens several items and compares. Which metric fits better?',
      ),
      choices: [
        { id: 'a', text: l('MRR: важно, чтобы первый товар был хорошим', 'MRR: the first item should be good') },
        {
          id: 'b',
          text: l(
            'MAP или nDCG: пользователю нужен набор подходящих вариантов, а не один ответ',
            'MAP or nDCG: the user needs a set of suitable options rather than one answer',
          ),
        },
        { id: 'c', text: l('recall@1000', 'recall@1000') },
        { id: 'd', text: l('precision@1', 'precision@1') },
      ],
      correct: ['b'],
      explanation: l(
        'Сценарий сравнения означает, что ценность выдачи определяется несколькими документами, а не первым. MRR и precision@1 этого не видят: они дадут одинаковую оценку выдаче, где хорош только первый товар, и выдаче, где хороши первые пять. Для такого сценария нужна метрика, учитывающая весь топ, причём лучше с градациями — товар «точно тот» и товар «похожий» различаются сильно. recall@1000 относится к стадии отбора кандидатов и качество порядка не оценивает вовсе.',
        'A comparison scenario means the value of the page comes from several documents rather than the first. MRR and precision@1 cannot see that: they score a page where only the first item is good the same as one where the first five are. Such a scenario needs a metric covering the whole top, preferably with grades — an "exactly right" item and a "similar" one differ a lot. recall@1000 belongs to the candidate retrieval stage and judges no ordering at all.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Mean reciprocal rank',
      url: 'https://en.wikipedia.org/wiki/Mean_reciprocal_rank',
    },
    {
      title: 'Wikipedia: Evaluation measures (information retrieval)',
      url: 'https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)',
      note: l('Раздел про MAP.', 'The MAP section.'),
    },
  ],
};
