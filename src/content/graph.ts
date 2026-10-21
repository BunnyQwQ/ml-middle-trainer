import type { ProgressData } from '@/progress/store';
import { BRANCHES } from './branches';
import { statsDistributions } from './branches/stats/distributions';
import { statsClt } from './branches/stats/clt';
import { statsCi } from './branches/stats/ci';
import { abBasics } from './branches/ab/basics';
import { abPower } from './branches/ab/power';
import { abAa } from './branches/ab/aa';
import { sqlBasics } from './branches/sql/basics';
import { sqlGrouping } from './branches/sql/grouping';
import { sqlWindows } from './branches/sql/windows';
import { sqlSessions } from './branches/sql/sessions';
import { sqlMetrics } from './branches/sql/metrics';
import { statsHypotheses } from './branches/stats/hypotheses';
import { statsTests } from './branches/stats/tests';
import { abPeeking } from './branches/ab/peeking';
import { abMultiple } from './branches/ab/multiple';
import { abRatio } from './branches/ab/ratio';
import { abCuped } from './branches/ab/cuped';
import { abReview } from './branches/ab/review';
import { searchRelevance } from './branches/search/relevance';
import { searchPrecisionRecall } from './branches/search/precision-recall';
import { searchRankMetrics } from './branches/search/rank-metrics';
import { searchNdcg } from './branches/search/ndcg';
import { searchOfflineOnline } from './branches/search/offline-online';
import { searchInterleaving } from './branches/search/interleaving';
import { metricBasics } from './branches/metric-picker/basics';
import { metricTraps } from './branches/metric-picker/traps';
import { adsEcpm } from './branches/ads/ecpm';
import { adsAuctions } from './branches/ads/auctions';
import { adsCalibration } from './branches/ads/calibration';
import { adsRevenueRelevance } from './branches/ads/revenue-relevance';
import { retrievalBm25 } from './branches/retrieval/bm25';
import { retrievalEmbeddings } from './branches/retrieval/embeddings';
import { retrievalAnn } from './branches/retrieval/ann';
import { banditsBasics } from './branches/bandits/basics';
import { banditsUcbThompson } from './branches/bandits/ucb-thompson';
import { banditsPractice } from './branches/bandits/practice';
import { qclsImbalance } from './branches/query-cls/imbalance';
import { qclsMulticlass } from './branches/query-cls/multiclass';
import { qclsThresholds } from './branches/query-cls/thresholds';
import type { BranchId, SkillNode } from './types';

/** Every node that exists. Order inside a branch follows `tier`. */
export const NODES: SkillNode[] = [
  statsDistributions,
  statsClt,
  statsCi,
  statsHypotheses,
  statsTests,
  abBasics,
  abPower,
  abAa,
  abPeeking,
  abMultiple,
  abRatio,
  abCuped,
  abReview,
  sqlBasics,
  sqlGrouping,
  sqlWindows,
  sqlSessions,
  sqlMetrics,
  searchRelevance,
  searchPrecisionRecall,
  searchRankMetrics,
  searchNdcg,
  searchOfflineOnline,
  searchInterleaving,
  metricBasics,
  metricTraps,
  adsEcpm,
  adsAuctions,
  adsCalibration,
  adsRevenueRelevance,
  retrievalBm25,
  retrievalEmbeddings,
  retrievalAnn,
  banditsBasics,
  banditsUcbThompson,
  banditsPractice,
  qclsImbalance,
  qclsMulticlass,
  qclsThresholds,
];

export const NODE_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);

export function getNode(id: string): SkillNode | undefined {
  return NODE_BY_ID[id];
}

export function branchNodes(branch: BranchId): SkillNode[] {
  return NODES.filter((n) => n.branch === branch).sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
}

/** Number of graded items in a node; drives the star calculation. */
export function nodeItemCount(node: SkillNode): number {
  return node.tasks.length;
}

export function nodeStars(progress: ProgressData, nodeId: string): 0 | 1 | 2 | 3 {
  return progress.nodes[nodeId]?.stars ?? 0;
}

export function isNodeDone(progress: ProgressData, nodeId: string): boolean {
  return nodeStars(progress, nodeId) > 0;
}

/** A node opens once every prerequisite has at least one star. */
export function isUnlocked(progress: ProgressData, node: SkillNode): boolean {
  return node.requires.every((req) => isNodeDone(progress, req));
}

export function missingPrereqs(progress: ProgressData, node: SkillNode): SkillNode[] {
  return node.requires
    .filter((req) => !isNodeDone(progress, req))
    .map((req) => NODE_BY_ID[req])
    .filter((n): n is SkillNode => Boolean(n));
}

export type BranchStats = {
  total: number;
  done: number;
  stars: number;
  maxStars: number;
};

export function branchStats(progress: ProgressData, branch: BranchId): BranchStats {
  const nodes = branchNodes(branch);
  let done = 0;
  let stars = 0;
  for (const n of nodes) {
    const s = nodeStars(progress, n.id);
    if (s > 0) done += 1;
    stars += s;
  }
  return { total: nodes.length, done, stars, maxStars: nodes.length * 3 };
}

export function totalStars(progress: ProgressData): { stars: number; max: number } {
  const max = NODES.length * 3;
  const stars = NODES.reduce((acc, n) => acc + nodeStars(progress, n.id), 0);
  return { stars, max };
}

export function nodesDone(progress: ProgressData): number {
  return NODES.filter((n) => isNodeDone(progress, n.id)).length;
}

/**
 * Nodes where the first-try accuracy is worst. Only nodes that were actually
 * attempted show up, so the list is empty for a fresh profile.
 */
export function weakSpots(
  progress: ProgressData,
  limit = 4,
): Array<{ node: SkillNode; accuracy: number; attempts: number }> {
  const rows: Array<{ node: SkillNode; accuracy: number; attempts: number }> = [];
  for (const node of NODES) {
    const np = progress.nodes[node.id];
    if (!np) continue;
    const items = Object.values(np.items);
    if (items.length === 0) continue;
    const firstTry = items.filter((i) => i.solved && i.firstTry).length;
    const attempts = items.reduce((acc, i) => acc + i.attempts, 0);
    rows.push({ node, accuracy: firstTry / items.length, attempts });
  }
  return rows.sort((a, b) => a.accuracy - b.accuracy).slice(0, limit);
}

export const READY_BRANCHES = BRANCHES.filter((b) => b.status === 'ready');
export const PLANNED_BRANCHES = BRANCHES.filter((b) => b.status === 'planned');
