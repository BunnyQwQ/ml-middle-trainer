import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const miniDlQuiz: SkillNode = {
  id: 'mini.dl-quiz',
  branch: 'mini',
  act: 4,
  tier: 2,
  title: l('Десять вопросов по DL', 'Ten questions on deep learning'),
  blurb: l(
    'Активации, инициализация, нормализации, оптимизаторы. Один квиз, без углубления.',
    'Activations, initialisation, normalisation, optimisers. One quiz, no depth.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 5,
  theory: [
    {
      type: 'p',
      text: l(
        'Короткая проверка базы, которую спрашивают почти на каждом собеседовании по DL. Это не ветка с теорией, а десять вопросов: если на каком-то запнулся — там и стоит почитать подробнее отдельно.',
        'A short check of the basics asked at nearly every deep learning interview. This is not a branch with theory but ten questions: whichever one you stumble on is where to read further on your own.',
      ),
    },
    {
      type: 'sim',
      sim: 'activations',
      title: l('Активации и их производные', 'Activations and their derivatives'),
      caption: l(
        'Пунктир — производная, и именно она определяет, выживет ли градиент. Поставь сигмоиду и глубину 10: множитель градиента через сеть около 10⁻⁷. Переключи на ReLU — единица. Отдельно посмотри LeakyReLU(1): прямая линия и производная единица всюду, потому что это тождественная функция.',
        'The dashed line is the derivative, and it alone decides whether the gradient survives. Set sigmoid and depth 10: the gradient factor through the network is around 10⁻⁷. Switch to ReLU — one. Look separately at LeakyReLU(1): a straight line with a derivative of one everywhere, because it is the identity.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q1-relu',
      mode: 'single',
      prompt: l(
        'Почему ReLU вытеснила сигмоиду в скрытых слоях?',
        'Why did ReLU displace sigmoid in hidden layers?',
      ),
      choices: [
        { id: 'a', text: l('Она быстрее считается', 'It is faster to compute') },
        {
          id: 'b',
          text: l(
            'У сигмоиды производная не больше 0.25, и через десяток слоёв градиент затухает до нуля',
            'The sigmoid derivative never exceeds 0.25, so over a dozen layers the gradient vanishes',
          ),
        },
        { id: 'c', text: l('Сигмоида не дифференцируема', 'Sigmoid is not differentiable') },
        { id: 'd', text: l('ReLU даёт выход в диапазоне [0, 1]', 'ReLU outputs in the range [0, 1]') },
      ],
      correct: ['b'],
      explanation: l(
        'Скорость — приятный бонус, но не причина. Главное в производной: у сигмоиды максимум 0.25 в нуле и экспоненциальное убывание к краям, поэтому произведение производных по слоям уходит в ноль, и нижние слои перестают получать сигнал. У ReLU производная равна единице на всей положительной полуоси, и градиент проходит без затухания. Цена — мёртвые нейроны: при отрицательном входе производная ноль, и нейрон может никогда не ожить, ради чего и придумали LeakyReLU.',
        'Speed is a pleasant bonus but not the reason. What matters is the derivative: sigmoid peaks at 0.25 at zero and decays exponentially towards the edges, so the product of per-layer derivatives goes to zero and the lower layers stop receiving signal. ReLU has a derivative of one across the whole positive half-line and the gradient passes undamped. The price is dead units: at a negative input the derivative is zero and a unit may never revive, which is what LeakyReLU was invented for.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q2-leaky1',
      mode: 'single',
      prompt: l(
        'Что делает nn.LeakyReLU(1.0) между двумя линейными слоями?',
        'What does nn.LeakyReLU(1.0) do between two linear layers?',
      ),
      choices: [
        { id: 'a', text: l('Работает как обычная LeakyReLU', 'Works like an ordinary LeakyReLU') },
        {
          id: 'b',
          text: l(
            'Ничего: это тождественная функция, и два слоя схлопываются в один линейный',
            'Nothing: it is the identity, and the two layers collapse into one linear map',
          ),
        },
        { id: 'c', text: l('Удваивает градиент', 'Doubles the gradient') },
        { id: 'd', text: l('Вызывает исключение', 'Raises an exception') },
      ],
      correct: ['b'],
      explanation: l(
        'LeakyReLU с коэффициентом a возвращает x при x > 0 и a·x иначе. При a = 1 обе ветки дают x, то есть функция тождественна, а композиция линейных отображений остаётся линейной. Код запускается, обучается и выдаёт разумный лосс — поэтому ошибка и живёт долго. Типичное значение коэффициента 0.01, и всё, что заметно ближе к единице, стоит считать подозрительным.',
        'LeakyReLU with slope a returns x for x > 0 and a·x otherwise. At a = 1 both branches give x, so the function is the identity and a composition of linear maps stays linear. The code runs, trains and reports a reasonable loss — which is why the bug survives. The typical slope is 0.01, and anything noticeably closer to one deserves suspicion.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q3-init',
      mode: 'single',
      prompt: l(
        'Зачем веса инициализируют случайно, а не нулями?',
        'Why are weights initialised at random rather than at zero?',
      ),
      choices: [
        { id: 'a', text: l('Чтобы быстрее сходилось', 'To converge faster') },
        {
          id: 'b',
          text: l(
            'Чтобы сломать симметрию: одинаковые веса получают одинаковый градиент и остаются одинаковыми',
            'To break the symmetry: identical weights receive identical gradients and stay identical',
          ),
        },
        { id: 'c', text: l('Так требует backpropagation', 'Backpropagation requires it') },
        { id: 'd', text: l('Чтобы избежать переобучения', 'To avoid overfitting') },
      ],
      correct: ['b'],
      explanation: l(
        'При одинаковой инициализации все нейроны слоя вычисляют одно и то же, получают один и тот же градиент и обновляются одинаково — навсегда. Слой из ста таких нейронов по выразительности равен одному. Это верно не только для нулей, а для любой константы. Смещения при этом нулями инициализировать можно и нужно: симметрию ломают веса.',
        'With identical initialisation every unit in a layer computes the same thing, receives the same gradient and updates identically — forever. A layer of a hundred such units has the expressive power of one. This holds not only for zeros but for any constant. Biases, on the other hand, may and should be initialised at zero: it is the weights that break the symmetry.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q4-he-xavier',
      mode: 'single',
      prompt: l(
        'Чем инициализация He отличается от Xavier и когда какая нужна?',
        'How does He initialisation differ from Xavier, and when is each needed?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'He рассчитана на ReLU и даёт вдвое большую дисперсию, Xavier — на симметричные активации вроде tanh',
            'He targets ReLU and gives twice the variance; Xavier targets symmetric activations such as tanh',
          ),
        },
        { id: 'b', text: l('He для свёрток, Xavier для полносвязных слоёв', 'He is for convolutions, Xavier for dense layers') },
        { id: 'c', text: l('Это одно и то же под разными именами', 'They are the same thing under different names') },
        { id: 'd', text: l('He для маленьких сетей, Xavier для больших', 'He is for small networks, Xavier for large ones') },
      ],
      correct: ['a'],
      explanation: l(
        'Обе схемы подбирают дисперсию весов так, чтобы дисперсия активаций не росла и не затухала от слоя к слою. Разница в том, что ReLU обнуляет половину значений и тем самым вдвое уменьшает дисперсию выхода — He компенсирует это множителем 2 в числителе. Для tanh и сигмоиды, которые симметричны относительно нуля, такой поправки не нужно, и работает Xavier. Ошибиться не смертельно: при неправильном выборе сеть обычно всё равно обучится, просто медленнее и хуже на большой глубине.',
        'Both schemes pick the weight variance so that activation variance neither grows nor shrinks from layer to layer. The difference is that ReLU zeroes half the values and thereby halves the output variance — He compensates with a factor of 2 in the numerator. For tanh and sigmoid, which are symmetric about zero, no such correction is needed and Xavier applies. Getting it wrong is not fatal: with the wrong choice the network usually still trains, just more slowly and worse at depth.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q5-bn-inference',
      mode: 'single',
      prompt: l(
        'Что использует BatchNorm на инференсе, когда батча нет?',
        'What does BatchNorm use at inference time, when there is no batch?',
      ),
      choices: [
        { id: 'a', text: l('Статистики текущего батча из одного объекта', 'The statistics of the current batch of one object') },
        {
          id: 'b',
          text: l(
            'Бегущие среднее и дисперсию, накопленные во время обучения',
            'The running mean and variance accumulated during training',
          ),
        },
        { id: 'c', text: l('Ничего не нормализует', 'It normalises nothing') },
        { id: 'd', text: l('Статистики обучающей выборки, пересчитанные заново', 'Training set statistics recomputed from scratch') },
      ],
      correct: ['b'],
      explanation: l(
        'Во время обучения BatchNorm нормализует по статистикам батча и параллельно копит скользящие средние. В режиме eval он переключается на них, поэтому результат перестаёт зависеть от того, с кем объект попал в один батч. Практическое следствие, на котором ловятся все: забытый model.eval() означает, что на инференсе используются статистики случайного батча, и предсказания для одного и того же объекта меняются от запуска к запуску. Тот же вызов отключает и dropout.',
        'During training BatchNorm normalises by batch statistics while accumulating running averages. In eval mode it switches to those, so the result stops depending on who shared a batch with the object. The practical consequence everyone gets caught by: a forgotten model.eval() means inference uses the statistics of a random batch, and predictions for the same object change from run to run. The same call also disables dropout.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q6-layernorm',
      mode: 'multi',
      prompt: l(
        'Почему в трансформерах используют LayerNorm, а не BatchNorm?',
        'Why do transformers use LayerNorm rather than BatchNorm?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'LayerNorm нормализует по признакам одного объекта и не зависит от размера батча',
            'LayerNorm normalises over the features of one object and does not depend on batch size',
          ),
        },
        {
          id: 'b',
          text: l(
            'Последовательности разной длины делают батч-статистики нестабильными',
            'Sequences of different lengths make batch statistics unstable',
          ),
        },
        {
          id: 'c',
          text: l('LayerNorm быстрее считается', 'LayerNorm is faster to compute'),
        },
        {
          id: 'd',
          text: l(
            'При инференсе по одному объекту BatchNorm опирается на накопленные статистики, а LayerNorm работает одинаково всегда',
            'At inference on a single object BatchNorm leans on accumulated statistics while LayerNorm behaves identically always',
          ),
        },
      ],
      correct: ['a', 'b', 'd'],
      explanation: l(
        'Главное отличие в оси нормализации: BatchNorm усредняет по объектам батча, LayerNorm — по признакам внутри объекта. Отсюда всё остальное: независимость от размера батча, устойчивость при переменной длине последовательности и одинаковое поведение на обучении и инференсе. По скорости LayerNorm не выигрывает, а на маленьких тензорах может быть даже чуть дороже, потому что считает статистики на каждый объект отдельно.',
        'The key difference is the axis of normalisation: BatchNorm averages across the objects of a batch, LayerNorm across the features inside one object. Everything else follows: independence from batch size, robustness to variable sequence length and identical behaviour in training and inference. LayerNorm is not faster, and on small tensors it can even cost slightly more, because it computes statistics per object.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q7-adam',
      mode: 'single',
      prompt: l(
        'Что Adam делает такого, чего не делает SGD с моментом?',
        'What does Adam do that SGD with momentum does not?',
      ),
      choices: [
        { id: 'a', text: l('Использует момент', 'Uses momentum') },
        {
          id: 'b',
          text: l(
            'Нормирует шаг на оценку второго момента, то есть у каждого параметра свой эффективный learning rate',
            'Scales the step by an estimate of the second moment, giving each parameter its own effective learning rate',
          ),
        },
        { id: 'c', text: l('Гарантирует сходимость к глобальному минимуму', 'Guarantees convergence to a global minimum') },
        { id: 'd', text: l('Не требует выбора learning rate', 'Removes the need to choose a learning rate') },
      ],
      correct: ['b'],
      explanation: l(
        'Момент есть и у SGD. Отличие Adam в делении на корень из скользящего среднего квадратов градиента: параметры с большими градиентами получают меньший шаг, с маленькими — больший. Это и делает его устойчивым к плохо отмасштабированным признакам и разреженным градиентам. Learning rate выбирать всё равно надо, просто Adam менее чувствителен к его величине. На зрении хорошо настроенный SGD с моментом до сих пор нередко обгоняет Adam по финальному качеству, так что «Adam всегда лучше» — неверно.',
        'SGD has momentum too. What sets Adam apart is dividing by the square root of a running average of squared gradients: parameters with large gradients get a smaller step and those with small ones a larger step. That is what makes it robust to badly scaled features and sparse gradients. A learning rate still has to be chosen; Adam is merely less sensitive to its value. In vision a well-tuned SGD with momentum still often beats Adam on final quality, so "Adam is always better" is false.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q8-adamw',
      mode: 'single',
      prompt: l(
        'Чем AdamW отличается от Adam с weight_decay?',
        'How does AdamW differ from Adam with weight_decay?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'В Adam регуляризация добавляется к градиенту и потому делится на адаптивный масштаб; AdamW вычитает её из весов напрямую',
            'In Adam the penalty is added to the gradient and so gets divided by the adaptive scale; AdamW subtracts it from the weights directly',
          ),
        },
        { id: 'b', text: l('AdamW быстрее', 'AdamW is faster') },
        { id: 'c', text: l('Ничем, это псевдоним', 'Nothing, it is an alias') },
        { id: 'd', text: l('AdamW не использует момент', 'AdamW does not use momentum') },
      ],
      correct: ['a'],
      explanation: l(
        'В классическом Adam weight decay реализован как L2-штраф, добавленный к градиенту, — и дальше этот вклад тоже делится на корень из второго момента. В результате сила регуляризации оказывается разной для разных параметров и зависит от истории градиентов, что явно не то, чего хотели. AdamW отвязывает затухание весов от адаптивного масштаба и вычитает его отдельным шагом. Практическая разница заметна: на трансформерах AdamW стал стандартом именно поэтому.',
        'In classic Adam weight decay is implemented as an L2 penalty added to the gradient — and that contribution then also gets divided by the square root of the second moment. The strength of the regularisation therefore differs between parameters and depends on gradient history, which is plainly not what was intended. AdamW decouples weight decay from the adaptive scale and subtracts it in a separate step. The practical difference is visible: this is exactly why AdamW became the standard for transformers.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q9-warmup',
      mode: 'single',
      prompt: l(
        'Зачем нужен warmup — постепенный рост learning rate в начале обучения?',
        'What is warmup — a gradual increase of the learning rate at the start — for?',
      ),
      choices: [
        { id: 'a', text: l('Чтобы сэкономить вычисления на первых шагах', 'To save compute on the first steps') },
        {
          id: 'b',
          text: l(
            'В начале оценки моментов у адаптивных оптимизаторов шумные, и большой шаг по ним уводит веса куда попало',
            'Early on the moment estimates of an adaptive optimiser are noisy, and a large step along them throws the weights anywhere',
          ),
        },
        { id: 'c', text: l('Чтобы избежать переобучения', 'To avoid overfitting') },
        { id: 'd', text: l('Это требование BatchNorm', 'It is a BatchNorm requirement') },
      ],
      correct: ['b'],
      explanation: l(
        'На первых шагах скользящие средние градиента и его квадрата построены по нескольким наблюдениям и сильно шумят, а у Adam шаг делится на корень из второго момента — при маленькой и случайной оценке знаменателя шаг получается огромным. Несколько таких шагов способны увести веса в область, откуда обучение уже не восстанавливается. Warmup начинает с почти нулевого learning rate и выводит его на рабочий за несколько сотен или тысяч шагов. На больших батчах и трансформерах без него обучение часто просто расходится.',
        'In the first steps the running averages of the gradient and its square are built from a handful of observations and are very noisy, while Adam divides the step by the square root of the second moment — with a small, random denominator the step comes out enormous. A few such steps can push the weights into a region training never recovers from. Warmup starts at a near-zero learning rate and ramps it to the working value over a few hundred or thousand steps. With large batches and transformers, training often simply diverges without it.',
      ),
    },
    {
      kind: 'quiz',
      id: 'mini.dl-quiz.q10-dropout',
      mode: 'single',
      prompt: l(
        'Что происходит с dropout на инференсе?',
        'What happens to dropout at inference time?',
      ),
      choices: [
        { id: 'a', text: l('Продолжает случайно обнулять нейроны', 'It keeps zeroing units at random') },
        {
          id: 'b',
          text: l(
            'Отключается, а активации масштабируются так, чтобы матожидание совпадало с обучением',
            'It switches off, and activations are scaled so the expectation matches training',
          ),
        },
        { id: 'c', text: l('Обнуляет половину нейронов детерминированно', 'It zeroes half the units deterministically') },
        { id: 'd', text: l('Применяется только к последнему слою', 'It applies only to the last layer') },
      ],
      correct: ['b'],
      explanation: l(
        'На инференсе dropout выключен, иначе предсказания были бы случайными. Чтобы матожидание активаций совпадало с тем, что видела сеть при обучении, нужен множитель: в современных реализациях применяется inverted dropout, то есть деление на вероятность сохранения прямо во время обучения, а на инференсе не делается ничего. Переключает режим вызов model.eval() — тот же, что переводит BatchNorm на накопленные статистики. Забытый eval даёт одновременно случайный dropout и неправильную нормализацию, и это, пожалуй, самая частая причина расхождения качества между валидацией и продом.',
        'At inference dropout is off, otherwise the predictions would be random. For the expectation of the activations to match what the network saw during training a factor is needed: modern implementations use inverted dropout, dividing by the keep probability during training so that nothing has to be done at inference. The mode is switched by model.eval() — the same call that puts BatchNorm on its accumulated statistics. A forgotten eval gives random dropout and wrong normalisation at once, and that is probably the most common reason validation and production quality diverge.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Vanishing gradient problem',
      url: 'https://en.wikipedia.org/wiki/Vanishing_gradient_problem',
    },
    {
      title: 'Wikipedia: Batch normalization',
      url: 'https://en.wikipedia.org/wiki/Batch_normalization',
    },
  ],
};
