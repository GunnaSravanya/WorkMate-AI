import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Briefcase, LogIn } from 'lucide-react';
import BackButton from '../components/BackButton';
import VoiceInput from '../components/VoiceInput';

const ContractorLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login, t } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const success = await login(formData.email, formData.password);
        if (success) {
            navigate('/contractor-dashboard');
        } else {
            setError('Invalid credentials');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-10 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-gray-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="px-4"><BackButton className="text-gray-500 hover:text-red-600" /></div>
                <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{t('auth.contractorLogin')}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <VoiceInput
                                id="email"
                                label={t('auth.companyEmail')}
                                value={formData.email}
                                onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value } })}
                                type="email"
                                placeholder="contractor@company.com"
                                contextHelp={t('auth.companyEmail')}
                            />
                        </div>

                        <div>
                            <VoiceInput
                                id="password"
                                label={t('auth.password')}
                                value={formData.password}
                                onChange={(e) => handleChange({ target: { name: 'password', value: e.target.value } })}
                                type="password"
                                placeholder="••••••••"
                                contextHelp={t('auth.password')}
                            />
                        </div>

                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">{error}</div>}

                        <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2">
                            <LogIn className="w-4 h-4" />
                            {t('auth.accessDashboard')}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-500 text-sm">{t('auth.lookingToHire')}</p>
                        <Link to="/register-contractor" className="text-red-600 font-semibold hover:underline text-sm">{t('auth.registerCompany')}</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractorLogin;
