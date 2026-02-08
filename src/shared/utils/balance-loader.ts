import balanceData from '../../../data/balance.json';
import type { IBalanceConfig } from '@shared/types/balance';

let cachedConfig: IBalanceConfig | null = null;

export function loadBalanceConfig(): IBalanceConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = balanceData as IBalanceConfig;
  return cachedConfig;
}

export function resetBalanceConfigCache(): void {
  cachedConfig = null;
}
