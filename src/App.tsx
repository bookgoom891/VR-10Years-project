import { useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";
import StrategySetup from "./components/StrategySetup";
import CycleCalculator from "./components/CycleCalculator";
import OrderTables from "./components/OrderTables";
import AdvanceCycle from "./components/AdvanceCycle";
import StorePanel from "./components/StorePanel";
import HistoryTable from "./components/HistoryTable";
import {
  applySettingsToCycle,
  buildBuyOrders,
  buildSellOrders,
  calculateAdvancePreview,
  calculateCycle,
  createFillEntries,
  evaluateStoreSignal,
  validateInputs
} from "./utils/calculations";
import { fetchLatestTqqqClose, fetchUsdKrwRate } from "./utils/marketData";
import { loadFromStorage, saveToStorage } from "./utils/storage";
import type {
  AppTab,
  CycleInput,
  FillEntry,
  HistoryRecord,
  StoreSignalInput,
  StrategySettings,
  UndoSnapshot
} from "./types";

const settingsKey = "vr-rebalancing.settings";
const cycleKey = "vr-rebalancing.cycle";
const storeKey = "vr-rebalancing.store";
const historyKey = "vr-rebalancing.history";
const undoKey = "vr-rebalancing.undo";
const fillsKey = "vr-rebalancing.fills";
const scheduleVersionKey = "vr-rebalancing.schedule-version";
const scheduleVersion = "monday-stage-6-v1";
const stageSixStartDate = "2026-09-14";
const today = toDateInputValue(new Date());
const initialNStage = 6;
const koreanMondayPublicHolidays = new Set([
  "2026-03-02", "2026-05-25", "2026-08-17", "2026-10-05",
  "2027-03-01", "2027-07-19", "2027-08-16", "2027-10-04", "2027-10-11", "2027-12-27",
  "2028-07-17", "2028-10-02", "2028-10-09", "2028-12-25",
  "2029-01-01", "2029-05-07", "2029-05-21", "2029-09-24",
  "2030-05-06",
  "2031-03-03", "2031-05-05",
  "2032-03-01", "2032-05-17", "2032-07-19", "2032-08-16", "2032-10-04", "2032-10-11", "2032-12-27",
  "2033-01-31", "2033-06-06", "2033-07-18", "2033-08-15", "2033-10-03", "2033-10-10", "2033-12-26",
  "2034-07-17", "2034-10-09", "2034-12-25",
  "2035-01-01", "2035-05-07",
  "2036-01-28", "2036-03-03", "2036-05-05", "2036-10-06"
]);
let hasAutoSyncedMarketData = false;

const defaultSettings: StrategySettings = {
  symbol: "TQQQ",
  initialCapital: 30000,
  initialAveragePrice: 125,
  startClosePrice: 125,
  totalOrderQuantity: 120,
  cycleStartDate: stageSixStartDate,
  initialPool: 9000,
  initialStore: 6000,
  bandRate: 0.15,
  gValue: 10,
  cycleDays: 14,
  contribution: 500,
  withdrawal: 0,
  cyclePoolUseLimit: 0.4,
  orderUnit: 2,
  exchangeRate: 1380,
  useStore: true,
  storeSplits: 4,
  storeMinIntervalDays: 90,
  storeMode: "move_to_pool",
  reflectStoreInV: false
};

const defaultCycle: CycleInput = {
  nStage: initialNStage,
  previousV: 15000,
  shares: 120,
  endingPrice: 125,
  currentPool: 9000,
  currentStore: 6000,
  contribution: 500,
  withdrawal: 0,
  storeInjection: 0,
  exchangeRate: 1380,
  manualEndingEquity: 15000,
  useManualEndingEquity: false,
  vStage: "V1"
};

const defaultStore: StoreSignalInput = {
  price: 125,
  prevPrice: 118,
  usedSplits: 0,
  lastInjectionDate: ""
};

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "setup", label: "전략 설정" },
  { id: "cycle", label: "사이클 계산" },
  { id: "orders", label: "주문표" },
  { id: "advance", label: "다음 사이클" },
  { id: "store", label: "STORE(S)" },
  { id: "history", label: "기록" }
];

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return today;
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateText: string) {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateText;
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function isKoreanPublicHoliday(dateText: string) {
  return koreanMondayPublicHolidays.has(dateText);
}

function cycleEndDate(startDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startDate;
  const daysToFirstSunday = (7 - start.getDay()) % 7;
  return addDays(startDate, daysToFirstSunday + 7);
}

function nextCycleStartDate(startDate: string) {
  const monday = addDays(cycleEndDate(startDate), 1);
  return isKoreanPublicHoliday(monday) ? addDays(monday, 1) : monday;
}

function normalizeCycleStartDate(dateText: string) {
  const selected = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return today;

  const day = selected.getDay();
  if (day === 1) return isKoreanPublicHoliday(dateText) ? addDays(dateText, 1) : dateText;
  if (day === 2 && isKoreanPublicHoliday(addDays(dateText, -1))) return dateText;

  const daysUntilMonday = (8 - day) % 7;
  const monday = addDays(dateText, daysUntilMonday);
  return isKoreanPublicHoliday(monday) ? addDays(monday, 1) : monday;
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function cyclePeriod(settings: StrategySettings) {
  const start = settings.cycleStartDate || today;
  const end = cycleEndDate(start);
  return `${formatDate(start)} - ${formatDate(end)} · ${inclusiveDays(start, end)}일`;
}

function normalizeHistory(records: HistoryRecord[]): HistoryRecord[] {
  return records.map((record) => ({
    ...record,
    nStage: Math.max(record.nStage ?? record.cycleNumber ?? 1, 1),
    vStage: record.vStage ?? "V2_PLUS",
    fills: record.fills ?? [],
    poolBefore: record.poolBefore ?? record.pool,
    poolAfter: record.poolAfter ?? record.pool,
    sharesBefore: record.sharesBefore ?? record.shares,
    sharesAfter: record.sharesAfter ?? record.shares
  }));
}

function normalizeCycle(cycle: CycleInput): CycleInput {
  return {
    ...cycle,
    nStage: Math.max(cycle.nStage ?? initialNStage, 1)
  };
}

function needsScheduleMigration() {
  try {
    return localStorage.getItem(scheduleVersionKey) !== scheduleVersion;
  } catch {
    return true;
  }
}

const migrateSchedule = needsScheduleMigration();

function loadInitialSettings() {
  const stored = loadFromStorage(settingsKey, defaultSettings);
  return migrateSchedule ? { ...stored, cycleStartDate: stageSixStartDate } : stored;
}

function loadInitialCycle() {
  const stored = loadFromStorage(cycleKey, defaultCycle);
  return normalizeCycle(migrateSchedule ? { ...stored, nStage: initialNStage } : stored);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("setup");
  const [settings, setSettings] = useState(loadInitialSettings);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [isStrategyEditing, setIsStrategyEditing] = useState(false);
  const [cycle, setCycle] = useState(loadInitialCycle);
  const [store, setStore] = useState(() => loadFromStorage(storeKey, defaultStore));
  const [history, setHistory] = useState<HistoryRecord[]>(() =>
    normalizeHistory(loadFromStorage(historyKey, [] as HistoryRecord[]))
  );
  const [fillDrafts, setFillDrafts] = useState<FillEntry[]>(() =>
    loadFromStorage(fillsKey, [] as FillEntry[])
  );
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(() =>
    loadFromStorage<UndoSnapshot | null>(undoKey, null)
  );
  const [memo, setMemo] = useState("");
  const [marketStatus, setMarketStatus] = useState(
    "외부 데이터는 사용자가 버튼을 눌렀을 때만 가져옵니다."
  );

  useEffect(() => saveToStorage(settingsKey, settings), [settings]);
  useEffect(() => saveToStorage(cycleKey, cycle), [cycle]);
  useEffect(() => saveToStorage(storeKey, store), [store]);
  useEffect(() => saveToStorage(historyKey, history), [history]);
  useEffect(() => saveToStorage(fillsKey, fillDrafts), [fillDrafts]);
  useEffect(() => saveToStorage(undoKey, undoSnapshot), [undoSnapshot]);
  useEffect(() => {
    localStorage.setItem(scheduleVersionKey, scheduleVersion);
  }, []);

  useEffect(() => {
    if (hasAutoSyncedMarketData) return;
    hasAutoSyncedMarketData = true;

    let isActive = true;
    const symbol = settings.symbol;
    setMarketStatus(`${symbol} 현재 단가와 USD/KRW 환율을 자동 반영하는 중입니다...`);

    async function syncMarketDataOnOpen() {
      const [priceResult, exchangeResult] = await Promise.allSettled([
        fetchLatestTqqqClose(symbol),
        fetchUsdKrwRate()
      ]);
      if (!isActive) return;

      const priceSnapshot = priceResult.status === "fulfilled" ? priceResult.value : null;
      const exchangeSnapshot = exchangeResult.status === "fulfilled" ? exchangeResult.value : null;

      if (priceSnapshot || exchangeSnapshot) {
        setSettings((current) => ({
          ...current,
          ...(priceSnapshot ? { startClosePrice: priceSnapshot.price } : {}),
          ...(exchangeSnapshot ? { exchangeRate: exchangeSnapshot.price } : {})
        }));
        setDraftSettings((current) => ({
          ...current,
          ...(priceSnapshot ? { startClosePrice: priceSnapshot.price } : {}),
          ...(exchangeSnapshot ? { exchangeRate: exchangeSnapshot.price } : {})
        }));
        setCycle((current) => ({
          ...current,
          ...(priceSnapshot
            ? {
                previousV: current.vStage === "V1" ? priceSnapshot.price * current.shares : current.previousV,
                endingPrice: priceSnapshot.price,
                manualEndingEquity: priceSnapshot.price * current.shares,
                useManualEndingEquity: false
              }
            : {}),
          ...(exchangeSnapshot ? { exchangeRate: exchangeSnapshot.price } : {})
        }));
        if (priceSnapshot) {
          setStore((current) => ({ ...current, prevPrice: current.price, price: priceSnapshot.price }));
        }
      }

      const successMessages = [
        priceSnapshot ? `${symbol} $${priceSnapshot.price.toFixed(2)}` : "",
        exchangeSnapshot ? `USD/KRW ${exchangeSnapshot.price.toFixed(2)}원` : ""
      ].filter(Boolean);
      const failureMessages = [
        priceResult.status === "rejected" ? priceResult.reason : null,
        exchangeResult.status === "rejected" ? exchangeResult.reason : null
      ]
        .filter(Boolean)
        .map((error) => (error instanceof Error ? error.message : String(error)));

      setMarketStatus(
        failureMessages.length === 0
          ? `자동 반영 완료: ${successMessages.join(" / ")}`
          : `일부 자동 반영 완료: ${successMessages.join(" / ") || "없음"} · 실패: ${failureMessages.join(" / ")}`
      );
    }

    void syncMarketDataOnOpen();
    return () => {
      isActive = false;
    };
  }, []);

  const result = useMemo(() => calculateCycle(settings, cycle), [settings, cycle]);
  const storeSignal = useMemo(() => evaluateStoreSignal(store), [store]);
  const buyOrders = useMemo(
    () => buildBuyOrders(result.lowerBand, cycle.shares, result.adjustedPool, settings.orderUnit, result.cyclePoolBudget),
    [cycle.shares, result.adjustedPool, result.cyclePoolBudget, result.lowerBand, settings.orderUnit]
  );
  const sellOrders = useMemo(
    () => buildSellOrders(result.upperBand, cycle.shares, result.adjustedPool, settings.orderUnit),
    [cycle.shares, result.adjustedPool, result.upperBand, settings.orderUnit]
  );
  const advancePreview = useMemo(
    () => calculateAdvancePreview(settings, cycle, fillDrafts),
    [settings, cycle, fillDrafts]
  );
  const errors = useMemo(() => validateInputs(settings, cycle), [settings, cycle]);

  useEffect(() => {
    if (fillDrafts.length === 0 && (buyOrders.length > 0 || sellOrders.length > 0)) {
      setFillDrafts(createFillEntries(buyOrders, sellOrders));
    }
  }, [buyOrders, sellOrders, fillDrafts.length]);

  function resetFillDrafts() {
    setFillDrafts(createFillEntries(buyOrders, sellOrders));
  }

  function updateCycle(nextCycle: CycleInput) {
    setCycle(nextCycle);
    setFillDrafts([]);
  }

  function syncSettingsToCycle(sourceSettings = settings) {
    setCycle((current) => normalizeCycle(applySettingsToCycle(sourceSettings, current)));
    setFillDrafts([]);
    setMarketStatus("전략 설정값을 현재 사이클 입력값에 반영했습니다.");
  }

  function beginStrategyEdit() {
    setDraftSettings(settings);
    setIsStrategyEditing(true);
  }

  function saveStrategySettings() {
    const normalizedSettings = {
      ...draftSettings,
      cycleStartDate: normalizeCycleStartDate(draftSettings.cycleStartDate)
    };
    setSettings(normalizedSettings);
    setDraftSettings(normalizedSettings);
    setIsStrategyEditing(false);
    syncSettingsToCycle(normalizedSettings);
  }

  function cancelStrategyEdit() {
    setDraftSettings(settings);
    setIsStrategyEditing(false);
  }

  async function refreshExchangeRate() {
    setMarketStatus("USD/KRW 환율을 가져오는 중입니다...");
    try {
      const snapshot = await fetchUsdKrwRate();
      setSettings((current) => ({ ...current, exchangeRate: snapshot.price }));
      setDraftSettings((current) => ({ ...current, exchangeRate: snapshot.price }));
      setCycle((current) => ({ ...current, exchangeRate: snapshot.price }));
      setMarketStatus(`환율 반영 완료: ${snapshot.price.toFixed(2)}원/USD (${snapshot.source})`);
    } catch (error) {
      setMarketStatus(error instanceof Error ? error.message : "환율을 가져오지 못했습니다.");
    }
  }

  async function refreshTqqqClose() {
    setMarketStatus(`${settings.symbol} 최근 종가를 가져오는 중입니다...`);
    try {
      const snapshot = await fetchLatestTqqqClose(settings.symbol);
      setSettings((current) => ({ ...current, startClosePrice: snapshot.price }));
      setDraftSettings((current) => ({ ...current, startClosePrice: snapshot.price }));
      setCycle((current) => ({
        ...current,
        previousV: current.vStage === "V1" ? snapshot.price * current.shares : current.previousV,
        endingPrice: snapshot.price,
        manualEndingEquity: snapshot.price * current.shares,
        useManualEndingEquity: false
      }));
      setStore((current) => ({ ...current, prevPrice: current.price, price: snapshot.price }));
      setMarketStatus(`${settings.symbol} 최근 종가 반영 완료: $${snapshot.price.toFixed(2)} (${snapshot.date}, ${snapshot.source})`);
    } catch (error) {
      setMarketStatus(error instanceof Error ? error.message : "종가를 가져오지 못했습니다.");
    }
  }

  function makeRecord(nextHistoryLength = history.length): HistoryRecord {
    return {
      id: crypto.randomUUID(),
      cycleNumber: nextHistoryLength + 1,
      date: new Date().toISOString().slice(0, 10),
      nStage: cycle.nStage,
      vStage: cycle.vStage,
      previousV: cycle.previousV,
      newV: advancePreview.nextV,
      endingEquity: advancePreview.endingEquity,
      lowerBand: advancePreview.lowerBand,
      upperBand: advancePreview.upperBand,
      shares: advancePreview.sharesAfter,
      sharesBefore: advancePreview.sharesBefore,
      sharesAfter: advancePreview.sharesAfter,
      pool: advancePreview.poolAfter,
      poolBefore: advancePreview.poolBefore,
      poolAfter: advancePreview.poolAfter,
      store: cycle.currentStore,
      contribution: cycle.contribution,
      storeInjection: cycle.storeInjection,
      exchangeRate: cycle.exchangeRate,
      totalUsdAssets: advancePreview.endingEquity + advancePreview.poolAfter + cycle.currentStore,
      totalKrwAssets: (advancePreview.endingEquity + advancePreview.poolAfter + cycle.currentStore) * cycle.exchangeRate,
      fills: advancePreview.selectedFills,
      memo
    };
  }

  function saveCycle() {
    setHistory((current) => [makeRecord(current.length), ...current]);
    setMemo("");
  }

  function confirmAdvanceCycle() {
    const snapshot: UndoSnapshot = {
      settings,
      cycle,
      store,
      history,
      memo,
      activeTab,
      fillDrafts
    };
    const record = makeRecord(history.length);
    const nextStartDate = nextCycleStartDate(settings.cycleStartDate || today);
    const nextCycle: CycleInput = {
      ...cycle,
      previousV: advancePreview.nextV,
      nStage: cycle.nStage + 1,
      shares: advancePreview.sharesAfter,
      currentPool: advancePreview.poolAfter,
      manualEndingEquity: advancePreview.endingEquity,
      useManualEndingEquity: false,
      vStage: "V2_PLUS"
    };

    setUndoSnapshot(snapshot);
    setSettings((current) => ({ ...current, cycleStartDate: nextStartDate }));
    setDraftSettings((current) => ({ ...current, cycleStartDate: nextStartDate }));
    setHistory((current) => [record, ...current]);
    setCycle(nextCycle);
    setFillDrafts([]);
    setMemo("");
    setActiveTab("cycle");
    setMarketStatus("다음 사이클로 넘어갔습니다. 되돌리기는 1회 가능합니다.");
  }

  function undoAdvanceCycle() {
    if (!undoSnapshot) return;
    setSettings(undoSnapshot.settings);
    setDraftSettings(undoSnapshot.settings);
    setCycle(normalizeCycle(undoSnapshot.cycle));
    setStore(undoSnapshot.store);
    setHistory(undoSnapshot.history);
    setMemo(undoSnapshot.memo);
    setFillDrafts(undoSnapshot.fillDrafts);
    setActiveTab(undoSnapshot.activeTab);
    setUndoSnapshot(null);
    setMarketStatus("마지막 다음 사이클 확정을 되돌렸습니다.");
  }

  function confirmStoreInjection() {
    const remainingSplits = Math.max(settings.storeSplits - store.usedSplits, 1);
    const amount = Math.min(cycle.currentStore, cycle.currentStore / remainingSplits);
    if (amount <= 0 || amount > cycle.currentStore) return;

    setStore((current) => ({
      ...current,
      usedSplits: current.usedSplits + 1,
      lastInjectionDate: new Date().toISOString().slice(0, 10)
    }));
    setCycle((current) => ({
      ...current,
      currentStore: current.currentStore - amount,
      currentPool: settings.storeMode === "move_to_pool" ? current.currentPool + amount : current.currentPool,
      storeInjection: amount,
      shares:
        settings.storeMode === "direct_buy" && current.endingPrice > 0
          ? Math.round((current.shares + amount / current.endingPrice) * 100) / 100
          : current.shares
    }));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">TQQQ Value Rebalancing</p>
          <div className="title-row">
            <h1>VR 리밸런싱</h1>
            <div className="v-stage-badge">
              <span>{`현재(${cycle.nStage})단계`}</span>
              <strong>{`V(${cycle.nStage})단계`}</strong>
            </div>
            <div className="period-badge">
              <span>현재 사이클</span>
              <strong>{cyclePeriod(settings)}</strong>
            </div>
          </div>
          <p className="notice">이 앱은 개인 운용 계산 보조 도구이며 투자 판단과 주문 실행은 사용자의 책임입니다.</p>
        </div>
      </header>

      <Dashboard settings={settings} cycle={cycle} result={result} onCycleChange={updateCycle} />

      <section className="market-toolbar">
        <button type="button" onClick={() => syncSettingsToCycle()}>전략 설정을 현재 사이클에 반영</button>
        <button type="button" onClick={refreshExchangeRate}>USD/KRW 환율 가져오기</button>
        <button type="button" onClick={refreshTqqqClose}>{settings.symbol} 최근 종가 가져오기</button>
        <button type="button" onClick={resetFillDrafts}>이전 주문표 다시 불러오기</button>
        <span>{marketStatus}</span>
      </section>

      {errors.length > 0 && (
        <section className="alert-panel">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </section>
      )}

      <nav className="tabs" aria-label="화면 이동">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "setup" && (
        <StrategySetup
          settings={isStrategyEditing ? draftSettings : settings}
          isEditing={isStrategyEditing}
          onChange={setDraftSettings}
          onEdit={beginStrategyEdit}
          onSave={saveStrategySettings}
          onCancel={cancelStrategyEdit}
          onApplyToCycle={() => syncSettingsToCycle(settings)}
        />
      )}
      {activeTab === "cycle" && <CycleCalculator cycle={cycle} result={result} onChange={updateCycle} onRefreshClose={refreshTqqqClose} onRefreshExchangeRate={refreshExchangeRate} />}
      {activeTab === "orders" && <OrderTables settings={settings} result={result} buyOrders={buyOrders} sellOrders={sellOrders} />}
      {activeTab === "advance" && <AdvanceCycle fills={fillDrafts} preview={advancePreview} canUndo={Boolean(undoSnapshot)} onChange={setFillDrafts} onConfirm={confirmAdvanceCycle} onUndo={undoAdvanceCycle} />}
      {activeTab === "store" && <StorePanel settings={settings} cycle={cycle} store={store} signal={storeSignal} onStoreChange={setStore} onConfirmInjection={confirmStoreInjection} />}
      {activeTab === "history" && <HistoryTable history={history} memo={memo} onMemoChange={setMemo} onSave={saveCycle} onDelete={(id) => setHistory((records) => records.filter((record) => record.id !== id))} onClear={() => setHistory([])} />}
    </div>
  );
}
