'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store';

const INITIAL_CAPITAL = 10_000_000;

interface AssetSummary {
    cash: number;
    totalStockValue: number;
    totalAssets: number;
    profit: number;
    profitPercent: number;
    initialCapital: number;
}

export function useAssetSummary(): AssetSummary {
    const cash = useGameStore((s) => s.cash);
    const holdings = useGameStore((s) => s.holdings);

    return useMemo(() => {
        const totalStockValue = holdings.reduce(
            (acc, h) => acc + h.currentPrice * h.quantity,
            0
        );
        const totalAssets = cash + totalStockValue;
        const profit = totalAssets - INITIAL_CAPITAL;
        const profitPercent = (profit / INITIAL_CAPITAL) * 100;
        return { cash, totalStockValue, totalAssets, profit, profitPercent, initialCapital: INITIAL_CAPITAL };
    }, [cash, holdings]);
}
