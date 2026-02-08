import type { IBalanceConfig } from '@shared/types/balance';

export interface IDiminishingResult {
  simulatedSeconds: number;
  multiplier: number;
}

/**
 * Apply diminishing returns to offline time.
 * 0-12h: 100%, 12-18h: 75%, 18-24h: 50%, 24h+ capped.
 */
export function applyDiminishingReturns(
  rawSeconds: number,
  config: IBalanceConfig,
): IDiminishingResult {
  if (rawSeconds <= 0) {
    return { simulatedSeconds: 0, multiplier: 1 };
  }

  const HOUR = 3600;
  const capped = Math.min(rawSeconds, config.offline.maxOfflineSeconds);

  let simulated = 0;
  let remaining = capped;

  // Tier 1: 0-12h at 100%
  const tier1Max = config.offline.tier1Hours * HOUR;
  const tier1 = Math.min(remaining, tier1Max);
  simulated += tier1 * config.offline.tier1Efficiency;
  remaining -= tier1;

  // Tier 2: 12-18h at 75%
  const tier2Max = (config.offline.tier2Hours - config.offline.tier1Hours) * HOUR;
  const tier2 = Math.min(remaining, tier2Max);
  simulated += tier2 * config.offline.tier2Efficiency;
  remaining -= tier2;

  // Tier 3: 18-24h at 50%
  const tier3 = remaining;
  simulated += tier3 * config.offline.tier3Efficiency;

  const multiplier = capped > 0 ? simulated / capped : 1;

  return { simulatedSeconds: Math.floor(simulated), multiplier };
}
