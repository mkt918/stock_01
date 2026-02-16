'use client';

import { useState, useEffect, useMemo } from 'react';
import { Stock, DividendInfo } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, TrendingUp, TrendingDown, RefreshCcw, Globe, ExternalLink } from 'lucide-react';
import { TradeModal } from '@/components/Market/TradeModal';
import { POPULAR_STOCKS } from '@/lib/constants';
import { simulatePrice } from '@/lib/simulation';

interface IndexData {
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
}

interface SearchIndexItem {
    code: string;
    name: string;
    shortName: string;
    price: number;
}

export default function MarketPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [indices, setIndices] = useState<Record<string, IndexData>>({});
    const [searchMode, setSearchMode] = useState<'popular' | 'all'>('popular');
    const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
    const [codeInput, setCodeInput] = useState('');
    const [codeSearchResult, setCodeSearchResult] = useState<Stock | null>(null);
    const [codeSearchLoading, setCodeSearchLoading] = useState(false);

    useEffect(() => {
        fetchStocks();
        fetchIndices();
        fetchSearchIndex();
    }, []);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            let staticData: Record<string, { price: number; change: number; changePercent: number; dividend?: DividendInfo }> = {};
            try {
                const res = await fetch(`/stock_01/data/stocks.json?t=${new Date().getTime()}`);
                if (res.ok) {
                    staticData = await res.json();
                    setLastUpdated(new Date());
                }
            } catch {
                // 静的データなし → シミュレーション使用
            }

            const stockWithPrices = POPULAR_STOCKS.map((s) => {
                if (staticData[s.code]) {
                    const d = staticData[s.code];
                    return { ...s, price: d.price, change: d.change, changePercent: d.changePercent, dividend: d.dividend };
                }
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

    const fetchIndices = async () => {
        try {
            const res = await fetch(`/stock_01/data/indices.json?t=${new Date().getTime()}`);
            if (res.ok) {
                const data = await res.json();
                setIndices(data);
            }
        } catch {
            // 指数データなし
        }
    };

    const fetchSearchIndex = async () => {
        try {
            const res = await fetch(`/stock_01/data/search-index.json?t=${new Date().getTime()}`);
            if (res.ok) {
                const data = await res.json();
                setSearchIndex(data);
            }
        } catch {
            // 検索インデックスなし
        }
    };

    const handleCodeSearch = async () => {
        const code = codeInput.trim();
        if (!/^\d{4}$/.test(code)) return;
        setCodeSearchLoading(true);
        setCodeSearchResult(null);
        try {
            // まず search-index から検索
            const found = searchIndex.find(s => s.code === code);
            if (found) {
                setCodeSearchResult({
                    code: found.code,
                    name: found.name,
                    price: found.price,
                    change: 0,
                    changePercent: 0,
                });
            } else {
                // フォールバック: シミュレーション価格で表示
                const sim = simulatePrice(code, 1000);
                setCodeSearchResult({ code, name: `${code}`, price: sim.price, change: sim.change, changePercent: sim.changePercent });
            }
        } finally {
            setCodeSearchLoading(false);
        }
    };

    // 人気銘柄モードのフィルタ
    const filteredPopularStocks = useMemo(
        () => stocks.filter(s => s.name.includes(search) || s.code.includes(search)),
        [stocks, search]
    );

    // 全銘柄モードのフィルタ（search-index.json ベース）
    const filteredAllStocks = useMemo(() => {
        if (!search.trim()) return searchIndex.slice(0, 30);
        const q = search.toLowerCase();
        return searchIndex.filter(s =>
            s.name.includes(search) ||
            s.code.includes(search) ||
            s.shortName.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [searchIndex, search]);

    const displayedStocks = searchMode === 'popular' ? filteredPopularStocks : filteredAllStocks.map(s => ({
        code: s.code,
        name: s.name,
        price: s.price,
        change: 0,
        changePercent: 0,
    } as Stock));

    const indexList = [
        { key: '^GSPC', label: 'S&P 500', flag: '🇺🇸', desc: '米国の代表的な500社の株価指数' },
        { key: '^TPX', label: 'TOPIX', flag: '🇯🇵', desc: '日本の東証全銘柄を対象とした指数' },
        { key: '2559.T', label: '全世界 (オールカントリー)', flag: '🌍', desc: '先進国・新興国を含む全世界の株式' },
    ];

    return (
        <div className="space-y-6">
            {/* 主要指数バー */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {indexList.map(({ key, label, flag, desc }) => {
                    const idx = indices[key];
                    const up = idx && idx.changePercent >= 0;
                    return (
                        <Card key={key} className="bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center space-x-1.5">
                                        <Globe className="h-3 w-3 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{flag} {label}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-2 font-medium">{desc}</p>
                                {idx ? (
                                    <div className="flex items-end justify-between">
                                        <span className="text-xl font-black font-mono text-slate-900">
                                            {idx.currency === 'USD'
                                                ? `$${idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : `¥${idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            }
                                        </span>
                                        <div className={`flex items-center space-x-1 text-sm font-bold ${up ? 'text-red-500' : 'text-green-500'}`}>
                                            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            <span>{up ? '+' : ''}{idx.changePercent.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-300 text-sm font-medium mt-1">データ未取得</p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ヘッダー */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">株式市場</h1>
                    <div className="flex items-center space-x-2">
                        <p className="text-slate-500 text-sm">取引可能な銘柄を検索・売買できます</p>
                        {lastUpdated && (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                                最終同期: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => { fetchStocks(); fetchIndices(); }}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    title="更新"
                >
                    <RefreshCcw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* 検索モード切り替え + 検索バー */}
            <div className="space-y-3">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setSearchMode('popular')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${searchMode === 'popular' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        人気 44 銘柄
                    </button>
                    <button
                        onClick={() => setSearchMode('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${searchMode === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        全銘柄検索
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={searchMode === 'popular' ? '銘柄名・コードで検索' : '銘柄名・コード・英語名で検索'}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 証券コード直接入力 */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">証券コード直接入力</p>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="例: 7203"
                        maxLength={4}
                        className="w-32 px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700 text-center"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
                    />
                    <button
                        onClick={handleCodeSearch}
                        disabled={!/^\d{4}$/.test(codeInput)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-blue-700 transition-colors"
                    >
                        検索
                    </button>
                    {codeInput.length === 4 && (
                        <a
                            href={`https://finance.yahoo.co.jp/quote/${codeInput}.T`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                        >
                            <ExternalLink size={12} />
                            <span>Yahoo Finance</span>
                        </a>
                    )}
                </div>
                {codeSearchLoading && <p className="text-xs text-slate-400 mt-2">検索中...</p>}
                {codeSearchResult && !codeSearchLoading && (
                    <div className="mt-3">
                        <StockCard stock={codeSearchResult} onSelect={setSelectedStock} />
                    </div>
                )}
            </div>

            {/* 銘柄一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedStocks.map((stock) => (
                    <StockCard key={stock.code} stock={stock} onSelect={setSelectedStock} />
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

function StockCard({ stock, onSelect }: { stock: Stock; onSelect: (s: Stock) => void }) {
    const up = (stock.change ?? 0) >= 0;
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 overflow-hidden bg-white">
            <CardContent className="p-5" onClick={() => onSelect(stock)}>
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
                    <div className={`text-right ${up ? 'text-red-500' : 'text-green-500'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-70">前日比</p>
                        <div className="flex items-center justify-end space-x-1">
                            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className="font-bold text-sm">{(stock.changePercent ?? 0).toFixed(2)}%</span>
                        </div>
                        <p className="text-xs font-mono font-medium">
                            {(stock.change ?? 0) > 0 ? '+' : ''}{stock.change ?? 0}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
