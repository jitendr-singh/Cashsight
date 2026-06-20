import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function QuickActionDock({ summaryData, goals, onAddTransaction, onAddGoal, onOpenChat, setActiveTab }) {
  const { formatCurrency } = useCurrency();

  // Get data parameters with safe fallbacks
  const income = summaryData?.monthly_income ?? 1261042;
  const expense = summaryData?.total_expense ?? 12450;
  const runway = summaryData?.runway_months ?? 99.3; // months of runway
  const savingsRate = summaryData?.savings_rate ?? 99.0;

  // Compute average savings goals progress
  const activeGoals = goals && goals.length > 0 ? goals : [];
  const avgProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.progress_percentage ?? 0), 0) / activeGoals.length
    : 0;

  // Dynamic Financial Health Score calculations
  const expenseRatio = income > 0 ? expense / income : 0.2;
  const expenseScore = Math.max(0, Math.min(50, (1 - expenseRatio) * 50));
  const runwayScore = Math.max(0, Math.min(35, (Math.min(12, runway) / 12) * 35));
  const goalsScore = Math.max(0, Math.min(15, (avgProgress / 100) * 15));
  const rawScore = expenseScore + runwayScore + goalsScore;
  const healthScore = Math.min(100, Math.max(0, Math.round(rawScore || 75)));

  // Determine Rating and styling colors
  let ratingLabel = 'Caution';
  let ratingColor = 'text-rose-expense';
  let ratingBg = 'bg-rose-expense/10';
  let ratingBorder = 'border-rose-expense/20';
  let ratingGlow = 'rgba(251, 113, 133, 0.3)';
  let ratingStroke = '#fb7185';

  if (healthScore >= 80) {
    ratingLabel = 'Excellent';
    ratingColor = 'text-primary';
    ratingBg = 'bg-primary/10';
    ratingBorder = 'border-primary/20';
    ratingGlow = 'rgba(90, 240, 179, 0.3)';
    ratingStroke = '#5af0b3';
  } else if (healthScore >= 60) {
    ratingLabel = 'Stable';
    ratingColor = 'text-secondary';
    ratingBg = 'bg-secondary/10';
    ratingBorder = 'border-secondary/20';
    ratingGlow = 'rgba(47, 217, 244, 0.3)';
    ratingStroke = '#2fd9f4';
  }

  // Calculate SVG circular stroke properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.19
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Provide contextual short advice
  const getInsightText = () => {
    if (healthScore >= 80) {
      return `Your expense ratio is very low (${(expenseRatio * 100).toFixed(0)}%). Your emergency fund covers ${Math.min(12, runway).toFixed(0)}+ months of expenses.`;
    }
    if (healthScore >= 60) {
      return `Your budget is in a stable range. Consider boosting your active savings goals to increase your score.`;
    }
    return `Warning: High expense ratio detected (${(expenseRatio * 100).toFixed(0)}%). Rebalance your savings or log transactions to clean up.`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 stagger-in relative z-10">
      
      {/* Visual Health Gauge Centerpiece (Span 7) */}
      <div className="lg:col-span-7 midnight-glass border border-glass-border/30 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 cursor-default">
        {/* SVG Circular Dial */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              className="text-surface-variant/20"
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
            />
            {/* Health Score Progress ring */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              stroke={ratingStroke}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${ratingGlow})`,
                transition: 'stroke-dashoffset 0.8s ease-in-out'
              }}
            />
          </svg>
          {/* Centered number overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-stat-lg text-text-primary font-bold">{healthScore}</span>
            <span className="text-[8px] text-on-surface-variant/60 font-bold uppercase tracking-wider">Health</span>
          </div>
        </div>

        {/* Dynamic Insight block */}
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h4 className="font-headline-md text-sm md:text-base text-text-primary font-bold">Financial Health Score</h4>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ratingBg} ${ratingColor} ${ratingBorder} border`}>
              {ratingLabel}
            </span>
          </div>
          <p className="text-on-surface-variant text-xs leading-relaxed max-w-md">
            {getInsightText()}
          </p>
          <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-[10px] text-on-surface-variant/75 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-accent"></span>
              Goals: {avgProgress.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Runway: {runway.toFixed(1)} mo
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Commands Dock (Span 5) */}
      <div className="lg:col-span-5 midnight-glass border border-glass-border/30 rounded-xl p-5 flex flex-col justify-between">
        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest font-outfit mb-3 block text-left">
          Quick Controls
        </span>

        {/* Buttons grid */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {/* Action 1: Log Transaction */}
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/45 rounded-lg text-primary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold cursor-pointer text-left h-[42px]"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Log Entry
          </button>

          {/* Action 2: Goal Milestone */}
          <button
            onClick={onAddGoal}
            className="flex items-center gap-2 px-3 py-2 bg-violet-accent/10 hover:bg-violet-accent/20 border border-violet-accent/20 hover:border-violet-accent/45 rounded-lg text-violet-accent hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold cursor-pointer text-left h-[42px]"
          >
            <span className="material-symbols-outlined text-[16px]">emoji_events</span>
            New Goal
          </button>

          {/* Action 3: Wealth Suggestions */}
          <button
            onClick={() => setActiveTab('investments')}
            className="flex items-center gap-2 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 hover:border-secondary/45 rounded-lg text-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold cursor-pointer text-left h-[42px]"
          >
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            Investments
          </button>

          {/* Action 4: Ask Advisor */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-2 bg-on-surface-variant/10 hover:bg-on-surface-variant/25 border border-glass-border/40 hover:border-primary/30 rounded-lg text-text-primary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold cursor-pointer text-left h-[42px]"
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            Ask Advisor
          </button>
        </div>
      </div>

    </div>
  );
}
