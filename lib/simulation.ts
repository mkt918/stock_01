export interface StockPrice {
    price: number;
    change: number;
    changePercent: number;
}

export function simulatePrice(code: string, basePrice: number): StockPrice {
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // 日次トレンド: ±3%
    const dayTrend = Math.sin(hash + dateSeed);
    const dayPrice = basePrice * (1 + dayTrend * 0.03);

    // 分単位ノイズ: ±1%
    const timeSeed = Math.floor(Date.now() / 60000);
    const noise = Math.sin(timeSeed * 0.1 + hash) * 0.01;
    const price = Math.floor(dayPrice * (1 + noise));

    const change = price - basePrice;
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    return { price, change, changePercent };
}
