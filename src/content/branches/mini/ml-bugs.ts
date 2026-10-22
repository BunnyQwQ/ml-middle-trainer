import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const miniMlBugs: SkillNode = {
  id: 'mini.ml-bugs',
  branch: 'mini',
  act: 4,
  tier: 1,
  title: l('Три бага в ML-коде', 'Three bugs in ML code'),
  blurb: l(
    'Ровно три штуки: мнимая нелинейность, нулевая инициализация и утечка таргета.',
    'Exactly three: a fake non-linearity, zero initialisation and target leakage.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 5,
  theory: [
    {
      type: 'p',
      text: l(
        'Три ошибки ниже объединяет одно свойство: код с ними запускается, обучается и выдаёт правдоподобные числа. Ни одна не падает с исключением, и поэтому все три живут в репозиториях месяцами. Это короткая ветка на три задачи — пощупать и запомнить, как они выглядят.',
        'The three mistakes below share one property: the code runs, trains and produces plausible numbers. None of them raises an exception, which is why all three survive in repositories for months. This is a short branch of three tasks — enough to see them and remember what they look like.',
      ),
    },
    {
      type: 'sim',
      sim: 'init-symmetry',
      title: l('Почему веса инициализируют случайно', 'Why weights are initialised at random'),
      caption: l(
        'Четыре нейрона одного слоя во время обучения. При нулевой инициализации все четыре линии лежат друг на друге и никогда не расходятся: одинаковые веса получают одинаковый градиент. Переключи на случайную — линии разъезжаются с первого шага. Это не про «удачный старт», а про то, что без разной инициализации слой из ста нейронов эквивалентен одному.',
        'Four units of one layer during training. With zero initialisation all four lines lie on top of each other and never separate: identical weights receive identical gradients. Switch to random and they diverge from the first step. This is not about a "lucky start" but about the fact that without differing initialisation a layer of a hundred units is equivalent to one.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'findbug',
      id: 'mini.ml-bugs.no-nonlinearity',
      lang: 'python',
      prompt: l(
        'Энкодер обучается, лосс падает, но качество не отличается от линейной модели. Укажи строку, из-за которой вся эта конструкция эквивалентна одному линейному слою.',
        'The encoder trains, the loss falls, and the quality matches a linear model. Point at the line that makes this whole construction equivalent to a single linear layer.',
      ),
      code: `import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, 256),
            nn.Linear(256, 128),
            nn.LeakyReLU(1.0),
            nn.Linear(128, 64),
        )

    def forward(self, x):
        return self.net(x)`,
      buggyLines: [9, 10],
      explanation: l(
        'Строка 9 — два линейных слоя подряд без активации между ними: композиция двух линейных отображений это снова линейное отображение, и 256 промежуточных нейронов не добавляют ничего, кроме времени обучения. Строка 10 — более изощрённый вариант той же ошибки: LeakyReLU с коэффициентом 1.0 возвращает x при x > 0 и 1.0 · x при x <= 0, то есть ровно x. Это тождественная функция, записанная как активация, и слой с ней линеен. В итоге вся сеть из четырёх модулей эквивалентна одному nn.Linear(dim, 64). Признак, по которому это ловится на ревью: между каждой парой Linear обязана стоять настоящая нелинейность, и у LeakyReLU коэффициент по смыслу должен быть заметно меньше единицы — типично 0.01.',
        'Line 9 is two linear layers in a row with no activation between them: the composition of two linear maps is again a linear map, and the 256 intermediate units add nothing but training time. Line 10 is a subtler version of the same mistake: LeakyReLU with a slope of 1.0 returns x for x > 0 and 1.0 · x for x <= 0, which is exactly x. It is the identity written as an activation, and a layer using it is linear. The whole four-module network is therefore equivalent to one nn.Linear(dim, 64). The review heuristic that catches this: every pair of Linear layers must have a real non-linearity between them, and the slope of a LeakyReLU should by its meaning be well below one — typically 0.01.',
      ),
    },
    {
      kind: 'findbug',
      id: 'mini.ml-bugs.zero-init',
      lang: 'python',
      prompt: l(
        'Классификационная голова не учится: все классы получают одинаковую вероятность, сколько ни обучай. Укажи строку с причиной.',
        'The classification head does not learn: every class gets the same probability however long you train. Point at the line responsible.',
      ),
      code: `import torch.nn as nn


def build_head(dim, classes):
    layer = nn.Linear(dim, classes)
    nn.init.zeros_(layer.weight)
    nn.init.zeros_(layer.bias)
    return nn.Sequential(layer, nn.Softmax(dim=-1))`,
      buggyLines: [6],
      explanation: l(
        'Нулевая инициализация весов убивает симметрию между выходами: все строки матрицы одинаковы, значит все логиты равны, значит градиенты по всем строкам тоже одинаковы, и строки остаются равными после любого числа шагов. Сеть навсегда выдаёт равномерное распределение по классам. Инициализация нулями именно bias, в строке 7, совершенно нормальна и широко применяется: смещение одинаковым быть может, потому что симметрию ломают веса. Правильный вариант для строки 6 — любая случайная инициализация, по умолчанию в PyTorch это уже сделано, так что достаточно просто не трогать веса. Симулятор выше показывает тот же эффект на четырёх нейронах: одинаково инициализированные веса остаются одинаковыми навсегда.',
        'Zero-initialising the weights preserves the symmetry between outputs: every row of the matrix is identical, so every logit is equal, so the gradients for every row are equal too, and the rows stay identical after any number of steps. The network forever emits a uniform distribution over classes. Zero-initialising the bias on line 7 is perfectly normal and widely used: the bias may be identical, because it is the weights that break the symmetry. The right fix for line 6 is any random initialisation — PyTorch already does that by default, so simply not touching the weights is enough. The simulator above shows the same effect on four units: identically initialised weights stay identical forever.',
      ),
    },
    {
      kind: 'findbug',
      id: 'mini.ml-bugs.leakage',
      lang: 'python',
      prompt: l(
        'Модель показывает ROC AUC 0.97 на валидации и 0.61 в проде. Укажи строку, в которой значение таргета попадает в признаки.',
        'The model shows a validation ROC AUC of 0.97 and 0.61 in production. Point at the line where the target value leaks into the features.',
      ),
      code: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def prepare(df):
    df = df.copy()
    df['item_ctr'] = df.groupby('item_id')['clicked'].transform('mean')
    scaler = StandardScaler()
    features = scaler.fit_transform(df[['price', 'item_ctr']])
    return train_test_split(
        features, df['clicked'], test_size=0.2, random_state=42
    )`,
      buggyLines: [7],
      explanation: l(
        'Строка 7 считает средний CTR товара по всему датафрейму, включая ту самую строку, для которой потом предсказывается clicked, и включая строки, которые уйдут в тест. Для редкого товара с двумя показами этот признак почти равен самому таргету — модель запоминает ответ вместо того, чтобы его предсказывать. Отсюда и разрыв между валидацией и продом: в проде такого признака с будущим внутри просто не существует. Чинится тем, что агрегаты по таргету считаются только по прошлому относительно каждой строки и только по обучающей части: либо разбиение по времени, либо out-of-fold кодирование. Отдельно стоит заметить строку 9: StandardScaler обучается на всех данных до разбиения, то есть среднее и дисперсия теста протекают в препроцессинг. Это более мягкая утечка, но тоже реальная, и чинится она тем, что scaler fit делается только на train. Если ты указал её — ты заметил вторую проблему, это правильное чутьё, но спрашивали про таргет.',
        'Line 7 computes the item mean CTR over the whole dataframe, including the very row whose clicked value is later predicted, and including the rows that will go to the test split. For a rare item with two impressions this feature is nearly the target itself — the model memorises the answer instead of predicting it. Hence the gap between validation and production: in production a feature with the future inside it simply does not exist. The fix is to compute target aggregates only over the past relative to each row and only over the training part: either a time-based split or out-of-fold encoding. Line 9 deserves separate mention: StandardScaler is fitted on all the data before the split, so the test mean and variance leak into preprocessing. That is a milder leak but a real one, and the cure is fitting the scaler on train only. If you pointed at it, you spotted the second problem, which is the right instinct — but the question was about the target.',
      ),
    },
  ],

  sources: [
    {
      title: 'scikit-learn: common pitfalls and recommended practices',
      url: 'https://scikit-learn.org/stable/common_pitfalls.html',
      note: l('Раздел про утечку данных.', 'The section on data leakage.'),
    },
  ],
};
