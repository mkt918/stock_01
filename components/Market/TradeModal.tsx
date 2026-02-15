'use client';

import { useState, useEffect, useRef } from 'react';
import { Stock } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { X, ExternalLink, Activity, Info } from 'lucide-react';
import { simulatePrice } from '@/lib/simulation';

interface TradeModalProps {
    stock: Stock;
    isOpen: boolean;
    onClose: () => void;
}

// TradingView Widget for Japanese Stocks (requires code.T format)
function TradingViewWidget({ symbol }: { symbol: string }) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        // TradingView uses TSE:XXXX for Tokyo Stock Exchange codes
        const tvSymbol = `TSE:${symbol.split('.')[0]}`;
        script.innerHTML = JSON.stringify({
            "symbol": tvSymbol,
            "width": "100%",
            "height": "220",
            "locale": "ja",
            "dateRange": "1M",
            "colorTheme": "light",
            "isTransparent": false,
            "autosize": false,
            "largeChartUrl": ""
        });

        container.current.innerHTML = '';
        container.current.appendChild(script);
    }, [symbol]);

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: "220px", overflow: "hidden" }}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}

export function TradeModal({ stock, isOpen, onClose }: TradeModalProps) {
    const [quantity, setQuantity] = useState(100);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [currentPrice, setCurrentPrice] = useState(stock.price || 0);
    const [reason, setReason] = useState('');
    const { cash, holdings, buyStock, sellStock } = useGameStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPrice();
            setReason('');
        }
    }, [isOpen, stock.code]);

    const fetchPrice = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        const priceData = simulatePrice(stock.code, stock.basePrice ?? 1000);
        setCurrentPrice(priceData.price);
        setLoading(false);
    };

    if (!isOpen) return null;

    const totalCost = currentPrice * quantity;
    const holding = holdings.find(h => h.code === stock.code);
    const ownedQuantity = holding ? holding.quantity : 0;
    const avgPrice = holding ? holding.averagePrice : 0;

    const handleTrade = () => {
        if (reason.length < 5) {
            alert("売買理由を5文字以上で入力してください");
            return;
        }

        if (mode === 'buy') {
            if (totalCost > cash) {
                alert("資金が不足しています");
                return;
            }
            buyStock({ ...stock, price: currentPrice }, quantity, reason);
        } else {
            if (quantity > ownedQuantity) {
                alert("保有株数が不足しています");
                return;
            }
            sellStock({ ...stock, price: currentPrice }, quantity, reason);
        }
        onClose();
    };

    const yahooFinanceUrl = `https://finance.yahoo.co.jp/quote/${stock.code}.T`;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{stock.code}</span>
                            <a href={yahooFinanceUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stock.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* Chart Area */}
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-slate-50 h-[220px]">
                            <TradingViewWidget symbol={stock.code} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">現在株価</p>
                                <p className="text-2xl font-black font-mono text-slate-900">
                                    {loading ? "..." : `¥${currentPrice.toLocaleString()}`}
                                </p>
                            </div>
                            <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-100/50">
                                <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">平均取得単価</p>
                                <p className="text-2xl font-black font-mono text-blue-600">
                                    {avgPrice > 0 ? `¥${Math.round(avgPrice).toLocaleString()}` : "未保有"}
                                </p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setMode('buy')}
                                className={`flex-1 py-3 rounded-xl font-black transition-all ${mode === 'buy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                購入 (BUY)
                            </button>
                            <button
                                onClick={() => setMode('sell')}
                                className={`flex-1 py-3 rounded-xl font-black transition-all ${mode === 'sell' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                売却 (SELL)
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 pl-1">数量 (株)</label>
                                    <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                                        <button onClick={() => setQuantity(Math.max(100, quantity - 100))} className="w-10 h-10 flex items-center justify-center font-bold text-slate-500 hover:bg-white rounded-xl transition-all">-</button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full text-center bg-transparent border-none font-black font-mono outline-none"
                                        />
                                        <button onClick={() => setQuantity(quantity + 100)} className="w-10 h-10 flex items-center justify-center font-bold text-slate-500 hover:bg-white rounded-xl transition-all">+</button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 pl-1">想定代金</p>
                                    <div className="h-12 flex items-center px-4 bg-slate-900 rounded-2xl text-white font-mono font-bold">
                                        ¥{totalCost.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Reason Area - The "Stock Note" part */}
                            <div className="space-y-2">
                                <label className="flex items-center text-[10px] font-bold uppercase text-slate-400 pl-1">
                                    <Info size={12} className="mr-1" />
                                    <span>売買理由 (必須: 5文字以上)</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="例: 高値圏を突破したため順張り。 / 悪材料が出尽くしたと判断したため。"
                                    className="w-full h-24 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm placeholder:text-slate-300 transition-all font-medium"
                                />
                            </div>

                            <button
                                onClick={handleTrade}
                                disabled={loading || reason.length < 5 || (mode === 'buy' ? totalCost > cash : quantity > ownedQuantity)}
                                className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100
                    ${mode === 'buy' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
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
