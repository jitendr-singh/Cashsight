import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { analyticsService } from '../services/api';

export default function WealthGrowthChart({ summaryData }) {
  const { currency, currencySymbol, formatCurrency } = useCurrency();
  
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [activeTimeframe, setActiveTimeframe] = useState('7D');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    trajectory: [],
    deltas: []
  });

  // Calculate compact values for the Y-axis scale
  const formatCompact = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);

    if (currency === 'INR') {
      if (absVal >= 10000000) {
        return `${isNegative ? '-' : ''}${currencySymbol}${(absVal / 10000000).toFixed(1)}Cr`;
      }
      if (absVal >= 100000) {
        return `${isNegative ? '-' : ''}${currencySymbol}${(absVal / 100000).toFixed(1)}L`;
      }
      if (absVal >= 1000) {
        return `${isNegative ? '-' : ''}${currencySymbol}${(absVal / 1000).toFixed(0)}k`;
      }
      return `${isNegative ? '-' : ''}${currencySymbol}${absVal.toFixed(0)}`;
    } else {
      if (absVal >= 1000000) {
        return `${isNegative ? '-' : ''}${currencySymbol}${(absVal / 1000000).toFixed(1)}M`;
      }
      if (absVal >= 1000) {
        return `${isNegative ? '-' : ''}${currencySymbol}${(absVal / 1000).toFixed(0)}k`;
      }
      return `${isNegative ? '-' : ''}${currencySymbol}${absVal.toFixed(0)}`;
    }
  };

  // Helper helper to generate ISO date strings relative to today
  const getDates = (daysAgo) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Sync timeframe data from FastAPI /analytics/range API
  useEffect(() => {
    let active = true;

    const loadOfflineFallback = () => {
      const currentBalance = summaryData?.total_savings ?? 1248592;
      let labels = [];
      let deltas = [];

      if (activeTimeframe === '7D') {
        labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        deltas = [12000, 15000, -8000, 25000, 10000, 35000, 5000];
      } else if (activeTimeframe === '1M') {
        // chosen calendar month fallback
        const [year, monthStr] = selectedMonth.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(monthStr);
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = monthNames[monthNum - 1];

        labels = Array.from({ length: lastDay }, (_, i) => `${i + 1} ${monthLabel}`);
        deltas = Array.from({ length: lastDay }, (_, i) => {
          const seed = i + monthNum;
          const x = Math.sin(seed) * 10000;
          return Math.round((x - Math.floor(x)) * 8000 - 3000);
        });
      } else if (activeTimeframe === '1Y') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        deltas = [45000, 62000, 35000, 58000, 71000, 85000, 42000, 69000, 53000, 92000, 80000, 95000];
      } else if (activeTimeframe === 'MAX') {
        labels = ['2022', '2023', '2024', '2025', '2026'];
        deltas = [350000, 420000, 510000, 680000, 850000];
      }

      const trajectory = new Array(deltas.length);
      let runningSavings = currentBalance;
      trajectory[deltas.length - 1] = runningSavings;
      for (let i = deltas.length - 1; i > 0; i--) {
        runningSavings -= deltas[i];
        trajectory[i - 1] = runningSavings;
      }

      setChartData({ labels, trajectory, deltas });
    };

    async function loadData() {
      setLoading(true);
      try {
        let response = null;
        if (activeTimeframe === '7D') {
          const { startDate, endDate } = getDates(6);
          response = await analyticsService.getRangeData({
            view_mode: 'custom',
            start_date: startDate,
            end_date: endDate
          });
        } else if (activeTimeframe === '1M') {
          const [year, monthStr] = selectedMonth.split('-');
          const yearNum = parseInt(year);
          const monthNum = parseInt(monthStr);
          const lastDay = new Date(yearNum, monthNum, 0).getDate();
          response = await analyticsService.getRangeData({
            view_mode: 'custom',
            start_date: `${year}-${monthStr}-01`,
            end_date: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
          });
        } else if (activeTimeframe === '1Y') {
          response = await analyticsService.getRangeData({
            view_mode: 'month',
            year: new Date().getFullYear()
          });
        } else if (activeTimeframe === 'MAX') {
          response = await analyticsService.getRangeData({
            view_mode: 'year',
            from_year: 2022,
            to_year: new Date().getFullYear()
          });
        }

        if (!active) return;

        if (!response || !response.labels || response.labels.length === 0) {
          loadOfflineFallback();
        } else {
          const labels = response.labels;
          const deltas = response.savings || response.income.map((inc, idx) => inc - (response.expense[idx] || 0));
          const currentBalance = summaryData?.total_savings ?? 1248592;

          const trajectory = new Array(deltas.length);
          let runningSavings = currentBalance;
          trajectory[deltas.length - 1] = runningSavings;
          for (let i = deltas.length - 1; i > 0; i--) {
            runningSavings -= deltas[i];
            trajectory[i - 1] = runningSavings;
          }

          setChartData({ labels, trajectory, deltas });
        }
      } catch (err) {
        console.warn('[Wealth Chart API Error] falling back to mockup trajectory', err);
        if (active) loadOfflineFallback();
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [activeTimeframe, selectedMonth, summaryData]);

  // Loading skeleton structure
  if (loading) {
    return (
      <div className="mb-8">
        <div className="midnight-glass p-6 md:p-card-padding rounded-xl animate-pulse min-h-[350px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-48 bg-surface-variant/40 rounded"></div>
            <div className="h-8 w-64 bg-surface-variant/40 rounded"></div>
          </div>
          <div className="flex-1 my-4 flex items-end justify-between gap-4">
            <div className="w-full bg-surface-variant/20 rounded h-1/3"></div>
            <div className="w-full bg-surface-variant/20 rounded h-1/2"></div>
            <div className="w-full bg-surface-variant/20 rounded h-2/3"></div>
            <div className="w-full bg-surface-variant/20 rounded h-1/3"></div>
            <div className="w-full bg-surface-variant/20 rounded h-4/5"></div>
            <div className="w-full bg-surface-variant/20 rounded h-full"></div>
          </div>
          <div className="h-4 w-full bg-surface-variant/40 rounded pt-2"></div>
        </div>
      </div>
    );
  }

  const { labels, trajectory, deltas } = chartData;
  const minVal = Math.min(...trajectory);
  const maxVal = Math.max(...trajectory);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const totalValue = trajectory[trajectory.length - 1] ?? 0;
  const currentDelta = deltas[deltas.length - 1] ?? 0;

  // Generate a dynamic timeline range string for subtitle
  const getRangeSubtitle = () => {
    if (!labels || labels.length === 0) return '';
    const start = labels[0];
    const end = labels[labels.length - 1];

    if (activeTimeframe === '7D') {
      return `Last 7 Days (${start} - ${end})`;
    }
    if (activeTimeframe === '1M') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [year, monthStr] = selectedMonth.split('-');
      const monthLabel = monthNames[parseInt(monthStr) - 1];
      return `Month of ${monthLabel} ${year} (${start} - ${end})`;
    }
    if (activeTimeframe === '1Y') {
      return `Current Year (${start} - ${end})`;
    }
    return `All Time (${start} - ${end})`;
  };

  // Generate timeframe-aware labels for Savings Delta
  const getDeltaLabel = (val) => {
    const isNegative = val < 0;
    const action = isNegative ? 'Spent' : 'Saved';

    if (activeTimeframe === '7D' || activeTimeframe === '1M') {
      return `${action} this Day`;
    }
    if (activeTimeframe === '1Y') {
      return `${action} this Month`;
    }
    return `${action} this Year`;
  };

  const getDeltaDisplayLabel = () => {
    if (activeTimeframe === '7D' || activeTimeframe === '1M') {
      return 'this day';
    }
    if (activeTimeframe === '1Y') {
      return 'this month';
    }
    return 'this year';
  };

  return (
    <div className="mb-8">
      <div className="midnight-glass p-5 md:p-card-padding rounded-xl cursor-default relative overflow-hidden">
        {/* Ambient background accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/3 rounded-full blur-3xl pointer-events-none"></div>

        {/* Dashboard widget header layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest font-outfit mb-0.5 block">
              Wealth Growth Trajectory
            </span>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-display-lg text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-outfit leading-none">
                {formatCurrency(totalValue)}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentDelta >= 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-rose-expense/10 text-rose-expense border border-rose-expense/20'
                }`}>
                {currentDelta >= 0 ? '+' : ''}{formatCurrency(currentDelta, 0)} {getDeltaDisplayLabel()}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant/50 font-medium tracking-wide">
              {getRangeSubtitle()}
            </p>
          </div>

          {/* Controls section (Tabs & Month Picker) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {activeTimeframe === '1M' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthStr())}
                className="bg-[#1e293b]/70 border border-glass-border rounded-lg px-2.5 py-1 text-[11px] font-bold text-primary focus:outline-none cursor-pointer focus:border-primary/50 transition-colors [color-scheme:dark]"
              />
            )}

            <div className="flex bg-surface-variant/30 p-1 rounded-lg border border-glass-border">
              {['7D', '1M', '1Y', 'MAX'].map((timeframe) => {
                const isActive = activeTimeframe === timeframe;
                return (
                  <button
                    key={timeframe}
                    onClick={() => {
                      setHoveredIdx(null);
                      if (timeframe === '1M') {
                        setSelectedMonth(getCurrentMonthStr());
                      } else {
                        setSelectedMonth('trailing');
                      }
                      setActiveTimeframe(timeframe);
                    }}
                    className={`px-3 py-1 text-[11px] font-bold tracking-wider rounded transition-all cursor-pointer ${isActive
                        ? 'text-primary bg-primary/15 border border-primary/20'
                        : 'text-on-surface-variant/70 hover:text-primary'
                      }`}
                  >
                    {timeframe}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hybrid Render Content Area */}
        <div className="relative w-full h-[180px] md:h-[220px]">
          {activeTimeframe === '7D' ? (
            /* --- 7D VIEW: Sleek Dynamic Bar Chart --- */
            <div className="w-full h-full flex items-end justify-between gap-2 md:gap-4 px-2 pb-6 border-b border-glass-border/30">
              {trajectory.map((val, index) => {
                const heightPct = ((val - minVal) / range) * 80 + 20; // values scaled between 20% and 100% height
                const delta = deltas[index];

                return (
                  <div
                    key={index}
                    style={{ height: `${heightPct}%` }}
                    className="flex-1 bg-gradient-to-t from-primary/10 to-primary/30 hover:from-primary/20 hover:to-primary/50 rounded-t-sm relative group cursor-crosshair transition-all duration-300 border border-primary/15 hover:border-primary/45 hover:shadow-[0_0_12px_rgba(90,240,179,0.1)]"
                  >
                    {/* Visual cap border */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-primary rounded-t-sm"></div>

                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#0e1624]/95 border border-primary/30 text-text-primary p-2.5 rounded-xl shadow-2xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap backdrop-blur-md">
                      <div className="text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">
                        {labels[index]}
                      </div>
                      <div className="text-[11px] font-extrabold mb-0.5">
                        Total Savings: <span className="text-primary">{formatCurrency(val)}</span>
                      </div>
                      <div className="text-[9px] font-bold text-on-surface-variant/80">
                        {getDeltaLabel(delta)}: <span className={delta >= 0 ? 'text-primary' : 'text-rose-expense'}>
                          {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --- 1M / 1Y / MAX VIEWS: Premium SVG Area Curve --- */
            <div className="w-full h-full relative">
              {/* SVG Curve */}
              <svg
                viewBox="0 0 600 180"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible select-none"
              >
                <defs>
                  {/* Glowing Area Gradient fill */}
                  <linearGradient id="wealth-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5af0b3" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#5af0b3" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Background Grid Lines */}
                <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" strokeDasharray="3,3" />

                {/* Math Mapping coordinates */}
                {(() => {
                  const N = trajectory.length;
                  const pts = trajectory.map((val, idx) => {
                    const x = (idx / (N - 1)) * 600;
                    const y = 160 - ((val - minVal) / range) * 140; // scales curve vertically between y=20 and y=160
                    return { x, y };
                  });

                  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaD = `${lineD} L 600 160 L 0 160 Z`;

                  return (
                    <>
                      {/* Gradient Fill Path */}
                      <path d={areaD} fill="url(#wealth-gradient)" />
                      {/* Glowing Line Path */}
                      <path
                        d={lineD}
                        fill="none"
                        stroke="#5af0b3"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_4px_rgba(90,240,179,0.3)]"
                      />

                      {/* Snap Crosshair Guide */}
                      {hoveredIdx !== null && pts[hoveredIdx] && (
                        <>
                          <line
                            x1={pts[hoveredIdx].x}
                            y1="20"
                            x2={pts[hoveredIdx].x}
                            y2="160"
                            stroke="rgba(90, 240, 179, 0.2)"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                          />
                          <circle
                            cx={pts[hoveredIdx].x}
                            cy={pts[hoveredIdx].y}
                            r="5"
                            fill="#5af0b3"
                            className="drop-shadow-[0_0_8px_#5af0b3]"
                          />
                          <circle
                            cx={pts[hoveredIdx].x}
                            cy={pts[hoveredIdx].y}
                            r="9"
                            fill="none"
                            stroke="rgba(90, 240, 179, 0.3)"
                            strokeWidth="1.5"
                          />
                        </>
                      )}

                      {/* Invisible segments overlays for magnetic click/hover snap */}
                      {pts.map((p, i) => {
                        const segWidth = 600 / N;
                        const startX = p.x - segWidth / 2;
                        return (
                          <rect
                            key={i}
                            x={Math.max(0, startX)}
                            y="0"
                            width={segWidth}
                            height="160"
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseMove={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onTouchMove={(e) => {
                              const touch = e.touches[0];
                              const rect = e.currentTarget.getBoundingClientRect();
                              const touchX = touch.clientX - rect.left;
                              const pct = Math.min(1, Math.max(0, touchX / rect.width));
                              const idx = Math.min(N - 1, Math.floor(pct * N));
                              setHoveredIdx(idx);
                            }}
                            onTouchEnd={() => setHoveredIdx(null)}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              {/* Dynamic Floating Tooltip */}
              {hoveredIdx !== null && trajectory[hoveredIdx] !== undefined && (
                <div
                  style={{
                    left: `${(hoveredIdx / (trajectory.length - 1)) * 100}%`,
                    transform: `translateX(${(hoveredIdx / (trajectory.length - 1)) > 0.8
                        ? '-100%'
                        : (hoveredIdx / (trajectory.length - 1)) < 0.2
                          ? '0%'
                          : '-50%'
                      })`,
                    top: `${Math.max(10, 140 - ((trajectory[hoveredIdx] - minVal) / range) * 140 - 72)}px`
                  }}
                  className="absolute bg-[#0f172a]/95 border border-[#5af0b3]/30 rounded-xl p-3 shadow-2xl z-30 pointer-events-none transition-all duration-150 backdrop-blur-md text-left"
                >
                  <div className="text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">
                    {labels[hoveredIdx]}
                  </div>
                  <div className="text-[11px] font-extrabold text-text-primary mb-0.5 whitespace-nowrap">
                    Total Savings: <span className="text-primary">{formatCurrency(trajectory[hoveredIdx])}</span>
                  </div>
                  <div className="text-[9px] font-bold text-on-surface-variant/80 whitespace-nowrap">
                    {getDeltaLabel(deltas[hoveredIdx])}: <span className={deltas[hoveredIdx] >= 0 ? 'text-primary' : 'text-rose-expense'}>
                      {deltas[hoveredIdx] >= 0 ? '+' : ''}{formatCurrency(deltas[hoveredIdx])}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* X-Axis Scale Guides */}
        <div className="flex justify-between text-on-surface-variant/60 text-[9px] font-bold border-t border-glass-border/30 pt-3 px-2">
          {(() => {
            const N = labels.length;
            // For Line Graph (1M/1Y/MAX): Prune labels on mobile viewport to avoid spacing collissions
            if (activeTimeframe !== '7D') {
              return (
                <>
                  {/* Left Label */}
                  <span className="text-left">{labels[0]}</span>

                  {/* Middle Label (Only rendered on desktop or clearly visible) */}
                  <span className="text-center block sm:hidden">
                    {labels[Math.floor(N / 2)]}
                  </span>
                  <span className="hidden sm:inline-block text-center">
                    {labels[Math.floor(N / 3)]}
                  </span>
                  <span className="hidden sm:inline-block text-center">
                    {labels[Math.floor((2 * N) / 3)]}
                  </span>

                  {/* Right Label */}
                  <span className="text-right text-primary font-bold">{labels[N - 1]}</span>
                </>
              );
            } else {
              // For 7D (Bar graph): Render all days (7 columns fit perfectly)
              return labels.map((lbl, idx) => (
                <span key={idx} className={idx === N - 1 ? 'text-primary font-bold' : ''}>
                  {lbl}
                </span>
              ));
            }
          })()}
        </div>
      </div>
    </div>
  );
}
