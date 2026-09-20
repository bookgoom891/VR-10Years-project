import { useState } from "react";
import type { CycleInput, CycleResult, StrategySettings } from "../types";
import { krw, money, NumericInput, percent, price, shares } from "./fields";

interface Props {
  settings: StrategySettings;
  cycle: CycleInput;
  result: CycleResult;
  onCycleChange: (cycle: CycleInput) => void;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EditableMetricCard({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <article className="metric-card editable-metric-card">
      <label>
        <span>{label}</span>
        <div className="metric-input-wrap">
          <strong>$</strong>
          <NumericInput value={value} onChange={onChange} />
        </div>
      </label>
    </article>
  );
}

export default function Dashboard({ settings, cycle, result, onCycleChange }: Props) {
  const [includeStoreInAssets, setIncludeStoreInAssets] = useState(true);
  const tqqqEquity = cycle.endingPrice * cycle.shares;
  const totalUsdWithStore = tqqqEquity + result.adjustedPool + cycle.currentStore;
  const totalUsdWithoutStore = tqqqEquity + result.adjustedPool;
  const displayedTotalUsd = includeStoreInAssets ? totalUsdWithStore : totalUsdWithoutStore;
  const displayedInitialCapital = includeStoreInAssets
    ? settings.initialCapital
    : settings.initialCapital - settings.initialStore;
  const returnRate = displayedInitialCapital > 0
    ? (displayedTotalUsd - displayedInitialCapital) / displayedInitialCapital
    : 0;

  return (
    <section className="dashboard dashboard-grouped">
      <div className="dashboard-area v-area">
        <h2>V값</h2>
        <div className="metric-grid">
          <MetricCard label="현재 적용 V" value={money(cycle.previousV)} />
          <MetricCard label="다음 사이클 예상 V" value={money(result.newV)} />
          <MetricCard label="현재 V 기준 하단 밴드" value={money(result.lowerBand)} />
          <MetricCard label="현재 V 기준 상단 밴드" value={money(result.upperBand)} />
        </div>
      </div>

      <div className="dashboard-area market-area">
        <h2>평가금 · 단가 · 환율</h2>
        <div className="metric-grid">
          <MetricCard label={`현재 ${settings.symbol} 평가금`} value={money(tqqqEquity)} />
          <MetricCard label={`현재 ${settings.symbol} 보유 수량`} value={`${shares(cycle.shares)}주`} />
          <MetricCard label={`현재 ${settings.symbol} 단가`} value={price(cycle.endingPrice)} />
          <MetricCard label="현재 환율" value={`${cycle.exchangeRate.toLocaleString("ko-KR")}원/USD`} />
        </div>
      </div>

      <div className="dashboard-area pool-area">
        <h2>POOL</h2>
        <div className="metric-grid">
          <MetricCard label="현재 Pool" value={money(result.adjustedPool)} />
          <MetricCard label="이번 사이클 Pool 사용 가능액" value={money(result.cyclePoolBudget)} />
          <EditableMetricCard
            label="이번 사이클 적립금"
            value={cycle.contribution}
            onChange={(value) => onCycleChange({ ...cycle, contribution: value })}
          />
          <MetricCard label="사이클 당 인출금" value={money(cycle.withdrawal)} />
        </div>
      </div>

      <div className="dashboard-area asset-area">
        <div className="area-heading">
          <h2>STORE · 자산</h2>
          <label className="asset-toggle">
            <input
              type="checkbox"
              checked={includeStoreInAssets}
              onChange={(event) => setIncludeStoreInAssets(event.target.checked)}
            />
            총자산에 STORE 포함
          </label>
        </div>
        <div className="metric-grid">
          <MetricCard label="현재 STORE(S)" value={money(cycle.currentStore)} />
          <MetricCard label={includeStoreInAssets ? "달러 총자산(STORE 포함)" : "달러 총자산(STORE 제외)"} value={money(displayedTotalUsd)} />
          <MetricCard label={includeStoreInAssets ? "원화 총자산(STORE 포함)" : "원화 총자산(STORE 제외)"} value={krw(displayedTotalUsd * cycle.exchangeRate)} />
          <MetricCard label={includeStoreInAssets ? "총자산 수익률(STORE 포함)" : "총자산 수익률(STORE 제외)"} value={percent(returnRate)} />
        </div>
      </div>
    </section>
  );
}
