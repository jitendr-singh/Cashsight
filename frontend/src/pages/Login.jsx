import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2, TrendingUp } from 'lucide-react';
import API from '../api/axios';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // FastAPI OAuth2 standard expects Form Data
            const formData = new FormData();
            formData.append('username', email); 
            formData.append('password', password);

            console.log("1. Backend ko request bhej rahe hain...");
            const response = await API.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log("2. Backend ka raw response:", response.data);

            // 🛠️ SMART TOKEN CHECK: Dono tarike check karega taaki undefined na aaye
            const token = response.data.access_token || response.data.token || response.data.data?.token;
            
            if (!token) {
                console.error("Token nahi mila! Response structure:", response.data);
                setError('Backend se token structure match nahi hua. Check console!');
                setLoading(false);
                return;
            }

            console.log("3. Valid token mila:", token);

            // Save Token with 'authToken' key to match App.jsx & Dashboard
            localStorage.setItem('authToken', token);

            // Seedha browser redirect bina kisi React Router freeze ke
            window.location.href = '/dashboard';

        } catch (err) {
            console.error("Login catch error:", err);
            setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-950 px-4 text-white">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                
                {/* Brand Logo & Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-emerald-400">Cashsight</h2>
                    <p className="mt-1.5 text-sm text-slate-400">Welcome back! Please enter your details.</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-5 rounded-xl bg-red-500/10 p-3.5 text-sm text-red-400 border border-red-500/20">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3 h-5 w-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-emerald-500"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3 h-5 w-5 text-slate-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-slate-500 hover:text-slate-300"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 accent-emerald-500 outline-none focus:ring-0"
                            />
                            <span className="text-slate-400 hover:text-slate-300 transition-colors">Remember me</span>
                        </label>
                        <button 
                            type="button" 
                            onClick={() => alert('Forgot password feature coming soon!')}
                            className="font-medium text-emerald-400 hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Divider for Social Login */}
                <div className="my-6 flex items-center justify-between text-xs uppercase text-slate-600">
                    <span className="h-px w-1/3 bg-slate-800"></span>
                    <span>Or continue with</span>
                    <span className="h-px w-1/3 bg-slate-800"></span>
                </div>

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={() => alert('Google authentication coming soon!')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900 transition-colors"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Google
                </button>

                {/* Footer Link */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/register')} className="font-semibold text-emerald-400 hover:underline">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;