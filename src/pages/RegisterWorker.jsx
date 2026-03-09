import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, MapPin, Briefcase, Clock, ArrowRight } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';

const RegisterWorker = () => {
    const navigate = useNavigate();
    const { registerUser, t } = useApp();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        location: '',
        skills: [],
        availability: '',
        email: '',
        password: '',
        role: 'worker'
    });

    const availableSkills = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mason', 'Laborer'];

    const handleSkillChange = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Worker Registration - Submission started', { formData });

        try {
            const success = await registerUser(formData);
            console.log('Worker Registration - registerUser result:', success);
            if (success) {
                console.log('Worker Registration - Success, navigating to dashboard');
                navigate('/worker-dashboard');
                // Fallback redirection after a short delay if SPA navigation fails
                setTimeout(() => {
                    if (window.location.pathname !== '/worker-dashboard') {
                        console.log('Worker Registration - SPA navigation failed, using window.location');
                        window.location.href = '/worker-dashboard';
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Worker Registration - Exception:', error);
            alert('Worker registration encountered an error. Please check console.');
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white">{t('auth.registerTitle')} - {t('auth.worker')}</h2>
                    <p className="text-slate-400">{t('auth.joinNetwork')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <VoiceInput
                                id="name"
                                label={t('auth.name')}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                type="text"
                                placeholder="John Doe"
                                contextHelp={t('auth.name')}
                            />
                        </div>

                        <div className="space-y-2">
                            <VoiceInput
                                id="age"
                                label={t('auth.age')}
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                type="number"
                                placeholder="25"
                                contextHelp={t('auth.age')}
                            />
                        </div>

                        <div className="space-y-2">
                            <VoiceInput
                                id="email"
                                label={t('auth.email')}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                type="email"
                                placeholder="john@example.com"
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
                    </div>

                    <div className="space-y-2">
                        <VoiceInput
                            id="location"
                            label={t('auth.location')}
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            type="text"
                            placeholder="City, Area"
                            contextHelp={t('auth.location')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">{t('auth.skills')}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableSkills.map(skill => (
                                <label key={skill} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.skills.includes(skill) ? 'bg-red-600/20 border-red-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-600 text-red-600 focus:ring-red-500 bg-slate-700"
                                        checked={formData.skills.includes(skill)}
                                        onChange={() => handleSkillChange(skill)}
                                    />
                                    <span className="text-sm text-slate-200">{skill}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">{t('auth.availability')}</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <select
                                className="input-field pl-10 appearance-none"
                                value={formData.availability}
                                onChange={e => setFormData({ ...formData, availability: e.target.value })}
                            >
                                <option value="">{t('auth.selectAvailability')}</option>
                                <option value="Full-time">{t('auth.fullTime')}</option>
                                <option value="Part-time">{t('auth.partTime')}</option>
                                <option value="Weekends only">{t('auth.weekendsOnly')}</option>
                            </select>
                        </div>
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

export default RegisterWorker;
