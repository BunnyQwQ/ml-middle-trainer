import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abReview: SkillNode = {
  id: 'ab.review',
  branch: 'ab',
  tier: 8,
  title: l('Разбор экспериментов', 'Reading experiment reports'),
  blurb: l(
    'Отчёт с подвохом: найти проблему и решить, что делать.',
    'A report with a catch: find the problem and decide what to do.',
  ),
  requires: ['ab.cuped'],
  theory: [
    {
      type: 'p',
      text: l(
        'На работе тебе будут приносить готовые отчёты, а не сырые данные. Навык, который отличает мидла от джуна, — не посчитать p-value, а посмотреть на чужой отчёт и за пару минут понять, можно ли на его основании принимать решение. Порядок проверки стоит выучить как чек-лист и идти по нему всегда в одном и том же порядке, потому что первые два пункта обесценивают все остальные.',
        'At work you will be handed finished reports rather than raw data. The skill that separates a middle engineer from a junior is not computing a p-value but looking at someone else\'s report and deciding within a couple of minutes whether it can support a decision. The order of checks is worth learning as a checklist and always walking in the same sequence, because the first two items invalidate everything below them.',
      ),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'SRM. Совпадает ли фактическое соотношение групп с плановым. Если нет — дальше можно не смотреть.',
          'SRM. Does the actual group ratio match the planned one. If not, there is no point reading further.',
        ),
        l(
          'Единица рандомизации и единица анализа. По чему делили трафик и по чему считали значимость.',
          'Randomisation unit and analysis unit. What the traffic was split by and what significance was computed over.',
        ),
        l(
          'Определение метрики. Что в числителе, что в знаменателе, и не изменился ли знаменатель сам под воздействием.',
          'Metric definition. What is in the numerator, what is in the denominator, and whether the denominator itself moved under the treatment.',
        ),
        l(
          'Правило остановки. Был ли срок зафиксирован заранее или эксперимент остановили, когда стало значимо.',
          'Stopping rule. Was the horizon fixed in advance, or was the experiment stopped once it turned significant.',
        ),
        l(
          'Горизонт и динамика. Полные недели, есть ли затухание эффекта во времени.',
          'Horizon and dynamics. Whole weeks, and whether the effect decays over time.',
        ),
        l(
          'Сколько всего проверок. Одна основная метрика или двадцать метрик и десять сегментов.',
          'How many tests in total. One primary metric, or twenty metrics and ten segments.',
        ),
        l(
          'Практическая значимость. Доверительный интервал в единицах бизнеса, а не только знак эффекта.',
          'Practical significance. The confidence interval in business units, not just the sign of the effect.',
        ),
      ],
    },
    {
      type: 'sim',
      sim: 'novelty-effect',
      title: l('Эффект новизны', 'The novelty effect'),
      caption: l(
        'Красная линия — эффект в этот конкретный день, пунктир — накопительная оценка, которую показывает дашборд. Поставь настоящий эффект в ноль и подними новизну: накопительная оценка остаётся положительной неделями, хотя ничего не изменилось. Отсюда правило: при подозрении на новизну смотрят эффект по последней неделе, а не накопленный.',
        'The red line is the effect on that specific day, the dashed one the cumulative estimate shown on the dashboard. Set the true effect to zero and raise the novelty: the cumulative estimate stays positive for weeks even though nothing changed. Hence the rule: when novelty is suspected, read the effect over the last week rather than the accumulated one.',
      ),
    },
    {
      type: 'sim',
      sim: 'weekday-seasonality',
      title: l('Неполные недели', 'Partial weeks'),
      caption: l(
        'Конверсия по дням недели с провалом на выходных. Подвигай день старта при длительности 5 дней: среднее за окно скачет. При длительности 7 или 14 смещение исчезает при любом старте. Важная тонкость: на разницу между группами A/B это почти не влияет — обе группы видят одни и те же дни. Смещается сравнение с предпериодом и репрезентативность эффекта.',
        'Conversion by weekday with a weekend dip. Move the start day at a five-day duration: the window average jumps around. At seven or fourteen days the bias vanishes for any start. One subtlety matters: this barely affects the difference between A/B groups — both see the same days. What it biases is the comparison with a pre-period and the representativeness of the effect.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Самая коварная категория ошибок — изменившийся знаменатель. «Средняя выручка на заказ выросла на 4%» звучит как успех, но если число заказов при этом упало на 7%, суммарная выручка снизилась. Любая ratio-метрика требует проверки обеих частей по отдельности, иначе легко отчитаться о росте, которого нет.',
        'The sneakiest class of error is a denominator that moved. "Average revenue per order is up 4%" sounds like a success, but if the number of orders fell 7% at the same time, total revenue went down. Any ratio metric requires checking both parts separately, otherwise it is easy to report a rise that never happened.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'case',
      id: 'ab.review.case-full-report',
      prompt: l(
        'Тебе принесли отчёт. «Эксперимент: новая формула ранжирования товарной выдачи. Период: с четверга по понедельник, 5 дней. Рандомизация по пользователю. Контроль 1 240 118 пользователей, тест 1 251 902. Основная метрика CTR выдачи (клики / показы) выросла на +2.1%, p = 0.004. Средняя выручка на заказ +3.4%, p = 0.03. Число заказов на пользователя -1.2%, p = 0.21. Доля запросов без клика -0.4%, p = 0.4. Эксперимент остановлен досрочно: планировали две недели, но на пятый день основная метрика стала значимой. На iOS эффект +5.8%, предлагаем раскатить сначала там. Рекомендация: раскатывать на 100%.» Разбери отчёт: какие проблемы ты видишь, в каком порядке их проверял бы и какое решение предложишь. Пиши развёрнуто, как если бы отвечал на ревью эксперимента.',
        'You are handed a report. "Experiment: a new ranking formula for product search. Period: Thursday to Monday, 5 days. Randomisation by user. Control 1,240,118 users, test 1,251,902. Primary metric, result-page CTR (clicks / impressions), up +2.1%, p = 0.004. Average revenue per order +3.4%, p = 0.03. Orders per user -1.2%, p = 0.21. Share of queries with no click -0.4%, p = 0.4. The experiment was stopped early: two weeks were planned, but on day five the primary metric turned significant. On iOS the effect is +5.8%, we propose shipping there first. Recommendation: ship to 100%." Review the report: what problems do you see, in what order would you check them, and what decision would you propose. Write it out in full, as if answering at an experiment review.',
      ),
      reference: l(
        'Разбор по порядку чек-листа. Первое и решающее: SRM. Ожидали 50/50 от 2 492 020 пользователей, то есть по 1 246 010, наблюдаем расхождение в 11 784 пользователя. Хи-квадрат даёт примерно (5892)²/1246010 × 2 ≈ 55.7, p-value порядка 1e-13. Это не случайность, а баг: типичные причины — фильтрация ботов, применённая только к одной группе, потеря части событий при джойне, разное время включения групп, падение клиента в одной из версий. При SRM отчёт не интерпретируется вообще, ни одна строка. Это уже достаточное основание не раскатывать. Второе: единица анализа. Рандомизация по пользователю, а основная метрика — отношение кликов к показам, посчитанное по всем показам. Если значимость считалась обычной формулой для двух пропорций, p = 0.004 занижено в несколько раз; нужен дельта-метод или бутстрап по пользователям. Третье: правило остановки. Эксперимент планировался на две недели и остановлен на пятый день, как только метрика стала значимой, — это подглядывание, фактический уровень ошибки заметно выше 5%. Четвёртое: подозрительная комбинация метрик. CTR вырос, число заказов на пользователя упало на 1.2%, а средняя выручка на заказ выросла на 3.4%. Рост выручки на заказ при падении числа заказов — классический признак изменившегося знаменателя: похоже, отвалились мелкие заказы, а не выросли крупные. Суммарная выручка на пользователя в отчёте не приведена вовсе, хотя именно она и есть бизнес-результат; её надо посчитать и смотреть на неё. Падение заказов незначимо, но p = 0.21 при пяти днях скорее означает недостаток мощности, чем отсутствие эффекта — нужен доверительный интервал. Пятое: срок. Пять дней с четверга по понедельник — неполная неделя с перекосом в выходные. На разницу между группами это влияет слабо, обе группы видят одни и те же дни, но эффект измерен на нерепрезентативной смеси дней, и переносить его на неделю нельзя. Плюс пять дней почти наверняка захватывают эффект новизны: изменение выдачи в первые дни даёт завышенный CTR. Шестое: сегмент iOS. Предложение раскатить по сегменту, выбранному после просмотра результатов, — множественное сравнение; это гипотеза для отдельного эксперимента, а не вывод. Решение: не раскатывать. Сначала найти и починить причину SRM, затем перезапустить эксперимент на две полные недели с заранее зафиксированной основной метрикой, посчитанной корректным способом, с выручкой на пользователя в guardrails и с планом анализа, запрещающим досрочную остановку.',
        'A walk through the checklist. First and decisive: SRM. We expected 50/50 of 2,492,020 users, i.e. 1,246,010 each, and observe a gap of 11,784 users. Chi-square gives roughly (5892)²/1246010 × 2 ≈ 55.7, a p-value around 1e-13. That is not chance but a bug: typical causes are bot filtering applied to one group only, events lost in a join, groups enabled at different times, or a client crash in one version. Under SRM the report is not interpreted at all, not a single line. That alone is sufficient grounds not to ship. Second: the analysis unit. Randomisation is by user while the primary metric is clicks over impressions summed across all impressions. If significance was computed with the ordinary two-proportion formula, p = 0.004 is several times too small; the delta method or a bootstrap over users is required. Third: the stopping rule. Two weeks were planned and the experiment was stopped on day five as soon as the metric turned significant — that is peeking, and the actual error level is well above 5%. Fourth: a suspicious combination of metrics. CTR is up, orders per user are down 1.2%, and average revenue per order is up 3.4%. Revenue per order rising while order count falls is the classic signature of a shifted denominator: it looks like small orders dropped out rather than large ones appearing. Total revenue per user is not in the report at all, although that is the business result; it has to be computed and read. The drop in orders is not significant, but p = 0.21 over five days more likely means a lack of power than an absence of effect — a confidence interval is needed. Fifth: the horizon. Five days from Thursday to Monday is a partial week skewed towards the weekend. This barely affects the difference between groups, since both see the same days, but the effect is measured on an unrepresentative mix of days and cannot be extrapolated to a week. On top of that, five days almost certainly capture the novelty effect: a changed result page inflates CTR in the first days. Sixth: the iOS segment. Proposing to ship to a segment chosen after seeing the results is a multiple comparison; that is a hypothesis for a separate experiment, not a conclusion. Decision: do not ship. First find and fix the cause of the SRM, then rerun the experiment for two full weeks with a pre-registered primary metric computed correctly, revenue per user among the guardrails, and an analysis plan that forbids early stopping.',
      ),
      checklist: [
        l('Заметил SRM и посчитал, насколько он велик', 'Spotted the SRM and quantified how large it is'),
        l('Сказал, что при SRM остальные строки отчёта не интерпретируются', 'Said that under SRM the rest of the report is not interpreted'),
        l(
          'Указал на несовпадение единицы рандомизации и единицы анализа у основной метрики',
          'Pointed out the mismatch between randomisation unit and analysis unit for the primary metric',
        ),
        l('Назвал досрочную остановку подглядыванием', 'Called the early stop what it is: peeking'),
        l(
          'Разобрал комбинацию «выручка на заказ вверх, заказы вниз» как проблему знаменателя',
          'Analysed "revenue per order up, orders down" as a denominator problem',
        ),
        l('Заметил, что выручки на пользователя в отчёте нет', 'Noticed that revenue per user is missing from the report'),
        l('Упомянул неполную неделю и эффект новизны', 'Mentioned the partial week and the novelty effect'),
        l('Отказался раскатывать по сегменту, выбранному после просмотра', 'Refused to ship to a segment chosen after the fact'),
        l('Сформулировал конкретное решение и план перезапуска', 'Stated a concrete decision and a restart plan'),
      ],
    },
    {
      kind: 'quiz',
      id: 'ab.review.q-srm-first',
      mode: 'single',
      prompt: l(
        'Отчёт: контроль 500 000 пользователей, тест 503 400. Основная метрика выросла значимо, guardrails в норме. С чего начать разбор?',
        'A report: control 500,000 users, test 503,400. The primary metric is significantly up and the guardrails look fine. Where does the review start?',
      ),
      choices: [
        { id: 'a', text: l('С проверки значимости основной метрики', 'With checking the significance of the primary metric') },
        {
          id: 'b',
          text: l(
            'С SRM: расхождение 3400 при ожидаемых 501 700 на группу даёт p-value около 1e-6, и дальше смотреть нельзя',
            'With SRM: a gap of 3400 against an expected 501,700 per group gives a p-value around 1e-6, and nothing below should be read',
          ),
        },
        { id: 'c', text: l('С проверки guardrail-метрик', 'With the guardrail metrics') },
        { id: 'd', text: l('С разбивки по сегментам', 'With the segment breakdown') },
      ],
      correct: ['b'],
      explanation: l(
        'Хи-квадрат: ожидаем по 501 700, отклонение 1700 в каждую сторону, chi² = 1700²/501700 × 2 ≈ 11.5, p ≈ 7e-4. При пороге 0.001 это SRM. Проверка идёт первой именно потому, что при неслучайном сплите все остальные числа посчитаны по несопоставимым группам, и их значения ничего не говорят об эффекте. Guardrails «в норме» в такой ситуации тоже ничего не гарантируют.',
        'Chi-square: expected 501,700 each, a deviation of 1700 either way, chi² = 1700²/501700 × 2 ≈ 11.5, p ≈ 7e-4. At a 0.001 threshold that is SRM. This check comes first precisely because under a non-random split every other number was computed over incomparable groups and says nothing about the effect. Guardrails "looking fine" guarantee nothing in that situation either.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.review.q-novelty',
      mode: 'single',
      prompt: l(
        'Эффект по дням: +7.2%, +5.1%, +3.4%, +2.2%, +1.4%, +0.9%, +0.6%. Накопительная оценка за неделю +3.0%, значимо. Что это и что делать?',
        'The effect by day: +7.2%, +5.1%, +3.4%, +2.2%, +1.4%, +0.9%, +0.6%. The cumulative weekly estimate is +3.0% and significant. What is this and what should be done?',
      ),
      choices: [
        { id: 'a', text: l('Эффект +3.0%, можно раскатывать', 'The effect is +3.0%, ship it') },
        {
          id: 'b',
          text: l(
            'Похоже на эффект новизны: продлить эксперимент и оценивать по последним дням, когда кривая выйдет на плато',
            'This looks like a novelty effect: extend the experiment and read it over the last days, once the curve plateaus',
          ),
        },
        { id: 'c', text: l('Эксперимент сломан, перезапустить', 'The experiment is broken, restart it') },
        { id: 'd', text: l('Взять максимум по дням как истинный эффект', 'Take the daily maximum as the true effect') },
      ],
      correct: ['b'],
      explanation: l(
        'Монотонное затухание от +7.2% к +0.6% — характерная картина новизны: пользователи реагируют на изменение само по себе, а не на его пользу. Накопленные +3.0% — это смесь большого эффекта первых дней и почти нулевого эффекта последних, и к долгосрочному результату она отношения не имеет. Экстраполировать надо плато, а не среднее. Отдельно стоит проверить зеркальный сценарий — эффект обучения, когда метрика наоборот растёт со временем, пока пользователи привыкают к новому интерфейсу; тогда ранняя оценка занижена.',
        'A monotone decay from +7.2% to +0.6% is the signature of novelty: users react to the change itself rather than to its usefulness. The accumulated +3.0% is a blend of a large effect on the first days and a near-zero one on the last, and it bears no relation to the long-run result. The plateau is what gets extrapolated, not the average. The mirror scenario is worth checking too — a learning effect, where the metric grows over time as users adapt to a new interface; then the early estimate is too low.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.review.q-partial-week',
      mode: 'multi',
      prompt: l(
        'Эксперимент шёл пять дней, со среды по воскресенье. Коллега говорит: «из-за неполной недели эффект смещён». Какие утверждения верны?',
        'An experiment ran five days, Wednesday through Sunday. A colleague says "the effect is biased because of the partial week". Which statements are true?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Для разницы между группами смещения нет: обе группы прожили одни и те же дни',
            'There is no bias in the difference between groups: both lived through the same days',
          ),
        },
        {
          id: 'b',
          text: l(
            'Эффект измерен на нерепрезентативной смеси дней, и переносить его на полную неделю некорректно',
            'The effect is measured on an unrepresentative mix of days, so extrapolating it to a full week is invalid',
          ),
        },
        {
          id: 'c',
          text: l(
            'Если сравнивать метрику теста с предыдущей неделей вместо контроля, смещение будет, и большое',
            'Comparing the test metric with the previous week instead of control does produce a bias, and a large one',
          ),
        },
        {
          id: 'd',
          text: l(
            'Любой эксперимент длиной не кратной семи даёт смещённую оценку эффекта между группами',
            'Any experiment whose length is not a multiple of seven gives a biased between-group effect estimate',
          ),
        },
      ],
      correct: ['a', 'b', 'c'],
      explanation: l(
        'Это тот случай, когда расхожее правило «только полные недели» формулируют неточно. Рандомизация уравнивает группы по дням: если оба варианта работали в среду и в воскресенье, сезонность входит в обе группы одинаково и в разности сокращается. Поэтому вариант d неверен. Но правило всё равно полезно по двум другим причинам: во-первых, эффект может взаимодействовать с днём недели — на выходных другой состав пользователей и другие сценарии, и измеренное на выходных нельзя обобщать на будни; во-вторых, любое сравнение с предпериодом (а так часто делают для метрик, которых нет в эксперименте) при неполной неделе смещается сильно. Плюс полные недели дают более стабильную дисперсию и упрощают сравнение между экспериментами.',
        'This is the case where the common rule "whole weeks only" is usually stated imprecisely. Randomisation balances the groups across days: if both variants ran on Wednesday and on Sunday, seasonality enters both groups equally and cancels in the difference. So option d is wrong. The rule is still useful for two other reasons: first, the effect can interact with the day of week — weekends bring a different user mix and different scenarios, and what is measured on a weekend does not generalise to weekdays; second, any comparison against a pre-period (which is often done for metrics not instrumented in the experiment) is badly biased by a partial week. On top of that, whole weeks give a more stable variance and make experiments comparable with each other.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.review.q-denominator',
      mode: 'single',
      prompt: l(
        'Отчёт: «средний чек вырос на 5%, p = 0.01; число заказов упало на 6%, p = 0.03». Какой вывод корректен?',
        'A report: "average order value is up 5%, p = 0.01; the number of orders is down 6%, p = 0.03". Which conclusion is correct?',
      ),
      choices: [
        { id: 'a', text: l('Пользователи стали покупать дороже — это успех', 'Users started buying more expensive items — a success') },
        {
          id: 'b',
          text: l(
            'Вероятно, отвалились дешёвые заказы: суммарная выручка скорее упала, и считать надо выручку на пользователя',
            'Most likely cheap orders dropped out: total revenue probably fell, and revenue per user is what should be measured',
          ),
        },
        { id: 'c', text: l('Метрики противоречат друг другу, отчёт неверен', 'The metrics contradict each other, the report is wrong') },
        { id: 'd', text: l('Нужно выбрать ту метрику, которая важнее бизнесу', 'Pick whichever metric matters more to the business') },
      ],
      correct: ['b'],
      explanation: l(
        'Средний чек — это выручка, делённая на число заказов. Когда знаменатель падает, рост отношения ничего не говорит о числителе: достаточно, чтобы перестали совершаться дешёвые заказы, и средний чек вырастет при падающей выручке. Грубая прикидка: выручка ≈ средний чек × число заказов, то есть 1.05 × 0.94 ≈ 0.987, минус 1.3%. Правильная метрика решения — выручка на пользователя, где знаменатель фиксирован рандомизацией и не может измениться под воздействием. Это общее правило: знаменатель метрики эксперимента должен быть единицей рандомизации.',
        'Average order value is revenue divided by order count. When the denominator falls, a rise in the ratio says nothing about the numerator: cheap orders simply ceasing is enough to raise the average while revenue falls. A rough estimate: revenue ≈ AOV × orders, i.e. 1.05 × 0.94 ≈ 0.987, down 1.3%. The right decision metric is revenue per user, where the denominator is fixed by randomisation and cannot move under treatment. That is the general rule: the denominator of an experiment metric should be the randomisation unit.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про типичные ловушки и чек-листы.', 'The chapters on common pitfalls and checklists.'),
    },
    {
      title: "Ron Kohavi's paper archive (exp-platform)",
      url: 'https://exp-platform.com/',
      note: l('«Seven Rules of Thumb» и статьи про SRM.', '"Seven Rules of Thumb" and the SRM papers.'),
    },
  ],
};
