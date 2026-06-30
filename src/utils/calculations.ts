import type {
  AdvancePreview,
  CycleInput,
  CycleResult,
  FillEntry,
  OrderRow,
  StoreSignalInput,
  StoreSignalResult,
  StrategySettings,
  VStage
} from "../types";

export function calculateV0(settings: StrategySettings) {
  return settings.initialAveragePrice * settings.totalOrderQuantity;
}

export function calculateV1(settings: StrategySettings) {
  return settings.startClosePrice * settings.totalOrderQuantity;
}

export function vStageLabel(stage: VStage) {
  if (stage === "V0") return "V0";
  if (stage === "V1") return "V1";
  return "V2+";
}

export function calculateCycle(
  settings: StrategySettings,
  input: CycleInput
): CycleResult {
  const endingEquity = input.useManualEndingEquity
    ? input.manualEndingEquity
    : input.endingPrice * input.shares;
  const storeInjectionForV = settings.reflectStoreInV ? input.storeInjection : 0;
  const newV =
    input.previousV +
    input.currentPool / settings.gValue +
    (endingEquity - input.previousV) / (2 * Math.sqrt(settings.gValue)) +
    input.contribution +
    storeInjectionForV -
    input.withdrawal;
  const lowerBand = newV * (1 - settings.bandRate);
  const upperBand = newV * (1 + settings.bandRate);
  const cyclePoolBudget = input.currentPool * settings.cyclePoolUseLimit;
  const totalUsdAssets = endingEquity + input.currentPool + input.currentStore;

  return {
    endingEquity,
    newV,
    lowerBand,
    upperBand,
    cyclePoolBudget,
    totalUsdAssets,
    totalKrwAssets: totalUsdAssets * input.exchangeRate
  };
}

export function applySettingsToCycle(
  settings: StrategySettings,
  cycle: CycleInput
): CycleInput {
  const shares = Math.max(1, Math.floor(settings.totalOrderQuantity));
  const effectiveClosePrice = cycle.endingPrice > 0 ? cycle.endingPrice : settings.startClosePrice;
  const v1 = effectiveClosePrice * shares;

  return {
    ...cycle,
    previousV: v1,
    shares,
    endingPrice: effectiveClosePrice,
    currentPool: settings.initialPool,
    currentStore: settings.initialStore,
    contribution: settings.contribution,
    withdrawal: settings.withdrawal,
    exchangeRate: settings.exchangeRate,
    manualEndingEquity: effectiveClosePrice * shares,
    storeInjection: 0,
    useManualEndingEquity: false,
    vStage: "V1"
  };
}

export function buildBuyOrders(
  lowerBand: number,
  shares: number,
  pool: number,
  orderUnit: number,
  cyclePoolBudget: number,
  maxRows = 10
): OrderRow[] {
  const rows: OrderRow[] = [];
  let currentShares = shares;
  let currentPool = pool;
  let usedPool = 0;

  for (let step = 1; step <= maxRows; step += 1) {
    if (currentShares <= 0) break;
    const price = lowerBand / currentShares;
    const poolChange = price * orderUnit;
    if (usedPool + poolChange > cyclePoolBudget || poolChange > currentPool) break;

    currentShares += orderUnit;
    currentPool -= poolChange;
    usedPool += poolChange;
    rows.push({ step, price, quantity: orderUnit, sharesAfter: currentShares, poolChange, poolAfter: currentPool });
  }

  return rows;
}

export function buildSellOrders(
  upperBand: number,
  shares: number,
  pool: number,
  orderUnit: number,
  maxRows = 10
): OrderRow[] {
  const rows: OrderRow[] = [];
  let currentShares = shares;
  let currentPool = pool;

  for (let step = 1; step <= maxRows; step += 1) {
    if (currentShares - orderUnit < orderUnit || currentShares <= 0) break;
    const price = upperBand / currentShares;
    const poolChange = price * orderUnit;
    currentShares -= orderUnit;
    currentPool += poolChange;
    rows.push({ step, price, quantity: orderUnit, sharesAfter: currentShares, poolChange, poolAfter: currentPool });
  }

  return rows;
}

export function createFillEntries(buyOrders: OrderRow[], sellOrders: OrderRow[]): FillEntry[] {
  const buyEntries = buyOrders.map((row) => ({
    id: `buy-${row.step}`,
    side: "buy" as const,
    source: "order" as const,
    orderStep: row.step,
    plannedPrice: row.price,
    plannedQuantity: row.quantity,
    selected: false,
    actualPrice: row.price,
    actualQuantity: row.quantity,
    memo: ""
  }));
  const sellEntries = sellOrders.map((row) => ({
    id: `sell-${row.step}`,
    side: "sell" as const,
    source: "order" as const,
    orderStep: row.step,
    plannedPrice: row.price,
    plannedQuantity: row.quantity,
    selected: false,
    actualPrice: row.price,
    actualQuantity: row.quantity,
    memo: ""
  }));
  return [...buyEntries, ...sellEntries];
}

export function calculateAdvancePreview(
  settings: StrategySettings,
  cycle: CycleInput,
  fills: FillEntry[]
): AdvancePreview {
  const selectedFills = fills.filter((fill) => fill.selected && fill.actualQuantity > 0 && fill.actualPrice > 0);
  let sharesAfter = cycle.shares;
  let poolAfterFills = cycle.currentPool;

  for (const fill of selectedFills) {
    const value = fill.actualPrice * fill.actualQuantity;
    if (fill.side === "buy") {
      sharesAfter += fill.actualQuantity;
      poolAfterFills -= value;
    } else {
      sharesAfter -= fill.actualQuantity;
      poolAfterFills += value;
    }
  }

  const poolAfter = poolAfterFills + cycle.contribution - cycle.withdrawal;
  const previewCycle: CycleInput = {
    ...cycle,
    shares: sharesAfter,
    currentPool: poolAfter,
    useManualEndingEquity: false
  };
  const result = calculateCycle(settings, previewCycle);

  return {
    selectedFills,
    sharesBefore: cycle.shares,
    sharesAfter,
    poolBefore: cycle.currentPool,
    poolAfterFills,
    contribution: cycle.contribution,
    withdrawal: cycle.withdrawal,
    poolAfter,
    endingEquity: result.endingEquity,
    nextV: result.newV,
    lowerBand: result.lowerBand,
    upperBand: result.upperBand
  };
}

export function evaluateStoreSignal(input: StoreSignalInput): StoreSignalResult {
  return {
    belowAll: false,
    longTermUpButPriceCollapsed: false,
    downtrend: false,
    reboundSignal: false,
    labels: [`수동 관리 · 사용 ${input.usedSplits}회`],
    isCandidate: false
  };
}

export function validateInputs(
  settings: StrategySettings,
  cycle: CycleInput
): string[] {
  const errors: string[] = [];
  if (settings.initialAveragePrice <= 0) errors.push("초기 평단가는 0보다 커야 합니다.");
  if (settings.startClosePrice <= 0) errors.push("시작 직전 종가는 0보다 커야 합니다.");
  if (settings.totalOrderQuantity <= 0) errors.push("총 주문 수량은 0보다 커야 합니다.");
  if (settings.gValue <= 0) errors.push("G값은 0보다 커야 합니다.");
  if (settings.bandRate <= 0 || settings.bandRate >= 1) {
    errors.push("밴드 비율은 0보다 크고 1보다 작아야 합니다.");
  }
  if (settings.cyclePoolUseLimit <= 0 || settings.cyclePoolUseLimit > 1) {
    errors.push("Pool 사용 한도는 0보다 크고 1보다 작거나 같아야 합니다.");
  }
  if (cycle.shares <= 0) errors.push("보유 수량은 0보다 커야 합니다.");
  if (settings.orderUnit < 1) errors.push("주문 단위는 1 이상이어야 합니다.");
  if (cycle.storeInjection > cycle.currentStore) {
    errors.push("STORE 투입금은 현재 STORE보다 클 수 없습니다.");
  }
  return errors;
}
