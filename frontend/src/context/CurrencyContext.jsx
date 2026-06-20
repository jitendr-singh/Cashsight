import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  // Default to INR, load from localStorage if exists
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('capitallens_currency');
      return saved || 'INR';
    }
    return 'INR';
  });

  const [exchangeRate, setExchangeRate] = useState(83.0); // Fallback of 83 INR per USD

  useEffect(() => {
    // Fetch live exchange rate from open API (no API key needed)
    fetch('https://open.er-api.com/v6/latest/INR')
      .then((res) => {
        if (!res.ok) throw new Error('API response error');
        return res.json();
      })
      .then((data) => {
        if (data && data.rates && data.rates.USD) {
          // 1 INR = data.rates.USD USD. So 1 USD = 1 / data.rates.USD INR.
          const rate = 1 / data.rates.USD;
          setExchangeRate(rate);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch live exchange rate, using fallback 83.0:', err);
      });
  }, []);

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('capitallens_currency', curr);
    }
  };

  const formatCurrency = (amount, decimals = 2) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '';

    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(numericAmount);
    } else {
      // Convert INR to USD using live or fallback rate
      const convertedAmount = numericAmount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(convertedAmount);
    }
  };

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
