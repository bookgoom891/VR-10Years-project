import type { StrategySettings } from "../types";
import { NumberField, TextField } from "./fields";

interface Props {
  settings: StrategySettings;
  onChange: (settings: StrategySettings) => void;
}

export default function StrategySetup({ settings, onChange }: Props) {
  const update = <K extends keyof StrategySettings>(key: K, value: StrategySettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title">
        <h2>전략 설정</h2>
        <p>자금은 TQQQ 평가금, Pool, STORE(S)로 분리해 달러 기준으로 계산합니다.</p>
      </div>
      <div className="form-grid">
        <TextField label="종목명" value={settings.symbol} onChange={(value) => update("symbol", value)} />
        <NumberField label="총 초기자본" value={settings.initialCapital} onChange={(value) => update("initialCapital", value)} />
        <NumberField label="초기 TQQQ 매수금" value={settings.initialTqqqInvestment} onChange={(value) => update("initialTqqqInvestment", value)} />
        <NumberField label="초기 Pool" value={settings.initialPool} onChange={(value) => update("initialPool", value)} />
        <NumberField label="초기 STORE(S)" value={settings.initialStore} onChange={(value) => update("initialStore", value)} />
        <NumberField label="밴드 비율" value={settings.bandRate} step={0.01} onChange={(value) => update("bandRate", value)} suffix="0.15 = 15%" />
        <NumberField label="G값" value={settings.gValue} onChange={(value) => update("gValue", value)} />
        <NumberField label="사이클 주기" value={settings.cycleDays} onChange={(value) => update("cycleDays", value)} suffix="일" />
        <NumberField label="정기 적립금" value={settings.contribution} onChange={(value) => update("contribution", value)} />
        <NumberField label="인출금" value={settings.withdrawal} onChange={(value) => update("withdrawal", value)} />
        <NumberField label="사이클당 Pool 사용 한도" value={settings.cyclePoolUseLimit} step={0.01} onChange={(value) => update("cyclePoolUseLimit", value)} suffix="0.4 = 40%" />
        <NumberField label="주문 단위" value={settings.orderUnit} onChange={(value) => update("orderUnit", value)} suffix="주" />
        <NumberField label="환율" value={settings.exchangeRate} onChange={(value) => update("exchangeRate", value)} suffix="원/USD" />
        <NumberField label="STORE 분할 횟수" value={settings.storeSplits} onChange={(value) => update("storeSplits", value)} suffix="회" />
        <NumberField label="STORE 최소 투입 간격" value={settings.storeMinIntervalDays} onChange={(value) => update("storeMinIntervalDays", value)} suffix="일" />
      </div>
      <div className="option-row">
        <label><input type="checkbox" checked={settings.useStore} onChange={(event) => update("useStore", event.target.checked)} /> STORE 사용</label>
        <label><input type="checkbox" checked={settings.reflectStoreInV} onChange={(event) => update("reflectStoreInV", event.target.checked)} /> STORE 투입금 V 반영</label>
        <label>
          STORE 투입 방식
          <select value={settings.storeMode} onChange={(event) => update("storeMode", event.target.value as StrategySettings["storeMode"])}>
            <option value="direct_buy">direct_buy</option>
            <option value="move_to_pool">move_to_pool</option>
          </select>
        </label>
      </div>
    </section>
  );
}
