'use client';

import { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGameStore } from '@/lib/store';
import { Eye, EyeOff, Calendar, Layers } from 'lucide-react';

const INDEX_CONFIG = [
    { key: '^GSPC', name: 'S&P 500', color: '#ff4d4d' },
    { key: '2559.T', name: '全世界 (オールカントリー)', color: '#ffa64d' }, // Maxis All Country Equity ETF
    { key: '^TPX', name: 'TOPIX', color: '#4dff88' }
];

export function AssetHistoryChart() {
    const { assetHistory, initialCapital } = useGameStore();
    const [mounted, setMounted] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState<Record<string, boolean>>({
        '^GSPC': false,
        '2559.T': false,
        '^TPX': false
    });
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

    useEffect(() => { setMounted(true); }, []);

    const processedData = useMemo(() => {
        if (assetHistory.length === 0) {
            return [{ date: new Date().toISOString(), value: initialCapital, dateStr: new Date().toLocaleDateString() }];
        }

        // Filter and aggregate by timeframe
        let filtered = [...assetHistory];
        if (timeframe === 'weekly') {
            const weeklyMap: Record<string, any> = {};
            filtered.forEach(entry => {
                const date = new Date(entry.date);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                const monday = new Date(date.setDate(diff)).toISOString().split('T')[0];

                // Keep the last entry of the week
                weeklyMap[monday] = entry;
            });
            filtered = Object.values(weeklyMap).sort((a, b) => a.date.localeCompare(b.date));
        }

        // 基準日: 2026年2月16日
        const BENCHMARK_BASE_DATE = new Date('2026-02-16T00:00:00+09:00');

        // Find the base entry for normalization
        // We look for the first entry that is ON or AFTER the base date.
        // If all entries are before base date (unlikely given it's today), use the last one.
        // If all entries are after (future), use the first one.
        let baseEntry = filtered.find(d => new Date(d.date) >= BENCHMARK_BASE_DATE);

        if (!baseEntry) {
            // Case: All history is OLDER than base date (not possible if starting today) 
            // OR All history is NEWER? No, find returns first match.
            // If undefined, it means NO entry is >= base date. All are older.
            // In that case, we should probably use the LATEST entry as a proxy, or just wait.
            // But for robustness, let's use the first available entry if we can't find a match,
            // or maybe the logic is: "Compare against 10M investment on Feb 16".
            // If we have data on Feb 16, use it.
            baseEntry = filtered[0];
        }

        const initialIndexValues: Record<string, number> = {};
        if (baseEntry && baseEntry.indexPrices) {
            Object.keys(baseEntry.indexPrices).forEach(key => {
                initialIndexValues[key] = baseEntry.indexPrices![key];
            });
        }

        return filtered.map(d => {
            const entry: any = {
                ...d,
                dateStr: new Date(d.date).toLocaleDateString(),
                value: d.totalAssets
            };

            // Calculate simulation values for indices (10M * current / initial)
            // Fixed investment amount: 10,000,000 JPY
            const SIMULATION_AMOUNT = 10000000;

            INDEX_CONFIG.forEach(idx => {
                if (d.indexPrices && d.indexPrices[idx.key] && initialIndexValues[idx.key]) {
                    entry[idx.key] = SIMULATION_AMOUNT * (d.indexPrices[idx.key] / initialIndexValues[idx.key]);
                }
            });

            return entry;
        });
    }, [assetHistory, timeframe, initialCapital]);

    const toggleIndex = (key: string) => {
        setVisibleIndices(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!mounted) return null;

    return (
        <Card className="col-span-1 lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 border-b border-slate-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">資産推移比較</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Comparison</p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setTimeframe('daily')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        日足
                    </button>
                    <button
                        onClick={() => setTimeframe('weekly')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        週足
                    </button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                    {INDEX_CONFIG.map(idx => (
                        <button
                            key={idx.key}
                            onClick={() => toggleIndex(idx.key)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-tight ${visibleIndices[idx.key] ? 'bg-white shadow-sm border-slate-200 text-slate-700' : 'bg-slate-50 border-transparent text-slate-400 opacity-60'}`}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: idx.color }} />
                            <span>{idx.name}</span>
                            {visibleIndices[idx.key] ? <Eye size={12} className="ml-1" /> : <EyeOff size={12} className="ml-1" />}
                        </button>
                    ))}
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-tight shadow-sm ml-auto">
                        <Layers size={12} />
                        <span>My Portfolio</span>
                    </div>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="dateStr"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `¥${(value / 10000).toLocaleString()}万`}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                formatter={(value: any) => [`¥${Math.round(value).toLocaleString()}`, ""]}
                                labelFormatter={(label) => `日付: ${label}`}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            />

                            {/* Comparison Indices */}
                            {INDEX_CONFIG.map(idx => (
                                visibleIndices[idx.key] && (
                                    <Line
                                        key={idx.key}
                                        type="monotone"
                                        dataKey={idx.key}
                                        name={idx.name}
                                        stroke={idx.color}
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                )
                            ))}

                            {/* Main Portfolio Value */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                name="ポートフォリオ"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                dot={{ r: 2, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-[10px] text-slate-400 italic text-center">
                    ※ 指数ラインは、基準日（2026年2月16日）に1,000万円を一括投資した場合のシミュレーション推移です。
                </div>
            </CardContent>
        </Card>
    );
}
