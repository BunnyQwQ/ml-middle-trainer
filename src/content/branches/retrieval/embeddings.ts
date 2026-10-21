import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const retrievalEmbeddings: SkillNode = {
  id: 'retrieval.embeddings',
  branch: 'retrieval',
  tier: 2,
  title: l('Эмбеддинги и двухстадийная схема', 'Embeddings and the two-stage setup'),
  blurb: l(
    'Bi-encoder отбирает, cross-encoder переранжирует, и перепутать их дорого.',
    'A bi-encoder retrieves, a cross-encoder reranks, and swapping them is expensive.',
  ),
  requires: ['retrieval.bm25'],
  theory: [
    {
      type: 'p',
      text: l(
        'Разница между двумя архитектурами ровно одна, и из неё следует всё остальное. Bi-encoder кодирует запрос и документ независимо, а близость считает скалярным произведением векторов. Cross-encoder подаёт запрос и документ в модель вместе, одной последовательностью, и выдаёт число. Первый позволяет посчитать все векторы документов заранее, второй — нет.',
        'There is exactly one difference between the two architectures, and everything else follows from it. A bi-encoder encodes the query and the document independently and measures closeness by a dot product of vectors. A cross-encoder feeds the query and the document into the model together, as one sequence, and outputs a number. The first lets you precompute every document vector; the second does not.',
      ),
    },
    {
      type: 'table',
      head: [
        l('Свойство', 'Property'),
        l('Bi-encoder', 'Bi-encoder'),
        l('Cross-encoder', 'Cross-encoder'),
      ],
      rows: [
        [
          l('Когда считается документ', 'When the document is processed'),
          l('Заранее, один раз при индексации', 'In advance, once at indexing time'),
          l('В момент запроса, для каждой пары', 'At query time, for every pair'),
        ],
        [
          l('Стоимость запроса', 'Query cost'),
          l('Один прогон модели плюс поиск ближайших соседей', 'One model pass plus a nearest-neighbour search'),
          l('По прогону модели на каждый документ-кандидат', 'One model pass per candidate document'),
        ],
        [
          l('Сколько документов осилит', 'How many documents it handles'),
          l('Миллиарды — поиск идёт по индексу векторов', 'Billions — the search runs over a vector index'),
          l('Десятки или сотни', 'Tens or hundreds'),
        ],
        [
          l('Качество', 'Quality'),
          l('Ниже: взаимодействие слов запроса и документа не моделируется', 'Lower: word-level interaction between query and document is not modelled'),
          l('Выше: модель видит обе стороны сразу', 'Higher: the model sees both sides at once'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Отсюда каноническая схема: bi-encoder (часто вместе с BM25) достаёт сотни или тысячи кандидатов из миллионов, cross-encoder переранжирует десятки лучших. Это не компромисс, а единственный способ получить качество cross-encoder за время bi-encoder.',
        'Hence the canonical setup: a bi-encoder (often alongside BM25) pulls hundreds or thousands of candidates out of millions, and a cross-encoder reranks the best few dozen. It is not a compromise but the only way to get cross-encoder quality at bi-encoder latency.',
      ),
    },
    {
      type: 'sim',
      sim: 'two-stage',
      title: l('Потолок, который ставит первая стадия', 'The ceiling the first stage sets'),
      caption: l(
        'Синяя кривая — recall отбора кандидатов, зелёная — итоговое качество. Зелёная никогда не поднимается выше синей: документ, не попавший в кандидаты, не вернёт никакое переранжирование. Двигай бюджет кандидатов и смотри, где синяя выходит на плато — дальше растёт только стоимость, потому что cross-encoder линеен по числу пар.',
        'The blue curve is the recall of the candidate stage, the green one the final quality. Green never rises above blue: a document that missed the candidate set cannot be brought back by any reranker. Move the candidate budget and watch where blue plateaus — beyond that only the cost grows, because a cross-encoder is linear in the number of pairs.',
      ),
    },
    { type: 'h', text: l('Как обучают bi-encoder', 'How a bi-encoder is trained') },
    {
      type: 'p',
      text: l(
        'Главная сложность не в архитектуре, а в отрицательных примерах. Если брать случайные документы коллекции как отрицательные, задача становится слишком лёгкой: отличить запрос про ноутбуки от документа про корм для кошек модель научится мгновенно, а отличить подходящий ноутбук от неподходящего — нет. Поэтому используют hard negatives: документы, которые достал BM25 или предыдущая версия модели, но которые не релевантны. Качество bi-encoder определяется в первую очередь тем, насколько хорошо собраны отрицательные примеры.',
        'The hard part is not the architecture but the negative examples. Random documents from the collection make the task too easy: the model instantly learns to tell a laptop query from a cat food page, and never learns to tell a suitable laptop from an unsuitable one. So hard negatives are used: documents retrieved by BM25 or by a previous version of the model that are not relevant. The quality of a bi-encoder is determined first of all by how well the negatives were mined.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'In-batch negatives: документы остальных запросов в том же батче. Дёшево, но почти всегда слишком легко.',
          'In-batch negatives: the documents of the other queries in the same batch. Cheap, but almost always too easy.',
        ),
        l(
          'Hard negatives из BM25: похожи лексически, но нерелевантны. Главный источник полезного сигнала.',
          'Hard negatives from BM25: lexically similar but irrelevant. The main source of useful signal.',
        ),
        l(
          'Hard negatives из предыдущей версии модели, с переобучением по кругу. Даёт заметный прирост, но требует аккуратности: модель может начать учиться на собственных ошибках разметки.',
          'Hard negatives from a previous model version, mined and retrained in rounds. A solid gain, but it needs care: the model can start learning from its own labelling errors.',
        ),
        l(
          'Дистилляция из cross-encoder: сильная модель размечает пары, слабая учится повторять. Самый надёжный способ подтянуть bi-encoder без новой разметки.',
          'Distillation from a cross-encoder: the strong model labels pairs and the weak one learns to imitate. The most reliable way to lift a bi-encoder without new labels.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Эмбеддинги плохо переносятся между доменами. Модель, обученная на вебе, на товарном поиске покажет себя хуже BM25, и это нормальный результат, а не ошибка в коде. Поэтому первым экспериментом в новом домене ставят не «заменить BM25 на эмбеддинги», а «добавить эмбеддинги к BM25».',
        'Embeddings transfer badly between domains. A model trained on the web will do worse than BM25 on product search, and that is a normal outcome rather than a bug. So the first experiment in a new domain is not "replace BM25 with embeddings" but "add embeddings to BM25".',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'retrieval.embeddings.q-why-two-stage',
      mode: 'single',
      prompt: l(
        'Почему нельзя просто прогнать cross-encoder по всей коллекции, если он точнее?',
        'Why not simply run the cross-encoder over the whole collection, if it is more accurate?',
      ),
      choices: [
        { id: 'a', text: l('Можно, просто это дороже обучать', 'You can, it is just more expensive to train') },
        {
          id: 'b',
          text: l(
            'Он требует прогона модели на каждую пару запрос-документ: миллион документов — миллион прогонов на каждый запрос',
            'It needs a model pass per query-document pair: a million documents means a million passes per query',
          ),
        },
        { id: 'c', text: l('Он хуже работает на длинных документах', 'It works worse on long documents') },
        { id: 'd', text: l('Его нельзя обучить на поисковых логах', 'It cannot be trained on search logs') },
      ],
      correct: ['b'],
      explanation: l(
        'Разница принципиальная и вычислительная. У bi-encoder вектор документа не зависит от запроса, поэтому его считают один раз при индексации, а в момент запроса остаётся поиск ближайших соседей — логарифмический по размеру базы при использовании ANN. У cross-encoder представление зависит от пары, предрассчитать нечего, и стоимость линейна по числу документов. При 10 миллисекундах на пару миллион документов превращается в часы на один запрос. Отсюда и двухстадийность: дорогую модель применяют там, где кандидатов уже десятки.',
        'The difference is fundamental and computational. In a bi-encoder the document vector does not depend on the query, so it is computed once at indexing time and the query reduces to a nearest-neighbour search — logarithmic in corpus size with ANN. In a cross-encoder the representation depends on the pair, nothing can be precomputed, and the cost is linear in the number of documents. At 10 milliseconds per pair, a million documents becomes hours per query. Hence the two stages: the expensive model is applied where candidates already number in the dozens.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.embeddings.q-negatives',
      mode: 'single',
      prompt: l(
        'Bi-encoder обучили на случайных отрицательных примерах. На валидации accuracy 99%, в продовом поиске качество хуже BM25. Что произошло?',
        'A bi-encoder was trained on random negatives. Validation accuracy is 99%, yet production search quality is worse than BM25. What happened?',
      ),
      choices: [
        { id: 'a', text: l('Переобучение, нужна регуляризация', 'Overfitting, regularisation is needed') },
        {
          id: 'b',
          text: l(
            'Задача на обучении была слишком лёгкой: модель училась отличать релевантное от случайного, а в проде надо отличать релевантное от похожего',
            'The training task was too easy: the model learned to tell relevant from random, while production requires telling relevant from similar',
          ),
        },
        { id: 'c', text: l('Размерность эмбеддинга слишком мала', 'The embedding dimension is too small') },
        { id: 'd', text: l('Нужно больше данных', 'More data is needed') },
      ],
      correct: ['b'],
      explanation: l(
        'Высокая accuracy на лёгкой задаче ничего не говорит о продовой. В проде кандидаты приходят от того же BM25 или от ANN-индекса, то есть они уже лексически или семантически похожи на запрос, и отличать их надо тонко. Случайный отрицательный пример такому не учит. Лечится заменой отрицательных примеров на hard negatives, и обычно это даёт больший прирост, чем любое изменение архитектуры. Полезная проверка: посмотреть на распределение скоров модели для кандидатов из прода — если они все сгрудились в узком диапазоне, модель их не различает.',
        'High accuracy on an easy task says nothing about production. In production the candidates come from the same BM25 or from an ANN index, so they are already lexically or semantically close to the query and have to be told apart finely. A random negative teaches none of that. The fix is replacing the negatives with hard ones, and it usually yields a larger gain than any architecture change. A useful check: look at the distribution of model scores over production candidates — if they all cluster in a narrow band, the model does not distinguish them.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.embeddings.q-budget',
      mode: 'multi',
      prompt: l(
        'Итоговое nDCG@10 перестало расти при увеличении числа кандидатов с 500 до 2000. Что это значит?',
        'Final nDCG@10 stopped growing when the candidate count went from 500 to 2000. What does that mean?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Recall первой стадии на 500 кандидатах уже близок к потолку: нужных документов за границей почти нет',
            'The recall of the first stage at 500 candidates is already near its ceiling: few needed documents lie beyond it',
          ),
        },
        {
          id: 'b',
          text: l(
            'Дальше увеличивать бюджет бессмысленно: растёт только стоимость переранжирования',
            'Raising the budget further is pointless: only the reranking cost grows',
          ),
        },
        {
          id: 'c',
          text: l(
            'Возможно, упёрлись в качество переранжирования, и улучшать надо его, а не отбор',
            'Possibly the reranker quality is the binding constraint, and it is what needs improving rather than retrieval',
          ),
        },
        {
          id: 'd',
          text: l('Первая стадия сломана', 'The first stage is broken'),
        },
      ],
      correct: ['a', 'b', 'c'],
      explanation: l(
        'Плато означает, что узкое место переехало с отбора на переранжирование. Проверить это просто: посчитать recall первой стадии на 500 и на 2000 отдельно от итоговой метрики. Если recall тоже вышел на плато — упёрлись в полноту кандидатов, и нужен другой отбор, например гибрид с BM25 или другие hard negatives. Если recall продолжает расти, а итоговое качество нет — значит, cross-encoder не умеет пользоваться добавленными кандидатами, и улучшать надо его. Эти две ситуации требуют совершенно разной работы, и разделить их можно только измерив recall отдельно.',
        'A plateau means the bottleneck has moved from retrieval to reranking. Checking that is easy: measure the first-stage recall at 500 and at 2000 separately from the final metric. If recall also plateaus, candidate completeness is the constraint and a different retrieval is needed — a hybrid with BM25, or better hard negatives. If recall keeps growing while the final quality does not, the cross-encoder cannot exploit the added candidates and it is what needs work. These two situations call for completely different effort, and only measuring recall separately tells them apart.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Learning to rank',
      url: 'https://en.wikipedia.org/wiki/Learning_to_rank',
    },
    {
      title: 'Wikipedia: Word embedding',
      url: 'https://en.wikipedia.org/wiki/Word_embedding',
    },
  ],
};
