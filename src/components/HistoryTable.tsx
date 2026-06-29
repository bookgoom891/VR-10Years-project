import type { HistoryRecord } from "../types";
import { krw, money, shares } from "./fields";

interface Props {
  history: HistoryRecord[];
  memo: string;
  onMemoChange: (memo: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function HistoryTable({ history, memo, onMemoChange, onSave, onDelete, onClear }: Props) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vr-rebalancing-history.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="section-title">
        <h2>기록</h2>
        <p>사이클별 결과를 localStorage에 저장합니다.</p>
      </div>
      <label className="field full">
        <span>메모</span>
        <textarea value={memo} onChange={(event) => onMemoChange(event.target.value)} placeholder="이번 사이클 메모" />
      </label>
      <div className="action-row">
        <button className="primary-action" type="button" onClick={onSave}>이번 사이클 저장</button>
        <button type="button" onClick={exportJson}>JSON 내보내기</button>
        <button type="button" onClick={onClear}>기록 전체 삭제</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>사이클</th>
              <th>날짜</th>
              <th>previousV</th>
              <th>newV</th>
              <th>E</th>
              <th>하단</th>
              <th>상단</th>
              <th>수량</th>
              <th>Pool</th>
              <th>STORE(S)</th>
              <th>적립금</th>
              <th>STORE 투입금</th>
              <th>환율</th>
              <th>총자산 USD</th>
              <th>총자산 KRW</th>
              <th>메모</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{record.cycleNumber}</td>
                <td>{record.date}</td>
                <td>{money(record.previousV)}</td>
                <td>{money(record.newV)}</td>
                <td>{money(record.endingEquity)}</td>
                <td>{money(record.lowerBand)}</td>
                <td>{money(record.upperBand)}</td>
                <td>{shares(record.shares)}주</td>
                <td>{money(record.pool)}</td>
                <td>{money(record.store)}</td>
                <td>{money(record.contribution)}</td>
                <td>{money(record.storeInjection)}</td>
                <td>{record.exchangeRate.toLocaleString("ko-KR")}</td>
                <td>{money(record.totalUsdAssets)}</td>
                <td>{krw(record.totalKrwAssets)}</td>
                <td>{record.memo}</td>
                <td><button type="button" onClick={() => onDelete(record.id)}>삭제</button></td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={17}>저장된 사이클 기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
