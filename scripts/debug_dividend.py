import yfinance as yf
import json

def test_ticker(ticker_symbol):
    print(f"Fetching data for {ticker_symbol}...")
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info
    
    # 重要なフィールドのみ抽出して表示
    keys_to_check = [
        'dividendRate', 'dividendYield', 
        'trailingAnnualDividendRate', 'trailingAnnualDividendYield',
        'lastDividendValue', 'previousClose', 'currentPrice'
    ]
    
    print("\n--- Selected Data ---")
    for key in keys_to_check:
        print(f"{key}: {info.get(key)}")
        
    print("\n--- Full Info (First 1000 chars) ---")
    print(json.dumps(info, indent=2)[:1000])

if __name__ == "__main__":
    test_ticker("7203.T")
