import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const metricBasics: SkillNode = {
  id: 'metric.basics',
  branch: 'metric-picker',
  tier: 1,
  title: l('Три роли метрики', 'The three roles of a metric'),
  blurb: l(
    'Оффлайн — чтобы итерироваться, онлайн — чтобы решать, guardrail — чтобы не сломать.',
    'Offline to iterate, online to decide, guardrails so nothing breaks.',
  ),
  requires: [],
  theory: [
    {
      type: 'p',
      text: l(
        'Вопрос «какую метрику взять» почти всегда задан неправильно, потому что метрик нужно три, и у них разные задачи. Путаница между ними — источник большинства плохих решений: команда итерируется по метрике, по которой нельзя принимать решение, или принимает решение по метрике, которая не умеет ловить вред.',
        'The question "which metric should we take" is almost always posed wrongly, because three metrics are needed and they have different jobs. Confusing them is the source of most bad decisions: a team iterates on a metric that cannot carry a decision, or decides on a metric that cannot catch harm.',
      ),
    },
    {
      type: 'table',
      head: [l('Роль', 'Role'), l('Вопрос, на который отвечает', 'The question it answers'), l('Требования', 'Requirements')],
      rows: [
        [
          l('Оффлайн', 'Offline'),
          l('Стала ли модель лучше, пока мы её обучаем', 'Did the model get better while we are training it'),
          l(
            'Дёшево считается, монотонна по качеству, доступна без выкатки',
            'Cheap to compute, monotone in quality, available without shipping',
          ),
        ],
        [
          l('Онлайн', 'Online'),
          l('Стало ли лучше продукту, можно ли раскатывать', 'Did the product get better, can we ship'),
          l(
            'Одна, выбрана заранее, связана с бизнесом, чувствительна на доступном трафике',
            'One metric, chosen in advance, tied to the business, sensitive at the traffic available',
          ),
        ],
        [
          l('Guardrail', 'Guardrail'),
          l('Не сломали ли мы что-то, чего не искали', 'Did we break something we were not looking for'),
          l(
            'Ловит вред, который основная метрика не видит; несколько штук; ошибка II рода дороже первой',
            'Catches harm the primary metric misses; several of them; a type II error costs more than a type I',
          ),
        ],
      ],
    },
    { type: 'h', text: l('Свойства, по которым метрику проверяют', 'The properties a metric is checked against') },
    {
      type: 'list',
      items: [
        l(
          'Чувствительность. Если на доступном трафике MDE больше ожидаемого эффекта, метрика бесполезна, какой бы правильной она ни была.',
          'Sensitivity. If the MDE at the available traffic exceeds the expected effect, the metric is useless however correct it may be.',
        ),
        l(
          'Направленность. Должно быть однозначно понятно, рост это хорошо или плохо. «Среднее время на сайте» этим свойством не обладает: оно растёт и когда интересно, и когда пользователь не может найти нужное.',
          'Directionality. It must be unambiguous whether up is good. "Average time on site" fails this: it grows both when things are engaging and when the user cannot find what they need.',
        ),
        l(
          'Устойчивость к накрутке. Метрику будут оптимизировать все, включая тех, кто не читал постановку задачи. Если её можно поднять, не улучшив продукт, её поднимут именно так.',
          'Resistance to gaming. Everyone will optimise the metric, including people who never read the problem statement. If it can be raised without improving the product, that is how it will be raised.',
        ),
        l(
          'Знаменатель равен единице рандомизации. Метрика на пользователя при рандомизации по пользователю считается просто и честно; метрика на заказ — уже ratio с подвижным знаменателем.',
          'The denominator equals the randomisation unit. A per-user metric under per-user randomisation is computed simply and honestly; a per-order metric is already a ratio with a moving denominator.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Закон Гудхарта в рабочей формулировке: когда метрика становится целью, она перестаёт быть хорошей метрикой. Практическое следствие — guardrails существуют именно для того, чтобы ловить способы поднять основную метрику, не улучшив продукт.',
        "Goodhart's law in its working form: when a metric becomes a target, it stops being a good metric. The practical consequence is that guardrails exist precisely to catch ways of lifting the primary metric without improving the product.",
      ),
    },
    {
      type: 'p',
      text: l(
        'Полезный приём при выборе — декомпозиция. Выручка на пользователя раскладывается в произведение: доля сделавших заказ × число заказов на покупателя × средний чек. Если эффект ожидается в одном из множителей, по нему и стоит мерить: он чувствительнее, потому что в нём меньше посторонней дисперсии. Решение при этом всё равно принимается по верхнеуровневой метрике — иначе легко улучшить множитель за счёт остальных.',
        'A useful trick when choosing is decomposition. Revenue per user factors into: share who ordered × orders per buyer × average order value. If the effect is expected in one of the factors, that is what to measure: it is more sensitive, because it carries less unrelated variance. The decision is still made on the top-level metric, though — otherwise it is easy to improve one factor at the expense of the others.',
      ),
    },
    {
      type: 'sim',
      sim: 'metric-decomposition',
      title: l('Какой множитель виден на этом трафике', 'Which factor is visible at this traffic'),
      caption: l(
        'Минимальный детектируемый эффект для каждого множителя, посчитанный симуляцией по одной и той же популяции пользователей. Выручка на пользователя проигрывает конверсии в разы: в ней сложены нули непокупателей и тяжёлый хвост чеков. Потяни тяжесть хвоста вверх — разрыв станет ещё заметнее.',
        'The minimum detectable effect for each factor, simulated over one and the same user population. Revenue per user loses to conversion by a factor of several: it stacks the zeros of non-buyers on top of a heavy order-value tail. Drag the tail heaviness up and the gap widens further.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'metric-pick',
      id: 'metric.basics.pick-ads',
      area: l('Реклама: модель вероятности клика', 'Ads: click probability model'),
      scenario: l(
        'В рекламном блоке товарного поиска меняется модель предсказания вероятности клика: она участвует в аукционе, умножаясь на ставку. Новая модель точнее на валидации. Рекламный блок занимает две верхние позиции выдачи. Трафика много. Выбери метрики для итераций, для решения и для контроля.',
        'The click probability model in the ad block of product search is being replaced: it takes part in the auction, multiplied by the bid. The new model is more accurate on validation. The ad block occupies the top two result positions. Traffic is plentiful. Choose metrics for iteration, for the decision and for control.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'logloss',
          label: l('LogLoss и калибровка pCTR на отложенной выборке', 'LogLoss and pCTR calibration on a held-out sample'),
          correctFor: ['offline'],
          note: l(
            'Для аукциона важна не только ранжирующая способность, но и абсолютная калибровка: предсказание умножается на ставку, и систематическое завышение pCTR напрямую искажает порядок объявлений и цену. LogLoss штрафует именно за плохую вероятность, в отличие от AUC.',
            'An auction needs not only ranking ability but absolute calibration: the prediction is multiplied by the bid, and a systematic overestimate of pCTR directly distorts both ad order and price. LogLoss penalises a bad probability, unlike AUC.',
          ),
        },
        {
          id: 'revenue-per-search',
          label: l('Выручка с рекламы на поисковую сессию', 'Ad revenue per search session'),
          correctFor: ['online'],
          note: l(
            'Прямая бизнес-метрика изменения, знаменатель — сессия, то есть единица, по которой идёт рандомизация пользователей. Это и есть то, ради чего меняют модель аукциона.',
            'The direct business metric of the change, with the session as the denominator — the unit users are randomised by. This is what changing the auction model is for.',
          ),
        },
        {
          id: 'organic-ctr',
          label: l('CTR органической выдачи', 'CTR of the organic results'),
          correctFor: ['guardrail'],
          note: l(
            'Классический guardrail для рекламы: рекламную выручку легко поднять, отъев внимание у органики. Если органический CTR падает, краткосрочный рост денег оплачен качеством поиска.',
            'The classic ads guardrail: ad revenue is easy to lift by eating the attention of organic results. If organic CTR falls, the short-term money was paid for with search quality.',
          ),
        },
        {
          id: 'session-abandon',
          label: l('Доля сессий, закончившихся без единого клика', 'Share of sessions ending with no click at all'),
          correctFor: ['guardrail'],
          note: l(
            'Ловит ухудшение пользовательского опыта целиком, а не только в органике: если реклама стала нерелевантной, пользователь уходит ни с чем. Метрика на уровне сессии, то есть сопоставима с единицей рандомизации.',
            'Catches a degradation of the whole experience rather than only the organic part: if the ads became irrelevant, the user leaves with nothing. A session-level metric, so it matches the randomisation unit.',
          ),
        },
        {
          id: 'auc',
          label: l('AUC модели pCTR', 'AUC of the pCTR model'),
          correctFor: [],
          note: l(
            'AUC измеряет только порядок и инвариантен к монотонным преобразованиям вероятности. Модель с идеальным AUC и систематически завышенным pCTR сломает аукцион, а метрика этого не заметит.',
            'AUC measures order only and is invariant to monotone transformations of the probability. A model with perfect AUC and systematically inflated pCTR will break the auction, and the metric will not notice.',
          ),
        },
        {
          id: 'ad-ctr',
          label: l('CTR рекламного блока', 'CTR of the ad block'),
          correctFor: [],
          note: l(
            'Легко поднимается показом более кликабельной, но дешёвой рекламы: кликов больше, денег меньше. Как метрика решения в аукционе опасна, потому что игнорирует ставку.',
            'Easily raised by showing more clickable but cheaper ads: more clicks, less money. Dangerous as an auction decision metric because it ignores the bid.',
          ),
        },
        {
          id: 'impressions',
          label: l('Число показов рекламы', 'Number of ad impressions'),
          correctFor: [],
          note: l(
            'Метрика объёма, а не качества: растёт от увеличения числа рекламных мест и ничего не говорит ни о деньгах, ни о пользе.',
            'A volume metric rather than a quality one: it grows by adding ad slots and says nothing about either money or usefulness.',
          ),
        },
      ],
      writeup: l(
        'Ключевая мысль этого сценария: в аукционе нужна калиброванная вероятность, а не просто хороший порядок. Ставка умножается на pCTR, поэтому систематическое завышение в одной категории объявлений перераспределит показы в её пользу и исказит цены — при отличном AUC. Отсюда LogLoss и прямая проверка калибровки как оффлайн-метрика. Решение принимается по выручке на сессию, потому что именно её меняет аукцион. Guardrails закрывают главный конфликт интересов рекламы: деньги можно получить, отъев внимание у органики, поэтому контролируют органический CTR и долю сессий без клика. AUC, CTR блока и число показов отвергнуты по разным причинам, но с общим сюжетом: каждая из них растёт способами, не улучшающими ни деньги, ни пользу.',
        'The key idea of this scenario: an auction needs a calibrated probability, not merely a good order. The bid is multiplied by pCTR, so a systematic overestimate in one ad category redistributes impressions in its favour and distorts prices — at an excellent AUC. Hence LogLoss and a direct calibration check as the offline metric. The decision rests on revenue per session, because that is what the auction moves. The guardrails cover the central conflict of interest in advertising: money can be taken by eating organic attention, so organic CTR and the share of click-free sessions are watched. AUC, block CTR and impression count are rejected for different reasons but with a common plot: each can rise in ways that improve neither money nor usefulness.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'metric.basics.pick-query-classification',
      area: l('Классификация запросов по категориям', 'Query classification into categories'),
      scenario: l(
        'Классификатор определяет категорию товара по тексту запроса; результат используется для фильтрации выдачи. Категорий несколько сотен, распределение частот крайне неравномерное: на десять категорий приходится 80% запросов. Ошибка классификации означает, что пользователю показали не тот раздел. Выбери метрики.',
        'A classifier determines the product category from the query text; the result is used to filter the results page. There are several hundred categories with a highly skewed frequency distribution: ten categories account for 80% of queries. A misclassification means the user was shown the wrong section. Choose the metrics.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'macro-f1',
          label: l('Macro F1 по категориям', 'Macro F1 across categories'),
          correctFor: ['offline'],
          note: l(
            'Усреднение по категориям без учёта их размера: каждая категория весит одинаково, поэтому метрика видит провал на редких разделах. Именно это нужно при длинном хвосте категорий.',
            'Averaging across categories regardless of size: every category weighs the same, so the metric sees failures in rare sections. That is what a long tail of categories calls for.',
          ),
        },
        {
          id: 'session-success',
          label: l('Доля сессий с кликом или заказом', 'Share of sessions with a click or an order'),
          correctFor: ['online'],
          note: l(
            'Классификация — промежуточный шаг, пользователь её не видит. Решение принимается по тому, стало ли проще находить товар, и это метрика на уровне сессии.',
            'Classification is an intermediate step the user never sees. The decision rests on whether finding a product got easier, and that is a session-level metric.',
          ),
        },
        {
          id: 'tail-accuracy',
          label: l('Accuracy на редких категориях отдельно', 'Accuracy on rare categories separately'),
          correctFor: ['guardrail'],
          note: l(
            'Защита от того, что модель улучшит частотные категории за счёт хвоста. Общее качество при этом вырастет, а пользователи редких разделов получат заметно хуже.',
            'Protection against the model improving head categories at the expense of the tail. Overall quality rises while users of rare sections get noticeably worse results.',
          ),
        },
        {
          id: 'empty-results',
          label: l('Доля запросов с пустой выдачей', 'Share of queries returning nothing'),
          correctFor: ['guardrail'],
          note: l(
            'Прямое следствие ошибки классификации: отфильтровали не по той категории — и товаров не осталось. Метрика ловит самый заметный для пользователя вред.',
            'A direct consequence of a misclassification: filter by the wrong category and no items remain. The metric catches the harm most visible to the user.',
          ),
        },
        {
          id: 'accuracy',
          label: l('Общая accuracy', 'Overall accuracy'),
          correctFor: [],
          note: l(
            'При таком перекосе частот accuracy почти целиком определяется десятью крупными категориями. Модель, которая вообще не умеет редкие разделы, получит высокую оценку.',
            'With frequencies this skewed, accuracy is almost entirely determined by the ten large categories. A model that cannot handle rare sections at all still scores high.',
          ),
        },
        {
          id: 'micro-f1',
          label: l('Micro F1', 'Micro F1'),
          correctFor: [],
          note: l(
            'Взвешивает по числу примеров, поэтому в многоклассовой задаче с одной меткой совпадает с accuracy и наследует ту же слепоту к хвосту. Полезен, когда важен именно суммарный поток запросов, но здесь нужен macro.',
            'Weights by the number of examples, so in a single-label multiclass task it equals accuracy and inherits the same blindness to the tail. Useful when the aggregate query flow is what matters, but here macro is what is needed.',
          ),
        },
        {
          id: 'inference-time',
          label: l('Время инференса классификатора', 'Classifier inference time'),
          correctFor: ['guardrail'],
          note: l(
            'Допустимый guardrail: классификатор стоит на горячем пути запроса, и его замедление ударит по всему поиску. Но как основная защита он слабее метрик качества на хвосте.',
            'A legitimate guardrail: the classifier sits on the hot path of a query, and slowing it down hits all of search. As the main protection, though, it is weaker than tail quality metrics.',
          ),
        },
      ],
      writeup: l(
        'Главная развилка сценария — macro против micro. При распределении, где десять категорий дают 80% трафика, micro F1 и accuracy описывают качество на этих десяти категориях и почти не меняются, что бы ни происходило с остальными тремястами. Macro F1 даёт каждой категории равный вес и поэтому видит хвост. Это не означает, что macro всегда лучше: если цель — максимум корректно обработанных запросов, честнее micro. Здесь же цена ошибки для пользователя одинакова независимо от частоты категории, поэтому macro. Второй момент: классификатор — промежуточный компонент, и решение принимается не по его качеству, а по пользовательскому результату. Третий: guardrails выбраны так, чтобы поймать два разных способа навредить — деградацию на хвосте и пустую выдачу от неверной фильтрации.',
        'The central fork of this scenario is macro versus micro. With a distribution where ten categories carry 80% of traffic, micro F1 and accuracy describe the quality on those ten and barely move whatever happens to the other three hundred. Macro F1 gives each category equal weight and therefore sees the tail. That does not make macro always better: if the goal is the maximum number of correctly handled queries, micro is the honest choice. Here the cost of an error to the user is the same regardless of category frequency, so macro it is. Second point: the classifier is an intermediate component, and the decision rests not on its quality but on the user-visible outcome. Third: the guardrails are chosen to catch two different ways of doing harm — tail degradation and empty results from wrong filtering.',
      ),
    },
    {
      kind: 'metric-pick',
      id: 'metric.basics.pick-recsys',
      area: l('Рекомендации на главной странице', 'Recommendations on the home page'),
      scenario: l(
        'Блок «вам может понравиться» на главной странице маркетплейса. Сейчас там топ продаж, предлагается заменить на персональные рекомендации. Блок видят все пользователи, включая новых. Нужно выбрать метрики для обучения модели, для решения о раскатке и для контроля.',
        'A "you might like" block on the home page of a marketplace. It currently shows best sellers, and the proposal is to replace it with personal recommendations. Every user sees the block, new ones included. Choose metrics for training the model, for the rollout decision and for control.',
      ),
      guardrailCount: 2,
      options: [
        {
          id: 'recall-at-k',
          label: l('recall@20 по будущим покупкам на отложенном периоде', 'recall@20 against future purchases on a held-out period'),
          correctFor: ['offline'],
          note: l(
            'Правильная оффлайн-постановка для рекомендаций: обучаемся на прошлом, проверяем, попали ли в то, что пользователь реально купил потом. Разделение по времени, а не случайное, иначе получится утечка из будущего.',
            'The right offline setup for recommendations: train on the past and check whether what the user actually bought later was hit. The split is by time rather than random, otherwise the future leaks in.',
          ),
        },
        {
          id: 'orders-per-user',
          label: l('Заказы на пользователя', 'Orders per user'),
          correctFor: ['online'],
          note: l(
            'Метрика на уровне пользователя, совпадает с единицей рандомизации, связана с деньгами и не ломается от изменения числа сессий. Для блока на главной — разумная метрика решения.',
            'A user-level metric matching the randomisation unit, tied to money and robust to changes in session counts. A sensible decision metric for a home page block.',
          ),
        },
        {
          id: 'catalog-coverage',
          label: l('Доля каталога, попадающая в рекомендации', 'Share of the catalogue appearing in recommendations'),
          correctFor: ['guardrail'],
          note: l(
            'Рекомендательные системы схлопываются на популярном: модель учится на кликах, популярное получает больше кликов, круг замыкается. Покрытие каталога ловит это схлопывание, которого метрики точности не видят.',
            'Recommenders collapse onto the popular: the model learns from clicks, popular items get more clicks, the loop closes. Catalogue coverage catches that collapse, which accuracy metrics cannot see.',
          ),
        },
        {
          id: 'new-user-ctr',
          label: l('Метрики на новых пользователях отдельно', 'Metrics on new users separately'),
          correctFor: ['guardrail'],
          note: l(
            'У новых пользователей нет истории, и персонализация для них вырождается. Блок видят все, поэтому деградация на холодном старте — реальный риск, скрытый в среднем по всем.',
            'New users have no history and personalisation degenerates for them. Everyone sees the block, so cold-start degradation is a real risk hidden inside the overall average.',
          ),
        },
        {
          id: 'block-ctr',
          label: l('CTR самого блока рекомендаций', 'CTR of the recommendation block itself'),
          correctFor: [],
          note: l(
            'Самая соблазнительная и самая обманчивая метрика: её легко поднять, рекомендуя то, что пользователь и так собирался купить, или просто самое кликабельное. Рост CTR блока совместим с нулевым приростом заказов.',
            'The most tempting and most deceptive metric: easy to lift by recommending what the user was going to buy anyway, or simply the most clickable thing. A rise in block CTR is compatible with zero additional orders.',
          ),
        },
        {
          id: 'time-on-site',
          label: l('Среднее время на сайте', 'Average time on site'),
          correctFor: [],
          note: l(
            'Метрика без направления: растёт и когда интересно, и когда пользователь не может найти нужное. Для рекомендаций особенно плоха, потому что бесконечная лента увеличивает её независимо от пользы.',
            'A metric with no direction: it grows both when things are engaging and when the user cannot find what they need. Especially poor for recommendations, since an endless feed raises it regardless of usefulness.',
          ),
        },
        {
          id: 'rmse',
          label: l('RMSE предсказания рейтинга', 'RMSE of rating prediction'),
          correctFor: [],
          note: l(
            'Историческая метрика рекомендательных систем из эпохи предсказания оценок. Для задачи «что показать в блоке из двадцати мест» она почти не информативна: важен топ, а не точность предсказания по всему каталогу.',
            'A historical recommender metric from the rating-prediction era. For "what to show in a block of twenty slots" it is nearly uninformative: the top is what matters, not prediction accuracy across the whole catalogue.',
          ),
        },
      ],
      writeup: l(
        'Сценарий про три характерные ошибки в рекомендациях. Первая — оценивать оффлайн со случайным разбиением: в рекомендациях это утечка из будущего, разбивать надо по времени. Вторая — брать CTR блока как метрику решения. Персональные рекомендации почти всегда поднимают CTR блока, потому что показывают знакомое и уже просмотренное; вопрос в том, появились ли от этого новые заказы, а не переехали ли клики из других блоков. Третья — не следить за схлопыванием на популярное: система, обученная на собственных показах, быстро начинает рекомендовать одно и то же, точность при этом не падает, а каталог перестаёт продаваться. Поэтому покрытие каталога и метрики на новых пользователях — обязательные guardrails. RMSE и время на сайте отвергнуты как метрики не про ту задачу: первая про предсказание оценок, вторая не имеет направления.',
        'This scenario covers three characteristic mistakes in recommendations. First, evaluating offline with a random split: in recommendations that leaks the future, and the split must be by time. Second, taking block CTR as the decision metric. Personal recommendations almost always lift block CTR because they show familiar, already-viewed items; the question is whether new orders appeared or clicks merely migrated from other blocks. Third, not watching for collapse onto the popular: a system trained on its own impressions quickly starts recommending the same things, accuracy holds up, and the catalogue stops selling. Hence catalogue coverage and new-user metrics as mandatory guardrails. RMSE and time on site are rejected as metrics for a different problem: the first predicts ratings, the second has no direction.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про выбор метрик и guardrails.', 'The chapters on metric choice and guardrails.'),
    },
    {
      title: "Goodhart's law",
      url: 'https://en.wikipedia.org/wiki/Goodhart%27s_law',
    },
  ],
};
