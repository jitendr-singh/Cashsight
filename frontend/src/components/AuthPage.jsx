import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function AuthPage({ onBackToLanding }) {
  const { login, register } = useAuth();

  // Tab states: 'login' | 'signup'
  const [isLogin, setIsLogin] = useState(true);

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status states
  const [errorMsg, setErrorMsg] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setErrorMsg('Please enter your full name to create an account.');
      return;
    }
    if (!isLogin) {
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        setErrorMsg('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      console.error('Authentication request failed:', err);
      const msg = err.message || '';
      if (msg.includes('Invalid credentials') || msg.includes('401') || msg.toLowerCase().includes('credential')) {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else if (msg.includes('already registered') || msg.includes('400')) {
        setErrorMsg('This email address is already registered. Please sign in instead.');
      } else if (msg.includes('timed out') || msg.includes('Connection')) {
        setErrorMsg('Could not connect to server. Please ensure the backend is running.');
      } else {
        setErrorMsg(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#030712] text-[#dde2f3] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body-base">

      {/* Ambient background glows */}
      <div className="fixed inset-0 scanning-grid pointer-events-none z-0"></div>
      <div className="ambient-orb bg-primary w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] -top-20 -left-20 sm:-top-32 sm:-left-32 opacity-20"></div>
      <div className="ambient-orb bg-violet-accent w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bottom-10 right-10 opacity-20"></div>

      {/* Main Glassmorphic Auth Card */}
      <div className="w-full max-w-md midnight-glass border border-glass-border/30 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 transition-all">

        {/* Back button */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="absolute top-4 left-4 p-1.5 text-on-surface-variant/70 hover:text-primary rounded-lg hover:bg-surface-variant/20 transition-all cursor-pointer flex items-center justify-center"
            title="Back to Landing Page"
            aria-label="Back to Landing Page"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
        )}

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center">
            <Logo size={46} textClass="text-4xl" />
          </div>
          <p className="text-on-surface-variant/80 text-[10px] uppercase tracking-widest font-bold">
            Personal Finance Dashboard
          </p>
        </div>

        {/* Auth Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-950/60 p-1.5 rounded-xl border border-glass-border/15">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin
                ? 'bg-primary text-on-primary shadow-md shadow-primary/10'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin
                ? 'bg-primary text-on-primary shadow-md shadow-primary/10'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Validation Errors Alert Box */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-expense text-xs font-medium rounded-xl flex items-start gap-2.5 animate-fade-in">
            <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0">
              warning
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name Input (Register Only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant/70 text-[18px]">
                  person
                </span>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#05070f] border border-glass-border rounded-xl pl-10 pr-4 py-3 text-xs md:text-sm font-medium text-text-primary outline-none focus:border-primary/70 transition-all font-body placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant/70 text-[18px]">
                alternate_email
              </span>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-[#05070f] border border-glass-border rounded-xl pl-10 pr-4 py-3 text-xs md:text-sm font-medium text-text-primary outline-none focus:border-primary/70 transition-all font-body placeholder:text-on-surface-variant/40"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant/70 text-[18px]">
                lock
              </span>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full bg-[#05070f] border border-glass-border rounded-xl pl-10 pr-4 py-3 text-xs md:text-sm font-medium text-text-primary outline-none focus:border-primary/70 transition-all font-body placeholder:text-on-surface-variant/40"
                required
              />
            </div>
          </div>

          {/* Forgot Password (Login only) */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-[10px] text-primary/70 hover:text-primary transition-all underline decoration-dotted cursor-pointer"
                onClick={() => setErrorMsg('Password reset is coming soon. Please contact support.')}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm tracking-wider shadow-lg shadow-primary/10 cursor-pointer"
          >
            {authLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">{isLogin ? 'login' : 'person_add'}</span>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
