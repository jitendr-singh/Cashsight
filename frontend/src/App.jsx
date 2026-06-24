import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useCurrency } from './context/CurrencyContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import WealthGrowthChart from './components/WealthGrowthChart';
import SavingsGoals from './components/SavingsGoals';
import SpendMix from './components/SpendMix';
import RecentCommandLogs from './components/RecentCommandLogs';
import TransactionsManager from './components/TransactionsManager';
import AnalyticsTab from './components/AnalyticsTab';
import SmartSavingsAlert from './components/SmartSavingsAlert';
import SavingsTab from './components/SavingsTab';
import Investments from './components/Investments';
import ChatAssistant from './components/ChatAssistant';
import AICopilotPage from './components/AICopilotPage';
import QuickActionDock from './components/QuickActionDock';
import SettingsTab from './components/SettingsTab';
import AddTransactionModal from './components/AddTransactionModal';
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import { analyticsService, savingsService, transactionService } from './services/api';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  
  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard Data States
  const [summaryData, setSummaryData] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [spendMix, setSpendMix] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // SaaS Offline/Connection Reliability States
  const [isOffline, setIsOffline] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('cl_cache_timestamp'));

  // Legacy High-Fidelity Mockup Fallbacks for empty database states
  const mockSummary = {
    total_income: 125000.00,
    monthly_income: 125000.00,
    income_trend: 15.5,
    total_expense: 45000.00,
    total_savings: 320000.00,
    locked_savings: 200000.00,
    available_cash: 120000.00,
    savings_rate: 64.0,
    burn_rate: 45000.00,
    runway_months: 7.1,
    transaction_count: 6,
    this_month_txns: 6
  };

  const mockGoals = [
    {
      id: 1,
      title: 'Emergency Buffer',
      target_amount: 100000,
      saved_amount: 80000,
      monthly_contribution: 10000,
      icon: 'shield',
      is_completed: false,
      progress_percentage: 80.0,
      months_remaining: 2
    },
    {
      id: 2,
      title: 'Euro Trip 2026',
      target_amount: 150000,
      saved_amount: 90000,
      monthly_contribution: 15000,
      icon: 'flight_takeoff',
      is_completed: false,
      progress_percentage: 60.0,
      months_remaining: 4
    },
    {
      id: 3,
      title: 'Tech Upgrade',
      target_amount: 50000,
      saved_amount: 30000,
      monthly_contribution: 5000,
      icon: 'laptop_mac',
      is_completed: false,
      progress_percentage: 60.0,
      months_remaining: 4
    }
  ];

  const mockMix = {
    expense_by_category: [
      { category: 'Housing', amount: 18000.00 },
      { category: 'Food', amount: 12000.00 },
      { category: 'Transport', amount: 5000.00 },
      { category: 'Other', amount: 10000.00 }
    ],
    income_by_category: [
      { category: 'Salary', amount: 100000.00 },
      { category: 'Investment', amount: 25000.00 }
    ]
  };

  const mockRecent = [
    {
      id: '#TXN-9082-CS',
      amount: 100000.00,
      type: 'income',
      category: 'Salary',
      description: 'Monthly corporate salary',
      date: 'Jun 22, 10:00'
    },
    {
      id: '#TXN-8812-CS',
      amount: 25000.00,
      type: 'income',
      category: 'Investment',
      description: 'Dividend payout',
      date: 'Jun 21, 14:30'
    },
    {
      id: '#TXN-8745-CS',
      amount: 18000.00,
      type: 'expense',
      category: 'Housing',
      description: 'Apartment rent payout',
      date: 'Jun 18, 09:15'
    },
    {
      id: '#TXN-8630-CS',
      amount: 12000.00,
      type: 'expense',
      category: 'Food',
      description: 'Groceries & Dining',
      date: 'Jun 15, 20:00'
    },
    {
      id: '#TXN-8512-CS',
      amount: 5000.00,
      type: 'expense',
      category: 'Transport',
      description: 'Fuel & Commute',
      date: 'Jun 12, 11:30'
    },
    {
      id: '#TXN-8401-CS',
      amount: 10000.00,
      type: 'expense',
      category: 'Other',
      description: 'Weekend shopping & leisure',
      date: 'Jun 10, 16:45'
    }
  ];

  // Parallel Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setDataLoading(true);
    try {
      const [summary, goals, mix, recent] = await Promise.all([
        analyticsService.getSummary(),
        savingsService.getGoals(),
        analyticsService.getByCategory(),
        analyticsService.getRecentTransactions(),
      ]);

      const txns = recent?.recent_transactions || recent || [];
      if (!isDemoMode) {
        setSummaryData(summary || {
          total_income: 0.0,
          monthly_income: 0.0,
          income_trend: 0.0,
          total_expense: 0.0,
          total_savings: 0.0,
          locked_savings: 0.0,
          available_cash: 0.0,
          savings_rate: 0.0,
          burn_rate: 0.0,
          runway_months: 0.0,
          transaction_count: 0,
          this_month_txns: 0
        });
        setSavingsGoals(goals || []);
        setSpendMix(mix || { expense_by_category: [], income_by_category: [] });
        setRecentTransactions(txns);

        // Save successfully loaded data to cache
        localStorage.setItem('cl_cached_summary', JSON.stringify(summary));
        localStorage.setItem('cl_cached_goals', JSON.stringify(goals));
        localStorage.setItem('cl_cached_mix', JSON.stringify(mix));
        localStorage.setItem('cl_cached_recent', JSON.stringify(txns));
        const nowStr = new Date().toLocaleString();
        localStorage.setItem('cl_cache_timestamp', nowStr);
        setLastSyncTime(nowStr);

        setIsOffline(false);
        setConnectionError(false);
      }
    } catch (error) {
      console.error('Failed to sync dashboard data with FastAPI.', error);
      
      // Try to load cached data
      const cachedSummary = localStorage.getItem('cl_cached_summary');
      if (cachedSummary && !isDemoMode) {
        setSummaryData(JSON.parse(cachedSummary));
        setSavingsGoals(JSON.parse(localStorage.getItem('cl_cached_goals') || '[]'));
        setSpendMix(JSON.parse(localStorage.getItem('cl_cached_mix') || '{"expense_by_category":[],"income_by_category":[]}'));
        setRecentTransactions(JSON.parse(localStorage.getItem('cl_cached_recent') || '[]'));
        setIsOffline(true);
        setConnectionError(false);
      } else if (!isDemoMode) {
        // No cache exists, display fullscreen connection error page
        setConnectionError(true);
      }
    } finally {
      setDataLoading(false);
    }
  }, [isDemoMode]);

  const loadDemoData = () => {
    setIsDemoMode(true);
    setSummaryData(mockSummary);
    setSavingsGoals(mockGoals);
    setSpendMix(mockMix);
    setRecentTransactions(mockRecent);
  };

  const clearDemoData = () => {
    setIsDemoMode(false);
    fetchDashboardData(false);
  };

  const isDatabaseEmpty = !dataLoading && 
    (summaryData === null || 
     (summaryData.total_income === 0 && 
      summaryData.total_expense === 0 && 
      savingsGoals.length === 0 && 
      recentTransactions.length === 0));
  
  const handleCreateTransaction = async (txnData) => {
    try {
      await transactionService.createTransaction(txnData);
      fetchDashboardData(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Sync on Mount
  useEffect(() => {
    if (!authLoading && !isDemoMode) {
      if (user) {
        // Instantly load cache first to prevent blank screens
        const cachedSummary = localStorage.getItem('cl_cached_summary');
        if (cachedSummary) {
          setSummaryData(JSON.parse(cachedSummary));
          setSavingsGoals(JSON.parse(localStorage.getItem('cl_cached_goals') || '[]'));
          setSpendMix(JSON.parse(localStorage.getItem('cl_cached_mix') || '{"expense_by_category":[],"income_by_category":[]}'));
          setRecentTransactions(JSON.parse(localStorage.getItem('cl_cached_recent') || '[]'));
          setDataLoading(false);
          // Sync silently in background
          fetchDashboardData(true);
        } else {
          // No cache available, perform initial hard fetch
          fetchDashboardData(false);
        }
      } else {
        // Clear all dashboard data states when logged out
        setSummaryData(null);
        setSavingsGoals([]);
        setSpendMix(null);
        setRecentTransactions([]);
        setDataLoading(true);
        setIsOffline(false);
        setConnectionError(false);
      }
    }
  }, [authLoading, fetchDashboardData, isDemoMode, user]);

  // Silent auto-reconnector interval when offline/error
  useEffect(() => {
    let intervalId = null;
    if (user && (isOffline || connectionError)) {
      intervalId = setInterval(() => {
        console.log('[SaaS Auto-Reconnector] Attempting silent database sync...');
        fetchDashboardData(true);
      }, 15000); // Retry every 15 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isOffline, connectionError, fetchDashboardData]);

  // Executive Date Formatter
  const getExecutiveDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  };

  const { formatCurrency } = useCurrency();

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const today = new Date();
      return dateObj.getDate() === today.getDate() &&
             dateObj.getMonth() === today.getMonth() &&
             dateObj.getFullYear() === today.getFullYear();
    }
    try {
      const today = new Date();
      const todayMonthStr = today.toLocaleString('en-US', { month: 'short' });
      const todayDayStr = String(today.getDate());
      return dateStr.includes(todayMonthStr) && dateStr.includes(todayDayStr);
    } catch (err) {
      return false;
    }
  };

  const todaySpent = recentTransactions
    .filter(txn => txn.type === 'expense' && isToday(txn.date))
    .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);

  const totalBalance = summaryData?.total_savings ?? 0;
  const availableAmount = summaryData?.available_cash ?? totalBalance;


  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4 z-[999]">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-display-lg text-primary tracking-wider text-sm">LOADING WEALTH CONSOLE...</p>
      </div>
    );
  }

  // Redirect to Auth or Landing screen if not logged in
  if (!user) {
    if (showAuth) {
      return <AuthPage onBackToLanding={() => setShowAuth(false)} />;
    }
    return <LandingPage onEnterConsole={() => setShowAuth(true)} />;
  }

  // Fullscreen Offline Connection Screen (when server is down & no cached data is available)
  if (connectionError) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-6 z-[999] px-4 text-center select-none font-body-base">
        <div className="fixed inset-0 scanning-grid pointer-events-none z-0 opacity-40"></div>
        <div className="ambient-orb bg-rose-500/20 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative p-6 rounded-2xl bg-[#080e1a]/95 border border-glass-border/20 shadow-2xl z-10 flex flex-col items-center max-w-md w-full animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse mb-4">
            <span className="material-symbols-outlined text-[36px] font-bold">cloud_off</span>
          </div>
          
          <h2 className="font-outfit font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-[#cbd5e1] tracking-tight mb-2">
            Wealth Console Offline
          </h2>
          <p className="text-sm text-[#dde2f3] opacity-70 leading-relaxed mb-6">
            Unable to establish a secure database connection. Your cloud wealth command center will load automatically once connectivity is restored.
          </p>

          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">
              Retrying connection in background...
            </span>
          </div>

          <button
            onClick={() => fetchDashboardData(false)}
            className="w-full relative group overflow-hidden rounded-xl bg-primary text-[#080e1a] font-bold text-sm tracking-wide py-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(90,240,179,0.15)] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">sync</span>
            Retry Sync Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-body-base text-body-base bg-[#030712] text-[#dde2f3] min-h-screen relative overflow-x-hidden">
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 scanning-grid pointer-events-none z-0"></div>
      <div className="ambient-orb bg-primary w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] -top-32 sm:-top-64 -left-32 sm:-left-64 z-0"></div>
      <div className="ambient-orb bg-violet-accent w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bottom-0 right-0 z-0"></div>

      {/* Sidebar Panel */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Header Navigation */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        onSync={fetchDashboardData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOffline={isOffline}
      />

      {/* Main Console View */}
      <main className="lg:ml-[280px] pt-24 px-4 md:px-gutter-desktop pb-margin-page transition-all duration-300 relative z-10">
        
        {/* Offline Caching Snap Alert Banner */}
        {isOffline && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)] z-20 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-400 animate-pulse">
                signal_wifi_off
              </span>
              <p className="text-xs sm:text-sm text-rose-200 text-left">
                <span className="font-bold text-rose-300">Connection Interrupted.</span> Showing last synced snapshot from <span className="font-semibold">{lastSyncTime || 'last session'}</span>. Writes are temporarily disabled until connection is restored.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-rose-400 whitespace-nowrap">Reconnecting...</span>
            </div>
          </div>
        )}

        {/* Render Tab Views (Focus is primarily Dashboard) */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Header Title Section */}
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  <h2 
                    className="font-body-base text-3xl md:text-[38px] font-extrabold bg-gradient-to-b from-white to-[#cbd5e1] bg-clip-text text-transparent tracking-tight leading-none pb-1"
                    style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Wealth Command
                  </h2>
                </div>
                <p className="text-on-surface-variant text-xs md:text-sm mt-1.5 opacity-70">
                  {isDatabaseEmpty && !isDemoMode 
                    ? `Welcome back, ${user?.name || 'User'}! 👋 Get started by adding your first transaction.`
                    : `Welcome back, ${user?.name || 'User'}! 👋 Executive summary for ${getExecutiveDate()}`
                  }
                </p>
              </div>
              
              <div className="flex gap-3">
                {/* Today Spent Badge */}
                <div className="bg-surface-variant/20 px-3.5 py-1.5 rounded-lg border border-glass-border/30 flex items-center gap-2.5 cursor-default">
                  <div className="glow-point bg-rose-expense text-rose-expense animate-pulse flex-shrink-0"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60 leading-none mb-0.5">Today Spent</span>
                    <span className="text-xs font-bold text-rose-expense leading-none">
                      {formatCurrency(todaySpent)}
                    </span>
                  </div>
                </div>

                {/* Available to Spend Badge */}
                <div className="bg-surface-variant/20 px-3.5 py-1.5 rounded-lg border border-glass-border/30 flex items-center gap-2.5 cursor-default">
                  <div className="glow-point bg-primary text-primary animate-pulse flex-shrink-0"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60 leading-none mb-0.5">Available to Spend</span>
                    <span className="text-xs font-bold text-primary leading-none">
                      {formatCurrency(availableAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Demo Mode Status Banner */}
            {isDemoMode && (
              <div className="mb-6 p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-3 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-violet-400 animate-pulse">
                    info
                  </span>
                  <p className="text-sm text-violet-200">
                    <span className="font-semibold text-violet-300">Demo Mode is Active</span>. You are viewing high-fidelity mockup data to preview the dashboard.
                  </p>
                </div>
                <button
                  onClick={clearDemoData}
                  className="text-xs font-bold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-500 active:scale-95 px-4 py-2 rounded-lg transition-all border border-violet-400/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                >
                  Clear Demo Data
                </button>
              </div>
            )}

            {isDatabaseEmpty && !isDemoMode ? (
              <>
                {/* Bento Metrics Cards - ₹0.00 State */}
                <MetricsGrid summaryData={summaryData} setActiveTab={setActiveTab} />

                {/* Unified Onboarding Box */}
                <div className="midnight-glass p-8 md:p-12 rounded-2xl flex flex-col items-center text-center justify-center min-h-[400px] border border-glass-border/10 shadow-2xl relative overflow-hidden group mb-6">
                  {/* Glowing backdrop circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>

                  {/* Checklist SVG illustration */}
                  <div className="relative mb-6 p-4 rounded-2xl bg-white/3 border border-glass-border/20 shadow-inner group-hover:border-primary/30 transition-all duration-300">
                    <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <path d="M12 11h4" />
                      <path d="M12 16h4" />
                      <circle cx="8" cy="11" r="1.5" fill="currentColor" />
                      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                    </svg>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-b from-white to-[#cbd5e1] bg-clip-text text-transparent mb-3">
                    You don't have any data yet
                  </h3>
                  <p className="text-on-surface-variant text-sm max-w-md opacity-70 leading-relaxed mb-8">
                    Start tracking your income, expenses, and savings goals to unlock real-time financial intelligence. Your command center will automatically populate as logs are recorded.
                  </p>

                  <button
                    onClick={() => setShowAddTxnModal(true)}
                    className="relative group/btn overflow-hidden rounded-xl bg-primary text-[#080e1a] font-bold text-sm tracking-wide px-6 py-3.5 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(90,240,179,0.2)] hover:shadow-[0_4px_25px_rgba(90,240,179,0.3)] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined font-bold text-lg">add</span>
                    Add Your First Transaction
                  </button>
                </div>

                {/* Try with demo data banner */}
                <div className="midnight-glass p-6 md:p-8 rounded-xl border border-glass-border/10 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mt-0.5">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-white text-base mb-1">
                        Explore with Demo Data
                      </h4>
                      <p className="text-xs md:text-sm text-on-surface-variant opacity-75 max-w-xl">
                        Want to see how Capitallens looks with full activity? Load high-fidelity mockup data to preview savings goals, interactive expense breakdowns, and wealth charts instantly.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadDemoData}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-all border border-violet-400/20 shadow-[0_0_15px_rgba(139,92,246,0.15)] flex items-center gap-2 whitespace-nowrap active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Load Demo Data
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Smart Savings Alert Widget */}
                <SmartSavingsAlert
                  summaryData={summaryData}
                  goals={savingsGoals}
                  onRefresh={fetchDashboardData}
                />

                {/* Bento Metrics Cards */}
                <QuickActionDock
                  summaryData={summaryData}
                  goals={savingsGoals}
                  onAddTransaction={() => setShowAddTxnModal(true)}
                  onAddGoal={() => setActiveTab('savings')}
                  onOpenChat={() => setIsChatOpen(true)}
                  setActiveTab={setActiveTab}
                  isOffline={isOffline}
                />

                <MetricsGrid summaryData={summaryData} setActiveTab={setActiveTab} />

                {/* Trajectory Bar Charts */}
                <WealthGrowthChart summaryData={summaryData} />

                {/* Bottom Content Grid (Savings Goals & Spend Mix) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-gutter-desktop mb-8">
                  {/* Goals Hub (Span-5) */}
                  <SavingsGoals
                    goals={savingsGoals}
                    onRefresh={fetchDashboardData}
                    onViewAll={() => setActiveTab('savings')}
                  />

                  {/* Spend Mix & Breakdown (Span-7) */}
                  <SpendMix categoryData={spendMix} />
                </div>

                {/* Transaction Logs Footer Block */}
                <RecentCommandLogs
                  transactions={recentTransactions.filter(txn => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase().trim();
                    return (
                      txn.id.toString().toLowerCase().includes(query) ||
                      (txn.category || '').toLowerCase().includes(query) ||
                      (txn.description || '').toLowerCase().includes(query) ||
                      txn.amount.toString().includes(query) ||
                      (txn.type || '').toLowerCase().includes(query)
                    );
                  })}
                  onRefresh={fetchDashboardData}
                />
              </>
            )}
          </>
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab 
            searchQuery={searchQuery} 
            initialSummary={summaryData}
            initialSpendMix={spendMix}
            initialRecentTransactions={recentTransactions}
            onRefresh={fetchDashboardData}
          />
        ) : activeTab === 'transactions' ? (
          <TransactionsManager 
            searchQuery={searchQuery} 
            initialSummary={summaryData}
          />
        ) : activeTab === 'savings' ? (
          <SavingsTab goals={savingsGoals} onRefresh={fetchDashboardData} searchQuery={searchQuery} />
        ) : activeTab === 'investments' ? (
          <Investments searchQuery={searchQuery} />
        ) : activeTab === 'ai_copilot' ? (
          <AICopilotPage />
        ) : activeTab === 'settings' ? (
          <SettingsTab />
        ) : (
          /* Placeholder for other tab actions */
          <div className="midnight-glass p-8 rounded-xl text-center min-h-[300px] flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-primary text-[48px] animate-pulse">
              construction
            </span>
            <h3 className="font-headline-md text-xl text-text-primary capitalize">{activeTab} Workstation</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">
              Your backend database supports this component's schema. This widget is set to release soon in subsequent updates.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              Return to Command Center
            </button>
          </div>
        )}
      </main>
      {activeTab !== 'ai_copilot' && (
        <ChatAssistant
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
        />
      )}

      {/* Root level transaction modal */}
      <AddTransactionModal
        isOpen={showAddTxnModal}
        onClose={() => setShowAddTxnModal(false)}
        onSubmit={handleCreateTransaction}
      />
    </div>
  );
}
