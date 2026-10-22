import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const statsHypotheses: SkillNode = {
  id: 'stats.hypotheses',
  branch: 'stats',
  act: 2,
  tier: 4,
  title: l('Гипотезы и p-value', 'Hypotheses and p-values'),
  blurb: l(
    'Что именно утверждает «статистически значимо» — и чего не утверждает.',
    'What "statistically significant" actually claims, and what it does not.',
  ),
  requires: ['boss.first-report'],
  theory: [
    {
      type: 'p',
      text: l(
        'Проверка гипотезы устроена от противного. Мы предполагаем, что эффекта нет — это нулевая гипотеза, — и спрашиваем: насколько странно выглядят наши данные, если это предположение верно. p-value отвечает ровно на этот вопрос: это вероятность увидеть расхождение не меньше наблюдаемого при условии, что эффекта нет. Маленькое p-value означает, что данные плохо согласуются с «эффекта нет», и ничего больше.',
        'Hypothesis testing works by contradiction. We assume there is no effect — that is the null hypothesis — and ask how strange our data looks if that assumption holds. The p-value answers exactly that: it is the probability of seeing a discrepancy at least as large as the observed one given that there is no effect. A small p-value means the data sits badly with "no effect", and nothing more.',
      ),
    },
    {
      type: 'formula',
      tex: 'p = P(\\text{данные как минимум настолько же странные} \\mid H_0) \\;\\neq\\; P(H_0 \\mid \\text{данные})',
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'p-value — не вероятность того, что гипотеза неверна. Эти две величины связаны формулой Байеса, и вторая зависит ещё и от того, насколько правдоподобна была гипотеза до эксперимента. Именно поэтому при p = 0.04 ошибиться можно сильно чаще, чем в 4% случаев.',
        'A p-value is not the probability that the hypothesis is wrong. The two are linked by Bayes\' rule, and the second one also depends on how plausible the hypothesis was before the experiment. That is why at p = 0.04 you can be wrong far more often than 4% of the time.',
      ),
    },
    {
      type: 'sim',
      sim: 'pvalue-distribution',
      title: l('Как выглядит p-value', 'What a p-value looks like'),
      caption: l(
        'Поставь эффект в ноль: распределение p-value равномерно, то есть значение 0.03 ровно так же вероятно, как 0.83. Отсюда и берётся пять процентов ложных срабатываний — это не свойство данных, а определение порога. Теперь потяни эффект вверх: распределение прижимается к нулю, и доля значимых результатов — это уже мощность.',
        'Set the effect to zero: the p-value distribution is flat, so 0.03 is exactly as likely as 0.83. That is where the five percent of false positives comes from — it is not a property of the data but the definition of the threshold. Now drag the effect up: the distribution piles up near zero, and the share of significant results becomes the power.',
      ),
    },
    {
      type: 'h',
      text: l('Сколько значимых результатов на самом деле верны', 'How many significant results are actually true'),
    },
    {
      type: 'p',
      text: l(
        'Самое практичное следствие из всего раздела. Если из ста проверяемых гипотез работают десять, а мощность 80%, то настоящих находок будет восемь. Ложных при alpha = 0.05 будет 0.05 × 90 ≈ 4.5. То есть среди примерно двенадцати значимых результатов треть — мусор, хотя каждый из них «значим на уровне 0.05». Повысить долю верных находок можно двумя способами: тестировать более правдоподобные гипотезы или поднимать мощность.',
        'The most practical consequence of this whole section. If ten out of a hundred tested hypotheses work and the power is 80%, there will be eight true finds. False ones at alpha = 0.05 number 0.05 × 90 ≈ 4.5. So among roughly twelve significant results a third is garbage, even though each is "significant at the 0.05 level". There are two ways to raise the share of true finds: test more plausible hypotheses, or raise the power.',
      ),
    },
    {
      type: 'sim',
      sim: 'significance-vs-truth',
      title: l('Доля настоящих среди значимых', 'The share of real results among the significant ones'),
      caption: l(
        'Главный ползунок — доля гипотез, которые реально работают. В зрелом продукте она низкая: большинство идей не даёт эффекта, и это нормально. Поставь её в 10% и посмотри, сколько значимых результатов окажутся ложными. Обрати внимание, что поднять мощность здесь помогает сильнее, чем ужесточить alpha.',
        'The slider that matters is the share of hypotheses that genuinely work. In a mature product it is low: most ideas do nothing, and that is normal. Set it to 10% and see how many significant results turn out false. Note that raising the power helps more here than tightening alpha.',
      ),
    },
    {
      type: 'h',
      text: l('Односторонние и двусторонние гипотезы', 'One-sided and two-sided hypotheses'),
    },
    {
      type: 'p',
      text: l(
        'Двусторонний тест спрашивает «есть ли разница», односторонний — «стало ли лучше». Односторонний мощнее при том же трафике, и ровно поэтому его любят выбирать задним числом, увидев направление эффекта. Так делать нельзя: выбор стороны после просмотра данных превращает заявленные 5% в фактические 10%. Сторону фиксируют до запуска, и в продуктовых экспериментах почти всегда берут двусторонний — потому что падение метрики интересует не меньше роста.',
        'A two-sided test asks "is there a difference", a one-sided one asks "did it get better". The one-sided test is more powerful at the same traffic, which is exactly why people like to pick it after the fact, having seen the direction of the effect. That is not allowed: choosing the side after looking at the data turns a declared 5% into an actual 10%. The side is fixed before launch, and product experiments are almost always two-sided — because a drop in the metric matters as much as a rise.',
      ),
    },
    {
      type: 'table',
      head: [l('Формулировка', 'Phrasing'), l('Что это значит', 'What it means')],
      rows: [
        [
          l('p = 0.03', 'p = 0.03'),
          l(
            'Если бы эффекта не было, такие или более сильные данные встречались бы в 3% экспериментов',
            'If there were no effect, data this extreme or more would occur in 3% of experiments',
          ),
        ],
        [
          l('p = 0.3, «эффекта нет»', 'p = 0.3, "there is no effect"'),
          l(
            'Неверно. Данные совместимы с отсутствием эффекта, но и с эффектом, который мы не смогли увидеть',
            'Wrong. The data is compatible with no effect, and also with an effect we failed to detect',
          ),
        ],
        [
          l('«Значимо, значит важно»', '"Significant, therefore important"'),
          l(
            'Неверно. На большом трафике значимым становится и рост на 0.01%, который не окупает разработку',
            'Wrong. At large traffic a 0.01% lift becomes significant too, and it does not pay for the development',
          ),
        ],
      ],
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'stats.hypotheses.q-meaning',
      mode: 'single',
      prompt: l(
        'Эксперимент дал p = 0.02. Какое утверждение корректно?',
        'An experiment returned p = 0.02. Which statement is correct?',
      ),
      choices: [
        { id: 'a', text: l('Вероятность того, что эффекта нет, равна 2%', 'The probability that there is no effect is 2%') },
        {
          id: 'b',
          text: l(
            'Если бы эффекта не было, данные такой или большей странности встречались бы в 2% экспериментов',
            'If there were no effect, data this extreme or more would occur in 2% of experiments',
          ),
        },
        { id: 'c', text: l('Вероятность того, что эффект есть, равна 98%', 'The probability that the effect exists is 98%') },
        { id: 'd', text: l('Эффект воспроизведётся в 98% повторений', 'The effect will reproduce in 98% of replications') },
      ],
      correct: ['b'],
      explanation: l(
        'p-value считается при условии верности нулевой гипотезы, поэтому вероятностью самой гипотезы быть не может. Вариант d — отдельное заблуждение: вероятность воспроизведения зависит от мощности и от истинного размера эффекта, и при p = 0.02 она обычно заметно ниже 98%, особенно если эксперимент был недомощным.',
        'The p-value is computed assuming the null is true, so it cannot be the probability of the null itself. Option d is a separate misconception: the chance of replication depends on power and on the true effect size, and at p = 0.02 it is usually well below 98%, especially if the experiment was underpowered.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.hypotheses.q-ppv',
      mode: 'number',
      prompt: l(
        'Из 200 проверяемых гипотез работают 20. Мощность теста 80%, alpha = 0.05. Сколько примерно значимых результатов будет получено всего (настоящих плюс ложных)? Ответ — целое число.',
        'Of 200 tested hypotheses, 20 work. The power is 80% and alpha = 0.05. Roughly how many significant results will come out in total (true plus false)? Answer with a whole number.',
      ),
      value: 25,
      tolerance: 1.5,
      explanation: l(
        'Настоящих находок: 20 × 0.8 = 16. Ложных: 180 × 0.05 = 9. Всего около 25, и из них 9 — мусор, то есть больше трети. Это и есть главная причина, по которой в продуктовых командах требуют воспроизведения неожиданных результатов, а не раскатывают их сразу.',
        'True finds: 20 × 0.8 = 16. False ones: 180 × 0.05 = 9. About 25 in total, of which 9 are garbage — more than a third. This is the main reason product teams ask for replication of surprising results instead of shipping them straight away.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.hypotheses.q-not-significant',
      mode: 'multi',
      prompt: l(
        'Эксперимент закончился с p = 0.4. Какие выводы допустимы?',
        'An experiment ended with p = 0.4. Which conclusions are permissible?',
      ),
      choices: [
        { id: 'a', text: l('Эффекта нет', 'There is no effect') },
        {
          id: 'b',
          text: l(
            'Данные не дали оснований отвергнуть гипотезу об отсутствии эффекта',
            'The data gave no grounds to reject the hypothesis of no effect',
          ),
        },
        {
          id: 'c',
          text: l(
            'Нужно посмотреть доверительный интервал: если он широкий, эксперимент просто ничего не выяснил',
            'The confidence interval should be checked: if it is wide, the experiment simply learned nothing',
          ),
        },
        {
          id: 'd',
          text: l(
            'Если интервал узкий и лежит около нуля, можно говорить, что практически значимого эффекта нет',
            'If the interval is narrow and sits around zero, one can say there is no practically meaningful effect',
          ),
        },
      ],
      correct: ['b', 'c', 'd'],
      explanation: l(
        'Отсутствие значимости само по себе не доказывает отсутствия эффекта — это разные утверждения. Решает ширина интервала: широкий интервал означает «не узнали», узкий вокруг нуля означает «эффект, если он есть, слишком мал, чтобы быть интересным». Именно поэтому отчёт по эксперименту без доверительного интервала бесполезен.',
        'A lack of significance does not by itself prove a lack of effect — these are different claims. The interval width decides: a wide interval means "we learned nothing", a narrow one around zero means "any effect is too small to be interesting". This is exactly why an experiment report without a confidence interval is useless.',
      ),
    },
    {
      kind: 'quiz',
      id: 'stats.hypotheses.q-one-sided',
      mode: 'single',
      prompt: l(
        'Аналитик запустил двусторонний тест, получил p = 0.07 и предлагает пересчитать односторонним, раз эффект всё равно положительный: тогда p станет 0.035. Что с этим не так?',
        'An analyst ran a two-sided test, got p = 0.07 and suggests recomputing it one-sided since the effect is positive anyway: that would make p = 0.035. What is wrong with this?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Ничего, односторонний тест мощнее', 'Nothing, a one-sided test is more powerful'),
        },
        {
          id: 'b',
          text: l(
            'Сторона выбрана после просмотра данных, поэтому фактический уровень ошибки равен 10%, а не 5%',
            'The side was chosen after seeing the data, so the actual error level is 10%, not 5%',
          ),
        },
        {
          id: 'c',
          text: l('Односторонние тесты вообще некорректны', 'One-sided tests are invalid in general'),
        },
        {
          id: 'd',
          text: l('Надо просто взять alpha = 0.1 и объявить результат значимым', 'Just take alpha = 0.1 and call it significant'),
        },
      ],
      correct: ['b'],
      explanation: l(
        'Односторонний тест законен, если сторона зафиксирована до эксперимента. Выбор стороны по знаку наблюдаемого эффекта означает, что отвергнуть нулевую гипотезу можно было бы при отклонении в любую сторону — то есть фактически это двусторонний тест с alpha = 0.1. То же самое относится к выбору метрики, периода или сегмента после просмотра результатов: любое решение, принятое под данные, обесценивает заявленный уровень значимости.',
        'A one-sided test is legitimate when the side is fixed before the experiment. Choosing it by the sign of the observed effect means the null could have been rejected by a deviation in either direction — which makes it a two-sided test with alpha = 0.1. The same applies to choosing the metric, the period or the segment after seeing the results: any decision made to fit the data devalues the stated significance level.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: p-value',
      url: 'https://en.wikipedia.org/wiki/P-value',
    },
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
    },
  ],
};
