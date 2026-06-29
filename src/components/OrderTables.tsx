import type { CycleResult, OrderRow, StrategySettings } from "../types";
import { money, price, shares } from "./fields";

interface Props {
  settings: StrategySettings;
  result: CycleResult;
  buyOrders: OrderRow[];
  sellOrders: OrderRow[];
}

function copyText(settings: StrategySettings, result: CycleResult, buyOrders: OrderRow[], sellOrders: OrderRow[]) {
  const buyLines = buyOrders.map((row) => `${row.step}차: ${price(row.price)} / ${row.quantity}주`);
  const sellLines = sellOrders.map((row) => `${row.step}차: ${price(row.price)} / ${row.quantity}주`);
  const text = `${settings.symbol} VR 주문표
새 V: ${money(result.newV)}
하단 밴드: ${money(result.lowerBand)}
상단 밴드: ${money(result.upperBand)}

매수 예약
${buyLines.join("\n") || "없음"}

매도 예약
${sellLines.join("\n") || "없음"}`;

  void navigator.clipboard.writeText(text);
}

function OrderTable({ title, rows, type }: { title: string; rows: OrderRow[]; type: "buy" | "sell" }) {
  return (
    <article className="table-card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>순서</th>
              <th>{type === "buy" ? "매수점 가격" : "매도점 가격"}</th>
              <th>주문 수량</th>
              <th>체결 후 보유 수량</th>
              <th>{type === "buy" ? "예상 사용 Pool" : "예상 증가 Pool"}</th>
              <th>체결 후 Pool</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.step}>
                <td>{row.step}차</td>
                <td>{price(row.price)}</td>
                <td>{shares(row.quantity)}주</td>
                <td>{shares(row.sharesAfter)}주</td>
                <td>{money(row.poolChange)}</td>
                <td>{money(row.poolAfter)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6}>생성 가능한 예약표가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function OrderTables({ settings, result, buyOrders, sellOrders }: Props) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>주문표</h2>
        <p>매수표는 이번 사이클 Pool 사용 가능액 안에서 최대 10줄까지 생성됩니다.</p>
      </div>
      <div className="split-grid">
        <OrderTable title="매수 예약표" rows={buyOrders} type="buy" />
        <OrderTable title="매도 예약표" rows={sellOrders} type="sell" />
      </div>
      <button className="primary-action" type="button" onClick={() => copyText(settings, result, buyOrders, sellOrders)}>
        토스증권 입력용 복사
      </button>
    </section>
  );
}
