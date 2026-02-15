import YahooFinanceClass from 'yahoo-finance2';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Instantiate the class as per library requirements in some environments
const yahooFinance = new YahooFinanceClass();

const EDINET_API_KEY = process.env.EDINET_API_KEY || '43f1d406817e4f3285ad3c3b9202c70b';
const EDINET_API_BASE_URL = 'https://api.edinet-fsa.go.jp/api/v2';

const POPULAR_STOCKS = [
    { code: '7203', name: 'トヨタ自動車' },
    { code: '6758', name: 'ソニーグループ' },
    { code: '9984', name: 'ソフトバンクグループ' },
    { code: '9432', name: '日本電信電話(NTT)' },
    { code: '7974', name: '任天堂' },
    { code: '7267', name: '本田技研工業' },
    { code: '8035', name: '東京エレクトロン' },
    { code: '9983', name: 'ファーストリテイリング' }
];

async function fetchStocks() {
    console.log('Fetching stock prices...');
    const results = {};
    for (const stock of POPULAR_STOCKS) {
        try {
            const quote = await yahooFinance.quote(`${stock.code}.T`);
            if (quote) {
                results[stock.code] = {
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    shortName: quote.shortName
                };
            }
        } catch (e) {
            console.error(`Failed for ${stock.code}: ${e.message}`);
        }
    }
    return results;
}

async function fetchEdinet() {
    console.log('Fetching EDINET documents...');
    const dates = [0, 1].map(daysAgo => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    });

    let allDocs = [];
    for (const date of dates) {
        try {
            const res = await axios.get(`${EDINET_API_BASE_URL}/documents.json`, {
                params: { date, type: 2, Subscription: 1 },
                headers: { 'Ocp-Apim-Subscription-Key': EDINET_API_KEY }
            });
            if (res.data && res.data.results) {
                allDocs = [...allDocs, ...res.data.results];
            }
        } catch (e) {
            console.error(`Failed for EDINET date ${date}: ${e.message}`);
        }
    }
    return allDocs;
}

async function main() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const stocks = await fetchStocks();
    const edinet = await fetchEdinet();

    fs.writeFileSync(path.join(dataDir, 'stocks.json'), JSON.stringify(stocks, null, 2));
    fs.writeFileSync(path.join(dataDir, 'edinet.json'), JSON.stringify(edinet, null, 2));

    console.log('Data updated successfully.');
}

main().catch(console.error);
