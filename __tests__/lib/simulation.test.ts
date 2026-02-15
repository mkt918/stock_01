import { describe, it, expect } from 'vitest';
import { simulatePrice } from '../../lib/simulation';

describe('simulatePrice', () => {
    it('同じコードと日付では同じ価格を返す（決定論的）', () => {
        const result1 = simulatePrice('7203', 3770);
        const result2 = simulatePrice('7203', 3770);
        expect(result1.price).toBe(result2.price);
    });

    it('価格が basePrice から ±5% 以内に収まる', () => {
        const basePrice = 3770;
        const { price } = simulatePrice('7203', basePrice);
        const lowerBound = basePrice * 0.95;
        const upperBound = basePrice * 1.05;
        expect(price).toBeGreaterThanOrEqual(lowerBound);
        expect(price).toBeLessThanOrEqual(upperBound);
    });

    it('changePercent が change と basePrice から正しく計算される', () => {
        const basePrice = 1000;
        const { price, change, changePercent } = simulatePrice('1234', basePrice);
        expect(change).toBe(price - basePrice);
        const expectedPercent = parseFloat(((change / basePrice) * 100).toFixed(2));
        expect(changePercent).toBe(expectedPercent);
    });

    it('異なる銘柄コードは異なる価格を返す', () => {
        const price1 = simulatePrice('7203', 3770).price;
        const price2 = simulatePrice('9984', 3770).price;
        // 同じbasePriceでも異なるコードは異なる価格（極めて稀に同じになる可能性はあるが許容）
        expect(price1).not.toBe(price2);
    });

    it('price は正の整数を返す', () => {
        const { price } = simulatePrice('6758', 2800);
        expect(price).toBeGreaterThan(0);
        expect(Number.isInteger(price)).toBe(true);
    });

    it('basePrice が高くても低くても正常に動作する', () => {
        const { price: lowPrice } = simulatePrice('9432', 150);
        const { price: highPrice } = simulatePrice('6861', 67000);
        expect(lowPrice).toBeGreaterThan(0);
        expect(highPrice).toBeGreaterThan(0);
    });
});
