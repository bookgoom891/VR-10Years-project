export type StoreMode = "direct_buy" | "move_to_pool";

export interface StrategySettings {
  symbol: string;
  initialCapital: number;
  initialTqqqInvestment: number;
  initialPool: number;
  initialStore: number;
  bandRate: number;
  gValue: number;
  cycleDays: number;
  contribution: number;
  withdrawal: number;
  cyclePoolUseLimit: number;
  orderUnit: number;
  exchangeRate: number;
  useStore: boolean;
  storeSplits: number;
  storeMinIntervalDays: number;
  storeMode: StoreMode;
  reflectStoreInV: boolean;
}

export interface CycleInput {
  previousV: number;
  shares: number;
  endingPrice: number;
  currentPool: number;
  currentStore: number;
  contribution: number;
  withdrawal: number;
  storeInjection: number;
  exchangeRate: number;
  manualEndingEquity: number;
  useManualEndingEquity: boolean;
}

export interface CycleResult {
  endingEquity: number;
  newV: number;
  lowerBand: number;
  upperBand: number;
  cyclePoolBudget: number;
  totalUsdAssets: number;
  totalKrwAssets: number;
}

export interface OrderRow {
  step: number;
  price: number;
  quantity: number;
  sharesAfter: number;
  poolChange: number;
  poolAfter: number;
}

export interface StoreSignalInput {
  price: number;
  prevPrice: number;
  ma20: number;
  prevMa20: number;
  ma50: number;
  ma100: number;
  ma200: number;
  usedSplits: number;
  lastInjectionDate: string;
}

export interface StoreSignalResult {
  belowAll: boolean;
  longTermUpButPriceCollapsed: boolean;
  downtrend: boolean;
  reboundSignal: boolean;
  labels: string[];
  isCandidate: boolean;
}

export interface HistoryRecord {
  id: string;
  cycleNumber: number;
  date: string;
  previousV: number;
  newV: number;
  endingEquity: number;
  lowerBand: number;
  upperBand: number;
  shares: number;
  pool: number;
  store: number;
  contribution: number;
  storeInjection: number;
  exchangeRate: number;
  totalUsdAssets: number;
  totalKrwAssets: number;
  memo: string;
}

export type AppTab = "setup" | "cycle" | "orders" | "store" | "history";
