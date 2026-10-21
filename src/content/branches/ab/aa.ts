import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abAa: SkillNode = {
  id: 'ab.aa',
  branch: 'ab',
  tier: 3,
  title: l('A/A-тесты и проверка сплитовалки', 'A/A tests and checking the splitter'),
  blurb: l(
    'Как убедиться, что платформа не врёт, до того как доверять ей решения.',
    'How to make sure the platform does not lie before trusting it with decisions.',
  ),
  requires: ['ab.power'],
  theory: [
    {
      type: 'p',
      text: l(
        'A/A-тест — это эксперимент, в котором обе группы получают одно и то же. Эффекта нет по построению, поэтому известно, как должен выглядеть результат: p-value должны быть распределены равномерно на [0, 1], а доля значимых результатов должна равняться alpha. Если это не так, проблема в платформе, в метрике или в способе анализа — и тогда любой результат настоящего A/B-теста не значит ничего.',
        'An A/A test is an experiment where both groups get the same thing. There is no effect by construction, so we know what the result must look like: the p-values must be uniform on [0, 1] and the share of significant results must equal alpha. If that does not hold, the problem is in the platform, the metric or the analysis — and then no result from a real A/B test means anything.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Равномерность p-value при верной нулевой гипотезе — не красивое свойство, а определение корректного теста. Любая проверка платформы в итоге сводится к ней.',
        'Uniform p-values under a true null is not a nice property but the definition of a correct test. Every platform check comes down to it in the end.',
      ),
    },
    {
      type: 'sim',
      sim: 'aa-test',
      title: l('Как выглядит здоровый A/A', 'What a healthy A/A looks like'),
      caption: l(
        'Гистограмма p-value по сотням A/A-экспериментов. Она должна быть плоской, с колебаниями около чёрной линии — это и есть равномерность. Доля p < 0.05 держится около 5%: именно столько ложных «побед» ты будешь получать на пустом месте.',
        'A histogram of p-values over hundreds of A/A experiments. It should be flat, fluctuating around the black line — that is uniformity. The share of p < 0.05 stays near 5%: that is exactly how many false "wins" you will get out of thin air.',
      ),
    },
    { type: 'h', text: l('Как выглядит сломанный A/A', 'What a broken A/A looks like') },
    {
      type: 'p',
      text: l(
        'Самый неприятный класс поломок — когда ключ разбиения коррелирует с чем-то, что влияет на метрику. Например, бакет считается от идентификатора, который выдаётся последовательно, а iOS-пользователи регистрировались в другой период и конвертят лучше. Группы оказываются неслучайно разными, и A/A начинает систематически показывать «эффект».',
        'The nastiest class of breakage is when the splitting key correlates with something that drives the metric. Say the bucket is derived from an id handed out sequentially, while iOS users signed up in a different period and convert better. The groups end up non-randomly different and the A/A starts to show an "effect" systematically.',
      ),
    },
    {
      type: 'sim',
      sim: 'aa-broken',
      title: l('Сломанное разбиение', 'A broken split'),
      caption: l(
        'Переключай «сломанное / честное» и смотри на форму гистограммы. При сломанном ключе p-value заваливаются к нулю, и доля ложных срабатываний уходит далеко за 5%. Обрати внимание: если выставить разницу между платформами в ноль, сломанный сплит выглядит абсолютно здоровым — поломка проявляется только во взаимодействии с реальной неоднородностью пользователей.',
        'Toggle "broken / honest" and watch the shape of the histogram. With a broken key the p-values pile up near zero and the false positive rate goes far past 5%. Note that setting the platform gap to zero makes the broken split look perfectly healthy: the breakage only shows up in interaction with real user heterogeneity.',
      ),
    },
    { type: 'h', text: l('SRM: проверка, которую делают первой', 'SRM: the check that comes first') },
    {
      type: 'p',
      text: l(
        'Sample Ratio Mismatch — расхождение фактического соотношения трафика с запланированным. Ждали 50/50, получили 50.4/49.6. На миллионе пользователей это уже катастрофа: такое отклонение случайно практически невозможно. Проверяется критерием хи-квадрат с одной степенью свободы, и порог берут жёсткий — p < 0.001, потому что цена пропущенного SRM высока.',
        'Sample Ratio Mismatch is a divergence between the actual traffic split and the planned one. You expected 50/50 and got 50.4/49.6. On a million users that is already a catastrophe: such a deviation is practically impossible by chance. It is tested with a chi-square statistic on one degree of freedom, and the threshold is strict — p < 0.001 — because the cost of a missed SRM is high.',
      ),
    },
    { type: 'formula', tex: '\\chi^2 = \\sum_{g} \\frac{(O_g - E_g)^2}{E_g}, \\qquad df = 1' },
    {
      type: 'sim',
      sim: 'srm-check',
      title: l('Калькулятор SRM', 'SRM calculator'),
      caption: l(
        'Кривая — распределение доли трафика в группе A, если сплитовалка честная. Вертикальная линия — то, что фактически наблюдаем. Подвигай счётчики: при 100 тысячах на группу расхождение в 1000 пользователей уже даёт p-value порядка 1e-3, хотя на глаз это «полпроцента, ерунда».',
        'The curve is the distribution of the share of traffic in group A if the splitter is honest. The vertical line is what we actually observe. Nudge the counters: at 100 thousand per group a gap of 1000 users already gives a p-value around 1e-3, even though by eye it looks like "half a percent, nothing".',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'При обнаруженном SRM результаты эксперимента не интерпретируют — ни метрики, ни guardrails. Сначала ищут причину: отвалившийся редирект, фильтрация ботов, применённая только к одной группе, падение клиента в тесте, джойн, потерявший часть пользователей, разное время старта групп. Почти всегда это баг в инструментации, а не случайность.',
        'When SRM is detected, the experiment results are not interpreted at all — neither metrics nor guardrails. The cause is found first: a broken redirect, bot filtering applied to one group only, a client crash in the test group, a join that dropped some users, groups starting at different times. It is almost always an instrumentation bug rather than chance.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.aa.q-fpr-13',
      mode: 'multi',
      prompt: l(
        'Прогнали 500 A/A-экспериментов на метрике CTR, доля p < 0.05 оказалась 13%. Какие причины реально могут это объяснить?',
        'We ran 500 A/A experiments on CTR and the share of p < 0.05 came out at 13%. Which causes could genuinely explain that?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Рандомизация по пользователю, а анализ по показам',
            'Randomisation by user with analysis by impression',
          ),
        },
        { id: 'b', text: l('Ключ разбиения коррелирует с платформой или гео', 'The splitting key correlates with platform or geo') },
        {
          id: 'c',
          text: l(
            'Так бывает случайно: 13% вместо 5% на 500 экспериментах — обычный шум',
            'It happens by chance: 13% instead of 5% over 500 experiments is ordinary noise',
          ),
        },
        {
          id: 'd',
          text: l(
            'Метрика — отношение сумм, а дисперсия считается как у среднего независимых наблюдений',
            'The metric is a ratio of sums while the variance is computed as for a mean of independent observations',
          ),
        },
        {
          id: 'e',
          text: l('Выбросы в метрике не усечены', 'Outliers in the metric are not capped'),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Вариант c проверяется арифметикой: при истинных 5% стандартная ошибка доли на 500 экспериментах равна sqrt(0.05·0.95/500) ≈ 1 пп, то есть 13% — это отклонение на восемь сигм. Случайностью это не объясняется. Варианты a и d — одна и та же болезнь: заниженная дисперсия из-за игнорирования кластеризации по пользователю. Вариант b — неслучайное разбиение. Неусечённые выбросы (e) раздувают дисперсию и делают тест консервативным, то есть дали бы долю значимых меньше 5%, а не больше.',
        'Option c is settled by arithmetic: at a true 5% the standard error of the share over 500 experiments is sqrt(0.05·0.95/500) ≈ 1 pp, so 13% is an eight-sigma deviation. Chance does not explain it. Options a and d are the same disease: understated variance from ignoring clustering by user. Option b is a non-random split. Uncapped outliers (e) inflate the variance and make the test conservative, which would push the significant share below 5%, not above.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.aa.q-srm-action',
      mode: 'single',
      prompt: l(
        'Эксперимент идёт три дня, в группе A 1 004 000 пользователей, в B 996 000. Основная метрика выросла на 2% со значимым p-value. Что делать?',
        'An experiment has run for three days with 1,004,000 users in A and 996,000 in B. The primary metric is up 2% with a significant p-value. What do you do?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Раскатывать: эффект значимый, а 0.4% перекоса — ерунда', 'Ship it: the effect is significant and a 0.4% skew is nothing'),
        },
        {
          id: 'b',
          text: l(
            'Остановить интерпретацию: это SRM, сначала искать причину перекоса',
            'Stop interpreting: this is SRM, find the cause of the skew first',
          ),
        },
        {
          id: 'c',
          text: l('Докрутить вес групп в анализе и пересчитать метрику', 'Reweight the groups in the analysis and recompute the metric'),
        },
        { id: 'd', text: l('Подождать ещё, перекос выровняется', 'Wait longer, the skew will even out') },
      ],
      correct: ['b'],
      explanation: l(
        'Считаем: ожидаем по 1 000 000, наблюдаем отклонение 4000. chi² = 4000²/1e6 + 4000²/1e6 = 32, p-value порядка 1.5e-8. Это не шум, а баг в инструментации. Важно, что перекос в 0.4% сам по себе почти наверняка не объясняет роста на 2% — опасно не само соотношение, а то, что причина перекоса (например, часть пользователей B потерялась при джойне или упала на загрузке) с большой вероятностью коррелирует с метрикой. Перевзвешивание не лечит проблему, потому что потерянные пользователи не случайны. Ожидание тоже: при честной сплитовалке отклонение не растёт со временем, а значит и не исчезает.',
        'Compute it: expected 1,000,000 each, observed deviation 4000. chi² = 4000²/1e6 + 4000²/1e6 = 32, p-value around 1.5e-8. That is not noise but an instrumentation bug. Note that a 0.4% skew almost certainly does not itself explain a 2% lift — the danger is not the ratio but that whatever caused it (say part of group B lost in a join, or crashing on load) is very likely correlated with the metric. Reweighting does not fix it, because the missing users are not a random subset. Waiting does not either: with an honest splitter the deviation does not grow over time, so it does not disappear.',
      ),
    },
    {
      kind: 'findbug',
      id: 'ab.aa.bug-seed-in-loop',
      lang: 'python',
      prompt: l(
        'Этот скрипт должен оценить долю ложных срабатываний на A/A-тестах. Он выдаёт 0.0 на любых параметрах. Укажи строку с ошибкой.',
        'This script is meant to estimate the false positive rate over A/A tests. It returns 0.0 for any parameters. Point at the line with the bug.',
      ),
      code: `import random
from scipy.stats import norm


def false_positive_rate(n=5000, p=0.2, experiments=500, alpha=0.05):
    hits = 0
    for _ in range(experiments):
        rnd = random.Random(42)
        a = sum(1 for _ in range(n) if rnd.random() < p)
        b = sum(1 for _ in range(n) if rnd.random() < p)
        pooled = (a + b) / (2 * n)
        se = (pooled * (1 - pooled) * 2 / n) ** 0.5
        z = ((b - a) / n) / se
        if 2 * (1 - norm.cdf(abs(z))) < alpha:
            hits += 1
    return hits / experiments`,
      buggyLines: [8],
      explanation: l(
        'Строка 8 создаёт генератор с фиксированным сидом внутри цикла, поэтому все 500 «экспериментов» — это один и тот же эксперимент, повторённый 500 раз. Доля ложных срабатываний получается либо ровно 0.0, либо ровно 1.0, в зависимости от того, оказался ли этот единственный прогон значимым. Правильно создать генератор один раз до цикла: rnd = random.Random(42) снаружи, и тогда каждая итерация продолжает последовательность. Это общий принцип: сид фиксируют на весь прогон для воспроизводимости, а не на каждую итерацию. Та же ошибка в ML-коде выглядит как torch.manual_seed внутри цикла по эпохам — и тогда каждая эпоха видит одну и ту же «случайную» аугментацию.',
        'Line 8 creates a generator with a fixed seed inside the loop, so all 500 "experiments" are one experiment repeated 500 times. The false positive rate comes out as exactly 0.0 or exactly 1.0, depending on whether that single run happened to be significant. The fix is to create the generator once before the loop: rnd = random.Random(42) outside, so each iteration continues the sequence. This is a general principle: the seed is fixed once per run for reproducibility, not once per iteration. The same bug in ML code looks like torch.manual_seed inside the epoch loop — and then every epoch sees the same "random" augmentation.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Главы про A/A, SRM и диагностику платформы.', 'The chapters on A/A, SRM and platform diagnostics.'),
    },
    {
      title: "Ron Kohavi's paper archive (exp-platform)",
      url: 'https://exp-platform.com/',
      note: l('Там же статья про диагностику SRM.', 'The SRM diagnostics paper lives there too.'),
    },
  ],
};
