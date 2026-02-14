'use client';

import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function PortfolioPage() {
    const { holdings, transactions, cash } = useGameStore();

    const totalValue = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const totalGain = holdings.reduce((sum, h) => sum + (h.currentPrice - h.averagePrice) * h.quantity, 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">ポートフォリオ</h1>
                <p className="text-slate-500">保有資産と取引履歴の管理</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-600 text-white border-none shadow-lg shadow-blue-200">
                    <CardContent className="p-6">
                        <p className="text-blue-100 text-sm">株式評価額</p>
                        <h3 className="text-2xl font-bold">¥ {totalValue.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-slate-500 text-sm">含み損益</p>
                        <h3 className={`text-2xl font-bold ${totalGain >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString()}
                        </h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-slate-500 text-sm">現金余力</p>
                        <h3 className="text-2xl font-bold text-slate-900">¥ {cash.toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle>保有銘柄</CardTitle>
                </CardHeader>
                <CardContent>
                    {holdings.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg">保有している銘柄はありません</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="pb-3 pl-2 font-medium">銘柄</th>
                                        <th className="pb-3 text-right font-medium">保有数</th>
                                        <th className="pb-3 text-right font-medium">平均取得単価</th>
                                        <th className="pb-3 text-right font-medium">現在値</th>
                                        <th className="pb-3 text-right font-medium">評価損益</th>
                                        <th className="pb-3 text-right font-medium">評価額</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {holdings.map((stock) => {
                                        const gain = (stock.currentPrice - stock.averagePrice) * stock.quantity;
                                        const gainPercent = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                                        return (
                                            <tr key={stock.code} className="group hover:bg-slate-50 transition-colors">
                                                <td className="py-4 pl-2">
                                                    <div className="font-bold text-slate-700">{stock.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{stock.code}</div>
                                                </td>
                                                <td className="py-4 text-right">{stock.quantity}株</td>
                                                <td className="py-4 text-right">¥{Math.round(stock.averagePrice).toLocaleString()}</td>
                                                <td className="py-4 text-right font-bold text-slate-700">¥{stock.currentPrice.toLocaleString()}</td>
                                                <td className={`py-4 text-right font-bold ${gain >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {gain >= 0 ? '+' : ''}{gain.toLocaleString()} ({gainPercent.toFixed(1)}%)
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-900">¥{(stock.currentPrice * stock.quantity).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle>取引履歴</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg">取引履歴はありません</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="pb-2 font-medium">日時</th>
                                        <th className="pb-2 font-medium">種別</th>
                                        <th className="pb-2 font-medium">銘柄</th>
                                        <th className="pb-2 text-right font-medium">数量</th>
                                        <th className="pb-2 text-right font-medium">単価</th>
                                        <th className="pb-2 text-right font-medium">受渡金額</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50">
                                            <td className="py-3 text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'buy' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                    {tx.type === 'buy' ? '購入' : '売却'}
                                                </span>
                                            </td>
                                            <td className="py-3 font-medium text-slate-700">{tx.name}</td>
                                            <td className="py-3 text-right">{tx.quantity}</td>
                                            <td className="py-3 text-right">¥{tx.price.toLocaleString()}</td>
                                            <td className="py-3 text-right font-mono text-slate-600">¥{tx.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
