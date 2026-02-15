'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { TradeModal } from '@/components/Market/TradeModal';
import { POPULAR_STOCKS } from '@/lib/constants';
import { simulatePrice } from '@/lib/simulation';

export default function MarketPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const list = POPULAR_STOCKS;

            // Try to fetch static data first
            let staticData: Record<string, any> = {};
            try {
                const res = await fetch('/stock_01/data/stocks.json');
                if (res.ok) {
                    staticData = await res.json();
                    setLastUpdated(new Date());
                }
            } catch (e) {
                console.warn("Static data not found, using simulation fallback");
            }

            const stockWithPrices = list.map((s) => {
                if (staticData[s.code]) {
                    const d = staticData[s.code];
                    return {
                        ...s,
                        price: d.price,
                        change: d.change,
                        changePercent: d.changePercent
                    };
                }
                // Fallback to simulation
                const simulated = simulatePrice(s.code, s.basePrice ?? 1000);
                return { ...s, ...simulated };
            });

            setStocks(stockWithPrices);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredStocks = stocks.filter(s =>
        s.name.includes(search) || s.code.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">株式市場</h1>
                    <div className="flex items-center space-x-2">
                        <p className="text-slate-500 text-sm">リアルタイムでの取引が可能です (日本株のみ)</p>
                        {lastUpdated && (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                                最終同期: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="銘柄名・コードで検索"
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchStocks}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        title="更新"
                    >
                        <RefreshCcw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((stock) => (
                    <Card key={stock.code} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 overflow-hidden bg-white">
                        <CardContent className="p-5" onClick={() => setSelectedStock(stock)}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{stock.code}</span>
                            </div>
                            <h3 className="font-bold text-lg truncate mb-4 text-slate-800">{stock.name}</h3>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400">現在値</p>
                                    <p className="text-xl font-bold font-mono text-slate-900">
                                        {stock.price ? `¥${stock.price.toLocaleString()}` : '-'}
                                    </p>
                                </div>
                                <div className={`text-right ${stock.change && stock.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-70">前日比</p>
                                    <div className="flex items-center justify-end space-x-1">
                                        {stock.change && stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        <span className="font-bold text-sm">{stock.changePercent ? stock.changePercent.toFixed(2) : '0.00'}%</span>
                                    </div>
                                    <p className="text-xs font-mono font-medium">
                                        {stock.change && stock.change > 0 ? '+' : ''}{stock.change}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedStock && (
                <TradeModal
                    stock={selectedStock}
                    isOpen={!!selectedStock}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    );
}
