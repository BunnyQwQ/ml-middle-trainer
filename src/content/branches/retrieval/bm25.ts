import { l, same } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const retrievalBm25: SkillNode = {
  id: 'retrieval.bm25',
  branch: 'retrieval',
  tier: 1,
  title: l('Инвертированный индекс и BM25', 'The inverted index and BM25'),
  blurb: l(
    'Базовая линия, которую новые модели обязаны обыграть — и обыгрывают не всегда.',
    'The baseline new models are supposed to beat — and do not always.',
  ),
  requires: [],
  theory: [
    {
      type: 'p',
      text: l(
        'Инвертированный индекс — это отображение из слова в список документов, где оно встречается, вместе с позициями и частотами. Главное его свойство в том, что поиск по запросу из трёх слов читает три коротких списка вместо всей коллекции: сложность зависит от частотности слов запроса, а не от размера базы. Это и делает полнотекстовый поиск по миллиардам документов возможным.',
        'An inverted index is a map from a word to the list of documents it occurs in, with positions and frequencies. Its key property is that a three-word query reads three short lists instead of the whole collection: the cost depends on how common the query words are, not on the size of the corpus. That is what makes full-text search over billions of documents possible at all.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Ранжирование внутри индекса строится на трёх наблюдениях. Чем чаще слово в документе, тем документ релевантнее — но не линейно, иначе спамная страница с тысячей повторов победит. Чем реже слово в коллекции, тем оно информативнее — отсюда idf. И чем длиннее документ, тем проще в нём случайно встретить любое слово — значит, длину надо нормировать. BM25 — это ровно эти три наблюдения, записанные формулой с двумя настраиваемыми ручками.',
        'Ranking inside the index rests on three observations. The more often a word occurs in a document, the more relevant it is — but not linearly, otherwise a spam page with a thousand repetitions wins. The rarer a word is in the collection, the more informative it is — hence idf. And the longer a document, the easier it is to meet any word by chance — so length must be normalised. BM25 is exactly those three observations written as a formula with two tunable knobs.',
      ),
    },
    {
      type: 'formula',
      tex: 'BM25(q,d) = \\sum_{t \\in q} idf(t) \\cdot \\frac{f_{t,d}\\,(k_1+1)}{f_{t,d} + k_1\\left(1 - b + b\\frac{|d|}{avgdl}\\right)}',
    },
    {
      type: 'formula',
      tex: 'idf(t) = \\ln\\left(1 + \\frac{N - df_t + 0.5}{df_t + 0.5}\\right)',
    },
    {
      type: 'sim',
      sim: 'bm25-explorer',
      title: l('BM25 на шести документах', 'BM25 over six documents'),
      caption: l(
        'Поставь k1 = 0: частота перестаёт иметь значение, важно только наличие слова. Увеличь k1 до трёх — кривая выпрямляется, и длинный документ d2 с двенадцатью вхождениями слова «ноутбук» выходит вперёд. Теперь поставь b = 0 и посмотри, как он побеждает просто за счёт длины. Эти две ручки — всё, что настраивается в BM25.',
        'Set k1 = 0: frequency stops mattering and only presence counts. Raise k1 to three and the curve straightens, pushing the long document d2 with twelve occurrences of "ноутбук" to the front. Now set b = 0 and watch it win on length alone. Those two knobs are everything there is to tune in BM25.',
      ),
    },
    { type: 'h', text: l('Что означают k1 и b', 'What k1 and b mean') },
    {
      type: 'table',
      head: [l('Параметр', 'Parameter'), l('Что делает', 'What it does'), l('Типичное значение', 'Typical value')],
      rows: [
        [
          same('k1'),
          l(
            'Скорость насыщения по частоте. При нуле учитывается только факт присутствия слова, при больших значениях вклад почти линеен',
            'How fast the frequency contribution saturates. At zero only presence counts; at large values the contribution is nearly linear',
          ),
          same('1.2 – 2.0'),
        ],
        [
          same('b'),
          l(
            'Сила нормировки на длину. При нуле длина игнорируется, при единице документ делится на свою длину полностью',
            'The strength of length normalisation. At zero length is ignored; at one the document is fully divided by its length',
          ),
          same('0.75'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'BM25 — не исторический экспонат. В 2020-х он остаётся сильнейшим бейзлайном для полнотекстового поиска: на коротких точных запросах и на редких словах он регулярно обыгрывает плотные эмбеддинги, потому что не страдает от размытия редких терминов. Поэтому продовая схема почти всегда гибридная: BM25 и векторный поиск дают кандидатов вместе, а объединяет их отдельный слой.',
        'BM25 is not a museum piece. In the 2020s it remains the strongest baseline for full-text search: on short exact queries and on rare words it regularly beats dense embeddings, because it does not blur rare terms. So a production setup is almost always hybrid: BM25 and vector search supply candidates together, and a separate layer merges them.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Чего BM25 не умеет: он не знает синонимов, не понимает морфологию без внешнего стеммера, и для него «телефон» и «смартфон» — разные слова. Весь прогресс в retrieval последних лет — про то, как добавить семантику, не потеряв точность на точных совпадениях.',
        'What BM25 cannot do: it knows no synonyms, understands no morphology without an external stemmer, and treats "phone" and "smartphone" as different words. All the progress in retrieval over recent years is about adding semantics without losing precision on exact matches.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'retrieval.bm25.py-bm25',
      prompt: l(
        'Реализуй BM25. На вход: документ как список токенов, запрос как список токенов, вся коллекция как список списков токенов, и параметры k1 и b. Верни сумму по уникальным токенам запроса, встречающимся в документе. idf считай по формуле ln(1 + (N - df + 0.5) / (df + 0.5)), где df — число документов коллекции, содержащих токен. Средняя длина документа — по всей коллекции. Пустая коллекция или пустой документ дают 0.0. Из библиотек доступен только math.',
        'Implement BM25. Input: a document as a list of tokens, a query as a list of tokens, the whole collection as a list of token lists, and the parameters k1 and b. Return the sum over unique query tokens that occur in the document. Compute idf as ln(1 + (N - df + 0.5) / (df + 0.5)), where df is the number of collection documents containing the token. The average document length is over the whole collection. An empty collection or an empty document gives 0.0. Only math is available.',
      ),
      signature:
        'def bm25(doc: list[str], query: list[str], corpus: list[list[str]], k1: float = 1.2, b: float = 0.75) -> float:',
      starter: `import math


def bm25(doc, query, corpus, k1=1.2, b=0.75):
    """BM25 score of one document for one query."""
    # TODO
    return 0.0
`,
      reference: `import math


def bm25(doc, query, corpus, k1=1.2, b=0.75):
    """BM25 score of one document for one query."""
    n = len(corpus)
    if n == 0 or not doc:
        return 0.0
    avgdl = sum(len(d) for d in corpus) / n
    if avgdl == 0:
        return 0.0

    counts = {}
    for token in doc:
        counts[token] = counts.get(token, 0) + 1

    score = 0.0
    for token in set(query):
        f = counts.get(token, 0)
        if f == 0:
            continue
        df = sum(1 for d in corpus if token in d)
        idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
        norm = 1 - b + b * len(doc) / avgdl
        score += idf * (f * (k1 + 1)) / (f + k1 * norm)
    return score
`,
      sampleTests: `corpus = [['a', 'b'], ['a', 'c'], ['d']]
assert bm25(['a', 'b'], ['a'], corpus) > 0
assert bm25(['d'], ['a'], corpus) == 0.0          # token absent from the document
assert bm25([], ['a'], corpus) == 0.0
assert bm25(['a'], ['a'], []) == 0.0
`,
      tests: `import math

# 1. A rare token scores higher than a common one, all else equal.
corpus = [['rare'] + ['common'] * 1 for _ in range(1)] + [['common'] for _ in range(19)]
doc = ['rare', 'common']
assert bm25(doc, ['rare'], corpus) > bm25(doc, ['common'], corpus)

# 2. More occurrences help, but with diminishing returns.
corpus = [['x'] * 5, ['y'] * 5, ['z'] * 5, ['x', 'y']]
one = bm25(['x'] + ['pad'] * 4, ['x'], corpus)
two = bm25(['x', 'x'] + ['pad'] * 3, ['x'], corpus)
four = bm25(['x'] * 4 + ['pad'], ['x'], corpus)
assert two > one
assert four > two
assert (four - two) < (two - one), (one, two, four)

# 3. k1 = 0 removes the frequency dimension entirely.
a = bm25(['x'] + ['pad'] * 4, ['x'], corpus, k1=0.0)
bb = bm25(['x'] * 5, ['x'], corpus, k1=0.0)
assert abs(a - bb) < 1e-12, (a, bb)

# 4. b = 0 removes length normalisation: a long and a short document with the
#    same term frequency score the same.
short = bm25(['x', 'p'], ['x'], corpus, b=0.0)
long = bm25(['x'] + ['p'] * 50, ['x'], corpus, b=0.0)
assert abs(short - long) < 1e-12
# With b > 0 the long document is punished.
assert bm25(['x'] + ['p'] * 50, ['x'], corpus, b=0.75) < bm25(['x', 'p'], ['x'], corpus, b=0.75)

# 5. Query tokens missing from the document contribute nothing.
base = bm25(['x', 'p'], ['x'], corpus)
withmiss = bm25(['x', 'p'], ['x', 'absent_token'], corpus)
assert abs(base - withmiss) < 1e-12

# 6. Repeating a token in the query changes nothing: the sum is over unique tokens.
assert abs(bm25(['x', 'p'], ['x', 'x', 'x'], corpus) - base) < 1e-12

# 7. Scores are additive across query tokens.
corpus2 = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['e']]
doc2 = ['a', 'b']
assert abs(
    bm25(doc2, ['a', 'b'], corpus2) - (bm25(doc2, ['a'], corpus2) + bm25(doc2, ['b'], corpus2))
) < 1e-12

# 8. Matches a hand-computed value.
corpus3 = [['q'], ['w'], ['e'], ['q', 'w']]
doc3 = ['q', 'w']
n, df = 4, 2
idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
avgdl = (1 + 1 + 1 + 2) / 4
norm = 1 - 0.75 + 0.75 * 2 / avgdl
want = idf * (1 * (1.2 + 1)) / (1 + 1.2 * norm)
assert abs(bm25(doc3, ['q'], corpus3) - want) < 1e-12, (bm25(doc3, ['q'], corpus3), want)

# 9. Degenerate inputs.
assert bm25([], ['a'], [['a']]) == 0.0
assert bm25(['a'], [], [['a']]) == 0.0
assert bm25(['a'], ['a'], []) == 0.0
`,
      writeup: l(
        'Три теста стоит разобрать отдельно. Второй показывает насыщение: четыре вхождения добавляют меньше, чем переход от одного к двум. Именно это свойство делает BM25 устойчивым к примитивному спаму — повторять ключевое слово перестаёт окупаться. Третий и четвёртый показывают, что k1 и b — это выключатели двух независимых механизмов: при k1 = 0 формула вырождается в «слово есть или нет», при b = 0 длина документа перестаёт учитываться. Шестой тест фиксирует деталь, которую часто реализуют неверно: сумма идёт по уникальным токенам запроса. Если не вызвать set, повторяющееся слово в запросе удвоит свой вклад, и запрос «купить купить ноутбук» начнёт ранжировать иначе, чем «купить ноутбук». В проде BM25 не считают так, как здесь: df берут из предрассчитанной статистики индекса, а не пересчитывают проходом по коллекции на каждый документ. Эта реализация — учебная, её сложность квадратична.',
        'Three tests deserve a closer look. The second shows saturation: four occurrences add less than going from one to two. That property is what makes BM25 robust to naive spam — repeating a keyword stops paying. The third and fourth show that k1 and b are switches for two independent mechanisms: at k1 = 0 the formula degenerates into "the word is there or not", at b = 0 document length stops counting. The sixth test pins down a detail that is often implemented wrongly: the sum runs over unique query tokens. Without the set, a repeated query word doubles its contribution and "buy buy laptop" starts ranking differently from "buy laptop". Production BM25 is not computed the way it is here: df comes from precomputed index statistics rather than a pass over the collection per document. This implementation is for teaching and is quadratic.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.bm25.q-params',
      mode: 'single',
      prompt: l(
        'Что произойдёт с ранжированием, если выставить b = 0?',
        'What happens to the ranking if b is set to 0?',
      ),
      choices: [
        { id: 'a', text: l('Ничего, b влияет только на масштаб', 'Nothing, b only affects the scale') },
        {
          id: 'b',
          text: l(
            'Длина документа перестанет учитываться, и длинные документы начнут выигрывать за счёт случайных вхождений',
            'Document length stops counting, and long documents start winning on chance occurrences',
          ),
        },
        { id: 'c', text: l('Частота слова перестанет учитываться', 'Term frequency stops counting') },
        { id: 'd', text: l('idf перестанет учитываться', 'idf stops counting') },
      ],
      correct: ['b'],
      explanation: l(
        'При b = 0 знаменатель перестаёт зависеть от длины: документ на 10 тысяч слов и документ на 50 слов с одинаковой частотой термина получат одинаковый вклад. Поскольку в длинном документе любое слово встречается чаще просто по случайности, ранжирование смещается в пользу длинных. Обратный край, b = 1, тоже плох: он слишком сильно штрафует длинные документы, которые действительно подробно отвечают на запрос. Отсюда и компромиссное значение 0.75 по умолчанию. Частоту выключает k1, а idf от этих параметров не зависит вовсе.',
        'At b = 0 the denominator stops depending on length: a 10 000-word document and a 50-word one with the same term frequency get the same contribution. Since any word occurs more often in a long document by sheer chance, the ranking shifts towards long documents. The other extreme, b = 1, is bad too: it over-penalises long documents that genuinely answer the query in detail. Hence the compromise default of 0.75. Frequency is switched off by k1, and idf does not depend on these parameters at all.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.bm25.q-when-wins',
      mode: 'multi',
      prompt: l(
        'На каких запросах BM25 обычно выигрывает у плотных эмбеддингов?',
        'On which queries does BM25 usually beat dense embeddings?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Точные артикулы и модели: «rtx 4070 ti super»', 'Exact part numbers and models: "rtx 4070 ti super"'),
        },
        {
          id: 'b',
          text: l('Редкие слова и имена собственные, которых почти нет в обучении', 'Rare words and proper nouns barely seen in training'),
        },
        {
          id: 'c',
          text: l('«что подарить маме на день рождения»', '"what to give mum for her birthday"'),
        },
        {
          id: 'd',
          text: l('Запросы с опечатками и на другом языке', 'Queries with typos or in another language'),
        },
      ],
      correct: ['a', 'b'],
      explanation: l(
        'Сильная сторона BM25 — точное совпадение редких токенов: артикул или модель он найдёт безошибочно, а эмбеддинг размоет их в окрестность похожих строк. Та же причина делает его сильным на редких именах собственных: у плотной модели для них просто нет хорошего представления. Зато на описательных запросах, где нужное слово в документе может вообще не встречаться, BM25 беспомощен — там выигрывает семантика. Опечатки и смена языка тоже не его задача: для них нужны нечёткое сопоставление или многоязычная модель. Отсюда и гибридные схемы: один сигнал закрывает слабости другого.',
        'The strength of BM25 is exact matching of rare tokens: it finds a part number or a model flawlessly, where an embedding blurs them into a neighbourhood of similar strings. The same reason makes it strong on rare proper nouns: a dense model simply has no good representation for them. On descriptive queries, where the needed word may not appear in the document at all, BM25 is helpless — semantics wins there. Typos and language switches are not its job either: those need fuzzy matching or a multilingual model. Hence hybrid setups: one signal covers the other\'s weaknesses.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Okapi BM25',
      url: 'https://en.wikipedia.org/wiki/Okapi_BM25',
    },
    {
      title: 'Wikipedia: Inverted index',
      url: 'https://en.wikipedia.org/wiki/Inverted_index',
    },
  ],
};
