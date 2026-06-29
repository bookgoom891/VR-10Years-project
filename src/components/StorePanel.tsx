import type { CycleInput, StoreSignalInput, StoreSignalResult, StrategySettings } from "../types";
import { money, NumberField } from "./fields";

interface Props {
  settings: StrategySettings;
  cycle: CycleInput;
  store: StoreSignalInput;
  signal: StoreSignalResult;
  onCycleChange: (cycle: CycleInput) => void;
  onStoreChange: (store: StoreSignalInput) => void;
  onConfirmInjection: () => void;
}

function addDays(date: string, days: number) {
  if (!date) return "-";
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function StorePanel({ settings, cycle, store, signal, onStoreChange, onConfirmInjection }: Props) {
  const remainingSplits = Math.max(settings.storeSplits - store.usedSplits, 0);
  const plannedAmount = remainingSplits > 0 ? cycle.currentStore / remainingSplits : 0;
  const update = <K extends keyof StoreSignalInput>(key: K, value: StoreSignalInput[K]) => {
    onStoreChange({ ...store, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title">
        <h2>STORE(S) 관리</h2>
        <p>STORE 신호는 자동 매수 신호가 아니라 투입 후보 알림입니다.</p>
      </div>
      <div className="store-summary">
        <span>초기 STORE 금액 <strong>{money(settings.initialStore)}</strong></span>
        <span>현재 남은 STORE 금액 <strong>{money(cycle.currentStore)}</strong></span>
        <span>분할 횟수 <strong>{settings.storeSplits}회</strong></span>
        <span>사용한 회차 <strong>{store.usedSplits}회</strong></span>
        <span>남은 회차 <strong>{remainingSplits}회</strong></span>
        <span>1회 투입 예정 금액 <strong>{money(plannedAmount)}</strong></span>
        <span>마지막 STORE 투입일 <strong>{store.lastInjectionDate || "-"}</strong></span>
        <span>다음 STORE 투입 가능일 <strong>{addDays(store.lastInjectionDate, settings.storeMinIntervalDays)}</strong></span>
        <span>투입 방식 <strong>{settings.storeMode}</strong></span>
      </div>
      <div className="form-grid">
        <NumberField label="현재 TQQQ 가격" value={store.price} step={0.01} onChange={(value) => update("price", value)} />
        <NumberField label="이전 TQQQ 가격" value={store.prevPrice} step={0.01} onChange={(value) => update("prevPrice", value)} />
        <NumberField label="20일선" value={store.ma20} step={0.01} onChange={(value) => update("ma20", value)} />
        <NumberField label="이전 20일선" value={store.prevMa20} step={0.01} onChange={(value) => update("prevMa20", value)} />
        <NumberField label="50일선" value={store.ma50} step={0.01} onChange={(value) => update("ma50", value)} />
        <NumberField label="100일선" value={store.ma100} step={0.01} onChange={(value) => update("ma100", value)} />
        <NumberField label="200일선" value={store.ma200} step={0.01} onChange={(value) => update("ma200", value)} />
        <NumberField label="사용한 회차" value={store.usedSplits} onChange={(value) => update("usedSplits", value)} />
      </div>
      <label className="field date-field">
        <span>마지막 STORE 투입일</span>
        <input type="date" value={store.lastInjectionDate} onChange={(event) => update("lastInjectionDate", event.target.value)} />
      </label>
      <div className={`signal-panel ${signal.isCandidate ? "hot" : ""}`}>
        <strong>{signal.labels.join(" · ")}</strong>
        <p>조건 충족 여부를 참고해 사용자가 직접 STORE 투입 확정을 눌러야 반영됩니다.</p>
      </div>
      <button className="primary-action" type="button" disabled={!signal.isCandidate || cycle.currentStore <= 0} onClick={onConfirmInjection}>
        STORE 투입 확정
      </button>
    </section>
  );
}
