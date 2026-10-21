import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const adsRevenueRelevance: SkillNode = {
  id: 'ads.revenue-relevance',
  branch: 'ads',
  tier: 4,
  title: l('Выручка против релевантности', 'Revenue versus relevance'),
  blurb: l(
    'Рекламное место всегда отнято у органики, и спор идёт о том, за сколько.',
    'An ad slot is always taken from the organic results; the argument is about the price.',
  ),
  requires: ['ads.calibration'],
  theory: [
    {
      type: 'p',
      text: l(
        'Любое решение в рекламе — это обмен. Добавить место: больше денег сегодня, хуже выдача. Снизить резервную цену: больше заполненных мест, ниже средняя релевантность. Поднять вес ставки относительно pCTR: выше выручка с клика, ниже вероятность, что пользователь вообще кликнет. Задача инженера — не выбрать сторону, а показать кривую обмена и точку, в которой стоит находиться.',
        'Every decision in advertising is a trade. Add a slot: more money today, worse results. Lower the reserve: more filled slots, lower average relevance. Raise the weight of the bid against pCTR: higher revenue per click, lower chance the user clicks at all. The engineer\'s job is not to pick a side but to show the trade-off curve and the point worth sitting at.',
      ),
    },
    {
      type: 'sim',
      sim: 'ad-load',
      title: l('Сколько рекламных мест ставить', 'How many ad slots to run'),
      caption: l(
        'Серые столбики — выручка сегодня, она почти монотонно растёт. Зелёная кривая — та же выручка с поправкой на уходящих пользователей, у неё есть максимум. Покрути чувствительность пользователей: оптимум сдвигается, но никогда не уходит в «чем больше, тем лучше». Главное наблюдение не про форму кривых, а про горизонт измерения: первая видна за неделю, вторая — за квартал.',
        'The grey bars are revenue today and grow almost monotonically. The green curve is the same revenue adjusted for users walking away, and it has a maximum. Turn the user sensitivity: the optimum moves but never becomes "the more the better". The main observation is not about the shape of the curves but about the measurement horizon: the first is visible in a week, the second in a quarter.',
      ),
    },
    { type: 'h', text: l('Как это меряют на практике', 'How this is measured in practice') },
    {
      type: 'list',
      items: [
        l(
          'Долгосрочный holdout: группа, которой месяцами не повышают рекламную нагрузку. Единственный способ увидеть накопленный эффект на возвращаемость.',
          'A long-term holdout: a group whose ad load is not raised for months. The only way to see the accumulated effect on return behaviour.',
        ),
        l(
          'Guardrail на органику: доля органических кликов и доля сессий без клика. Они падают раньше, чем пользователь уходит насовсем.',
          'Guardrails on the organic side: share of organic clicks and share of click-free sessions. They fall before the user leaves for good.',
        ),
        l(
          'Обменный курс: сколько рублей рекламной выручки стоит один процент падения органического CTR. Он считается из holdout и позволяет сравнивать разные предложения на одной шкале.',
          'An exchange rate: how many roubles of ad revenue one percent of organic CTR decline is worth. Estimated from the holdout, it lets different proposals be compared on one scale.',
        ),
        l(
          'Ограничение сверху на долю рекламы в выдаче как политика, а не как результат оптимизации. Оптимизатор всегда найдёт способ поставить больше рекламы.',
          'A hard cap on the ad share of the page as policy rather than an optimisation outcome. An optimiser will always find a way to put in more ads.',
        ),
      ],
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'Самая частая организационная ловушка: рекламную команду премируют за выручку, поисковую — за релевантность, а решение о числе мест принимает тот, у кого громче голос. Техническое решение этой задачи существует — общий обменный курс и общий holdout, — но внедряется оно как управленческое, а не как инженерное.',
        'The most common organisational trap: the ads team is rewarded for revenue, the search team for relevance, and the number of slots is decided by whoever is louder. A technical solution exists — a shared exchange rate and a shared holdout — but it gets adopted as a management decision rather than an engineering one.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'case',
      id: 'ads.revenue-relevance.case-third-slot',
      prompt: l(
        'Продакт рекламы приносит предложение: добавить третье рекламное место в товарный поиск. Расчёт: «на A/B за две недели рекламная выручка на поиск выросла на 7.2%, p < 0.001. Органический CTR упал на 0.9%, но это незначимо, p = 0.08. Конверсия в заказ не изменилась. Предлагаю раскатывать». Тебя просят оценить предложение как инженера команды поиска. Напиши, что ты скажешь: какие вопросы задашь, что пересчитаешь и какое решение предложишь.',
        'The ads product manager brings a proposal: add a third ad slot to product search. The case: "over a two-week A/B, ad revenue per search rose 7.2%, p < 0.001. Organic CTR fell 0.9%, but that is not significant, p = 0.08. Order conversion did not change. I propose we ship it." You are asked to assess the proposal as an engineer on the search team. Write what you would say: the questions you would ask, what you would recompute, and the decision you would propose.',
      ),
      reference: l(
        'Разбор стоит начать с того, что цифры скорее всего верны, а вывод из них не следует. Первое: «незначимо» здесь не означает «нет эффекта». Падение органического CTR на 0.9% при p = 0.08 — это эффект, который эксперимент не смог отличить от нуля, а не доказанный ноль. Надо посмотреть доверительный интервал: если он простирается до минус 2%, вывод «органика не пострадала» необоснован. Для guardrail-метрик ошибка II рода дороже первой, поэтому порог значимости для них обычно смягчают, а не ужесточают — при таком p этот guardrail следует считать сработавшим. Второе: горизонт. Эффект добавления рекламы на выручку виден сразу, а на поведение пользователей — нет. Две недели почти наверняка не покажут снижения возвращаемости, которое и является главным риском. Нужен либо долгосрочный holdout, либо хотя бы эксперимент на 4–6 недель с метрикой возвращаемости. Третье: конверсия в заказ как метрика. Она могла не измениться, потому что эксперимент недомощный именно для неё: конверсия шумнее, чем рекламный CTR, и MDE по ней на том же трафике заметно хуже. Нужно посчитать MDE и честно сказать, какой эффект мы были способны увидеть. Четвёртое, содержательное: третье место вытесняет третий органический результат, и его ценность надо оценить явно — через обменный курс между рекламной выручкой и органическим CTR, посчитанный на holdout. Без этого курса спор превращается в соревнование аргументов. Пятое: предложить альтернативу вместо прямого отказа. Например, поднять резервную цену для третьего места так, чтобы оно заполнялось только качественной рекламой: часть выручки сохранится, вред на органику снизится. Решение: не раскатывать по этим данным; запросить интервалы по всем метрикам и MDE, добавить метрику возвращаемости, прогнать эксперимент дольше или на holdout, и параллельно посчитать вариант с резервной ценой.',
        'The analysis should start from the fact that the numbers are probably right while the conclusion does not follow. First, "not significant" here does not mean "no effect". A 0.9% drop in organic CTR at p = 0.08 is an effect the experiment could not distinguish from zero, not a demonstrated zero. Look at the confidence interval: if it reaches minus 2%, the claim "organic was not harmed" rests on nothing. For guardrail metrics a type II error costs more than a type I, so their thresholds are usually loosened rather than tightened — at that p this guardrail should be treated as triggered. Second, the horizon. The effect of adding ads on revenue is immediate; the effect on user behaviour is not. Two weeks will almost certainly not show the drop in return rate that is the main risk. Either a long-term holdout or at least a 4–6 week experiment with a return metric is needed. Third, order conversion as a metric. It may have stayed flat because the experiment is underpowered for it specifically: conversion is noisier than ad CTR, and its MDE at the same traffic is much worse. Compute the MDE and state honestly what effect we were able to see. Fourth, the substantive point: a third slot displaces the third organic result, and its value has to be priced explicitly — through an exchange rate between ad revenue and organic CTR estimated on a holdout. Without that rate the argument becomes a contest of rhetoric. Fifth, propose an alternative rather than a flat refusal. For instance, raise the reserve price for the third slot so it only fills with good ads: part of the revenue is kept and the harm to organic falls. Decision: do not ship on this data; request intervals for all metrics and the MDE, add a return metric, run longer or on a holdout, and price the reserve-price variant in parallel.',
      ),
      checklist: [
        l('Сказал, что p = 0.08 на guardrail — не доказательство отсутствия эффекта', 'Said that p = 0.08 on a guardrail is not proof of no effect'),
        l('Попросил доверительные интервалы, а не только p-value', 'Asked for confidence intervals rather than p-values alone'),
        l('Отметил, что для guardrail порог смягчают, а не ужесточают', 'Noted that guardrail thresholds are loosened rather than tightened'),
        l('Поднял вопрос горизонта и долгосрочного эффекта на возвращаемость', 'Raised the horizon and the long-term effect on return behaviour'),
        l('Усомнился в мощности эксперимента для конверсии', 'Questioned the power of the experiment for conversion'),
        l('Предложил посчитать обменный курс выручка — органический CTR', 'Proposed estimating the revenue-to-organic-CTR exchange rate'),
        l('Предложил альтернативу вместо отказа (резервная цена)', 'Offered an alternative instead of a refusal (the reserve price)'),
        l('Сформулировал конкретное решение, а не только возражения', 'Stated a concrete decision rather than only objections'),
      ],
    },
    {
      kind: 'quiz',
      id: 'ads.revenue-relevance.q-guardrail-threshold',
      mode: 'single',
      prompt: l(
        'Почему для guardrail-метрик порог значимости обычно смягчают, а не ужесточают?',
        'Why are significance thresholds for guardrail metrics usually loosened rather than tightened?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Чтобы было проще раскатывать изменения', 'To make shipping changes easier'),
        },
        {
          id: 'b',
          text: l(
            'Потому что пропустить настоящий вред дороже, чем лишний раз остановиться на ложной тревоге',
            'Because missing real harm costs more than stopping once too often on a false alarm',
          ),
        },
        { id: 'c', text: l('Потому что guardrail-метрик много и нужна поправка', 'Because there are many guardrails and a correction is needed') },
        { id: 'd', text: l('Потому что они менее точные', 'Because they are less accurate') },
      ],
      correct: ['b'],
      explanation: l(
        'У основной метрики и у guardrail разная асимметрия ошибок. Для основной дороже ошибка I рода: раскатить то, что не работает. Для guardrail дороже ошибка II рода: не заметить вред. Поэтому для guardrail берут больший alpha, иногда 0.1 или 0.2, то есть готовы чаще останавливаться зря. Поправка на множественные сравнения тут работает против цели — она снижает чувствительность именно там, где её не хватает. Заметь побочное следствие: guardrail с огромным доверительным интервалом бесполезен как защита, поэтому их специально выбирают среди чувствительных метрик.',
        'The primary metric and a guardrail have opposite error asymmetries. For the primary one a type I error costs more: shipping something that does not work. For a guardrail a type II error costs more: missing harm. So guardrails get a larger alpha, sometimes 0.1 or 0.2, accepting more needless stops. A multiple-comparisons correction works against the goal here — it cuts sensitivity exactly where there is too little. A side consequence worth noting: a guardrail with an enormous confidence interval is useless as protection, which is why they are deliberately chosen from among sensitive metrics.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про guardrails и долгосрочные эффекты.', 'The chapters on guardrails and long-term effects.'),
    },
  ],
};
