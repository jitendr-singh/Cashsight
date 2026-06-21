import React from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
    { id: 'investments', label: 'Investments', icon: 'trending_up' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt_long' },
    { id: 'savings', label: 'Savings Goals', icon: 'savings' },
    { id: 'ai_copilot', label: 'AI Copilot', icon: 'psychology' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[45] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* SideNavBar */}
      <aside
        id="side-nav"
        className={`fixed left-0 top-0 h-full w-[280px] bg-slate-surface backdrop-blur-[20px] border-r border-glass-border shadow-2xl flex flex-col py-margin-page px-gutter-desktop z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Sidebar Header (Logo + Mobile Close Button) */}
        <div className="mb-8 flex justify-between items-center w-full relative">
          <div className="flex-1 w-[180px]">
            <Logo size={60} textClass="text-[35px]" className="origin-left scale-[0.8]" />
          </div>
          <button
            className="lg:hidden p-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer z-10 flex-shrink-0"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg group transition-all relative ${isActive
                  ? 'text-primary font-body-bold bg-primary-container/10'
                  : 'text-on-surface-variant font-body-base hover:bg-surface-variant/50'
                  }`}
              >
                {isActive && <div className="active-link-indicator"></div>}
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[14px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="mt-auto pt-6 border-t border-glass-border space-y-2">
          {/* Upgrade to Pro — Coming Soon */}
          <div className="w-full mb-2 relative overflow-hidden rounded-lg">
            <div className="w-full py-2.5 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/20 text-primary font-bold text-sm text-center rounded-lg select-none">
              Upgrade to Pro
              <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-primary/20 rounded font-bold tracking-wider uppercase">Soon</span>
            </div>
          </div>

          <a
            href="mailto:support@capitallens.com"
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant font-body-base hover:text-primary transition-colors text-left text-sm"
            aria-label="Email Support"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant font-body-base hover:text-rose-expense transition-colors text-left text-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
