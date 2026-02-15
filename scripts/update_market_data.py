
import yfinance as yf
import json
import os
from datetime import datetime
import time

# Stock codes from lib/constants.ts
STOCKS = [
    # 自動車
    '7203.T', '7267.T', '7201.T',
    # 電機・精密
    '6758.T', '6752.T', '6501.T', '6702.T', '6701.T', '7751.T', '4901.T',
    # 半導体・電子部品
    '8035.T', '6146.T', '6981.T', '6902.T',
    # IT・通信
    '9984.T', '9432.T', '9433.T', '9434.T', '9613.T',
    # 商社
    '8058.T',
    # 流通・小売
    '9983.T', '3382.T', '8267.T',
    # 金融・保険
    '8316.T', '8306.T', '8766.T',
    # 精密・機械
    '6861.T', '6273.T', '6954.T', '6367.T', '6506.T',
    # 化学・素材
    '4063.T', '5401.T', '5108.T',
    # 製薬・医療
    '4502.T', '4519.T', '4568.T', '4543.T',
    # サービス・エンタメ
    '6098.T', '7741.T', '7974.T', '4661.T', '4385.T', '2914.T'
]

# Major Indices
# Keys must match components/Dashboard/AssetHistoryChart.tsx
INDICES = {
    '^GSPC': {'symbol': '^GSPC', 'name': 'S&P 500'},
    '2559.T': {'symbol': '2559.T', 'name': 'オルカン'}, # Maxis All Country Equity ETF
    '^TPX': {'symbol': '1306.T', 'name': 'TOPIX'}      # Using 1306.T (Nomura TOPIX ETF) as proxy
}

OUTPUT_DIR = 'public/data'

def fetch_stock_data():
    print("Fetching stock data...")
    data = {}
    
    # Batch fetch for efficiency
    tickers = " ".join(STOCKS)
    try:
        tickers_data = yf.Tickers(tickers)
        
        for code in STOCKS:
            try:
                # Remove .T for key to match app logic (lib/constants.ts uses '7203', not '7203.T')
                key = code.replace('.T', '')
                ticker = tickers_data.tickers[code]
                info = ticker.fast_info
                
                # fast_info is faster and often sufficient for current price
                price = info.last_price
                prev_close = info.previous_close
                if price is None: 
                    # Fallback to history if fast_info fails
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        price = hist['Close'].iloc[-1]
                        # Approximate prev close
                        prev_close = price 

                change = price - prev_close if price and prev_close else 0
                change_percent = (change / prev_close) * 100 if prev_close else 0
                
                data[key] = {
                    "price": price,
                    "change": change,
                    "changePercent": change_percent,
                    "updatedAt": datetime.now().isoformat()
                }
                # print(f"Fetched {code}: {price}")
            except Exception as e:
                print(f"Error fetching {code}: {e}")
                
    except Exception as e:
        print(f"Batch fetch error: {e}")

    return data

def fetch_index_data():
    print("Fetching index data...")
    data = {}
    
    for key, info in INDICES.items():
        symbol = info['symbol']
        name = info['name']
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d") # Fetch bit more to be safe
            
            if len(hist) > 0:
                current_price = hist['Close'].iloc[-1]
                prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                
                # Check for live price (fast_info) preference
                try:
                    live_price = ticker.fast_info.last_price
                    if live_price:
                        current_price = live_price
                        prev_close = ticker.fast_info.previous_close
                except:
                    pass

                change = current_price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close else 0
                
                data[key] = {
                    "name": name,
                    "price": current_price,
                    "change": change,
                    "changePercent": change_percent,
                    "updatedAt": datetime.now().isoformat()
                }
                print(f"Fetched {name} ({key}): {current_price}")
        except Exception as e:
            print(f"Error fetching {name}: {e}")
            
    return data

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    stocks = fetch_stock_data()
    with open(f'{OUTPUT_DIR}/stocks.json', 'w', encoding='utf-8') as f:
        json.dump(stocks, f, indent=2, ensure_ascii=False)
        
    indices = fetch_index_data()
    with open(f'{OUTPUT_DIR}/indices.json', 'w', encoding='utf-8') as f:
        json.dump(indices, f, indent=2, ensure_ascii=False)
        
    print("Market data updated successfully.")

if __name__ == "__main__":
    main()
