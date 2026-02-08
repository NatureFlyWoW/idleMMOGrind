import { describe, it, expect } from 'vitest';
import { applyDiminishingReturns } from '@engine/offline/diminishing-returns';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('applyDiminishingReturns', () => {
  it('should return 0 for 0 offline seconds', () => {
    const result = applyDiminishingReturns(0, config);
    expect(result.simulatedSeconds).toBe(0);
  });

  it('should return full time for first 12 hours', () => {
    const twelveHours = 12 * 3600;
    const result = applyDiminishingReturns(twelveHours, config);
    expect(result.simulatedSeconds).toBe(twelveHours);
    expect(result.multiplier).toBeCloseTo(1.0, 2);
  });

  it('should apply 75% efficiency for hours 12-18', () => {
    const fifteenHours = 15 * 3600;
    const result = applyDiminishingReturns(fifteenHours, config);
    // 12h * 1.0 + 3h * 0.75 = 43200 + 8100 = 51300
    expect(result.simulatedSeconds).toBe(51300);
  });

  it('should apply 50% efficiency for hours 18-24', () => {
    const twentyFourHours = 24 * 3600;
    const result = applyDiminishingReturns(twentyFourHours, config);
    // 12*3600*1.0 + 6*3600*0.75 + 6*3600*0.50
    // = 43200 + 16200 + 10800 = 70200
    expect(result.simulatedSeconds).toBe(70200);
  });

  it('should cap at 24 hours even if more time passed', () => {
    const fortyEightHours = 48 * 3600;
    const result = applyDiminishingReturns(fortyEightHours, config);
    // Same as 24 hours
    expect(result.simulatedSeconds).toBe(70200);
  });

  it('should report correct efficiency multiplier', () => {
    const twentyFourHours = 24 * 3600;
    const result = applyDiminishingReturns(twentyFourHours, config);
    // 70200 / 86400 = 0.8125
    expect(result.multiplier).toBeCloseTo(0.8125, 3);
  });
});
