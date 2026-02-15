'use client';

import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, TrendingUp, TrendingDown, BookOpen, Clock, Tag } from 'lucide-react';
import { PortfolioItem, Transaction } from '@/lib/types';

export default function PortfolioPage() {
    const { holdings, transactions, cash } = useGameStore();

    const stockValue = holdings.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const totalAssets = cash + stockValue;

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
                                            <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <th className="px-6 py-4">銘柄</th>
                                                <th className="px-6 py-4">保有数</th>
                                                <th className="px-6 py-4">平均単価 / 現在値</th>
                                                <th className="px-6 py-4">評価損益</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {holdings.map((item) => {
                                                const pl = (item.currentPrice - item.averagePrice) * item.quantity;
                                                const plPercent = ((item.currentPrice / item.averagePrice) - 1) * 100;
                                                return (
                                                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 mb-1 inline-block">{item.code}</span>
                                                            <div className="font-bold text-slate-900">{item.name}</div>
                                                        </td>
                                                        <td className="px-6 py-5 font-mono text-slate-700">{item.quantity} 株</td>
                                                        <td className="px-6 py-5 font-mono">
                                                            <div className="text-xs text-slate-400">買: ¥{Math.round(item.averagePrice).toLocaleString()}</div>
                                                            <div className="text-slate-900 font-bold">現: ¥{item.currentPrice.toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className={`font-mono font-bold flex items-center ${pl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {pl >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                                                ¥{Math.round(pl).toLocaleString()}
                                                            </div>
                                                            <div className={`text-xs font-bold ${pl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                                {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                                                            </div>
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
                            <BookOpen className="h-6 w-6 text-purple-600" />
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
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">株式評価額</span>
                                    <span className="font-mono font-bold">¥{stockValue.toLocaleString()}</span>
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
        </div>
    );
}
