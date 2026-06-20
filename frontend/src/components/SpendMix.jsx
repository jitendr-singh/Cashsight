import React, { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { analyticsService } from '../services/api';

// A fixed palette — assigned per index so colors are stable
const PALETTE = [
  { bg: 'bg-violet-accent',       hex: '#a78bfa', shadow: 'rgba(167, 139, 250, 0.45)', border: 'border-l-violet-accent',       text: 'text-violet-accent'       },
  { bg: 'bg-rose-expense',        hex: '#fb7185', shadow: 'rgba(251, 113, 133, 0.45)', border: 'border-l-rose-expense',        text: 'text-rose-expense'        },
  { bg: 'bg-secondary-fixed-dim', hex: '#2fd9f4', shadow: 'rgba(47, 217, 244, 0.45)',  border: 'border-l-secondary-fixed-dim', text: 'text-secondary-fixed-dim' },
  { bg: 'bg-emerald-glow',        hex: '#6ee7b7', shadow: 'rgba(110, 231, 183, 0.45)', border: 'border-l-emerald-glow',        text: 'text-emerald-glow'        },
  { bg: 'bg-amber-400',           hex: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.45)',  border: 'border-l-amber-400',           text: 'text-amber-400'           },
  { bg: 'bg-pink-400',            hex: '#f472b6', shadow: 'rgba(244, 114, 182, 0.45)', border: 'border-l-pink-400',            text: 'text-pink-400'            },
];

const DEFAULT_EXPENSES = [
  { category: 'Housing',   amount: 4980.00 },
  { category: 'Food',      amount: 3112.50 },
  { category: 'Transport', amount: 1245.00 },
  { category: 'Other',     amount: 3112.50 },
];

const CIRC = 251.2; // 2π × 40

export default function SpendMix({ categoryData }) {
  const { formatCurrency, currencySymbol } = useCurrency();

  // ── Toggle state: 'month' | 'all' ────────────────────────────────────────
  const [scope, setScope] = useState('month');
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch when scope changes
  const fetchByScope = useCallback(async (s) => {
    setLoading(true);
    try {
      const result = await analyticsService.getByCategory(s);
      setLiveData(result);
    } catch {
      setLiveData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchByScope(scope);
  }, [scope, fetchByScope]);

  // ── Resolve data source ───────────────────────────────────────────────────
  // Priority: liveData (from toggle fetch) > categoryData prop (initial load) > default
  const source = liveData || categoryData;
  const rawExpenses =
    source?.expense_by_category?.length > 0
      ? source.expense_by_category
      : DEFAULT_EXPENSES;

  // Sort descending by amount → highest spender first → attach palette color
  const expenses = [...rawExpenses]
    .map((item) => ({ ...item, amount: parseFloat(item.amount) || 0 }))
    .sort((a, b) => b.amount - a.amount)
    .map((item, i) => ({ ...item, color: PALETTE[i % PALETTE.length] }));

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  // ── Label ─────────────────────────────────────────────────────────────────
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const scopeLabel = scope === 'month' ? monthLabel : 'ALL TIME';

  // ── Total formatted ───────────────────────────────────────────────────────
  const formatTotalK = (val) => {
    if (val >= 1_000_000) return `${currencySymbol}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1000)      return `${currencySymbol}${(val / 1000).toFixed(1)}k`;
    return formatCurrency(val);
  };

  // ── SVG donut segments ────────────────────────────────────────────────────
  let accumulated = 0;
  const segments = expenses.map((item) => {
    const pct    = total > 0 ? (item.amount / total) * 100 : 0;
    const dash   = (pct / 100) * CIRC;
    const offset = CIRC - (accumulated / 100) * CIRC;
    accumulated += pct;
    return { ...item, pct: Math.round(pct * 10) / 10, dash, offset };
  });

  const topTwo = segments.slice(0, 2);

  return (
    <div className="lg:col-span-7 flex flex-col gap-6">

      {/* ── Spend Mix Donut Card ─────────────────────────────────────────────── */}
      <div className="midnight-glass p-6 md:p-card-padding rounded-xl flex flex-col cursor-default">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-lg md:text-[18px] text-text-primary">
            Spend Mix
          </h3>

          {/* Toggle pill */}
          <div className="flex items-center gap-0.5 bg-surface-variant/30 rounded-lg p-0.5 border border-glass-border/30">
            <button
              onClick={() => setScope('month')}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
                scope === 'month'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-on-surface-variant hover:text-text-primary'
              }`}
            >
              {monthLabel}
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
                scope === 'all'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-on-surface-variant hover:text-text-primary'
              }`}
            >
              ALL TIME
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8">

          {/* ── Radial SVG Donut ────────────────────────────────────────────── */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg
              className={`w-full h-full -rotate-90 transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}
              viewBox="0 0 100 100"
            >
              {/* Background track */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor"
                strokeWidth="12" className="text-surface-variant/20" />

              {/* Segments — reverse order so index-0 is on top */}
              {[...segments].reverse().map((seg, ri) => {
                const idx = segments.length - 1 - ri;
                return (
                  <circle
                    key={idx}
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke={seg.color.hex}
                    strokeWidth="12"
                    strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                    strokeDashoffset={seg.offset}
                    style={{ filter: `drop-shadow(0 0 4px ${seg.color.shadow})` }}
                  />
                );
              })}
            </svg>

            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-on-surface-variant text-[9px] font-label-caps tracking-wider opacity-60">
                {loading ? '...' : 'TOTAL'}
              </span>
              <span className="text-xl font-stat-lg text-text-primary font-bold">
                {formatTotalK(total)}
              </span>
            </div>
          </div>

          {/* ── Legend ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1 w-full">
            {expenses.length === 0 ? (
              <p className="col-span-2 text-xs text-on-surface-variant opacity-60 text-center">
                No expense data for {scopeLabel.toLowerCase()}
              </p>
            ) : segments.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.color.bg}`} />
                <span className="text-xs font-body-base text-on-surface-variant truncate">
                  {item.category}
                  <span className="ml-1 opacity-60">({item.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top 2 Category Detail Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topTwo.map((item, i) => (
          <div
            key={i}
            className={`midnight-glass p-4 rounded-xl border-l-2 cursor-default transition-opacity duration-300 ${item.color.border} ${loading ? 'opacity-40' : 'opacity-100'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-body-bold text-sm text-text-primary font-semibold truncate pr-2">
                {item.category}
              </span>
              <span className={`text-label-caps text-xs font-bold flex-shrink-0 ${item.color.text}`}>
                {item.pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${item.color.bg}`}
                style={{ width: `${Math.min(item.pct, 100)}%` }}
              />
            </div>

            <p className="text-[10px] text-on-surface-variant">
              {formatCurrency(item.amount)}{' '}
              <span className="opacity-70">
                {scope === 'month' ? 'spent this month' : 'spent all-time'}
              </span>
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
