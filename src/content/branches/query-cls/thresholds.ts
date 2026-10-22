import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const qclsThresholds: SkillNode = {
  id: 'qcls.thresholds',
  branch: 'query-cls',
  act: 4,
  tier: 3,
  title: l('Пороги, отказы и длинный хвост', 'Thresholds, abstentions and the long tail'),
  blurb: l(
    'Право не отвечать и что делать с категориями, которых почти нет.',
    'The right to decline, and what to do with categories that barely exist.',
  ),
  requires: ['qcls.multiclass'],
  theory: [
    {
      type: 'p',
      text: l(
        'Классификатор запросов редко обязан отвечать всегда. Если модель не уверена, фильтр по категории можно просто не применять и показать общую выдачу — пользователь этого даже не заметит. Это превращает задачу «максимизировать accuracy» в более честную «обеспечить нужную точность при максимальном покрытии».',
        'A query classifier is rarely obliged to answer every time. When the model is unsure, the category filter can simply be skipped and general results shown — the user will not even notice. That turns "maximise accuracy" into the more honest "deliver the required precision at the maximum coverage".',
      ),
    },
    {
      type: 'sim',
      sim: 'threshold-coverage',
      title: l('Точность против покрытия', 'Precision versus coverage'),
      caption: l(
        'Двигай порог и смотри на кривую. Отказываясь отвечать на неуверенных запросах, точность на остальных можно поднять почти до единицы, но покрытие падает. Порог выбирают не там, где максимален F1, а там, где достигнута требуемая точность — и смотрят, какое покрытие при этом остаётся. Если оно неприемлемо мало, значит, улучшать надо модель, а не порог.',
        'Move the threshold and watch the curve. Declining to answer on uncertain queries pushes precision on the rest almost to one, but coverage falls. The threshold is not chosen where F1 peaks but where the required precision is reached — and then you look at what coverage remains. If it is unacceptably low, the model needs improving rather than the threshold.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Порог — это продуктовое решение, а не гиперпараметр модели. Сначала выясняется цена ошибки: во сколько обходится показ не той категории против показа общей выдачи. Потом выбирается точка на кривой. Выбирать порог по максимуму F1 — значит молча объявить, что ложное срабатывание и пропуск стоят одинаково, а это почти никогда не так.',
        'The threshold is a product decision rather than a model hyperparameter. First establish the cost of an error: how much showing the wrong category costs against showing general results. Then pick a point on the curve. Choosing the threshold by maximum F1 silently declares that a false firing and a miss cost the same, which they almost never do.',
      ),
    },
    { type: 'h', text: l('Иерархия категорий', 'The category hierarchy') },
    {
      type: 'p',
      text: l(
        'В товарном каталоге категории образуют дерево, и это даёт изящный выход из ситуации с неуверенностью: вместо отказа можно ответить родительской категорией. Модель не уверена между «кроссовки для бега» и «кроссовки повседневные», но уверена, что это «обувь» — и фильтр по обуви уже полезен, хотя и слабее.',
        'In a product catalogue the categories form a tree, which offers an elegant way out of uncertainty: instead of declining, answer with the parent category. The model is unsure between "running shoes" and "casual sneakers" but confident it is "footwear" — and a footwear filter is already useful, if weaker.',
      ),
    },
    {
      type: 'list',
      items: [
        l(
          'Подъём по дереву до уровня, где суммарная уверенность превышает порог. Простая и эффективная стратегия: сумма вероятностей потомков даёт вероятность родителя.',
          'Climbing the tree to the level where the summed confidence passes the threshold. A simple and effective strategy: the probabilities of the children sum to the probability of the parent.',
        ),
        l(
          'Отдельные пороги для разных уровней: ошибиться веткой дерева дороже, чем ошибиться листом внутри правильной ветки.',
          'Separate thresholds per level: picking the wrong branch of the tree costs more than picking the wrong leaf inside the right branch.',
        ),
        l(
          'Иерархическая метрика качества, где ошибка между соседними листьями штрафуется слабее, чем ошибка между корневыми ветками. Обычная accuracy считает обе ошибки одинаковыми, хотя для пользователя они совершенно разные.',
          'A hierarchical quality metric where an error between adjacent leaves is penalised less than one between root branches. Plain accuracy treats both equally, although to the user they are nothing alike.',
        ),
      ],
    },
    { type: 'h', text: l('Длинный хвост', 'The long tail') },
    {
      type: 'p',
      text: l(
        'В каталоге из тысяч категорий большая часть получает единицы запросов в день, и обучающих примеров для них почти нет. Статистическая модель здесь бессильна по определению: из пяти примеров нельзя выучить категорию. Рабочие подходы другие — правила и словари для редких категорий, перенос знания от родителя, zero-shot сопоставление названия категории и запроса по эмбеддингам, и, главное, честное признание, что часть хвоста не будет закрыта.',
        'In a catalogue of thousands of categories, most receive a handful of queries a day and have almost no training examples. A statistical model is powerless here by definition: five examples cannot teach a category. The working approaches are different — rules and dictionaries for rare categories, knowledge transfer from the parent, zero-shot matching of the category name against the query by embeddings, and, above all, an honest admission that part of the tail will not be covered.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Главное решение про хвост — не техническое, а приоритизационное: посчитать, какая доля трафика приходится на категории, которые модель не умеет, и сравнить с ценой работы над ними. Часто оказывается, что тысяча худших категорий — это полпроцента запросов, и усилия окупятся хуже, чем улучшение топ-20. Но считать это надо явно, а не по ощущениям.',
        'The main decision about the tail is not technical but one of prioritisation: compute what share of traffic belongs to categories the model cannot handle and compare it with the cost of working on them. Often it turns out the worst thousand categories are half a percent of queries, and the effort pays off worse than improving the top 20. But that has to be computed explicitly rather than felt.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'qcls.thresholds.q-threshold',
      mode: 'single',
      prompt: l(
        'Как выбрать порог уверенности для классификатора категории, если ошибка означает показ не того раздела каталога?',
        'How should the confidence threshold be chosen for a category classifier, when an error means showing the wrong catalogue section?',
      ),
      choices: [
        { id: 'a', text: l('По максимуму F1 на валидации', 'By the maximum F1 on validation') },
        {
          id: 'b',
          text: l(
            'По требуемой точности: выяснить цену ошибки, задать минимально приемлемую precision и взять максимальное покрытие при ней',
            'By the required precision: establish the cost of an error, set a minimum acceptable precision and take the maximum coverage at it',
          ),
        },
        { id: 'c', text: l('Всегда 0.5', 'Always 0.5') },
        { id: 'd', text: l('По максимуму accuracy', 'By the maximum accuracy') },
      ],
      correct: ['b'],
      explanation: l(
        'Максимум F1 — это неявное утверждение, что ложное срабатывание и пропуск равноценны. Здесь это не так: показать не тот раздел хуже, чем не применить фильтр вовсе, потому что во втором случае пользователь просто видит обычную выдачу, а в первом — чужие товары. Порог 0.5 вообще ни из чего не следует: это значение осмысленно только для сбалансированной бинарной задачи с равной ценой ошибок. Правильный порядок — цена ошибки, требуемая точность, максимальное покрытие при ней.',
        'Maximum F1 is an implicit claim that a false firing and a miss are equivalent. Here they are not: showing the wrong section is worse than applying no filter, because in the second case the user simply sees the usual results while in the first they see someone else\'s products. A threshold of 0.5 follows from nothing at all: that value is only meaningful for a balanced binary problem with equal error costs. The right order is cost of error, required precision, maximum coverage at it.',
      ),
    },
    {
      kind: 'quiz',
      id: 'qcls.thresholds.q-hierarchy',
      mode: 'multi',
      prompt: l(
        'Модель не может выбрать между двумя соседними листьями одной ветки дерева категорий. Что разумно сделать?',
        'The model cannot choose between two adjacent leaves of the same branch of the category tree. What are sensible options?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Подняться к родительской категории и применить фильтр по ней', 'Climb to the parent category and filter by that'),
        },
        {
          id: 'b',
          text: l('Не применять фильтр вовсе и показать общую выдачу', 'Apply no filter at all and show general results'),
        },
        {
          id: 'c',
          text: l('Выбрать более частотный из двух листьев', 'Pick the more frequent of the two leaves'),
        },
        {
          id: 'd',
          text: l(
            'Учитывать при оценке качества, что ошибка между соседними листьями дешевле ошибки между ветками',
            'Account in the quality metric for an error between adjacent leaves costing less than one between branches',
          ),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Подъём к родителю — самый полезный приём: фильтр по «обуви» слабее фильтра по «кроссовкам для бега», но заметно лучше отсутствия фильтра. Отказ тоже допустим и всегда безопасен. Выбор более частотного листа — плохая идея: он систематически смещает выдачу в пользу популярного и закрепляет перекос, а пользователю редкого запроса достаётся стабильно неверный раздел. Иерархическая метрика нужна, чтобы такие решения вообще можно было сравнивать: при обычной accuracy подъём к родителю засчитывается как ошибка наравне с попаданием в чужую ветку.',
        'Climbing to the parent is the most useful device: a "footwear" filter is weaker than a "running shoes" one but noticeably better than none. Declining is acceptable too and always safe. Picking the more frequent leaf is a bad idea: it systematically biases results towards the popular option and entrenches the skew, while the user with a rare query consistently gets the wrong section. A hierarchical metric is needed to make such decisions comparable at all: under plain accuracy, climbing to the parent counts as an error on a par with landing in a foreign branch.',
      ),
    },
    {
      kind: 'quiz',
      id: 'qcls.thresholds.q-tail',
      mode: 'single',
      prompt: l(
        'В каталоге 4000 категорий, модель приемлемо работает на 600 из них. Что сделать в первую очередь?',
        'The catalogue has 4000 categories and the model works acceptably on 600 of them. What comes first?',
      ),
      choices: [
        { id: 'a', text: l('Собрать разметку на все 4000 категорий', 'Collect labels for all 4000 categories') },
        {
          id: 'b',
          text: l(
            'Посчитать, какая доля трафика приходится на оставшиеся 3400, и уже по ней решать, сколько в это вкладываться',
            'Compute what share of traffic the remaining 3400 carry and decide from that how much to invest',
          ),
        },
        { id: 'c', text: l('Увеличить модель', 'Make the model bigger') },
        { id: 'd', text: l('Объединить все редкие категории в одну', 'Merge every rare category into one') },
      ],
      correct: ['b'],
      explanation: l(
        'Число категорий само по себе ничего не говорит о приоритете: 3400 категорий могут давать как 40% трафика, так и половину процента, и это два совершенно разных проекта. Считать надо долю трафика и долю денег, а потом сравнивать с ценой разметки и поддержки. Часто разумным ответом оказывается сочетание: топ-100 из хвоста закрыть правилами или словарями, остальное оставить на общую выдачу и зафиксировать в документации как сознательное решение. Вариант d может быть частью решения, но как первый шаг он уничтожает информацию, которую ещё не измерили.',
        'The number of categories says nothing about priority on its own: those 3400 may carry 40% of traffic or half a percent, and those are two entirely different projects. Compute the share of traffic and the share of money, then compare with the cost of labelling and maintenance. The sensible answer is often a combination: cover the top 100 of the tail with rules or dictionaries, leave the rest to general results, and record that in the documentation as a deliberate decision. Option d may be part of a solution, but as a first step it destroys information that has not been measured yet.',
      ),
    },
  ],

  sources: [
    {
      title: 'scikit-learn: model evaluation',
      url: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
    },
  ],
};
