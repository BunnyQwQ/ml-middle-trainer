import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sysdProduction: SkillNode = {
  id: 'sysd.production',
  branch: 'system-design',
  act: 5,
  tier: 3,
  title: l('Выкатка и жизнь модели в проде', 'Rollout and the model\'s life in production'),
  blurb: l(
    'Теневой режим, доли трафика, мониторинг сдвига и условие отката.',
    'Shadow mode, traffic shares, drift monitoring and the rollback condition.',
  ),
  requires: ['sysd.data'],
  theory: [
    {
      type: 'p',
      text: l(
        'Модель, которая выиграла оффлайн, — это примерно половина работы. Вторая половина начинается с вопроса, на который на собеседовании обычно не успевают ответить: что именно будет происходить в первые сутки после включения и по какому признаку ты поймёшь, что надо выключать. Хороший ответ формулируется заранее и числом, а не «будем смотреть на графики».',
        'A model that won offline is about half the work. The other half starts with a question interviews usually run out of time for: what exactly will happen in the first day after switching it on, and by what sign you will know to switch it off. A good answer is formulated in advance and as a number, not as "we will watch the dashboards".',
      ),
    },
    {
      type: 'list',
      ordered: true,
      items: [
        l(
          'Теневой режим: новая модель считает ответы, но они никому не показываются. Ловит падения, таймауты и расхождение распределения скоров с ожидаемым.',
          'Shadow mode: the new model computes answers that nobody sees. Catches crashes, timeouts and a score distribution that differs from the expected one.',
        ),
        l(
          'Маленькая доля трафика с заранее записанным условием отката. Не «если станет хуже», а «если guardrail упадёт больше чем на X с доверительным интервалом, выключаем».',
          'A small traffic share with a rollback condition written down in advance. Not "if it gets worse" but "if the guardrail drops by more than X with a confidence interval, we switch it off".',
        ),
        l(
          'Полноценный A/B на той доле, которая даёт нужную мощность по решающей метрике, а не по той, которую видно быстрее всего.',
          'A full A/B on the share that gives the needed power for the deciding metric, rather than for the one visible soonest.',
        ),
        l(
          'После раскатки — мониторинг входов, а не только выходов: распределение признаков уезжает раньше, чем проседает метрика.',
          'After the rollout — monitoring the inputs, not only the outputs: the feature distribution drifts before the metric sags.',
        ),
      ],
    },
    {
      type: 'sim',
      sim: 'model-decay',
      title: l('Деградация и частота переобучения', 'Decay and the retraining cadence'),
      caption: l(
        'Пила — качество с переобучением, пунктир — если не переобучать вовсе. Главная плашка последняя: сколько добавит переобучение вдвое чаще. Сдвинь частоту с 30 на 14 дней и с 7 на 3 и сравни прибавку — спор «давайте переобучать каждый день» решается именно этим числом, а не ощущениями.',
        'The sawtooth is quality with retraining, the dashed line is never retraining. The readout that matters is the last one: what retraining twice as often would add. Move the cadence from 30 to 14 days, then from 7 to 3, and compare the gains — the "let us retrain daily" argument is settled by that number rather than by feelings.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Сдвиг данных и падение качества — разные события, и путать их дорого. Распределение признаков может уехать без всякого вреда (пришёл новый трафик с другой платформы), а качество может упасть при неизменных входах (изменился ассортимент). Поэтому мониторят и то, и другое, но алерт на сдвиг — это повод посмотреть, а алерт на метрику — повод откатываться.',
        'Data drift and a quality drop are different events, and confusing them is expensive. The feature distribution can move with no harm at all (new traffic arrived from another platform), and quality can fall with unchanged inputs (the catalogue changed). So both are monitored, but a drift alert is a reason to look while a metric alert is a reason to roll back.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'python',
      id: 'sysd.production.py-psi',
      prompt: l(
        'Посчитай PSI (population stability index) между обучающим и продовым распределением. На вход два списка чисел и список возрастающих внутренних границ edges: значение попадает в корзину i, если оно меньше edges[i], и в последнюю корзину, если больше либо равно последней границе. PSI равен сумме по корзинам (a - e) * ln(a / e), где e и a — доли корзины. Пустые корзины заменяй долей 1e-6, иначе логарифм обратится в бесконечность.',
        'Compute the PSI (population stability index) between a training and a production distribution. The input is two lists of numbers and a list of increasing interior boundaries, edges: a value falls into bucket i if it is below edges[i], and into the last bucket if it is at or above the last boundary. PSI is the sum over buckets of (a - e) * ln(a / e), where e and a are the bucket shares. Replace an empty bucket\'s share with 1e-6, otherwise the logarithm goes to infinity.',
      ),
      signature: 'def psi(expected: list[float], actual: list[float], edges: list[float]) -> float:',
      starter: `def psi(expected, actual, edges):
    # TODO
    return 0.0
`,
      reference: `import math


def psi(expected, actual, edges):
    def shares(values):
        counts = [0] * (len(edges) + 1)
        for value in values:
            index = len(edges)
            for i, edge in enumerate(edges):
                if value < edge:
                    index = i
                    break
            counts[index] += 1
        total = len(values)
        return [c / total if total else 0.0 for c in counts]

    e_shares = shares(expected)
    a_shares = shares(actual)

    total = 0.0
    for e, a in zip(e_shares, a_shares):
        e = max(e, 1e-6)
        a = max(a, 1e-6)
        total += (a - e) * math.log(a / e)
    return total
`,
      sampleTests: `edges = [0.0, 1.0]
same = psi([-1.0, 0.5, 2.0], [-1.0, 0.5, 2.0], edges)
assert abs(same) < 1e-9, same
`,
      tests: `import math

edges = [0.0, 1.0, 2.0]
base = [-0.5, 0.5, 1.5, 2.5] * 25

# An identical distribution gives exactly zero.
assert abs(psi(base, base, edges)) < 1e-9

# PSI is symmetric in its two arguments.
shifted = [0.5, 1.5, 2.5, 2.5] * 25
a = psi(base, shifted, edges)
b = psi(shifted, base, edges)
assert abs(a - b) < 1e-9, (a, b)

# A real shift is far above the usual 0.2 alarm threshold.
assert a > 0.2, a

# A small shift stays small.
mild = [-0.5] * 24 + [0.5] * 26 + [1.5] * 25 + [2.5] * 25
assert 0 < psi(base, mild, edges) < 0.05

# An empty bucket must not produce an infinity.
value = psi([0.5] * 50, [-0.5] * 50, edges)
assert math.isfinite(value) and value > 1.0, value

# Buckets are half-open: the boundary value belongs to the bucket above it.
left = psi([0.0] * 10, [0.5] * 10, edges)
assert abs(left) < 1e-9, left
`,
      writeup: l(
        'PSI — самый частый индикатор сдвига просто потому, что он ничего не требует, кроме двух выборок и границ корзин. Два места, где его чаще всего ломают. Первое — пустая корзина: в проде появилось значение, которого не было в обучении, или наоборот, и наивная формула даёт деление на ноль или log(0); замена на малую долю делает метрику конечной, но заметно большой, и это правильное поведение — такое и должно быть алертом. Второе — границы корзин: их берут по обучающему распределению один раз и замораживают, иначе PSI сравнивает сам с собой и всегда близок к нулю. Пороги 0.1 и 0.2 — отраслевое соглашение, а не закон: калибруются по истории собственного сервиса.',
        'PSI is the most common drift indicator simply because it needs nothing but two samples and bucket boundaries. Two places where it usually breaks. First, an empty bucket: production produced a value absent from training or the other way round, and the naive formula divides by zero or takes log(0); replacing the share with a small number keeps the metric finite but noticeably large, which is the right behaviour — that is exactly what should alert. Second, the boundaries: they are taken from the training distribution once and frozen, otherwise PSI compares a sample with itself and stays near zero forever. The 0.1 and 0.2 thresholds are an industry convention rather than a law: calibrate them on your own service\'s history.',
      ),
    },
    {
      kind: 'sql',
      id: 'sysd.production.sql-monitor',
      prompt: l(
        'Собери ежедневный мониторинг качества выдачи. Для каждого дня верни дату day, число запросов хотя бы с одним кликом clicked_queries и среднюю лучшую кликнутую позицию avg_first_position (минимальная позиция среди кликнутых документов запроса), округлённую до трёх знаков. Запросы без кликов в расчёт не входят. Сортировка по дате по возрастанию.',
        'Build a daily quality monitor. For each day return the date as day, the number of queries with at least one click as clicked_queries, and the average best clicked position as avg_first_position (the minimum position among the query\'s clicked documents), rounded to three decimals. Queries without clicks are excluded. Sort by date ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `SELECT
  CAST(q.ts AS DATE) AS day
FROM queries q
GROUP BY 1
ORDER BY 1`,
      reference: `WITH first_click AS (
  SELECT i.query_id, min(i.position) AS pos
  FROM impressions i
  JOIN clicks c ON c.impression_id = i.impression_id
  GROUP BY i.query_id
)
SELECT
  CAST(q.ts AS DATE) AS day,
  count(*) AS clicked_queries,
  round(avg(f.pos), 3) AS avg_first_position
FROM queries q
JOIN first_click f ON f.query_id = q.query_id
GROUP BY 1
ORDER BY 1`,
      orderMatters: true,
      writeup: l(
        'Средняя лучшая кликнутая позиция — дешёвый и на удивление чувствительный индикатор здоровья ранжирования: если модель стала хуже, нужный документ съезжает вниз, и это видно раньше, чем просядут заказы. Но у метрики есть обратная сторона, из-за которой её нельзя делать решающей: она улучшается, если показывать меньше документов или если выдача стала настолько однообразной, что пользователь кликает первое попавшееся. Поэтому в мониторинге она идёт в паре с числом запросов с кликом: позиция вниз при стабильном числе кликнутых запросов — хороший знак, позиция вниз при падении числа — признак, что часть пользователей просто перестала кликать. Внутренний JOIN здесь не упущение, а требование условия: запросы без кликов не должны попадать в среднее, иначе придётся решать, какой позицией их считать, а любой ответ на этот вопрос будет произволом.',
        'The average best clicked position is a cheap and surprisingly sensitive health indicator for ranking: when the model gets worse the needed document slides down, and that shows before orders sag. But it has a flip side that stops it being the deciding metric: it improves if fewer documents are shown, or if results became so uniform that users click whatever comes first. So in monitoring it travels paired with the number of clicked queries: the position falling while the clicked-query count holds is a good sign, the position falling while the count drops means some users simply stopped clicking. The inner JOIN here is not an oversight but the statement\'s requirement: queries without clicks must stay out of the average, otherwise you have to decide what position to assign them, and any answer to that is arbitrary.',
      ),
      clickhouse: {
        code: `WITH first_click AS (
  SELECT i.query_id AS query_id, min(i.position) AS pos
  FROM impressions AS i
  INNER JOIN clicks AS c ON c.impression_id = i.impression_id
  GROUP BY i.query_id
)
SELECT
  toDate(q.ts) AS day,
  count() AS clicked_queries,
  round(avg(f.pos), 3) AS avg_first_position
FROM queries AS q
INNER JOIN first_click AS f ON f.query_id = q.query_id
GROUP BY day
ORDER BY day`,
        note: l(
          'В ClickHouse такой мониторинг обычно живёт не запросом по сырым логам, а материализованным представлением, которое досчитывает агрегат на вставке: по дням данных слишком много, чтобы пересчитывать их каждый раз при открытии дашборда.',
          'In ClickHouse a monitor like this usually lives not as a query over raw logs but as a materialised view that maintains the aggregate on insert: there is far too much daily data to recompute every time a dashboard is opened.',
        ),
      },
    },
    {
      kind: 'quiz',
      id: 'sysd.production.q-alert',
      mode: 'single',
      prompt: l(
        'Новая модель раскатана на 5% трафика. За первый час PSI по одному из признаков вырос с 0.02 до 0.35, решающая метрика не изменилась, задержка в норме. Что делать?',
        'A new model is live on 5% of traffic. In the first hour the PSI of one feature grew from 0.02 to 0.35, the deciding metric is unchanged and latency is fine. What do you do?',
      ),
      choices: [
        {
          id: 'rollback',
          text: l('Немедленно откатывать: PSI выше 0.2', 'Roll back immediately: PSI is above 0.2'),
        },
        {
          id: 'investigate',
          text: l(
            'Не откатывать, но разобраться: проверить, не сломался ли сбор этого признака',
            'Do not roll back, but investigate: check whether that feature\'s collection broke',
          ),
        },
        {
          id: 'ignore',
          text: l('Игнорировать: решающая метрика не изменилась', 'Ignore it: the deciding metric is unchanged'),
        },
        {
          id: 'retrain',
          text: l('Запустить переобучение на свежих данных', 'Kick off retraining on fresh data'),
        },
      ],
      correct: ['investigate'],
      explanation: l(
        'Скачок PSI за час — это почти наверняка не дрейф поведения пользователей, а поломка: признак перестал приходить и заполнился дефолтом, поменялась единица измерения, уехал формат. Дрейф так быстро не бывает. Откатывать поспешно не нужно — решающая метрика цела, а значит пользователям пока не хуже; но и игнорировать нельзя, потому что метрика отреагирует позже, когда ущерб уже накопится. Переобучение — худший вариант: если признак сломан, переобучение зафиксирует поломку в весах модели. Правильная последовательность — посмотреть на сырые значения признака, сравнить с источником и только потом решать.',
        'A PSI jump within an hour is almost certainly not a drift in user behaviour but a breakage: the feature stopped arriving and got filled with a default, a unit changed, a format moved. Drift does not happen that fast. Rolling back in a hurry is unnecessary — the deciding metric is intact, so users are not worse off yet; but ignoring it is not an option either, because the metric will react later, once the damage has accumulated. Retraining is the worst choice: if the feature is broken, retraining bakes the breakage into the weights. The right order is to look at the raw feature values, compare them with the source, and only then decide.',
      ),
    },
    {
      kind: 'case',
      id: 'sysd.production.case-rollout',
      prompt: l(
        'Твоя модель ранжирования выиграла оффлайн: nDCG@10 вырос на 3%. Напиши план выкатки: этапы и доли трафика, что измеряешь на каждом, какое условие отката записано заранее (числом), что мониторишь после полной раскатки и с какой периодичностью планируешь переобучение. Отдельно напиши, какой результат A/B заставит тебя не выкатывать модель, несмотря на выигрыш оффлайн.',
        'Your ranking model won offline: nDCG@10 is up 3%. Write the rollout plan: the stages and traffic shares, what you measure at each, the rollback condition written down in advance as a number, what you monitor after the full rollout, and how often you plan to retrain. Separately, write what A/B outcome would stop you shipping despite the offline win.',
      ),
      reference: l(
        'Этап ноль — теневой режим на сутки: новая модель считает ответы на реальном трафике, но они не показываются. Смотрю на долю ошибок и таймаутов, на p99 времени ответа и на распределение скоров — если оно заметно отличается от обучающего, дальше идти нельзя, это обычно означает расхождение признаков между обучением и инференсом. Пользовательских метрик здесь нет по построению.\n\nЭтап один — 1% трафика на сутки с записанным условием отката: откатываемся, если доля запросов без клика в топ-10 вырастет более чем на 2% относительно контроля, либо p99 задержки превысит бюджет, либо вырастет доля ошибок. Условие записано до выкатки именно числом, иначе в момент инцидента начнётся спор, считать ли это ухудшением.\n\nЭтап два — A/B на доле, которая даёт мощность 80% по решающей метрике: считаю нужный размер заранее из исторической дисперсии заказов на пользователя. Обычно это заметно больше 5%, и это нормально: интерливинг дешевле, но заказы он не измеряет. Длительность — не меньше двух недель, чтобы покрыть недельную сезонность и пережить эффект новизны.\n\nПосле раскатки мониторю вход и выход раздельно: PSI по ключевым признакам с замороженными границами, долю дефолтных значений признаков, распределение скоров, среднюю лучшую кликнутую позицию по дням и решающую метрику понедельно. Алерт на сдвиг — повод посмотреть, алерт на метрику — повод откатываться. Переобучение начинаю с двух недель и калибрую по измеренной скорости деградации: если прибавка от удвоения частоты уходит в третий знак, учащать не стоит.\n\nНе выкачу, несмотря на оффлайн, если решающая метрика не выросла, а ограничитель просел: например, заказы на пользователя в нуле, а доля рекламных кликов выросла — значит выигрыш nDCG достался перераспределением внимания, а не улучшением поиска. Второй случай — эффект новизны: прирост в первые три дня и возврат к нулю к концу второй недели. Третий — метрика выросла в среднем, но упала на мобильных или на длинных запросах: средний плюс при провале в крупном сегменте почти всегда означает, что модель выучила один тип трафика за счёт другого.',
        'Stage zero is shadow mode for a day: the new model computes answers on real traffic that nobody sees. I watch the error and timeout rate, p99 latency, and the score distribution — if it differs noticeably from training, we go no further, as that usually means a train-serving feature skew. There are no user metrics here by construction.\n\nStage one is 1% of traffic for a day with the rollback condition written down: we roll back if the share of queries with no click in the top 10 grows by more than 2% relative to control, or p99 latency exceeds the budget, or the error rate rises. The condition is written as a number before the rollout, otherwise an incident turns into an argument about whether this counts as "worse".\n\nStage two is an A/B on the share that gives 80% power for the deciding metric: I compute the needed size in advance from the historical variance of orders per user. It is usually well above 5%, and that is fine — interleaving is cheaper but does not measure orders. The duration is at least two weeks, to cover weekly seasonality and outlive the novelty effect.\n\nAfter the full rollout I monitor inputs and outputs separately: PSI on the key features with frozen boundaries, the share of default feature values, the score distribution, the average best clicked position daily, and the deciding metric weekly. A drift alert is a reason to look; a metric alert is a reason to roll back. I start retraining at a two-week cadence and calibrate it against the measured decay: if doubling the frequency adds something in the third decimal, it is not worth tightening.\n\nI would not ship despite the offline win if the deciding metric is flat while a guardrail sags: say orders per user at zero while the share of ad clicks grows — then the nDCG gain came from redistributing attention rather than from better search. The second case is a novelty effect: a lift in the first three days returning to zero by the end of the second week. The third is a metric up on average but down on mobile or on long queries: an average gain with a large segment losing almost always means the model learned one kind of traffic at the expense of another.',
      ),
      checklist: [
        l('Теневой режим до любого показа пользователям.', 'Shadow mode before anything is shown to users.'),
        l(
          'Условие отката записано заранее и числом, а не словом «хуже».',
          'The rollback condition is written in advance as a number, not as the word "worse".',
        ),
        l(
          'Размер A/B посчитан от мощности по решающей метрике, а не выбран круглым числом.',
          'The A/B size comes from power for the deciding metric rather than from a round number.',
        ),
        l(
          'Длительность покрывает недельную сезонность и эффект новизны.',
          'The duration covers weekly seasonality and the novelty effect.',
        ),
        l(
          'Мониторинг входов и выходов разделён, реакция на них разная.',
          'Input and output monitoring are separated, with different reactions.',
        ),
        l(
          'Частота переобучения обоснована измеренной деградацией.',
          'The retraining cadence is justified by measured decay.',
        ),
        l(
          'Назван случай, когда оффлайн-выигрыш не превращается в выкатку.',
          'Named a case where the offline win does not turn into a rollout.',
        ),
        l(
          'Упомянута проверка по сегментам, а не только среднее.',
          'Mentioned checking by segment rather than the average alone.',
        ),
      ],
      writeup: l(
        'Этот кейс почти целиком состоит из того, что люди знают по отдельности и не соединяют: мощность из ветки A/B, эффект новизны и сезонность оттуда же, сегменты из классификации, сдвиг из этого узла. Сильный ответ отличается не количеством этапов, а наличием чисел: доля трафика, порог отката, длительность. План без чисел невозможно исполнить в три часа ночи, а именно тогда он и нужен.',
        'This case consists almost entirely of things people know separately and never connect: power from the A/B branch, novelty and seasonality from the same place, segments from classification, drift from this node. A strong answer differs not in the number of stages but in having numbers: the traffic share, the rollback threshold, the duration. A plan without numbers cannot be executed at three in the morning, which is exactly when it is needed.',
      ),
    },
  ],

  sources: [
    {
      title: 'Google: Rules of Machine Learning',
      url: 'https://developers.google.com/machine-learning/guides/rules-of-ml',
      note: l(
        'Правила про мониторинг и про train/serving skew.',
        'The rules on monitoring and on train/serving skew.',
      ),
    },
  ],
};
