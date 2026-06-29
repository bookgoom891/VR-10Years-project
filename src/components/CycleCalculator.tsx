import type { CycleInput, CycleResult } from "../types";
import { krw, money, NumberField } from "./fields";

interface Props {
  cycle: CycleInput;
  result: CycleResult;
  onChange: (cycle: CycleInput) => void;
  onRefreshClose: () => void;
  onRefreshExchangeRate: () => void;
}

export default function CycleCalculator({
  cycle,
  result,
  onChange,
  onRefreshClose,
  onRefreshExchangeRate
}: Props) {
  const update = <K extends keyof CycleInput>(key: K, value: CycleInput[K]) => {
    onChange({ ...cycle, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title">
        <h2>사이클 계산</h2>
        <p>E = 사이클 종료 시 TQQQ 가격 × 현재 보유 수량. 필요하면 E 직접 입력을 켤 수 있습니다.</p>
      </div>
      <div className="form-grid">
        <NumberField label="직전 V" value={cycle.previousV} onChange={(value) => update("previousV", value)} />
        <NumberField label="현재 보유 수량" value={cycle.shares} onChange={(value) => update("shares", value)} suffix="주" />
        <NumberField label="사이클 종료 시 TQQQ 가격" value={cycle.endingPrice} step={0.01} onChange={(value) => update("endingPrice", value)} />
        <NumberField label="현재 Pool" value={cycle.currentPool} onChange={(value) => update("currentPool", value)} />
        <NumberField label="현재 STORE(S)" value={cycle.currentStore} onChange={(value) => update("currentStore", value)} />
        <NumberField label="이번 사이클 정기 적립금" value={cycle.contribution} onChange={(value) => update("contribution", value)} />
        <NumberField label="이번 사이클 인출금" value={cycle.withdrawal} onChange={(value) => update("withdrawal", value)} />
        <NumberField label="이번 사이클 STORE 투입금" value={cycle.storeInjection} onChange={(value) => update("storeInjection", value)} />
        <NumberField label="현재 환율" value={cycle.exchangeRate} onChange={(value) => update("exchangeRate", value)} suffix="원/USD" />
        <NumberField label="E 직접 입력값" value={cycle.manualEndingEquity} onChange={(value) => update("manualEndingEquity", value)} />
      </div>
      <div className="option-row">
        <label className="check-line">
          <input type="checkbox" checked={cycle.useManualEndingEquity} onChange={(event) => update("useManualEndingEquity", event.target.checked)} />
          E 직접 입력 사용
        </label>
        <button type="button" onClick={onRefreshClose}>TQQQ 최근 종가 반영</button>
        <button type="button" onClick={onRefreshExchangeRate}>USD/KRW 환율 반영</button>
      </div>
      <div className="formula-box">
        <strong>계산 결과</strong>
        <p>E {money(result.endingEquity)} · 새 V {money(result.newV)} · 하단 {money(result.lowerBand)} · 상단 {money(result.upperBand)}</p>
        <p>총 전략 자산 {money(result.totalUsdAssets)} · 원화 참고 {krw(result.totalKrwAssets)}</p>
      </div>
    </section>
  );
}
