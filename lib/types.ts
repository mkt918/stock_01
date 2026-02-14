export interface Stock {
  code: string;
  name: string;
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
}

export interface AssetHistory {
  date: string;
  totalAssets: number;
  cash: number;
  stockValue: number;
}
