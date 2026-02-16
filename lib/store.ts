import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Stock, PortfolioItem, Transaction, AssetHistory, DividendInfo } from './types';
import { toast } from '@/hooks/useToast';

interface GameState {
    cash: number;
    initialCapital: number;
    holdings: PortfolioItem[];
    transactions: Transaction[];
    assetHistory: AssetHistory[];

    // Actions
    buyStock: (stock: Stock, quantity: number, reason: string) => void;
    sellStock: (stock: Stock, quantity: number, reason: string) => void;
    resetGame: () => void;
    recordHistory: () => void;
    updatePrices: () => Promise<void>;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            cash: 10000000,
            initialCapital: 10000000,
            holdings: [],
            transactions: [],
            assetHistory: [],

            buyStock: (stock, quantity, reason) => {
                const { cash, holdings, transactions } = get();
                const totalCost = stock.price! * quantity;

                if (totalCost > cash) {
                    toast.error("資金不足です！買付余力を確認してください。");
                    return;
                }

                const newCash = cash - totalCost;

                const existingItem = holdings.find(h => h.code === stock.code);
                let newHoldings = [...holdings];

                if (existingItem) {
                    const totalQty = existingItem.quantity + quantity;
                    const totalValue = (existingItem.averagePrice * existingItem.quantity) + totalCost;
                    const newAvgPrice = totalValue / totalQty;

                    newHoldings = newHoldings.map(h =>
                        h.code === stock.code
                            ? { ...h, quantity: totalQty, averagePrice: newAvgPrice, currentPrice: stock.price! }
                            : h
                    );
                } else {
                    newHoldings.push({
                        code: stock.code,
                        name: stock.name,
                        quantity,
                        averagePrice: stock.price!,
                        currentPrice: stock.price!
                    });
                }

                const transaction: Transaction = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    code: stock.code,
                    name: stock.name,
                    type: 'buy',
                    quantity,
                    price: stock.price!,
                    total: totalCost,
                    reason: reason
                };

                set({ cash: newCash, holdings: newHoldings, transactions: [transaction, ...transactions] });
                get().recordHistory();
                toast.success(`${stock.name} を ${quantity.toLocaleString()} 株購入しました`);
            },

            sellStock: (stock, quantity, reason) => {
                const { cash, holdings, transactions } = get();
                const existingItem = holdings.find(h => h.code === stock.code);

                if (!existingItem || existingItem.quantity < quantity) {
                    toast.error("保有数が不足しています！");
                    return;
                }

                const totalProceeds = stock.price! * quantity;
                const newCash = cash + totalProceeds;

                let newHoldings = [...holdings];
                if (existingItem.quantity === quantity) {
                    newHoldings = newHoldings.filter(h => h.code !== stock.code);
                } else {
                    newHoldings = newHoldings.map(h =>
                        h.code === stock.code
                            ? { ...h, quantity: h.quantity - quantity, currentPrice: stock.price! }
                            : h
                    );
                }

                const transaction: Transaction = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    code: stock.code,
                    name: stock.name,
                    type: 'sell',
                    quantity,
                    price: stock.price!,
                    total: totalProceeds,
                    reason: reason
                };

                set({ cash: newCash, holdings: newHoldings, transactions: [transaction, ...transactions] });
                get().recordHistory();
                toast.success(`${stock.name} を ${quantity.toLocaleString()} 株売却しました`);
            },

            resetGame: () => {
                set({
                    cash: 10000000,
                    holdings: [],
                    transactions: [],
                    assetHistory: []
                });
            },

            recordHistory: () => {
                const { cash, holdings, assetHistory } = get();
                const stockValue = holdings.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
                const totalAssets = cash + stockValue;

                const newEntry: AssetHistory = {
                    date: new Date().toISOString(),
                    totalAssets,
                    cash,
                    stockValue
                };

                set({ assetHistory: [...assetHistory, newEntry] });
            },

            updatePrices: async () => {
                const { holdings, assetHistory } = get();

                try {
                    const stockRes = await fetch(`/stock_01/data/stocks.json?t=${new Date().getTime()}`);
                    let stockData: Record<string, { price: number; dividend?: DividendInfo }> = {};
                    if (stockRes.ok) {
                        stockData = await stockRes.json();
                    }

                    const indexRes = await fetch(`/stock_01/data/indices.json?t=${new Date().getTime()}`);
                    let indexData: Record<string, { price: number }> = {};

                    if (indexRes.ok) {
                        indexData = await indexRes.json();
                    }

                    let updated = false;
                    const newHoldings = holdings.map(item => {
                        if (stockData[item.code]) {
                            updated = true;
                            const data = stockData[item.code];
                            return {
                                ...item,
                                currentPrice: data.price,
                                dividend: data.dividend
                            };
                        }
                        return item;
                    });

                    if (updated || Object.keys(indexData).length > 0) {
                        const stockValue = newHoldings.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
                        const { cash } = get();
                        const totalAssets = cash + stockValue;

                        const indexPrices: Record<string, number> = {};
                        Object.keys(indexData).forEach(key => {
                            indexPrices[key] = indexData[key].price;
                        });

                        const newEntry: AssetHistory = {
                            date: new Date().toISOString(),
                            totalAssets,
                            cash,
                            stockValue,
                            indexPrices
                        };

                        set({
                            holdings: newHoldings,
                            assetHistory: [...assetHistory, newEntry]
                        });
                    }
                } catch (error) {
                    console.error("Failed to update prices/indices:", error);
                }
            }
        }),
        {
            name: 'stock-game-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
