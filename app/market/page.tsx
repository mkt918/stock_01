'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { TradeModal } from '@/components/Market/TradeModal';

export default function MarketPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            // 1. Get List
            const res = await fetch('/api/edinet?type=list');
            const list: Stock[] = await res.json();

            // 2. Fetch prices for visible stocks (Simulation/Scraping)
            // Doing this for all 30 might be slow if sequential. Parallelize.
            const stockWithPrices = await Promise.all(list.map(async (s) => {
                try {
                    const pRes = await fetch(`/api/price?code=${s.code}`);
                    const pData = await pRes.json();
                    return { ...s, ...pData };
                } catch (e) {
                    return s;
                }
            }));

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
                    <h1 className="text-3xl font-bold">株式市場</h1>
                    <p className="text-slate-500">リアルタイムでの取引が可能です</p>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="銘柄名・コードで検索"
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchStocks}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="更新"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((stock) => (
                    <Card key={stock.code} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 overflow-hidden">
                        <CardContent className="p-5" onClick={() => setSelectedStock(stock)}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{stock.code}</span>
                                {/* EDINET Doc Link logic could go here */}
                            </div>
                            <h3 className="font-bold text-lg truncate mb-4">{stock.name}</h3>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400">現在値</p>
                                    <p className="text-xl font-bold font-mono">
                                        {stock.price ? `¥${stock.price.toLocaleString()}` : '-'}
                                    </p>
                                </div>
                                <div className={`text-right ${stock.change && stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <div className="flex items-center justify-end space-x-1">
                                        {stock.change && stock.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        <span className="font-bold">{stock.changePercent}%</span>
                                    </div>
                                    <p className="text-xs">
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
