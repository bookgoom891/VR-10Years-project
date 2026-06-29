import type {
  CycleInput,
  StoreSignalInput,
  StoreSignalResult,
  StrategySettings
} from "../types";
import { money, NumberField } from "./fields";

interface Props {
  settings: StrategySettings;
  cycle: CycleInput;
  store: StoreSignalInput;
  signal: StoreSignalResult;
  onStoreChange: (store: StoreSignalInput) => void;
  onConfirmInjection: () => void;
}

function addDays(date: string, days: number) {
  if (!date) return "-";
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function StorePanel({
  settings,
  cycle,
  store,
  signal,
  onStoreChange,
  onConfirmInjection
}: Props) {
  const remainingSplits = Math.max(settings.storeSplits - store.usedSplits, 0);
  const plannedAmount = remainingSplits > 0 ? cycle.currentStore / remainingSplits : 0;

  const update = <K extends keyof StoreSignalInput>(key: K, value: StoreSignalInput[K]) => {
    onStoreChange({ ...store, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title">
        <h2>STORE(S) 관리</h2>
        <p>이평선 신호 입력은 제거하고, STORE 투입 회차와 금액 관리만 남겼습니다.</p>
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

      <div className="form-grid compact-grid">
        <NumberField
          label="사용한 회차"
          value={store.usedSplits}
          min={0}
          onChange={(value) => update("usedSplits", value)}
        />
      </div>

      <label className="field date-field">
        <span>마지막 STORE 투입일</span>
        <input
          type="date"
          value={store.lastInjectionDate}
          onChange={(event) => update("lastInjectionDate", event.target.value)}
        />
      </label>

      <div className="signal-panel">
        <strong>{signal.labels.join(" · ")}</strong>
        <p>STORE 투입은 자동 신호가 아니라 사용자가 직접 확정하는 수동 관리 항목입니다.</p>
      </div>

      <button
        className="primary-action"
        type="button"
        disabled={cycle.currentStore <= 0 || remainingSplits <= 0}
        onClick={onConfirmInjection}
      >
        STORE 투입 확정
      </button>
    </section>
  );
}
