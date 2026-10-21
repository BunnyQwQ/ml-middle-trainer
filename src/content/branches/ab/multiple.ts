import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abMultiple: SkillNode = {
  id: 'ab.multiple',
  branch: 'ab',
  tier: 5,
  title: l('Множественные сравнения', 'Multiple comparisons'),
  blurb: l(
    'Двадцать метрик, двадцать сегментов — и гарантированная победа на пустом месте.',
    'Twenty metrics, twenty segments — and a guaranteed win out of nothing.',
  ),
  requires: ['ab.peeking'],
  theory: [
    {
      type: 'p',
      text: l(
        'Подглядывание — это множественность во времени. А есть множественность в ширину: один эксперимент, но двадцать метрик в отчёте, десять сегментов по платформам и гео, три варианта вместо двух. Каждая проверка даёт 5% шанс на ложное срабатывание, и при двадцати независимых проверках вероятность найти хотя бы одну «победу» равна 1 - 0.95^20 ≈ 64%.',
        'Peeking is multiplicity in time. There is also multiplicity in width: one experiment, but twenty metrics in the report, ten segments by platform and geography, three variants instead of two. Each check carries a 5% chance of a false positive, and across twenty independent checks the probability of finding at least one "win" is 1 - 0.95^20 ≈ 64%.',
      ),
    },
    { type: 'formula', tex: 'FWER = 1 - (1-\\alpha)^m' },
    {
      type: 'sim',
      sim: 'multiple-comparisons',
      title: l('Три стратегии на одних данных', 'Three strategies on the same data'),
      caption: l(
        'Зелёные столбики — найденные настоящие эффекты, красные — ложные тревоги. Без поправки ложных тревог тем больше, чем шире отчёт. Bonferroni почти полностью их убирает, но вместе с ними теряет и часть настоящих находок. Бенджамини-Хохберг держит середину: он контролирует не вероятность хоть одной ошибки, а ожидаемую долю ошибок среди находок.',
        'Green bars are real effects found, red ones are false alarms. Without correction the false alarms grow with the width of the report. Bonferroni removes almost all of them, but takes part of the real finds with them. Benjamini-Hochberg sits in between: it controls not the chance of any error but the expected share of errors among the finds.',
      ),
    },
    { type: 'h', text: l('Две разные гарантии', 'Two different guarantees') },
    {
      type: 'table',
      head: [l('Подход', 'Approach'), l('Что гарантирует', 'What it guarantees'), l('Когда уместен', 'When it fits')],
      rows: [
        [
          l('Bonferroni: alpha / m', 'Bonferroni: alpha / m'),
          l(
            'Вероятность хотя бы одной ложной находки не больше alpha',
            'The probability of at least one false find is at most alpha',
          ),
          l(
            'Мало метрик, цена ошибки высока: решение о раскатке на всех',
            'Few metrics and a high cost of error: a decision to ship to everyone',
          ),
        ],
        [
          l('Бенджамини-Хохберг', 'Benjamini-Hochberg'),
          l(
            'Ожидаемая доля ложных среди отвергнутых не больше alpha',
            'The expected share of false ones among the rejected is at most alpha',
          ),
          l(
            'Много метрик, разведка: лучше пропустить пару ложных, чем потерять находки',
            'Many metrics, exploration: better to tolerate a couple of false ones than lose finds',
          ),
        ],
        [
          l('Одна основная метрика', 'A single primary metric'),
          l(
            'Поправка не нужна вовсе: проверка одна',
            'No correction needed at all: there is only one test',
          ),
          l('Всегда, когда это возможно', 'Whenever it is possible'),
        ],
      ],
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Самая сильная защита от множественных сравнений — не поправка, а дисциплина: одна основная метрика, выбранная до запуска, по которой принимается решение. Всё остальное в отчёте — описательная информация и guardrails, и к ним не применяются слова «значимо выросло».',
        'The strongest defence against multiple comparisons is not a correction but discipline: one primary metric, chosen before launch, on which the decision is made. Everything else in the report is descriptive information and guardrails, and the words "significantly up" do not apply to them.',
      ),
    },
    {
      type: 'p',
      text: l(
        'Отдельный случай — нарезка по сегментам. Фраза «в целом эффекта нет, но на iOS значимый рост» почти всегда означает ложную находку: сегментов много, трафика в каждом мало. Правильная реакция — не раскатывать на iOS, а сформулировать это как новую гипотезу и проверить отдельным экспериментом с достаточной мощностью. Разница принципиальна: в первом случае решение принято по данным, которые его и породили, во втором — по независимым данным.',
        'Segment slicing is a case of its own. The phrase "no effect overall, but a significant lift on iOS" almost always means a false find: there are many segments and little traffic in each. The right response is not to ship to iOS but to state it as a new hypothesis and test it in a separate, adequately powered experiment. The difference is fundamental: in the first case the decision is made on the data that produced it, in the second on independent data.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.multiple.q-fwer',
      mode: 'number',
      prompt: l(
        'В отчёте по эксперименту 15 независимых метрик, каждая проверяется на уровне 0.05, эффекта нет ни в одной. Какова вероятность, что хотя бы одна окажется значимой? Ответ в процентах, целое число.',
        'An experiment report has 15 independent metrics, each tested at the 0.05 level, with no effect in any of them. What is the probability that at least one comes out significant? Answer in percent, a whole number.',
      ),
      value: 54,
      tolerance: 2,
      unit: l('%', '%'),
      explanation: l(
        '1 - 0.95^15 = 1 - 0.4633 ≈ 0.537, то есть около 54%. Больше чем в половине пустых экспериментов найдётся метрика, по которой можно отчитаться об успехе. На практике метрики скоррелированы, и число получается меньше, но порядок остаётся тем же — именно поэтому отчёт с двумя десятками метрик без заранее назначенной основной бесполезен для принятия решения.',
        '1 - 0.95^15 = 1 - 0.4633 ≈ 0.537, about 54%. In more than half of all empty experiments there will be some metric to report success on. In practice metrics are correlated and the number comes out lower, but the order of magnitude stands — which is exactly why a report with twenty metrics and no pre-appointed primary one is useless for making a decision.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.multiple.q-correction',
      mode: 'single',
      prompt: l(
        'Эксперимент проверяет одну основную метрику и десять guardrail-метрик. Нужно ли применять поправку на множественные сравнения к основной метрике?',
        'An experiment tests one primary metric and ten guardrail metrics. Should a multiple comparisons correction be applied to the primary metric?',
      ),
      choices: [
        { id: 'a', text: l('Да, всего проверок одиннадцать', 'Yes, there are eleven tests in total') },
        {
          id: 'b',
          text: l(
            'Нет: решение принимается по одной заранее назначенной метрике, guardrails работают на отсечение вреда',
            'No: the decision is made on one pre-appointed metric, while guardrails exist to catch harm',
          ),
        },
        { id: 'c', text: l('Да, но только если guardrails тоже значимы', 'Yes, but only if the guardrails are significant too') },
        { id: 'd', text: l('Нет, поправки вообще не нужны в A/B', 'No, corrections are never needed in A/B testing') },
      ],
      correct: ['b'],
      explanation: l(
        'Поправка нужна там, где много проверок конкурируют за роль основания для решения. Основная метрика назначена заранее и единственна, поэтому её уровень значимости не размывается. Guardrails решают другую задачу — поймать вред, и для них ошибка II рода (не заметить падение) дороже ошибки I рода, поэтому их пороги обычно наоборот смягчают, а не ужесточают. Важное условие: основная метрика должна быть зафиксирована в дизайне эксперимента до запуска, иначе всё это рассуждение рассыпается.',
        'A correction is needed where many tests compete to be the basis for the decision. The primary metric is appointed in advance and is unique, so its significance level is not diluted. Guardrails solve a different problem — catching harm — and for them a type II error (missing a drop) costs more than a type I error, so their thresholds are usually loosened rather than tightened. One condition matters: the primary metric must be fixed in the experiment design before launch, otherwise this whole argument falls apart.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.multiple.q-segments',
      mode: 'single',
      prompt: l(
        'Эффекта в целом нет, но при нарезке по восьми сегментам на одном обнаружился значимый рост на 4%. Что делать?',
        'There is no effect overall, but slicing into eight segments reveals a significant 4% lift on one of them. What should be done?',
      ),
      choices: [
        { id: 'a', text: l('Раскатить фичу на этот сегмент', 'Ship the feature to that segment') },
        {
          id: 'b',
          text: l(
            'Считать это гипотезой и проверить отдельным экспериментом на этом сегменте',
            'Treat it as a hypothesis and test it in a separate experiment on that segment',
          ),
        },
        { id: 'c', text: l('Объявить эксперимент успешным частично', 'Declare the experiment a partial success') },
        {
          id: 'd',
          text: l('Пересчитать общий эффект, исключив остальные сегменты', 'Recompute the overall effect excluding the other segments'),
        },
      ],
      correct: ['b'],
      explanation: l(
        'При восьми сегментах вероятность найти хотя бы один значимый при полном отсутствии эффекта около 34%, а если сегментов на самом деле больше (платформа × гео × новизна пользователя), то почти гарантированно. Найденное — не результат, а гипотеза, и проверять её надо на новых данных. Вариант d — худший: это подгонка выборки под желаемый ответ, то есть прямое искажение. Если у сегмента есть внятное объяснение механизма, гипотеза становится правдоподобнее, но проверять её всё равно нужно отдельно.',
        'With eight segments the chance of finding at least one significant result under a complete absence of effect is about 34%, and when the real number of slices is larger (platform × geography × user tenure) it is practically guaranteed. What was found is a hypothesis, not a result, and it must be tested on fresh data. Option d is the worst: it fits the sample to the desired answer, which is outright distortion. A plausible mechanism makes the hypothesis more credible, but it still has to be tested separately.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Multiple comparisons problem',
      url: 'https://en.wikipedia.org/wiki/Multiple_comparisons_problem',
    },
    {
      title: 'Wikipedia: False discovery rate',
      url: 'https://en.wikipedia.org/wiki/False_discovery_rate',
      note: l('Процедура Бенджамини-Хохберга.', 'The Benjamini-Hochberg procedure.'),
    },
  ],
};
