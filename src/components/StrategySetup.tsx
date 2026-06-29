import type { StrategySettings } from "../types";
import { NumberField, TextField } from "./fields";

interface Props {
  settings: StrategySettings;
  isEditing: boolean;
  onChange: (settings: StrategySettings) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onApplyToCycle: () => void;
  onRefreshExchangeRate: () => void;
}

export default function StrategySetup({
  settings,
  isEditing,
  onChange,
  onEdit,
  onSave,
  onCancel,
  onApplyToCycle,
  onRefreshExchangeRate
}: Props) {
  const update = <K extends keyof StrategySettings>(
    key: K,
    value: StrategySettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title with-actions">
        <div>
          <h2>전략 설정</h2>
          <p>
            자주 바뀌지 않는 기본 전략값입니다. 수정 버튼을 누른 뒤 저장하면 다시 잠깁니다.
          </p>
        </div>
        <div className="action-row compact">
          {!isEditing ? (
            <button className="primary-action" type="button" onClick={onEdit}>
              수정
            </button>
          ) : (
            <>
              <button className="primary-action" type="button" onClick={onSave}>
                저장
              </button>
              <button type="button" onClick={onCancel}>
                취소
              </button>
            </>
          )}
        </div>
      </div>

      <div className="form-grid">
        <TextField label="종목명" value={settings.symbol} disabled={!isEditing} onChange={(value) => update("symbol", value)} />
        <NumberField label="총 초기자본" value={settings.initialCapital} disabled={!isEditing} onChange={(value) => update("initialCapital", value)} />
        <NumberField label="총 주문 수량" value={settings.totalOrderQuantity} disabled={!isEditing} onChange={(value) => update("totalOrderQuantity", value)} suffix="주" />
        <NumberField label="초기 Pool" value={settings.initialPool} disabled={!isEditing} onChange={(value) => update("initialPool", value)} />
        <NumberField label="초기 STORE(S)" value={settings.initialStore} disabled={!isEditing} onChange={(value) => update("initialStore", value)} />
        <NumberField label="밴드 비율" value={settings.bandRate} disabled={!isEditing} step={0.01} onChange={(value) => update("bandRate", value)} suffix="0.15 = 15%" />
        <NumberField label="G값" value={settings.gValue} disabled={!isEditing} onChange={(value) => update("gValue", value)} />
        <NumberField label="사이클 주기" value={settings.cycleDays} disabled={!isEditing} onChange={(value) => update("cycleDays", value)} suffix="일" />
        <NumberField label="정기 적립금" value={settings.contribution} disabled={!isEditing} onChange={(value) => update("contribution", value)} />
        <NumberField label="인출금" value={settings.withdrawal} disabled={!isEditing} onChange={(value) => update("withdrawal", value)} />
        <NumberField label="사이클당 Pool 사용 한도" value={settings.cyclePoolUseLimit} disabled={!isEditing} step={0.01} onChange={(value) => update("cyclePoolUseLimit", value)} suffix="0.4 = 40%" />
        <NumberField label="주문 단위" value={settings.orderUnit} disabled={!isEditing} onChange={(value) => update("orderUnit", value)} suffix="주" />
        <NumberField label="환율" value={settings.exchangeRate} disabled={!isEditing} onChange={(value) => update("exchangeRate", value)} suffix="원/USD" />
        <NumberField label="STORE 분할 횟수" value={settings.storeSplits} disabled={!isEditing} onChange={(value) => update("storeSplits", value)} suffix="회" />
        <NumberField label="STORE 최소 투입 간격" value={settings.storeMinIntervalDays} disabled={!isEditing} onChange={(value) => update("storeMinIntervalDays", value)} suffix="일" />
      </div>

      <div className="option-row">
        <label>
          <input
            type="checkbox"
            checked={settings.useStore}
            disabled={!isEditing}
            onChange={(event) => update("useStore", event.target.checked)}
          />
          STORE 사용
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.reflectStoreInV}
            disabled={!isEditing}
            onChange={(event) => update("reflectStoreInV", event.target.checked)}
          />
          STORE 투입금 V 반영
        </label>
        <label>
          STORE 투입 방식
          <select
            value={settings.storeMode}
            disabled={!isEditing}
            onChange={(event) => update("storeMode", event.target.value as StrategySettings["storeMode"])}
          >
            <option value="direct_buy">direct_buy</option>
            <option value="move_to_pool">move_to_pool</option>
          </select>
        </label>
      </div>

      <div className="action-row">
        <button type="button" onClick={onApplyToCycle}>
          전략 설정을 현재 사이클에 반영
        </button>
        <button type="button" onClick={onRefreshExchangeRate}>
          USD/KRW 환율 가져오기
        </button>
      </div>
    </section>
  );
}
