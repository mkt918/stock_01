/**
 * yfinance (yahoo-finance2) を使った株価・指数データ自動取得スクリプト
 * 実行: node scripts/fetch-stock-data.mjs
 *       または npm run fetch-data
 */

import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ── 設定 ──────────────────────────────────────────────────────────────────
const EDINET_API_KEY = process.env.EDINET_API_KEY; // .env.local から読む
const EDINET_API_BASE_URL = 'https://api.edinet-fsa.go.jp/api/v2';

/** lib/constants.ts と同期した全銘柄リスト（44銘柄） */
const POPULAR_STOCKS = [
    // 自動車
    { code: '7203', name: 'トヨタ自動車' },
    { code: '7267', name: '本田技研工業' },
    { code: '7201', name: '日産自動車' },
    // 電機・精密
    { code: '6758', name: 'ソニーグループ' },
    { code: '6752', name: 'パナソニックHD' },
    { code: '6501', name: '日立製作所' },
    { code: '6702', name: '富士通' },
    { code: '6701', name: 'NEC' },
    { code: '7751', name: 'キヤノン' },
    { code: '4901', name: '富士フイルムHD' },
    // 半導体・電子部品
    { code: '8035', name: '東京エレクトロン' },
    { code: '6146', name: 'ディスコ' },
    { code: '6981', name: '村田製作所' },
    { code: '6902', name: 'デンソー' },
    // IT・通信
    { code: '9984', name: 'ソフトバンクグループ' },
    { code: '9432', name: '日本電信電話(NTT)' },
    { code: '9433', name: 'KDDI' },
    { code: '9434', name: 'ソフトバンク' },
    { code: '9613', name: 'NTTデータグループ' },
    // 商社
    { code: '8058', name: '三菱商事' },
    // 流通・小売
    { code: '9983', name: 'ファーストリテイリング' },
    { code: '3382', name: 'セブン&アイHD' },
    { code: '8267', name: 'イオン' },
    // 金融・保険
    { code: '8316', name: '三井住友FG' },
    { code: '8306', name: '三菱UFJ FG' },
    { code: '8766', name: '東京海上HD' },
    // 精密・機械
    { code: '6861', name: 'キーエンス' },
    { code: '6273', name: 'SMC' },
    { code: '6954', name: 'ファナック' },
    { code: '6367', name: 'ダイキン工業' },
    { code: '6506', name: '安川電機' },
    // 化学・素材
    { code: '4063', name: '信越化学工業' },
    { code: '5401', name: '日本製鉄' },
    { code: '5108', name: 'ブリヂストン' },
    // 製薬・医療
    { code: '4502', name: '武田薬品工業' },
    { code: '4519', name: '中外製薬' },
    { code: '4568', name: '第一三共' },
    { code: '4543', name: 'テルモ' },
    // サービス・エンタメ
    { code: '6098', name: 'リクルートHD' },
    { code: '7741', name: 'HOYA' },
    { code: '7974', name: '任天堂' },
    { code: '4661', name: 'オリエンタルランド' },
    { code: '4385', name: 'メルカリ' },
    { code: '2914', name: '日本たばこ産業(JT)' },
];

/**
 * 主要指数
 * - ^GSPC  : S&P 500 (米国)
 * - ^TPX   : TOPIX   (東証)
 * - 2559.T : eMAXIS Slim 全世界株式(オルカン) ETF ― Yahoo Finance では価格が取得できることを確認
 */
const MAJOR_INDICES = [
    { code: '^GSPC',   name: 'S&P 500',           currency: 'USD' },
    { code: '^TPX',    name: 'TOPIX',              currency: 'JPY' },
    { code: '2559.T',  name: '全世界株式(オルカン)', currency: 'JPY' },
];

// ── yfinance (yahoo-finance2) を使った取得関数 ────────────────────────────

/**
 * yahoo-finance2 の quote() で単一銘柄を取得
 * suppress オプションで余分な警告を抑制
 */
async function fetchQuote(symbol) {
    return yahooFinance.quote(symbol, {}, { validateResult: false });
}

/**
 * 全銘柄の株価を取得 → { [code]: { price, change, changePercent, shortName } }
 */
async function fetchStocks() {
    console.log(`\n📈 株価取得開始 (${POPULAR_STOCKS.length} 銘柄)`);
    const results = {};
    let success = 0, failed = 0;

    for (const stock of POPULAR_STOCKS) {
        const symbol = `${stock.code}.T`;
        try {
            const quote = await fetchQuote(symbol);
            if (quote && quote.regularMarketPrice) {
                results[stock.code] = {
                    price:         Math.round(quote.regularMarketPrice),
                    change:        Math.round(quote.regularMarketChange ?? 0),
                    changePercent: parseFloat((quote.regularMarketChangePercent ?? 0).toFixed(4)),
                    shortName:     quote.shortName ?? stock.name,
                };
                process.stdout.write(`  ✓ ${stock.code} ${stock.name} → ¥${results[stock.code].price}\n`);
                success++;
            } else {
                process.stdout.write(`  ✗ ${stock.code} ${stock.name} → データなし\n`);
                failed++;
            }
        } catch (e) {
            process.stdout.write(`  ✗ ${stock.code} ${stock.name} → エラー: ${e.message}\n`);
            failed++;
        }
        // レート制限対策: 200ms 待機
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`\n株価: 成功 ${success} / 失敗 ${failed}`);
    return results;
}

/**
 * S&P 500 / TOPIX / オルカン を取得 → { [code]: { name, price, change, changePercent, currency } }
 */
async function fetchIndices() {
    console.log('\n🌐 主要指数取得開始');
    const results = {};

    for (const idx of MAJOR_INDICES) {
        try {
            const quote = await fetchQuote(idx.code);
            if (quote && quote.regularMarketPrice) {
                results[idx.code] = {
                    name:          idx.name,
                    price:         parseFloat(quote.regularMarketPrice.toFixed(2)),
                    change:        parseFloat((quote.regularMarketChange ?? 0).toFixed(2)),
                    changePercent: parseFloat((quote.regularMarketChangePercent ?? 0).toFixed(4)),
                    currency:      quote.currency ?? idx.currency,
                };
                console.log(`  ✓ ${idx.code} (${idx.name}) → ${results[idx.code].price}`);
            } else {
                console.log(`  ✗ ${idx.code} (${idx.name}) → データなし`);
            }
        } catch (e) {
            console.log(`  ✗ ${idx.code} (${idx.name}) → エラー: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 300));
    }
    return results;
}

/**
 * 銘柄検索インデックスを生成
 * yfinance の Search クラスで各銘柄の英語名などを補完し、
 * public/data/search-index.json として保存
 */
async function buildSearchIndex(stocks) {
    console.log('\n🔍 検索インデックス生成中...');
    const index = POPULAR_STOCKS.map(s => ({
        code:      s.code,
        name:      s.name,
        shortName: stocks[s.code]?.shortName ?? s.name,
        price:     stocks[s.code]?.price ?? 0,
    }));
    return index;
}

/**
 * EDINET 適時開示を取得（APIキーが設定されている場合のみ）
 */
async function fetchEdinet() {
    if (!EDINET_API_KEY) {
        console.log('\n⚠️  EDINET_API_KEY が未設定のため開示情報をスキップします');
        return [];
    }
    console.log('\n📄 EDINET 開示情報取得中...');
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
            if (res.data?.results) {
                allDocs = [...allDocs, ...res.data.results];
            }
        } catch (e) {
            console.error(`  EDINET ${date}: ${e.message}`);
        }
    }
    console.log(`  開示情報: ${allDocs.length} 件`);
    return allDocs;
}

// ── メイン ────────────────────────────────────────────────────────────────
async function main() {
    console.log('='.repeat(50));
    console.log('  株価データ自動取得 (powered by yahoo-finance2)');
    console.log(`  実行日時: ${new Date().toLocaleString('ja-JP')}`);
    console.log('='.repeat(50));

    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const [stocks, indices, edinet] = await Promise.allSettled([
        fetchStocks(),
        fetchIndices(),
        fetchEdinet(),
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : {}));

    const searchIndex = await buildSearchIndex(stocks);

    // ファイルへ書き出し
    const write = (file, data) => {
        const p = path.join(dataDir, file);
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        console.log(`  💾 ${file} 保存完了`);
    };

    console.log('\n📁 ファイル書き出し中...');
    write('stocks.json', stocks);
    write('indices.json', indices);
    write('search-index.json', searchIndex);
    write('edinet.json', edinet);

    console.log('\n✅ 完了！');
    console.log(`  株価データ: ${Object.keys(stocks).length} 銘柄`);
    console.log(`  指数データ: ${Object.keys(indices).length} 件 (S&P500, TOPIX, オルカン)`);
    console.log(`  検索インデックス: ${searchIndex.length} 銘柄`);
}

main().catch(e => {
    console.error('\n❌ エラー:', e.message);
    process.exit(1);
});
