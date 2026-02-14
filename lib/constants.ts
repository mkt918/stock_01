import { Stock } from './types';

// basePriceは2024年末〜2025年初頭の実際株価に近い概算値
export const POPULAR_STOCKS: Stock[] = [
    // 自動車
    { code: '7203', name: 'トヨタ自動車',             basePrice: 3770 },
    { code: '7267', name: '本田技研工業',             basePrice: 1800 },
    { code: '7201', name: '日産自動車',               basePrice: 390 },

    // 電機・精密
    { code: '6758', name: 'ソニーグループ',           basePrice: 2800 },
    { code: '6752', name: 'パナソニックHD',           basePrice: 1400 },
    { code: '6501', name: '日立製作所',               basePrice: 3600 },
    { code: '6702', name: '富士通',                   basePrice: 2900 },
    { code: '6701', name: 'NEC',                     basePrice: 16500 },
    { code: '7751', name: 'キヤノン',                 basePrice: 3800 },
    { code: '4901', name: '富士フイルムHD',           basePrice: 3800 },

    // 半導体・電子部品
    { code: '8035', name: '東京エレクトロン',         basePrice: 24000 },
    { code: '6146', name: 'ディスコ',                 basePrice: 40000 },
    { code: '6981', name: '村田製作所',               basePrice: 2800 },
    { code: '6902', name: 'デンソー',                 basePrice: 2700 },

    // IT・通信
    { code: '9984', name: 'ソフトバンクグループ',     basePrice: 10300 },
    { code: '9432', name: '日本電信電話(NTT)',        basePrice: 150 },
    { code: '9433', name: 'KDDI',                    basePrice: 4700 },
    { code: '9434', name: 'ソフトバンク',             basePrice: 2100 },
    { code: '9613', name: 'NTTデータグループ',        basePrice: 2300 },

    // 商社
    { code: '8058', name: '三菱商事',                 basePrice: 2700 },

    // 流通・小売
    { code: '9983', name: 'ファーストリテイリング',   basePrice: 53000 },
    { code: '3382', name: 'セブン&アイHD',           basePrice: 2100 },
    { code: '8267', name: 'イオン',                   basePrice: 3700 },

    // 金融・保険
    { code: '8316', name: '三井住友FG',               basePrice: 3900 },
    { code: '8306', name: '三菱UFJ FG',              basePrice: 1700 },
    { code: '8766', name: '東京海上HD',               basePrice: 5300 },

    // 精密・機械
    { code: '6861', name: 'キーエンス',               basePrice: 67000 },
    { code: '6273', name: 'SMC',                     basePrice: 64000 },
    { code: '6954', name: 'ファナック',               basePrice: 4200 },
    { code: '6367', name: 'ダイキン工業',             basePrice: 23000 },
    { code: '6506', name: '安川電機',                 basePrice: 4500 },

    // 化学・素材
    { code: '4063', name: '信越化学工業',             basePrice: 5600 },
    { code: '5401', name: '日本製鉄',                 basePrice: 3100 },
    { code: '5108', name: 'ブリヂストン',             basePrice: 5200 },

    // 製薬・医療
    { code: '4502', name: '武田薬品工業',             basePrice: 4000 },
    { code: '4519', name: '中外製薬',                 basePrice: 6500 },
    { code: '4568', name: '第一三共',                 basePrice: 4900 },
    { code: '4543', name: 'テルモ',                   basePrice: 3000 },

    // サービス・エンタメ
    { code: '6098', name: 'リクルートHD',             basePrice: 9500 },
    { code: '7741', name: 'HOYA',                    basePrice: 17500 },
    { code: '7974', name: '任天堂',                   basePrice: 8800 },
    { code: '4661', name: 'オリエンタルランド',       basePrice: 4800 },
    { code: '4385', name: 'メルカリ',                 basePrice: 2200 },
    { code: '2914', name: '日本たばこ産業(JT)',      basePrice: 4000 },
];
