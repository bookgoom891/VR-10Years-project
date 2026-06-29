export interface PriceSnapshot {
  price: number;
  date: string;
  source: string;
}

export async function fetchUsdKrwRate(): Promise<PriceSnapshot> {
  const response = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!response.ok) throw new Error("환율 API 응답을 받을 수 없습니다.");
  const data = await response.json();
  const rate = Number(data?.rates?.KRW);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("USD/KRW 환율 값을 찾을 수 없습니다.");
  }

  return {
    price: rate,
    date: String(data?.time_last_update_utc || new Date().toISOString()),
    source: "open.er-api.com"
  };
}

export async function fetchLatestTqqqClose(symbol = "TQQQ"): Promise<PriceSnapshot> {
  const safeSymbol = encodeURIComponent(symbol.toUpperCase());
  const response = await fetch(
    `/market/yahoo/v8/finance/chart/${safeSymbol}?range=10d&interval=1d`
  );

  if (!response.ok) throw new Error("종가 API 응답을 받을 수 없습니다.");
  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];
  const timestamps: number[] = result?.timestamp ?? [];
  let lastIndex = -1;

  for (let index = closes.length - 1; index >= 0; index -= 1) {
    if (typeof closes[index] === "number" && Number.isFinite(closes[index])) {
      lastIndex = index;
      break;
    }
  }

  const price = Number(closes[lastIndex]);
  const date =
    lastIndex >= 0 && timestamps[lastIndex]
      ? new Date(timestamps[lastIndex] * 1000).toISOString().slice(0, 10)
      : "";

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${symbol.toUpperCase()} 최근 종가를 찾을 수 없습니다.`);
  }

  return {
    price,
    date,
    source: "Yahoo Finance via local Vite proxy"
  };
}
