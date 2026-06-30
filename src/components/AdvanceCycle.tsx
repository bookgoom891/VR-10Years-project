import type { AdvancePreview, FillEntry } from "../types";
import { money, NumberField, price, shares } from "./fields";

interface Props {
  fills: FillEntry[];
  preview: AdvancePreview;
  canUndo: boolean;
  onChange: (fills: FillEntry[]) => void;
  onConfirm: () => void;
  onUndo: () => void;
}

function makeManualFill(side: "buy" | "sell"): FillEntry {
  return {
    id: `${side}-manual-${crypto.randomUUID()}`,
    side,
    source: "manual",
    selected: true,
    actualPrice: 0,
    actualQuantity: 1,
    memo: ""
  };
}

export default function AdvanceCycle({
  fills,
  preview,
  canUndo,
  onChange,
  onConfirm,
  onUndo
}: Props) {
  const selectedCount = preview.selectedFills.length;

  function updateFill(id: string, patch: Partial<FillEntry>) {
    onChange(fills.map((fill) => (fill.id === id ? { ...fill, ...patch } : fill)));
  }

  function removeFill(id: string) {
    onChange(fills.filter((fill) => fill.id !== id));
  }

  function renderRows(side: "buy" | "sell") {
    const rows = fills.filter((fill) => fill.side === side);
    return rows.map((fill) => (
      <tr key={fill.id}>
        <td>
          <input
            type="checkbox"
            checked={fill.selected}
            onChange={(event) => updateFill(fill.id, { selected: event.target.checked })}
          />
        </td>
        <td>{fill.source === "order" ? `${fill.orderStep}차` : "직접"}</td>
        <td>{fill.plannedPrice ? price(fill.plannedPrice) : "-"}</td>
        <td>{fill.plannedQuantity ? `${shares(fill.plannedQuantity)}주` : "-"}</td>
        <td>
          <input
            className="table-input"
            type="number"
            step="0.01"
            value={fill.actualPrice}
            onChange={(event) => updateFill(fill.id, { actualPrice: Number(event.target.value) })}
          />
        </td>
        <td>
          <input
            className="table-input"
            type="number"
            step="1"
            value={fill.actualQuantity}
            onChange={(event) => updateFill(fill.id, { actualQuantity: Number(event.target.value) })}
          />
        </td>
        <td>
          <input
            className="table-input memo"
            type="text"
            value={fill.memo}
            onChange={(event) => updateFill(fill.id, { memo: event.target.value })}
          />
        </td>
        <td>
          {fill.source === "manual" && (
            <button type="button" onClick={() => removeFill(fill.id)}>삭제</button>
          )}
        </td>
      </tr>
    ));
  }

  return (
    <section className="panel">
      <div className="section-title with-actions">
        <div>
          <h2>다음 사이클로 넘어가기</h2>
          <p>이전 주문표에서 실제 체결된 항목을 선택하고, 실제 체결가와 수량을 반영합니다.</p>
        </div>
        <div className="action-row compact">
          <button type="button" onClick={onUndo} disabled={!canUndo}>되돌리기</button>
          <button className="primary-action" type="button" onClick={onConfirm}>다음 사이클 확정</button>
        </div>
      </div>

      <div className="split-grid">
        <article className="table-card">
          <div className="section-title with-actions small">
            <h3>매수 체결</h3>
            <button type="button" onClick={() => onChange([...fills, makeManualFill("buy")])}>직접 매수 추가</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>체결</th>
                  <th>구분</th>
                  <th>예약가</th>
                  <th>예약 수량</th>
                  <th>실제 체결가</th>
                  <th>실제 수량</th>
                  <th>메모</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>{renderRows("buy")}</tbody>
            </table>
          </div>
        </article>

        <article className="table-card">
          <div className="section-title with-actions small">
            <h3>매도 체결</h3>
            <button type="button" onClick={() => onChange([...fills, makeManualFill("sell")])}>직접 매도 추가</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>체결</th>
                  <th>구분</th>
                  <th>예약가</th>
                  <th>예약 수량</th>
                  <th>실제 체결가</th>
                  <th>실제 수량</th>
                  <th>메모</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>{renderRows("sell")}</tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="summary-grid">
        <span>선택 체결 <strong>{selectedCount}건</strong></span>
        <span>체결 전 수량 <strong>{shares(preview.sharesBefore)}주</strong></span>
        <span>체결 후 수량 <strong>{shares(preview.sharesAfter)}주</strong></span>
        <span>체결 전 Pool <strong>{money(preview.poolBefore)}</strong></span>
        <span>체결 후 Pool <strong>{money(preview.poolAfter)}</strong></span>
        <span>이번 사이클 E <strong>{money(preview.endingEquity)}</strong></span>
        <span>다음 V <strong>{money(preview.nextV)}</strong></span>
        <span>다음 하단 밴드 <strong>{money(preview.lowerBand)}</strong></span>
        <span>다음 상단 밴드 <strong>{money(preview.upperBand)}</strong></span>
      </div>

      <div className="formula-box">
        <strong>확정 기준</strong>
        <p>매수는 Pool 차감과 수량 증가, 매도는 Pool 증가와 수량 감소로 반영됩니다.</p>
      </div>
    </section>
  );
}
