import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Menu,
  Bell,
  Search,
  Sparkles,
  ShoppingBag,
  Coffee,
  Car,
  Zap,
  CreditCard,
} from 'lucide-react';
import '../styles/Dashboard.css';

const CASHFLOW_DATA = [
  { month: 'Jan', income: 18000, expense: 12000 },
  { month: 'Feb', income: 21000, expense: 14000 },
  { month: 'Mar', income: 19500, expense: 11000 },
  { month: 'Apr', income: 24000, expense: 15500 },
  { month: 'May', income: 25000, expense: 12000 },
  { month: 'Jun', income: 26500, expense: 13200 },
];

const EXPENSE_BREAKDOWN = [
  { name: 'Housing', value: 35, color: '#34d399' },
  { name: 'Food', value: 22, color: '#22d3ee' },
  { name: 'Transport', value: 18, color: '#a78bfa' },
  { name: 'Other', value: 25, color: '#f472b6' },
];

const RECENT_ACTIVITY = [
  { id: 1, label: 'Salary deposit', category: 'Income', amount: 8500, type: 'in', icon: DollarSign },
  { id: 2, label: 'Grocery Mart', category: 'Food', amount: -1240, type: 'out', icon: ShoppingBag },
  { id: 3, label: 'Uber ride', category: 'Transport', amount: -320, type: 'out', icon: Car },
  { id: 4, label: 'Freelance payout', category: 'Income', amount: 3200, type: 'in', icon: Zap },
  { id: 5, label: 'Coffee House', category: 'Food', amount: -180, type: 'out', icon: Coffee },
];

const WEEKLY_BARS = [
  { label: 'Mon', h: 62 },
  { label: 'Tue', h: 78 },
  { label: 'Wed', h: 45 },
  { label: 'Thu', h: 88 },
  { label: 'Fri', h: 72 },
  { label: 'Sat', h: 55 },
  { label: 'Sun', h: 40 },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function useTilt(intensity = 8) {
  const ref = useRef(null);

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rx', `${-y * intensity}deg`);
      el.style.setProperty('--ry', `${x * intensity}deg`);
    },
    [intensity]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return { ref, onMove, onLeave };
}

function AnimatedValue({ value, prefix = '₹', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      start = numeric * eased;
      setDisplay(start);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numeric, duration]);

  return (
    <>
      {prefix}
      {display.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </>
  );
}

function TiltCard({ children, className = '', glow = 'emerald', delay = 0 }) {
  const { ref, onMove, onLeave } = useTilt(10);

  return (
    <div className="tilt-wrap animate-in" style={{ animationDelay: `${delay}ms` }}>
      <div
        ref={ref}
        className={`tilt-card glass-card ${className}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div className="glass-card__shine" aria-hidden />
        <div className={`glass-card__glow glass-card__glow--${glow}`} aria-hidden />
        {children}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ color: '#94a3b8', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: 0, fontWeight: 600 }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

function DashboardHome() {
  return (
    <>
      <div className="dash-metrics stagger">
        <TiltCard glow="emerald" delay={0}>
          <div className="metric-icon">
            <Wallet size={18} />
          </div>
          <p className="metric-label">Net Balance</p>
          <p className="metric-value">
            <AnimatedValue value={45000} />
          </p>
          <span className="metric-delta metric-delta--up">
            <ArrowUpRight size={12} /> +5.2% MTD
          </span>
        </TiltCard>

        <TiltCard glow="cyan" delay={80}>
          <div className="metric-icon">
            <DollarSign size={18} />
          </div>
          <p className="metric-label">Total Income</p>
          <p className="metric-value metric-value--income">
            <AnimatedValue value={25000} />
          </p>
          <span className="metric-delta metric-delta--up">
            <ArrowUpRight size={12} /> +12% vs last month
          </span>
        </TiltCard>

        <TiltCard glow="rose" delay={160}>
          <div className="metric-icon">
            <ArrowDownRight size={18} />
          </div>
          <p className="metric-label">Total Expenses</p>
          <p className="metric-value metric-value--expense">
            <AnimatedValue value={12000} />
          </p>
          <span className="metric-delta metric-delta--down">
            <ArrowDownRight size={12} /> -3.1% burn rate
          </span>
        </TiltCard>

        <TiltCard glow="violet" delay={240}>
          <div className="metric-icon">
            <Percent size={18} />
          </div>
          <p className="metric-label">Net Profit</p>
          <p className="metric-value">
            <AnimatedValue value={13000} />
          </p>
          <span className="metric-delta metric-delta--up">
            <Sparkles size={12} /> Savings on track
          </span>
        </TiltCard>
      </div>

      <div className="dash-charts-row">
        <TiltCard className="animate-in" glow="emerald" delay={300}>
          <div className="dash-section-title">
            <h3>
              <TrendingUp size={18} /> Cash Flow Overview
            </h3>
            <span className="dash-badge">6 months</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={CASHFLOW_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard className="animate-in" glow="violet" delay={380}>
          <div className="dash-section-title">
            <h3>
              <BarChart3 size={18} /> Spend Mix
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={EXPENSE_BREAKDOWN}
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {EXPENSE_BREAKDOWN.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {EXPENSE_BREAKDOWN.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        boxShadow: `0 0 8px ${item.color}`,
                      }}
                    />
                    {item.name}
                  </span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="dash-charts-row">
        <TiltCard className="animate-in" glow="cyan" delay={460}>
          <div className="dash-section-title">
            <h3>
              <Zap size={18} /> Weekly Pulse
            </h3>
            <span className="dash-badge">Live</span>
          </div>
          <div className="bars-3d">
            {WEEKLY_BARS.map((bar, i) => (
              <div key={bar.label} className="bar-3d" style={{ animationDelay: `${i * 0.08}s` }}>
                <div
                  className="bar-3d__col"
                  style={{
                    height: `${bar.h}%`,
                    animationDelay: `${0.3 + i * 0.08}s`,
                    background:
                      i === 3
                        ? 'linear-gradient(180deg, #22d3ee, #0891b2)'
                        : 'linear-gradient(180deg, #6ee7b7, #059669)',
                  }}
                />
                <span className="bar-3d__label">{bar.label}</span>
              </div>
            ))}
          </div>
        </TiltCard>

        <TiltCard className="animate-in" glow="emerald" delay={540}>
          <div className="dash-section-title">
            <h3>
              <CreditCard size={18} /> Recent Activity
            </h3>
          </div>
          <div className="dash-activity">
            {RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="activity-item"
                  style={{ animationDelay: `${0.4 + i * 0.06}s` }}
                >
                  <div className={`activity-icon activity-icon--${item.type}`}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {item.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{item.category}</p>
                  </div>
                  <span className={`activity-amount--${item.type}`}>
                    {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </TiltCard>
      </div>

      <div className="dash-stats-row stagger" style={{ marginTop: '1.5rem' }}>
        {[
          { label: 'Savings Rate', sub: 'Of net income', value: 52, color: '#34d399' },
          { label: 'Transactions', sub: 'This month', value: 24, color: '#22d3ee', suffix: '' },
          { label: 'Categories', sub: 'Being tracked', value: 8, color: '#a78bfa', suffix: '' },
        ].map((stat, i) => (
          <TiltCard key={stat.label} glow="emerald" delay={600 + i * 80}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="metric-label" style={{ marginBottom: 4 }}>
                  {stat.label}
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{stat.sub}</p>
              </div>
              {stat.suffix === '' ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: stat.color,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {stat.value}
                </p>
              ) : (
                <div className="stat-ring">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="5" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke={stat.color}
                      strokeWidth="5"
                      strokeDasharray={`${(stat.value / 100) * 150.8} 150.8`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="stat-ring__value">{stat.value}%</span>
                </div>
              )}
            </div>
          </TiltCard>
        ))}
      </div>
    </>
  );
}

function PlaceholderSection({ icon: Icon, title, description }) {
  return (
    <div className="glass-card dash-placeholder animate-in">
      <div className="dash-placeholder__icon">
        <Icon size={28} />
      </div>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('No token found. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not validate credentials');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const navigate = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const initials = user?.name ? user.name.substring(0, 2) : 'CS';
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__ring" />
        <p>Initializing Cashsight intelligence…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error-screen">
        <div className="glass-card" style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#f87171', fontWeight: 600, marginBottom: '1rem' }}>⚠️ {error}</p>
          <button type="button" className="dash-logout" style={{ justifyContent: 'center', color: '#fff', background: '#ef4444' }} onClick={handleLogout}>
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root">
      <div className="dash-scene" aria-hidden>
        <div className="dash-orb dash-orb--1" />
        <div className="dash-orb dash-orb--2" />
        <div className="dash-orb dash-orb--3" />
        <div className="dash-scene__grid" />
        <div className="dash-noise" />
      </div>

      <div
        className={`dash-overlay ${sidebarOpen ? 'dash-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar--open' : ''}`}>
        <div className="dash-sidebar__brand">
          <div className="dash-sidebar__logo">
            <TrendingUp size={20} />
          </div>
          <span className="dash-sidebar__title">Cashsight</span>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`dash-nav__item ${activeSection === id ? 'dash-nav__item--active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar__footer">
          <div className="dash-user">
            <div className="dash-user__avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p className="dash-user__name">{user?.name || 'User'}</p>
              <p className="dash-user__email">{user?.email || 'email@example.com'}</p>
            </div>
          </div>
          <button type="button" className="dash-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-header__left">
            <button
              type="button"
              className="dash-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1>
                Welcome back, <span>{firstName}</span>
              </h1>
              <p className="dash-header__sub">Your financial command center is live.</p>
            </div>
          </div>
          <div className="dash-header__actions">
            <span className="dash-pill">
              <Search size={12} /> Search
            </span>
            <span className="dash-pill">
              <Bell size={12} /> Alerts
            </span>
            <span className="dash-pill dash-pill--live">Live sync</span>
            <span className="dash-pill">{monthLabel}</span>
          </div>
        </header>

        <div className="dash-content">
          {activeSection === 'dashboard' && <DashboardHome />}

          {activeSection === 'transactions' && (
            <PlaceholderSection
              icon={ArrowLeftRight}
              title="Transactions Hub"
              description="Add, filter, and reconcile transactions in real time. This module will connect to your database and Pandas engine in the next release."
            />
          )}

          {activeSection === 'analytics' && (
            <PlaceholderSection
              icon={BarChart3}
              title="Advanced Analytics"
              description="AI-powered insights, category trimming recommendations, and dynamic Recharts visualizations — shipping in the next phase."
            />
          )}

          {activeSection === 'settings' && (
            <TiltCard className="dash-settings animate-in" glow="violet">
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                Account Settings
              </h2>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Manage your profile and identity.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="dash-label" htmlFor="settings-name">
                    Full Name
                  </label>
                  <input id="settings-name" className="dash-input" type="text" defaultValue={user?.name} readOnly />
                </div>
                <div>
                  <label className="dash-label" htmlFor="settings-email">
                    Email
                  </label>
                  <input id="settings-email" className="dash-input" type="email" defaultValue={user?.email} readOnly />
                </div>
              </div>
            </TiltCard>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
