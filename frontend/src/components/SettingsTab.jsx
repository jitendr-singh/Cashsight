import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { authService } from '../services/api';

export default function SettingsTab() {
  const { user, logout } = useAuth();
  const { currency, setCurrency, currencySymbol } = useCurrency();

  const [activeSection, setActiveSection] = useState('profile');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [dataMsg, setDataMsg] = useState(null);

  const sections = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'preferences', label: 'Preferences', icon: 'tune' },
    { id: 'data', label: 'Data & Privacy', icon: 'security' },
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
  ];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }
    setProfileLoading(true);
    try {
      // Update profile via API (endpoint to be added in backend)
      await authService.updateProfile({ name: name.trim(), email: email.trim() });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Profile update failed. This feature may require a backend update.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (!/[a-z]/.test(newPwd) || !/[A-Z]/.test(newPwd) || !/\d/.test(newPwd)) {
      setPwdMsg({ type: 'error', text: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPwdLoading(true);
    try {
      await authService.changePassword({ current_password: currentPwd, new_password: newPwd });
      setPwdMsg({ type: 'success', text: 'Password changed successfully. Please log in again.' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      const text = err.message || 'Password change failed. Please check your current password.';
      setPwdMsg({ type: 'error', text: text });
    } finally {
      setPwdLoading(false);
    }
  };

  const StatusMsg = ({ msg }) => {
    if (!msg) return null;
    const isError = msg.type === 'error';
    return (
      <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${isError
        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        : 'bg-primary/10 border border-primary/20 text-primary'}`}>
        <span className="material-symbols-outlined text-[14px]">{isError ? 'warning' : 'check_circle'}</span>
        {msg.text}
      </div>
    );
  };

  const FieldLabel = ({ children, required }) => (
    <label className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5 block">
      {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );

  const InputField = ({ ...props }) => (
    <input
      {...props}
      className="w-full bg-[#080e1a] border border-glass-border/60 rounded-xl px-4 py-2.5 text-sm text-text-primary font-medium focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-secondary/30"
    />
  );

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 stagger-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">settings</span>
        </div>
        <div>
          <h2 className="font-outfit font-bold text-2xl text-text-primary">Settings</h2>
          <p className="text-xs text-text-secondary/50">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Nav */}
        <div className="col-span-12 md:col-span-3">
          <div className="glass-card rounded-2xl p-3 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary border border-primary/15'
                    : 'text-text-secondary/70 hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          
          {/* ── PROFILE SECTION ── */}
          {activeSection === 'profile' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-glass-border/20">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-obsidian-base font-extrabold text-xl shadow-lg">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-text-primary">{user?.name || 'User'}</h3>
                  <p className="text-xs text-text-secondary/50">{user?.email || ''}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full mt-1 inline-block">
                    Active Account
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <InputField
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <InputField
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
                <StatusMsg msg={profileMsg} />
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-primary text-obsidian-base font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">save</span> Save Changes</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── SECURITY SECTION ── */}
          {activeSection === 'security' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="pb-4 border-b border-glass-border/20">
                <h3 className="font-outfit font-bold text-lg text-text-primary">Password & Security</h3>
                <p className="text-xs text-text-secondary/50 mt-1">Change your password to keep your account secure</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <FieldLabel required>Current Password</FieldLabel>
                  <InputField
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <FieldLabel required>New Password</FieldLabel>
                  <InputField
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <FieldLabel required>Confirm New Password</FieldLabel>
                  <InputField
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
                <StatusMsg msg={pwdMsg} />
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-6 py-2.5 bg-primary text-obsidian-base font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {pwdLoading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Changing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">lock_reset</span> Change Password</>
                  )}
                </button>
              </form>

              {/* Session Info */}
              <div className="mt-6 pt-6 border-t border-glass-border/20">
                <h4 className="font-semibold text-sm text-text-primary mb-3">Active Session</h4>
                <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-glass-border/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">computer</span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Current Browser Session</p>
                      <p className="text-[10px] text-text-secondary/50">Logged in as {user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PREFERENCES SECTION ── */}
          {activeSection === 'preferences' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="pb-4 border-b border-glass-border/20">
                <h3 className="font-outfit font-bold text-lg text-text-primary">Preferences</h3>
                <p className="text-xs text-text-secondary/50 mt-1">Customize your dashboard experience</p>
              </div>

              {/* Currency Preference */}
              <div>
                <FieldLabel>Display Currency</FieldLabel>
                <p className="text-[10px] text-text-secondary/40 mb-3">All financial values will be displayed in your selected currency</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-bold transition-all ${
                        currency === c.code
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-white/3 border-glass-border/20 text-text-secondary/60 hover:bg-white/5 hover:text-text-primary'
                      }`}
                    >
                      <span className="text-xl">{c.symbol}</span>
                      <span className="text-[10px] font-bold">{c.code}</span>
                      <span className="text-[9px] font-normal opacity-70">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Info */}
              <div className="pt-4 border-t border-glass-border/20">
                <FieldLabel>Theme</FieldLabel>
                <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-glass-border/20">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#030712] to-[#0c1220] border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[14px]">dark_mode</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-primary">Midnight Glass (Dark)</p>
                    <p className="text-[10px] text-text-secondary/50">Premium glassmorphic dark theme</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/40 mt-2 italic">Additional themes coming in a future update.</p>
              </div>
            </div>
          )}

          {/* ── DATA & PRIVACY SECTION ── */}
          {activeSection === 'data' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="pb-4 border-b border-glass-border/20">
                <h3 className="font-outfit font-bold text-lg text-text-primary">Data & Privacy</h3>
                <p className="text-xs text-text-secondary/50 mt-1">Manage your data and account privacy settings</p>
              </div>

              <StatusMsg msg={dataMsg} />

              {/* Data Export */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Export Your Data</h4>
                <p className="text-xs text-text-secondary/50 mb-3">Download a full export of your financial data including transactions, savings goals, and investments.</p>
                <button
                  className="px-4 py-2 bg-white/5 border border-glass-border/30 text-text-secondary hover:bg-white/10 hover:text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  onClick={() => setDataMsg({ type: 'success', text: 'Data export will be available in a future update.' })}
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export All Data (CSV)
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">shield</span>
                  <div>
                    <h4 className="text-xs font-bold text-primary mb-1">Your Data is Private</h4>
                    <p className="text-[11px] text-text-secondary/70 leading-relaxed">
                      Capitallens stores all financial data locally on your own database. We do not sell or share your financial information with third parties. 
                      Your data is encrypted at rest and in transit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-rose-500/20">
                <h4 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Danger Zone
                </h4>
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-3">
                  <p className="text-xs text-text-secondary/60">
                    Deleting your account is permanent and cannot be undone. All your financial data will be erased.
                  </p>
                  <button
                    className="px-4 py-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    onClick={() => setDataMsg({ type: 'error', text: 'Account deletion must be performed by contacting support@capitallens.com' })}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
