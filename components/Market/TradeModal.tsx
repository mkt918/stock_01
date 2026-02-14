'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface TradeModalProps {
    stock: Stock;
    isOpen: boolean;
    onClose: () => void;
}

export function TradeModal({ stock, isOpen, onClose }: TradeModalProps) {
    const [quantity, setQuantity] = useState(100);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [currentPrice, setCurrentPrice] = useState(stock.price || 0);
    const { cash, holdings, buyStock, sellStock } = useGameStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Re-fetch price to be sure? Or just use passed stock.
            // Ideally we fetch real-time price here.
            fetchPrice();
        }
    }, [isOpen, stock.code]);

    const fetchPrice = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/price?code=${stock.code}`);
            const data = await res.json();
            if (data.price) {
                setCurrentPrice(data.price);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalCost = currentPrice * quantity;
    const holding = holdings.find(h => h.code === stock.code);
    const ownedQuantity = holding ? holding.quantity : 0;

    const handleTrade = () => {
        if (mode === 'buy') {
            if (totalCost > cash) {
                alert("資金が不足しています");
                return;
            }
            buyStock({ ...stock, price: currentPrice }, quantity);
        } else {
            if (quantity > ownedQuantity) {
                alert("保有株数が不足しています");
                return;
            }
            sellStock({ ...stock, price: currentPrice }, quantity);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-700">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <span className="text-xs font-mono text-slate-500">{stock.code}</span>
                        <h3 className="text-xl font-bold">{stock.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex justify-center items-center space-x-6">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">現在株価</p>
                            <p className="text-2xl font-bold font-mono">
                                {loading ? "..." : `¥${currentPrice.toLocaleString()}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('buy')}
                            className={`flex-1 py-2 rounded-md font-medium transition-all ${mode === 'buy' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            購入 (Buy)
                        </button>
                        <button
                            onClick={() => setMode('sell')}
                            className={`flex-1 py-2 rounded-md font-medium transition-all ${mode === 'sell' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            売却 (Sell)
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">数量 (株)</label>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setQuantity(Math.max(100, quantity - 100))}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300"
                                >-</button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="flex-1 text-center py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 100)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300"
                                >+</button>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>概算約定代金</span>
                                <span className="font-bold">¥ {totalCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>{mode === 'buy' ? '買付余力' : '保有株数'}</span>
                                <span>
                                    {mode === 'buy'
                                        ? `¥ ${cash.toLocaleString()}`
                                        : `${ownedQuantity} 株`
                                    }
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleTrade}
                            disabled={loading || (mode === 'buy' ? totalCost > cash : quantity > ownedQuantity)}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${mode === 'buy' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}
                `}
                        >
                            {mode === 'buy' ? '注文する (購入)' : '注文する (売却)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
