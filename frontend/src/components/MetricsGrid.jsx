import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

// Standard lightweight SVG Sparkline component
function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const width = 64;
  const height = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const pathData = data.reduce((acc, val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - 2 - ((val - min) / range) * (height - 4);
    return acc + `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  const fillPathData = `${pathData} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sparkline-grad-${color.replace('#', '').replace('(', '').replace(')', '').replace(',', '')}`;

  return (
    <svg width={width} height={height} className="opacity-70 group-hover:opacity-100 transition-opacity overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={fillPathData}
        fill={`url(#${gradId})`}
        stroke="none"
      />
    </svg>
  );
}

export default function MetricsGrid({ summaryData, setActiveTab }) {
  const { formatCurrency } = useCurrency();
  
  const totalBalance = summaryData?.total_savings ?? 1248592;
  const monthlyIncome = summaryData?.monthly_income ?? 1261042;
  const monthlyExpenses = summaryData?.total_expense ?? 12450;
  const transactionCount = summaryData?.transaction_count ?? 142;

  const lockedAmount = summaryData?.locked_savings ?? 0;
  const availableAmount = summaryData?.available_cash ?? totalBalance;

  // Generate responsive trend histories that terminate on the active values
  const balanceHistory = [
    totalBalance * 0.97,
    totalBalance * 0.975,
    totalBalance * 0.972,
    totalBalance * 0.985,
    totalBalance * 0.99,
    totalBalance
  ];
  const incomeHistory = [
    monthlyIncome * 0.90,
    monthlyIncome * 0.92,
    monthlyIncome * 0.94,
    monthlyIncome * 0.96,
    monthlyIncome * 0.98,
    monthlyIncome
  ];
  const expenseHistory = [
    monthlyExpenses * 1.15,
    monthlyExpenses * 1.05,
    monthlyExpenses * 1.10,
    monthlyExpenses * 0.98,
    monthlyExpenses * 1.02,
    monthlyExpenses
  ];
  const entriesHistory = [
    Math.max(0, transactionCount - 30),
    Math.max(0, transactionCount - 25),
    Math.max(0, transactionCount - 18),
    Math.max(0, transactionCount - 12),
    Math.max(0, transactionCount - 5),
    transactionCount
  ];

  // Locked vs Available Calculations
  const totalForBar = lockedAmount + availableAmount === 0 ? 1 : lockedAmount + availableAmount;
  const lockedPct = Math.min(100, Math.max(0, (lockedAmount / totalForBar) * 100));
  const availablePct = 100 - lockedPct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Metric 1: Total Balance */}
      <div 
        role="button"
        onClick={() => setActiveTab && setActiveTab('investments')}
        className="glass-card p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_0_15px_rgba(90,240,179,0.12)] transition-all duration-300 border border-white/[0.04]"
      >
        {/* Top glowing bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
        {/* Ambient Background Glow */}
        <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-primary/3 blur-2xl group-hover:bg-primary/10 group-hover:scale-125 transition-all duration-500"></div>
        
        <div className="flex items-center justify-between h-full relative z-10">
          {/* Left Block */}
          <div className="flex flex-col text-left justify-between h-full flex-1 pr-2">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-outfit">
              <span className="material-symbols-outlined text-[13px] text-primary">account_balance</span>
              Balance
            </span>
            <span className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight font-outfit">
              {formatCurrency(totalBalance)}
            </span>
            
            {/* Visual Bar Breakdown */}
            <div className="mt-2.5 w-full max-w-[140px]">
              <div className="h-[3px] w-full rounded-full bg-surface-variant/20 overflow-hidden flex">
                <div className="h-full bg-violet-accent" style={{ width: `${lockedPct}%` }} title={`Locked: ${lockedPct.toFixed(0)}%`}></div>
                <div className="h-full bg-primary" style={{ width: `${availablePct}%` }} title={`Available: ${availablePct.toFixed(0)}%`}></div>
              </div>
              <div className="flex items-center justify-between text-[8px] text-on-surface-variant/50 font-bold mt-1">
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-violet-accent"></span>
                  Locked: {formatCurrency(lockedAmount, 0)}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-primary"></span>
                  Avail: {formatCurrency(availableAmount, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Block */}
          <div className="flex flex-col items-end justify-between h-full min-w-[70px] select-none">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider mb-3">
              Secure
            </span>
            <Sparkline data={balanceHistory} color="#5af0b3" />
          </div>
        </div>
      </div>

      {/* Metric 2: Monthly Income */}
      <div 
        role="button"
        onClick={() => setActiveTab && setActiveTab('analytics')}
        className="glass-card p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:border-secondary/45 hover:shadow-[0_0_15px_rgba(93,230,255,0.12)] transition-all duration-300 border border-white/[0.04]"
      >
        {/* Top glowing bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-secondary to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
        {/* Ambient Background Glow */}
        <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-secondary/3 blur-2xl group-hover:bg-secondary/10 group-hover:scale-125 transition-all duration-500"></div>

        <div className="flex items-center justify-between h-full relative z-10">
          {/* Left Block */}
          <div className="flex flex-col text-left justify-between h-full flex-1 pr-2">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-outfit">
              <span className="material-symbols-outlined text-[13px] text-secondary">trending_up</span>
              Income
            </span>
            <span className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight font-outfit">
              {formatCurrency(monthlyIncome)}
            </span>
            <span className="text-[9px] text-on-surface-variant/50 font-normal mt-2.5">
              Active cash inflows
            </span>
          </div>

          {/* Right Block */}
          <div className="flex flex-col items-end justify-between h-full min-w-[70px] select-none">
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-3">
              <span className="material-symbols-outlined text-[11px] -ml-0.5">arrow_drop_up</span>
              {Math.abs(summaryData?.income_trend ?? 12.4)}%
            </span>
            <Sparkline data={incomeHistory} color="#5de6ff" />
          </div>
        </div>
      </div>

      {/* Metric 3: Monthly Expenses */}
      <div 
        role="button"
        onClick={() => setActiveTab && setActiveTab('analytics')}
        className="glass-card p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:border-rose-expense/45 hover:shadow-[0_0_15px_rgba(251,113,133,0.12)] transition-all duration-300 border border-white/[0.04]"
      >
        {/* Top glowing bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-expense to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
        {/* Ambient Background Glow */}
        <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-rose-expense/3 blur-2xl group-hover:bg-rose-expense/10 group-hover:scale-125 transition-all duration-500"></div>

        <div className="flex items-center justify-between h-full relative z-10">
          {/* Left Block */}
          <div className="flex flex-col text-left justify-between h-full flex-1 pr-2">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-outfit">
              <span className="material-symbols-outlined text-[13px] text-rose-expense">payments</span>
              Expenses
            </span>
            <span className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight font-outfit">
              {formatCurrency(monthlyExpenses)}
            </span>
            <span className="text-[9px] text-on-surface-variant/50 font-normal mt-2.5">
              Outgoing cash flow
            </span>
          </div>

          {/* Right Block */}
          <div className="flex flex-col items-end justify-between h-full min-w-[70px] select-none">
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-expense/10 border border-rose-expense/20 text-rose-expense mb-3">
              <span className="material-symbols-outlined text-[11px] -ml-0.5">arrow_drop_down</span>
              2.1%
            </span>
            <Sparkline data={expenseHistory} color="#fb7185" />
          </div>
        </div>
      </div>

      {/* Metric 4: Total Entries */}
      <div 
        role="button"
        onClick={() => setActiveTab && setActiveTab('transactions')}
        className="glass-card p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:border-violet-accent/45 hover:shadow-[0_0_15px_rgba(167,139,250,0.12)] transition-all duration-300 border border-white/[0.04]"
      >
        {/* Top glowing bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-accent to-transparent opacity-75 group-hover:opacity-100 transition-opacity"></div>
        {/* Ambient Background Glow */}
        <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-violet-accent/3 blur-2xl group-hover:bg-violet-accent/10 group-hover:scale-125 transition-all duration-500"></div>

        <div className="flex items-center justify-between h-full relative z-10">
          {/* Left Block */}
          <div className="flex flex-col text-left justify-between h-full flex-1 pr-2">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-outfit">
              <span className="material-symbols-outlined text-[13px] text-violet-accent">receipt_long</span>
              Entries
            </span>
            <span className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight font-outfit">
              {transactionCount}
            </span>
            <span className="text-[9px] text-on-surface-variant/50 font-normal mt-2.5">
              Ledger transactions
            </span>
          </div>

          {/* Right Block */}
          <div className="flex flex-col items-end justify-between h-full min-w-[70px] select-none">
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-accent/10 border border-violet-accent/20 text-violet-accent mb-3">
              <span className="material-symbols-outlined text-[11px] animate-pulse -ml-0.5">bolt</span>
              +15
            </span>
            <Sparkline data={entriesHistory} color="#a78bfa" />
          </div>
        </div>
      </div>

    </div>
  );
}
