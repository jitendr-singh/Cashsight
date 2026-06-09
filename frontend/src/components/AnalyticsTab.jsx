import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export default function AnalyticsTab() {
  const { formatCurrency, currencySymbol } = useCurrency();
  // Summary Stats States
  const [summary, setSummary] = useState({
    total_income: 0.0,
    total_expense: 0.0,
    total_savings: 0.0,
    savings_rate: 0.0,
    burn_rate: 0.0,
    runway_months: 0.0,
    savings_rate_trend: 0.0,
    burn_rate_trend: 0.0,
    runway_trend: 0.0,
  });

  // Chart & Filter States
  const [viewMode, setViewMode] = useState('month'); // day | month | year | custom
  const [chartData, setChartData] = useState({
    labels: [],
    income: [],
    expense: [],
    savings: [],
    summary: { total_income: 0, total_expense: 0, total_savings: 0, savings_rate: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Dynamic Date Filters
  const [selectedMonthYear, setSelectedMonthYear] = useState('2026-06');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2026);
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Drawer (Option A Slide-out) State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Advanced Filter Panel staging values (modified within the drawer UI)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTxnType, setSelectedTxnType] = useState('all'); // all | income | expense | savings
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sliderAmount, setSliderAmount] = useState(1000);

  // Active Filter values (trigger actual API calls)
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTxnType, setActiveTxnType] = useState('all');
  const [activeMinAmount, setActiveMinAmount] = useState('');
  const [activeMaxAmount, setActiveMaxAmount] = useState('');

  const getRangeSubtitle = () => {
    if (viewMode === 'day') {
      const [year, monthStr] = selectedMonthYear.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthLabel = monthNames[parseInt(monthStr, 10) - 1];
      return `Daily overview of ${monthLabel} ${year}`;
    }
    if (viewMode === 'month') {
      return `Monthly overview of Year ${selectedYear}`;
    }
    if (viewMode === 'year') {
      return `Yearly overview from ${startYear} to ${endYear}`;
    }
    if (viewMode === 'custom') {
      return `Custom range from ${startDate} to ${endDate}`;
    }
    return 'Unified dynamic period trajectories';
  };

  // Sync slider visual when manual max amount changes to a valid number
  useEffect(() => {
    const parsed = parseInt(maxAmount, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setSliderAmount(parsed);
    }
  }, [maxAmount]);

  // Date validation and presets
  const [validationError, setValidationError] = useState('');

  // Validate custom dates
  useEffect(() => {
    if (viewMode === 'custom') {
      if (!startDate || !endDate) {
        setValidationError('Both dates are required');
      } else if (new Date(startDate) > new Date(endDate)) {
        setValidationError('Start Date must be before End Date');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [startDate, endDate, viewMode]);

  // Date Presets handlers
  const selectLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const selectLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const selectThisQuarter = () => {
    const end = new Date();
    const start = new Date();
    const currentMonth = end.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    start.setMonth(quarterStartMonth);
    start.setDate(1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const selectYTD = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), 0, 1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Category Breakdown state
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  // Recent Transactions list
  const [recentTxns, setRecentTxns] = useState([]);

  // Chart hover interaction tooltip state
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartContainerRef = useRef(null);
  const cardRef = useRef(null);
  // Holds the latest filtered chart point values so handleDotHover can read them
  const filteredDataRef = useRef({ income: [], expense: [], savings: [] });
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    x: 0,
    y: 0,
    translateX: '-50%',
    translateY: '-100%',
    marginTop: '-12px',
    label: '',
    income: 0,
    expense: 0,
    savings: 0,
    index: null
  });

  // Reactive isMobile — updates automatically on window resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDotHover = (idx, e) => {
    setHoveredIndex(idx);
    const dotElement = e.currentTarget;
    const dotRect = dotElement.getBoundingClientRect();

    if (!cardRef.current) return;
    const cardRect = cardRef.current.getBoundingClientRect();

    const x = dotRect.left - cardRect.left + dotRect.width / 2;
    const y = dotRect.top - cardRect.top + dotRect.height / 2;

    let translateX = '-50%';
    if (x < 100) {
      translateX = '0%';
    } else if (cardRect.width - x < 100) {
      translateX = '-100%';
    }

    const isUpperHalf = y < 180;
    const translateY = isUpperHalf ? '0%' : '-100%';
    const marginTop = isUpperHalf ? '12px' : '-12px';

    setTooltipState({
      visible: true,
      x,
      y,
      translateX,
      translateY,
      marginTop,
      label: chartData.labels[idx] || '',
      income:  filteredDataRef.current.income[idx]  ?? 0,
      expense: filteredDataRef.current.expense[idx] ?? 0,
      savings: filteredDataRef.current.savings[idx] ?? 0,
      index: idx
    });
  };

  const handleDotLeave = () => {
    setHoveredIndex(null);
    setTooltipState(prev => ({ ...prev, visible: false }));
  };

  const handleScroll = () => {
    if (hoveredIndex !== null) {
      setHoveredIndex(null);
      setTooltipState(prev => ({ ...prev, visible: false }));
    }
  };

  // ─── Fetch Categories ───
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await analyticsService.getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Sync drawer staging states with active states on open
  useEffect(() => {
    if (drawerOpen) {
      setSelectedCategory(activeCategory);
      setSelectedTxnType(activeTxnType);
      setMinAmount(activeMinAmount);
      setMaxAmount(activeMaxAmount);
    }
  }, [drawerOpen, activeCategory, activeTxnType, activeMinAmount, activeMaxAmount]);

  // ─── Fetch Summary & Category Breakdown & Recent Transactions ───
  const fetchSummaryAndBreakdown = useCallback(async () => {
    try {
      const [sumData, breakdownData, recentData] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getByCategory(),
        analyticsService.getRecentTransactions(),
      ]);
      if (sumData) setSummary(sumData);
      if (breakdownData && breakdownData.expense_by_category) {
        setCategoryBreakdown(breakdownData.expense_by_category);
      }
      if (recentData) {
        setRecentTxns(recentData.recent_transactions || recentData || []);
      }
    } catch (err) {
      console.error('Failed to fetch summary or breakdown data', err);
    }
  }, []);

  useEffect(() => {
    fetchSummaryAndBreakdown();
  }, [fetchSummaryAndBreakdown]);

  // ─── Fetch Range Data (Chart) ───
  const fetchRangeData = useCallback(async () => {
    if (viewMode === 'custom') {
      if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        return;
      }
    }
    setLoading(true);
    try {
      const filters = {
        view_mode: viewMode,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        // Only send income/expense to API — savings & all are handled client-side
        txn_type: (activeTxnType === 'income' || activeTxnType === 'expense') ? activeTxnType : undefined,
        min_amount: activeMinAmount !== '' ? parseFloat(activeMinAmount) : undefined,
        max_amount: activeMaxAmount !== '' ? parseFloat(activeMaxAmount) : undefined,
      };

      // Add timeframe variables based on mode
      if (viewMode === 'day') {
        const [y, m] = selectedMonthYear.split('-');
        filters.year = parseInt(y, 10);
        filters.month = parseInt(m, 10);
      } else if (viewMode === 'month') {
        filters.year = parseInt(selectedYear, 10);
      } else if (viewMode === 'year') {
        filters.from_year = parseInt(startYear, 10);
        filters.to_year = parseInt(endYear, 10);
      } else if (viewMode === 'custom') {
        filters.start_date = startDate;
        filters.end_date = endDate;
      }

      const data = await analyticsService.getRangeData(filters);
      if (data) {
        setChartData(data);
      }
    } catch (err) {
      console.error('Failed to fetch range data', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedMonthYear, selectedYear, startYear, endYear, startDate, endDate, activeCategory, activeTxnType, activeMinAmount, activeMaxAmount]);

  useEffect(() => {
    fetchRangeData();
  }, [fetchRangeData]);

  // Handle Apply filters inside the slide-out drawer
  const handleApplyFilters = () => {
    setActiveCategory(selectedCategory);
    setActiveTxnType(selectedTxnType);
    setActiveMinAmount(minAmount);
    setActiveMaxAmount(maxAmount);
    setDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedTxnType('all');
    setMinAmount('');
    setMaxAmount('');
    setSliderAmount(1000);

    // Reset active filters immediately to clear the chart
    setActiveCategory('all');
    setActiveTxnType('all');
    setActiveMinAmount('');
    setActiveMaxAmount('');
  };

  // ─── SVG PATH GENERATION LOGIC ───
  // Map chart points to coordinates
  const width = 800;
  const height = 200;
  const paddingX = 15;
  const paddingY = 30;

  const pointsCount = chartData.income.length;
  const shouldScroll = pointsCount > 12;

  /**
   * Computes indices to show such that:
   * - First (0) and last (pointsCount-1) are always included
   * - Remaining labels are mathematically equally spaced
   * - Never shows adjacent labels that would overlap
   */
  const getVisibleLabelIndices = () => {
    if (pointsCount === 0) return [];
    if (pointsCount === 1) return [0];

    // Decide how many labels we want (uses reactive isMobile state from component scope)
    let maxLabels;
    if (isMobile) {
      maxLabels = shouldScroll ? 6 : Math.min(pointsCount, 4);
    } else {
      maxLabels = Math.min(pointsCount, 10);
    }

    if (maxLabels <= 1) return [0];

    // Distribute evenly: step = (count-1) / (maxLabels-1)
    // This guarantees first=0 and last=pointsCount-1 are always included
    const indices = [];
    for (let i = 0; i < maxLabels; i++) {
      const idx = Math.round(i * (pointsCount - 1) / (maxLabels - 1));
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices.sort((a, b) => a - b);
  };

  const visibleLabelIndices = getVisibleLabelIndices();


  // ── Client-side Amount Range Filter ──
  // Zero-out any data points whose primary value falls outside [minAmt, maxAmt]
  const minAmt = activeMinAmount !== '' ? parseFloat(activeMinAmount) : null;
  const maxAmt = activeMaxAmount !== '' ? parseFloat(activeMaxAmount) : null;

  const applyAmountFilter = (arr) => {
    if (minAmt === null && maxAmt === null) return arr;
    return arr.map((val) => {
      if (minAmt !== null && val < minAmt) return 0;
      if (maxAmt !== null && val > maxAmt) return 0;
      return val;
    });
  };

  const filteredIncome  = applyAmountFilter(chartData.income);
  const filteredExpense = applyAmountFilter(chartData.expense);
  // Savings = income - expense; re-derive after filtering so it stays consistent
  const filteredSavings = filteredIncome.map((inc, i) => inc - filteredExpense[i]);

  // ── Symmetric Y-axis: maps full [minVal, maxVal] so negative savings stays inside ──
  const maxVal = Math.max(...filteredIncome, ...filteredExpense, ...filteredSavings, 1.0);
  const minVal = Math.min(...filteredIncome, ...filteredExpense, ...filteredSavings, 0);
  const yRange = maxVal - minVal || 1; // total span

  // getCoordinates uses the full [minVal, maxVal] range so negatives are mapped inside
  const getCoordinates = (array) => {
    if (array.length === 0) return [];
    return array.map((val, idx) => {
      const x = array.length === 1
        ? width / 2
        : paddingX + (idx / (array.length - 1)) * (width - 2 * paddingX);
      // Map val from [minVal, maxVal] → [bottom (height-paddingY), top (paddingY)]
      const y = height - paddingY - ((val - minVal) / yRange) * (height - 2 * paddingY);
      return { x, y, value: val };
    });
  };

  // Y position of zero line (visible when minVal < 0)
  const zeroY = height - paddingY - ((0 - minVal) / yRange) * (height - 2 * paddingY);
  const hasNegative = minVal < 0;

  // Update ref so handleDotHover always reads latest filtered values
  filteredDataRef.current = {
    income:  filteredIncome,
    expense: filteredExpense,
    savings: filteredSavings,
  };

  const incomePoints  = getCoordinates(filteredIncome);
  const expensePoints = getCoordinates(filteredExpense);
  const savingsPoints = getCoordinates(filteredSavings);


  // Generate smooth cubic bezier SVG paths
  const generateCurvePath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const generateAreaPath = (points) => {
    const curve = generateCurvePath(points);
    if (!curve) return '';
    return `${curve} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  };

  // Determine which lines to show based on activeTxnType
  const showIncome  = activeTxnType === 'all' || activeTxnType === 'both' || activeTxnType === 'income';
  const showExpense = activeTxnType === 'all' || activeTxnType === 'both' || activeTxnType === 'expense';
  const showSavings = activeTxnType === 'all' || activeTxnType === 'both' || activeTxnType === 'savings';

  const incomePath  = showIncome  ? generateCurvePath(incomePoints)  : '';
  const expensePath = showExpense ? generateCurvePath(expensePoints) : '';
  const savingsPath = showSavings ? generateCurvePath(savingsPoints) : '';
  const incomeArea  = showIncome  ? generateAreaPath(incomePoints)   : '';

  // Total Burn category reference for progress scaling
  const maxCategoryAmount = Math.max(...categoryBreakdown.map((c) => c.amount), 1.0);

  return (
    <div className="space-y-6 stagger-in">

      {/* 1. Glassmorphic KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Income Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <p className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-widest">Total Income</p>
          <h3 className="text-2xl font-extrabold text-text-primary font-outfit mt-1">
            {formatCurrency(summary.total_income)}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-xs text-primary font-semibold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>All-time Earnings</span>
          </div>
          <div className="h-[2px] w-full bg-white/5 absolute bottom-0 left-0">
            <div className="h-full bg-primary/70" style={{ width: '70%' }}></div>
          </div>
        </div>

        {/* Avg. Burn Rate Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <p className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-widest font-body-bold">Avg. Burn Rate</p>
          <h3 className="text-2xl font-extrabold text-rose-expense font-outfit mt-1">
            {formatCurrency(summary.burn_rate)}
            <span className="text-xs text-text-secondary/40 font-medium">/mo</span>
          </h3>
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${summary.burn_rate_trend > 0 ? 'text-rose-expense' : 'text-primary'}`}>
            <span className="material-symbols-outlined text-sm">
              {summary.burn_rate_trend > 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span>
              {summary.burn_rate_trend > 0 ? '+' : ''}
              {summary.burn_rate_trend}% vs Last Mo
            </span>
          </div>
          <div className="h-[2px] w-full bg-white/5 absolute bottom-0 left-0">
            <div className="h-full bg-rose-expense/70" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Net Savings Rate Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <p className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-widest">Net Savings Rate</p>
          <h3 className="text-2xl font-extrabold text-secondary font-outfit mt-1">
            {summary.savings_rate}%
          </h3>
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${summary.savings_rate_trend >= 0 ? 'text-primary' : 'text-rose-expense'}`}>
            <span className="material-symbols-outlined text-sm">
              {summary.savings_rate_trend >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span>
              {summary.savings_rate_trend >= 0 ? '+' : ''}
              {summary.savings_rate_trend}% vs Last Mo
            </span>
          </div>
          <div className="h-[2px] w-full bg-white/5 absolute bottom-0 left-0">
            <div className="h-full bg-secondary/70" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Financial Runway Card */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <p class="text-[11px] font-bold text-text-secondary/50 uppercase tracking-widest">Financial Runway</p>
            <h3 className="text-2xl font-extrabold text-text-primary font-outfit">
              {summary.runway_months} <span className="text-xs font-semibold text-text-secondary/40">Months</span>
            </h3>
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${summary.runway_trend >= 0 ? 'text-primary' : 'text-rose-expense'}`}>
              <span className="material-symbols-outlined text-[12px]">
                {summary.runway_trend >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span>
                {summary.runway_trend >= 0 ? '+' : ''}
                {summary.runway_trend} Mo from Last Mo
              </span>
            </div>
          </div>

          {/* Semi-radial circle indicators */}
          <div className="relative w-12 h-12">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" stroke="rgba(148, 163, 184, 0.06)" strokeWidth="3" fill="none" />
              <circle
                cx="18" cy="18" r="16"
                stroke="#5af0b3" strokeWidth="3.2" strokeLinecap="round" fill="none"
                strokeDasharray={`${Math.min(summary.runway_months * 5, 100)}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
              {Math.min(Math.round(summary.runway_months * 5), 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Content Section */}
      <div className="grid grid-cols-12 gap-6 items-stretch">

        {/* Trajectory Area Chart (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-6 rounded-3xl flex flex-col justify-between relative" ref={cardRef}>

          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-glass-border/20 pb-4">
            <div>
              <h3 className="font-outfit font-bold text-lg text-text-primary">Overview & Analytics</h3>
              <p className="text-xs text-text-secondary/50">{getRangeSubtitle()}</p>
            </div>

            {/* Fused Capsule Toggle Controls + Date Selector */}
            <div className="flex flex-wrap items-center gap-3">

              {/* Segmented Toggles */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-glass-border/40">
                {['day', 'month', 'year', 'custom'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${viewMode === mode
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-text-secondary hover:text-white'
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Dynamic Date Inputs based on ViewMode */}
              <div id="dynamic-period-control">
                {viewMode === 'day' && (
                  <input
                    type="month"
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                    className="bg-[#0e131f] border border-glass-border/50 text-xs font-bold text-text-primary rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                  />
                )}
                {viewMode === 'month' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="bg-[#0e131f] border border-glass-border/50 text-xs font-bold text-text-primary rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {Array.from(
                      { length: (new Date().getFullYear() - 2020) + 3 },
                      (_, i) => 2020 + i
                    ).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                )}
                {viewMode === 'year' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={startYear}
                      onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
                      className="bg-[#0e131f] border border-glass-border/50 text-xs font-bold text-text-primary rounded-xl px-2 py-1.5 focus:outline-none"
                    >
                      {[2020, 2021, 2022, 2023, 2024].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                    <span className="text-text-secondary/40 text-xs">to</span>
                    <select
                      value={endYear}
                      onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                      className="bg-[#0e131f] border border-glass-border/50 text-xs font-bold text-text-primary rounded-xl px-2 py-1.5 focus:outline-none"
                    >
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}
                {viewMode === 'custom' && (
                  <div className="flex flex-col gap-1.5 bg-white/5 p-2.5 rounded-xl border border-glass-border/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-[#0e131f] border border-glass-border/50 text-[10px] font-bold text-text-primary rounded-xl px-2 py-1.5 focus:outline-none focus:border-primary/50"
                      />
                      <span className="text-text-secondary/40 text-xs">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-[#0e131f] border border-glass-border/50 text-[10px] font-bold text-text-primary rounded-xl px-2 py-1.5 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Date Presets Capsule row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {[
                          { label: '7D', handler: selectLast7Days },
                          { label: '30D', handler: selectLast30Days },
                          { label: 'This Qtr', handler: selectThisQuarter },
                          { label: 'YTD', handler: selectYTD }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={preset.handler}
                            type="button"
                            className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 hover:text-white border border-glass-border/20 rounded text-[9px] font-bold text-text-secondary transition-all"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {validationError && (
                        <span className="text-[9px] text-rose-expense font-bold animate-pulse text-right">
                          {validationError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 📑 Filter Options Drawer Trigger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-glass-border/50 rounded-xl text-xs font-bold text-text-secondary flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Chart Legend — shows active lines */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {showIncome && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded-full" style={{ background: '#5de6ff' }} />
                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wide">Income</span>
              </div>
            )}
            {showExpense && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded-full" style={{ background: '#fb7185' }} />
                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wide">Expense</span>
              </div>
            )}
            {showSavings && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded-full" style={{ background: '#5af0b3' }} />
                <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-wide">Savings</span>
              </div>
            )}
          </div>
          <div
            className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-6 pr-1"
            onScroll={handleScroll}
          >
            <div
              className="w-full flex flex-col justify-between sm:!min-w-0"
              style={{ minWidth: shouldScroll ? `${Math.min(1600, Math.max(650, pointsCount * 35))}px` : '100%' }}
            >

              {/* SVG Line / Curve Chart */}
              <div className="h-64 relative" ref={chartContainerRef}>
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
                  </div>
                ) : pointsCount === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-text-secondary/40 text-xs">
                    No transaction data available for this range.
                  </div>
                ) : (
                  <>
                    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartAreaGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#5af0b3" stopOpacity="0.12"></stop>
                          <stop offset="100%" stopColor="#5af0b3" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[40, 90, 140, 190].map((yVal, idx) => (
                        <line key={idx} x1="0" y1={yVal} x2={width} y2={yVal} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      ))}

                      {/* Zero baseline — shown when savings dips below zero */}
                      {hasNegative && (
                        <line
                          x1="0" y1={zeroY} x2={width} y2={zeroY}
                          stroke="rgba(251,113,133,0.35)"
                          strokeWidth="1.5"
                          strokeDasharray="6 4"
                        />
                      )}
                      {hasNegative && (
                        <text x={width - 4} y={zeroY - 4} fill="rgba(251,113,133,0.6)" fontSize="9" textAnchor="end" fontFamily="Outfit, sans-serif" fontWeight="700">
                          ZERO
                        </text>
                      )}

                      {/* Area fill under income curve */}
                      {incomeArea && <path d={incomeArea} fill="url(#chartAreaGrad)" />}

                      {/* Income curve (Cyan) */}
                      {incomePath && <path d={incomePath} fill="none" stroke="#5de6ff" strokeWidth="2.5" />}

                      {/* Expense curve (Rose/Pink) */}
                      {expensePath && <path d={expensePath} fill="none" stroke="#fb7185" strokeWidth="2.5" />}

                      {/* Savings curve (Green) */}
                      {savingsPath && <path d={savingsPath} fill="none" stroke="#5af0b3" strokeWidth="2.5" />}

                      {/* Hover Line */}
                      {hoveredIndex !== null && incomePoints[hoveredIndex] && (
                        <line
                          x1={incomePoints[hoveredIndex].x}
                          y1={0}
                          x2={incomePoints[hoveredIndex].x}
                          y2={height - paddingY}
                          stroke="rgba(255,255,255,0.15)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      )}
                    </svg>

                    {/* Income Dots */}
                    {showIncome && incomePoints.map((pt, idx) => {
                      const isHovered = hoveredIndex === idx;
                      // Show dots for all reasonable point counts (daily custom max = 46, day view max = 31)
                      const shouldShow = pointsCount <= 60 || isHovered;
                      // Mobile dots are 10px for usable touch targets; desktop 8px
                      const dotSize = isHovered ? '12px' : (isMobile ? '10px' : '8px');

                      return (
                        <div
                          key={`inc-dot-${idx}`}
                          className="absolute rounded-full border border-[#0e131f] cursor-pointer pointer-events-auto transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{
                            left: `${(pt.x / width) * 100}%`,
                            top: `${(pt.y / height) * 100}%`,
                            width: dotSize,
                            height: dotSize,
                            borderWidth: isHovered ? '1.5px' : '1px',
                            backgroundColor: '#5de6ff',
                            boxShadow: isHovered ? '0 0 10px #5de6ff' : 'none',
                            opacity: shouldShow ? 1 : 0,
                            transition: 'opacity 0.15s ease, width 0.15s ease, height 0.15s ease'
                          }}
                          onMouseEnter={(e) => handleDotHover(idx, e)}
                          onMouseLeave={handleDotLeave}
                          onTouchStart={(e) => { e.stopPropagation(); handleDotHover(idx, e); }}
                          onTouchEnd={handleDotLeave}
                        />
                      );
                    })}

                    {/* Expense Dots */}
                    {showExpense && expensePoints.map((pt, idx) => {
                      const isHovered = hoveredIndex === idx;
                      const shouldShow = pointsCount <= 60 || isHovered;
                      const dotSize = isHovered ? '12px' : (isMobile ? '10px' : '8px');

                      return (
                        <div
                          key={`exp-dot-${idx}`}
                          className="absolute rounded-full border border-[#0e131f] cursor-pointer pointer-events-auto transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{
                            left: `${(pt.x / width) * 100}%`,
                            top: `${(pt.y / height) * 100}%`,
                            width: dotSize,
                            height: dotSize,
                            borderWidth: isHovered ? '1.5px' : '1px',
                            backgroundColor: '#fb7185',
                            boxShadow: isHovered ? '0 0 10px #fb7185' : 'none',
                            opacity: shouldShow ? 1 : 0,
                            transition: 'opacity 0.15s ease, width 0.15s ease, height 0.15s ease'
                          }}
                          onMouseEnter={(e) => handleDotHover(idx, e)}
                          onMouseLeave={handleDotLeave}
                          onTouchStart={(e) => { e.stopPropagation(); handleDotHover(idx, e); }}
                          onTouchEnd={handleDotLeave}
                        />
                      );
                    })}

                    {/* Savings Dots */}
                    {showSavings && savingsPoints.map((pt, idx) => {
                      const isHovered = hoveredIndex === idx;
                      const shouldShow = pointsCount <= 60 || isHovered;
                      const dotSize = isHovered ? '12px' : (isMobile ? '10px' : '8px');

                      return (
                        <div
                          key={`sav-dot-${idx}`}
                          className="absolute rounded-full border border-[#0e131f] cursor-pointer pointer-events-auto transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{
                            left: `${(pt.x / width) * 100}%`,
                            top: `${(pt.y / height) * 100}%`,
                            width: dotSize,
                            height: dotSize,
                            borderWidth: isHovered ? '1.5px' : '1px',
                            backgroundColor: '#5af0b3',
                            boxShadow: isHovered ? '0 0 10px #5af0b3' : 'none',
                            opacity: shouldShow ? 1 : 0,
                            transition: 'opacity 0.15s ease, width 0.15s ease, height 0.15s ease'
                          }}
                          onMouseEnter={(e) => handleDotHover(idx, e)}
                          onMouseLeave={handleDotLeave}
                          onTouchStart={(e) => { e.stopPropagation(); handleDotHover(idx, e); }}
                          onTouchEnd={handleDotLeave}
                        />
                      );
                    })}
                  </>
                )}
              </div>

              {/* X Axis Labels (Absolutely aligned with correct percentages) */}
              <div className="mt-4 relative h-8 text-[10px] text-text-secondary/40 font-bold uppercase tracking-widest border-t border-glass-border/20 pt-4" id="chart-x-labels">
                {chartData.labels.map((lbl, idx) => {
                  const show = visibleLabelIndices.includes(idx);
                  if (!show) return null;

                  const ptX = pointsCount === 1
                    ? width / 2
                    : paddingX + (idx / (pointsCount - 1)) * (width - 2 * paddingX);
                  const leftPercent = (ptX / width) * 100;

                  let translateX = '-50%';
                  if (idx === 0) {
                    translateX = '0%';
                  } else if (idx === pointsCount - 1) {
                    translateX = '-100%';
                  }

                  return (
                    <span
                      key={idx}
                      className="absolute whitespace-nowrap"
                      style={{
                        left: `${leftPercent}%`,
                        transform: `translateX(${translateX})`
                      }}
                    >
                      {lbl}
                    </span>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Dynamic Tooltip on Hover positioned relative to the parent card */}
          {tooltipState.visible && (
            <div
              className="absolute bg-[#161c28]/95 border border-primary/20 p-2.5 rounded-xl shadow-2xl text-[10px] backdrop-blur-md pointer-events-none z-50 transition-all duration-100"
              style={{
                left: `${tooltipState.x}px`,
                top: `${tooltipState.y}px`,
                transform: `translate(${tooltipState.translateX}, ${tooltipState.translateY})`,
                marginTop: tooltipState.marginTop,
              }}
            >
              <p className="text-text-secondary/50 font-bold mb-0.5">{tooltipState.label}</p>
              <div className="flex flex-col gap-0.5">
                {showIncome && (
                  <span className="text-secondary font-bold">Income: {formatCurrency(tooltipState.income, 0)}</span>
                )}
                {showExpense && (
                  <span className="text-rose-expense font-bold">Expense: {formatCurrency(tooltipState.expense, 0)}</span>
                )}
                {showSavings && (
                  <span className="text-primary font-bold">Savings: {formatCurrency(tooltipState.savings, 0)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Burn Distribution (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-outfit font-bold text-lg text-text-primary">Burn Distribution</h3>
              <p class="text-xs text-text-secondary/50">Category-wise spend mix</p>
            </div>
            <span className="material-symbols-outlined text-text-secondary/50 text-base">info</span>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[220px]">
            {categoryBreakdown.length === 0 ? (
              <div className="text-text-secondary/40 text-xs text-center pt-8">No category expenses found.</div>
            ) : (
              categoryBreakdown.map((item, idx) => {
                const pct = Math.round((item.amount / maxCategoryAmount) * 100) || 0;
                return (
                  <div key={idx} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">shopping_bag</span>
                        <span className="text-xs font-semibold text-text-primary">{item.category}</span>
                      </div>
                      <span className="text-xs font-bold text-text-primary">
                        {formatCurrency(item.amount, 0)}
                        <span className="text-[10px] text-text-secondary/40 font-medium ml-1">{pct}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full progress-shine" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div class="mt-6 pt-4 border-t border-glass-border/20 flex justify-between text-xs px-1">
            <span class="text-text-secondary/60">Monthly Burn Total</span>
            <span class="text-text-primary font-bold">{formatCurrency(summary.burn_rate, 0)}</span>
          </div>
        </div>
      </div>

      {/* 3. Transaction Ledger Table */}
      <section className="glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 bg-white/5 border-b border-glass-border/20 flex items-center justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base text-text-primary">Performance Ledger</h3>
            <p class="text-xs text-text-secondary/40">Audit log entries of the current workspace</p>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
              <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span> Gains
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-expense uppercase">
              <span class="w-2 h-2 bg-rose-expense rounded-full"></span> Losses
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr class="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest border-b border-glass-border/20 bg-white/[0.01]">
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/10 text-xs">
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-text-secondary/40">No transactions recorded.</td>
                </tr>
              ) : (
                recentTxns.map((txn, idx) => {
                  const isInc = txn.type === 'income';
                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-all duration-200 cursor-pointer">
                      <td className="px-6 py-4 text-text-secondary/80 font-medium">{txn.date}</td>
                      <td className="px-6 py-4 font-bold text-text-primary">{txn.description || 'Transaction entry'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${isInc
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-rose-expense/10 text-rose-expense border-rose-expense/20'
                          }`}>
                          {txn.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-extrabold ${isInc ? 'text-primary' : 'text-rose-expense'}`}>
                        {isInc ? '+' : '-'}{formatCurrency(txn.amount, 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 🚪 Option A: Right Slide-out Glass Filter Drawer */}
      {drawerOpen && (
        <>
          {/* Semi-transparent blur backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 right-0 h-full w-[340px] bg-slate-surface/90 backdrop-blur-2xl border-l border-glass-border/40 shadow-2xl p-6 z-[1000] flex flex-col justify-between transition-transform duration-300 ease-out translate-x-0">

            {/* Drawer Header */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-glass-border/20 pb-4">
                <h4 className="font-outfit font-bold text-base text-text-primary">Filter Transactions</h4>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-text-secondary/50 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Controls List */}
              <div className="space-y-5">

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest font-body-bold">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border/60 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary/60"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Transaction Type Segment Controls */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest font-body-bold">Show Lines</label>
                  <div className="grid grid-cols-2 gap-1 bg-[#080e1a] p-1 rounded-xl border border-glass-border/40">
                    {[
                      { key: 'all',     label: 'All' },
                      { key: 'income',  label: 'Income' },
                      { key: 'expense', label: 'Expense' },
                      { key: 'savings', label: 'Savings' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setSelectedTxnType(t.key)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${
                          selectedTxnType === t.key
                            ? 'text-primary bg-primary/10'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Range Numeric Inputs */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest font-body-bold">Amount Range</label>
                  {/* Hint showing actual data range */}
                  {(() => {
                    const allPositive = [...chartData.income, ...chartData.expense].filter(v => v > 0);
                    const dataMin = allPositive.length > 0 ? Math.min(...allPositive) : 0;
                    return (
                      <p className="text-[9px] text-text-secondary/30 italic">
                        Chart range: {formatCurrency(dataMin, 0)} – {formatCurrency(maxVal, 0)}
                      </p>
                    );
                  })()}
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-[#080e1a] border border-glass-border/50 rounded-xl px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-secondary/20"
                    />
                    <span className="text-text-secondary/40 text-xs">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-[#080e1a] border border-glass-border/50 rounded-xl px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-secondary/20"
                    />
                  </div>
                </div>

                {/* Fine-Tuning Slider — sets Max Amount threshold */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest">
                    <span>Max Amount Threshold</span>
                    <span className="text-primary font-bold">{formatCurrency(sliderAmount, 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.ceil(maxVal)}
                    value={Math.min(sliderAmount, Math.ceil(maxVal))}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSliderAmount(val);
                      setMaxAmount(String(val));
                    }}
                    className="w-full accent-primary bg-white/5 h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-text-secondary/30">
                    <span>0</span>
                    <span>{formatCurrency(Math.ceil(maxVal), 0)}</span>
                  </div>
                  <p className="text-[9px] text-text-secondary/40 italic">Drag to set the upper bound on amounts shown in the chart.</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 border-t border-glass-border/20 pt-4">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-text-secondary rounded-xl text-xs font-bold transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-2.5 bg-primary text-obsidian-base hover:brightness-105 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Apply Filters</span>
              </button>
            </div>

          </aside>
        </>
      )}

    </div>
  );
}
