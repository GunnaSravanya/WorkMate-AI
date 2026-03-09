import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, Mail, Lock, ArrowRight } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';

const RegisterContractor = () => {
    const navigate = useNavigate();
    const { registerUser, t } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        email: '',
        password: '',
        role: 'contractor'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Contractor Registration - Submission started', { formData });

        try {
            const success = await registerUser(formData);
            console.log('Contractor Registration - registerUser result:', success);
            if (success) {
                console.log('Contractor Registration - Success, navigating to dashboard');
                navigate('/contractor-dashboard');
                // Fallback redirection after a short delay if SPA navigation fails
                setTimeout(() => {
                    if (window.location.pathname !== '/contractor-dashboard') {
                        console.log('Contractor Registration - SPA navigation failed, using window.location');
                        window.location.href = '/contractor-dashboard';
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Contractor Registration - Exception:', error);
            alert('Contractor registration encountered an error. Please check console.');
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex items-center justify-center">
            <div className="glass-card w-full max-w-xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white">{t('auth.registerTitle')} - {t('auth.contractor')}</h2>
                    <p className="text-slate-400">{t('auth.findBestWorkers')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <VoiceInput
                            id="name"
                            label={t('auth.name')}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            type="text"
                            placeholder="BuildWell Constructions"
                            contextHelp={t('auth.name')}
                        />
                    </div>

                    <div className="space-y-2">
                        <VoiceInput
                            id="location"
                            label={t('auth.location')}
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            type="text"
                            placeholder="New York, NY"
                            contextHelp={t('auth.location')}
                        />
                    </div>

                    <div className="space-y-2">
                        <VoiceInput
                            id="email"
                            label={t('auth.email')}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            type="email"
                            placeholder="contact@buildwell.com"
                            contextHelp={t('auth.email')}
                        />
                    </div>

                    <div className="space-y-2">
                        <VoiceInput
                            id="password"
                            label={t('auth.password')}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            type="password"
                            placeholder="••••••"
                            contextHelp={t('auth.password')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-4 text-lg mt-8 flex items-center justify-center gap-2"
                    >
                        {t('auth.createAccount')}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterContractor;
