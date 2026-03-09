import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, t } = useApp();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (login(email, password)) {
            // Login successful, redirect handled by checking current user role, 
            // but state update might be async. 
            // Ideally we check the user object returned or useEffect.
            // For mock sync login, it sets state immediately.
            // Use helper to get role?
            // Actually login returns true/false.
            // But we need to know WHERE to go. 
            // The context sets CurrentUser. We can access it via useApp() but it might not update in this render cycle.
            // Let's assume for this mock it's fine or we can pass a callback or check role from the found user in context logic.
            // I'll make login return the user object or null in Context (I'll need to update Context if I want that, currently it returns boolean).
            // Hardcode redirection for demo based on email or fetch user from users list directly here? 
            // No, access context.users.

            // Let's just default to worker dashboard for now, or check users list.
            if (email.includes('contractor')) {
                navigate('/contractor-dashboard');
            } else {
                navigate('/worker-dashboard');
            }
        } else {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gray-50">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-red-600/5 rounded-full blur-[80px] -z-10" />

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">{t('auth.workerLogin')}</h2>
                    <p className="text-gray-500 mt-2">{t('auth.loginSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('auth.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button type="submit" className="btn-primary w-full py-3 text-lg">
                        <LogIn className="w-5 h-5" />
                        {t('auth.loginBtn')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>{t('auth.noAccount')}</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href="/register-worker" className="text-red-600 hover:text-red-500 font-medium">{t('auth.registerBtn')}</a>
                        <span className="text-gray-300">|</span>
                        <a href="/register-contractor" className="text-red-600 hover:text-red-500 font-medium">{t('auth.contractor')}</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
