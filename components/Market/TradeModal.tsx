'use client';

import { useState, useEffect } from 'react';
import { Stock, DividendInfo } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { toast } from '@/hooks/useToast';
import { X, ExternalLink, Activity, Info, BarChart3, Wallet2 } from 'lucide-react';
import { simulatePrice } from '@/lib/simulation';

interface TradeModalProps {
    stock: Stock;
    isOpen: boolean;
    onClose: () => void;
}

export function TradeModal({ stock, isOpen, onClose }: TradeModalProps) {
    const [quantity, setQuantity] = useState(100);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [currentPrice, setCurrentPrice] = useState(stock.price || 0);
    const [reason, setReason] = useState('');
    const { cash, holdings, buyStock, sellStock } = useGameStore();
    const [loading, setLoading] = useState(false);

    const [isSimulated, setIsSimulated] = useState(false);

    const [dividendInfo, setDividendInfo] = useState<DividendInfo | undefined>(stock.dividend);

    useEffect(() => {
        if (isOpen) {
            fetchPrice();
            setReason('');
        }
    }, [isOpen, stock.code]);

    const fetchPrice = async () => {
        setLoading(true);
        setIsSimulated(false);
        let fetched = false;
        try {
            // Attempt to fetch real-time data from generated JSON with cache busting
            const res = await fetch(`/stock_01/data/stocks.json?t=${new Date().getTime()}`);
            if (res.ok) {
                const data = await res.json();
                const stockData = data[stock.code];
                if (stockData) {
                    if (stockData.price) {
                        setCurrentPrice(stockData.price);
                    }
                    if (stockData.dividend) {
                        setDividendInfo(stockData.dividend);
                    }
                    fetched = true;
                }
            }
        } catch (error) {
            console.error("Failed to fetch fresh price:", error);
        } finally {
            if (!fetched) {
                // Fallback: Use the price passed via props
                if (stock.price && stock.price > 0) {
                    setCurrentPrice(stock.price);
                    setIsSimulated(true);
                } else {
                    // Only simulate if we absolutely have no data
                    const priceData = simulatePrice(stock.code, stock.basePrice ?? 1000);
                    setCurrentPrice(priceData.price);
                    setIsSimulated(true);
                }
            }
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalCost = currentPrice * quantity;
    const holding = holdings.find(h => h.code === stock.code);
    const ownedQuantity = holding ? holding.quantity : 0;
    const avgPrice = holding ? holding.averagePrice : 0;
    const projectedCash = mode === 'buy' ? cash - totalCost : cash + totalCost;

    const handleTrade = () => {
        if (reason.length < 5) {
            toast.warning("売買理由を5文字以上で入力してください");
            return;
        }

        if (mode === 'buy') {
            if (totalCost > cash) {
                toast.error("資金が不足しています");
                return;
            }
            buyStock({ ...stock, price: currentPrice }, quantity, reason);
        } else {
            if (quantity > ownedQuantity) {
                toast.error("保有株数が不足しています");
                return;
            }
            sellStock({ ...stock, price: currentPrice }, quantity, reason);
        }
        onClose();
    };

    const yahooFinanceUrl = `https://finance.yahoo.co.jp/quote/${stock.code}.T`;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{stock.code}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">株式取引</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stock.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
                        <X size={24} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-8">
                        {/* New Yahoo Finance Button (Replaced Chart) */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">市場分析・詳細データ</p>
                            <a
                                href={yahooFinanceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-5 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                        <BarChart3 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black">Yahoo!ファイナンスを見る</p>
                                        <p className="text-[10px] text-white/70 font-medium">詳細なチャートや適時開示を確認する</p>
                                    </div>
                                </div>
                                <ExternalLink size={20} className="text-white/50 group-hover:text-white transition-colors" />
                            </a>
                        </div>


                        {/* Dividend Info */}
                        {dividendInfo && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">配当利回り</p>
                                    <p className="text-lg font-black text-emerald-700 font-mono">{Number(dividendInfo.yield).toFixed(2)}%</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">予想配当(年)</p>
                                    <p className="text-lg font-black text-emerald-700 font-mono">¥{Number(dividendInfo.rate).toFixed(2)}</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">権利確定月</p>
                                    <p className="text-lg font-black text-emerald-700 font-mono">{dividendInfo.vestingMonths.join('·')}月</p>
                                </div>
                            </div>
                        )}

                        {/* Price & Holdings Summary */}
                        {isSimulated && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                                <p className="text-xs text-amber-700 font-bold">
                                    ⚠️ この銘柄はリアルタイム価格を取得できません。<br />
                                    シミュレーション価格が表示されています。
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-tight">現在株価</p>
                                <p className="text-2xl font-black font-mono text-slate-900 leading-tight">
                                    {loading ? "..." : `¥${currentPrice.toLocaleString()}`}
                                </p>
                            </div>
                            <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100/50 text-center">
                                <p className="text-[10px] uppercase font-bold text-blue-400 mb-1 tracking-tight">保有状況 (株数/評価額)</p>
                                <p className="text-xl font-black font-mono text-blue-600 leading-tight">
                                    {ownedQuantity.toLocaleString()} <span className="text-xs">株</span>
                                </p>
                                {ownedQuantity > 0 && (
                                    <p className="text-sm font-black text-blue-500 mt-1">
                                        ¥{(ownedQuantity * currentPrice).toLocaleString()}
                                    </p>
                                )}
                                {avgPrice > 0 && <p className="text-[10px] font-bold text-blue-300">@¥{Math.round(avgPrice).toLocaleString()}</p>}
                            </div>
                        </div>

                        {/* Buy/Sell Switch */}
                        <div className="flex bg-slate-100 p-1.5 rounded-[20px]">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-4 rounded-2xl font-black transition-all ${mode === 'buy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                購入 (BUY)
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-4 rounded-2xl font-black transition-all ${mode === 'sell' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                売却 (SELL)
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 pl-1">注文数量 (株)</label>
                                    <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                                        <button onClick={() => setQuantity(Math.max(100, quantity - 100))} className="w-12 h-12 flex items-center justify-center font-bold text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all">-</button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full text-center bg-transparent border-none font-black font-mono text-lg outline-none"
                                        />
                                        <button onClick={() => setQuantity(quantity + 100)} className="w-12 h-12 flex items-center justify-center font-bold text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all">+</button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 pl-1">概算約定代金</p>
                                    <div className={`h-14 flex items-center justify-center px-6 rounded-2xl font-mono font-black text-lg ${mode === 'buy' ? 'bg-slate-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        ¥{totalCost.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Cash Balance Info */}
                            <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                        <Wallet2 size={14} />
                                        <span>現金残高 (買付余力)</span>
                                    </div>
                                    <p className="font-mono font-black text-slate-900">¥{cash.toLocaleString()}</p>
                                </div>
                                <div className="h-px bg-slate-200/50 mx-2" />
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                        <Activity size={14} />
                                        <span>取引後残高案</span>
                                    </div>
                                    <p className={`font-mono font-black ${projectedCash < 0 ? 'text-red-500 underline decoration-wavy' : 'text-blue-600'}`}>
                                        ¥{projectedCash.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Reason Area */}
                            <div className="space-y-3">
                                <label className="flex items-center text-[10px] font-bold uppercase text-slate-400 pl-1">
                                    <Info size={12} className="mr-1.5" />
                                    <span>売買理由 (必須: 5文字以上)</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="例: 長期的な上昇トレンドと判断。 / 決算内容が期待を下回ったため売却。"
                                    className="w-full h-28 p-5 bg-slate-50 rounded-[24px] border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm placeholder:text-slate-300 transition-all font-medium leading-relaxed"
                                />
                            </div>

                            <button
                                onClick={handleTrade}
                                disabled={loading || reason.length < 5 || (mode === 'buy' ? totalCost > cash : quantity > ownedQuantity)}
                                className={`w-full py-6 rounded-3xl font-black text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none
                    ${mode === 'buy' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300' : 'bg-red-600 hover:bg-red-700 shadow-red-200 hover:shadow-red-300'}
                `}
                            >
                                {reason.length < 5 ? "理由を入力してください" : (mode === 'buy' ? '注文を確定する (購入)' : '注文を確定する (売却)')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
