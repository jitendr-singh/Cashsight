import React, { useState } from 'react';

export default function LandingPage({ onEnterConsole }) {
  // Calculator States
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [cagr, setCagr] = useState(12);
  const [duration, setDuration] = useState(15);

  // Math Calculations
  const P = monthlyInvestment;
  const r = (cagr / 100) / 12;
  const n = duration * 12;

  const futureValue = r > 0 
    ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    : P * n;

  const totalInvested = P * n;
  const wealthGained = Math.max(0, futureValue - totalInvested);

  // Helper to format currency in Indian style (Lakh / Crore)
  const formatCurrencyIndian = (value) => {
    const numericValue = Math.round(value);
    if (numericValue >= 10000000) {
      return `₹${(numericValue / 10000000).toFixed(2)} Cr`;
    } else if (numericValue >= 100000) {
      return `₹${(numericValue / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numericValue);
  };

  return (
    <div className="min-h-screen w-screen bg-[#030712] text-[#dde2f3] relative overflow-x-hidden font-body-base">
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 scanning-grid pointer-events-none z-0"></div>
      <div className="ambient-orb bg-primary w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] -top-32 -left-32 opacity-15 pointer-events-none"></div>
      <div className="ambient-orb bg-violet-accent w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bottom-0 right-0 opacity-10 pointer-events-none"></div>

      {/* Landing Header */}
      <header className="w-full py-5 px-6 md:px-12 border-b border-glass-border/20 bg-slate-950/40 backdrop-blur-md fixed top-0 left-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] animate-pulse">
            monetization_on
          </span>
          <h1 className="font-display-lg text-xl md:text-2xl font-bold tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Capitallens
          </h1>
        </div>
        <button
          onClick={onEnterConsole}
          className="px-5 py-2.5 bg-primary/95 text-on-primary hover:brightness-115 active:scale-95 transition-all rounded-lg font-bold text-xs tracking-wider shadow-lg shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Vault Console</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Headline and Features */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className="inline-block bg-primary/10 border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
            Next-Gen Wealth Advisory
          </span>
          
          <h2 className="font-display-lg text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight bg-gradient-to-br from-white to-[#a3b3cc] bg-clip-text text-transparent">
            Command Your Capital With <span className="bg-gradient-to-r from-primary via-secondary to-violet-accent bg-clip-text text-transparent">AI Precision</span>
          </h2>
          
          <p className="text-on-surface-variant/80 text-sm sm:text-base max-w-xl leading-relaxed">
            Unify portfolio management, live tracking, and SEBI-aligned intelligent investment advisory. Let Gemini 2.0 / 3.1 Flash run target-driven optimization logic for your active cash reserves.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl border border-glass-border/30 bg-slate-950/40 backdrop-blur-sm hover:border-primary/30 transition-all group">
              <span className="material-symbols-outlined text-primary text-xl mb-1 group-hover:scale-110 transition-transform">insights</span>
              <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">AI Optimizer</h3>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Allocates available cash into high-potential, personalized suggestions.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-glass-border/30 bg-slate-950/40 backdrop-blur-sm hover:border-primary/30 transition-all group">
              <span className="material-symbols-outlined text-primary text-xl mb-1 group-hover:scale-110 transition-transform">finance_chip</span>
              <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">Live Valuations</h3>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Real-time stock and mutual fund tracking via official tickers and market data APIs.
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={onEnterConsole}
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-on-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-98 transition-all rounded-xl font-bold text-xs md:text-sm tracking-widest uppercase flex items-center gap-2 cursor-pointer"
            >
              <span>Unlock Command Console</span>
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            </button>
          </div>
        </div>

        {/* Right Column: Wealth Simulator Card */}
        <div className="lg:col-span-6 relative">
          
          {/* Decorative glow box */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl filter blur-xl -z-10"></div>
          
          <div className="midnight-glass border border-glass-border/30 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-glass-border/20 pb-4">
              <h3 className="font-headline font-bold text-lg text-text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">calculate</span>
                Dynamic Wealth Simulator
              </h3>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Simulate your future portfolio growth and projected compound returns
              </p>
            </div>

            {/* Monthly Investment Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                <span>Monthly Investment</span>
                <span className="text-primary font-outfit text-sm">{formatCurrencyIndian(monthlyInvestment)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                className="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/50 font-semibold">
                <span>₹1K</span>
                <span>₹50K</span>
                <span>₹100K</span>
              </div>
            </div>

            {/* CAGR Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                <span>Expected CAGR (Annual Growth)</span>
                <span className="text-primary font-outfit text-sm">{cagr}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={cagr}
                onChange={(e) => setCagr(Number(e.target.value))}
                className="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/50 font-semibold">
                <span>5% (Debt)</span>
                <span>15% (Equity)</span>
                <span>30% (Aggressive)</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                <span>Investment Horizon</span>
                <span className="text-primary font-outfit text-sm">{duration} {duration === 1 ? 'Year' : 'Years'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/50 font-semibold">
                <span>1 Year</span>
                <span>20 Years</span>
                <span>40 Years</span>
              </div>
            </div>

            {/* Calculation Results grid */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 p-4 rounded-xl border border-glass-border/20 text-center">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-on-surface-variant/70 mb-1">Total Invested</span>
                <span className="text-xs md:text-sm font-extrabold text-[#dde2f3] font-outfit">{formatCurrencyIndian(totalInvested)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-on-surface-variant/70 mb-1">Est. Returns</span>
                <span className="text-xs md:text-sm font-extrabold text-primary font-outfit">+{formatCurrencyIndian(wealthGained)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-on-surface-variant/70 mb-1">Future Value</span>
                <span className="text-xs md:text-sm font-extrabold text-secondary font-outfit">{formatCurrencyIndian(futureValue)}</span>
              </div>
            </div>

            {/* Summary message */}
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs leading-relaxed text-on-surface-variant text-center">
              Investing <span className="text-primary font-bold">{formatCurrencyIndian(monthlyInvestment)}</span> monthly at <span className="text-primary font-bold">{cagr}% CAGR</span> for <span className="text-primary font-bold">{duration} {duration === 1 ? 'year' : 'years'}</span> yields <span className="text-secondary font-bold font-outfit">{formatCurrencyIndian(futureValue)}</span>.
            </div>

            {/* Advisory disclaimer */}
            <p className="text-[9px] text-on-surface-variant/50 leading-normal border-t border-glass-border/10 pt-3">
              Disclaimer: Future projections are for educational simulation purposes only and do not guarantee actual returns. Mutual fund and stock investments are subject to market risks. Capitallens is not a SEBI-registered financial advisor.
            </p>
          </div>
        </div>
      </section>

      {/* Product Features Showcase */}
      <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10 mt-12">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="font-display-lg text-3xl md:text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Capital Operations Platform
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant/80">
            A comprehensive financial dashboard linking accounts history, active goals and real-time asset pricing models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-glass-border/30 bg-gradient-to-b from-[#0a0d16] to-[#04060b] flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(0,196,154,0.05)] hover:border-primary/20 transition-all group">
            <div className="space-y-3">
              <span className="material-symbols-outlined text-primary text-[32px] p-2 bg-primary/10 rounded-xl">chat_bubble</span>
              <h3 className="font-bold text-base text-text-primary">Gemini 2.0 / 3.1 Chat Advisor</h3>
              <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                Interact with the model regarding your savings rate, budget leaks, and historical spending data. Powered by high-speed Google AI services.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              <span>Chat Assistant ready</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-glass-border/30 bg-gradient-to-b from-[#0a0d16] to-[#04060b] flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(0,196,154,0.05)] hover:border-primary/20 transition-all group">
            <div className="space-y-3">
              <span className="material-symbols-outlined text-primary text-[32px] p-2 bg-primary/10 rounded-xl">donut_small</span>
              <h3 className="font-bold text-base text-text-primary">Expense & Savings Tracks</h3>
              <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                Log recurring transactions, track emergency funds, and review visual reports of your current savings rates against expenses.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              <span>Goal tracking active</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-glass-border/30 bg-gradient-to-b from-[#0a0d16] to-[#04060b] flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(0,196,154,0.05)] hover:border-primary/20 transition-all group">
            <div className="space-y-3">
              <span className="material-symbols-outlined text-primary text-[32px] p-2 bg-primary/10 rounded-xl">lock</span>
              <h3 className="font-bold text-base text-text-primary">Vault Security Enforced</h3>
              <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                All-time database encryption, local credentials verification, and secure session management keep your personal financials private.
              </p>
            </div>
            <div className="pt-4 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              <span>Premium security active</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-glass-border/20 text-center text-[10px] text-on-surface-variant/50 relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 Capitallens Wealth Operations. Built for high-net-worth command simulations.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-all">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-all">Terms of Console</a>
          <a href="#" className="hover:text-primary transition-all font-bold text-rose-expense">SEBI Disclaimer</a>
        </div>
      </footer>
    </div>
  );
}
