import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
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
import { analyticsService, savingsService } from './services/api';

export default function App() {
  const { loading: authLoading } = useAuth();
  
  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard Data States
  const [summaryData, setSummaryData] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [spendMix, setSpendMix] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Legacy High-Fidelity Mockup Fallbacks for empty database states
  const mockSummary = {
    total_income: 1261042.00,
    monthly_income: 1261042.00,
    income_trend: 12.4,
    total_expense: 12450.00,
    total_savings: 1248592.00,
    savings_rate: 99.0,
    burn_rate: 12450.00,
    runway_months: 99.3
  };

  const mockGoals = [
    {
      id: 1,
      title: "Euro Summer '25",
      target_amount: 10000,
      saved_amount: 7200,
      monthly_contribution: 500,
      icon: 'flight_takeoff',
      is_completed: false,
      progress_percentage: 72.0,
      months_remaining: 12
    },
    {
      id: 2,
      title: 'Property Depot',
      target_amount: 100000,
      saved_amount: 45000,
      monthly_contribution: 2500,
      icon: 'home',
      is_completed: false,
      progress_percentage: 45.0,
      months_remaining: 18
    },
    {
      id: 3,
      title: 'Retirement Fund',
      target_amount: 500000,
      saved_amount: 455000,
      monthly_contribution: 5000,
      icon: 'rocket_launch',
      is_completed: false,
      progress_percentage: 91.0,
      months_remaining: 240
    }
  ];

  const mockMix = {
    expense_by_category: [
      { category: 'Housing', amount: 4980.00 },
      { category: 'Food', amount: 3112.50 },
      { category: 'Transport', amount: 1245.00 },
      { category: 'Other', amount: 3112.50 }
    ],
    income_by_category: [
      { category: 'Investment', amount: 12000.00 },
      { category: 'Salary', amount: 8000.00 }
    ]
  };

  const mockRecent = [
    {
      id: '#TXN-9082-CS',
      amount: 12450.00,
      type: 'income',
      category: 'Tech Equity Index',
      description: 'Executed trade',
      date: 'Oct 24, 14:02'
    },
    {
      id: '#TXN-8812-CS',
      amount: 1200.00,
      type: 'expense',
      category: 'Digital Collectible A',
      description: 'Pending mint purchase',
      date: 'Oct 24, 11:30'
    },
    {
      id: '#TXN-8745-CS',
      amount: 5000.00,
      type: 'income',
      category: 'Liquid Cash Reserve',
      description: 'Recurring auto transfer',
      date: 'Oct 23, 16:45'
    }
  ];

  // Parallel Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [summary, goals, mix, recent] = await Promise.all([
        analyticsService.getSummary(),
        savingsService.getGoals(),
        analyticsService.getByCategory(),
        analyticsService.getRecentTransactions(),
      ]);

      const txns = recent?.recent_transactions || recent || [];
      const hasRealGoals = goals && goals.length > 0;
      const hasRealTxns = txns && txns.length > 0;
      const hasRealSummary = summary && (summary.total_income > 0 || summary.total_expense > 0);

      // If the database is completely empty (no goals, no transactions, and 0 summary values)
      if (!hasRealGoals && !hasRealTxns && !hasRealSummary) {
        setSummaryData(mockSummary);
        setSavingsGoals(mockGoals);
        setSpendMix(mockMix);
        setRecentTransactions(mockRecent);
      } else {
        // Integrate dynamically: use real records, merge if partially populated
        setSummaryData(hasRealSummary ? summary : mockSummary);
        setSavingsGoals(hasRealGoals ? goals : mockGoals);
        setSpendMix(mix && mix.expense_by_category?.length > 0 ? mix : mockMix);
        setRecentTransactions(hasRealTxns ? txns : mockRecent);
      }
    } catch (error) {
      console.error('Failed to sync dashboard data with FastAPI.', error);
      // Fail-safe fallbacks
      setSummaryData(mockSummary);
      setSavingsGoals(mockGoals);
      setSpendMix(mockMix);
      setRecentTransactions(mockRecent);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Sync on Mount
  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  // Executive Date Formatter
  const getExecutiveDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4 z-[999]">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-display-lg text-primary tracking-wider text-sm">LOADING WEALTH CONSOLE...</p>
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
      />

      {/* Main Console View */}
      <main className="lg:ml-[280px] pt-24 px-4 md:px-gutter-desktop pb-margin-page transition-all duration-300 relative z-10">
        
        {/* Render Tab Views (Focus is primarily Dashboard) */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Header Title Section */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="font-display-lg text-4xl md:text-5xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter leading-none mb-2 font-bold">
                  Wealth Command
                </h2>
                <p className="text-on-surface-variant text-sm md:text-base opacity-80">
                  Executive summary for {getExecutiveDate()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="bg-surface-variant/30 px-3 py-1 rounded border border-glass-border text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                  System Online
                </span>
                <span className="hidden sm:inline-block bg-surface-variant/30 px-3 py-1 rounded border border-glass-border text-[10px] font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                  Grid: Active
                </span>
              </div>
            </header>

            {/* Smart Savings Alert Widget */}
            <SmartSavingsAlert
              summaryData={summaryData}
              goals={savingsGoals}
              onRefresh={fetchDashboardData}
            />

            {/* Bento Metrics Cards */}
            <MetricsGrid summaryData={summaryData} />

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
              transactions={recentTransactions}
              onRefresh={fetchDashboardData}
            />
          </>
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab />
        ) : activeTab === 'transactions' ? (
          <TransactionsManager />
        ) : activeTab === 'savings' ? (
          <SavingsTab goals={savingsGoals} onRefresh={fetchDashboardData} />
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
    </div>
  );
}
