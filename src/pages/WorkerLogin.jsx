import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { HardHat, LogIn } from 'lucide-react';
import BackButton from '../components/BackButton';
import VoiceInput from '../components/VoiceInput';

const WorkerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, t } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const success = await login(email, password);
        if (success) {
            navigate('/worker-dashboard');
        } else {
            const msg = t('auth.invalidCredentials');
            setError(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="px-4"><BackButton /></div>
            </div>

            <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HardHat className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t('auth.workerLogin')}</h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {t('auth.loginSubtitle')}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <VoiceInput
                                id="email"
                                label={t('auth.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="name@example.com"
                                contextHelp={t('auth.email')}
                            />
                        </div>

                        <div>
                            <VoiceInput
                                id="password"
                                label={t('auth.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="********"
                                contextHelp={t('auth.password')}
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <LogIn className="w-5 h-5 mr-2" />
                                {t('auth.loginBtn')}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">{t('auth.noAccount')}</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/register-worker" className="font-medium text-red-600 hover:text-red-500">
                                {t('auth.createAccount')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerLogin;
