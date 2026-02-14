'use client';

import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AssetHistoryChart } from '@/components/Dashboard/AssetHistoryChart';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Link from 'next/link';
import { ArrowRight, Wallet, TrendingUp, History } from 'lucide-react';
import { useEffect, useState } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const { cash, holdings, resetGame } = useGameStore();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const totalStockValue = holdings.reduce((acc, h) => acc + (h.currentPrice * h.quantity), 0);
    const totalAssets = cash + totalStockValue;
    const initialCapital = 10000000;
    const profit = totalAssets - initialCapital;
    const profitPercent = (profit / initialCapital) * 100;

    const pieData = [
        { name: '現金', value: cash },
        ...holdings.map(h => ({ name: h.name, value: h.currentPrice * h.quantity }))
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        資産ダッシュボード
                    </h1>
                    <p className="text-slate-500 mt-1">ようこそ、未来の投資家さん</p>
                </div>
                <button
                    onClick={() => { if (confirm('データをリセットしますか？')) resetGame() }}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
                >
                    リセット
                </button>
            </div>

            {/* Asset Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 shadow-[0_4px_20px_-1px_rgba(59,130,246,0.15)]">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 rounded-full">
                                <Wallet className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">総資産</p>
                                <h3 className="text-2xl font-bold text-slate-900">¥ {totalAssets.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={profit >= 0 ? "bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold" : "bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold"}>
                                {profit >= 0 ? '+' : ''}{profit.toLocaleString()} ({profitPercent.toFixed(2)}%)
                            </span>
                            <span className="ml-2 text-slate-400">vs 初期投資</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-red-100 shadow-[0_4px_20px_-1px_rgba(239,68,68,0.1)]">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <TrendingUp className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">評価損益 (含み益)</p>
                                <h3 className={`text-2xl font-bold ${profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ¥ {profit.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-slate-50 rounded-full">
                                <History className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">現金残高</p>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    ¥ {cash.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssetHistoryChart />

                <Card className="h-96 bg-white border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>ポートフォリオ構成</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `¥${value.toLocaleString()}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-400">データがありません</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>クイックアクション</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Link href="/market" className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">株を購入する</h4>
                                            <p className="text-xs text-slate-500">市場を見て銘柄を探す</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </Link>

                            <Link href="/portfolio" className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                            <Wallet className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">保有銘柄を確認</h4>
                                            <p className="text-xs text-slate-500">詳細な損益状況を見る</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
