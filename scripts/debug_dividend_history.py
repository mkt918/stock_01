import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def check_dividend_history(ticker_symbol):
    print(f"Checking dividend history for {ticker_symbol}...")
    ticker = yf.Ticker(ticker_symbol)
    
    # Get dividends history
    dividends = ticker.dividends
    print("\n--- Dividend History (Last 5) ---")
    print(dividends.tail(5))
    
    if not dividends.empty:
        # Calculate trailing 12 months dividend
        end_date = pd.Timestamp.now(tz=dividends.index.tz)
        start_date = end_date - pd.DateOffset(years=1)
        
        last_year_dividends = dividends.loc[start_date:end_date]
        print(f"\n--- Trailing 12 Months Dividends ({start_date.date()} to {end_date.date()}) ---")
        print(last_year_dividends)
        
        total_dividend = last_year_dividends.sum()
        print(f"\nTotal Trailing Dividend: {total_dividend}")
        
        # Get current price
        # Try to get price from history if info fails
        history = ticker.history(period="1d")
        if not history.empty:
            current_price = history['Close'].iloc[-1]
            print(f"Current Price (from history): {current_price}")
            if current_price > 0:
                print(f"Calculated Yield: {(total_dividend / current_price) * 100:.2f}%")
        else:
             print("Could not fetch price history.")

if __name__ == "__main__":
    check_dividend_history("7203.T")
