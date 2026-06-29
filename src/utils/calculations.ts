import type {
  CycleInput,
  CycleResult,
  OrderRow,
  StoreSignalInput,
  StoreSignalResult,
  StrategySettings
} from "../types";

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
  const estimatedShares =
    cycle.endingPrice > 0
      ? Math.max(1, Math.floor(settings.initialTqqqInvestment / cycle.endingPrice))
      : cycle.shares;

  return {
    ...cycle,
    previousV: settings.initialTqqqInvestment,
    shares: estimatedShares,
    currentPool: settings.initialPool,
    currentStore: settings.initialStore,
    contribution: settings.contribution,
    withdrawal: settings.withdrawal,
    exchangeRate: settings.exchangeRate,
    manualEndingEquity: settings.initialTqqqInvestment,
    storeInjection: 0,
    useManualEndingEquity: false
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
    rows.push({
      step,
      price,
      quantity: orderUnit,
      sharesAfter: currentShares,
      poolChange,
      poolAfter: currentPool
    });
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
    rows.push({
      step,
      price,
      quantity: orderUnit,
      sharesAfter: currentShares,
      poolChange,
      poolAfter: currentPool
    });
  }

  return rows;
}

export function evaluateStoreSignal(input: StoreSignalInput): StoreSignalResult {
  const belowAll =
    input.price < input.ma20 &&
    input.price < input.ma50 &&
    input.price < input.ma100 &&
    input.price < input.ma200;
  const longTermUpButPriceCollapsed =
    belowAll &&
    input.ma200 < input.ma100 &&
    input.ma100 < input.ma50 &&
    input.ma50 < input.ma20;
  const downtrend =
    input.price < input.ma20 &&
    input.ma20 < input.ma50 &&
    input.ma50 < input.ma100 &&
    input.ma100 < input.ma200;
  const crossedAbove20 =
    input.prevPrice < input.prevMa20 && input.price >= input.ma20;
  const reboundSignal =
    crossedAbove20 &&
    input.price < input.ma50 &&
    input.price < input.ma100 &&
    input.price < input.ma200;
  const labels: string[] = [];

  if (belowAll) labels.push("모든 이평선 하회");
  if (longTermUpButPriceCollapsed) labels.push("상승장 급락형");
  if (downtrend) labels.push("역배열 하락형");
  if (reboundSignal) labels.push("20일선 재돌파");

  const isCandidate =
    belowAll || longTermUpButPriceCollapsed || downtrend || reboundSignal;
  if (isCandidate) labels.push("STORE 투입 후보");

  return {
    belowAll,
    longTermUpButPriceCollapsed,
    downtrend,
    reboundSignal,
    labels: labels.length > 0 ? labels : ["신호 없음"],
    isCandidate
  };
}

export function validateInputs(
  settings: StrategySettings,
  cycle: CycleInput
): string[] {
  const errors: string[] = [];
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
