
import yfinance as yf
import json
import os
from datetime import datetime
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
import io

# Stock codes from lib/constants.ts (Popular Portfolio)
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
INDICES = {
    '^GSPC': {'symbol': '^GSPC', 'name': 'S&P 500'},
    '2559.T': {'symbol': '2559.T', 'name': '全世界 (オールカントリー)'}, # Maxis All Country Equity ETF
    '^TPX': {'symbol': '1306.T', 'name': 'TOPIX'}      # Using 1306.T (Nomura TOPIX ETF) as proxy
}

OUTPUT_DIR = 'public/data'

def fetch_jpx_list():
    """Scrapes JPX website for the list of listed issues."""
    print("Fetching JPX stock list...")
    url = "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html"
    try:
        res = requests.get(url)
        res.raise_for_status()
        soup = BeautifulSoup(res.content, 'html.parser')
        
        # Find link to data_j.xls
        excel_link = None
        for a in soup.find_all('a', href=True):
            if 'data_j.xls' in a['href']:
                excel_link = a['href']
                break
        
        if not excel_link:
            print("Could not find data_j.xls link.")
            return []

        # Handle relative URL
        if not excel_link.startswith('http'):
            excel_link = f"https://www.jpx.co.jp{excel_link}"
            
        print(f"Downloading Excel from {excel_link}...")
        excel_res = requests.get(excel_link)
        excel_res.raise_for_status()
        
        # Read Excel
        # data_j.xls format: code, name, market, ...
        # Need to handle potential header rows
        df = pd.read_excel(io.BytesIO(excel_res.content))
        
        # Verify columns (Code is usually 2nd col, Name 3rd?)
        # 2024 format: Date, Code, Name, Market, ...
        # Let's inspect first few rows logic if headers vary
        # Actually standard pd.read_excel should pick up headers if they are in row 0
        
        stock_list = []
        for index, row in df.iterrows():
            try:
                code_raw = str(row.iloc[1]) # Assuming Code is 2nd column
                name = str(row.iloc[2])     # Assuming Name is 3rd column
                
                # Basic validation for code (4 digits)
                if len(code_raw) == 4 and code_raw.isdigit():
                    stock_list.append({"code": code_raw, "name": name})
            except:
                continue
                
        print(f"Found {len(stock_list)} stocks from JPX.")
        return stock_list
        
    except Exception as e:
        print(f"Error fetching JPX list: {e}")
        return []

def create_search_index(stock_list):
    """Creates search index from stock list (without fetching prices to save time)."""
    print("Creating search index (Code & Name only)...")
    results = []
    
    for s in stock_list:
        code = s['code']
        name = s['name']
        
        results.append({
            "code": code,
            "name": name,
            "shortName": name, # Simplification
            "price": None # Price will be fetched on demand or simulated
        })
            
    print(f"Created index for {len(results)} stocks.")
    return results

def fetch_stock_data():
    """Fetches data for Popular Stocks (Detailed)."""
    print("Fetching popular stock data...")
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
                
                # 配当情報の取得 (実績ベースを優先)
                # trailingAnnualDividendRate: インデックスの過去1年間の配当実績
                # dividendRate: 直近配当の年換算(予想の場合が多い)
                # 配当情報の取得 (優先順位: 実績(info) > 予想(info) > 実績(history))
                dividend_rate = info.get('trailingAnnualDividendRate')
                
                # 実績が採れない、または0の場合は予想を使う
                if not dividend_rate:
                     dividend_rate = info.get('dividendRate')

                # それでもダメなら履歴から計算
                if not dividend_rate:
                    try:
                        divs = ticker.dividends
                        if not divs.empty:
                            # 直近1年間の配当合計
                            # yfinanceのtimezone対応
                            tz = divs.index.tz
                            now = pd.Timestamp.now(tz=tz)
                            start_date = now - pd.DateOffset(years=1)
                            last_year_divs = divs.loc[start_date:now]
                            if not last_year_divs.empty:
                                dividend_rate = float(last_year_divs.sum())
                    except Exception as e:
                        print(f"Failed to calculate dividend from history for {code}: {e}")

                # Default to 0 if all failed
                if not dividend_rate:
                    dividend_rate = 0

                # 利回りの計算
                dividend_yield = info.get('trailingAnnualDividendYield')
                
                if not dividend_yield:
                    dividend_yield = info.get('dividendYield')
                
                if dividend_yield:
                    dividend_yield = dividend_yield * 100 # decimal to percent
                
                # 利回りが取れていない場合、または計算可能なら再計算して検証
                if not dividend_yield and dividend_rate > 0 and price and price > 0:
                    dividend_yield = (dividend_rate / price) * 100
                    
                if not dividend_yield:
                    dividend_yield = 0


                # 権利確定月と受取月の推定 (一律ルール: 確定3/9月 -> 受取6/12月)
                # ただしyfinanceからexDividendDateが取れればそれを考慮することも可能だが、
                # ユーザー要望により「一律ルール」を基本とする。
                # 3月/9月 決算企業の標準モデル
                vesting_months = [3, 9]
                payout_months = [6, 12]

                data[key] = {
                    "price": price,
                    "change": change,
                    "changePercent": change_percent,
                    "dividend": {
                        "rate": dividend_rate,
                        "yield": round(dividend_yield, 2),
                        "vestingMonths": vesting_months,
                        "payoutMonths": payout_months
                    },
                    "updatedAt": datetime.now().isoformat()
                }
            except Exception as e:
                print(f"Error fetching {code}: {e}")
                
    except Exception as e:
        print(f"Batch fetch error: {e}")

    return data

def fetch_index_data():
    """Fetches data for Major Indices."""
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
        
    # 1. Popular Stocks
    stocks = fetch_stock_data()
    with open(f'{OUTPUT_DIR}/stocks.json', 'w', encoding='utf-8') as f:
        json.dump(stocks, f, indent=2, ensure_ascii=False)
        
    # 2. Indices
    indices = fetch_index_data()
    with open(f'{OUTPUT_DIR}/indices.json', 'w', encoding='utf-8') as f:
        json.dump(indices, f, indent=2, ensure_ascii=False)
        
    # 3. All Stocks (Search Index) - Light ver.
    # Only run if we can get the list
    jpx_list = fetch_jpx_list()
    if jpx_list:
        search_index = create_search_index(jpx_list)
        with open(f'{OUTPUT_DIR}/search-index.json', 'w', encoding='utf-8') as f:
            json.dump(search_index, f, indent=2, ensure_ascii=False)
        
    print("Market data updated successfully.")

if __name__ == "__main__":
    main()
