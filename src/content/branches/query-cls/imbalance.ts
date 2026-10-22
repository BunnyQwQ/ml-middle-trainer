import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const qclsImbalance: SkillNode = {
  id: 'qcls.imbalance',
  branch: 'query-cls',
  act: 4,
  tier: 1,
  title: l('Дисбаланс классов', 'Class imbalance'),
  blurb: l(
    'Почему ROC AUC выглядит прекрасно там, где модель бесполезна.',
    'Why ROC AUC looks wonderful where the model is useless.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 7,
  theory: [
    {
      type: 'p',
      text: l(
        'Классификация запросов почти всегда несбалансирована. Если категория занимает 0.5% трафика, модель, которая всегда отвечает «не эта категория», получит accuracy 99.5% и будет абсолютно бесполезна. Это банальность, которую все знают, но её менее очевидное продолжение — что ROC AUC в таких задачах тоже вводит в заблуждение.',
        'Query classification is almost always imbalanced. If a category takes 0.5% of traffic, a model that always answers "not this category" scores 99.5% accuracy and is completely useless. That is a banality everyone knows, but its less obvious sequel is that ROC AUC misleads in such problems too.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Причина в знаменателях. False positive rate делится на число отрицательных примеров, которых при дисбалансе очень много, поэтому тысяча ложных срабатываний почти не двигает FPR. Precision делится на число предсказанных положительных, и те же тысяча ложных срабатываний обрушивают её. ROC смотрит на первое, PR-кривая — на второе, и при редком классе расходятся они радикально.',
        'The reason is the denominators. False positive rate divides by the number of negatives, of which there are very many under imbalance, so a thousand false alarms barely move FPR. Precision divides by the number of predicted positives, and those same thousand false alarms destroy it. ROC looks at the first, the PR curve at the second, and under a rare class they diverge radically.',
      ),
    },
    {
      type: 'sim',
      sim: 'imbalance-pr-roc',
      title: l('Одна модель, две оценки', 'One model, two verdicts'),
      caption: l(
        'Разделимость классов не трогай, двигай только долю положительного класса от 50% к половине процента. ROC AUC почти не меняется — модель и правда не стала хуже. Average precision падает в разы, и это честно отражает то, что произойдёт в проде: на каждое верное срабатывание придётся много ложных. Пунктирная горизонталь — точность случайного угадывания, то есть базовая линия, с которой надо сравнивать PR.',
        'Leave the separability alone and move only the positive class share from 50% down to half a percent. ROC AUC barely changes — the model genuinely did not get worse. Average precision falls several-fold, and that honestly reflects what will happen in production: every correct firing comes with many false ones. The dashed horizontal is the precision of random guessing, the baseline the PR curve must be compared against.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Правило: если положительный класс редкий, отчитывайся PR-кривой и average precision, а ROC AUC оставь для сбалансированных задач. И всегда показывай базовую линию: AP = 0.3 при доле класса 1% — это отличный результат, а при доле 40% — провал.',
        'The rule: when the positive class is rare, report the PR curve and average precision, and leave ROC AUC for balanced problems. And always show the baseline: AP = 0.3 at a 1% class share is an excellent result, while at 40% it is a failure.',
      ),
    },
    { type: 'h', text: l('Что делать с дисбалансом при обучении', 'What to do about imbalance during training') },
    {
      type: 'list',
      items: [
        l(
          'Ничего. Часто это правильный ответ: современные градиентные бустинги и нейросети неплохо учатся на несбалансированных данных, если метрика выбрана верно, а порог подобран после обучения.',
          'Nothing. Often that is the right answer: modern gradient boosting and neural nets learn fine on imbalanced data provided the metric is right and the threshold is tuned after training.',
        ),
        l(
          'Взвешивание классов в функции потерь. Работает, но смещает предсказанные вероятности — после него модель почти наверняка некалибрована.',
          'Class weighting in the loss. It works but shifts the predicted probabilities — after it the model is almost certainly uncalibrated.',
        ),
        l(
          'Даунсэмплинг отрицательных: ускоряет обучение в разы и вносит известное смещение, которое чинится аналитической поправкой к предсказанию.',
          'Downsampling the negatives: speeds training up several-fold and introduces a known bias, fixable by an analytical correction to the prediction.',
        ),
        l(
          'Синтетические примеры вроде SMOTE. На текстах и разреженных признаках работают плохо и в поисковых задачах почти не используются.',
          'Synthetic examples such as SMOTE. They work poorly on text and sparse features and are rarely used in search problems.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Главная ошибка — менять баланс классов в валидации. Обучаться можно на чём угодно, но оценивать качество надо на распределении, которое будет в проде. Сбалансированная валидационная выборка даст красивые цифры, не имеющие отношения к реальности.',
        'The main mistake is rebalancing the validation set. Train on whatever you like, but evaluate on the distribution production will see. A balanced validation set yields pretty numbers with no bearing on reality.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'qcls.imbalance.q-auc',
      mode: 'single',
      prompt: l(
        'Классификатор редкой категории (0.3% запросов) имеет ROC AUC 0.94. Продакт считает это отличным результатом. Что ты скажешь?',
        'A classifier for a rare category (0.3% of queries) has a ROC AUC of 0.94. The product manager calls that an excellent result. What do you say?',
      ),
      choices: [
        { id: 'a', text: l('Согласиться: 0.94 — хороший AUC', 'Agree: 0.94 is a good AUC') },
        {
          id: 'b',
          text: l(
            'Попросить precision при рабочем пороге: при такой редкости даже малый FPR даёт много ложных срабатываний на каждое верное',
            'Ask for precision at the working threshold: at this rarity even a small FPR produces many false firings per correct one',
          ),
        },
        { id: 'c', text: l('Переобучить модель на сбалансированных данных', 'Retrain the model on balanced data') },
        { id: 'd', text: l('Поднять порог до 0.9', 'Raise the threshold to 0.9') },
      ],
      correct: ['b'],
      explanation: l(
        'Прикинем арифметику. На миллион запросов положительных 3000. Пусть при рабочем пороге recall 80%, то есть 2400 верных срабатываний, а FPR всего 2% — выглядит отлично. Но 2% от 997 тысяч отрицательных — это почти 20 тысяч ложных срабатываний. Precision получается 2400 / 22400 ≈ 11%: девять из десяти срабатываний ложные. AUC при этом честно равен 0.94, он просто отвечает не на тот вопрос. Правильный разговор с продактом начинается с precision и recall при конкретном пороге, а не с интегральной метрики.',
        'Run the arithmetic. Out of a million queries, 3000 are positive. Say at the working threshold recall is 80%, i.e. 2400 correct firings, and FPR is only 2% — which looks excellent. But 2% of 997 thousand negatives is nearly 20 thousand false firings. Precision comes out as 2400 / 22400 ≈ 11%: nine out of ten firings are wrong. The AUC is honestly 0.94, it simply answers a different question. The right conversation with a product manager starts from precision and recall at a specific threshold, not from an aggregate metric.',
      ),
    },
    {
      kind: 'quiz',
      id: 'qcls.imbalance.q-validation',
      mode: 'multi',
      prompt: l(
        'Какие из этих действий допустимы при обучении на несбалансированных данных?',
        'Which of these are acceptable when training on imbalanced data?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Даунсэмплинг отрицательных примеров в обучающей выборке', 'Downsampling the negatives in the training set'),
        },
        {
          id: 'b',
          text: l('Взвешивание классов в функции потерь', 'Class weighting in the loss function'),
        },
        {
          id: 'c',
          text: l(
            'Балансировка валидационной выборки, чтобы метрики было удобнее читать',
            'Balancing the validation set so the metrics are easier to read',
          ),
        },
        {
          id: 'd',
          text: l(
            'Поправка предсказанной вероятности после даунсэмплинга, если нужна калибровка',
            'Correcting the predicted probability after downsampling when calibration is needed',
          ),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Менять распределение в обучении можно и часто нужно — это вопрос эффективности обучения. Менять его в валидации нельзя: метрики перестанут предсказывать поведение в проде, а именно ради этого валидация и существует. Вариант d важен отдельно: даунсэмплинг в известное число раз систематически завышает предсказанные вероятности, и если модель используется там, где нужно число, а не порядок — например в рекламном аукционе, — поправку надо применить явно. Формула известна и считается из коэффициента даунсэмплинга.',
        'Changing the distribution in training is allowed and often necessary — it is a question of training efficiency. Changing it in validation is not: the metrics stop predicting production behaviour, which is the only reason validation exists. Option d deserves separate mention: downsampling by a known factor systematically inflates the predicted probabilities, and if the model is used where a number rather than an order is needed — in an ad auction, say — the correction has to be applied explicitly. The formula is known and follows from the downsampling rate.',
      ),
    },
  ],

  sources: [
    {
      title: 'scikit-learn: model evaluation',
      url: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
      note: l('Разделы про precision-recall и ROC.', 'The precision-recall and ROC sections.'),
    },
  ],
};
