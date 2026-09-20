import type { ReactNode } from "react";
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
}

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="settings-section">
      <h3>{title}</h3>
      <div className="form-grid">{children}</div>
    </section>
  );
}

export default function StrategySetup({
  settings,
  isEditing,
  onChange,
  onEdit,
  onSave,
  onCancel,
  onApplyToCycle
}: Props) {
  const update = <K extends keyof StrategySettings>(key: K, value: StrategySettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="panel">
      <div className="section-title with-actions">
        <div>
          <h2>전략 설정</h2>
        </div>
        <div className="action-row compact">
          {!isEditing ? (
            <button className="primary-action" type="button" onClick={onEdit}>수정</button>
          ) : (
            <>
              <button className="primary-action" type="button" onClick={onSave}>저장</button>
              <button type="button" onClick={onCancel}>취소</button>
            </>
          )}
        </div>
      </div>

      <div className="settings-layout">
        <SettingsSection title="기본설정">
          <TextField label="종목명" value={settings.symbol} disabled={!isEditing} onChange={(value) => update("symbol", value)} />
          <label className="field">
            <span>사이클 시작일</span>
            <input
              type="date"
              value={settings.cycleStartDate}
              disabled={!isEditing}
              onChange={(event) => update("cycleStartDate", event.target.value)}
            />
          </label>
          <NumberField label="사이클 주기" value={settings.cycleDays} disabled onChange={(value) => update("cycleDays", value)} suffix="일, 2주 고정" />
          <NumberField label="G값" value={settings.gValue} disabled={!isEditing} onChange={(value) => update("gValue", value)} />
          <NumberField label="밴드 범위" value={settings.bandRate} disabled={!isEditing} step={0.01} onChange={(value) => update("bandRate", value)} suffix="0.15 = 15%" />
          <NumberField label="사이클 당 POOL 사용 한도" value={settings.cyclePoolUseLimit} disabled={!isEditing} step={0.01} onChange={(value) => update("cyclePoolUseLimit", value)} suffix="0.4 = 40%" />
        </SettingsSection>

        <SettingsSection title="가격설정">
          <NumberField label="총 주문 수량" value={settings.totalOrderQuantity} disabled={!isEditing} onChange={(value) => update("totalOrderQuantity", value)} suffix="주" />
          <NumberField label="초기 평단가" value={settings.initialAveragePrice} disabled={!isEditing} step={0.01} onChange={(value) => update("initialAveragePrice", value)} />
          <NumberField label="초기 POOL" value={settings.initialPool} disabled={!isEditing} onChange={(value) => update("initialPool", value)} />
          <NumberField label="사이클 당 적립금" value={settings.contribution} disabled={!isEditing} onChange={(value) => update("contribution", value)} />
          <NumberField label="사이클 당 인출금" value={settings.withdrawal} disabled={!isEditing} onChange={(value) => update("withdrawal", value)} />
        </SettingsSection>

        <SettingsSection title="STORE">
          <NumberField label="초기 STORE 값" value={settings.initialStore} disabled={!isEditing} onChange={(value) => update("initialStore", value)} />
          <NumberField label="분할 횟수" value={settings.storeSplits} disabled={!isEditing} onChange={(value) => update("storeSplits", value)} suffix="회" />
          <NumberField label="최소 투입 간격" value={settings.storeMinIntervalDays} disabled={!isEditing} onChange={(value) => update("storeMinIntervalDays", value)} suffix="일" />
        </SettingsSection>
      </div>

      <div className="action-row">
        <button type="button" onClick={onApplyToCycle}>전략 설정을 현재 사이클에 반영</button>
      </div>
    </section>
  );
}
