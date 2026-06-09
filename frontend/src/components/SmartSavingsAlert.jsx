import React, { useState } from 'react';
import { savingsService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export default function SmartSavingsAlert({ summaryData, goals, onRefresh }) {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);

  if (!summaryData || !goals) return null;

  const totalSavings = summaryData.total_savings ?? 0;
  const lockedSavings = summaryData.locked_savings ?? 0;
  const availableCash = summaryData.available_cash ?? (totalSavings - lockedSavings);

  const activeGoals = goals.filter(g => !g.is_completed);
  const fundableGoals = goals.filter(g => !g.is_completed && g.saved_amount < g.target_amount);
  const goalsWithFunds = goals.filter(g => g.saved_amount > 0);

  // Case 1: Overdraft warning (Available Cash is negative)
  const isOverdrawn = availableCash < 0;
  const overdraftAmount = Math.abs(availableCash);

  // Case 2: Surplus savings suggestion (Available Cash is positive and there are active goals to fund)
  const hasSurplus = availableCash > 0 && fundableGoals.length > 0;

  if (!isOverdrawn && !hasSurplus) return null;

  // Handle auto-split contribution
  const handleAutoSplit = async () => {
    if (loading || fundableGoals.length === 0) return;
    setLoading(true);

    try {
      const splitAmount = Math.floor(availableCash / fundableGoals.length);
      if (splitAmount > 0) {
        // Run API calls sequentially
        for (const goal of fundableGoals) {
          // Cap split amount at remaining goal target
          const remaining = goal.target_amount - goal.saved_amount;
          const toAdd = Math.min(splitAmount, remaining);
          if (toAdd > 0) {
            await savingsService.addMoney(goal.id, toAdd);
          }
        }
        if (onRefresh) await onRefresh();
      }
    } catch (err) {
      console.error('Failed to apply auto-split savings', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-withdrawal adjustment
  const handleAutoWithdraw = async () => {
    if (loading || goalsWithFunds.length === 0) return;
    setLoading(true);

    try {
      let remainingOverdraft = overdraftAmount;
      
      // Withdraw sequentially from goals with savings until overdraft is satisfied
      for (const goal of goalsWithFunds) {
        if (remainingOverdraft <= 0) break;

        const toWithdraw = Math.min(remainingOverdraft, goal.saved_amount);
        if (toWithdraw > 0) {
          await savingsService.withdrawMoney(goal.id, toWithdraw);
          remainingOverdraft -= toWithdraw;
        }
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to apply auto-withdraw rebalancing', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 stagger-in">
      {isOverdrawn ? (
        // Red Overdraft Alert Banner
        <div className="relative rounded-xl overflow-hidden border border-rose-expense/30 bg-gradient-to-r from-surface-dim to-rose-expense/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg glow-rose">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-expense text-2xl mt-0.5 sm:mt-0 flex-shrink-0 animate-pulse">
              warning
            </span>
            <div>
              <h4 className="font-bold text-[14px] text-text-primary tracking-tight mb-1">
                Budget Overdraft Detected
              </h4>
              <p className="text-on-surface-variant text-xs leading-relaxed max-w-xl">
                You spent {formatCurrency(overdraftAmount)} more than your available cash. 
                Your goals currently hold locked funds. We suggest rebalancing your goals by withdrawing 
                {formatCurrency(overdraftAmount)} back to your free balance.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoWithdraw}
            disabled={loading}
            className="px-4 py-2 bg-rose-expense text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs flex-shrink-0 disabled:opacity-50"
          >
            {loading ? 'Rebalancing...' : 'Auto-Rebalance Goals'}
          </button>
        </div>
      ) : (
        // Green Split Suggestion Banner
        <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-r from-surface-dim to-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg glow-emerald">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5 sm:mt-0 flex-shrink-0">
              insights
            </span>
            <div>
              <h4 className="font-bold text-[14px] text-text-primary tracking-tight mb-1">
                Surplus Savings Allocated Suggestion
              </h4>
              <p className="text-on-surface-variant text-xs leading-relaxed max-w-xl">
                You have {formatCurrency(availableCash)} in unallocated free cash. 
                We suggest splitting this equally amongst your active goals:
                <span className="text-primary font-bold ml-1">
                  {fundableGoals.map(g => `${g.title} (+${formatCurrency(Math.floor(availableCash / fundableGoals.length))})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoSplit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs flex-shrink-0 disabled:opacity-50"
          >
            {loading ? 'Allocating...' : 'Apply Auto-Split'}
          </button>
        </div>
      )}
    </div>
  );
}
