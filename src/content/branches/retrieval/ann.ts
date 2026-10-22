import { l, same } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const retrievalAnn: SkillNode = {
  id: 'retrieval.ann',
  branch: 'retrieval',
  act: 4,
  tier: 3,
  title: l('Приближённый поиск соседей', 'Approximate nearest neighbours'),
  blurb: l(
    'IVF, HNSW и PQ: три способа не перебирать миллиард векторов.',
    'IVF, HNSW and PQ: three ways to avoid scanning a billion vectors.',
  ),
  requires: ['retrieval.embeddings'],
  theory: [
    {
      type: 'p',
      text: l(
        'Точный поиск ближайших соседей в высокой размерности сводится к полному перебору: никакое дерево не спасает, потому что при большом числе измерений все точки оказываются примерно на одинаковом расстоянии друг от друга. Поэтому векторный поиск всегда приближённый, и единственный вопрос — на сколько процентов recall мы согласны обменять скорость.',
        'Exact nearest-neighbour search in high dimensions degenerates into a full scan: no tree helps, because with many dimensions all points end up roughly equidistant from each other. So vector search is always approximate, and the only question is how many percent of recall we agree to trade for speed.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'У любого ANN-метода три ручки, и они связаны: recall, скорость и память. Улучшить одно можно только за счёт другого. Поэтому «какой ANN лучше» — некорректный вопрос; корректный звучит как «какой даёт нужный recall при нашем бюджете памяти и задержки».',
        'Every ANN method has three knobs and they are linked: recall, speed and memory. One can only be improved at the expense of another. So "which ANN is best" is the wrong question; the right one is "which reaches our required recall within our memory and latency budget".',
      ),
    },
    { type: 'h', text: l('IVF: разбить пространство на ячейки', 'IVF: split the space into cells') },
    {
      type: 'p',
      text: l(
        'Самая прямолинейная идея. Кластеризуем все векторы, например k-means, и запоминаем, какие точки попали в какую ячейку. При поиске находим ближайшие центроиды и перебираем только их содержимое. Параметр nprobe задаёт, сколько ячеек просматривать: один — быстро и неточно, все — точный перебор.',
        'The most straightforward idea. Cluster all vectors, with k-means say, and remember which points fell into which cell. At query time find the nearest centroids and scan only their contents. The nprobe parameter sets how many cells to scan: one is fast and inaccurate, all of them is a brute-force scan.',
      ),
    },
    {
      type: 'sim',
      sim: 'ann-ivf',
      title: l('Что теряется при nprobe = 1', 'What gets lost at nprobe = 1'),
      caption: l(
        'Красная точка — запрос, зелёные — настоящие десять ближайших, синие — просмотренные. Ставь nprobe = 1 и ищи зелёные точки за пределами синей зоны: это и есть потерянный recall, и теряются именно соседи у границы ячейки. Увеличивай nprobe, следя за двумя числами внизу: recall растёт, ускорение падает.',
        'The red dot is the query, the green ones the true ten nearest, the blue ones the scanned region. Set nprobe = 1 and look for green dots outside the blue area: that is the lost recall, and what gets lost are precisely the neighbours near a cell boundary. Raise nprobe while watching the two numbers below: recall grows, the speed-up falls.',
      ),
    },
    { type: 'h', text: l('HNSW: граф близости', 'HNSW: a proximity graph') },
    {
      type: 'p',
      text: l(
        'Другая идея: построить граф, где каждый вектор связан с несколькими ближайшими, и искать жадным спуском — переходить к тому соседу, который ближе к запросу. Проблема жадного спуска в локальных минимумах, и решается она двумя приёмами: держать не одного кандидата, а ef лучших, и построить иерархию слоёв, где верхние разрежены и позволяют прыгать далеко.',
        'A different idea: build a graph where each vector links to several of its nearest neighbours, and search by greedy descent — step to whichever neighbour is closer to the query. The problem with greedy descent is local minima, solved by two devices: keeping ef best candidates instead of one, and building a hierarchy of layers where the sparse upper ones allow long jumps.',
      ),
    },
    {
      type: 'sim',
      sim: 'ann-hnsw',
      title: l('Жадный спуск по графу', 'Greedy descent over a graph'),
      caption: l(
        'Поставь степень вершины 2 и ef = 1: поиск регулярно застревает, жёлтый путь упирается не в ту точку. Увеличивай ef — поиск начинает находить истинного соседа, но посещает больше вершин. Это та же ручка «точность против скорости», только выраженная шириной луча, а не числом ячеек.',
        'Set the node degree to 2 and ef to 1: the search gets stuck regularly and the yellow path ends at the wrong point. Raise ef — the search starts finding the true neighbour but visits more nodes. It is the same accuracy-versus-speed knob, expressed as beam width rather than a cell count.',
      ),
    },
    {
      type: 'table',
      head: [l('Метод', 'Method'), l('Сильная сторона', 'Strength'), l('Слабая сторона', 'Weakness')],
      rows: [
        [
          same('IVF'),
          l(
            'Простой, предсказуемая память, легко обновлять и шардировать',
            'Simple, predictable memory, easy to update and shard',
          ),
          l(
            'Хуже recall при той же скорости, чувствителен к качеству кластеризации',
            'Worse recall at the same speed, sensitive to clustering quality',
          ),
        ],
        [
          same('HNSW'),
          l('Лучший recall при заданной задержке, стандарт по умолчанию', 'Best recall at a given latency, the default standard'),
          l(
            'Много памяти на граф, дорогое построение, удаление требует перестройки',
            'Heavy memory for the graph, expensive to build, deletion needs a rebuild',
          ),
        ],
        [
          same('PQ'),
          l('Сжатие в десятки раз, миллиард векторов влезает в память', 'Tens-fold compression, a billion vectors fits in memory'),
          l(
            'Теряет точность расстояний, почти всегда требует финального пересчёта на исходных векторах',
            'Loses distance accuracy, almost always needs a final rescoring on the original vectors',
          ),
        ],
      ],
    },
    { type: 'h', text: l('PQ: сжать сами векторы', 'PQ: compress the vectors themselves') },
    {
      type: 'p',
      text: l(
        'IVF и HNSW сокращают число сравнений, а product quantization уменьшает стоимость одного сравнения и размер индекса. Вектор режется на подвекторы, каждый заменяется ближайшим центроидом из своей маленькой кодовой книги, и хранится только номер центроида. Миллиард 768-мерных float32-векторов — это три терабайта; после PQ на 64 байта вектор — 64 гигабайта, то есть помещается в память одной машины.',
        'IVF and HNSW cut the number of comparisons; product quantization cuts the cost of one comparison and the size of the index. A vector is sliced into subvectors, each replaced by the nearest centroid from its own small codebook, and only the centroid id is stored. A billion 768-dimensional float32 vectors is three terabytes; after PQ at 64 bytes per vector it is 64 gigabytes, which fits in one machine\'s memory.',
      ),
    },
    {
      type: 'sim',
      sim: 'pq-quantization',
      title: l('Во что превращается вектор после квантования', 'What a vector becomes after quantisation'),
      caption: l(
        'Серая решётка — все значения, доступные после сжатия. Отрезки показывают, куда уехала каждая точка. При одном бите видно, почему на сжатых векторах нельзя считать финальный скор: расстояния искажены до неузнаваемости. Отсюда стандартная схема — отобрать кандидатов по сжатым векторам, а топ пересчитать на исходных.',
        'The grey lattice is every value available after compression. The segments show where each point moved. At one bit it is obvious why a final score cannot be computed on compressed vectors: the distances are distorted beyond recognition. Hence the standard scheme — select candidates on the compressed vectors and rescore the top on the originals.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Recall ANN-индекса измеряют против точного перебора на отложенной выборке запросов, и делать это надо регулярно. Индекс деградирует со временем: добавляются новые векторы, меняется распределение, центроиды IVF перестают соответствовать данным. Падение recall@10 с 95% до 80% не видно ни по одной продуктовой метрике сразу, но постепенно съедает качество поиска.',
        'The recall of an ANN index is measured against a brute-force scan on a held-out set of queries, and it has to be done regularly. An index degrades over time: new vectors arrive, the distribution shifts, IVF centroids stop matching the data. A drop in recall@10 from 95% to 80% shows up in no product metric immediately, yet it gradually eats search quality.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'retrieval.ann.q-tradeoff',
      mode: 'single',
      prompt: l(
        'Поиск по векторам стал медленным. Инженер предлагает уменьшить nprobe в IVF с 32 до 8. Что произойдёт?',
        'Vector search has become slow. An engineer proposes lowering nprobe in IVF from 32 to 8. What happens?',
      ),
      choices: [
        { id: 'a', text: l('Станет быстрее без последствий', 'It gets faster with no consequences') },
        {
          id: 'b',
          text: l(
            'Станет быстрее примерно вчетверо, recall упадёт, и в первую очередь потеряются соседи у границ ячеек',
            'It gets roughly four times faster, recall falls, and what is lost first are neighbours near cell boundaries',
          ),
        },
        { id: 'c', text: l('Ничего не изменится, nprobe влияет только на индексацию', 'Nothing changes, nprobe only affects indexing') },
        { id: 'd', text: l('Recall вырастет', 'Recall grows') },
      ],
      correct: ['b'],
      explanation: l(
        'nprobe линейно определяет объём просматриваемых данных, поэтому уменьшение в четыре раза даёт примерно четырёхкратное ускорение. Потери в recall при этом неравномерны: документы в центре правильной ячейки найдутся всегда, а соседи у границы — те, что физически близки к запросу, но лежат в соседней ячейке, — потеряются первыми. Это видно в симуляторе как зелёные точки за пределами синей зоны. Перед таким изменением надо измерить recall на отложенных запросах и решить, приемлема ли потеря; «станет быстрее» без второй половины фразы — не инженерное решение.',
        'nprobe linearly determines how much data is scanned, so cutting it fourfold gives roughly a fourfold speed-up. The recall loss is uneven: documents in the centre of the right cell are always found, while boundary neighbours — those physically close to the query but sitting in the adjacent cell — are lost first. The simulator shows this as green dots outside the blue region. Before such a change you measure recall on held-out queries and decide whether the loss is acceptable; "it gets faster" without the second half of the sentence is not an engineering decision.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.ann.q-pq-rescore',
      mode: 'single',
      prompt: l(
        'Зачем после отбора кандидатов по PQ-сжатым векторам пересчитывать расстояния на исходных?',
        'Why rescore distances on the original vectors after selecting candidates with PQ-compressed ones?',
      ),
      choices: [
        { id: 'a', text: l('Для красоты, разница незаметна', 'For elegance, the difference is negligible') },
        {
          id: 'b',
          text: l(
            'Сжатие искажает расстояния, и порядок внутри топа после PQ ненадёжен, хотя для грубого отбора точности хватает',
            'Compression distorts distances, so the order inside the top is unreliable after PQ, although it suffices for coarse filtering',
          ),
        },
        { id: 'c', text: l('Чтобы сэкономить память', 'To save memory') },
        { id: 'd', text: l('Исходные векторы всё равно хранятся в памяти', 'The original vectors are kept in memory anyway') },
      ],
      correct: ['b'],
      explanation: l(
        'PQ даёт приближённое расстояние с ошибкой, сопоставимой с разницей между соседними кандидатами в топе. Для вопроса «входит ли документ в тысячу ближайших» такой точности достаточно, для вопроса «кто из десяти лучший» — нет. Поэтому стандартная схема: грубый отбор по сжатым векторам, затем пересчёт на исходных для нескольких сотен кандидатов. Исходные векторы при этом хранят на диске или в отдельном хранилище и читают только для отобранных — иначе всё сжатие теряет смысл.',
        'PQ yields an approximate distance whose error is comparable to the gap between adjacent candidates in the top. That precision is enough for "is this document among the nearest thousand" and not enough for "which of these ten is best". Hence the standard scheme: coarse selection on compressed vectors, then rescoring on the originals for a few hundred candidates. The originals live on disk or in separate storage and are read only for the selected ones — otherwise the compression buys nothing.',
      ),
    },
    {
      kind: 'quiz',
      id: 'retrieval.ann.q-choose',
      mode: 'multi',
      prompt: l(
        'Миллиард векторов размерности 768, бюджет — одна машина с 128 ГБ памяти, требование recall@10 не ниже 90%. Что из этого разумно?',
        'A billion 768-dimensional vectors, a budget of one machine with 128 GB of memory, and a requirement of recall@10 at 90% or better. Which of these is sensible?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Чистый HNSW на исходных векторах: граф плюс векторы не поместятся в память',
            'Plain HNSW on the raw vectors: the graph plus the vectors will not fit in memory',
          ),
        },
        {
          id: 'b',
          text: l('IVF с PQ: сжать векторы, отбирать по ячейкам, топ пересчитывать точно', 'IVF with PQ: compress the vectors, select by cells, rescore the top exactly'),
        },
        {
          id: 'c',
          text: l('HNSW поверх PQ-сжатых векторов с финальным пересчётом', 'HNSW over PQ-compressed vectors with a final rescoring'),
        },
        {
          id: 'd',
          text: l('Точный перебор: 128 ГБ хватит, если хранить float16', 'Brute force: 128 GB is enough with float16 storage'),
        },
      ],
      correct: ['b', 'c'],
      explanation: l(
        'Исходные данные занимают 768 × 4 × 10^9 ≈ 3 ТБ, в float16 — полтора терабайта, так что ни чистый HNSW, ни перебор в 128 ГБ не влезают, и вариант d отпадает по арифметике. Остаются схемы со сжатием: IVF+PQ — классика для таких объёмов, HNSW поверх сжатых векторов даёт лучший recall при той же памяти, но строится дольше и хуже обновляется. Оба варианта обязаны заканчиваться пересчётом топа на исходных векторах, иначе требование по recall не выполнить. Это ровно та арифметика, которую стоит проделывать вслух на собеседовании: сначала посчитать память, потом выбирать метод.',
        'The raw data takes 768 × 4 × 10^9 ≈ 3 TB, or one and a half terabytes in float16, so neither plain HNSW nor brute force fits into 128 GB and option d fails on arithmetic. What remains are compressed schemes: IVF+PQ is the classic at this scale, while HNSW over compressed vectors gives better recall at the same memory but takes longer to build and updates worse. Both must end with a rescoring of the top on the original vectors, otherwise the recall requirement cannot be met. This is exactly the arithmetic worth doing out loud in an interview: compute the memory first, then pick the method.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Nearest neighbor search',
      url: 'https://en.wikipedia.org/wiki/Nearest_neighbor_search',
    },
    {
      title: 'Wikipedia: Hierarchical navigable small world',
      url: 'https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world',
    },
  ],
};
