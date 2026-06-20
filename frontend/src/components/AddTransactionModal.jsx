import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '../context/CurrencyContext';

/**
 * AddTransactionModal — Immersive Ledger Entry
 * Fully responsive: mobile (≤640px), tablet (641-1023px), desktop (≥1024px)
 */
export default function AddTransactionModal({ isOpen, onClose, onSubmit, transaction }) {
  const { currencySymbol } = useCurrency();
  const [amount, setAmount]                   = useState('');
  const [type, setType]                       = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('Shopping');
  const [customCategory, setCustomCategory]   = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [reference, setReference] = useState('');
  const [narrative, setNarrative] = useState('');
  const [submitting, setSubmitting]           = useState(false);

  const particleContainerRef  = useRef(null);
  const particlesInitialized  = useRef(false);
  const backdropRef           = useRef(null);
  const [formError, setFormError] = useState('');

  const categories = [
    { label: 'Shopping',  icon: 'shopping_cart' },
    { label: 'Dining',    icon: 'restaurant' },
    { label: 'Travel',    icon: 'commute' },
    { label: 'Utilities', icon: 'bolt' },
    { label: 'Gadgets',   icon: 'devices' },
    { label: 'Other',     icon: 'grid_view', isOther: true },
  ];

  /* ── Particles ── */
  useEffect(() => {
    if (isOpen && particleContainerRef.current && !particlesInitialized.current) {
      const c = particleContainerRef.current;
      c.innerHTML = '';
      for (let i = 0; i < 28; i++) {
        const p   = document.createElement('div');
        const sz  = Math.random() * 2.5 + 0.8;
        p.style.cssText = `
          position:absolute; background:white; border-radius:50%;
          pointer-events:none; opacity:0.2;
          width:${sz}px; height:${sz}px;
          left:${Math.random()*100}%;  bottom:0;
          animation:ledger-drift ${Math.random()*18+8}s linear ${Math.random()*-18}s infinite;
          --drift-x:${(Math.random()-0.5)*180}px;
        `;
        c.appendChild(p);
      }
      particlesInitialized.current = true;
    }
    if (!isOpen) particlesInitialized.current = false;
  }, [isOpen]);

  /* ── Reset on open ── */
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setAmount(transaction.amount ? Math.abs(transaction.amount).toString() : '');
        setType(transaction.type || 'expense');
        
        // Match category
        const catLabel = transaction.category || 'SHOPPING';
        const matched = categories.find(c => c.label.toUpperCase() === catLabel.toUpperCase());
        if (matched) {
          setSelectedCategory(matched.label);
          setShowCustomCategory(false);
          setCustomCategory('');
        } else {
          setSelectedCategory('Other');
          setShowCustomCategory(true);
          setCustomCategory(catLabel);
        }
        
        // Parse date to YYYY-MM-DDTHH:MM
        const parseDate = (dateVal) => {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
          }
          const pad = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setDate(parseDate(transaction.date));
        
        // Map description to narrative (required description field)
        setReference('');
        setNarrative(transaction.description || '');
        setSubmitting(false);
      } else {
        // Add Mode
        setAmount('');
        setType('expense');
        setSelectedCategory('Shopping');
        setCustomCategory('');
        setShowCustomCategory(false);
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        setDate(`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
        setReference('');
        setNarrative('');
        setSubmitting(false);
      }
    }
  }, [isOpen, transaction]);

  /* ── ESC close ── */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.label);
    setShowCustomCategory(!!cat.isOther);
    if (!cat.isOther) setCustomCategory('');
  };

  const isDisabled = submitting || !amount || parseFloat(amount) <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    const finalCat = showCustomCategory && customCategory
      ? customCategory.toUpperCase()
      : selectedCategory.toUpperCase();
    const desc = reference.trim() || narrative.trim();
    if (!desc) {
      setFormError('Please enter a description or note for this transaction.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        type,
        category: finalCat,
        description: desc,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to commit transaction', err);
      setFormError('Failed to save transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <>
      <style>{`
        @keyframes ledger-drift {
          from { transform: translateY(0) translateX(0); opacity: 0.2; }
          to   { transform: translateY(-110vh) translateX(var(--drift-x)); opacity: 0; }
        }
        @keyframes modal-slide-in {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lm-enter { animation: modal-slide-in 0.32s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* Glass panel */
        .lm-glass {
          background: rgba(12, 18, 32, 0.7);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.07);
        }

        /* Scrollbar */
        .lm-scroll::-webkit-scrollbar { width: 3px; }
        .lm-scroll::-webkit-scrollbar-thumb {
          background: rgba(90,240,179,0.3); border-radius: 10px;
        }

        /* Hide number spinners */
        .lm-amount-input::-webkit-outer-spin-button,
        .lm-amount-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        .lm-amount-input { -moz-appearance: textfield; }

        /* Form inputs */
        .lm-input {
          width: 100%;
          background: rgba(8,14,26,0.55);
          border: 1px solid rgba(148,163,184,0.13);
          border-radius: 0.7rem;
          color: #dde2f3;
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          /* mobile default padding */
          padding: 0.75rem 1rem;
        }
        .lm-input::placeholder { color: rgba(187,202,192,0.35); }
        .lm-input:focus {
          border-color: rgba(90,240,179,0.5);
          box-shadow: 0 0 0 3px rgba(90,240,179,0.07);
        }

        /* On md+: slightly tighter */
        @media (min-width: 640px) {
          .lm-input { padding: 0.6rem 1rem; }
        }

        /* datetime-local dark color-scheme */
        .lm-input[type="datetime-local"] { color-scheme: dark; }

        /* Type toggle pill */
        .lm-pill {
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border: none;
          cursor: pointer;
          transition: all 0.22s ease;
          white-space: nowrap;
        }
        @media (min-width: 640px) { .lm-pill { font-size: 0.7rem; padding: 0.35rem 1rem; } }

        /* Category tile */
        .lm-tile {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          aspect-ratio: 1/1;
          border-radius: 1rem;
          border: 1px solid rgba(148,163,184,0.13);
          gap: 0.25rem;
          padding: 0.35rem;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
          background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #bbcac0;
        }
        .lm-tile:hover:not(.lm-tile-active) {
          background: rgba(90,240,179,0.09);
          border-color: rgba(90,240,179,0.4);
          box-shadow: 0 0 16px rgba(90,240,179,0.14);
          transform: translateY(-1px);
        }
        .lm-tile-active {
          background: #5af0b3 !important;
          color: #003825 !important;
          border-color: #5af0b3 !important;
          box-shadow: 0 0 20px rgba(90,240,179,0.35);
        }

        /* Custom category reveal */
        .lm-custom-wrap {
          max-height: 0; opacity: 0; overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, margin-top 0.3s ease;
        }
        .lm-custom-wrap.open { max-height: 110px; opacity: 1; margin-top: 0.75rem; }

        /* Footer buttons */
        .lm-btn-abort {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          border: 1px solid transparent;
          background: transparent;
          color: #8a9a90;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .lm-btn-abort:hover { color: #fff; border-color: rgba(255,255,255,0.1); }

        .lm-btn-commit {
          flex: 2;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.07em;
          border: none;
          background: linear-gradient(to right, #5af0b3, #5de6ff);
          color: #002114;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(90,240,179,0.25);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .lm-btn-commit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(90,240,179,0.4);
        }
        .lm-btn-commit:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (min-width: 640px) {
          .lm-btn-abort, .lm-btn-commit { padding: 0.65rem 1rem; font-size: 0.85rem; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(6px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Add Transaction"
      >
        {/* Ambient orbs */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'rgba(90,240,179,0.04)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'rgba(251,113,133,0.04)', filter: 'blur(100px)' }} />

        {/* ── Panel ──
            Centered card panel for both mobile and desktop (max-w-md on mobile, sm:max-w-lg on desktop, fully rounded corners)
        */}
        <div
          className="lm-enter lm-glass relative overflow-hidden shadow-2xl flex flex-col
                     w-full max-w-md sm:max-w-lg rounded-3xl"
          style={{ maxHeight: 'min(92dvh, 820px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Particles */}
          <div ref={particleContainerRef}
            className="absolute inset-0 pointer-events-none overflow-hidden z-0" />

          {/* Accent lines */}
          <div className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom,transparent,rgba(90,240,179,0.18),transparent)', opacity:0.5 }} />
          <div className="absolute right-0 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom,transparent,rgba(93,230,255,0.18),transparent)', opacity:0.5 }} />

          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(148,163,184,0.25)' }} />
          </div>

          {/* ── Scrollable body ── */}
          <div className="relative z-10 overflow-y-auto lm-scroll flex-1 px-5 pb-5 pt-3 sm:p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-white tracking-tight leading-tight"
                  style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontFamily: 'Outfit, sans-serif' }}>
                  {transaction ? 'Edit Transaction' : 'Add Transaction'}
                </h3>
                <p className="text-xs opacity-55 mt-0.5" style={{ color: '#bbcac0' }}>
                  {transaction ? 'Update the transaction record.' : 'Record a new transaction.'}
                </p>
              </div>
              <button onClick={onClose} aria-label="Close"
                className="ml-3 flex-shrink-0 p-1.5 rounded-full hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-[22px]" style={{ color: '#8a9a90' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-3.5">

              {/* ── Amount row ── */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] font-bold tracking-[0.18em] uppercase"
                    style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Amount
                  </span>
                  {/* Toggle */}
                  <div className="flex p-0.5 rounded-full gap-0.5"
                    style={{ background: 'rgba(22,28,40,0.9)', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <button type="button" className="lm-pill"
                      onClick={() => setType('income')}
                      style={type === 'income'
                        ? { background: '#5af0b3', color: '#003825', boxShadow: '0 3px 10px rgba(90,240,179,0.3)' }
                        : { background: 'transparent', color: '#8a9a90' }}>
                      INCOME
                    </button>
                    <button type="button" className="lm-pill"
                      onClick={() => setType('expense')}
                      style={type === 'expense'
                        ? { background: '#fb7185', color: '#fff', boxShadow: '0 3px 10px rgba(251,113,133,0.3)' }
                        : { background: 'transparent', color: '#8a9a90' }}>
                      EXPENSE
                    </button>
                  </div>
                </div>

                {/* Big number */}
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold pointer-events-none select-none"
                    style={{
                      color: '#5af0b3', fontFamily: 'Outfit, sans-serif',
                      fontSize: 'clamp(1.4rem, 6vw, 2rem)',
                      opacity: amount ? 1 : 0.35,
                    }}>
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    className="lm-amount-input"
                    step="1" min="0" required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#fff',
                      fontSize: 'clamp(1.75rem, 8vw, 2.5rem)',
                      paddingLeft: 'clamp(1.6rem, 5.5vw, 2.2rem)',
                    }}
                  />
                </div>
              </div>

              {/* ── Category grid ── */}
              <div>
                <span className="block text-[9px] font-bold tracking-[0.18em] uppercase mb-2"
                  style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Category <span style={{ color: '#fb7185' }}>*</span>
                </span>
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {categories.map((cat) => {
                    const active = selectedCategory === cat.label;
                    return (
                      <button key={cat.label} type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`lm-tile ${active ? 'lm-tile-active' : ''}`}
                        aria-pressed={active}>
                        <span className="material-symbols-outlined"
                          style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)' }}>
                          {cat.icon}
                        </span>
                        <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', fontWeight: 700, lineHeight: 1 }}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom category */}
                <div className={`lm-custom-wrap ${showCustomCategory ? 'open' : ''}`}>
                  <label className="block text-[9px] font-bold tracking-[0.18em] uppercase mb-1.5"
                    style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Custom Category Name
                  </label>
                  <input type="text" className="lm-input"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name..."
                    required={showCustomCategory} />
                </div>
              </div>

              {/* ── Date & Reference ── */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2.5">
                <div>
                   <label className="block text-[9px] font-bold tracking-[0.18em] uppercase mb-1.5"
                    style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Date & Time
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                      style={{ color: '#5af0b3', fontSize: '18px' }}>
                      calendar_today
                    </span>
                    <input type="datetime-local" className="lm-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold tracking-[0.18em] uppercase mb-1.5"
                    style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Notes
                  </label>
                  <input type="text" className="lm-input"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional note or reference..." />
                </div>
              </div>

              {/* ── Narrative ── */}
              <div>
                <label className="block text-[9px] font-bold tracking-[0.18em] uppercase mb-1.5"
                  style={{ color: 'rgba(187,202,192,0.65)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Description <span style={{ color: '#fb7185' }}>*</span>
                </label>
                <textarea className="lm-input resize-none"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="e.g. Grocery run at DMart, Monthly rent payment..."
                  rows={2}
                  style={{
                    borderRadius: '0.75rem',
                    borderColor: narrative ? 'rgba(90,240,179,0.15)' : 'rgba(148,163,184,0.13)',
                  }} />
              </div>

              {/* Inline form error */}
              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  {formError}
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex items-stretch gap-3 pt-0.5">
                <button type="button" className="lm-btn-abort" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" id="ledger-commit-btn"
                  className="lm-btn-commit"
                  disabled={isDisabled}>
                  {submitting
                    ? (transaction ? 'Updating...' : 'Saving...')
                    : (transaction ? 'Update Transaction' : 'Save Transaction')}
                </button>
              </div>

            </form>
          </div>{/* end scrollable body */}
        </div>{/* end panel */}
      </div>{/* end backdrop */}
    </>
    , document.body
  );
}
