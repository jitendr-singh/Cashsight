import React, { useState } from 'react';
import Logo from './Logo';

export default function LandingPage({ onEnterConsole }) {
  // Theme State
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  // Calculator States (Compound Interest Wealth Simulator)
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [cagr, setCagr] = useState(12);
  const [duration, setDuration] = useState(15);

  // AI Insights Simulator State
  const [activeScenario, setActiveScenario] = useState('idle_cash');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Simulator math calculations
  const P = monthlyInvestment;
  const r = (cagr / 100) / 12;
  const n = duration * 12;
  const futureValue = r > 0 
    ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    : P * n;
  const totalInvested = P * n;
  const wealthGained = Math.max(0, futureValue - totalInvested);

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // AI Scenario data
  const scenarios = {
    idle_cash: {
      title: "Idle Cash Optimizer",
      badge: "Wealth Growth",
      description: "You have ₹50,000 sitting in your savings account earning only 3% interest.",
      aiAdvice: "Move ₹35,000 into a liquid debt fund earning ~6.8% and invest the remaining ₹15,000 into a diversified equity index fund. This reallocation boosts your estimated returns by ₹4,800 over the next 12 months with minimal risk.",
      stats: { left: "Est. Return +8.2%", right: "Risk: Low" }
    },
    high_expenses: {
      title: "High Expenses Alert",
      badge: "Savings intelligence",
      description: "Dining out and utility subscription expenses are 18% higher than last month's average.",
      aiAdvice: "Your dining out has exceeded your average baseline by ₹8,200. I recommend pausing 2 unused video subscriptions (saving ₹1,200/mo) and setting a dining budget limit of ₹12,000 for next month to keep your active goals on track.",
      stats: { left: "Est. Savings +₹9,400/mo", right: "Difficulty: Easy" }
    },
    portfolio: {
      title: "Tax Loss Harvesting",
      badge: "Investment Insights",
      description: "End-of-year market correction has created short-term unrealized capital losses in your equity holdings.",
      aiAdvice: "There is an opportunity to harvest ₹14,500 in short-term capital losses to offset your long-term capital gains tax. I recommend harvesting these losses and reallocating 5% to gold/bonds to rebalance your target asset allocation back to 70/30.",
      stats: { left: "Tax Saved: ~₹4,350", right: "Actions: 2 trades" }
    }
  };

  // FAQ Data
  const faqs = [
    {
      q: "Is CapitalLens safe to connect to my accounts?",
      a: "Yes, absolutely. We use bank-grade AES-256 encryption and read-only API connectors. We never store your actual bank credentials, and your credentials remain encrypted locally on your device for absolute security."
    },
    {
      q: "How does the AI advisor generate investment insights?",
      a: "Our platform runs secure, localized vector embeddings on your budget patterns and active goals, combining them with SEBI-aligned financial strategies powered by high-speed Google AI services. It never acts without your explicit trade approvals."
    },
    {
      q: "Is there a free trial for the Pro features?",
      a: "Yes, our Free plan includes core expense tracking, manual goal setting, and basic simulator access. When you register, you automatically receive a 14-day free trial of the Pro tier (including automated AI Copilot suggestions and live trackers)."
    },
    {
      q: "Does CapitalLens support global currencies?",
      a: "Yes! While our primary currency format is styled for INR (Rupees), you can toggle between USD ($) and INR (₹) dynamically directly inside the Vault command center with real-time exchange rates."
    },
    {
      q: "Do I need to bind my credit cards to test the simulator?",
      a: "Not at all. You can use our dynamic wealth simulator, explore the landing page features, and create a free account to play around with command mockups without entering any credit card information."
    }
  ];

  // Theme-conditional styling classes
  const bgClass = theme === 'dark' ? 'bg-[#030712] text-[#dde2f3]' : 'bg-[#f8fafc] text-[#0f172a]';
  const glassCardClass = theme === 'dark' 
    ? 'bg-slate-900/65 border-slate-800 text-[#dde2f3]' 
    : 'bg-white border-slate-200 text-[#1e293b] shadow-sm';
  const headingClass = theme === 'dark' 
    ? 'bg-gradient-to-br from-white to-[#a3b3cc] bg-clip-text text-transparent' 
    : 'text-[#0f172a]';
  const subheadingClass = theme === 'dark' ? 'text-slate-400/80' : 'text-slate-600';
  const borderClass = theme === 'dark' ? 'border-[#1e293b]' : 'border-slate-200';
  const headerBg = theme === 'dark' ? 'bg-[#030712]/70 border-slate-900' : 'bg-[#ffffff]/80 border-slate-200';
  const footerBg = theme === 'dark' ? 'border-[#1e293b]' : 'border-slate-200';
  const cardBg = theme === 'dark' ? 'bg-[#0a0d16]/80' : 'bg-white';
  const tabBgActive = theme === 'dark' ? 'bg-primary/10 border-primary text-primary' : 'bg-[#e2e8f0] border-slate-400 text-slate-800';

  // High-contrast accessibility text and link classes for Light Mode
  const primaryTextClass = theme === 'dark' ? 'text-primary' : 'text-emerald-700';
  const secondaryTextClass = theme === 'dark' ? 'text-secondary' : 'text-blue-700';
  const descTextClass = theme === 'dark' ? 'text-slate-400/80' : 'text-slate-600';
  const linkPrimaryClass = theme === 'dark' ? 'text-primary' : 'text-emerald-800';
  const linkSecondaryClass = theme === 'dark' ? 'text-secondary' : 'text-blue-800';
  const linkVioletClass = theme === 'dark' ? 'text-violet-accent' : 'text-violet-800';
  const descOpacityClass = theme === 'dark' ? 'text-on-surface-variant/80' : 'text-slate-600';

  // Badge background/text classes
  const badgeClass = theme === 'dark'
    ? 'bg-primary/10 border-primary/30 text-primary'
    : 'bg-emerald-100 border-emerald-300 text-emerald-800';
  const badgeBlueClass = theme === 'dark'
    ? 'bg-[#00b4d8]/10 text-[#00b4d8]'
    : 'bg-blue-100 text-blue-800';
  const badgeVioletClass = theme === 'dark'
    ? 'bg-violet-accent/10 text-violet-accent'
    : 'bg-violet-100 text-violet-800';

  // Icon background/text classes
  const primaryIconBg = theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-700';
  const secondaryIconBg = theme === 'dark' ? 'bg-secondary/10 text-secondary' : 'bg-blue-100 text-blue-700';
  const violetIconBg = theme === 'dark' ? 'bg-violet-accent/10 text-violet-accent' : 'bg-violet-100 text-violet-700';
  const cyanIconBg = theme === 'dark' ? 'bg-[#00cbe6]/10 text-[#00cbe6]' : 'bg-cyan-100 text-cyan-800';

  return (
    <div className={`min-h-screen w-screen relative overflow-x-hidden transition-colors duration-300 ${bgClass}`}>
      
      {/* Background ambient grids */}
      <div className="fixed inset-0 scanning-grid pointer-events-none z-0 opacity-40"></div>
      <div className="ambient-orb bg-primary w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] -top-32 -left-32 opacity-10 pointer-events-none"></div>
      <div className="ambient-orb bg-violet-accent w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bottom-0 right-0 opacity-10 pointer-events-none"></div>

      {/* Modern Header */}
      <header className={`w-full py-4 px-6 md:px-12 border-b backdrop-blur-md fixed top-0 left-0 z-50 flex items-center justify-between transition-colors duration-300 ${headerBg}`}>
        <Logo size={36} textClass="text-2xl md:text-3xl" variant={theme === 'light' ? 'light' : 'primary'} />
        
        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme === 'dark' ? 'border-slate-800 text-primary bg-slate-900/60' : 'border-slate-200 text-slate-700 bg-slate-100'}`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={onEnterConsole}
            className="px-5 py-2 bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all rounded-lg font-bold text-xs tracking-wider shadow-lg shadow-primary/10 flex items-center gap-1.5 cursor-pointer border-none"
          >
            <span>Vault Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Headline and Features */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className={`inline-block border px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}>
            ✨ Next-Gen Financial Command System
          </span>
          
          <h1 className={`font-display-lg text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight ${headingClass}`}>
            See Your Entire Financial Life Through a <span className="bg-gradient-to-r from-primary via-[#2fd9f4] to-violet-accent bg-clip-text text-transparent">Smarter Lens</span>
          </h1>
          
          <p className={`text-sm sm:text-base max-w-xl leading-relaxed ${subheadingClass}`}>
            Track expenses, monitor savings, analyze spending habits, and receive AI-powered investment insights — all in one intelligent, enterprise-grade platform.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onEnterConsole}
              className="px-6 py-3.5 bg-gradient-to-r from-primary to-[#00b4d8] text-on-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-98 transition-all rounded-xl font-bold text-xs md:text-sm tracking-wider flex items-center gap-2 cursor-pointer border-none"
            >
              <span>Get Started Free</span>
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            </button>
            
            <button
              onClick={onEnterConsole}
              className={`px-6 py-3.5 border font-bold text-xs md:text-sm tracking-wider rounded-xl transition-all hover:bg-slate-800/10 active:scale-98 flex items-center gap-2 cursor-pointer ${theme === 'dark' ? 'border-slate-800 hover:border-slate-700 text-[#dde2f3]' : 'border-slate-300 hover:border-slate-400 text-slate-700'}`}
            >
              <span>Watch Demo</span>
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
            </button>
          </div>
          
          <div className={`flex items-center gap-6 pt-4 text-xs font-semibold ${descTextClass}`}>
            <span className="flex items-center gap-1"><span className={`material-symbols-outlined text-[16px] ${primaryTextClass}`}>verified_user</span> No card required</span>
            <span className="flex items-center gap-1"><span className={`material-symbols-outlined text-[16px] ${primaryTextClass}`}>lock</span> Encrypted Vault security</span>
          </div>
        </div>

        {/* Right Column: Hero Visual - Futuristic Mockup */}
        <div className="lg:col-span-6 relative">
          <div className="absolute inset-0 bg-primary/10 rounded-3xl filter blur-2xl -z-10"></div>
          
          <div className={`border rounded-2xl p-5 md:p-6 space-y-5 transition-all duration-300 ${glassCardClass}`}>
            {/* Header of Visual */}
            <div className="flex justify-between items-center border-b pb-3.5 border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-2 ${theme === 'dark' ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>Vault Command Mockup</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wider">LIVE PORTFOLIO</span>
            </div>

            {/* Simulated Live Analytics Graphic */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${theme === 'dark' ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>Estimated Net Worth</p>
                  <p className={`text-xl md:text-2xl font-extrabold font-outfit ${primaryTextClass}`}>₹50,00,000.00</p>
                </div>
                <div className="text-right">
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${theme === 'dark' ? 'text-on-surface-variant/60' : 'text-slate-500'}`}>Target Savings Rate</p>
                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                    <span className="material-symbols-outlined text-xs">trending_up</span> 42.5% (+8%)
                  </p>
                </div>
              </div>

              {/* Area Chart SVG (Modern visual trend line) */}
              <div className="h-28 w-full bg-slate-950/40 rounded-xl border border-glass-border/20 p-2 relative overflow-hidden flex items-end">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5af0b3" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#5af0b3" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path d="M 0 80 Q 50 70 100 85 T 200 40 T 300 15 L 300 100 L 0 100 Z" fill="url(#chart-glow)" />
                  {/* Trend Line */}
                  <path d="M 0 80 Q 50 70 100 85 T 200 40 T 300 15" fill="none" stroke="#5af0b3" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute top-2 left-3 flex gap-2">
                  <span className="text-[8px] bg-slate-900 border border-glass-border px-1.5 py-0.5 rounded text-slate-300">Equity 68%</span>
                  <span className="text-[8px] bg-slate-900 border border-glass-border px-1.5 py-0.5 rounded text-slate-300">Bonds 22%</span>
                  <span className="text-[8px] bg-slate-900 border border-glass-border px-1.5 py-0.5 rounded text-slate-300">Cash 10%</span>
                </div>
              </div>
            </div>

            {/* Savings Goals & AI Recommendation Toast (Glassmorphism layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-glass-border/15 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00cbe6] text-xl p-1.5 bg-[#00cbe6]/10 rounded-lg">savings</span>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Emergency Fund</p>
                  <p className="text-xs font-bold text-slate-200">₹6,00,000 / 92%</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-3">
                <span className={`material-symbols-outlined text-xl p-1.5 rounded-lg ${primaryIconBg}`}>psychology</span>
                <div className="min-w-0">
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${primaryTextClass}`}>AI Copilot Recommendation</p>
                  <p className="text-xs font-bold text-emerald-400 truncate">Invest ₹15,000 Idle Cash</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Features Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeClass}`}>⚡ Powerful Capabilities</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Enterprise-Grade Financial Command
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            A secure budgeting, expense intelligence, and mutual fund tracker architecture built to optimize your cash flow command.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: AI Advisor */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${primaryIconBg}`}>chat_bubble</span>
              <h3 className="font-bold text-lg">AI Financial Copilot</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Discuss budgets, active savings goals, compound interest rates, and trade ideas. Run securely on Google Gemini 2.0 / 3.1 Flash.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkPrimaryClass}`}>
              Learn about AI Advisor <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

          {/* Card 2: Live Tracking */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${secondaryIconBg}`}>monitoring</span>
              <h3 className="font-bold text-lg">Live Asset Valuation</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Track your stock portfolio and mutual fund values in real-time. Automatically integrates with tickers for daily net-worth tracking.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkSecondaryClass}`}>
              Explore Live Tracker <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

          {/* Card 3: Budget Intel */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${violetIconBg}`}>donut_small</span>
              <h3 className="font-bold text-lg">Expense Intelligence</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Categorize expenses dynamically, identify cash flow leaks, and calculate monthly savings rates automatically.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkVioletClass}`}>
              View Expense tools <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

          {/* Card 4: Local Encryption */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${primaryIconBg}`}>lock</span>
              <h3 className="font-bold text-lg">AES-256 Vault Encryption</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Your credentials and accounts remain encrypted on your device. We use read-only queries so your funds cannot be moved.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkPrimaryClass}`}>
              Security Specifications <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

          {/* Card 5: Smart Alerts */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${cyanIconBg}`}>notifications_active</span>
              <h3 className="font-bold text-lg">Smart Savings Alerts</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Get notified when you have high idle cash reserves or excess monthly expenses, and receive suggestions to maximize compound yields.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkSecondaryClass}`}>
              See Smart Rules <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

          {/* Card 6: Multi-Currency */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] group ${glassCardClass}`}>
            <div className="space-y-4">
              <span className={`material-symbols-outlined text-[32px] p-2 rounded-xl ${violetIconBg}`}>currency_exchange</span>
              <h3 className="font-bold text-lg">Dual-Currency Command</h3>
              <p className={`text-xs leading-relaxed ${descOpacityClass}`}>
                Seamlessly toggle between INR (₹) and USD ($) at any time. All calculations adjust dynamically using exchange rate APIs.
              </p>
            </div>
            <span className={`pt-4 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ${linkVioletClass}`}>
              Toggle Exchange Rates <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>

        </div>
      </section>

      {/* Section 2: Dashboard Showcase */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeBlueClass}`}>📊 Interactive Showcase</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            The Ultimate Wealth Command Center
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            A glance at your live CapitalLens command dashboard. Unified intelligence, modular cards, and responsive controls compiled inside a stunning glassmorphic UI.
          </p>
        </div>

        {/* Large Dashboard Mockup Container */}
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${glassCardClass} max-w-5xl mx-auto shadow-2xl`}>
          {/* Browser Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
            </div>
            <div className="bg-slate-950/80 rounded-md border border-slate-800/60 text-[10px] text-slate-400 px-8 py-1 truncate max-w-xs sm:max-w-md">
              vault.capitallens.com/dashboard
            </div>
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-slate-600 text-xs">refresh</span>
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="p-4 sm:p-6 md:p-8 bg-[#0a0f1d] grid grid-cols-12 gap-5 relative">
            
            {/* Sidebar Mockup (Col span 3) */}
            <div className="col-span-3 border-r border-slate-800/80 pr-4 space-y-4 hidden md:block text-left">
              <Logo size={24} textClass="text-sm" />
              <div className="space-y-1 pt-4">
                <div className="flex items-center gap-2 p-2 bg-primary/10 text-primary rounded-lg text-[11px] font-bold"><span className="material-symbols-outlined text-[14px]">dashboard</span> Dashboard</div>
                <div className="flex items-center gap-2 p-2 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-800/30"><span className="material-symbols-outlined text-[14px]">monitoring</span> Analytics</div>
                <div className="flex items-center gap-2 p-2 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-800/30"><span className="material-symbols-outlined text-[14px]">trending_up</span> Investments</div>
                <div className="flex items-center gap-2 p-2 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-800/30"><span className="material-symbols-outlined text-[14px]">receipt_long</span> Transactions</div>
                <div className="flex items-center gap-2 p-2 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-800/30"><span className="material-symbols-outlined text-[14px]">savings</span> Savings Goals</div>
                <div className="flex items-center gap-2 p-2 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-800/30"><span className="material-symbols-outlined text-[14px]">psychology</span> AI Copilot</div>
              </div>
            </div>

            {/* Dashboard Content Mockup (Col span 9) */}
            <div className="col-span-12 md:col-span-9 space-y-5 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wealth Command Center</h3>
                  <p className="text-[10px] text-slate-400">Executive portfolio summary status: Safe</p>
                </div>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> {theme === 'dark' ? '₹ INR Active' : '₹ INR Active'}
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Command Balance</span>
                  <p className="text-sm font-extrabold text-slate-200 mt-1">₹50,00,000.00</p>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full w-[68%]"></div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Active Investments</span>
                  <p className="text-sm font-extrabold text-secondary mt-1">₹34,50,000.00</p>
                  <p className="text-[8px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">trending_up</span> +14.2% yield</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Monthly Spend</span>
                  <p className="text-sm font-extrabold text-[#fb7185] mt-1">₹12,480.00</p>
                  <p className="text-[8px] text-[#fb7185]/70 font-semibold mt-1">Remaining Budget: ₹48,000</p>
                </div>
              </div>

              {/* Graphic/Simulator Split */}
              <div className="p-4 bg-slate-950/80 border border-slate-800/60 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Live AI Copilot Allocation Strategy</span>
                  <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">95/100 Health Score</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  "Based on your ₹50,000 unallocated cash reserves, Capitallens suggestions are currently optimized for liquidity (T+1 payouts). High-yield mutual fund reallocations are pending your manual review."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: AI Insights Demonstration */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeVioletClass}`}>💡 Interactive Demo</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Interactive AI Insights Simulator
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Choose one of our typical AI advice scenarios below to preview how our neural financial copilot monitors allocations and provides SEBI-aligned wealth advisory alerts.
          </p>
        </div>

        {/* Dynamic Scenario Demo Component */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Left Column: Tab Selectors (Col span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
            
            {/* Tab 1 */}
            <button
              onClick={() => setActiveScenario('idle_cash')}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                activeScenario === 'idle_cash' 
                  ? tabBgActive 
                  : (theme === 'dark' ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-slate-100/50 text-slate-600')
              }`}
            >
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                theme === 'dark' ? 'bg-slate-950/40 border-glass-border text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}>Idle Cash</span>
              <h4 className="font-bold text-sm mt-2">Idle Cash Optimization</h4>
              <p className="text-[11px] mt-1 opacity-80">Optimize liquid reserves earning sub-par bank yields.</p>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveScenario('high_expenses')}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                activeScenario === 'high_expenses' 
                  ? tabBgActive 
                  : (theme === 'dark' ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-slate-100/50 text-slate-600')
              }`}
            >
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                theme === 'dark' ? 'bg-slate-950/40 border-glass-border text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}>Overspending</span>
              <h4 className="font-bold text-sm mt-2">Expense Limit Warnings</h4>
              <p className="text-[11px] mt-1 opacity-80">Identify recurring micro-leaks and budget excess.</p>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveScenario('portfolio')}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                activeScenario === 'portfolio' 
                  ? tabBgActive 
                  : (theme === 'dark' ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-slate-100/50 text-slate-600')
              }`}
            >
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                theme === 'dark' ? 'bg-slate-950/40 border-glass-border text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}>Tax Harvesting</span>
              <h4 className="font-bold text-sm mt-2">Tax Loss Harvesting</h4>
              <p className="text-[11px] mt-1 opacity-80">Leverage market corrections to offset capital gains tax.</p>
            </button>
            
          </div>

          {/* Right Column: AI Bubble Output Panel (Col span 7) */}
          <div className="lg:col-span-7 flex">
            <div className={`border rounded-2xl p-6 sm:p-8 flex flex-col justify-between w-full shadow-lg ${glassCardClass}`}>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined p-1 rounded-lg ${primaryIconBg}`}>psychology</span>
                    <div>
                      <h4 className="font-bold text-sm">{scenarios[activeScenario].title}</h4>
                      <p className={`text-[9px] uppercase font-bold tracking-wider ${primaryTextClass}`}>{scenarios[activeScenario].badge}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400/80">Gemini Advisory Engine</span>
                </div>

                {/* Scenario Description */}
                <div className={`p-3.5 rounded-xl border text-left ${
                  theme === 'dark' ? 'bg-slate-950/50 border-glass-border/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[8px] uppercase tracking-wider font-bold ${theme === 'dark' ? 'text-on-surface-variant/50' : 'text-slate-500'}`}>DETECTOR PATTERN</span>
                  <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-[#dde2f3]' : 'text-slate-800'}`}>
                    "{scenarios[activeScenario].description}"
                  </p>
                </div>

                {/* AI Advice Output Bubble */}
                <div className="text-left space-y-2">
                  <span className={`text-[8px] uppercase tracking-wider font-bold flex items-center gap-1 ${primaryTextClass}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Copilot Analysis Output
                  </span>
                  <div className={`p-4 bg-primary/5 border border-primary/20 rounded-xl leading-relaxed text-xs ${theme === 'dark' ? 'text-on-surface-variant' : 'text-slate-700'}`}>
                    {scenarios[activeScenario].aiAdvice}
                  </div>
                </div>
              </div>

              {/* Action Indicator / Stats footer */}
              <div className={`mt-6 pt-4 border-t border-glass-border/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider ${descTextClass}`}>
                <span>{scenarios[activeScenario].stats.left}</span>
                <span className={primaryTextClass}>{scenarios[activeScenario].stats.right}</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Section 4: How It Works */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeClass}`}>🚀 3-Step Setup</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            How CapitalLens Operates
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Get fully integrated into our smart investment and budget commands in less than 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-primary/35 via-secondary/35 to-violet-accent/35 -z-10"></div>

          {/* Step 1 */}
          <div className={`text-center space-y-4 relative p-4 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-[#030712]/30 border-glass-border/10' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto shadow-md border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-primary' : 'bg-white border-slate-200 text-emerald-700'
            }`}>1</div>
            <h3 className="font-bold text-base">Connect Vault Accounts</h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${descTextClass}`}>
              Connect your expense history, bank logs, or mutual fund accounts securely using read-only API connectors.
            </p>
          </div>

          {/* Step 2 */}
          <div className={`text-center space-y-4 relative p-4 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-[#030712]/30 border-glass-border/10' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto shadow-md border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-secondary' : 'bg-white border-slate-200 text-blue-700'
            }`}>2</div>
            <h3 className="font-bold text-base">AI Analysis Scanning</h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${descTextClass}`}>
              Google Gemini engines scan your unallocated cash pools and expense trends to generate compound growth advisory suggestions.
            </p>
          </div>

          {/* Step 3 */}
          <div className={`text-center space-y-4 relative p-4 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-[#030712]/30 border-glass-border/10' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto shadow-md border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-violet-accent' : 'bg-white border-slate-200 text-violet-800'
            }`}>3</div>
            <h3 className="font-bold text-base">Execute and Optimize</h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${descTextClass}`}>
              Review allocations and commit optimizations directly from the console dashboard to keep your financial life on target.
            </p>
          </div>

        </div>
      </section>

      {/* Section 5: Security & Privacy */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className={`border rounded-3xl p-8 sm:p-12 relative overflow-hidden max-w-5xl mx-auto ${glassCardClass}`}>
          {/* Ambient Glow */}
          <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            <div className="lg:col-span-7 space-y-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                <span className="material-symbols-outlined text-[14px]">lock</span> Encryption Enforced
              </span>
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Bank-Grade Security & Read-Only Privacy Safeguards
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${descTextClass}`}>
                CapitalLens operates strictly on a read-only data layer. We implement state-of-the-art security patterns to guarantee your capital and credentials remain confidential:
              </p>
              
              <ul className="space-y-3.5 pt-2">
                <li className={`flex items-start gap-2.5 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${primaryTextClass}`}>check_circle</span>
                  <span><strong>AES-256 Local Encryption</strong>: Credentials stored securely inside your device database.</span>
                </li>
                <li className={`flex items-start gap-2.5 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${primaryTextClass}`}>check_circle</span>
                  <span><strong>Zero Funds Movement Capability</strong>: Our connectors possess read-only flags; we cannot initiate trades or withdrawals.</span>
                </li>
                <li className={`flex items-start gap-2.5 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${primaryTextClass}`}>check_circle</span>
                  <span><strong>SEBI Alignment Warnings</strong>: Intelligent notifications keep you advised of market risks and diversification limits.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="p-8 bg-slate-950/80 rounded-2xl border border-glass-border/30 text-center relative max-w-sm w-full">
                <span className="material-symbols-outlined text-primary text-[56px] mb-3 animate-pulse">shield_lock</span>
                <h4 className="font-extrabold text-sm uppercase tracking-widest text-slate-200">Security Certificate</h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Encryption Layer: v3.2 SSL Enforced<br/>
                  Data Storage: Sandbox Encrypted<br/>
                  Connector Audits: Quarterly Verified
                </p>
                <div className="mt-4 pt-3 border-t border-glass-border/20 text-[9px] uppercase tracking-wider font-bold text-primary">
                  100% Secure read-only database
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Customer Testimonials */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeClass}`}>💬 User Endorsements</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Trusted by Builders & Investors
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Read feedback from founders, builders, and smart investors who rely on CapitalLens to monitor cash flow and compound returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Testimonial 1 */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${glassCardClass}`}>
            <p className={`text-xs leading-relaxed italic ${descOpacityClass}`}>
              "CapitalLens completely changed how I manage my startup's reserve cash flow and personal portfolio. The AI simulator helps me model Compound Horzions effortlessly, and the UI is incredibly slick."
            </p>
            <div className="flex items-center gap-3 border-t border-glass-border/20 pt-4 text-left">
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center font-bold text-[11px] ${primaryTextClass}`}>AR</div>
              <div>
                <h4 className="font-bold text-xs">Arjun Rao</h4>
                <p className={`text-[9px] ${descTextClass}`}>Tech Founder & Angel Investor</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${glassCardClass}`}>
            <p className={`text-xs leading-relaxed italic ${descOpacityClass}`}>
              "The ability to toggle between USD and INR instantly is huge for my overseas holdings. The interface is clean, minimal, and doesn't get cluttered with useless visual noise. Bank-grade read-only security gives me total peace of mind."
            </p>
            <div className="flex items-center gap-3 border-t border-glass-border/20 pt-4 text-left">
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-secondary/30 to-violet-accent/30 flex items-center justify-center font-bold text-[11px] ${secondaryTextClass}`}>MS</div>
              <div>
                <h4 className="font-bold text-xs">Meera Sharma</h4>
                <p className={`text-[9px] ${descTextClass}`}>VP of Finance, SaaS Capital</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${glassCardClass}`}>
            <p className={`text-xs leading-relaxed italic ${descOpacityClass}`}>
              "I love the scenario optimizer! Having an AI analyze budget anomalies and idle cash yields with a single click saves me hours of sheets compiling. It's the cleanest wealth command engine out there."
            </p>
            <div className="flex items-center gap-3 border-t border-glass-border/20 pt-4 text-left">
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-violet-accent/30 to-primary/30 flex items-center justify-center font-bold text-[11px] ${linkVioletClass}`}>DK</div>
              <div>
                <h4 className="font-bold text-xs">Dev Kar</h4>
                <p className={`text-[9px] ${descTextClass}`}>Quantitative Researcher</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dynamic Wealth Simulator (Relocated and redesigned compound interest tool) */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-[#00cbe6] uppercase tracking-widest bg-[#00cbe6]/10 px-3.5 py-1.5 rounded-full">📈 Live Calculator</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Simulate Your Portfolio Horizon
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Slide the values below to project your estimated compound portfolio growth over years under various annual CAGR models.
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl filter blur-xl -z-10"></div>
          
          <div className={`border rounded-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 ${glassCardClass}`}>
            
            {/* Monthly Investment Slider */}
            <div className="space-y-2">
              <div className={`flex justify-between items-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Monthly Investment</span>
                <span className={`${primaryTextClass} font-outfit text-sm`}>{formatCurrencyIndian(monthlyInvestment)}</span>
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
              <div className={`flex justify-between text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                <span>₹1K</span>
                <span>₹50K</span>
                <span>₹100K</span>
              </div>
            </div>

            {/* CAGR Slider */}
            <div className="space-y-2">
              <div className={`flex justify-between items-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Expected CAGR (Annual Growth)</span>
                <span className={`${primaryTextClass} font-outfit text-sm`}>{cagr}%</span>
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
              <div className={`flex justify-between text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                <span>5% (Debt)</span>
                <span>15% (Equity)</span>
                <span>30% (Aggressive)</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className={`flex justify-between items-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Investment Horizon</span>
                <span className={`${primaryTextClass} font-outfit text-sm`}>{duration} {duration === 1 ? 'Year' : 'Years'}</span>
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
              <div className={`flex justify-between text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                <span>1 Year</span>
                <span>20 Years</span>
                <span>40 Years</span>
              </div>
            </div>

            {/* Calculation Results grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 rounded-xl border text-center transition-all ${
              theme === 'dark' ? 'bg-slate-950/40 border-glass-border/20' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className={`block text-[9px] uppercase tracking-wider font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Total Invested</span>
                <span className={`text-sm font-extrabold font-outfit ${theme === 'dark' ? 'text-[#dde2f3]' : 'text-slate-800'}`}>{formatCurrencyIndian(totalInvested)}</span>
              </div>
              <div>
                <span className={`block text-[9px] uppercase tracking-wider font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Est. Returns</span>
                <span className={`text-sm font-extrabold font-outfit ${primaryTextClass}`}>+{formatCurrencyIndian(wealthGained)}</span>
              </div>
              <div>
                <span className={`block text-[9px] uppercase tracking-wider font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Future Value</span>
                <span className={`text-sm font-extrabold font-outfit ${secondaryTextClass}`}>{formatCurrencyIndian(futureValue)}</span>
              </div>
            </div>

            {/* Summary message */}
            <div className={`p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs leading-relaxed text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-750'}`}>
              Investing <span className={`${primaryTextClass} font-bold`}>{formatCurrencyIndian(monthlyInvestment)}</span> monthly at <span className={`${primaryTextClass} font-bold`}>{cagr}% CAGR</span> for <span className={`${primaryTextClass} font-bold`}>{duration} {duration === 1 ? 'year' : 'years'}</span> yields <span className={`${secondaryTextClass} font-bold font-outfit`}>{formatCurrencyIndian(futureValue)}</span>.
            </div>

            {/* Advisory disclaimer */}
            <p className="text-[9px] text-slate-500 leading-normal border-t border-glass-border/10 pt-3 text-center">
              Disclaimer: Compound projections are calculated using standard compound frequency formulae and are intended for simulation and educational goals. Mutual funds are subject to market risks.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Pricing Plans */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeVioletClass}`}>💳 Flexible Plans</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Pricing Suited For Your Scale
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Free manual controls or automated AI advisory commands. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          
          {/* Free Tier */}
          <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden text-left ${glassCardClass}`}>
            <div className="space-y-6">
              <div>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Tier</span>
                <h3 className="text-xl font-bold mt-2">Capital Free</h3>
                <p className={`text-xs mt-1 ${descTextClass}`}>Core budgeting & manual cash logging tools.</p>
              </div>

              <div className="border-t border-glass-border/15 pt-4">
                <span className={`text-3xl font-extrabold font-outfit ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₹0</span>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}> / forever free</span>
              </div>

              <ul className="space-y-3 pt-2 text-xs">
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Manual transaction logger</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> 3 Active savings goals</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Local encryption protection</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-600 text-sm">close</span> <span className="text-slate-500">Automated AI Copilot suggestions</span></li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-600 text-sm">close</span> <span className="text-slate-500">Real-time stock valuation syncing</span></li>
              </ul>
            </div>

            <button
              onClick={onEnterConsole}
              className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
            >
              Start Free Command
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between relative overflow-hidden text-left transition-all ${
            theme === 'dark' 
              ? 'bg-gradient-to-b from-[#0a1226] to-[#04060b] border-primary/40 text-[#dde2f3] hover:shadow-[0_12px_40px_rgba(0,196,154,0.06)]' 
              : 'bg-white border-emerald-300 text-slate-900 shadow-md hover:shadow-lg'
          }`}>
            
            {/* Best Value badge */}
            <div className={`absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-lg ${
              theme === 'dark' ? 'bg-primary text-on-primary' : 'bg-emerald-600 text-white'
            }`}>
              Advisory active
            </div>

            <div className="space-y-6">
              <div>
                <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                  theme === 'dark' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                }`}>Enterprise Premium</span>
                <h3 className="text-xl font-bold mt-2">Capital Pro</h3>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Full AI-advisory, live integrations & alerts.</p>
              </div>

              <div className="border-t border-glass-border/15 pt-4">
                <span className={`text-3xl font-extrabold font-outfit ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>₹499</span>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}> / month</span>
              </div>

              <ul className="space-y-3 pt-2 text-xs">
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Unlimited active savings goals</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Automated AI Copilot suggestions</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Real-time stock / mutual fund syncing</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Smart savings & idle cash alerts</li>
                <li className="flex items-center gap-2"><span className={`material-symbols-outlined text-sm ${primaryTextClass}`}>check</span> Secure multi-device cloud backup</li>
              </ul>
            </div>

            <button
              onClick={onEnterConsole}
              className="mt-8 w-full py-3 bg-primary text-on-primary hover:brightness-110 active:scale-95 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
            >
              Start Pro 14-Day Trial
            </button>
          </div>

        </div>
      </section>

      {/* Section 8: FAQ Accordion */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full ${badgeClass}`}>❓ Common Inquiries</span>
          <h2 className={`font-display-lg text-3xl md:text-5xl font-extrabold tracking-tighter ${headingClass}`}>
            Frequently Asked Questions
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${subheadingClass}`}>
            Find swift answers to our bank integration, SEBI compatibility, and neural advisory engine.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div 
                key={index} 
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${glassCardClass}`}
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full py-4.5 px-6 flex justify-between items-center text-left font-bold text-sm sm:text-base cursor-pointer focus:outline-none bg-transparent border-none text-current"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 ' + primaryTextClass : ''}`}>
                    keyboard_arrow_down
                  </span>
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-40 border-t border-glass-border/10 p-6' : 'max-h-0'
                  } overflow-hidden`}
                >
                  <p className={`text-xs sm:text-sm leading-relaxed text-left ${descTextClass}`}>
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 9: Final CTA Banner */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 border-t border-glass-border/10">
        <div className="max-w-5xl mx-auto p-8 sm:p-14 bg-gradient-to-r from-[#0052cc] via-[#00b4d8] to-[#10b981] rounded-3xl text-center space-y-6 relative overflow-hidden shadow-2xl">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[#000]/10 pointer-events-none z-0"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
              Command Your Capital Clearly Today
            </h2>
            <p className="text-xs sm:text-base text-white/90 leading-relaxed max-w-xl mx-auto">
              Unlock our dynamic advisors, catalog expense pipelines, and configure target compound horizons. Start optimization for free.
            </p>
            <div className="pt-4">
              <button
                onClick={onEnterConsole}
                className="px-8 py-4 bg-white text-slate-900 hover:scale-105 active:scale-95 transition-all rounded-xl font-extrabold text-xs md:text-sm tracking-wider uppercase shadow-xl cursor-pointer border-none"
              >
                Get Started Free
              </button>
            </div>
            <div className="flex justify-center gap-6 pt-2 text-[10px] font-bold text-white/80 uppercase tracking-widest">
              <span>✓ 14-day premium trial</span>
              <span>✓ 100% read-only vault</span>
              <span>✓ Instant USD/INR exchange</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t text-center text-[10px] text-slate-500 relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 ${footerBg}`}>
        <div className="text-left space-y-2">
          <Logo size={22} textClass="text-[14px]" variant={theme === 'light' ? 'light' : 'primary'} />
          <p>© 2026 Capitallens Wealth Intelligence. Built for high-net-worth compound command simulations.</p>
        </div>
        <div className="flex gap-6 font-bold uppercase tracking-wider">
          <a href="#" className="hover:text-primary transition-all">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-all">Terms of Console</a>
          <a href="#" className="hover:text-primary transition-all text-[#fb7185]">SEBI Disclaimer</a>
        </div>
      </footer>

    </div>
  );
}
