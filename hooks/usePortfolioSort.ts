'use client';

import { useState, useMemo } from 'react';
import { PortfolioItem } from '@/lib/types';

export type SortableColumn = 'code' | 'name' | 'ratio' | 'quantity' | 'value' | 'pl';

export interface SortConfig {
    key: SortableColumn;
    direction: 'asc' | 'desc';
}

export interface EnrichedHolding extends PortfolioItem {
    itemValue: number;
    ratio: number;
    pl: number;
}

interface PortfolioSortResult {
    sortedHoldings: EnrichedHolding[];
    sortConfig: SortConfig | null;
    requestSort: (key: SortableColumn) => void;
}

export function usePortfolioSort(
    holdings: PortfolioItem[],
    totalAssets: number
): PortfolioSortResult {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({
        key: 'ratio',
        direction: 'desc',
    });

    const sortedHoldings = useMemo(() => {
        const enriched: EnrichedHolding[] = holdings.map((h) => {
            const itemValue = h.currentPrice * h.quantity;
            const ratio = totalAssets > 0 ? (itemValue / totalAssets) * 100 : 0;
            const pl = (h.currentPrice - h.averagePrice) * h.quantity;
            return { ...h, itemValue, ratio, pl };
        });

        if (!sortConfig) return enriched;

        return [...enriched].sort((a, b) => {
            const aValue = a[sortConfig.key === 'value' ? 'itemValue' : sortConfig.key];
            const bValue = b[sortConfig.key === 'value' ? 'itemValue' : sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [holdings, sortConfig, totalAssets]);

    const requestSort = (key: SortableColumn) => {
        setSortConfig((prev) => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    return { sortedHoldings, sortConfig, requestSort };
}
