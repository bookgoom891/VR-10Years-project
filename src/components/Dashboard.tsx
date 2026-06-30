import type { CycleInput, CycleResult, StoreSignalResult, StrategySettings } from "../types";
import { krw, money, price } from "./fields";

interface Props {
  settings: StrategySettings;
  cycle: CycleInput;
  result: CycleResult;
  storeSignal: StoreSignalResult;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function Dashboard({ settings, cycle, result, storeSignal }: Props) {
  return (
    <section className="dashboard dashboard-grouped">
      <div className="dashboard-area v-area">
        <h2>V값</h2>
        <div className="metric-grid">
          <MetricCard label="현재 적용 V" value={money(cycle.previousV)} />
          <MetricCard label="새 V" value={money(result.newV)} />
          <MetricCard label="하단 밴드" value={money(result.lowerBand)} />
          <MetricCard label="상단 밴드" value={money(result.upperBand)} />
        </div>
      </div>

      <div className="dashboard-area market-area">
        <h2>평가금 · 단가 · 환율</h2>
        <div className="metric-grid">
          <MetricCard label={`현재 ${settings.symbol} 평가금 E`} value={money(result.endingEquity)} />
          <MetricCard label={`현재 ${settings.symbol} 단가`} value={price(cycle.endingPrice)} />
          <MetricCard label="현재 환율" value={`${cycle.exchangeRate.toLocaleString("ko-KR")}원/USD`} />
        </div>
      </div>

      <div className="dashboard-area pool-area">
        <h2>POOL</h2>
        <div className="metric-grid">
          <MetricCard label="현재 Pool" value={money(cycle.currentPool)} />
          <MetricCard label="이번 사이클 Pool 사용 가능액" value={money(result.cyclePoolBudget)} />
          <MetricCard label="사이클 당 적립금" value={money(cycle.contribution)} />
          <MetricCard label="사이클 당 인출금" value={money(cycle.withdrawal)} />
        </div>
      </div>

      <div className="dashboard-area asset-area">
        <h2>STORE · 자산</h2>
        <div className="metric-grid">
          <MetricCard label="현재 STORE(S)" value={money(cycle.currentStore)} />
          <MetricCard label="원화 환산 총자산" value={krw(result.totalKrwAssets)} />
          <article className="metric-card signal">
            <span>STORE 상태</span>
            <strong>{storeSignal.labels.join(" · ")}</strong>
          </article>
        </div>
      </div>
    </section>
  );
}
