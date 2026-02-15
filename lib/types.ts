/** 銘柄の基本情報（価格なし）*/
export interface StockBase {
  code: string;
  name: string;
  basePrice: number;
}

/** 価格付きの銘柄情報（市場ページ表示用）*/
export interface StockWithPrice extends StockBase {
  price: number;
  change: number;
  changePercent: number;
}

/**
 * コンポーネント間で受け渡す汎用の銘柄型。
 * - 一覧表示時は price などが optional
 * - TradeModal や buyStock に渡す際は price が必須
 */
export interface Stock {
  code: string;
  name: string;
  basePrice?: number;
  price?: number;
  change?: number;
  changePercent?: number;
}

export interface PortfolioItem {
  code: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

export interface Transaction {
  id: string;
  date: string;
  code: string;
  name: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  reason: string;
}

export interface AssetHistory {
  date: string;
  totalAssets: number;
  cash: number;
  stockValue: number;
  indexPrices?: Record<string, number>;
}
