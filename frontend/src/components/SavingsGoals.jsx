import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { savingsService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export default function SavingsGoals({ goals, onRefresh, onViewAll }) {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Contribution state
  const [fundAmount, setFundAmount] = useState('');
  
  // Creation state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [icon, setIcon] = useState('🎯');

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

  // Helper styles based on index or icons
  const getIconStyles = (goalIcon, index) => {
    const styles = [
      { bg: 'bg-violet-accent/10', border: 'border-violet-accent/20', text: 'text-violet-accent', bar: 'from-violet-accent to-primary' },
      { bg: 'bg-secondary/10', border: 'border-secondary/20', text: 'text-secondary', bar: 'from-secondary to-emerald-glow' },
      { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', bar: 'from-primary to-emerald-glow' }
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="lg:col-span-5 midnight-glass p-6 md:p-card-padding rounded-xl flex flex-col h-full cursor-default">
      <h3 className="font-headline-md text-lg md:text-[18px] text-text-primary mb-6 flex items-center justify-between">
        Savings Goals
        <button
          onClick={() => setShowAddModal(true)}
          className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform bg-transparent border-none"
          aria-label="Add Savings Goal"
        >
          add_circle
        </button>
      </h3>

      <div className="space-y-4 flex-1 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
        {goals.map((goal, index) => {
          const styling = getIconStyles(goal.icon, index);
          const pct = goal.progress_percentage ?? 0;

          return (
            <div
              key={goal.id || index}
              onClick={() => {
                setSelectedGoal(goal);
                setShowFundModal(true);
              }}
              className="group cursor-pointer hover:bg-surface-variant/20 p-2 -mx-2 rounded-lg transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${styling.bg} flex items-center justify-center border ${styling.border}`}>
                    <span className={`material-symbols-outlined ${styling.text}`}>
                      {goal.icon || 'savings'}
                    </span>
                  </div>
                  <span className="font-body-bold text-[14px] font-semibold text-text-primary">
                    {goal.title}
                  </span>
                </div>
                <span className="text-label-caps text-on-surface-variant text-[11px] font-bold">
                  {pct}%
                </span>
              </div>
              
              <div className="h-2 w-full bg-surface-variant/30 rounded-full overflow-hidden border border-glass-border">
                <div
                  className={`h-full bg-gradient-to-r ${styling.bar} relative transition-all duration-1000`}
                  style={{ width: `${pct}%` }}
                >
                  {/* Pulse Shimmer for Euro Summer / Violet theme */}
                  {index % 3 === 0 && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-8 text-on-surface-variant opacity-60 text-sm">
            No goals found. Click + to create your first milestone!
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-glass-border">
        <button 
          onClick={onViewAll}
          className="w-full py-2.5 border border-primary/20 hover:bg-primary/5 text-primary rounded-lg transition-colors font-bold text-sm cursor-pointer"
        >
          View All Milestones
        </button>
      </div>

      {/* --- ADD MONEY MODAL --- */}
      {showFundModal && selectedGoal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
          <div className="bg-surface-container border border-primary/30 rounded-xl p-6 w-full max-w-sm shadow-2xl midnight-glass transform scale-100 transition-all duration-300">
            <h4 className="font-headline-md text-[18px] text-text-primary mb-4 flex items-center justify-between">
              Fund Goal
              <button
                onClick={() => {
                  setShowFundModal(false);
                  setSelectedGoal(null);
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-rose-expense cursor-pointer"
              >
                close
              </button>
            </h4>
            <p className="text-sm text-on-surface-variant mb-4">
              Add savings contribution to <strong className="text-primary">{selectedGoal.title}</strong> (Target: {formatCurrency(selectedGoal.target_amount, 0)})
            </p>
            <form onSubmit={handleFundGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">CONTRIBUTION AMOUNT ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all text-sm shadow-[0_0_15px_rgba(90,240,179,0.3)]"
              >
                Confirm Add Money
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
            <h4 className="font-headline-md text-[18px] text-text-primary mb-4 flex items-center justify-between">
              Create New Goal
              <button
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-rose-expense cursor-pointer"
              >
                close
              </button>
            </h4>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">GOAL TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Euro Summer '25"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">TARGET ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">INITIAL DEPOSIT ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">MONTHLY PLAN ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">ICON (Google Font name)</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#080e1a] border border-glass-border rounded-lg py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="flight_takeoff">✈️ flight_takeoff</option>
                    <option value="home">🏠 home</option>
                    <option value="rocket_launch">🚀 rocket_launch</option>
                    <option value="directions_car">🚗 directions_car</option>
                    <option value="laptop_mac">💻 laptop_mac</option>
                    <option value="savings">💰 savings</option>
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
