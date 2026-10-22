import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const adsCalibration: SkillNode = {
  id: 'ads.calibration',
  branch: 'ads',
  act: 4,
  tier: 3,
  title: l('Калибровка pCTR', 'pCTR calibration'),
  blurb: l(
    'Почему хорошая ранжирующая модель может стоить площадке денег.',
    'Why a good ranking model can cost the platform money.',
  ),
  requires: ['ads.auctions'],
  theory: [
    {
      type: 'p',
      text: l(
        'Модель калибрована, если среди событий, которым она дала вероятность 3%, клики случаются примерно в 3% случаев. Это требование к абсолютным значениям, а не к порядку. Большинство привычных метрик — AUC, nDCG, precision@k — инвариантны к монотонным преобразованиям предсказаний, то есть не замечают калибровку вообще.',
        'A model is calibrated when, among the events it assigned a 3% probability, clicks happen about 3% of the time. That is a requirement on absolute values, not on order. Most familiar metrics — AUC, nDCG, precision@k — are invariant to monotone transformations of the predictions, so they do not notice calibration at all.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'В ранжировании органики калибровка обычно не нужна: важен порядок. В рекламе она нужна всегда, потому что предсказание умножается на ставку и участвует в сравнении разных рекламодателей. Отсюда короткая формула: в поиске нужен порядок, в рекламе — число.',
        'In organic ranking calibration is usually irrelevant: order is what matters. In advertising it always matters, because the prediction is multiplied by a bid and takes part in comparing different advertisers. Hence the short version: search needs an order, advertising needs a number.',
      ),
    },
    {
      type: 'sim',
      sim: 'reliability-diagram',
      title: l('Диаграмма надёжности', 'Reliability diagram'),
      caption: l(
        'Горизонталь — что обещала модель, вертикаль — что случилось. Идеальная калибровка лежит на диагонали. Подвигай смещение: кривая уходит под диагональ, ECE растёт, а порядок объявлений при этом не меняется ни разу — преобразование монотонное. Поставь смещение ровно в 1.00 и посмотри, насколько ECE близок к нулю: остаток — это шум конечной выборки, он задаёт порог, ниже которого говорить о некалиброванности бессмысленно.',
        'The horizontal axis is what the model promised, the vertical one what happened. Perfect calibration lies on the diagonal. Move the shift: the curve drops below the diagonal and ECE grows, while the order of the ads never changes once — the transformation is monotone. Set the shift to exactly 1.00 and see how close ECE gets to zero: what remains is finite-sample noise, and it sets the floor below which calling a model miscalibrated is meaningless.',
      ),
    },
    { type: 'h', text: l('Почему калибровка — это деньги', 'Why calibration is money') },
    {
      type: 'p',
      text: l(
        'Если модель завышает вероятность клика у всех рекламодателей одинаково, не происходит ничего: порядок сохраняется, цены считаются из ставок. Беда начинается, когда смещение неравномерно — а оно всегда неравномерно. Новые объявления без истории, редкие категории, мобильный трафик: у каждого сегмента своё смещение. В результате завышенный сегмент систематически выигрывает места, которых не заслуживает, площадка получает меньше кликов, чем рассчитывала, а рекламодатели из занижённого сегмента платят за места ниже, чем им причитается.',
        'If the model inflates click probability equally for every advertiser, nothing happens: the order is preserved and prices come from bids. The trouble starts when the bias is uneven — and it always is. New ads with no history, rare categories, mobile traffic: every segment has its own bias. As a result, the inflated segment systematically wins slots it does not deserve, the platform gets fewer clicks than it counted on, and advertisers in the deflated segment pay for slots below what they are owed.',
      ),
    },
    {
      type: 'sim',
      sim: 'calibration-money',
      title: l('Во что обходится перекос', 'What a skew actually costs'),
      caption: l(
        'Один рекламодатель получает завышенный pCTR. Пока перекос мал, потери ровно нулевые — порядок не меняется. В точке, где A обгоняет B, выручка падает ступенькой. Это и есть ответ на вопрос «насколько точной должна быть калибровка»: настолько, чтобы не переставлять соседей в аукционе.',
        'One advertiser gets an inflated pCTR. While the skew is small the loss is exactly zero — the order does not change. At the point where A overtakes B, revenue drops in a step. That is the answer to "how accurate does calibration need to be": accurate enough not to reorder neighbours in the auction.',
      ),
    },
    { type: 'h', text: l('Чем лечат', 'How it gets fixed') },
    {
      type: 'list',
      items: [
        l(
          'Platt scaling: логистическая регрессия поверх логита модели, два параметра. Дёшево, устойчиво, подходит, когда смещение похоже на сдвиг и растяжение.',
          'Platt scaling: a logistic regression on top of the model logit, two parameters. Cheap, robust, and right when the bias looks like a shift and a stretch.',
        ),
        l(
          'Изотоническая регрессия: монотонная кусочно-постоянная подгонка, гибче Platt, но требует больше данных и склонна переобучаться на хвостах.',
          'Isotonic regression: a monotone piecewise-constant fit, more flexible than Platt but data-hungry and prone to overfitting in the tails.',
        ),
        l(
          'Отдельная калибровка по сегментам — новые объявления, платформы, категории. Именно здесь живёт основное неравномерное смещение.',
          'Separate calibration per segment — new ads, platforms, categories. This is where the bulk of the uneven bias lives.',
        ),
        l(
          'Поправка на сдвиг распределения при даунсэмплинге отрицательных примеров: если при обучении выкинули 90% показов без клика, предсказания завышены в известное число раз, и это чинится аналитически.',
          'A correction for the distribution shift from negative downsampling: if 90% of unclicked impressions were dropped during training, predictions are inflated by a known factor, and that is fixed analytically.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Калибровка стареет быстрее, чем модель. Меняется состав трафика, запускается новая кампания, наступает чёрная пятница — и модель, калиброванная месяц назад, снова врёт. Поэтому калибровочный слой переобучают часто, иногда ежедневно, и обязательно мониторят ECE по сегментам, а не только в целом: общий ECE может быть идеальным при двух сегментах, ошибающихся в разные стороны.',
        'Calibration goes stale faster than the model. The traffic mix shifts, a new campaign launches, Black Friday arrives — and a model calibrated a month ago is lying again. So the calibration layer is retrained often, sometimes daily, and ECE is monitored per segment rather than overall: a global ECE can look perfect while two segments err in opposite directions.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'ads.calibration.py-ece',
      prompt: l(
        'Реализуй expected calibration error. На вход список предсказанных вероятностей, список фактических исходов (0 или 1) той же длины и число корзин. Раздели отрезок [0, 1] на равные корзины, предсказание попадает в корзину по своему значению; значение ровно 1.0 относится к последней корзине. Для каждой непустой корзины посчитай средний прогноз и фактическую долю единиц, возьми модуль разности и усредни по всем корзинам с весом, равным доле объектов в корзине. Пустые списки дают 0.0.',
        'Implement the expected calibration error. The input is a list of predicted probabilities, a list of actual outcomes (0 or 1) of the same length, and a number of bins. Split [0, 1] into equal bins; a prediction falls into the bin of its value, with exactly 1.0 going into the last bin. For every non-empty bin compute the mean prediction and the actual share of ones, take the absolute difference and average over bins weighted by the share of items in each. Empty inputs give 0.0.',
      ),
      signature:
        'def expected_calibration_error(predictions: list[float], outcomes: list[int], bins: int = 10) -> float:',
      starter: `def expected_calibration_error(predictions, outcomes, bins=10):
    """Expected calibration error over equal-width bins."""
    # TODO
    return 0.0
`,
      reference: `def expected_calibration_error(predictions, outcomes, bins=10):
    """Expected calibration error over equal-width bins."""
    n = len(predictions)
    if n == 0 or bins <= 0:
        return 0.0
    sums = [0.0] * bins
    hits = [0.0] * bins
    counts = [0] * bins
    for p, y in zip(predictions, outcomes):
        idx = int(p * bins)
        if idx >= bins:
            idx = bins - 1
        if idx < 0:
            idx = 0
        sums[idx] += p
        hits[idx] += y
        counts[idx] += 1
    ece = 0.0
    for b in range(bins):
        if counts[b] == 0:
            continue
        mean_pred = sums[b] / counts[b]
        observed = hits[b] / counts[b]
        ece += (counts[b] / n) * abs(mean_pred - observed)
    return ece
`,
      sampleTests: `# A perfectly calibrated toy case.
preds = [0.0] * 50 + [1.0] * 50
outs = [0] * 50 + [1] * 50
assert abs(expected_calibration_error(preds, outs, 10)) < 1e-12

# Confidently wrong.
assert abs(expected_calibration_error([1.0] * 10, [0] * 10, 10) - 1.0) < 1e-12

assert expected_calibration_error([], [], 10) == 0.0
`,
      tests: `import random

# 1. Perfect calibration gives zero.
preds = [0.0] * 100 + [1.0] * 100
outs = [0] * 100 + [1] * 100
assert abs(expected_calibration_error(preds, outs, 10)) < 1e-12

# 2. Maximally wrong gives one.
assert abs(expected_calibration_error([1.0] * 20, [0] * 20, 10) - 1.0) < 1e-12
assert abs(expected_calibration_error([0.0] * 20, [1] * 20, 10) - 1.0) < 1e-12

# 3. Always inside [0, 1].
rnd = random.Random(3)
for _ in range(200):
    n = rnd.randint(1, 200)
    p = [rnd.random() for _ in range(n)]
    y = [1 if rnd.random() < 0.3 else 0 for _ in range(n)]
    v = expected_calibration_error(p, y, rnd.randint(2, 20))
    assert 0.0 <= v <= 1.0 + 1e-12, v

# 4. A well-calibrated model scores near zero on real-looking data.
rnd = random.Random(2026)
p, y = [], []
for _ in range(40000):
    prob = rnd.uniform(0.0, 0.5)
    p.append(prob)
    y.append(1 if rnd.random() < prob else 0)
assert expected_calibration_error(p, y, 10) < 0.01, expected_calibration_error(p, y, 10)

# 5. Inflating every prediction makes ECE grow.
inflated = [min(1.0, v * 1.5) for v in p]
assert expected_calibration_error(inflated, y, 10) > expected_calibration_error(p, y, 10) + 0.02

# 6. Order is irrelevant: ECE sees values, not ranking.
pairs = list(zip(p[:5000], y[:5000]))
rnd.shuffle(pairs)
shuffled_p = [a for a, _ in pairs]
shuffled_y = [b for _, b in pairs]
assert abs(
    expected_calibration_error(shuffled_p, shuffled_y, 10)
    - expected_calibration_error(p[:5000], y[:5000], 10)
) < 1e-12

# 7. Exactly 1.0 lands in the last bin rather than out of range.
assert abs(expected_calibration_error([1.0], [1], 10)) < 1e-12

# 8. Two segments erring in opposite directions can cancel in the mean
#    prediction but must not cancel inside a bin.
half = [0.2] * 1000 + [0.4] * 1000
out = [1] * 400 + [0] * 600 + [1] * 200 + [0] * 800
# segment one: predicted 0.2, observed 0.4; segment two: predicted 0.4, observed 0.2
assert abs(expected_calibration_error(half, out, 10) - 0.2) < 1e-9

# 9. Degenerate inputs.
assert expected_calibration_error([], [], 5) == 0.0
assert expected_calibration_error([0.5], [1], 0) == 0.0
`,
      writeup: l(
        'Восьмой тест — самый содержательный. Два сегмента ошибаются в противоположные стороны: первый недооценён, второй переоценён. Средний прогноз по всей выборке совпадает со средней частотой кликов, то есть «в целом модель калибрована». ECE при этом равен 0.2, потому что считает ошибку внутри корзин, а не по выборке целиком. Это ровно та ситуация, которая встречается в проде постоянно: новые объявления переоценены, старые недооценены, общая метрика выглядит идеально. Отсюда правило мониторить калибровку по сегментам. Практические детали реализации: индекс корзины через int(p * bins) с отдельной обработкой p = 1.0, иначе получится выход за границу массива; вес корзины — доля объектов, а не единица, иначе пустая на 10 объектов корзина получит тот же вес, что и корзина на миллион. Есть и вариант с равночастотными корзинами вместо равноширинных — он устойчивее, когда предсказания сгруппированы в узком диапазоне, что для pCTR типично.',
        'The eighth test is the substantive one. Two segments err in opposite directions: the first is underestimated, the second overestimated. The mean prediction over the whole sample matches the mean click frequency, i.e. "the model is calibrated overall". ECE is 0.2 nonetheless, because it measures the error inside bins rather than over the sample as a whole. This is exactly the situation that occurs constantly in production: new ads overestimated, old ones underestimated, the global metric looking perfect. Hence the rule to monitor calibration per segment. Implementation details that matter: the bin index via int(p * bins) with p = 1.0 handled separately, otherwise you index past the end; and the bin weight is the share of items rather than one, otherwise a bin holding ten objects weighs the same as a bin holding a million. There is also an equal-frequency variant instead of equal-width bins — more robust when predictions cluster in a narrow range, which is typical for pCTR.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ads.calibration.q-auc',
      mode: 'single',
      prompt: l(
        'Новая модель pCTR имеет AUC выше старой, но все её предсказания систематически вдвое больше истинных вероятностей. Что произойдёт в рекламном аукционе?',
        'A new pCTR model has a higher AUC than the old one, but all its predictions are systematically twice the true probabilities. What happens in the ad auction?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Всё сломается: цены вырастут вдвое', 'Everything breaks: prices double'),
        },
        {
          id: 'b',
          text: l(
            'Ничего: умножение всех pCTR на одну константу не меняет ни порядок, ни цены, которые считаются из ставок',
            'Nothing: multiplying every pCTR by one constant changes neither the order nor the prices, which come from bids',
          ),
        },
        { id: 'c', text: l('Выручка вырастет вдвое', 'Revenue doubles') },
        { id: 'd', text: l('Площадка начнёт показывать меньше рекламы', 'The platform starts showing fewer ads') },
      ],
      correct: ['b'],
      explanation: l(
        'Равномерное смещение сокращается: ранг равен ставка × pCTR, и общий множитель не меняет порядок. Цена в GSP считается как ставка следующего, умноженная на отношение качеств, — константа сокращается и там. Единственное место, где равномерное смещение всё-таки проявится, — сравнение с резервной ценой: завышенные pCTR пропустят на показ рекламу, которая не должна была пройти порог. Поэтому ответ «ничего» верен для порядка и цен, но резерв пересчитать придётся. Опасно не равномерное смещение, а разное по сегментам.',
        'A uniform bias cancels: the rank is bid × pCTR, and a common factor does not change the order. The GSP price is the next bid times the ratio of qualities — the constant cancels there too. The one place a uniform bias does show up is the comparison against the reserve price: inflated pCTRs let through ads that should not have cleared the threshold. So "nothing" is right for the order and the prices, but the reserve has to be recomputed. What is dangerous is not a uniform bias but one that differs by segment.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ads.calibration.q-segments',
      mode: 'multi',
      prompt: l(
        'Общий ECE модели равен 0.3 процентного пункта — выглядит отлично. Что стоит проверить прежде, чем успокоиться?',
        'The overall ECE of the model is 0.3 percentage points — looks excellent. What should be checked before relaxing?',
      ),
      choices: [
        {
          id: 'a',
          text: l('ECE отдельно по новым объявлениям без накопленной истории', 'ECE separately for new ads with no accumulated history'),
        },
        { id: 'b', text: l('ECE по платформам и типам трафика', 'ECE by platform and traffic type') },
        {
          id: 'c',
          text: l(
            'ECE в диапазоне высоких предсказаний, где лежит мало объектов, но много денег',
            'ECE in the high-prediction range, which holds few objects but a lot of money',
          ),
        },
        {
          id: 'd',
          text: l('AUC: если он высокий, калибровка тоже в порядке', 'AUC: if it is high, calibration is fine too'),
        },
      ],
      correct: ['a', 'b', 'c'],
      explanation: l(
        'AUC не говорит о калибровке ничего — это основная мысль узла. Остальные три проверки закрывают разные способы спрятать проблему внутри хорошего среднего. Новые объявления переоцениваются почти всегда, потому что модель опирается на априорные признаки. Сегменты трафика различаются и поведением, и составом рекламодателей. А взвешивание по числу объектов в ECE означает, что редкие высокие предсказания почти не влияют на метрику, хотя именно на них приходится значительная доля выручки: одно объявление с pCTR 20% стоит сотни объявлений с pCTR 0.2%.',
        'AUC says nothing about calibration — that is the point of this node. The other three checks cover different ways of hiding a problem inside a good average. New ads are almost always overestimated, because the model leans on prior features. Traffic segments differ both in behaviour and in advertiser mix. And weighting by object count in ECE means rare high predictions barely move the metric, although they carry a large share of the revenue: one ad at 20% pCTR is worth hundreds at 0.2%.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Calibration (statistics)',
      url: 'https://en.wikipedia.org/wiki/Calibration_(statistics)',
    },
    {
      title: 'scikit-learn: probability calibration',
      url: 'https://scikit-learn.org/stable/modules/calibration.html',
    },
  ],
};
