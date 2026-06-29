import type {
  CycleInput,
  CycleResult,
  StoreSignalResult,
  StrategySettings
} from "../types";
import { krw, money } from "./fields";

interface Props {
  settings: StrategySettings;
  cycle: CycleInput;
  result: CycleResult;
  storeSignal: StoreSignalResult;
}

export default function Dashboard({ settings, cycle, result, storeSignal }: Props) {
  const cards = [
    ["현재 V", money(cycle.previousV)],
    ["새 V", money(result.newV)],
    ["하단 밴드", money(result.lowerBand)],
    ["상단 밴드", money(result.upperBand)],
    [`현재 ${settings.symbol} 평가금 E`, money(result.endingEquity)],
    ["현재 Pool", money(cycle.currentPool)],
    ["현재 STORE(S)", money(cycle.currentStore)],
    ["이번 사이클 Pool 사용 가능액", money(result.cyclePoolBudget)],
    ["원화 환산 총자산", krw(result.totalKrwAssets)]
  ];

  return (
    <section className="dashboard">
      {cards.map(([label, value]) => (
        <article className="metric-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
      <article className="metric-card signal">
        <span>STORE 상태</span>
        <strong>{storeSignal.labels.join(" · ")}</strong>
      </article>
    </section>
  );
}
