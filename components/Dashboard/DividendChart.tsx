'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioItem } from '@/lib/types';
import { CalendarRange, Coins } from 'lucide-react';

interface DividendChartProps {
    holdings: PortfolioItem[];
}

export function DividendChart({ holdings }: DividendChartProps) {
    // 月ごとの配当金を計算
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        amount: 0,
        stocks: [] as string[]
    }));

    let totalAnnualDividend = 0;

    holdings.forEach(item => {
        if (item.dividend && item.dividend.payoutMonths && item.dividend.payoutMonths.length > 0) {
            const annualAmount = item.dividend.rate * item.quantity;
            totalAnnualDividend += annualAmount;

            // 支払い回数で割る（通常年2回なら半分ずつ）
            const count = item.dividend.payoutMonths.length;
            const amountPerPayout = Math.floor(annualAmount / count);

            item.dividend.payoutMonths.forEach(month => {
                // month in JSON is 1-12. Array index 0-11
                if (month >= 1 && month <= 12) {
                    monthlyData[month - 1].amount += amountPerPayout;
                    monthlyData[month - 1].stocks.push(item.name);
                }
            });
        }
    });

    const currentMonth = new Date().getMonth() + 1;

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden h-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <CalendarRange className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-lg">配当金カレンダー (受取予定)</CardTitle>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">年間受取予定額</p>
                        <div className="flex items-center space-x-1 justify-end">
                            <Coins size={14} className="text-emerald-500" />
                            <p className="text-xl font-black font-mono text-emerald-600">¥{totalAnnualDividend.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${val}月`}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `¥${val / 1000}k`}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9', rx: 4 }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 z-50">
                                                <p className="text-xs font-bold text-slate-400 mb-1">{label}月 受取予定</p>
                                                <p className="text-lg font-black font-mono text-emerald-600">¥{Number(payload[0].value).toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {monthlyData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.month === currentMonth ? '#10b981' : '#a7f3d0'}
                                        className="transition-all hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <p className="text-[10px] text-slate-400 text-center w-full">※ 直近の決算情報に基づく推定値です。実際の入金とは異なる場合があります。</p>
                </div>
            </CardContent>
        </Card>
    );
}
