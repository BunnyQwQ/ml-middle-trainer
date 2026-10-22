import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const abCuped: SkillNode = {
  id: 'ab.cuped',
  branch: 'ab',
  act: 3,
  tier: 7,
  title: l('CUPED и снижение дисперсии', 'CUPED and variance reduction'),
  blurb: l(
    'Как получить тот же вывод на вдвое меньшем трафике, ничего не нарушив.',
    'How to reach the same conclusion on half the traffic without breaking anything.',
  ),
  requires: ['ab.ratio'],
  theory: [
    {
      type: 'p',
      text: l(
        'Дисперсия метрики складывается из двух частей: того, что вызвано экспериментом, и того, что было в пользователе изначально. Активный пользователь кликает много и в контроле, и в тесте; его поведение до эксперимента известно и к воздействию отношения не имеет. CUPED вычитает эту предсказуемую часть, и остаток оказывается заметно менее шумным. Название расшифровывается как Controlled-experiment Using Pre-Experiment Data.',
        'The variance of a metric has two parts: what the experiment caused, and what was in the user to begin with. An active user clicks a lot in control as well as in test; their behaviour before the experiment is known and has nothing to do with the treatment. CUPED subtracts that predictable part, and what remains is noticeably less noisy. The name stands for Controlled-experiment Using Pre-Experiment Data.',
      ),
    },
    {
      type: 'formula',
      tex: 'Y^{adj}_u = Y_u - \\theta\\,(X_u - \\bar X), \\qquad \\theta = \\frac{\\operatorname{Cov}(Y, X)}{\\operatorname{Var}(X)}',
      caption: l(
        'X — та же метрика за период до эксперимента. Оптимальная theta — коэффициент регрессии Y на X.',
        'X is the same metric over the pre-experiment period. The optimal theta is the regression slope of Y on X.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Дисперсия падает ровно в 1 - rho² раз, где rho — корреляция метрики с её предпериодным значением. При rho = 0.7 остаётся 51% дисперсии, то есть эксперимент требует вдвое меньше трафика. При этом оценка эффекта не смещается: мы вычитаем величину, не зависящую от группы.',
        'The variance drops by exactly a factor of 1 - rho², where rho is the correlation of the metric with its pre-period value. At rho = 0.7, 51% of the variance remains, so the experiment needs half the traffic. The effect estimate stays unbiased: what we subtract does not depend on the group.',
      ),
    },
    {
      type: 'sim',
      sim: 'cuped',
      title: l('Сколько дисперсии уходит', 'How much variance goes away'),
      caption: l(
        'Каждая точка — пользователь: по горизонтали его метрика до эксперимента, по вертикали во время. Чем теснее облако вокруг прямой, тем больше можно вычесть. Обрати внимание на нелинейность выигрыша: при rho = 0.3 экономия всего 9%, при rho = 0.8 — уже 64%. Поэтому в предпериод берут ту же самую метрику: ничто другое не коррелирует так сильно.',
        'Each dot is a user: their metric before the experiment on the horizontal axis, during it on the vertical one. The tighter the cloud around the line, the more can be subtracted. Note how non-linear the payoff is: at rho = 0.3 the saving is only 9%, at rho = 0.8 it is already 64%. This is why the pre-period covariate is the same metric: nothing else correlates as strongly.',
      ),
    },
    { type: 'h', text: l('Условия, при которых это законно', 'The conditions that make this legitimate') },
    {
      type: 'list',
      items: [
        l(
          'Ковариата измерена до начала эксперимента. Любая величина, на которую воздействие могло повлиять, вносит смещение — это главное и единственное жёсткое требование.',
          'The covariate is measured before the experiment starts. Any quantity the treatment could have affected introduces bias — that is the single hard requirement.',
        ),
        l(
          'theta считается на объединённых данных обеих групп, а не отдельно в каждой: отдельные theta подгоняют группы друг под друга и съедают часть эффекта.',
          'theta is computed on the pooled data of both groups rather than separately in each: separate thetas fit the groups to each other and eat part of the effect.',
        ),
        l(
          'Новые пользователи предпериода не имеют. Для них X берут нулевым или считают CUPED только на вернувшихся, явно оговаривая это в отчёте.',
          'New users have no pre-period. For them X is taken as zero, or CUPED is applied only to returning users, stated explicitly in the report.',
        ),
        l(
          'Метод не чинит плохой сплит и не заменяет проверку SRM. Он снижает шум, а не исправляет смещение.',
          'The method does not fix a bad split and does not replace the SRM check. It reduces noise, not bias.',
        ),
      ],
    },
    {
      type: 'p',
      text: l(
        'CUPED — частный случай более общей идеи: использовать известную до эксперимента информацию, чтобы объяснить часть разброса. Обобщения очевидны: вместо одной ковариаты — регрессия на несколько, вместо линейной модели — предсказание метрики моделью машинного обучения по предпериодным признакам. В литературе это называется CUPAC. Суть та же: чем лучше мы предсказываем поведение пользователя без учёта эксперимента, тем меньше остаточный шум.',
        'CUPED is a special case of a more general idea: use information known before the experiment to explain part of the spread. The generalisations are obvious: several covariates instead of one, or a machine-learned prediction of the metric from pre-period features instead of a linear model. The literature calls that CUPAC. The essence is the same: the better we predict a user\'s behaviour without reference to the experiment, the less residual noise remains.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ab.cuped.q-variance',
      mode: 'number',
      prompt: l(
        'Корреляция метрики с её значением за предпериод равна 0.6. На сколько процентов снизится дисперсия после CUPED? Ответ — целое число процентов.',
        'The correlation of the metric with its pre-period value is 0.6. By what percentage does the variance drop after CUPED? Answer as a whole number of percent.',
      ),
      value: 36,
      tolerance: 1,
      unit: l('%', '%'),
      explanation: l(
        'Остаётся 1 - rho² = 1 - 0.36 = 0.64 дисперсии, то есть снижение на 36%. Трафик требуется во столько же раз меньше, а MDE улучшается в корень из этого: 1/sqrt(0.64) = 1.25, то есть на 20%. Полезно помнить эту асимметрию: снижение дисперсии на 36% звучит внушительно, а детектируемый эффект уменьшается всего на пятую часть.',
        'What remains is 1 - rho² = 1 - 0.36 = 0.64 of the variance, i.e. a 36% drop. The traffic requirement falls by the same factor, while the MDE improves by its square root: 1/sqrt(0.64) = 1.25, i.e. by 20%. That asymmetry is worth remembering: a 36% variance reduction sounds impressive while the detectable effect only shrinks by a fifth.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.cuped.q-covariate',
      mode: 'multi',
      prompt: l(
        'Эксперимент идёт две недели, метрика — число заказов на пользователя. Какие ковариаты можно использовать для CUPED?',
        'An experiment runs for two weeks with orders per user as the metric. Which covariates may be used for CUPED?',
      ),
      choices: [
        {
          id: 'a',
          text: l('Число заказов того же пользователя за две недели до эксперимента', 'The same user\'s orders over the two weeks before the experiment'),
        },
        {
          id: 'b',
          text: l('Число заказов за первую неделю эксперимента', 'Orders during the first week of the experiment'),
        },
        {
          id: 'c',
          text: l('Платформа пользователя, известная до запуска', 'The user\'s platform, known before launch'),
        },
        {
          id: 'd',
          text: l(
            'Число сессий за месяц до эксперимента',
            'Number of sessions in the month before the experiment',
          ),
        },
      ],
      correct: ['a', 'c', 'd'],
      explanation: l(
        'Вариант b недопустим: первая неделя эксперимента уже под воздействием, и вычитание этой величины смещает оценку эффекта — фактически мы вычтем часть того, что пытаемся измерить. Платформа формально годится, но даёт слабое снижение дисперсии: это по сути стратификация по одной категориальной переменной. Лучшая ковариата — та же метрика за сопоставимый период до запуска, вариант a. Число сессий тоже работает, потому что коррелирует с заказами, хотя и слабее.',
        'Option b is not allowed: the first week of the experiment is already under treatment, and subtracting it biases the effect estimate — we would be subtracting part of what we are trying to measure. The platform is formally eligible but delivers weak variance reduction: it is essentially stratification on one categorical variable. The best covariate is the same metric over a comparable pre-launch period, option a. Session counts work too, because they correlate with orders, though more weakly.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ab.cuped.q-not-a-fix',
      mode: 'single',
      prompt: l(
        'В эксперименте обнаружен SRM: в тесте на 0.6% больше пользователей, p-value хи-квадрат около 1e-6. Аналитик предлагает применить CUPED, чтобы «выровнять группы по предпериодной активности». Что с этим не так?',
        'An experiment shows SRM: the test group has 0.6% more users with a chi-square p-value around 1e-6. An analyst proposes applying CUPED to "balance the groups on pre-period activity". What is wrong with that?',
      ),
      choices: [
        { id: 'a', text: l('Ничего, CUPED как раз для этого', 'Nothing, that is what CUPED is for') },
        {
          id: 'b',
          text: l(
            'CUPED снижает дисперсию, но не устраняет смещение: причина SRM останется, и результат доверия не заслуживает',
            'CUPED reduces variance but does not remove bias: the cause of the SRM remains and the result cannot be trusted',
          ),
        },
        { id: 'c', text: l('CUPED нельзя применять к конверсионным метрикам', 'CUPED cannot be applied to conversion metrics') },
        { id: 'd', text: l('Надо сначала увеличить выборку', 'The sample should be increased first') },
      ],
      correct: ['b'],
      explanation: l(
        'SRM означает, что часть пользователей потерялась или попала не в ту группу неслучайным образом. CUPED скорректирует метрику на известную предпериодную активность, но потерянные пользователи от этого не вернутся, а их отличие от оставшихся может быть любым. Более того, если потерялись именно пользователи без предпериода, CUPED создаст ложное ощущение, что группы выровнены. Правильный порядок действий: найти причину SRM, починить инструментацию, перезапустить.',
        'SRM means some users were lost or assigned to the wrong group in a non-random way. CUPED will adjust the metric for known pre-period activity, but the missing users do not come back, and how they differ from the remaining ones is unknown. Worse, if the users who vanished are precisely those without a pre-period, CUPED creates a false impression that the groups are balanced. The correct order is: find the cause of the SRM, fix the instrumentation, restart.',
      ),
    },
  ],

  sources: [
    {
      title: 'Kohavi, Tang, Xu — Trustworthy Online Controlled Experiments',
      url: 'https://experimentguide.com/',
      note: l('Глава про снижение дисперсии.', 'The chapter on variance reduction.'),
    },
    {
      title: "Ron Kohavi's paper archive (exp-platform)",
      url: 'https://exp-platform.com/',
      note: l('Исходная статья про CUPED.', 'The original CUPED paper.'),
    },
  ],
};
