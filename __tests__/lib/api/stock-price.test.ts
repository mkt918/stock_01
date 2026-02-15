import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStockPrice } from '../../../lib/api/stock-price';

// yahoo-finance2 をモック
vi.mock('yahoo-finance2', () => ({
    default: {
        quote: vi.fn(),
    },
}));

describe('getStockPrice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('正常時に StockPriceData を返す', async () => {
        const { default: yahooFinance } = await import('yahoo-finance2');
        vi.mocked(yahooFinance.quote).mockResolvedValueOnce({
            symbol: '7203.T',
            regularMarketPrice: 3770,
            regularMarketChange: 50,
            regularMarketChangePercent: 1.34,
            currency: 'JPY',
            shortName: 'TOYOTA MOTOR CORP',
        } as any);

        const result = await getStockPrice('7203');
        expect(result).not.toBeNull();
        expect(result?.regularMarketPrice).toBe(3770);
        expect(result?.symbol).toBe('7203.T');
    });

    it('コードが .T で終わっていない場合に .T を付加する', async () => {
        const { default: yahooFinance } = await import('yahoo-finance2');
        vi.mocked(yahooFinance.quote).mockResolvedValueOnce({
            symbol: '9984.T',
            regularMarketPrice: 10300,
            regularMarketChange: -100,
            regularMarketChangePercent: -0.96,
            currency: 'JPY',
            shortName: 'SoftBank Group',
        } as any);

        await getStockPrice('9984');
        expect(yahooFinance.quote).toHaveBeenCalledWith('9984.T');
    });

    it('すでに .T で終わっているコードはそのまま使う', async () => {
        const { default: yahooFinance } = await import('yahoo-finance2');
        vi.mocked(yahooFinance.quote).mockResolvedValueOnce({
            symbol: '7203.T',
            regularMarketPrice: 3770,
            regularMarketChange: 0,
            regularMarketChangePercent: 0,
            currency: 'JPY',
            shortName: 'TOYOTA',
        } as any);

        await getStockPrice('7203.T');
        expect(yahooFinance.quote).toHaveBeenCalledWith('7203.T');
    });

    it('API エラー時に null を返す', async () => {
        const { default: yahooFinance } = await import('yahoo-finance2');
        vi.mocked(yahooFinance.quote).mockRejectedValueOnce(new Error('Network Error'));

        const result = await getStockPrice('7203');
        expect(result).toBeNull();
    });

    it('quote が null を返すとき null を返す', async () => {
        const { default: yahooFinance } = await import('yahoo-finance2');
        vi.mocked(yahooFinance.quote).mockResolvedValueOnce(null as any);

        const result = await getStockPrice('7203');
        expect(result).toBeNull();
    });
});
