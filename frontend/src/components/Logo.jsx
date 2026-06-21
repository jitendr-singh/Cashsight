import React from 'react';

export default function Logo({
  size = 32,
  variant = 'primary', // 'primary' | 'dark' | 'light' | 'monochrome' | 'icon' | 'favicon'
  layout = 'horizontal', // 'horizontal' | 'vertical'
  textClass = '',
  className = ''
}) {
  // 1. Color Palette Definitions based on Variant
  const isLight = variant === 'light';
  const isMonochrome = variant === 'monochrome';
  const isFavicon = variant === 'favicon';
  const isIconOnly = variant === 'icon' || isFavicon;

  // Text Colors
  const textCapitalColor = isLight 
    ? 'text-slate-900' 
    : isMonochrome 
    ? 'text-current' 
    : 'text-white';

  const textLensGradient = isMonochrome
    ? 'text-current'
    : 'bg-gradient-to-r from-[#00d2ff] to-[#10b981] bg-clip-text text-transparent';

  const sloganColor = isLight
    ? 'text-slate-500'
    : isMonochrome
    ? 'text-current opacity-70'
    : 'text-slate-400/80';

  const separatorBg = isLight
    ? 'bg-slate-300'
    : isMonochrome
    ? 'bg-current opacity-30'
    : 'bg-slate-700/60';

  // SVG Stroke/Fill Colors
  const ringStroke = isMonochrome ? 'currentColor' : 'url(#lens-ring-grad)';
  const barFill = isMonochrome ? 'currentColor' : 'url(#lens-bar-grad)';

  // Render App Icon / Favicon Variant
  if (isFavicon) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fav-bg-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0052cc" />
              <stop offset="50%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#fav-bg-grad)" />
          {/* Simplified Geometric Lens Icon inside */}
          <circle cx="48" cy="48" r="18" stroke="#ffffff" strokeWidth="5.5" fill="none" />
          <line x1="61" y1="61" x2="73" y2="73" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" />
          <rect x="35" y="52" width="5" height="10" rx="1" fill="#ffffff" />
          <rect x="44.5" y="44" width="5" height="18" rx="1" fill="#ffffff" />
          <rect x="54" y="36" width="5" height="26" rx="1" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Render Icon-only Variant
  if (isIconOnly) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="lens-ring-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0052cc" />
            <stop offset="60%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
          <linearGradient id="lens-bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="24" stroke={ringStroke} strokeWidth="6.5" fill="none" />
        <line x1="65" y1="65" x2="79" y2="79" stroke={ringStroke} strokeWidth="7.5" strokeLinecap="round" />
        <rect x="34" y="52" width="5.5" height="12" rx="1.5" fill={barFill} />
        <rect x="44.5" y="42" width="5.5" height="22" rx="1.5" fill={barFill} />
        <rect x="55" y="32" width="5.5" height="32" rx="1.5" fill={barFill} />
      </svg>
    );
  }

  // Render Horizontal vs Vertical Stacked Layouts
  const isVertical = layout === 'vertical';

  return (
    <div className={`select-none ${isVertical ? 'flex flex-col items-center text-center gap-4 w-full' : 'flex items-center gap-3.5'} ${className}`}>
      {/* 1. Logo Icon */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <defs>
          <linearGradient id="lens-ring-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0052cc" />
            <stop offset="60%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
          <linearGradient id="lens-bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="24" stroke={ringStroke} strokeWidth="6.5" fill="none" />
        <line x1="65" y1="65" x2="79" y2="79" stroke={ringStroke} strokeWidth="7.5" strokeLinecap="round" />
        <rect x="34" y="52" width="5.5" height="12" rx="1.5" fill={barFill} />
        <rect x="44.5" y="42" width="5.5" height="22" rx="1.5" fill={barFill} />
        <rect x="55" y="32" width="5.5" height="32" rx="1.5" fill={barFill} />
      </svg>

      {/* 2. Vertical Line Separator (Horizontal Layout only) */}
      {!isVertical && (
        <div className={`w-[1px] ${separatorBg} self-center`} style={{ height: Math.max(16, size * 0.8) }} />
      )}

      {/* 3. Text Block */}
      <div className={`flex flex-col ${isVertical ? 'items-center' : 'text-left justify-center'}`}>
        <h1 className={`font-display-lg font-bold tracking-[0.015em] flex items-center leading-none ${textClass}`}>
          <span className={textCapitalColor}>Capital</span>
          <span className={textLensGradient}>lens</span>
        </h1>
        <span className={`text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.14em] font-semibold whitespace-nowrap ${isVertical ? 'mt-2.5' : 'mt-1.5'} ${sloganColor}`}>
          See Your Capital Clearly
        </span>
      </div>
    </div>
  );
}
