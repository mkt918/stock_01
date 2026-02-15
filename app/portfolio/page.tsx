'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, TrendingUp, TrendingDown, BookOpen, Clock, Tag, ShoppingCart, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { PortfolioItem, Transaction, Stock } from '@/lib/types';
import { TradeModal } from '@/components/Market/TradeModal';

type SortableColumn = 'code' | 'name' | 'ratio' | 'quantity' | 'value' | 'pl';

interface SortConfig {
    key: SortableColumn;
    direction: 'asc' | 'desc';
}

export default function PortfolioPage() {
    const { holdings, transactions, cash } = useGameStore();
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'ratio', direction: 'desc' });

    const stockValue = holdings.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const totalAssets = cash + stockValue;

    const sortedHoldings = useMemo(() => {
        let sortable = holdings.map(h => {
            const itemValue = h.currentPrice * h.quantity;
            const ratio = totalAssets > 0 ? (itemValue / totalAssets) * 100 : 0;
            const pl = (h.currentPrice - h.averagePrice) * h.quantity;
            return { ...h, itemValue, ratio, pl };
        });

        if (sortConfig !== null) {
            sortable.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'code': aValue = a.code; bValue = b.code; break;
                    case 'name': aValue = a.name; bValue = b.name; break;
                    case 'ratio': aValue = a.ratio; bValue = b.ratio; break;
                    case 'quantity': aValue = a.quantity; bValue = b.quantity; break;
                    case 'value': aValue = a.itemValue; bValue = b.itemValue; break;
                    case 'pl': aValue = a.pl; bValue = b.pl; break;
                    default: return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [holdings, sortConfig, totalAssets]);

    const requestSort = (key: SortableColumn) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: SortableColumn }) => {
        if (!sortConfig || sortConfig.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-500" /> : <ChevronDown size={12} className="ml-1 text-blue-500" />;
    };

    return (
        <div className="space-y-8 pb-12">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">ポートフォリオ</h1>
                <p className="text-slate-500 mt-1">現在の保有状況と投資の記録を確認します。</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Holdings List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center space-x-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-lg">保有銘柄</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {holdings.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-slate-400 font-medium">現在保有している銘柄はありません。</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => requestSort('name')}>
                                                    <div className="flex items-center">銘柄 <SortIcon column="name" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => requestSort('ratio')}>
                                                    <div className="flex items-center">構成比 <SortIcon column="ratio" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => requestSort('quantity')}>
                                                    <div className="flex items-center">保有数 <SortIcon column="quantity" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => requestSort('value')}>
                                                    <div className="flex items-center">評価額 <SortIcon column="value" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => requestSort('pl')}>
                                                    <div className="flex items-center">評価損益 <SortIcon column="pl" /></div>
                                                </th>
                                                <th className="px-6 py-4 text-center">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {sortedHoldings.map((item) => {
                                                const stockForModal: Stock = {
                                                    code: item.code,
                                                    name: item.name,
                                                    price: item.currentPrice,
                                                    basePrice: item.averagePrice,
                                                    change: 0,
                                                    changePercent: 0
                                                };

                                                return (
                                                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 mb-1 inline-block">{item.code}</span>
                                                            <div className="font-bold text-slate-900">{item.name}</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-mono font-bold text-slate-700">{item.ratio.toFixed(1)}%</span>
                                                                <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-500 rounded-full"
                                                                        style={{ width: `${item.ratio}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="font-mono text-slate-700 font-bold">{item.quantity.toLocaleString()} <span className="text-[10px] text-slate-400">株</span></div>
                                                            <div className="text-[10px] text-slate-400">@¥{Math.round(item.averagePrice).toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="font-mono font-black text-slate-900">¥{item.itemValue.toLocaleString()}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">現: ¥{item.currentPrice.toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className={`font-mono font-bold flex items-center ${item.pl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {item.pl >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                                                ¥{Math.round(item.pl).toLocaleString()}
                                                            </div>
                                                            <div className={`text-xs font-bold ${item.pl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                                {item.pl >= 0 ? '+' : ''}{((item.currentPrice / item.averagePrice - 1) * 100).toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <button
                                                                onClick={() => setSelectedStock(stockForModal)}
                                                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center space-x-2 mx-auto"
                                                            >
                                                                <ShoppingCart size={16} />
                                                                <span className="text-xs font-bold">売買</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Note (Transaction History) */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 px-2">
                            < BookOpen className="h-6 w-6 text-purple-600" />
                            <h2 className="text-xl font-bold text-slate-800">株ノート (取引記録)</h2>
                        </div>
                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <p className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                                    まだ取引記録がありません。
                                </p>
                            ) : (
                                transactions.map((tx) => (
                                    <Card key={tx.id} className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className={`h-1 w-full ${tx.type === 'buy' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tx.type === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                            {tx.type === 'buy' ? '購入' : '売却'}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">{tx.code}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center">
                                                            <Clock size={10} className="mr-1" />
                                                            {new Date(tx.date).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 text-lg">{tx.name}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">約定代金</p>
                                                    <p className="font-mono font-black text-slate-900 text-xl">¥{tx.total.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-500">{tx.quantity}株 @ ¥{tx.price.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <div className="flex items-center space-x-2 mb-2 text-slate-400">
                                                    <Tag size={12} />
                                                    <span className="text-[10px] font-bold uppercase">売買理由</span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                                    {tx.reason || "理由の記載なし"}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden border-none transform hover:scale-[1.02] transition-transform">
                        <CardContent className="p-8">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">総資産残高</p>
                            <h3 className="text-4xl font-black font-mono">¥{totalAssets.toLocaleString()}</h3>
                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">現金</span>
                                    <span className="font-mono font-bold">¥{cash.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 italic">({totalAssets > 0 ? ((cash / totalAssets) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">株式評価額</span>
                                    <span className="font-mono font-bold">¥{stockValue.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 italic">({totalAssets > 0 ? ((stockValue / totalAssets) * 100).toFixed(1) : 0}%)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm">学習成果</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">取引回数</span>
                                <span className="font-bold text-slate-900">{transactions.length} 回</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">学習メモ数</span>
                                <span className="font-bold text-purple-600">{transactions.filter(t => t.reason).length} 件</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
