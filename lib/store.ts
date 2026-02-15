import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Stock, PortfolioItem, Transaction, AssetHistory } from './types';

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
    recordHistory: () => void; // Call this periodically or on page load to track assets over time
    updatePrices: () => Promise<void>; // Fetch latest prices for all holdings
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
                const totalCost = stock.price! * quantity; // Assume price exists

                if (totalCost > cash) {
                    alert("資金不足です！");
                    return;
                }

                const newCash = cash - totalCost;

                // Update holdings
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
                    id: Math.random().toString(36).substring(7),
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
            },

            sellStock: (stock, quantity, reason) => {
                const { cash, holdings, transactions } = get();
                const existingItem = holdings.find(h => h.code === stock.code);

                if (!existingItem || existingItem.quantity < quantity) {
                    alert("保有数が不足しています！");
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
                    id: Math.random().toString(36).substring(7),
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

                // Attempt to get the latest index prices from a transient state if we want real-time, 
                // but since recordHistory is called during updatePrices, we can pass them or fetch them.
                // For now, let's keep it simple and record history without indices if not available, 
                // but we'll try to fetch indices in updatePrices and then record.

                const newEntry: AssetHistory = {
                    date: new Date().toISOString(),
                    totalAssets,
                    cash,
                    stockValue
                };

                // Note: Index prices will be merged in updatePrices below to ensure accuracy
                set({ assetHistory: [...assetHistory, newEntry] });
            },

            updatePrices: async () => {
                const { holdings, assetHistory } = get();

                try {
                    // Fetch stocks
                    const stockRes = await fetch('/stock_01/data/stocks.json');
                    let stockData: Record<string, any> = {};
                    if (stockRes.ok) {
                        stockData = await stockRes.json();
                    }

                    // Fetch indices
                    const indexRes = await fetch('/stock_01/data/indices.json');
                    let indexData: Record<string, any> = {};
                    if (indexRes.ok) {
                        indexData = await indexRes.json();
                    }

                    // Update holdings prices
                    let updated = false;
                    const newHoldings = holdings.map(item => {
                        if (stockData[item.code]) {
                            const newPrice = stockData[item.code].price;
                            if (item.currentPrice !== newPrice) {
                                updated = true;
                                return { ...item, currentPrice: newPrice };
                            }
                        }
                        return item;
                    });

                    // Update store if anything changed
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
