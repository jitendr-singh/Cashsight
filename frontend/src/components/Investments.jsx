import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { investmentService } from '../services/api';
import { createPortal } from 'react-dom';
const getAssetMeta = (type) => {
  switch (type) {
    case 'stocks':
      return {
        icon: 'trending_up',
        label: 'Equity Stock',
        colorClass: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        category: 'Equity'
      };
    case 'mutual_funds':
      return {
        icon: 'query_stats',
        label: 'Mutual Fund',
        colorClass: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20',
        glowColor: 'rgba(59, 130, 246, 0.15)',
        category: 'Mutual Fund'
      };
    case 'gold':
      return {
        icon: 'workspace_premium',
        label: 'Precious Metal',
        colorClass: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20',
        glowColor: 'rgba(245, 158, 11, 0.15)',
        category: 'Commodity'
      };
    case 'fixed_deposit':
      return {
        icon: 'savings',
        label: 'Fixed Deposit',
        colorClass: 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/20',
        glowColor: 'rgba(6, 182, 212, 0.15)',
        category: 'Fixed Income'
      };
    case 'govt_schemes':
      return {
        icon: 'assured_workload',
        label: 'Govt Scheme',
        colorClass: 'text-[#6366f1] bg-[#6366f1]/10 border-[#6366f1]/20',
        glowColor: 'rgba(99, 102, 241, 0.15)',
        category: 'Sovereign'
      };
    case 'real_estate':
      return {
        icon: 'home',
        label: 'Real Estate / REIT',
        colorClass: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
        glowColor: 'rgba(249, 115, 22, 0.15)',
        category: 'Real Estate'
      };
    default:
      return {
        icon: 'insights',
        label: 'Asset',
        colorClass: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/20',
        glowColor: 'rgba(168, 85, 247, 0.15)',
        category: 'Alternative'
      };
  }
};

export default function Investments({ searchQuery }) {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Data States
  const [portfolio, setPortfolio] = useState({
    total_invested: 0.0,
    current_value: 0.0,
    total_profit_loss: 0.0,
    profit_loss_percentage: 0.0,
    total_monthly_rent: 0.0,
    investments: []
  });
  const [suggestions, setSuggestions] = useState([]);
  const [availableCash, setAvailableCash] = useState(0.0);
  const [savingsRate, setSavingsRate] = useState(0.0);
  const [totalIncome, setTotalIncome] = useState(0.0);
  const [totalExpense, setTotalExpense] = useState(0.0);
  const [totalSavings, setTotalSavings] = useState(0.0);
  const [emergencyFundStatus, setEmergencyFundStatus] = useState('Building');
  const [riskScore, setRiskScore] = useState(50);
  const [riskProfile, setRiskProfile] = useState('Moderate');
  const [runwayMonths, setRunwayMonths] = useState(0.0);
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(0.0);
  const [emergencyGap, setEmergencyGap] = useState(0.0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [portfolioWarnings, setPortfolioWarnings] = useState([]);

  // Modal / Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState('stocks');
  const [formData, setFormData] = useState({
    asset_name: '',
    amount_invested: '',
    quantity: '',
    buy_price: '',
    interest_rate: '',
    maturity_date: '',
    annual_contribution: '',
    rental_income: '',
    appreciation_rate: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // mTrust Modal / Broker Redirect States
  const [trustModalOpen, setTrustModalOpen] = useState(false);
  const [selectedSug, setSelectedSug] = useState(null);
  const [customAllocAmount, setCustomAllocAmount] = useState(10000);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false);
  const [trustModalStep, setTrustModalStep] = useState('report'); // 'report' or 'sync'
  const [trustViewMode, setTrustViewMode] = useState('quick'); // 'quick' or 'full'
  const [syncFormData, setSyncFormData] = useState({
    asset_name: '',
    asset_type: 'stocks',
    amount_invested: '',
    quantity: '',
    buy_price: '',
    interest_rate: '',
    maturity_date: '',
    annual_contribution: '',
    rental_income: '',
    appreciation_rate: ''
  });
  const [syncError, setSyncError] = useState('');
  const [syncSubmitting, setSyncSubmitting] = useState(false);

  // Custom Redeem Modal States
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemAsset, setRedeemAsset] = useState(null);
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccessData, setRedeemSuccessData] = useState(null);

  // Active sub-tab inside Holdings section
  const [activeSubTab, setActiveSubTab] = useState('all');

  // CAS Import Modal State
  const [casModalOpen, setCasModalOpen] = useState(false);
  const [casFile, setCasFile] = useState(null);
  const [casPassword, setCasPassword] = useState('');
  const [casAutoSave, setCasAutoSave] = useState(false);
  const [casLoading, setCasLoading] = useState(false);
  const [casResult, setCasResult] = useState(null);
  const [casError, setCasError] = useState('');

  // Live price lookup state (inside add form)
  const [livePriceData, setLivePriceData] = useState(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);

  // Load Portfolio & Suggestions on Mount
  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      const pData = await investmentService.getPortfolio();
      if (pData) setPortfolio(pData);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAISuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const sData = await investmentService.getSuggestions();
      if (sData) {
        setSuggestions(sData.suggestions || []);
        setAvailableCash(sData.available_cash || 0.0);
        setSavingsRate(sData.savings_rate || 0.0);
        setTotalIncome(sData.total_income || 0.0);
        setTotalExpense(sData.total_expense || 0.0);
        setTotalSavings(sData.total_savings || 0.0);
        setEmergencyFundStatus(sData.emergency_fund_status || 'Building');
        setRiskScore(sData.risk_score !== undefined ? sData.risk_score : 50);
        setRiskProfile(sData.risk_profile || 'Moderate');
        setRunwayMonths(sData.runway_months !== undefined ? sData.runway_months : 0.0);
        setEmergencyFundTarget(sData.emergency_fund_target || 0.0);
        setEmergencyGap(sData.emergency_gap || 0.0);
        setWarningMessage(sData.warning_message || null);
        setPortfolioWarnings(sData.portfolio_warnings || []);
      }
    } catch (err) {
      console.error('Failed to load AI suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    loadAISuggestions();
  }, []);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      if (trustModalOpen) {
        rootEl.classList.add('blur-back');
      } else {
        rootEl.classList.remove('blur-back');
      }
    }
    return () => {
      if (rootEl) {
        rootEl.classList.remove('blur-back');
      }
    };
  }, [trustModalOpen]);

  const calculateHistoricalSnapshot = (sug, recommendedAmount) => {
    if (!sug || !sug.historical_data) return null;
    const hist = sug.historical_data;
    const type = sug.asset_type;

    // Market-linked assets default mapping
    const isMarketLinked = ['stocks', 'mutual_funds', 'gold', 'real_estate'].includes(type) || hist.current_price !== undefined;

    const rows = [];
    const yearsList = [1, 3, 5, 10];
    const currentYear = new Date().getFullYear();

    if (isMarketLinked) {
      const currentPrice = hist.current_price;
      const periods = hist.periods || {};
      if (!currentPrice) return null;

      for (const yr of yearsList) {
        const histPrice = periods[String(yr)] || periods[yr];
        if (histPrice === undefined || histPrice === null || histPrice <= 0) continue;

        const units = recommendedAmount / histPrice;
        const currentValue = units * currentPrice;
        const totalReturn = ((currentValue - recommendedAmount) / recommendedAmount) * 100;
        const cagr = (Math.pow(currentPrice / histPrice, 1 / yr) - 1) * 100;
        const netProfit = currentValue - recommendedAmount;
        const startYear = currentYear - yr;

        rows.push({
          period: `${yr} Year${yr > 1 ? 's' : ''}`,
          year: `${yr} Yr Ago (${startYear})`,
          invested: recommendedAmount,
          currentValue,
          netProfit,
          totalReturn,
          cagr
        });
      }
    } else {
      // Fixed return assets (Fixed Deposits, Bonds, Govt Schemes)
      const rates = hist.interest_rates || {};
      for (const yr of yearsList) {
        const rate = rates[String(yr)] || rates[yr];
        if (rate === undefined || rate === null || rate <= 0) continue;

        // Compound quarterly (k = 4)
        const k = 4;
        const currentValue = recommendedAmount * Math.pow(1 + (rate / 100) / k, k * yr);
        const totalReturn = ((currentValue - recommendedAmount) / recommendedAmount) * 100;
        const cagr = (Math.pow(currentValue / recommendedAmount, 1 / yr) - 1) * 100;
        const netProfit = currentValue - recommendedAmount;
        const startYear = currentYear - yr;

        rows.push({
          period: `${yr} Year${yr > 1 ? 's' : ''}`,
          year: `${yr} Yr Ago (${startYear})`,
          invested: recommendedAmount,
          currentValue,
          netProfit,
          totalReturn,
          cagr
        });
      }
    }

    return rows.length > 0 ? rows : null;
  };

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate amount_invested for Stocks & Mutual Funds
      if (selectedAssetType === 'stocks' || selectedAssetType === 'mutual_funds') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.buy_price) || 0;
        updated.amount_invested = (qty * price).toFixed(2);
      } else if (selectedAssetType === 'gold') {
        const grams = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.buy_price) || 0;
        updated.amount_invested = (grams * price).toFixed(2);
      }

      return updated;
    });
  };

  // Switch Asset Type in Form & Reset Fields
  const handleAssetTypeChange = (type) => {
    setSelectedAssetType(type);
    setFormData({
      asset_name: '',
      amount_invested: '',
      quantity: '',
      buy_price: '',
      interest_rate: '',
      maturity_date: '',
      annual_contribution: '',
      rental_income: '',
      appreciation_rate: ''
    });
    setErrorMsg('');
    setLivePriceData(null);
  };


  // Submit New Investment
  const handleAddInvestment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      // Form Validation
      if (!formData.asset_name) throw new Error('Asset Name is required.');
      const principal = parseFloat(formData.amount_invested) || 0;
      if (principal <= 0) throw new Error('Investment amount must be greater than 0.');

      // Construct Payload
      const payload = {
        asset_name: formData.asset_name,
        asset_type: selectedAssetType,
        amount_invested: principal
      };

      if (selectedAssetType === 'stocks' || selectedAssetType === 'mutual_funds' || selectedAssetType === 'gold') {
        payload.quantity = parseFloat(formData.quantity) || 0;
        payload.buy_price = parseFloat(formData.buy_price) || 0;
      }

      if (selectedAssetType === 'fixed_deposit') {
        payload.interest_rate = parseFloat(formData.interest_rate) || 0;
        if (formData.maturity_date) {
          payload.maturity_date = new Date(formData.maturity_date).toISOString();
        }
      }

      if (selectedAssetType === 'govt_schemes') {
        payload.interest_rate = parseFloat(formData.interest_rate) || 0;
        payload.annual_contribution = parseFloat(formData.annual_contribution) || 0;
      }

      if (selectedAssetType === 'real_estate') {
        payload.rental_income = parseFloat(formData.rental_income) || 0;
        payload.appreciation_rate = parseFloat(formData.appreciation_rate) || 0;
      }

      await investmentService.create(payload);

      // Reset & Refresh
      setModalOpen(false);
      handleAssetTypeChange('stocks');
      await loadPortfolioData();
      await loadAISuggestions();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add investment. Check your balance.');
    } finally {
      setSubmitting(false);
    }
  };

  // Redeem Investment (Triggers custom confirm modal)
  const handleRedeem = (inv) => {
    setRedeemAsset(inv);
    setRedeemError('');
    setRedeemSuccessData(null);
    setRedeemModalOpen(true);
  };

  // Execute actual redemption via API
  const handleRedeemConfirm = async () => {
    if (!redeemAsset) return;
    setRedeemSubmitting(true);
    setRedeemError('');
    try {
      const res = await investmentService.redeem(redeemAsset.id);
      setRedeemSuccessData(res);
      await loadPortfolioData();
      await loadAISuggestions();
    } catch (err) {
      console.error('Failed to redeem:', err);
      setRedeemError(err.message || 'Failed to execute redemption.');
    } finally {
      setRedeemSubmitting(false);
    }
  };

  // Quick Execute Suggestion (Opens mTrust Modal instead of standard form)
  const handleQuickExecute = (sug) => {
    setSelectedSug(sug);
    const alloc = sug.recommended_allocation || 0;
    setCustomAllocAmount(alloc);
    setTrustModalStep('report');
    setDisclaimerExpanded(false);
    setSyncError('');

    const type = sug.asset_type || 'stocks';

    // Auto-calculate quantity and buy price/NAV if stock/MF/gold
    let qty = '';
    let price = '';
    if (type === 'stocks' || type === 'mutual_funds' || type === 'gold') {
      qty = '1';
      price = String(alloc);
    }

    setSyncFormData({
      asset_name: sug.asset_name || '',
      asset_type: type,
      amount_invested: String(alloc),
      quantity: qty,
      buy_price: price,
      interest_rate: sug.expected_return_rate ? String(sug.expected_return_rate) : '',
      annual_contribution: type === 'govt_schemes' ? String(alloc) : '',
      maturity_date: '',
      rental_income: '',
      appreciation_rate: ''
    });

    setTrustModalOpen(true);
  };

  const handleSyncInputChange = (e) => {
    const { name, value } = e.target;
    setSyncFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (prev.asset_type === 'stocks' || prev.asset_type === 'mutual_funds' || prev.asset_type === 'gold') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.buy_price) || 0;
        updated.amount_invested = (qty * price).toFixed(2);
      }

      return updated;
    });
  };

  // Submit investment via Broker Sync
  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    setSyncSubmitting(true);
    setSyncError('');

    try {
      if (!syncFormData.asset_name) throw new Error('Asset Name is required.');
      const principal = parseFloat(syncFormData.amount_invested) || 0;
      if (principal <= 0) throw new Error('Investment amount must be greater than 0.');

      const payload = {
        asset_name: syncFormData.asset_name,
        asset_type: syncFormData.asset_type,
        amount_invested: principal
      };

      if (syncFormData.asset_type === 'stocks' || syncFormData.asset_type === 'mutual_funds' || syncFormData.asset_type === 'gold') {
        payload.quantity = parseFloat(syncFormData.quantity) || 0;
        payload.buy_price = parseFloat(syncFormData.buy_price) || 0;
      }

      if (syncFormData.asset_type === 'fixed_deposit') {
        payload.interest_rate = parseFloat(syncFormData.interest_rate) || 0;
        if (syncFormData.maturity_date) {
          payload.maturity_date = new Date(syncFormData.maturity_date).toISOString();
        }
      }

      if (syncFormData.asset_type === 'govt_schemes') {
        payload.interest_rate = parseFloat(syncFormData.interest_rate) || 0;
        payload.annual_contribution = parseFloat(syncFormData.annual_contribution) || 0;
      }

      if (syncFormData.asset_type === 'real_estate') {
        payload.rental_income = parseFloat(syncFormData.rental_income) || 0;
        payload.appreciation_rate = parseFloat(syncFormData.appreciation_rate) || 0;
      }

      await investmentService.create(payload);

      setTrustModalOpen(false);
      await loadPortfolioData();
      await loadAISuggestions();
    } catch (err) {
      setSyncError(err.message || 'Failed to sync investment.');
    } finally {
      setSyncSubmitting(false);
    }
  };

  // Curated lists of direct links by asset type (No API keys needed)
  const getBrokerLinks = (sug) => {
    if (!sug) return [];
    const type = sug.asset_type;
    const ticker = sug.ticker || sug.asset_name;
    const cleanTicker = ticker.toUpperCase().replace('.NS', '').trim();

    if (type === 'stocks') {
      return [
        {
          name: 'Groww Stocks',
          icon: 'trending_up',
          url: `https://groww.in/stocks/${cleanTicker.toLowerCase()}`,
          desc: `Invest in ${cleanTicker} directly on Groww Web`
        },
        {
          name: 'Zerodha Kite',
          icon: 'account_balance',
          url: `https://kite.zerodha.com/`,
          desc: 'Trade using Kite terminal/holdings page'
        }
      ];
    } else if (type === 'mutual_funds') {
      return [
        {
          name: 'Groww Mutual Funds',
          icon: 'analytics',
          url: `https://groww.in/mutual-funds/search?q=${encodeURIComponent(sug.asset_name)}`,
          desc: 'Search and invest via Groww MF'
        },
        {
          name: 'Kuvera MF',
          icon: 'explore',
          url: `https://kuvera.in/explore/mutual-funds`,
          desc: 'Direct zero-commission mutual fund platform'
        }
      ];
    } else if (type === 'fixed_deposit') {
      return [
        {
          name: 'Stable Money',
          icon: 'account_balance_wallet',
          url: `https://stablemoney.in/`,
          desc: 'Aggregator for highest interest bank FDs'
        },
        {
          name: 'SBI Interest Rates',
          icon: 'account_balance',
          url: `https://www.sbi.co.in/web/interest-rates/deposit-rates`,
          desc: 'Check latest SBI FD interest yields'
        },
        {
          name: 'HDFC Bank FDs',
          icon: 'savings',
          url: `https://www.hdfcbank.com/personal/save/deposits/fixed-deposit-interest-rate`,
          desc: 'Book and manage high yield HDFC FDs'
        }
      ];
    } else if (type === 'gold') {
      return [
        {
          name: 'SafeGold',
          icon: 'workspace_premium',
          url: `https://www.safegold.com/`,
          desc: 'Buy, store & sell 24K digital gold instantly'
        },
        {
          name: 'Groww Digital Gold',
          icon: 'payments',
          url: `https://groww.in/gold`,
          desc: 'Manage and trade digital gold online'
        }
      ];
    } else if (type === 'govt_schemes') {
      return [
        {
          name: 'NPS CRA Portal',
          icon: 'assured_workload',
          url: `https://www.npscra.nsdl.co.in/`,
          desc: 'National Pension Scheme official CRA portal'
        },
        {
          name: 'Post Office Schemes',
          icon: 'mail',
          url: `https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx`,
          desc: 'PPF, SSY, and postal savings schemes'
        }
      ];
    } else {
      return [
        {
          name: 'Groww Search',
          icon: 'search',
          url: `https://groww.in/stocks/search?q=${encodeURIComponent(cleanTicker)}`,
          desc: `Search for ${cleanTicker} details online`
        }
      ];
    }
  };

  // ─── CAS IMPORT HANDLER ────────────────────────────────────────────────────
  const handleCASImport = async () => {
    if (!casFile) { setCasError('Please select a CAS PDF file.'); return; }
    setCasLoading(true);
    setCasError('');
    setCasResult(null);

    try {
      const result = await investmentService.importCAS(
        casFile,
        casPassword || null,
        casAutoSave
      );
      setCasResult(result);
      if (casAutoSave && result.auto_saved > 0) {
        await loadPortfolioData();
        await loadAISuggestions();
      }
    } catch (err) {
      setCasError(err.message || 'Failed to parse CAS PDF. Check the file and password.');
    } finally {
      setCasLoading(false);
    }
  };

  const resetCASModal = () => {
    setCasFile(null);
    setCasPassword('');
    setCasAutoSave(false);
    setCasResult(null);
    setCasError('');
    setCasLoading(false);
    setCasModalOpen(false);
  };

  // ─── LIVE PRICE LOOKUP ─────────────────────────────────────────────────────
  const handleLivePriceLookup = async () => {
    if (!['stocks', 'mutual_funds', 'gold'].includes(selectedAssetType)) return;
    // For gold, we don't need an asset name. For stocks/MF we do.
    if (selectedAssetType !== 'gold' && !formData.asset_name) return;

    setLivePriceLoading(true);
    setLivePriceData(null);
    try {
      const assetName = selectedAssetType === 'gold' ? 'gold' : formData.asset_name;
      const data = await investmentService.getLivePrice(
        selectedAssetType,
        assetName,
        parseFloat(formData.quantity) || null,
        parseFloat(formData.buy_price) || null
      );
      setLivePriceData(data);

      // Always auto-fill the buy_price with current live price
      if (data.current_price) {
        setFormData(prev => {
          const updated = { ...prev, buy_price: String(data.current_price) };
          // Recalculate amount_invested
          const qty = parseFloat(updated.quantity) || 0;
          if (qty > 0) {
            updated.amount_invested = String(Math.round(data.current_price * qty * 100) / 100);
          }
          return updated;
        });
      }
    } catch (err) {
      setLivePriceData({ error: err.message });
    } finally {
      setLivePriceLoading(false);
    }
  };


  // ─── SVG DONUT CHART CALCULATION ──────────────────────────────────────────
  const assetColors = {
    stocks: { bg: 'bg-[#a78bfa]', hex: '#a78bfa', label: 'Stocks' },
    fixed_deposit: { bg: 'bg-[#38bdf8]', hex: '#38bdf8', label: 'Fixed Deposits' },
    mutual_funds: { bg: 'bg-[#34d399]', hex: '#34d399', label: 'Mutual Funds' },
    gold: { bg: 'bg-[#fbbf24]', hex: '#fbbf24', label: 'Gold' },
    govt_schemes: { bg: 'bg-[#f472b6]', hex: '#f472b6', label: 'Govt Schemes' },
    real_estate: { bg: 'bg-[#fb7185]', hex: '#fb7185', label: 'Real Estate' }
  };

  // Group portfolio balances
  const allocationGroup = {
    stocks: 0,
    fixed_deposit: 0,
    mutual_funds: 0,
    gold: 0,
    govt_schemes: 0,
    real_estate: 0
  };

  portfolio.investments.forEach(inv => {
    if (allocationGroup[inv.asset_type] !== undefined) {
      allocationGroup[inv.asset_type] += inv.current_value;
    }
  });

  const totalPortfolioValue = Object.values(allocationGroup).reduce((a, b) => a + b, 0);

  let accumulatedPercent = 0;
  const donutSegments = Object.keys(allocationGroup)
    .map(key => {
      const amount = allocationGroup[key];
      const percentage = totalPortfolioValue > 0 ? (amount / totalPortfolioValue) * 100 : 0;

      const circumference = 251.2;
      const strokeDash = (percentage / 100) * circumference;
      const strokeOffset = -((accumulatedPercent / 100) * circumference);

      accumulatedPercent += percentage;

      return {
        key,
        amount,
        percentage: Math.round(percentage),
        colorClass: assetColors[key].bg,
        hex: assetColors[key].hex,
        label: assetColors[key].label,
        strokeDashArray: `${strokeDash} ${circumference - strokeDash}`,
        strokeDashOffset: strokeOffset
      };
    })
    .filter(seg => seg.amount > 0);

  // Filter holdings table
  const filteredHoldings = portfolio.investments.filter(inv => {
    const matchSubTab = activeSubTab === 'all' || inv.asset_type === activeSubTab;
    if (!matchSubTab) return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      inv.asset_name.toLowerCase().includes(query) ||
      inv.asset_type.toLowerCase().includes(query) ||
      (inv.quantity ? inv.quantity.toString().includes(query) : false) ||
      (inv.buy_price ? inv.buy_price.toString().includes(query) : false) ||
      inv.amount_invested.toString().includes(query) ||
      inv.current_value.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6 stagger-in">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h2 className="font-display-lg text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold tracking-tight mb-1">
            Investments Dashboard
          </h2>
          <p className="text-on-surface-variant text-sm opacity-80">
            Track assets, calculate compound returns, and execute smart investments
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(90,240,179,0.25)]"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Investment
        </button>
        <button
          onClick={() => setCasModalOpen(true)}
          className="px-5 py-2.5 bg-surface-variant/30 border border-glass-border/60 text-on-surface-variant hover:text-primary hover:border-primary/40 font-bold rounded-lg active:scale-95 transition-all text-sm flex items-center gap-2"
          title="Import from CAMS / KFintech CAS Statement PDF"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Import CAS
        </button>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invested */}
        <div className="midnight-glass p-5 rounded-xl border border-glass-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-1">
            Total Capital Invested
          </span>
          <h3 className="text-2xl font-bold font-outfit text-text-primary mb-1">
            {formatCurrency(portfolio.total_invested)}
          </h3>
          <p className="text-[11px] text-on-surface-variant/50">
            Principal capital allocated
          </p>
        </div>

        {/* Card 2: Current Valuation */}
        <div className="midnight-glass p-5 rounded-xl border border-glass-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/2 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-1">
            Current Valuation
          </span>
          <h3 className="text-2xl font-bold font-outfit text-text-primary mb-1">
            {formatCurrency(portfolio.current_value)}
          </h3>
          <p className="text-[11px] text-on-surface-variant/50">
            Appreciated portfolio worth
          </p>
        </div>

        {/* Card 3: Unrealized Returns */}
        <div className="midnight-glass p-5 rounded-xl border border-glass-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-1">
            Unrealized Returns (P&L)
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className={`text-2xl font-bold font-outfit ${portfolio.total_profit_loss >= 0 ? 'text-primary' : 'text-rose-expense'}`}>
              {portfolio.total_profit_loss >= 0 ? '+' : ''}{formatCurrency(portfolio.total_profit_loss)}
            </h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${portfolio.total_profit_loss >= 0 ? 'bg-primary/10 text-primary' : 'bg-rose-expense/10 text-rose-expense'}`}>
              {portfolio.total_profit_loss >= 0 ? '+' : ''}{portfolio.profit_loss_percentage.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant/50">
            Live NSE / AMFI prices
          </p>
        </div>

        {/* Card 4: Passive Monthly Income */}
        <div className="midnight-glass p-5 rounded-xl border border-glass-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#fb7185]/2 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-1">
            Passive Rental Income
          </span>
          <h3 className="text-2xl font-bold font-outfit text-[#fb7185] mb-1">
            +{formatCurrency(portfolio.total_monthly_rent)}/mo
          </h3>
          <p className="text-[11px] text-on-surface-variant/50">
            Accrued from Real Estate assets
          </p>
        </div>
      </div>

      {/* Donut Allocation & Suggested Picks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart (Col-span 5) */}
        <div className="lg:col-span-5 midnight-glass p-6 rounded-xl flex flex-col justify-between items-center border border-glass-border/40 min-h-[350px]">
          <h3 className="w-full text-left font-semibold text-[15px] text-text-primary uppercase tracking-wider mb-6">
            Portfolio Allocation
          </h3>

          {totalPortfolioValue > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
              {/* Radial SVG Donut */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-variant/10"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="11"
                  />
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="40"
                      stroke={seg.hex}
                      strokeWidth="11"
                      strokeDasharray={seg.strokeDashArray}
                      strokeDashoffset={seg.strokeDashOffset}
                      style={{
                        filter: `drop-shadow(0 0 4px ${seg.hex}40)`
                      }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-on-surface-variant text-[9px] font-bold tracking-widest">TOTAL</span>
                  <span className="text-lg font-bold text-text-primary font-outfit">
                    {formatCurrency(totalPortfolioValue)}
                  </span>
                </div>
              </div>

              {/* Color Indicators */}
              <div className="flex flex-col gap-2.5 flex-1">
                {donutSegments.map((seg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-sm`} style={{ backgroundColor: seg.hex }}></div>
                      <span>{seg.label}</span>
                    </div>
                    <span className="text-text-primary">{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant/60 gap-3 py-10">
              <span className="material-symbols-outlined text-[48px]">pie_chart</span>
              <p className="text-sm">No active investments to allocate.</p>
            </div>
          )}
        </div>

        {/* Dynamic Suggested Picks (Col-span 7) */}
        <div className="lg:col-span-7 midnight-glass p-6 rounded-xl border border-glass-border/40 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-[15px] text-text-primary uppercase tracking-wider">
                Recommended Opportunities
              </h3>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Generated from your unallocated savings of {formatCurrency(availableCash)} ({savingsRate.toFixed(0)}% Savings Rate)
              </p>
            </div>
            <button
              onClick={loadAISuggestions}
              disabled={suggestionsLoading}
              className="p-2 bg-surface-variant/20 rounded-lg hover:bg-surface-variant/40 transition-all border border-glass-border/50 disabled:opacity-50"
              title="Refresh Recommendations"
            >
              <span className={`material-symbols-outlined text-[18px] text-primary flex items-center justify-center ${suggestionsLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
            </button>
          </div>

          {suggestionsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
              <p className="text-xs text-on-surface-variant tracking-wider">CALCULATING INVESTMENT OPTIMIZATIONS...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col gap-4 flex-1">
              {/* Safety Warning Banner */}
              {warningMessage && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed backdrop-blur-md ${runwayMonths < 1.5
                  ? 'bg-rose-500/5 border-rose-500/30 text-rose-200'
                  : 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                  }`}>
                  <span className={`material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 ${runwayMonths < 1.5 ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                    {runwayMonths < 1.5 ? 'gpp_maybe' : 'info'}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold block mb-0.5">
                      {runwayMonths < 1.5 ? 'Safety Alert: Low Emergency Buffer' : 'Notice: Complete Emergency Target'}
                    </span>
                    <span>{warningMessage}</span>
                  </div>
                </div>
              )}

              {/* Financial Health Summary Widget */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d1527]/30 border border-glass-border/30 p-3 rounded-xl w-full">
                {/* Metric 1: Risk Profile */}
                <div className="flex flex-col gap-0.5 border-r border-glass-border/20 last:border-0 pr-2 last:pr-0">
                  <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Risk Profile</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${riskProfile === 'Conservative' ? 'bg-[#10b981]' : riskProfile === 'Moderate' ? 'bg-[#f59e0b]' : 'bg-[#6366f1]'
                      }`}></div>
                    <span className="text-xs font-bold text-text-primary">{riskProfile}</span>
                  </div>
                </div>

                {/* Metric 2: Risk Score */}
                <div className="flex flex-col gap-0.5 border-r border-glass-border/20 last:border-0 pr-2 last:pr-0">
                  <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Risk Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-text-primary">{riskScore}</span>
                    <span className="text-[9px] text-on-surface-variant/50">/100</span>
                  </div>
                </div>

                {/* Metric 3: Runway */}
                <div className="flex flex-col gap-0.5 border-r border-glass-border/20 last:border-0 pr-2 last:pr-0">
                  <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Runway</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-bold text-text-primary">{runwayMonths} Months</span>
                  </div>
                </div>

                {/* Metric 4: Target / Gap */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Emergency Gap</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs font-bold ${emergencyGap > 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
                      {emergencyGap > 0 ? `₹${emergencyGap.toLocaleString('en-IN')}` : 'Built ✅'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portfolio Concentration Alerts (if any) */}
              {portfolioWarnings.length > 0 && (
                <div className="flex flex-col gap-1.5 border border-amber-500/10 bg-amber-500/2 p-2.5 rounded-lg w-full">
                  {portfolioWarnings.map((warn, wIdx) => (
                    <div key={wIdx} className="flex items-center gap-2 text-[10px] text-amber-200/90 font-medium">
                      <span className="material-symbols-outlined text-[12px] text-amber-400">warning</span>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {suggestions.map((sug, idx) => {
                  const isHigh = sug.risk_level === 'High';
                  const isMed = sug.risk_level === 'Medium';

                  let cardBorder = 'border-primary/20';
                  let riskText = 'text-primary bg-primary/10';
                  if (isHigh) {
                    cardBorder = 'border-rose-expense/30';
                    riskText = 'text-rose-expense bg-rose-expense/10';
                  } else if (isMed) {
                    cardBorder = 'border-amber-400/20';
                    riskText = 'text-amber-400 bg-amber-400/10';
                  }

                  const meta = getAssetMeta(sug.asset_type);
                  const cardMatchScore = (() => {
                    let score = 88;
                    if (savingsRate > 50) score += 4;
                    else if (savingsRate < 20) score -= 6;

                    if (emergencyFundStatus === 'Safe') score += 3;
                    else score -= 4;

                    if (sug.risk_level === 'Low' && savingsRate < 30) score += 3;
                    if (sug.risk_level === 'High' && savingsRate > 40) score += 2;

                    return Math.min(98, Math.max(78, score));
                  })();

                  return (
                    <div key={idx} className={`p-4 rounded-xl border bg-gradient-to-br from-[#0e1624]/60 to-[#0b0f19]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 ${cardBorder}`}>

                      {/* Top edge glow overlay */}
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div>
                        {/* Asset Header Info */}
                        <div className="flex flex-col gap-2 mb-3 border-b border-glass-border/20 pb-3">
                          {/* Row 1: Icon & Asset Class only */}
                          <div className="flex items-center gap-1.5 w-full">
                            <span className={`material-symbols-outlined text-[13px] p-1 rounded-md border flex items-center justify-center flex-shrink-0 ${meta.colorClass}`}>
                              {meta.icon}
                            </span>
                            <span className="text-xs font-bold text-text-primary whitespace-nowrap">
                              {meta.label}
                            </span>
                          </div>
                          {/* Row 2: Match Score (left) & Risk Badge (right) */}
                          <div className="flex items-center justify-between w-full mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                              <span className="material-symbols-outlined text-[12px] text-primary font-bold flex items-center justify-center">verified</span>
                              <span>{cardMatchScore}% Match</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${riskText}`}>
                              {sug.risk_level} Risk
                            </span>
                          </div>
                        </div>

                        {/* Asset Name */}
                        <h4 className="font-bold text-sm text-text-primary tracking-tight mb-2 group-hover:text-primary transition-colors font-headline">
                          {sug.asset_name}
                        </h4>

                        {/* Why it's best (Short Rationale Summary) */}
                        <p className="text-xs text-on-surface-variant/80 leading-relaxed mb-4">
                          <span className="text-primary font-bold">Why it's best: </span>
                          {Array.isArray(sug.allocation_rationale) ? sug.allocation_rationale[0] : (sug.rationale || sug.allocation_rationale)}
                        </p>
                      </div>

                      {/* Action Block */}
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between items-center text-[10px] px-1 text-on-surface-variant/65 font-semibold">
                          <span>Recommended:</span>
                          <span className="text-text-primary font-bold font-outfit">{formatCurrency(sug.recommended_allocation, 0)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickExecute(sug)}
                          className="w-full py-2 bg-surface-variant/20 hover:bg-primary hover:text-on-primary border border-glass-border/50 hover:border-transparent rounded-lg font-bold text-[10px] tracking-wider transition-all flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-on-primary group-hover:border-transparent"
                        >
                          <span className="material-symbols-outlined text-[14px]">insights</span>
                          Configure & Invest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant/60 gap-3 py-10">
              <span className="material-symbols-outlined text-[48px]">insights</span>
              <p className="text-sm">No unallocated cash to run optimizations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset sub-tabs Filter Navigation */}
      <div className="border-b border-glass-border/30 flex gap-2 overflow-x-auto pb-0.5">
        {[
          { id: 'all', label: 'All Holdings', icon: 'account_balance_wallet' },
          { id: 'stocks', label: 'Stocks', icon: 'trending_up' },
          { id: 'mutual_funds', label: 'Mutual Funds', icon: 'analytics' },
          { id: 'fixed_deposit', label: 'FDs', icon: 'account_balance' },
          { id: 'gold', label: 'Gold', icon: 'workspace_premium' },
          { id: 'govt_schemes', label: 'Govt Schemes', icon: 'assured_workload' },
          { id: 'real_estate', label: 'Real Estate', icon: 'home' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2.5 font-bold text-xs tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant/75 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Holdings Table */}
      <div className="midnight-glass rounded-xl overflow-hidden border border-glass-border/40">
        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
          </div>
        ) : filteredHoldings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border/30 bg-[#0e1624]/60 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">Asset Details</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Invested Value</th>
                  <th className="p-4 text-right">Current Value</th>
                  <th className="p-4 text-right">P&L (Returns)</th>
                  <th className="p-4">Metrics / Details</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/20 text-xs font-semibold">
                {filteredHoldings.map((inv) => {
                  const pnl = inv.current_value - inv.amount_invested;
                  const pnlPct = inv.amount_invested > 0 ? (pnl / inv.amount_invested) * 100 : 0.0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-surface-variant/15 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[13px] text-text-primary">{inv.asset_name}</div>
                        <div className="text-[10px] text-on-surface-variant/50">Purchased: {new Date(inv.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize bg-surface-variant/20 px-2 py-0.5 rounded text-[10px] border border-glass-border/30">
                          {inv.asset_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right font-outfit text-text-primary">
                        {formatCurrency(inv.amount_invested)}
                      </td>
                      <td className="p-4 text-right font-outfit text-text-primary font-bold">
                        {formatCurrency(inv.current_value)}
                      </td>
                      <td className={`p-4 text-right font-outfit font-bold ${isProfit ? 'text-primary' : 'text-rose-expense'}`}>
                        <div>{isProfit ? '+' : ''}{formatCurrency(pnl)}</div>
                        <div className="text-[10px]">{isProfit ? '+' : ''}{pnlPct.toFixed(1)}%</div>
                      </td>
                      <td className="p-4 text-on-surface-variant/85 leading-relaxed">
                        {inv.asset_type === 'stocks' && (
                          <div>Shares: {inv.quantity} | Buy Price: {formatCurrency(inv.buy_price)}</div>
                        )}
                        {inv.asset_type === 'mutual_funds' && (
                          <div>Units: {inv.quantity} | NAV: {formatCurrency(inv.buy_price)}</div>
                        )}
                        {inv.asset_type === 'fixed_deposit' && (
                          <div>Rate: {inv.interest_rate}% | Maturing: {inv.maturity_date ? new Date(inv.maturity_date).toLocaleDateString() : 'N/A'}</div>
                        )}
                        {inv.asset_type === 'gold' && (
                          <div>Weight: {inv.quantity}g | Buy/g: {formatCurrency(inv.buy_price)}</div>
                        )}
                        {inv.asset_type === 'govt_schemes' && (
                          <div>Annual Contr: {formatCurrency(inv.annual_contribution)} | Exp Return: {inv.interest_rate}%</div>
                        )}
                        {inv.asset_type === 'real_estate' && (
                          <div>Monthly Rent: +{formatCurrency(inv.rental_income)} | Growth: {inv.appreciation_rate}%</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRedeem(inv)}
                          className="px-3 py-1.5 bg-rose-expense/10 text-rose-expense hover:bg-rose-expense hover:text-white border border-rose-expense/25 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Redeem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-on-surface-variant/50 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[48px]">receipt_long</span>
            <p className="text-sm">No active holdings in this asset class.</p>
          </div>
        )}
      </div>

      {/* ─── ADD INVESTMENT DIALOG/MODAL ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg midnight-glass border border-glass-border rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-5 border-b border-glass-border/30 flex justify-between items-center">
              <h3 className="font-headline-md text-lg text-text-primary font-bold">Add Asset to Portfolio</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* Asset Type Selector Tabstrip */}
            <div className="px-5 pt-3 overflow-x-auto flex gap-1 border-b border-glass-border/10 pb-2 bg-[#0e1624]/40">
              {[
                { id: 'stocks', label: 'Stocks' },
                { id: 'mutual_funds', label: 'Mutual Funds' },
                { id: 'fixed_deposit', label: 'Fixed Deposit' },
                { id: 'gold', label: 'Gold' },
                { id: 'govt_schemes', label: 'Govt Schemes' },
                { id: 'real_estate', label: 'Real Estate' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAssetTypeChange(t.id)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${selectedAssetType === t.id
                    ? 'bg-primary text-on-primary shadow-lg'
                    : 'bg-surface-variant/20 text-on-surface-variant/80 hover:bg-surface-variant/50'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddInvestment} className="p-5 overflow-y-auto space-y-4 flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-expense/10 border border-rose-expense/30 rounded-lg text-rose-expense text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Dynamic Inputs Based on Asset Type */}
              <div className="space-y-3">
                {/* 1. Common Asset Name Field */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">
                    {selectedAssetType === 'stocks' && 'Company / Ticker Name'}
                    {selectedAssetType === 'mutual_funds' && 'Mutual Fund Name'}
                    {selectedAssetType === 'fixed_deposit' && 'FD Bank Name'}
                    {selectedAssetType === 'gold' && 'Gold Description (e.g. 24K SGB)'}
                    {selectedAssetType === 'govt_schemes' && 'Scheme Name (e.g. PPF, NPS)'}
                    {selectedAssetType === 'real_estate' && 'Property Details'}
                  </label>
                  <input
                    type="text"
                    name="asset_name"
                    value={formData.asset_name}
                    onChange={handleInputChange}
                    placeholder="Enter details..."
                    required
                    className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* 2. Specific field configurations */}

                {/* Stocks & Mutual Funds Fields */}
                {(selectedAssetType === 'stocks' || selectedAssetType === 'mutual_funds') && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">
                          {selectedAssetType === 'stocks' ? 'Shares Count' : 'Units'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                          required
                          className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant">
                            {selectedAssetType === 'stocks' ? 'Buy Price (₹/Share)' : 'Buy NAV (₹)'}
                          </label>
                          {formData.asset_name && (
                            <button
                              type="button"
                              onClick={handleLivePriceLookup}
                              disabled={livePriceLoading}
                              className="text-[9px] font-bold text-primary hover:text-secondary transition-colors flex items-center gap-0.5 disabled:opacity-50"
                            >
                              {livePriceLoading
                                ? <><div className="w-2.5 h-2.5 rounded-full border border-primary/40 border-t-primary animate-spin" />Fetching...</>
                                : <><span className="material-symbols-outlined text-[11px]">bolt</span>Live Price</>}
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="any"
                          name="buy_price"
                          value={formData.buy_price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          required
                          className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    {/* Live price result banner */}
                    {livePriceData && (
                      <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${livePriceData.error
                        ? 'bg-rose-expense/10 border border-rose-expense/20 text-rose-expense'
                        : 'bg-primary/8 border border-primary/20 text-primary'
                        }`}>
                        {livePriceData.error ? (
                          <span>❌ {livePriceData.error.includes('404') ? `Ticker not found. For stocks use NSE code (e.g. RELIANCE, TCS, INFY). For MFs use scheme code (e.g. 120503).` : livePriceData.error}</span>
                        ) : (
                          <>
                            <span>⚡ Live: <strong>₹{livePriceData.current_price?.toLocaleString('en-IN')}</strong> per {selectedAssetType === 'mutual_funds' ? 'unit' : 'share'}</span>
                            {livePriceData.current_value && <span className="font-bold">Total: ₹{livePriceData.current_value?.toLocaleString('en-IN')}</span>}
                          </>
                        )}
                      </div>
                    )}
                    {selectedAssetType === 'stocks' && (
                      <p className="text-[10px] text-on-surface-variant/50">Use NSE ticker: RELIANCE, TCS, INFY, HDFCBANK, SBIN, etc.</p>
                    )}
                    {selectedAssetType === 'mutual_funds' && (
                      <p className="text-[10px] text-on-surface-variant/50">Enter AMFI scheme code (e.g. 120503) or fund name for live NAV.</p>
                    )}
                  </div>
                )}

                {/* Gold Fields */}
                {selectedAssetType === 'gold' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Weight (in Grams)</label>
                        <input
                          type="number"
                          step="any"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="e.g. 10"
                          required
                          className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant">Buy Price per Gram (₹)</label>
                          <button
                            type="button"
                            onClick={handleLivePriceLookup}
                            disabled={livePriceLoading}
                            className="text-[9px] font-bold text-primary hover:text-secondary transition-colors flex items-center gap-0.5 disabled:opacity-50"
                          >
                            {livePriceLoading
                              ? <><div className="w-2.5 h-2.5 rounded-full border border-primary/40 border-t-primary animate-spin" />Fetching...</>
                              : <><span className="material-symbols-outlined text-[11px]">bolt</span>Live Gold</>}
                          </button>
                        </div>
                        <input
                          type="number"
                          step="any"
                          name="buy_price"
                          value={formData.buy_price}
                          onChange={handleInputChange}
                          placeholder="e.g. 9500"
                          required
                          className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    {livePriceData && selectedAssetType === 'gold' && (
                      <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${livePriceData.error
                        ? 'bg-rose-expense/10 border border-rose-expense/20 text-rose-expense'
                        : 'bg-primary/8 border border-primary/20 text-primary'
                        }`}>
                        {livePriceData.error ? (
                          <span>❌ {livePriceData.error}</span>
                        ) : (
                          <span>⚡ Live MCX Gold: <strong>₹{livePriceData.current_price?.toLocaleString('en-IN')}</strong>/gram (auto-filled above)</span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-on-surface-variant/50">Click "Live Gold" to auto-fill current MCX gold price per gram.</p>
                  </div>
                )}


                {/* Fixed Deposit Fields */}
                {selectedAssetType === 'fixed_deposit' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="any"
                        name="interest_rate"
                        value={formData.interest_rate}
                        onChange={handleInputChange}
                        placeholder="e.g. 7.1"
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Maturity Date</label>
                      <input
                        type="date"
                        name="maturity_date"
                        value={formData.maturity_date}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}

                {/* Govt Schemes Fields */}
                {selectedAssetType === 'govt_schemes' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Annual Contribution</label>
                      <input
                        type="number"
                        name="annual_contribution"
                        value={formData.annual_contribution}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Expected Return (%)</label>
                      <input
                        type="number"
                        step="any"
                        name="interest_rate"
                        value={formData.interest_rate}
                        onChange={handleInputChange}
                        placeholder="e.g. 8.5"
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Real Estate Fields */}
                {selectedAssetType === 'real_estate' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Monthly Rent (Rs)</label>
                      <input
                        type="number"
                        name="rental_income"
                        value={formData.rental_income}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Appreciation / Year (%)</label>
                      <input
                        type="number"
                        step="any"
                        name="appreciation_rate"
                        value={formData.appreciation_rate}
                        onChange={handleInputChange}
                        placeholder="e.g. 5"
                        required
                        className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Principal / Invested Amount Field */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">
                    {selectedAssetType === 'real_estate' ? 'Property Purchase Value' : 'Total Investment Amount'}
                  </label>
                  <input
                    type="number"
                    name="amount_invested"
                    value={formData.amount_invested}
                    onChange={handleInputChange}
                    disabled={selectedAssetType === 'stocks' || selectedAssetType === 'mutual_funds' || selectedAssetType === 'gold'}
                    placeholder="0.00"
                    required
                    className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <footer className="pt-4 border-t border-glass-border/20 flex justify-end gap-3 bg-slate-surface/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-glass-border hover:bg-surface-variant/30 text-on-surface-variant rounded-lg font-bold text-xs tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Confirm Asset'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ─── CAS IMPORT MODAL ─────────────────────────────────────────────── */}
      {casModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl midnight-glass border border-glass-border rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-5 border-b border-glass-border/30 flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-lg text-text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                  Import CAS Statement
                </h3>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">
                  Auto-import from CAMS, KFintech, or NSDL/CDSL PDF
                </p>
              </div>
              <button onClick={resetCASModal} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Info Banner */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-on-surface-variant/90 leading-relaxed">
                <p className="font-bold text-primary mb-1">📋 How to get your CAS PDF</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>CAMS:</strong> camsonline.com → Investors → Consolidated Account Statement</li>
                  <li><strong>KFintech:</strong> mfs.kfintech.com → Consolidated Account Statement</li>
                  <li><strong>Password:</strong> PAN (uppercase) + Date of Birth as ddmmyyyy — e.g. ABCDE1234F01011990</li>
                </ul>
              </div>

              {/* File Upload Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${casFile ? 'border-primary/60 bg-primary/5' : 'border-glass-border/40 hover:border-primary/40 bg-surface-variant/10'
                  }`}
                onClick={() => document.getElementById('cas-file-input').click()}
              >
                <input
                  id="cas-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setCasFile(e.target.files[0]);
                      setCasResult(null);
                      setCasError('');
                    }
                  }}
                />
                {casFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[40px]">picture_as_pdf</span>
                    <p className="font-bold text-text-primary text-sm">{casFile.name}</p>
                    <p className="text-xs text-on-surface-variant/60">{(casFile.size / 1024).toFixed(1)} KB — Click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-[48px]">cloud_upload</span>
                    <p className="text-sm text-on-surface-variant/80 font-semibold">Click to upload CAS PDF</p>
                    <p className="text-xs text-on-surface-variant/50">Supports CAMS, KFintech, NSDL, CDSL</p>
                  </div>
                )}
              </div>

              {/* Password & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">
                    PDF Password (if protected)
                  </label>
                  <input
                    type="password"
                    value={casPassword}
                    onChange={e => setCasPassword(e.target.value)}
                    placeholder="e.g. ABCDE1234F01011990"
                    className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-on-surface-variant/50 mt-1">PAN (caps) + DOB as ddmmyyyy</p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCasAutoSave(!casAutoSave)}
                    className={`relative w-11 h-6 rounded-full transition-all ${casAutoSave ? 'bg-primary' : 'bg-surface-variant/40'
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${casAutoSave ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-text-primary">Auto-save to Portfolio</p>
                    <p className="text-[10px] text-on-surface-variant/60">Saves all parsed holdings automatically</p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {casError && (
                <div className="p-3 bg-rose-expense/10 border border-rose-expense/30 rounded-lg text-rose-expense text-xs font-semibold">
                  {casError}
                </div>
              )}

              {/* Results Preview */}
              {casResult && (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/8 border border-primary/25 rounded-lg">
                    <p className="text-xs font-bold text-primary">
                      ✅ {casResult.message}
                    </p>
                  </div>

                  {/* MF Holdings Preview */}
                  {casResult.mutual_funds?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Mutual Funds ({casResult.mutual_funds.length})
                      </h4>
                      <div className="rounded-lg overflow-hidden border border-glass-border/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0e1624]/60 text-on-surface-variant/60 text-[10px] font-bold uppercase">
                            <tr>
                              <th className="px-3 py-2">Scheme</th>
                              <th className="px-3 py-2 text-right">Units</th>
                              <th className="px-3 py-2 text-right">NAV</th>
                              <th className="px-3 py-2 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-glass-border/20">
                            {casResult.mutual_funds.slice(0, 5).map((mf, i) => (
                              <tr key={i} className="hover:bg-surface-variant/10">
                                <td className="px-3 py-2 text-text-primary font-semibold max-w-[200px] truncate">{mf.scheme_name}</td>
                                <td className="px-3 py-2 text-right">{mf.units?.toFixed(3)}</td>
                                <td className="px-3 py-2 text-right">{mf.nav ? `₹${mf.nav}` : '—'}</td>
                                <td className="px-3 py-2 text-right text-primary font-bold">
                                  {mf.current_value ? `₹${mf.current_value.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            ))}
                            {casResult.mutual_funds.length > 5 && (
                              <tr><td colSpan={4} className="px-3 py-2 text-center text-on-surface-variant/50 text-[10px]">... and {casResult.mutual_funds.length - 5} more</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Stocks Preview */}
                  {casResult.stocks?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Stocks ({casResult.stocks.length})
                      </h4>
                      <div className="rounded-lg overflow-hidden border border-glass-border/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0e1624]/60 text-on-surface-variant/60 text-[10px] font-bold uppercase">
                            <tr>
                              <th className="px-3 py-2">Company</th>
                              <th className="px-3 py-2">ISIN</th>
                              <th className="px-3 py-2 text-right">Qty</th>
                              <th className="px-3 py-2 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-glass-border/20">
                            {casResult.stocks.slice(0, 5).map((s, i) => (
                              <tr key={i} className="hover:bg-surface-variant/10">
                                <td className="px-3 py-2 text-text-primary font-semibold">{s.company_name}</td>
                                <td className="px-3 py-2 text-on-surface-variant/60 font-mono text-[10px]">{s.isin}</td>
                                <td className="px-3 py-2 text-right">{s.quantity}</td>
                                <td className="px-3 py-2 text-right text-primary font-bold">
                                  {s.buy_value ? `₹${s.buy_value.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            ))}
                            {casResult.stocks.length > 5 && (
                              <tr><td colSpan={4} className="px-3 py-2 text-center text-on-surface-variant/50 text-[10px]">... and {casResult.stocks.length - 5} more</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {casResult.auto_saved > 0 && (
                    <div className="p-3 bg-primary/8 border border-primary/25 rounded-lg text-xs text-primary font-bold">
                      ✅ {casResult.auto_saved} holdings saved to your portfolio!
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="p-5 border-t border-glass-border/20 flex justify-end gap-3">
              <button
                onClick={resetCASModal}
                className="px-4 py-2 border border-glass-border hover:bg-surface-variant/30 text-on-surface-variant rounded-lg font-bold text-xs tracking-wider transition-all"
              >
                Close
              </button>
              {!casResult && (
                <button
                  onClick={handleCASImport}
                  disabled={!casFile || casLoading}
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50 flex items-center gap-2"
                >
                  {casLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />Parsing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">analytics</span>Parse & Preview</>
                  )}
                </button>
              )}
              {casResult && !casAutoSave && casResult.total_holdings_found > 0 && (
                <button
                  onClick={async () => {
                    setCasAutoSave(true);
                    await handleCASImport();
                  }}
                  disabled={casLoading}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Save All to Portfolio
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* ─── mTRUST REPORT & SYNC MODAL ────────────────────────────────────── */}
      {trustModalOpen && selectedSug && createPortal((() => {
        const selectedSugVal = selectedSug;
        const getMatchScore = () => {
          let score = 88;
          if (savingsRate > 50) score += 4;
          else if (savingsRate < 20) score -= 6;

          if (emergencyFundStatus === 'Safe') score += 3;
          else score -= 4;

          if (selectedSugVal.risk_level === 'Low' && savingsRate < 30) score += 3;
          if (selectedSugVal.risk_level === 'High' && savingsRate > 40) score += 2;

          return Math.min(98, Math.max(78, score));
        };

        const rationaleList = Array.isArray(selectedSugVal.allocation_rationale)
          ? selectedSugVal.allocation_rationale
          : [selectedSugVal.allocation_rationale || selectedSugVal.rationale];

        const principal = customAllocAmount;
        const rate = selectedSugVal.expected_return_rate || 12.0;

        const c1 = Math.round(principal * Math.pow(1 + rate / 100, 1));
        const c3 = Math.round(principal * Math.pow(1 + rate / 100, 3));
        const c5 = Math.round(principal * Math.pow(1 + rate / 100, 5));
        const c10 = Math.round(principal * Math.pow(1 + rate / 100, 10));

        const fd5 = Math.round(principal * Math.pow(1 + 7 / 100, 5));
        const extra5 = Math.max(0, c5 - fd5);

        const pct1 = Math.round((c1 - principal) / principal * 100);
        const pct3 = Math.round((c3 - principal) / principal * 100);
        const pct5 = Math.round((c5 - principal) / principal * 100);
        const pct10 = Math.round((c10 - principal) / principal * 100);
        const pctFd5 = Math.round((fd5 - principal) / principal * 100);

        const riskVal = selectedSugVal.risk_score || 5;

        // Determine volatility offset based on risk score for worst/best case bounds
        let offset = 4.0;
        if (riskVal <= 2) offset = 1.0;
        else if (riskVal === 3) offset = 4.0;
        else if (riskVal <= 7) offset = 8.0;
        else offset = 18.0;

        const rateExpected = rate;
        const rateWorst = Math.max(1.0, rate - offset);
        const rateBest = rate + offset;

        // Worst Case Compounding
        const w1 = Math.round(principal * Math.pow(1 + rateWorst / 100, 1));
        const w3 = Math.round(principal * Math.pow(1 + rateWorst / 100, 3));
        const w5 = Math.round(principal * Math.pow(1 + rateWorst / 100, 5));
        const w10 = Math.round(principal * Math.pow(1 + rateWorst / 100, 10));

        // Best Case Compounding
        const b1 = Math.round(principal * Math.pow(1 + rateBest / 100, 1));
        const b3 = Math.round(principal * Math.pow(1 + rateBest / 100, 3));
        const b5 = Math.round(principal * Math.pow(1 + rateBest / 100, 5));
        const b10 = Math.round(principal * Math.pow(1 + rateBest / 100, 10));

        // Growth percentages
        const pctW1 = Math.round((w1 - principal) / principal * 100);
        const pctW3 = Math.round((w3 - principal) / principal * 100);
        const pctW5 = Math.round((w5 - principal) / principal * 100);
        const pctW10 = Math.round((w10 - principal) / principal * 100);

        const pctB1 = Math.round((b1 - principal) / principal * 100);
        const pctB3 = Math.round((b3 - principal) / principal * 100);
        const pctB5 = Math.round((b5 - principal) / principal * 100);
        const pctB10 = Math.round((b10 - principal) / principal * 100);
        const getRiskColor = (score) => {
          if (score <= 3) return 'bg-[#10b981]';
          if (score <= 7) return 'bg-[#f59e0b]';
          return 'bg-[#ef4444]';
        };
        const getRiskLabel = (score) => {
          if (score <= 3) return 'LOW';
          if (score <= 7) return 'MEDIUM';
          return 'HIGH';
        };

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full ${trustViewMode === 'full' ? 'max-w-4xl' : 'max-w-xl'} midnight-glass border border-glass-border rounded-2xl shadow-2xl relative flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden transition-all duration-300 animate-fade-in`}>
              {/* Modal Header */}
              <header className="sticky top-0 z-10 p-3.5 sm:p-4 border-b border-glass-border/30 flex flex-wrap justify-between items-center bg-[#0a0f1d]/90 backdrop-blur-md gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-md text-sm md:text-base text-text-primary font-bold tracking-tight">
                        Personalized Investment Analysis Report
                      </h3>
                      <span className="bg-primary/10 border border-primary/25 text-primary text-[10px] md:text-xs font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Advisory Active
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/60 font-medium">
                      Tailored Intelligence Portfolio Proposal • {getMatchScore()}% suitability index match
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 ml-auto">
                  {/* Print Button */}
                  {trustViewMode === 'full' && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1.5 bg-[#1e293b]/50 border border-glass-border/40 hover:bg-[#0e1624]/60 hover:text-primary transition-all text-on-surface-variant rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold"
                      title="Print or Save Report as PDF"
                    >
                      <span className="material-symbols-outlined text-[14px]">print</span>
                      <span>Print/PDF</span>
                    </button>
                  )}

                  {/* Toggle Button */}
                  {trustModalStep === 'report' && (
                    <div className="flex bg-[#111827]/85 p-0.5 rounded-lg border border-glass-border/30 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setTrustViewMode('quick')}
                        className={`px-2.5 py-1 rounded-md transition-all ${trustViewMode === 'quick'
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant/70 hover:text-text-primary'
                          }`}
                      >
                        Quick Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrustViewMode('full')}
                        className={`px-2.5 py-1 rounded-md transition-all ${trustViewMode === 'full'
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant/70 hover:text-text-primary'
                          }`}
                      >
                        Full Analysis
                      </button>
                    </div>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setTrustModalOpen(false)}
                    className="text-on-surface-variant hover:text-rose-expense transition-colors p-1 bg-surface-variant/10 rounded-lg flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </header>

              {trustModalStep === 'report' ? (
                <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">

                  {/* Dynamic Suggested Amount Adjuster Panel */}
                  <div className="p-3 md:p-4 rounded-xl border border-glass-border/40 bg-gradient-to-r from-primary/10 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-bold text-text-primary flex items-center gap-1.5 font-headline">
                        <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
                        Customize Investment Allocation
                      </h4>
                      <p className="text-xs text-on-surface-variant/80">
                        Adjust how much you wish to invest. All historical performance scenarios and projected returns will update instantly.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomAllocAmount(prev => Math.max(1000, prev - 5000))}
                        className="w-8 h-8 rounded-lg bg-surface-variant/20 hover:bg-surface-variant/40 border border-glass-border/40 flex items-center justify-center text-text-primary text-sm font-bold transition-all"
                        title="Decrease by ₹5,000"
                      >
                        -
                      </button>

                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/65">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="1000"
                          value={customAllocAmount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setCustomAllocAmount(isNaN(val) ? 0 : val);
                          }}
                          className="w-28 bg-[#0a0f1d] border border-glass-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs md:text-sm font-extrabold text-primary outline-none focus:border-primary/80 transition-all font-outfit"
                          placeholder="Amount"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setCustomAllocAmount(prev => prev + 5000)}
                        className="w-8 h-8 rounded-lg bg-surface-variant/20 hover:bg-surface-variant/40 border border-glass-border/40 flex items-center justify-center text-text-primary text-sm font-bold transition-all"
                        title="Increase by ₹5,000"
                      >
                        +
                      </button>

                      {customAllocAmount !== (selectedSugVal.recommended_allocation || 10000) && (
                        <button
                          type="button"
                          onClick={() => setCustomAllocAmount(selectedSugVal.recommended_allocation || 10000)}
                          className="text-xs text-primary hover:underline font-bold ml-1.5 whitespace-nowrap"
                          title="Reset to recommended amount"
                        >
                          Reset to Recommended
                        </button>
                      )}
                    </div>
                  </div>

                  {trustViewMode === 'quick' ? (
                    /* ─── QUICK VIEW LAYOUT (COMPACT CARDS) ─── */
                    <div className="space-y-4">
                      {/* Client Financial Profile */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-base md:text-lg">account_balance_wallet</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Client Financial Profile</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs md:text-sm">
                          <div className="bg-[#0e1624]/60 p-2.5 rounded-lg border border-glass-border/15 flex justify-between items-center">
                            <span className="text-on-surface-variant/60 font-medium">Monthly Income:</span>
                            <span className="font-bold text-text-primary">{formatCurrency(totalIncome, 0)}</span>
                          </div>
                          <div className="bg-[#0e1624]/60 p-2.5 rounded-lg border border-glass-border/15 flex justify-between items-center">
                            <span className="text-on-surface-variant/60 font-medium">Monthly Expense:</span>
                            <span className="font-bold text-text-primary">{formatCurrency(totalExpense, 0)}</span>
                          </div>
                          <div className="bg-[#0e1624]/60 p-2.5 rounded-lg border border-glass-border/15 flex justify-between items-center">
                            <span className="text-on-surface-variant/60 font-medium">Net Savings:</span>
                            <span className="font-bold text-text-primary">{formatCurrency(totalSavings, 0)}</span>
                          </div>
                          <div className="bg-[#0e1624]/60 p-2.5 rounded-lg border border-glass-border/15 flex justify-between items-center">
                            <span className="text-on-surface-variant/60 font-medium">Savings Rate:</span>
                            <span className="font-bold text-primary">{savingsRate?.toFixed(0)}%</span>
                          </div>
                          <div className="bg-[#0e1624]/60 p-2.5 rounded-lg border border-glass-border/15 flex justify-between items-center col-span-1 sm:col-span-2">
                            <span className="text-on-surface-variant/60 font-medium">Emergency Reserve:</span>
                            <span className="font-bold text-emerald-400">Secure (3+ Months)</span>
                          </div>
                          <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/25 flex justify-between items-center col-span-1 sm:col-span-2">
                            <span className="text-primary/80 font-bold">Recommended Allocation Cap:</span>
                            <span className="font-bold text-primary">{formatCurrency(availableCash, 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Allocation Logic */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-base md:text-lg">help_outline</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Allocation Rationale</h4>
                        </div>
                        <ul className="space-y-1.5 text-xs md:text-sm text-on-surface-variant/90 leading-relaxed pl-1">
                          {rationaleList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Volatility Analysis */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-expense text-base md:text-lg">warning</span>
                            <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Risk Metrics & Loss Protection</h4>
                          </div>
                          <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${riskVal <= 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            riskVal <= 7 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                            {getRiskLabel(riskVal)} RISK — {riskVal}/10
                          </span>
                        </div>

                        {/* Premium Continuous Gradient Slider */}
                        <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 mb-4 mt-2">
                          <div
                            className="absolute -top-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#030712] shadow-md flex items-center justify-center transition-all duration-300"
                            style={{ left: `calc(${riskVal * 10}% - 10px)` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#030712]"></div>
                          </div>
                        </div>

                        <div className="bg-rose-expense/5 border border-rose-expense/10 p-3 rounded-lg mb-2 text-xs md:text-sm">
                          <p className="font-bold text-rose-expense uppercase tracking-wider mb-1 text-xs md:text-sm">Volatile Drawdown Expectations:</p>
                          <ul className="space-y-1 text-on-surface-variant/80">
                            {(selectedSugVal.cons || []).map((c, i) => (
                              <li key={i}>• {c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Projected Growth Scenarios */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-base md:text-lg">trending_up</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Projected Growth Scenarios</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant/60 mb-3">
                          Compound projections over a 5-year horizon based on estimated yield bands:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs md:text-sm mb-3">
                          <div className="bg-rose-950/10 p-2.5 rounded-lg border border-rose-500/10">
                            <p className="text-xs text-rose-400 font-bold uppercase">Conservative ({rateWorst.toFixed(0)}%)</p>
                            <p className="text-sm md:text-base font-bold text-text-primary font-outfit mt-1">{formatCurrency(w5, 0)}</p>
                            <p className="text-xs text-rose-400/80 font-semibold mt-0.5">+{pctW5}%</p>
                          </div>
                          <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                            <p className="text-xs text-primary font-bold uppercase">Moderate ({rateExpected.toFixed(0)}%)</p>
                            <p className="text-sm md:text-base font-bold text-primary font-outfit mt-1">{formatCurrency(c5, 0)}</p>
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">+{pct5}%</p>
                          </div>
                          <div className="bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-500/10">
                            <p className="text-xs text-emerald-400 font-bold uppercase">Optimistic ({rateBest.toFixed(0)}%)</p>
                            <p className="text-sm md:text-base font-bold text-text-primary font-outfit mt-1">{formatCurrency(b5, 0)}</p>
                            <p className="text-xs text-emerald-400/80 font-semibold mt-0.5">+{pctB5}%</p>
                          </div>
                        </div>

                        <div className="p-3 bg-primary/5 border border-primary/15 rounded text-xs md:text-sm flex justify-between items-center">
                          <span className="text-on-surface-variant/70 font-medium">Extra earnings vs FD (Expected 5 yr):</span>
                          <span className="font-bold text-[#10b981] font-outfit text-sm">+{formatCurrency(extra5, 0)}</span>
                        </div>
                      </div>

                      {/* Historical Performance Snapshot Section */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-base md:text-lg">history</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Historical Performance Illustration</h4>
                        </div>

                        <blockquote className="text-xs md:text-sm italic border-l-2 border-primary/40 pl-2.5 text-on-surface-variant/80 mb-3">
                          "How your {customAllocAmount === (selectedSugVal.recommended_allocation || 10000) ? 'recommended' : 'configured'} investment amount would have performed historically"
                        </blockquote>

                        <p className="text-xs md:text-sm text-on-surface-variant/80 mb-3">
                          Based on your {customAllocAmount === (selectedSugVal.recommended_allocation || 10000) ? 'recommended' : 'configured'} investment amount of <span className="text-text-primary font-bold">{formatCurrency(principal, 0)}</span>:
                        </p>

                        {(() => {
                          const histRows = calculateHistoricalSnapshot(selectedSugVal, principal);
                          if (!histRows) {
                            return (
                              <div className="p-3 bg-slate-900/30 border border-glass-border/10 rounded-lg text-center text-xs text-on-surface-variant/60">
                                Historical performance data is currently unavailable for this investment.
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              <div className="overflow-x-auto w-full max-w-full block border border-glass-border/20 rounded-lg">
                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                  <thead>
                                    <tr className="bg-[#0c1220]/60 border-b border-glass-border/20 text-on-surface-variant/60 font-bold uppercase text-[10px] md:text-xs">
                                      <th className="py-2.5 px-3">Timeline</th>
                                      <th className="py-2.5 px-3 text-right">Initial</th>
                                      <th className="py-2.5 px-3 text-right">Current Value</th>
                                      <th className="py-2.5 px-3 text-right">Net Gain</th>
                                      <th className="py-2.5 px-3 text-right">CAGR</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-glass-border/10">
                                    {histRows.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/30 font-medium text-text-primary">
                                        <td className="py-2.5 px-3 text-on-surface-variant/80 font-bold">{row.year}</td>
                                        <td className="py-2.5 px-3 text-right text-on-surface-variant/65">{formatCurrency(row.invested, 0)}</td>
                                        <td className="py-2.5 px-3 text-right font-bold font-outfit text-primary">{formatCurrency(row.currentValue, 0)}</td>
                                        <td className={`py-2.5 px-3 text-right font-outfit font-bold ${row.netProfit >= 0 ? 'text-[#10b981]' : 'text-rose-expense'}`}>
                                          {row.netProfit >= 0 ? '+' : ''}{formatCurrency(row.netProfit, 0)} ({row.totalReturn >= 0 ? '+' : ''}{row.totalReturn.toFixed(0)}%)
                                        </td>
                                        <td className={`py-2.5 px-3 text-right font-outfit font-bold ${row.cagr >= 0 ? 'text-[#10b981]' : 'text-rose-expense'}`}>
                                          {row.cagr >= 0 ? '+' : ''}{row.cagr.toFixed(1)}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                              </div>
                              <div className="p-3 bg-slate-950/40 border border-glass-border/10 rounded text-xs text-on-surface-variant/60 space-y-1.5 leading-normal">
                                <p>⚠️ <strong>Important Note:</strong> Historical performance is shown for educational and informational purposes only.</p>
                                <p>• Past performance does not guarantee future returns.</p>
                                <p>• Historical performance must never be used as the primary reason for an investment recommendation.</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Regulatory & Risk Disclosures (Quick View) */}
                      <div className="bg-[#0b0f19]/60 border border-glass-border/20 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-start gap-2 text-xs md:text-sm text-on-surface-variant/75 leading-relaxed font-medium">
                          <span className="material-symbols-outlined text-amber-500 text-sm md:text-base flex-shrink-0 mt-0.5">warning</span>
                          <div className="flex-1">
                            <span>
                              <strong>Market Risk Disclaimer:</strong> Mutual fund and equity investments are subject to market risks. Please read all scheme-related documents carefully.
                            </span>
                            {!disclaimerExpanded && (
                              <button
                                type="button"
                                onClick={() => setDisclaimerExpanded(true)}
                                className="text-primary hover:underline font-bold ml-1.5 focus:outline-none inline-flex items-center gap-0.5 whitespace-nowrap"
                              >
                                Read More <span className="material-symbols-outlined text-[14px] font-bold">expand_more</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {disclaimerExpanded && (
                          <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-on-surface-variant/65 leading-relaxed pl-6 pt-2 border-t border-glass-border/10 animate-fade-in font-medium">
                            <li>Past performance does not guarantee future returns. Projections are indicators, not promises.</li>
                            <li>These are AI-generated suggestions, not SEBI-registered advice. Capitallens is not a registered advisory.</li>
                            <li>Please consult a financial advisor before allocating capital to volatile asset markets.</li>
                            <li>Capitallens tracks metrics for convenience and is not responsible for investment losses.</li>
                            <li className="list-none pt-1">
                              <button
                                type="button"
                                onClick={() => setDisclaimerExpanded(false)}
                                className="text-primary hover:underline font-bold focus:outline-none inline-flex items-center gap-0.5"
                              >
                                Show Less <span className="material-symbols-outlined text-[14px] font-bold">expand_less</span>
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>

                  ) : (
                    /* ─── FULL REPORT VIEW (HYBRID ROW-WISE & COLUMN-WISE LAYOUT) ─── */
                    <div className="space-y-4 w-full">

                      {/* Row 1: Snapshot and Rationale side-by-side */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Client Financial Profile */}
                        <div className="lg:col-span-6">
                          <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4 h-full">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
                              <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Client Financial Profile</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs md:text-sm">
                              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-glass-border/10">
                                <p className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase font-bold">Monthly Income</p>
                                <p className="text-sm font-bold text-text-primary font-outfit mt-0.5">{formatCurrency(totalIncome, 0)}</p>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-glass-border/10">
                                <p className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase font-bold">Monthly Expense</p>
                                <p className="text-sm font-bold text-text-primary font-outfit mt-0.5">{formatCurrency(totalExpense, 0)}</p>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-glass-border/10">
                                <p className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase font-bold">Net Savings</p>
                                <p className="text-sm font-bold text-text-primary font-outfit mt-0.5">{formatCurrency(totalSavings, 0)}</p>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-glass-border/10">
                                <p className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase font-bold">Savings Rate</p>
                                <p className="text-sm font-bold text-primary font-outfit mt-0.5">{savingsRate?.toFixed(0)}%</p>
                              </div>
                              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-glass-border/10 col-span-1 sm:col-span-2 flex justify-between items-center gap-2 flex-wrap">
                                <span className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase font-bold">Emergency Reserve</span>
                                <span className="text-xs md:text-sm font-bold text-emerald-400 font-outfit">Secure (3+ Months)</span>
                              </div>
                              <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/20 col-span-1 sm:col-span-2 flex justify-between items-center gap-2 flex-wrap">
                                <span className="text-[10px] md:text-xs text-primary/80 uppercase font-bold">Investable Amount</span>
                                <span className="text-xs md:text-sm font-bold text-primary font-outfit">{formatCurrency(availableCash, 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Allocation Rationale */}
                        <div className="lg:col-span-6">
                          <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4 h-full">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-primary text-[18px]">help_outline</span>
                              <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Allocation Rationale</h4>
                            </div>
                            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant/90 leading-relaxed font-medium pl-1">
                              {rationaleList.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">✅</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Risk Metrics & Loss Protection */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-expense text-[18px]">warning</span>
                            <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Risk Metrics & Loss Protection</h4>
                          </div>
                          <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${riskVal <= 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            riskVal <= 7 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                            {getRiskLabel(riskVal)} RISK — {riskVal}/10
                          </span>
                        </div>

                        {/* Premium Continuous Gradient Slider */}
                        <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 mb-4 mt-2">
                          <div
                            className="absolute -top-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#030712] shadow-md flex items-center justify-center transition-all duration-300"
                            style={{ left: `calc(${riskVal * 10}% - 10px)` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#030712]"></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm leading-relaxed mt-4">
                          <div className="bg-rose-expense/5 border border-rose-expense/10 p-3 rounded-lg space-y-1.5">
                            <p className="text-xs md:text-sm font-bold text-rose-expense uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">dangerous</span> Volatile Drawdown Expectations:
                            </p>
                            <ul className="space-y-1 text-xs md:text-sm text-on-surface-variant/80 pl-1">
                              {(selectedSugVal.cons || []).map((c, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-rose-expense">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-[#10b981]/5 border border-[#10b981]/10 p-3 rounded-lg space-y-1.5">
                            <p className="text-xs md:text-sm font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">shield</span> Capital Safety Anchors:
                            </p>
                            <ul className="space-y-1 text-xs md:text-sm text-on-surface-variant/80 pl-1">
                              {(selectedSugVal.risk_protection || []).map((p, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-[#10b981]">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Historical Performance Illustration (Full Width) */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Historical Performance Illustration</h4>
                        </div>

                        <blockquote className="text-xs md:text-sm italic border-l-2 border-primary/40 pl-2.5 text-on-surface-variant/80 mb-3">
                          "How your {customAllocAmount === (selectedSugVal.recommended_allocation || 10000) ? 'recommended' : 'configured'} investment amount would have performed historically"
                        </blockquote>

                        <p className="text-xs md:text-sm text-on-surface-variant/85 mb-3">
                          Based on your {customAllocAmount === (selectedSugVal.recommended_allocation || 10000) ? 'recommended' : 'configured'} investment amount of <span className="text-text-primary font-bold">{formatCurrency(principal, 0)}</span>:
                        </p>

                        {(() => {
                          const histRows = calculateHistoricalSnapshot(selectedSugVal, principal);
                          if (!histRows) {
                            return (
                              <div className="p-3.5 bg-slate-900/30 border border-glass-border/10 rounded-lg text-center text-xs text-on-surface-variant/60">
                                Historical performance data is currently unavailable for this investment.
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-4">
                              <div className="overflow-x-auto w-full max-w-full block border border-glass-border/20 rounded-lg">
                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                  <thead>
                                    <tr className="bg-[#0c1220]/60 border-b border-glass-border/20 text-on-surface-variant/60 font-bold uppercase text-[10px] md:text-xs">
                                      <th className="py-2.5 px-3">Timeline</th>
                                      <th className="py-2.5 px-3 text-right">Initial Invested</th>
                                      <th className="py-2.5 px-3 text-right">Current Value</th>
                                      <th className="py-2.5 px-3 text-right">Net Profit / Loss</th>
                                      <th className="py-2.5 px-3 text-right">Total Return</th>
                                      <th className="py-2.5 px-3 text-right">CAGR</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-glass-border/10">
                                    {histRows.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/30 font-medium text-text-primary">
                                        <td className="py-2.5 px-3 text-on-surface-variant/80 font-bold">{row.year}</td>
                                        <td className="py-2.5 px-3 text-right text-on-surface-variant/60">{formatCurrency(row.invested, 0)}</td>
                                        <td className="py-2.5 px-3 text-right font-bold font-outfit text-primary">{formatCurrency(row.currentValue, 0)}</td>
                                        <td className={`py-2.5 px-3 text-right font-outfit font-bold ${row.netProfit >= 0 ? 'text-[#10b981]' : 'text-rose-expense'}`}>
                                          {row.netProfit >= 0 ? '+' : ''}{formatCurrency(row.netProfit, 0)}
                                        </td>
                                        <td className={`py-2.5 px-3 text-right font-outfit font-bold ${row.totalReturn >= 0 ? 'text-[#10b981]' : 'text-rose-expense'}`}>
                                          {row.totalReturn >= 0 ? '+' : ''}{row.totalReturn.toFixed(1)}%
                                        </td>
                                        <td className={`py-2.5 px-3 text-right font-outfit font-bold ${row.cagr >= 0 ? 'text-[#10b981]' : 'text-rose-expense'}`}>
                                          {row.cagr >= 0 ? '+' : ''}{row.cagr.toFixed(1)}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="p-3 bg-slate-950/40 border border-glass-border/10 rounded text-xs text-on-surface-variant/60 space-y-1.5 leading-normal">
                                <p>⚠️ <strong>Important Note:</strong> Historical performance is shown for educational and informational purposes only.</p>
                                <p>• Past performance does not guarantee future returns.</p>
                                <p>• Historical performance must never be used as the primary reason for an investment recommendation.</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Row 4: Projected Growth Scenarios (Full Width) */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Projected Growth Scenarios</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant/60 mb-3">
                          Compounding <strong>{formatCurrency(principal, 0)}</strong> over time based on historical market fluctuation bounds:
                        </p>

                        <div className="overflow-x-auto w-full max-w-full block border border-glass-border/20 rounded-lg mb-4">
                          <table className="w-full text-left text-xs md:text-sm">
                            <thead>
                              <tr className="bg-[#0c1220]/60 border-b border-glass-border/20 text-on-surface-variant/60 font-bold uppercase text-[10px] md:text-xs">
                                <th className="py-2.5 px-3">Case Scenario</th>
                                <th className="py-2.5 px-3 text-right">1 Year</th>
                                <th className="py-2.5 px-3 text-right">3 Years</th>
                                <th className="py-2.5 px-3 text-right">5 Years</th>
                                <th className="py-2.5 px-3 text-right">10 Years</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/10">
                              <tr className="text-on-surface-variant/90 hover:bg-slate-900/30">
                                <td className="py-2.5 px-3 font-semibold text-rose-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">trending_down</span>
                                  Conservative Scenario ({rateWorst.toFixed(1)}% CAGR)
                                </td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(w1, 0)} <span className="text-[10px] md:text-xs text-rose-400/80">(+{pctW1}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(w3, 0)} <span className="text-[10px] md:text-xs text-rose-400/80">(+{pctW3}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit font-semibold">{formatCurrency(w5, 0)} <span className="text-[10px] md:text-xs text-rose-400/80">(+{pctW5}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(w10, 0)} <span className="text-[10px] md:text-xs text-rose-400/80">(+{pctW10}%)</span></td>
                              </tr>
                              <tr className="bg-primary/5 font-bold text-text-primary">
                                <td className="py-2.5 px-3 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-primary">insights</span>
                                  Moderate Scenario ({rateExpected.toFixed(1)}% CAGR)
                                </td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(c1, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pct1}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(c3, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pct3}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit text-primary">{formatCurrency(c5, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pct5}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(c10, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pct10}%)</span></td>
                              </tr>
                              <tr className="text-on-surface-variant/90 hover:bg-slate-900/30">
                                <td className="py-2.5 px-3 font-semibold text-[#10b981] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">trending_up</span>
                                  Optimistic Scenario ({rateBest.toFixed(1)}% CAGR)
                                </td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(b1, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pctB1}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(b3, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pctB3}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit font-semibold text-[#10b981]">{formatCurrency(b5, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pctB5}%)</span></td>
                                <td className="py-2.5 px-3 text-right font-outfit">{formatCurrency(b10, 0)} <span className="text-[10px] md:text-xs text-emerald-400">(+{pctB10}%)</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm leading-relaxed">
                          <div>
                            <p className="text-[10px] md:text-xs text-on-surface-variant/60 font-semibold uppercase">vs SBI Fixed Deposit (7%):</p>
                            <p className="font-bold text-text-primary font-outfit mt-1">
                              5 Years FD: {formatCurrency(fd5, 0)} <span className="text-on-surface-variant/60 text-[10px] md:text-xs font-normal">(+{pctFd5}%)</span>
                            </p>
                          </div>
                          <div className="sm:border-l border-glass-border/20 sm:pl-4">
                            <p className="text-[10px] md:text-xs text-[#10b981] font-bold uppercase tracking-wider">🔥 Extra Earnings vs FD (Expected Case):</p>
                            <p className="text-sm md:text-base font-bold text-[#10b981] font-outfit mt-0.5">+{formatCurrency(extra5, 0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Row 5: Comparative Options Matrix (Full Width) */}
                      <div className="bg-[#0b0f19]/80 border border-glass-border/30 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-primary text-[18px]">table_chart</span>
                          <h4 className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-wider">Comparative Options Matrix</h4>
                        </div>
                        <div className="overflow-x-auto w-full max-w-full block border border-glass-border/20 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs md:text-sm">
                            <thead>
                              <tr className="bg-[#0c1220]/60 border-b border-glass-border/20 text-on-surface-variant/60 font-bold uppercase text-[10px] md:text-xs">
                                <th className="py-2.5 px-3">Asset Option</th>
                                <th className="py-2.5 px-3 text-right">Yield Target</th>
                                <th className="py-2.5 px-3 text-center">Volatility</th>
                                <th className="py-2.5 px-3 text-center">Liquidity Access</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/10">
                              <tr className="bg-primary/10 font-bold text-text-primary text-xs md:text-sm border-l-2 border-primary shadow-[0_0_15px_rgba(90,240,179,0.15)]">
                                <td className="py-3 px-3 flex items-center gap-2 flex-wrap">
                                  <span>{selectedSugVal.asset_name}</span>
                                  <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] md:text-xs font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Advisory Pick
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right text-primary">+{selectedSugVal.expected_return_rate}%</td>
                                <td className="py-3 px-3 text-center uppercase tracking-wider text-xs md:text-sm">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${riskVal <= 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    riskVal <= 7 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    {getRiskLabel(riskVal)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center capitalize">{selectedSugVal.liquidity || 'Yes'}</td>
                              </tr>
                              <tr className="text-on-surface-variant/80 hover:bg-slate-900/30">
                                <td className="py-2.5 px-3">Bank Fixed Deposit (FD)</td>
                                <td className="py-2.5 px-3 text-right">7.0%</td>
                                <td className="py-2.5 px-3 text-center uppercase text-xs font-bold"><span className="bg-slate-800/60 text-on-surface-variant/70 px-2 py-0.5 rounded">None</span></td>
                                <td className="py-2.5 px-3 text-center">No</td>
                              </tr>
                              <tr className="text-on-surface-variant/80 hover:bg-slate-900/30">
                                <td className="py-2.5 px-3">Savings Bank Account</td>
                                <td className="py-2.5 px-3 text-right">3.5%</td>
                                <td className="py-2.5 px-3 text-center uppercase text-xs font-bold"><span className="bg-slate-800/60 text-on-surface-variant/70 px-2 py-0.5 rounded">None</span></td>
                                <td className="py-2.5 px-3 text-center">Yes</td>
                              </tr>
                              <tr className="text-on-surface-variant/80 hover:bg-slate-900/30">
                                <td className="py-2.5 px-3">Physical / Digital Gold</td>
                                <td className="py-2.5 px-3 text-right">8.0%</td>
                                <td className="py-2.5 px-3 text-center uppercase text-xs font-bold"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Low</span></td>
                                <td className="py-2.5 px-3 text-center">Yes</td>
                              </tr>
                              {selectedSugVal.ticker !== 'TATOMOTORS' && (
                                <tr className="text-on-surface-variant/80 hover:bg-slate-900/30">
                                  <td className="py-2.5 px-3">Growth Stock (Tata Motors)</td>
                                  <td className="py-2.5 px-3 text-right">16.5%</td>
                                  <td className="py-2.5 px-3 text-center uppercase text-xs font-bold"><span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Medium</span></td>
                                  <td className="py-2.5 px-3 text-center">Yes</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Regulatory & Risk Disclosures (Full View) */}
                      <div className="bg-[#0b0f19]/60 border border-glass-border/20 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-start gap-2 text-xs md:text-sm text-on-surface-variant/75 leading-relaxed font-medium">
                          <span className="material-symbols-outlined text-amber-500 text-sm md:text-base flex-shrink-0 mt-0.5">warning</span>
                          <div className="flex-1">
                            <span>
                              <strong>Market Risk Disclaimer:</strong> Mutual fund and equity investments are subject to market risks. Please read all scheme-related documents carefully.
                            </span>
                            {!disclaimerExpanded && (
                              <button
                                type="button"
                                onClick={() => setDisclaimerExpanded(true)}
                                className="text-primary hover:underline font-bold ml-1.5 focus:outline-none inline-flex items-center gap-0.5 whitespace-nowrap"
                              >
                                Read More <span className="material-symbols-outlined text-[14px] font-bold">expand_more</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {disclaimerExpanded && (
                          <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-on-surface-variant/65 leading-relaxed pl-6 pt-2 border-t border-glass-border/10 animate-fade-in font-medium">
                            <li>Past performance does not guarantee future returns. Projections are indicators, not promises.</li>
                            <li>These are AI-generated suggestions, not SEBI-registered advice. Capitallens is not a registered advisory.</li>
                            <li>Please consult a financial advisor before allocating capital to volatile asset markets.</li>
                            <li>Capitallens tracks metrics for convenience and is not responsible for investment losses.</li>
                            <li className="list-none pt-1">
                              <button
                                type="button"
                                onClick={() => setDisclaimerExpanded(false)}
                                className="text-primary hover:underline font-bold focus:outline-none inline-flex items-center gap-0.5"
                              >
                                Show Less <span className="material-symbols-outlined text-[14px] font-bold">expand_less</span>
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Redirection Links List */}
                  {/* Redirection Links List */}
                  <div className="pt-3 border-t border-glass-border/25 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-on-surface-variant/50">
                      <label className="uppercase font-extrabold text-on-surface-variant/60 tracking-wider text-xs">
                        Select Portal & Proceed to Invest ({selectedSugVal.asset_name})
                      </label>
                      <span>
                        Data sources: NSE historical data, AMFI returns, transaction history
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {getBrokerLinks(selectedSugVal).map((link, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const type = selectedSugVal.asset_type || 'stocks';
                            let qty = '';
                            let price = '';
                            if (type === 'stocks' || type === 'mutual_funds' || type === 'gold') {
                              qty = '1';
                              price = String(customAllocAmount);
                            }
                            setSyncFormData(prev => ({
                              ...prev,
                              amount_invested: String(customAllocAmount),
                              quantity: qty,
                              buy_price: price,
                              annual_contribution: type === 'govt_schemes' ? String(customAllocAmount) : prev.annual_contribution
                            }));
                            window.open(link.url, '_blank');
                            setTrustModalStep('sync');
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-glass-border/40 bg-slate-surface/40 hover:border-primary/50 hover:bg-[#0e1624]/60 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg group-hover:scale-110 transition-transform text-[18px]">
                              {link.icon}
                            </span>
                            <div>
                              <div className="text-xs md:text-sm font-bold text-text-primary">{link.name}</div>
                              <div className="text-[10px] md:text-xs text-on-surface-variant/60 mt-0.5">{link.desc}</div>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[16px]">
                            arrow_forward_ios
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* Sync Form State */
                <form onSubmit={handleSyncSubmit} className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
                    <h4 className="text-xs md:text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm animate-pulse">info</span>
                      Broker Portal Opened in New Tab
                    </h4>
                    <p className="text-xs md:text-sm text-on-surface-variant/95 leading-relaxed">
                      Please complete the investment on your chosen broker portal. Once done, confirm or adjust the final execution parameters below to log this transaction in your portfolio.
                    </p>
                  </div>

                  {syncError && (
                    <div className="p-3 bg-rose-expense/10 border border-rose-expense/30 rounded-lg text-rose-expense text-xs font-semibold">
                      {syncError}
                    </div>
                  )}

                  <div className="space-y-3.5">
                    {/* Asset name (readonly) */}
                    <div>
                      <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">Asset Name</label>
                      <input
                        type="text"
                        value={syncFormData.asset_name}
                        readOnly
                        className="w-full bg-[#111827]/40 border border-glass-border/30 rounded-lg px-3 py-2 text-xs md:text-sm text-on-surface-variant/85 outline-none"
                      />
                    </div>

                    {/* Quantity and Price fields (if Stock, MF, or Gold) */}
                    {(syncFormData.asset_type === 'stocks' || syncFormData.asset_type === 'mutual_funds' || syncFormData.asset_type === 'gold') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">
                            {syncFormData.asset_type === 'stocks' && 'Shares Count'}
                            {syncFormData.asset_type === 'mutual_funds' && 'Units'}
                            {syncFormData.asset_type === 'gold' && 'Weight (Grams)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="quantity"
                            value={syncFormData.quantity}
                            onChange={handleSyncInputChange}
                            required
                            placeholder="e.g. 10"
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">
                            {syncFormData.asset_type === 'stocks' && 'Execution Price / Share'}
                            {syncFormData.asset_type === 'mutual_funds' && 'NAV per Unit'}
                            {syncFormData.asset_type === 'gold' && 'Price per Gram'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="buy_price"
                            value={syncFormData.buy_price}
                            onChange={handleSyncInputChange}
                            required
                            placeholder="e.g. 1000"
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Other fields based on FD / Govt scheme */}
                    {syncFormData.asset_type === 'fixed_deposit' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">Interest Rate (%)</label>
                          <input
                            type="number"
                            step="any"
                            name="interest_rate"
                            value={syncFormData.interest_rate}
                            onChange={handleSyncInputChange}
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">Maturity Date</label>
                          <input
                            type="date"
                            name="maturity_date"
                            value={syncFormData.maturity_date}
                            onChange={handleSyncInputChange}
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {syncFormData.asset_type === 'govt_schemes' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">Annual Contribution</label>
                          <input
                            type="number"
                            step="any"
                            name="annual_contribution"
                            value={syncFormData.annual_contribution}
                            onChange={handleSyncInputChange}
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase font-bold text-on-surface-variant block mb-1">Interest Rate (%)</label>
                          <input
                            type="number"
                            step="any"
                            name="interest_rate"
                            value={syncFormData.interest_rate}
                            onChange={handleSyncInputChange}
                            className="w-full bg-[#111827]/70 border border-glass-border/70 rounded-lg px-3 py-2 text-xs md:text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Recalculated amount invested display */}
                    <div className="bg-[#0e1624]/60 p-4 rounded-xl border border-glass-border/20 flex justify-between items-center">
                      <div>
                        <h5 className="text-xs md:text-sm font-bold text-on-surface-variant uppercase">Total Amount to Sync</h5>
                        <p className="text-[10px] md:text-xs text-on-surface-variant/50">Recalculated dynamically</p>
                      </div>
                      <div className="text-lg md:text-xl font-bold text-primary font-outfit">
                        {formatCurrency(parseFloat(syncFormData.amount_invested) || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-glass-border/20 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setTrustModalStep('report')}
                      className="px-4 py-2 border border-glass-border hover:bg-surface-variant/30 text-on-surface-variant rounded-lg font-bold text-xs tracking-wider transition-all"
                    >
                      Back to Report
                    </button>
                    <button
                      type="submit"
                      disabled={syncSubmitting}
                      className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50 flex items-center gap-2"
                    >
                      {syncSubmitting ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />Syncing...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">sync</span>Confirm & Sync to Portfolio</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })(), document.body)}

      {/* ─── CUSTOM REDEMPTION CONFIRMATION & SUCCESS MODAL ────────────────── */}
      {redeemModalOpen && redeemAsset && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md midnight-glass border border-glass-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in">
            {/* Modal Header */}
            <header className="p-5 border-b border-glass-border/30 flex justify-between items-center bg-[#0a0f1d]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-expense text-xl">monetization_on</span>
                <h3 className="font-headline-md text-sm text-text-primary font-bold tracking-tight">Confirm Asset Redemption</h3>
              </div>
              <button
                onClick={() => setRedeemModalOpen(false)}
                disabled={redeemSubmitting}
                className="text-on-surface-variant hover:text-rose-expense transition-colors p-1 bg-surface-variant/10 rounded-lg flex items-center justify-center disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            {!redeemSuccessData ? (
              /* Step 1: Confirmation Screen */
              <div className="p-6 space-y-4">
                {redeemError && (
                  <div className="p-3 bg-rose-expense/10 border border-rose-expense/30 rounded-lg text-rose-expense text-xs font-semibold">
                    {redeemError}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="bg-[#0e1624]/40 p-4 rounded-xl border border-glass-border/20 space-y-2">
                    <div className="text-[10px] text-on-surface-variant/50 uppercase font-bold">Asset to Liquidate</div>
                    <div className="font-bold text-sm text-text-primary">{redeemAsset.asset_name}</div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-glass-border/10">
                      <span className="text-on-surface-variant/70">Invested Amount:</span>
                      <span className="font-semibold text-text-primary font-outfit">{formatCurrency(redeemAsset.amount_invested)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-on-surface-variant/70">Current Live Valuation:</span>
                      <span className="font-bold text-primary font-outfit">{formatCurrency(redeemAsset.current_value)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-on-surface-variant/80 leading-relaxed text-center py-1 bg-rose-expense/5 rounded border border-rose-expense/10 text-rose-expense/90">
                    ⚠️ Selling this asset will transfer {formatCurrency(redeemAsset.current_value)} back to your available balance.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-glass-border/15">
                  <button
                    type="button"
                    onClick={() => setRedeemModalOpen(false)}
                    disabled={redeemSubmitting}
                    className="px-4 py-2 border border-glass-border hover:bg-surface-variant/30 text-on-surface-variant rounded-lg font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRedeemConfirm}
                    disabled={redeemSubmitting}
                    className="px-5 py-2 bg-rose-expense text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {redeemSubmitting ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Processing...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">sell</span>Confirm & Sell</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Success Screen */
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <span className="material-symbols-outlined text-2xl animate-bounce">check_circle</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-text-primary">Asset Redeemed Successfully!</h4>
                  <p className="text-[11px] text-on-surface-variant/85 leading-relaxed">
                    Transaction logged and balance synchronized.
                  </p>
                </div>

                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant/70">Payout Transferred:</span>
                    <span className="font-bold text-emerald-500 font-outfit">{formatCurrency(redeemSuccessData.payout)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-glass-border/10">
                    <span className="text-on-surface-variant/70">Capital Gains / Profit:</span>
                    <span className={`font-bold font-outfit ${redeemSuccessData.capital_gains >= 0 ? 'text-primary' : 'text-rose-expense'}`}>
                      {redeemSuccessData.capital_gains >= 0 ? '+' : ''}{formatCurrency(redeemSuccessData.capital_gains)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  className="w-full py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
