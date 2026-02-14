import yahooFinance from 'yahoo-finance2';

export interface StockPriceData {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    currency: string;
    shortName: string;
}

export async function getStockPrice(code: string): Promise<StockPriceData | null> {
    try {
        // Yahoo Finance uses .T for Tokyo Stock Exchange
        const symbol = code.endsWith('.T') ? code : `${code}.T`;

        const quote = await yahooFinance.quote(symbol);

        if (!quote) {
            return null;
        }

        return {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice || 0,
            regularMarketChange: quote.regularMarketChange || 0,
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            currency: quote.currency || 'JPY',
            shortName: quote.shortName || '',
        };
    } catch (error) {
        console.error(`Failed to fetch stock price for ${code}:`, error);
        return null;
    }
}
