import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { savingsService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export default function SavingsTab({ goals, onRefresh, searchQuery }) {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [icon, setIcon] = useState('🎯');

  // Load contributions logs history
  const loadLogsHistory = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const contributions = await savingsService.getContributions();
      setLogs(contributions || []);
    } catch (err) {
      console.error('Failed to load contributions history', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogsHistory();
  }, [loadLogsHistory, goals]);

  // Aggregated Summary Math
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.is_completed).length;
  const activeGoals = goals.filter(g => !g.is_completed).length;
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.saved_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Actions handlers
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    try {
      await savingsService.createGoal({
        title,
        target_amount: parseFloat(targetAmount),
        saved_amount: parseFloat(savedAmount || '0'),
        monthly_contribution: parseFloat(monthlyContribution || '0'),
        icon
      });
      setShowAddModal(false);
      setTitle('');
      setTargetAmount('');
      setSavedAmount('0');
      setMonthlyContribution('');
      setIcon('🎯');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to create savings goal', err);
    }
  };

  const handleFundGoal = async (e) => {
    e.preventDefault();
    if (!selectedGoal || !fundAmount) return;

    try {
      await savingsService.addMoney(selectedGoal.id, parseFloat(fundAmount));
      setShowFundModal(false);
      setFundAmount('');
      setSelectedGoal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to add money', err);
    }
  };

  const handleWithdrawGoal = async (e) => {
    e.preventDefault();
    if (!selectedGoal || !withdrawAmount) return;

    try {
      await savingsService.withdrawMoney(selectedGoal.id, parseFloat(withdrawAmount));
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSelectedGoal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to withdraw money', err);
    }
  };

  const handleDeleteGoal = async (goalId, goalTitle) => {
    if (!window.confirm(`Are you sure you want to delete the goal "${goalTitle}"?`)) return;

    try {
      await savingsService.deleteGoal(goalId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  // Helper styles based on index
  const getIconStyles = (index) => {
    const styles = [
      { bg: 'bg-violet-accent/10', border: 'border-violet-accent/20', text: 'text-violet-accent', bar: 'from-violet-accent to-primary' },
      { bg: 'bg-secondary/10', border: 'border-secondary/20', text: 'text-secondary', bar: 'from-secondary to-emerald-glow' },
      { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', bar: 'from-primary to-emerald-glow' }
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="space-y-8 p-gutter-mobile md:p-margin-page relative z-10">
      
      {/* Tab Header Title */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="font-display-lg text-4xl md:text-5xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter leading-none mb-2 font-bold font-outfit">
            Savings Goals
          </h2>
          <p className="text-on-surface-variant text-sm md:text-base opacity-80">
            Track your progress toward financial milestones
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Create New Goal</span>
        </button>
      </header>

      {/* 1. Overall Savings Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter-desktop">
        {/* Card 1: Total Saved */}
        <div className="midnight-glass p-6 rounded-xl relative overflow-hidden group min-h-[140px] cursor-default">
          <div className="absolute top-4 right-4 text-primary glow-point"></div>
          <div className="flex flex-col h-full">
            <span className="text-label-caps text-on-surface-variant mb-4 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">savings</span>
              TOTAL SAVED IN GOALS
            </span>
            <span className="font-stat-lg text-2xl md:text-stat-lg text-primary font-bold">
              {formatCurrency(totalSaved)}
            </span>
            <div className="mt-auto text-xs text-on-surface-variant">
              Accumulated wealth locked in goals
            </div>
          </div>
        </div>

        {/* Card 2: Total Target */}
        <div className="midnight-glass p-6 rounded-xl relative overflow-hidden group min-h-[140px] cursor-default">
          <div className="absolute top-4 right-4 text-secondary glow-point" style={{ color: '#5de6ff' }}></div>
          <div className="flex flex-col h-full">
            <span className="text-label-caps text-on-surface-variant mb-4 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">track_changes</span>
              TOTAL TARGET PLAN
            </span>
            <span className="font-stat-lg text-2xl md:text-stat-lg text-text-primary">
              {formatCurrency(totalTarget)}
            </span>
            <div className="mt-auto text-xs text-on-surface-variant">
              Combined milestone goals sum
            </div>
          </div>
        </div>

        {/* Card 3: Goals breakdown */}
        <div className="midnight-glass p-6 rounded-xl relative overflow-hidden group min-h-[140px] cursor-default">
          <div className="absolute top-4 right-4 text-rose-expense glow-point" style={{ color: '#fb7185' }}></div>
          <div className="flex flex-col h-full">
            <span className="text-label-caps text-on-surface-variant mb-4 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">star</span>
              ACTIVE VS COMPLETED
            </span>
            <span className="font-stat-lg text-2xl md:text-stat-lg text-text-primary">
              {activeGoals} <span className="text-xs text-text-secondary/40 font-normal">Active</span> / {completedGoals} <span className="text-xs text-primary font-normal">Done</span>
            </span>
            <div className="mt-auto text-xs text-on-surface-variant">
              Overall tasks allocation split
            </div>
          </div>
        </div>

        {/* Card 4: Overall Progress */}
        <div className="midnight-glass p-6 rounded-xl relative overflow-hidden group min-h-[140px] cursor-default">
          <div className="absolute top-4 right-4 text-emerald-glow glow-point" style={{ color: '#68fcbf' }}></div>
          <div className="flex flex-col h-full">
            <span className="text-label-caps text-on-surface-variant mb-4 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">donut_large</span>
              OVERALL SAVINGS PROGRESS
            </span>
            <span className="font-stat-lg text-2xl md:text-stat-lg text-emerald-glow font-bold">
              {overallProgress}%
            </span>
            <div className="mt-auto text-xs text-on-surface-variant">
              Consolidated target achieved rate
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.filter(goal => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase().trim();
          return (
            goal.title.toLowerCase().includes(query) ||
            (goal.category || '').toLowerCase().includes(query) ||
            (goal.target_amount ? goal.target_amount.toString().includes(query) : false) ||
            (goal.icon || '').toLowerCase().includes(query)
          );
        }).map((goal, index) => {
          const styling = getIconStyles(index);
          const pct = goal.progress_percentage ?? 0;

          return (
            <div
              key={goal.id || index}
              className="midnight-glass p-6 rounded-xl border border-glass-border hover:border-primary/20 transition-all duration-300 relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${styling.bg} flex items-center justify-center border ${styling.border}`}>
                      <span className="material-symbols-outlined text-[20px] text-text-primary">
                        {goal.icon || 'savings'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-body-bold text-[15px] font-semibold text-text-primary tracking-tight">
                        {goal.title}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                        {goal.is_completed ? '🎉 Goal Completed' : '🎯 In Progress'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    className="p-1 rounded text-on-surface-variant hover:text-rose-expense opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent"
                    aria-label="Delete Goal"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <div className="space-y-3 mb-6 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Current Saved</span>
                    <span className="text-text-primary font-bold">{formatCurrency(goal.saved_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Target Amount</span>
                    <span className="text-text-primary font-semibold">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Monthly Plan</span>
                    <span className="text-text-primary font-semibold">{formatCurrency(goal.monthly_contribution)}/mo</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Progress Bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant/30 rounded-full overflow-hidden border border-glass-border">
                    <div
                      className={`h-full bg-gradient-to-r ${styling.bar} relative transition-all duration-1000`}
                      style={{ width: `${pct}%` }}
                    >
                      {index % 3 === 0 && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations Actions row */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowFundModal(true);
                    }}
                    className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold rounded-lg transition-all"
                  >
                    Add Money
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowWithdrawModal(true);
                    }}
                    className="flex-1 py-2 bg-rose-expense/10 text-rose-expense border border-rose-expense/20 hover:bg-rose-expense/20 text-xs font-bold rounded-lg transition-all"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full midnight-glass p-8 text-center text-on-surface-variant opacity-60 text-sm">
            No active savings milestones found. Click "Create New Goal" to start planning!
          </div>
        )}
      </section>

      {/* 3. Contributions Logs Ledger Table */}
      <section className="glass-card rounded-xl overflow-hidden hover:scale-[1.002] duration-300">
        <div className="px-6 py-4 border-b border-glass-border/30 bg-surface-container-high/30">
          <h3 className="font-outfit font-bold text-sm text-text-primary text-left uppercase tracking-wider">
            Savings Contribution Ledger
          </h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-glass-border">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-high/50 text-label-caps text-on-surface-variant border-b border-glass-border text-xs tracking-wider">
                <th className="px-6 py-4 font-bold font-label-caps">Date & Time</th>
                <th className="px-6 py-4 font-bold font-label-caps">Description</th>
                <th className="px-6 py-4 font-bold font-label-caps">Goal Target</th>
                <th className="px-6 py-4 font-bold font-label-caps text-right">Amount</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-glass-border">
              {logs.filter(log => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase().trim();
                return (
                  log.goal_title.toLowerCase().includes(query) ||
                  (log.amount ? log.amount.toString().includes(query) : false)
                );
              }).map((log) => {
                const isDeposit = log.amount > 0;
                return (
                  <tr key={log.id} className="hover:bg-surface-variant/20 transition-colors">
                    <td className="px-6 py-3.5 text-on-surface-variant text-xs font-semibold">
                      {log.created_at}
                    </td>
                    <td className="px-6 py-3.5 text-text-primary text-sm font-semibold">
                      {isDeposit ? 'Deposit Allocation' : 'Rebalance Withdrawal'}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary text-sm">
                      🎯 {log.goal_title}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-bold text-sm ${isDeposit ? 'text-primary' : 'text-rose-expense'}`}>
                      {isDeposit ? '+' : ''}{formatCurrency(log.amount)}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-on-surface-variant opacity-60 text-sm">
                    {loadingLogs ? 'Loading ledger entries...' : 'No historical logs recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- ADD MONEY MODAL --- */}
      {showFundModal && selectedGoal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
          <div className="bg-surface-container border border-primary/30 rounded-xl p-6 w-full max-w-sm shadow-2xl midnight-glass transform scale-100 transition-all duration-300">
            <h4 className="font-headline-md text-[18px] text-text-primary mb-4 flex items-center justify-between font-bold">
              Fund Savings Goal
              <button
                onClick={() => {
                  setShowFundModal(false);
                  setSelectedGoal(null);
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-rose-expense cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </h4>
            <p className="text-sm text-on-surface-variant mb-4 text-left">
              Allocate savings to <strong className="text-primary">{selectedGoal.title}</strong> (Target: {formatCurrency(selectedGoal.target_amount, 0)})
            </p>
            <form onSubmit={handleFundGoal} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-on-surface-variant mb-1">CONTRIBUTION AMOUNT ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all text-sm"
              >
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- WITHDRAW MONEY MODAL --- */}
      {showWithdrawModal && selectedGoal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
          <div className="bg-surface-container border border-primary/30 rounded-xl p-6 w-full max-w-sm shadow-2xl midnight-glass transform scale-100 transition-all duration-300">
            <h4 className="font-headline-md text-[18px] text-text-primary mb-4 flex items-center justify-between font-bold">
              Withdraw From Goal
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setSelectedGoal(null);
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-rose-expense cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </h4>
            <p className="text-sm text-on-surface-variant mb-4 text-left">
              Withdraw funds from <strong className="text-rose-expense">{selectedGoal.title}</strong> (Currently Saved: {formatCurrency(selectedGoal.saved_amount)})
            </p>
            <form onSubmit={handleWithdrawGoal} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-on-surface-variant mb-1">WITHDRAWAL AMOUNT ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-expense text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm shadow-[0_0_15px_rgba(251,113,133,0.3)]"
              >
                Confirm Withdrawal
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- CREATE GOAL MODAL --- */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
          <div className="bg-surface-container border border-primary/30 rounded-xl p-6 w-full max-w-md shadow-2xl midnight-glass transform scale-100 transition-all duration-300">
            <h4 className="font-headline-md text-[18px] text-text-primary mb-4 flex items-center justify-between font-bold">
              Create New Goal
              <button
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-rose-expense cursor-pointer border-none bg-transparent"
              >
                close
              </button>
            </h4>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-on-surface-variant mb-1">GOAL TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Property Depot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">TARGET ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">INITIAL DEPOSIT ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">MONTHLY PLAN ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">ICON</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="savings">💰 savings</option>
                    <option value="home">🏠 home</option>
                    <option value="rocket_launch">🚀 rocket_launch</option>
                    <option value="directions_car">🚗 directions_car</option>
                    <option value="laptop_mac">💻 laptop_mac</option>
                    <option value="flight_takeoff">✈️ flight_takeoff</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all text-sm shadow-[0_0_15px_rgba(90,240,179,0.3)]"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
