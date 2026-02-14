'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGameStore } from '@/lib/store';

export function AssetHistoryChart() {
    const { assetHistory } = useGameStore();

    const data = assetHistory.length > 0 ? assetHistory : [
        { date: new Date().toISOString(), totalAssets: 10000000 }
    ];

    const formattedData = data.map(d => ({
        ...d,
        dateStr: new Date(d.date).toLocaleDateString(),
        value: d.totalAssets
    }));

    return (
        <Card className="col-span-1 lg:col-span-2 bg-white border-slate-100 shadow-sm">
            <CardHeader>
                <CardTitle>資産推移</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis
                            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                            tickLine={false} axisLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            formatter={(value: number) => `¥${value.toLocaleString()}`}
                            labelFormatter={(label) => label}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
