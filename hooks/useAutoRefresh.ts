'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store';

interface AutoRefreshResult {
    lastUpdated: Date | null;
    isRefreshing: boolean;
    indices: Record<string, { name: string; price: number; change: number; changePercent: number }>;
    handleRefresh: () => Promise<void>;
}

export function useAutoRefresh(intervalMs: number = 300000): AutoRefreshResult {
    const updatePrices = useGameStore((s) => s.updatePrices);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [indices, setIndices] = useState<Record<string, { name: string; price: number; change: number; changePercent: number }>>({});

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await updatePrices();

        try {
            const res = await fetch('/stock_01/data/indices.json');
            if (res.ok) {
                const data = await res.json();
                setIndices(data);
            }
        } catch {
            // 指数データ取得失敗は非致命的
        }

        setLastUpdated(new Date());
        setIsRefreshing(false);
    }, [updatePrices]);

    useEffect(() => {
        handleRefresh();
        const interval = setInterval(handleRefresh, intervalMs);
        return () => clearInterval(interval);
    }, [handleRefresh, intervalMs]);

    return { lastUpdated, isRefreshing, indices, handleRefresh };
}
