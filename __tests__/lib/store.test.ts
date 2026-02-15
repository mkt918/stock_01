import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../lib/store';
import { Stock } from '../../lib/types';

// localStorage をモック
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Toast をモック（store 内部の toast 呼び出しをキャプチャ）
vi.mock('../../hooks/useToast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

const mockStock: Stock = {
    code: '7203',
    name: 'トヨタ自動車',
    price: 3770,
    basePrice: 3770,
};

describe('useGameStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
        useGameStore.setState({
            cash: 10000000,
            initialCapital: 10000000,
            holdings: [],
            transactions: [],
            assetHistory: [],
        });
    });

    describe('buyStock', () => {
        it('購入後に現金が減る', () => {
            const { buyStock } = useGameStore.getState();
            buyStock(mockStock, 100, '長期保有のため購入');

            const { cash } = useGameStore.getState();
            expect(cash).toBe(10000000 - 3770 * 100);
        });

        it('購入後に保有銘柄が追加される', () => {
            const { buyStock } = useGameStore.getState();
            buyStock(mockStock, 100, '長期保有のため購入');

            const { holdings } = useGameStore.getState();
            expect(holdings).toHaveLength(1);
            expect(holdings[0].code).toBe('7203');
            expect(holdings[0].quantity).toBe(100);
        });

        it('同一銘柄の追加購入で平均取得単価が正しく計算される', () => {
            const { buyStock } = useGameStore.getState();
            // 1回目: 100株 @3770
            buyStock(mockStock, 100, '初回購入');
            // 2回目: 200株 @4000
            buyStock({ ...mockStock, price: 4000 }, 200, '買い増し');

            const { holdings } = useGameStore.getState();
            expect(holdings).toHaveLength(1);
            expect(holdings[0].quantity).toBe(300);
            // 平均取得単価: (3770*100 + 4000*200) / 300
            const expectedAvg = (3770 * 100 + 4000 * 200) / 300;
            expect(holdings[0].averagePrice).toBeCloseTo(expectedAvg, 2);
        });

        it('購入後に取引履歴が追加される', () => {
            const { buyStock } = useGameStore.getState();
            buyStock(mockStock, 100, '長期保有のため購入');

            const { transactions } = useGameStore.getState();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].type).toBe('buy');
            expect(transactions[0].quantity).toBe(100);
        });

        it('取引IDが UUID 形式', () => {
            const { buyStock } = useGameStore.getState();
            buyStock(mockStock, 100, '長期保有のため購入');

            const { transactions } = useGameStore.getState();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(transactions[0].id).toMatch(uuidRegex);
        });

        it('資金不足のとき購入が失敗する', async () => {
            const { toast } = await import('../../hooks/useToast');
            const { buyStock } = useGameStore.getState();
            // 初期資金1000万を超える購入
            buyStock(mockStock, 10000, '大量購入');

            const { cash, holdings } = useGameStore.getState();
            expect(cash).toBe(10000000); // 変化なし
            expect(holdings).toHaveLength(0);
            expect(toast.error).toHaveBeenCalled();
        });

        it('購入後に資産履歴が記録される', () => {
            const { buyStock } = useGameStore.getState();
            buyStock(mockStock, 100, '長期保有のため購入');

            const { assetHistory } = useGameStore.getState();
            expect(assetHistory.length).toBeGreaterThan(0);
        });
    });

    describe('sellStock', () => {
        beforeEach(() => {
            // まず購入しておく
            useGameStore.getState().buyStock(mockStock, 100, '初回購入');
        });

        it('売却後に現金が増える', () => {
            const { cash: cashBefore } = useGameStore.getState();
            useGameStore.getState().sellStock(mockStock, 50, '利確のため売却');

            const { cash } = useGameStore.getState();
            expect(cash).toBe(cashBefore + 3770 * 50);
        });

        it('売却後に保有数が減る', () => {
            useGameStore.getState().sellStock(mockStock, 30, '一部売却');

            const { holdings } = useGameStore.getState();
            expect(holdings[0].quantity).toBe(70);
        });

        it('全株売却後に保有銘柄リストから消える', () => {
            useGameStore.getState().sellStock(mockStock, 100, '全株売却');

            const { holdings } = useGameStore.getState();
            expect(holdings).toHaveLength(0);
        });

        it('売却後に取引履歴が追加される', () => {
            const txCountBefore = useGameStore.getState().transactions.length;
            useGameStore.getState().sellStock(mockStock, 50, '利確のため売却');

            const { transactions } = useGameStore.getState();
            expect(transactions.length).toBe(txCountBefore + 1);
            expect(transactions[0].type).toBe('sell');
        });

        it('保有不足のとき売却が失敗する', async () => {
            const { toast } = await import('../../hooks/useToast');
            useGameStore.getState().sellStock(mockStock, 200, '過剰売却');

            const { holdings } = useGameStore.getState();
            expect(holdings[0].quantity).toBe(100); // 変化なし
            expect(toast.error).toHaveBeenCalled();
        });
    });

    describe('resetGame', () => {
        it('ゲームリセット後に初期状態に戻る', () => {
            useGameStore.getState().buyStock(mockStock, 100, '購入');
            useGameStore.getState().resetGame();

            const { cash, holdings, transactions, assetHistory } = useGameStore.getState();
            expect(cash).toBe(10000000);
            expect(holdings).toHaveLength(0);
            expect(transactions).toHaveLength(0);
            expect(assetHistory).toHaveLength(0);
        });
    });

    describe('recordHistory', () => {
        it('資産履歴が正しい値で記録される', () => {
            useGameStore.getState().buyStock(mockStock, 100, '購入');
            const { assetHistory, cash, holdings } = useGameStore.getState();

            const latest = assetHistory[assetHistory.length - 1];
            const stockValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
            expect(latest.cash).toBe(cash);
            expect(latest.stockValue).toBe(stockValue);
            expect(latest.totalAssets).toBe(cash + stockValue);
        });
    });
});
