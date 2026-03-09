import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Briefcase, MapPin, IndianRupee, Calendar, Clock, CheckCircle2, CalendarDays } from 'lucide-react';

import BackButton from '../components/BackButton';
import VoiceInput from '../components/VoiceInput';

const PostJob = () => {
    const navigate = useNavigate();
    const { postJob, currentUser, t } = useApp();
    const [formData, setFormData] = useState({
        title: '',
        skill: '',
        location: '',
        latitude: '',
        longitude: '',
        pay: '',
        days: '',
        schedule: '',
        workersNeeded: '1'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await postJob({ ...formData, contractorId: currentUser.id });
        if (success) {
            navigate('/contractor-dashboard');
        } else {
            alert('Failed to post job. Please make sure the server is running and try again.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <BackButton />

            <div className="glass-card">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">{t('postJob.title')}</h1>
                    <p className="text-slate-400">{t('postJob.fillDetails')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <VoiceInput
                            id="title"
                            label={t('postJob.jobTitleLabel')}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            type="text"
                            placeholder={t('postJob.jobTitlePlaceholder')}
                            contextHelp={t('postJob.jobTitleLabel')}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t('postJob.skillsLabel')}</label>
                            <select
                                required
                                className="input-field appearance-none"
                                value={formData.skill}
                                onChange={e => setFormData({ ...formData, skill: e.target.value })}
                            >
                                <option value="">{t('postJob.selectCategory')}</option>
                                <option value="Plumber">{t('postJob.plumbing')}</option>
                                <option value="Electrician">{t('postJob.electrical')}</option>
                                <option value="Carpenter">{t('postJob.carpentry')}</option>
                                <option value="Painter">{t('postJob.painting')}</option>
                                <option value="Mason">{t('postJob.construction')}</option>
                                <option value="Laborer">{t('postJob.cleaning')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <VoiceInput
                                id="pay"
                                label={t('postJob.wageLabel')}
                                value={formData.pay}
                                onChange={e => setFormData({ ...formData, pay: e.target.value })}
                                type="number"
                                placeholder={t('postJob.wagePlaceholder')}
                                contextHelp={t('postJob.wageLabel')}
                            />
                        </div>

                        <div className="space-y-2">
                            <VoiceInput
                                id="days"
                                label={t('postJob.daysLabel') || 'Number of Days'}
                                value={formData.days}
                                onChange={e => setFormData({ ...formData, days: e.target.value })}
                                type="number"
                                placeholder={t('postJob.daysPlaceholder') || 'e.g. 5'}
                                contextHelp={t('postJob.daysLabel') || 'Number of Days'}
                            />
                        </div>

                        <div className="space-y-2">
                            <VoiceInput
                                id="workersNeeded"
                                label="Workers Needed"
                                value={formData.workersNeeded}
                                onChange={e => setFormData({ ...formData, workersNeeded: e.target.value })}
                                type="number"
                                placeholder="e.g. 3"
                                contextHelp="Number of workers needed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <VoiceInput
                            id="location"
                            label={t('postJob.locationLabel')}
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            type="text"
                            placeholder={t('postJob.locationPlaceholder')}
                            contextHelp={t('postJob.locationLabel')}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="relative">
                            <VoiceInput
                                id="latitude"
                                value={formData.latitude}
                                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                type="number"
                                placeholder="Latitude (e.g. 17.3850)"
                            />
                        </div>
                        <div className="relative">
                            <VoiceInput
                                id="longitude"
                                value={formData.longitude}
                                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                type="number"
                                placeholder="Longitude (e.g. 78.4867)"
                            />
                        </div>
                    </div>


                    <div className="space-y-2">
                        <VoiceInput
                            id="schedule"
                            label={t('postJob.descriptionLabel')}
                            value={formData.schedule}
                            onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                            type="text"
                            placeholder={t('postJob.descriptionPlaceholder')}
                            contextHelp={t('postJob.descriptionLabel')}
                        />
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="btn-primary w-full py-4 text-lg">
                            <CheckCircle2 className="w-5 h-5" />
                            {t('postJob.submit')}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default PostJob;
