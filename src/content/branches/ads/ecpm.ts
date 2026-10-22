import { l } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const adsEcpm: SkillNode = {
  id: 'ads.ecpm',
  branch: 'ads',
  act: 4,
  tier: 1,
  title: l('eCPM и ранжирование рекламы', 'eCPM and ad ranking'),
  blurb: l(
    'Почему наверх идёт не тот, кто больше заплатил.',
    'Why the top slot does not go to whoever pays most.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 6,
  theory: [
    {
      type: 'p',
      text: l(
        'Рекламодатель платит за клик, а площадка продаёт показ. Поэтому сравнивать ставки напрямую нельзя: ставка 50 рублей при вероятности клика 1% приносит в среднем 50 копеек с показа, а ставка 20 рублей при вероятности 5% — рубль. Величина, которая приводит ставки к одному знаменателю, и называется eCPM: ожидаемый доход с тысячи показов.',
        'An advertiser pays per click while the platform sells impressions. So bids cannot be compared directly: a 50 rouble bid at a 1% click probability earns 50 kopecks per impression on average, while a 20 rouble bid at 5% earns a rouble. The quantity that brings bids to a common denominator is eCPM: expected revenue per thousand impressions.',
      ),
    },
    { type: 'formula', tex: 'eCPM = \\text{ставка} \\times pCTR \\times 1000' },
    {
      type: 'p',
      text: l(
        'Отсюда главное свойство рекламного ранжирования: модель предсказания вероятности клика — не вспомогательный компонент, а часть механизма ценообразования. Ошибка в pCTR на 20% для одного рекламодателя смещает весь порядок показа и меняет цены, которые платят все остальные.',
        'Hence the central property of ad ranking: the click probability model is not a supporting component but part of the pricing mechanism. A 20% error in pCTR for one advertiser shifts the whole display order and changes the prices everyone else pays.',
      ),
    },
    {
      type: 'sim',
      sim: 'ecpm-ranking',
      title: l('Ставка против ожидаемой выручки', 'Bid versus expected revenue'),
      caption: l(
        'Переключи правило ранжирования. Рекламодатель C даёт самую высокую ставку и худший pCTR: при ранжировании по ставке он занимает первое место, и площадка теряет деньги на каждом показе. Подвигай его ставку и найди точку, где он действительно заслуживает первое место по eCPM.',
        'Switch the ranking rule. Advertiser C has the highest bid and the worst pCTR: ranking by bid puts it in the top slot and the platform loses money on every impression. Drag its bid and find the point where it genuinely deserves the top slot by eCPM.',
      ),
    },
    { type: 'h', text: l('Из чего на практике собирается ранг', 'What a rank is actually made of') },
    {
      type: 'p',
      text: l(
        'В реальных системах в формулу добавляют ещё два множителя. Первый — оценка качества объявления и посадочной страницы: она штрафует рекламу, после которой пользователь сразу возвращается. Второй — резервная цена: если eCPM ниже порога, место остаётся пустым или отдаётся органике. Резерв нужен не ради денег, а чтобы плохая реклама не занимала место лучшего органического результата.',
        'Production systems add two more factors to the formula. The first is a quality estimate of the ad and its landing page, penalising ads the user bounces straight back from. The second is a reserve price: when eCPM falls below a threshold, the slot stays empty or goes to organic results. The reserve is there not for money but so that poor ads do not displace a better organic result.',
      ),
    },
    { type: 'formula', tex: '\\text{rank} = \\text{ставка} \\times pCTR \\times \\text{quality}, \\qquad \\text{показываем, если } \\text{rank} > \\text{reserve}' },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Рекламное место — это не свободные деньги, а место, отнятое у органики. Поэтому резервная цена в правильной постановке равна ценности органического результата, который мы вытесняем. Если её поставить ниже, площадка меняет долгосрочную лояльность на сегодняшние копейки.',
        'An ad slot is not free money but space taken from the organic results. So the reserve price, posed correctly, equals the value of the organic result being displaced. Set it lower and the platform trades long-term loyalty for today\'s small change.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'quiz',
      id: 'ads.ecpm.q-compare',
      mode: 'single',
      prompt: l(
        'Объявление A: ставка 60 ₽, pCTR 1.2%. Объявление B: ставка 25 ₽, pCTR 4%. Кто выше при ранжировании по eCPM?',
        'Ad A: bid 60 ₽, pCTR 1.2%. Ad B: bid 25 ₽, pCTR 4%. Which ranks higher by eCPM?',
      ),
      choices: [
        { id: 'a', text: l('A: ставка выше более чем вдвое', 'A: its bid is more than twice as high') },
        { id: 'b', text: l('B: 25 × 0.04 = 1.0 против 60 × 0.012 = 0.72', 'B: 25 × 0.04 = 1.0 against 60 × 0.012 = 0.72') },
        { id: 'c', text: l('Одинаково', 'They are equal') },
        { id: 'd', text: l('Зависит от резервной цены', 'It depends on the reserve price') },
      ],
      correct: ['b'],
      explanation: l(
        'eCPM A = 60 × 0.012 = 0.72 рубля с показа, eCPM B = 25 × 0.04 = 1.0 рубля. B выше, хотя его ставка меньше в 2.4 раза. Резервная цена влияет только на то, покажем ли мы объявление вообще, но не на порядок между ними. Заметь практическое следствие: рекламодателю с хорошим объявлением дешевле занимать верхние позиции, и это сознательный стимул со стороны площадки — делать рекламу, на которую кликают.',
        'eCPM of A = 60 × 0.012 = 0.72 roubles per impression, eCPM of B = 25 × 0.04 = 1.0 roubles. B ranks higher despite a bid 2.4 times smaller. The reserve price only decides whether an ad is shown at all, not the order between them. Note the practical consequence: an advertiser with a good ad occupies top slots more cheaply, and that is a deliberate incentive from the platform — make ads people click.',
      ),
    },
    {
      kind: 'quiz',
      id: 'ads.ecpm.q-reserve',
      mode: 'multi',
      prompt: l(
        'Зачем нужна резервная цена в рекламном аукционе?',
        'What is a reserve price in an ad auction for?',
      ),
      choices: [
        {
          id: 'a',
          text: l(
            'Чтобы плохая реклама не занимала место лучшего органического результата',
            'So that a poor ad does not displace a better organic result',
          ),
        },
        {
          id: 'b',
          text: l(
            'Чтобы поднять цену, когда конкуренция слабая и второй ставки почти нет',
            'To raise the price when competition is thin and there is barely a second bid',
          ),
        },
        {
          id: 'c',
          text: l('Чтобы гарантировать, что все рекламные места всегда заполнены', 'To guarantee every ad slot is always filled'),
        },
        {
          id: 'd',
          text: l('Чтобы ограничить максимальную ставку рекламодателя', "To cap an advertiser's maximum bid"),
        },
      ],
      correct: ['a', 'b'],
      explanation: l(
        'Резерв решает две задачи сразу. Продуктовую: место стоит отдавать рекламе, только если её ожидаемая ценность выше ценности вытесняемого органического результата. И экономическую: в аукционе второй цены при единственном участнике платить было бы нечего, резерв задаёт нижнюю границу. Вариант c противоположен смыслу: резерв как раз оставляет места пустыми, когда рекламы достойного качества нет. Верхнюю ставку резерв не ограничивает никак.',
        'The reserve solves two problems at once. A product one: a slot should go to an ad only if its expected value exceeds that of the organic result it displaces. And an economic one: in a second-price auction with a single participant there would be nothing to pay, and the reserve sets a floor. Option c is the opposite of the point: the reserve is exactly what leaves slots empty when no ad is good enough. It does not cap the top bid at all.',
      ),
    },
  ],

  sources: [
    {
      title: 'Wikipedia: Generalized second-price auction',
      url: 'https://en.wikipedia.org/wiki/Generalized_second-price_auction',
    },
  ],
};
