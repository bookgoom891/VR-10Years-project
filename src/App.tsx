import { useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";
import StrategySetup from "./components/StrategySetup";
import CycleCalculator from "./components/CycleCalculator";
import OrderTables from "./components/OrderTables";
import StorePanel from "./components/StorePanel";
import HistoryTable from "./components/HistoryTable";
import {
  applySettingsToCycle,
  buildBuyOrders,
  buildSellOrders,
  calculateCycle,
  evaluateStoreSignal,
  validateInputs
} from "./utils/calculations";
import { fetchLatestTqqqClose, fetchUsdKrwRate } from "./utils/marketData";
import { loadFromStorage, saveToStorage } from "./utils/storage";
import type {
  AppTab,
  CycleInput,
  HistoryRecord,
  StoreSignalInput,
  StrategySettings
} from "./types";

const settingsKey = "vr-rebalancing.settings";
const cycleKey = "vr-rebalancing.cycle";
const storeKey = "vr-rebalancing.store";
const historyKey = "vr-rebalancing.history";

const defaultSettings: StrategySettings = {
  symbol: "TQQQ",
  initialCapital: 30000,
  totalOrderQuantity: 120,
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
  useManualEndingEquity: false
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
  { id: "store", label: "STORE(S)" },
  { id: "history", label: "기록" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("setup");
  const [settings, setSettings] = useState(() =>
    loadFromStorage(settingsKey, defaultSettings)
  );
  const [draftSettings, setDraftSettings] = useState(settings);
  const [isStrategyEditing, setIsStrategyEditing] = useState(false);
  const [cycle, setCycle] = useState(() => loadFromStorage(cycleKey, defaultCycle));
  const [store, setStore] = useState(() => loadFromStorage(storeKey, defaultStore));
  const [history, setHistory] = useState<HistoryRecord[]>(() =>
    loadFromStorage(historyKey, [] as HistoryRecord[])
  );
  const [memo, setMemo] = useState("");
  const [marketStatus, setMarketStatus] = useState(
    "외부 데이터는 사용자가 버튼을 눌렀을 때만 가져옵니다."
  );

  useEffect(() => saveToStorage(settingsKey, settings), [settings]);
  useEffect(() => saveToStorage(cycleKey, cycle), [cycle]);
  useEffect(() => saveToStorage(storeKey, store), [store]);
  useEffect(() => saveToStorage(historyKey, history), [history]);

  const result = useMemo(() => calculateCycle(settings, cycle), [settings, cycle]);
  const storeSignal = useMemo(() => evaluateStoreSignal(store), [store]);
  const buyOrders = useMemo(
    () =>
      buildBuyOrders(
        result.lowerBand,
        cycle.shares,
        cycle.currentPool,
        settings.orderUnit,
        result.cyclePoolBudget
      ),
    [cycle.currentPool, cycle.shares, result.cyclePoolBudget, result.lowerBand, settings.orderUnit]
  );
  const sellOrders = useMemo(
    () =>
      buildSellOrders(
        result.upperBand,
        cycle.shares,
        cycle.currentPool,
        settings.orderUnit
      ),
    [cycle.currentPool, cycle.shares, result.upperBand, settings.orderUnit]
  );
  const errors = useMemo(() => validateInputs(settings, cycle), [settings, cycle]);

  function syncSettingsToCycle(sourceSettings = settings) {
    setCycle((current) => applySettingsToCycle(sourceSettings, current));
    setMarketStatus("전략 설정값을 현재 사이클 입력값에 반영했습니다.");
  }

  function beginStrategyEdit() {
    setDraftSettings(settings);
    setIsStrategyEditing(true);
  }

  function saveStrategySettings() {
    setSettings(draftSettings);
    setIsStrategyEditing(false);
    syncSettingsToCycle(draftSettings);
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
      setCycle((current) => ({
        ...current,
        endingPrice: snapshot.price,
        manualEndingEquity: snapshot.price * current.shares,
        useManualEndingEquity: false
      }));
      setStore((current) => ({
        ...current,
        prevPrice: current.price,
        price: snapshot.price
      }));
      setMarketStatus(
        `${settings.symbol} 최근 종가 반영 완료: $${snapshot.price.toFixed(2)} (${snapshot.date}, ${snapshot.source})`
      );
    } catch (error) {
      setMarketStatus(error instanceof Error ? error.message : "종가를 가져오지 못했습니다.");
    }
  }

  function saveCycle() {
    const record: HistoryRecord = {
      id: crypto.randomUUID(),
      cycleNumber: history.length + 1,
      date: new Date().toISOString().slice(0, 10),
      previousV: cycle.previousV,
      newV: result.newV,
      endingEquity: result.endingEquity,
      lowerBand: result.lowerBand,
      upperBand: result.upperBand,
      shares: cycle.shares,
      pool: cycle.currentPool,
      store: cycle.currentStore,
      contribution: cycle.contribution,
      storeInjection: cycle.storeInjection,
      exchangeRate: cycle.exchangeRate,
      totalUsdAssets: result.totalUsdAssets,
      totalKrwAssets: result.totalKrwAssets,
      memo
    };
    setHistory((current) => [record, ...current]);
    setMemo("");
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
      currentPool:
        settings.storeMode === "move_to_pool"
          ? current.currentPool + amount
          : current.currentPool,
      storeInjection: amount,
      shares:
        settings.storeMode === "direct_buy" && current.endingPrice > 0
          ? current.shares + Math.floor(amount / current.endingPrice)
          : current.shares
    }));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">TQQQ Value Rebalancing</p>
          <h1>VR 리밸런싱</h1>
          <p className="notice">
            이 앱은 개인 운용 계산 보조 도구이며 투자 판단과 주문 실행은 사용자의 책임입니다.
          </p>
        </div>
        <div className="future-box">
          실시간 API, 백테스트, 계좌 연동, 자동 주문은 추후 확장 영역
        </div>
      </header>

      <Dashboard settings={settings} cycle={cycle} result={result} storeSignal={storeSignal} />

      <section className="market-toolbar">
        <button type="button" onClick={() => syncSettingsToCycle()}>
          전략 설정을 현재 사이클에 반영
        </button>
        <button type="button" onClick={refreshExchangeRate}>USD/KRW 환율 가져오기</button>
        <button type="button" onClick={refreshTqqqClose}>{settings.symbol} 최근 종가 가져오기</button>
        <span>{marketStatus}</span>
      </section>

      {errors.length > 0 && (
        <section className="alert-panel">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </section>
      )}

      <nav className="tabs" aria-label="화면 이동">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
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
          onRefreshExchangeRate={refreshExchangeRate}
        />
      )}
      {activeTab === "cycle" && (
        <CycleCalculator
          cycle={cycle}
          result={result}
          onChange={setCycle}
          onRefreshClose={refreshTqqqClose}
          onRefreshExchangeRate={refreshExchangeRate}
        />
      )}
      {activeTab === "orders" && (
        <OrderTables
          settings={settings}
          result={result}
          buyOrders={buyOrders}
          sellOrders={sellOrders}
        />
      )}
      {activeTab === "store" && (
        <StorePanel
          settings={settings}
          cycle={cycle}
          store={store}
          signal={storeSignal}
          onStoreChange={setStore}
          onConfirmInjection={confirmStoreInjection}
        />
      )}
      {activeTab === "history" && (
        <HistoryTable
          history={history}
          memo={memo}
          onMemoChange={setMemo}
          onSave={saveCycle}
          onDelete={(id) => setHistory((records) => records.filter((record) => record.id !== id))}
          onClear={() => setHistory([])}
        />
      )}
    </div>
  );
}
