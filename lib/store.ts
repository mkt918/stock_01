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
    buyStock: (stock: Stock, quantity: number) => void;
    sellStock: (stock: Stock, quantity: number) => void;
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

            buyStock: (stock, quantity) => {
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
                    total: totalCost
                };

                set({ cash: newCash, holdings: newHoldings, transactions: [transaction, ...transactions] });
                get().recordHistory();
            },

            sellStock: (stock, quantity) => {
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
                    total: totalProceeds
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

                const newEntry: AssetHistory = {
                    date: new Date().toISOString(),
                    totalAssets,
                    cash,
                    stockValue
                };

                set({ assetHistory: [...assetHistory, newEntry] });
            },

            updatePrices: async () => {
                const { holdings } = get();
                if (holdings.length === 0) return;

                try {
                    const pricePromises = holdings.map(async (item) => {
                        const response = await fetch(`/api/stocks?code=${item.code}`);
                        if (response.ok) {
                            const data = await response.json();
                            return { code: item.code, price: data.regularMarketPrice };
                        }
                        return null;
                    });

                    const results = await Promise.all(pricePromises);

                    let newHoldings = [...holdings];
                    let updated = false;

                    results.forEach(res => {
                        if (res) {
                            const index = newHoldings.findIndex(h => h.code === res.code);
                            if (index !== -1 && newHoldings[index].currentPrice !== res.price) {
                                newHoldings[index] = { ...newHoldings[index], currentPrice: res.price };
                                updated = true;
                            }
                        }
                    });

                    if (updated) {
                        set({ holdings: newHoldings });
                        get().recordHistory(); // Record history after price update
                    }
                } catch (error) {
                    console.error("Failed to update prices:", error);
                }
            }
        }),
        {
            name: 'stock-game-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
