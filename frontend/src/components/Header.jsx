import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export default function Header({ onOpenSidebar, activeTab, setActiveTab, searchQuery, onSearchChange }) {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchInputRef = useRef(null);

  // Generate initials from user name (e.g. "John Doe" -> "JD")
  const getInitials = (name) => {
    if (!name) return 'CS';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('');
  };
  const initials = getInitials(user?.name);


  // Global Ctrl+K / Cmd+K listener to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Search transactions...';
      case 'transactions':
        return 'Search transactions...';
      case 'savings':
        return 'Search savings goals...';
      case 'investments':
        return 'Search investments...';
      case 'analytics':
        return 'Search ledger logs...';
      default:
        return 'Search...';
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-16 bg-background/80 backdrop-blur-md border-b border-glass-border flex justify-between items-center px-4 md:px-gutter-desktop z-40">
      
      {/* Left side: Mobile Menu Trigger + Repositioned Search Bar */}
      <div className="flex items-center gap-3 md:gap-6">
        <button
          className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          onClick={onOpenSidebar}
          aria-label="Open Sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Search Bar with Focus Expand & Ctrl+K Keyboard Indicator */}
        <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.03]' : ''}`}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-surface-variant/30 border border-glass-border rounded-full py-1.5 pl-10 pr-12 w-32 xs:w-48 xl:w-64 text-xs text-body-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:opacity-50"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-[#182235]/60 border border-glass-border/40 text-[9px] font-bold text-on-surface-variant opacity-70 px-1 py-0.5 rounded leading-none select-none pointer-events-none hidden md:inline-block">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right side: Currency Switcher & Profile avatar */}
      <div className="flex items-center gap-2.5 md:gap-4 relative">
        
        {/* Currency Switcher Toggle */}
        <button
          onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0a101d]/60 border border-glass-border/40 hover:border-primary/50 rounded-full text-xs font-bold text-on-surface-variant hover:text-primary transition-all duration-300 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          title={`Switch to ${currency === 'INR' ? 'USD' : 'INR'}`}
        >
          <span className="material-symbols-outlined text-[15px] text-primary">currency_exchange</span>
          <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
        </button>

        {/* User Profile Avatar with Popover Actions */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 rounded-full overflow-hidden border border-glass-border hover:border-primary/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30"
            aria-label="Profile menu"
            role="button"
          >
            <span className="text-[11px] font-bold text-primary uppercase leading-none">{initials}</span>
          </div>

          {/* Profile Menu Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-60 bg-[#080e1a]/95 border border-glass-border/40 rounded-xl shadow-2xl p-4.5 z-50 backdrop-blur-md animate-fade-in flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-glass-border flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
                  <span className="text-sm font-bold text-primary uppercase leading-none">{initials}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-text-primary truncate">{user?.name || 'Executive User'}</span>
                  <span className="text-[9px] text-on-surface-variant/80 truncate">{user?.email || 'executive@capitallens.com'}</span>
                </div>
              </div>
              
              <div className="border-t border-glass-border/30"></div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-variant/20 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-none"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Console Settings</span>
                </button>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('dashboard');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-variant/20 transition-all cursor-pointer flex items-center gap-2 bg-transparent border-none"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Command Center</span>
                </button>
              </div>

              <div className="border-t border-glass-border/30"></div>

              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-expense rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
