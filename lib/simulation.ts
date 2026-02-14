export interface StockPrice {
    price: number;
    change: number;
    changePercent: number;
}

export function simulatePrice(code: string): StockPrice {
    // Deterministic Base Price from Code
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = (hash % 90 + 10) * 100; // 1000 ~ 10000

    // Time-based fluctuation
    // Change every minute
    const timeSeed = Math.floor(Date.now() / 60000);

    // Simple pseudo-random
    const rand = (Math.sin(hash + timeSeed) + 1) / 2; // 0 to 1

    let price = basePrice + (rand * basePrice * 0.05); // +/- 2.5% range roughly (since rand is 0-1, it's +0-5%)
    // Center it?
    // sin is -1 to 1.
    // (sin + 1) / 2 is 0 to 1.

    // Let's make it more "market-like"
    // Day seed
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Base movement for the day
    const dayTrend = Math.sin(hash + dateSeed); // -1 to 1

    price = basePrice * (1 + (dayTrend * 0.03)); // +/- 3% daily trend

    // Intraday noise
    const noise = (Math.sin(timeSeed * 0.1 + hash) * 0.01);
    price = price * (1 + noise);

    price = Math.floor(price);

    const prevPrice = Math.floor(basePrice * (1 + (dayTrend * 0.03))); // Close to "Open" price logic roughly
    // Actually let's just make change relative to basePrice for simplicity

    const change = price - basePrice;
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    return {
        price,
        change,
        changePercent
    };
}
