import { l } from '@/i18n/types';
import type { Branch } from './types';

/**
 * All twelve main branches plus the mini ones are declared here from the start,
 * so the map shows the whole route. 'planned' branches are visible but greyed
 * out, with the stage they arrive in.
 */
export const BRANCHES: Branch[] = [
  {
    id: 'stats',
    title: l('Статистика с нуля', 'Statistics from scratch'),
    blurb: l(
      'Распределения, выборочный шум, ЦПТ, доверительные интервалы, гипотезы.',
      'Distributions, sampling noise, CLT, confidence intervals, hypotheses.',
    ),
    accent: 'var(--branch-stats)',
    status: 'ready',
    stage: 1,
    order: 1,
  },
  {
    id: 'ab',
    title: l('A/B-тесты', 'A/B testing'),
    blurb: l(
      'Единица рандомизации, мощность и MDE, A/A, peeking, CUPED, SRM.',
      'Randomization unit, power and MDE, A/A, peeking, CUPED, SRM.',
    ),
    accent: 'var(--branch-ab)',
    status: 'ready',
    stage: 1,
    order: 2,
  },
  {
    id: 'sql',
    title: l('SQL по логам поиска', 'SQL on search logs'),
    blurb: l(
      'Джойны, группировки, оконные функции, сессии, продуктовые метрики.',
      'Joins, grouping, window functions, sessions, product metrics.',
    ),
    accent: 'var(--branch-sql)',
    status: 'ready',
    stage: 2,
    order: 3,
  },
  {
    id: 'search-metrics',
    title: l('Метрики качества поиска', 'Search quality metrics'),
    blurb: l(
      'precision@k, MRR, MAP, nDCG, асессоры, согласованность, интерливинг.',
      'precision@k, MRR, MAP, nDCG, raters, agreement, interleaving.',
    ),
    accent: 'var(--branch-search-metrics)',
    status: 'planned',
    stage: 3,
    order: 4,
  },
  {
    id: 'metric-picker',
    title: l('Тренажёр выбора метрики', 'Metric choice trainer'),
    blurb: l(
      'Сценарий — оффлайн-метрика, онлайн-метрика, guardrail. И почему не остальные.',
      'A scenario, then the offline metric, the online metric and the guardrails.',
    ),
    accent: 'var(--branch-metric-picker)',
    status: 'planned',
    stage: 3,
    order: 5,
  },
  {
    id: 'ads',
    title: l('Рекламное ранжирование', 'Ads ranking'),
    blurb: l(
      'eCPM, аукционы GSP и VCG, калибровка pCTR, выручка против релевантности.',
      'eCPM, GSP and VCG auctions, pCTR calibration, revenue versus relevance.',
    ),
    accent: 'var(--branch-ads)',
    status: 'planned',
    stage: 4,
    order: 6,
  },
  {
    id: 'retrieval',
    title: l('Retrieval', 'Retrieval'),
    blurb: l(
      'BM25 руками, эмбеддинги, bi- и cross-encoder, двухстадийная схема, ANN.',
      'BM25 by hand, embeddings, bi- and cross-encoders, two-stage, ANN.',
    ),
    accent: 'var(--branch-retrieval)',
    status: 'planned',
    stage: 4,
    order: 7,
  },
  {
    id: 'bandits',
    title: l('Бандиты и exploration', 'Bandits and exploration'),
    blurb: l(
      'eps-greedy, UCB, Thompson sampling, regret, связь с ранжированием.',
      'eps-greedy, UCB, Thompson sampling, regret, the link to ranking.',
    ),
    accent: 'var(--branch-bandits)',
    status: 'planned',
    stage: 4,
    order: 8,
  },
  {
    id: 'query-cls',
    title: l('Классификация запросов', 'Query classification'),
    blurb: l(
      'Дисбаланс, иерархия категорий, macro/micro F1, пороги, длинный хвост.',
      'Imbalance, category hierarchy, macro/micro F1, thresholds, the long tail.',
    ),
    accent: 'var(--branch-query-cls)',
    status: 'planned',
    stage: 4,
    order: 9,
  },
  {
    id: 'testing',
    title: l('Продовые тесты на Python', 'Production testing in Python'),
    blurb: l(
      'pytest с нуля, фикстуры, моки, тесты на данные и ML-пайплайны.',
      'pytest from scratch, fixtures, mocks, data and ML pipeline tests.',
    ),
    accent: 'var(--branch-testing)',
    status: 'planned',
    stage: 5,
    order: 10,
  },
  {
    id: 'system-design',
    title: l('ML system design', 'ML system design'),
    blurb: l(
      'Кейсы: цель и метрики, данные, бейзлайн, модели, эксперимент, прод.',
      'Cases: goal and metrics, data, baseline, models, experiment, production.',
    ),
    accent: 'var(--branch-system-design)',
    status: 'planned',
    stage: 6,
    order: 11,
  },
  {
    id: 'product',
    title: l('Продуктовое мышление', 'Product thinking'),
    blurb: l(
      'Какую метрику выбрать, как связать её с деньгами, приоритизация гипотез.',
      'Which metric to pick, how to tie it to money, prioritising hypotheses.',
    ),
    accent: 'var(--branch-product)',
    status: 'planned',
    stage: 6,
    order: 12,
  },
  {
    id: 'boosting',
    title: l('Бустинг вглубь', 'Boosting in depth'),
    blurb: l(
      'CatBoost: ordered boosting, симметричные деревья, YetiRank, PairLogit.',
      'CatBoost: ordered boosting, symmetric trees, YetiRank, PairLogit.',
    ),
    accent: 'var(--branch-boosting)',
    status: 'planned',
    stage: 7,
    order: 13,
  },
  {
    id: 'mini',
    title: l('Мини-ветки', 'Mini branches'),
    blurb: l(
      'Баги в ML-коде, квиз по DL, pandas. Только пощупать, без глубины.',
      'ML code bugs, a DL quiz, pandas. A taste only, no depth.',
    ),
    accent: 'var(--branch-mini)',
    status: 'planned',
    stage: 5,
    order: 14,
  },
];

export const BRANCH_BY_ID = Object.fromEntries(BRANCHES.map((b) => [b.id, b])) as Record<
  Branch['id'],
  Branch
>;
