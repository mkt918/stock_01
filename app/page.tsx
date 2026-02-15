'use client';

import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AssetHistoryChart } from '@/components/Dashboard/AssetHistoryChart';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { LatestDisclosures } from '@/components/Dashboard/LatestDisclosures';
import Link from 'next/link';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, History, RefreshCcw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const { cash, holdings, resetGame, updatePrices } = useGameStore();

    const [mounted, setMounted] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [indices, setIndices] = useState<any>({});

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await updatePrices();

        try {
            const res = await fetch('/stock_01/data/indices.json');
            if (res.ok) {
                const data = await res.json();
                setIndices(data);
            }
        } catch (e) {
            console.warn("Failed to fetch indices");
        }

        setLastUpdated(new Date());
        setIsRefreshing(false);
    }, [updatePrices]);

    useEffect(() => {
        setMounted(true);
        handleRefresh();

        const interval = setInterval(() => {
            handleRefresh();
        }, 60000);

        return () => clearInterval(interval);
    }, [handleRefresh]);

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
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                        資産ダッシュボード
                    </h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <p className="text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden">ようこそ、未来の投資家さん</p>
                        {lastUpdated && (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <RefreshCcw size={10} className={isRefreshing ? 'animate-spin' : ''} />
                                <span>最終更新: {lastUpdated.toLocaleTimeString()}</span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium text-slate-600 group"
                    >
                        <RefreshCcw size={16} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span>最新データに更新</span>
                    </button>
                    <button
                        onClick={() => { if (confirm('データをリセットしますか？')) resetGame() }}
                        className="text-xs text-red-300 hover:text-red-500 transition-colors"
                    >
                        リセット
                    </button>
                </div>
            </div>

            {/* Major Indices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(indices).length > 0 ? (
                    Object.values(indices).map((idx: any) => (
                        <div key={idx.name} className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{idx.name}</p>
                                <p className="font-mono font-black text-slate-900">¥{idx.price.toLocaleString()}</p>
                            </div>
                            <div className={`text-right ${idx.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                <div className="flex items-center justify-end space-x-1 text-xs font-bold font-mono">
                                    {idx.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    <span>{idx.changePercent.toFixed(2)}%</span>
                                </div>
                                <p className="text-[10px] font-mono opacity-70">
                                    {idx.change > 0 ? '+' : ''}{idx.change.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-4 text-slate-300 text-xs italic">市場指数を読み込み中...</div>
                )}
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
                                        formatter={(value: any) => `¥${value.toLocaleString()}`}
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

            <LatestDisclosures />
        </div >
    );
}
