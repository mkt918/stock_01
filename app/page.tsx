'use client';

import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AssetHistoryChart } from '@/components/Dashboard/AssetHistoryChart';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, History, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useAssetSummary } from '@/hooks/useAssetSummary';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const { holdings, resetGame } = useGameStore();
    const [mounted, setMounted] = useState(false);

    const { lastUpdated, isRefreshing, indices, handleRefresh } = useAutoRefresh(60000);
    const { cash, totalAssets, profit, profitPercent } = useAssetSummary();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

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
                    Object.values(indices).map((idx) => (
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

            {/* Charts Section */}
            <div className="space-y-8">
                <AssetHistoryChart />

                {/* Asset Composition Chart - Expanded */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 pb-6">
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">保有資産構成</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Composition</p>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-16">
                            <div className="w-full h-[400px] lg:w-3/5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={100}
                                            outerRadius={150}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `¥${Number(value).toLocaleString()}`}
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold', fontSize: '14px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full lg:w-2/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                {pieData.map((entry, index) => {
                                    const percentage = totalAssets > 0 ? (entry.value / totalAssets) * 100 : 0;
                                    return (
                                        <div key={entry.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="text-base font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{entry.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black font-mono text-slate-900">{percentage.toFixed(1)}%</span>
                                                <p className="text-xs font-bold text-slate-400">¥{(entry.value).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
