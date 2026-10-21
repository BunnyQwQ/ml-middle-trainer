import type { ComponentType } from 'react';
import type { SimId } from '@/content/sims';
import {
  Clt,
  CltErrorDecay,
  CiCoverage,
  CiWaldVsWilson,
  CiWidth,
  DistributionExplorer,
  SamplingNoise,
} from './stats';
import {
  AaBroken,
  AaTest,
  ErrorAreas,
  MdeCalculator,
  PowerCurve,
  RandomizationUnit,
  SrmCheck,
} from './ab';

/**
 * Content refers to interactives by id; this is the only place that maps an
 * id to a component. The content checker validates every id against SIM_IDS,
 * and a missing entry here is a type error.
 */
export const SIMS: Record<SimId, ComponentType> = {
  'distribution-explorer': DistributionExplorer,
  'sampling-noise': SamplingNoise,
  clt: Clt,
  'clt-error-decay': CltErrorDecay,
  'ci-coverage': CiCoverage,
  'ci-width': CiWidth,
  'ci-wald-vs-wilson': CiWaldVsWilson,
  'randomization-unit': RandomizationUnit,
  'power-curve': PowerCurve,
  'mde-calculator': MdeCalculator,
  'error-areas': ErrorAreas,
  'aa-test': AaTest,
  'aa-broken': AaBroken,
  'srm-check': SrmCheck,
};

export function getSim(id: SimId): ComponentType {
  return SIMS[id];
}
