export type StoreMode = "direct_buy" | "move_to_pool";
export type VStage = "V0" | "V1" | "V2_PLUS";
export type FillSide = "buy" | "sell";
export type AppTab = "setup" | "cycle" | "orders" | "advance" | "store" | "history";

export interface StrategySettings {
  symbol: string;
  initialCapital: number;
  initialAveragePrice: number;
  startClosePrice: number;
  totalOrderQuantity: number;
  cycleStartDate: string;
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
  vStage: VStage;
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

export interface FillEntry {
  id: string;
  side: FillSide;
  source: "order" | "manual";
  orderStep?: number;
  plannedPrice?: number;
  plannedQuantity?: number;
  selected: boolean;
  actualPrice: number;
  actualQuantity: number;
  memo: string;
}

export interface AdvancePreview {
  selectedFills: FillEntry[];
  sharesBefore: number;
  sharesAfter: number;
  poolBefore: number;
  poolAfterFills: number;
  contribution: number;
  withdrawal: number;
  poolAfter: number;
  endingEquity: number;
  nextV: number;
  lowerBand: number;
  upperBand: number;
}

export interface StoreSignalInput {
  price: number;
  prevPrice: number;
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
  vStage: VStage;
  previousV: number;
  newV: number;
  endingEquity: number;
  lowerBand: number;
  upperBand: number;
  shares: number;
  sharesBefore: number;
  sharesAfter: number;
  pool: number;
  poolBefore: number;
  poolAfter: number;
  store: number;
  contribution: number;
  storeInjection: number;
  exchangeRate: number;
  totalUsdAssets: number;
  totalKrwAssets: number;
  fills: FillEntry[];
  memo: string;
}

export interface UndoSnapshot {
  settings: StrategySettings;
  cycle: CycleInput;
  store: StoreSignalInput;
  history: HistoryRecord[];
  memo: string;
  activeTab: AppTab;
  fillDrafts: FillEntry[];
}
