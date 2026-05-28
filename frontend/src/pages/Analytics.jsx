import React, { useEffect, useState } from 'react';
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
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  Activity,
  Clock,
} from 'lucide-react';
import {
  fetchAnalyticsSummary,
  fetchAnalyticsByCategory,
  fetchAnalyticsMonthlyTrend,
  fetchAnalyticsRecent,
} from '../api/analytics';

const COLORS = ['#34d399', '#22d3ee', '#a78bfa', '#f97316', '#f472b6', '#eab308'];

function formatCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SummaryItem({ label, value, sub, variant }) {
  return (
    <div className={`anx-summary-card anx-summary-card--${variant}`}>
      <p className="anx-summary-label">{label}</p>
      <p className="anx-summary-value">{value}</p>
      {sub && <p className="anx-summary-sub">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState({ income_by_category: [], expense_by_category: [] });
  const [monthly, setMonthly] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [s, cat, trend, rec] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchAnalyticsByCategory(),
          fetchAnalyticsMonthlyTrend(),
          fetchAnalyticsRecent(),
        ]);
        setSummary(s);
        setByCategory(cat);
        setMonthly(trend);
        setRecent(rec);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading && !summary) {
    return (
      <div className="txn-loading">
        <Activity size={28} className="txn-spin" />
        <p>Computing insights…</p>
      </div>
    );
  }

  return (
    <div className="anx-page animate-in">
      {error && (
        <div className="txn-alert" role="alert">
          {error}
        </div>
      )}

      {summary && (
        <div className="anx-summary-grid">
          <SummaryItem
            label="Total income"
            value={formatCurrency(summary.total_income)}
            sub="All time"
            variant="income"
          />
          <SummaryItem
            label="Total expenses"
            value={formatCurrency(summary.total_expense)}
            sub="All time"
            variant="expense"
          />
          <SummaryItem
            label="Savings"
            value={formatCurrency(summary.total_savings)}
            sub={`Savings rate ${summary.savings_rate}%`}
            variant="savings"
          />
          <SummaryItem
            label="Runway"
            value={`${summary.runway_months} months`}
            sub="Current savings / monthly burn"
            variant="runway"
          />
        </div>
      )}

      <div className="anx-row">
        <div className="glass-card tilt-wrap animate-in anx-chart-card">
          <div className="dash-section-title">
            <h3>
              <TrendingUp size={18} /> Monthly trend
            </h3>
            <span className="dash-badge">Last 6 months</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="anxIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anxExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
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
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.25)',
                    fontSize: 12,
                  }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#anxIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fill="url(#anxExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card tilt-wrap animate-in anx-chart-card">
          <div className="dash-section-title">
            <h3>
              <Percent size={18} /> Spend by category
            </h3>
          </div>
          <div className="anx-split">
            <div className="anx-pie">
              <p className="anx-pie-title">
                Expenses
                <span>by category</span>
              </p>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={byCategory.expense_by_category || []}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={50}
                    outerRadius={74}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {(byCategory.expense_by_category || []).map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="anx-legend">
              {(byCategory.expense_by_category || []).map((item, index) => (
                <div key={item.category} className="anx-legend-item">
                  <span
                    className="anx-legend-dot"
                    style={{ background: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p>{item.category}</p>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="anx-row">
        <div className="glass-card tilt-wrap animate-in anx-recent-card">
          <div className="dash-section-title">
            <h3>
              <Clock size={18} /> Recent transactions
            </h3>
            <span className="dash-badge">{recent.length} latest</span>
          </div>
          {recent.length === 0 ? (
            <p className="anx-empty">No recent transactions yet.</p>
          ) : (
            <ul className="anx-recent-list">
              {recent.map((t) => (
                <li key={t.id} className="anx-recent-item">
                  <div className="anx-recent-main">
                    <p className="anx-recent-title">{t.description || t.category}</p>
                    <span className="anx-recent-sub">{t.date}</span>
                  </div>
                  <div className="anx-recent-meta">
                    <span
                      className={`anx-type-chip anx-type-chip--${t.type}`}
                    >
                      {t.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {t.type}
                    </span>
                    <span className={`anx-recent-amount anx-recent-amount--${t.type}`}>
                      {t.type === 'income' ? '+' : '−'}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

