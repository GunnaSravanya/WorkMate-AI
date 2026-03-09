import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, TrendingUp, HandCoins, Building, Volume2, ChevronRight, X, Briefcase } from 'lucide-react';
import { triggerSpeak } from './VoiceControls';
import { useApp } from '../context/AppContext';

const AIAdvisor = ({ pay }) => {
    const navigate = useNavigate();
    const { t, language, jobs, currentUser } = useApp();
    const [isOpen, setIsOpen] = useState(true);
    const [advice, setAdvice] = useState({
        loanName: "Personal Micro-Credit",
        loanKey: "advisor.loans.micro",
        benefitKey: "advisor.benefits.transport",
        schemeKey: "advisor.schemes.basic",
        schemes: []
    });

    useEffect(() => {
        const fetchAdvice = async () => {
            try {
                // Calculate simple attendance score from context
                const myJobs = jobs.filter(j =>
                    (j.workerId === currentUser?.id || j.workerId?._id === currentUser?.id) && j.dailyAttendance
                );

                let totalDays = 0;
                let presentDays = 0;
                myJobs.forEach(j => {
                    if (j.dailyAttendance) {
                        totalDays += j.dailyAttendance.length;
                        presentDays += j.dailyAttendance.filter(d => d.status === 'present').length;
                    }
                });

                const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

                const res = await fetch('/api/schemes/recommend-finance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        income: pay,
                        location: currentUser?.location || "India",
                        role: currentUser?.role || "worker",
                        attendance: attendanceScore
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setAdvice(data);
                }
            } catch (err) {
                console.error('Error fetching advice:', err);
            }
        };

        if (pay) fetchAdvice();
    }, [pay, jobs, currentUser]);

    const announceAdvice = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = `${t('advisor.basedOnPay')} ${pay || 0}, ${t('advisor.recommendations')} ${t(advice.loanKey)}`;
            triggerSpeak(text, language === 'hi' ? 'hi-IN' : 'en-US');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="mt-6 w-full bg-white rounded-xl p-4 shadow-sm border border-red-100 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-bold text-gray-800">{t('advisor.title')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
        );
    }

    return (
        <div className="mt-6 bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb className="w-24 h-24 text-red-600" />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-red-500" />
                        {t('advisor.title')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('advisor.basedOnPay')} <span className="font-bold text-gray-900">₹{pay || 0}</span>, {t('advisor.recommendations')}
                    </p>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 relative z-10">
                {/* Loan Card */}
                <div
                    onClick={() => navigate(`/loan/${advice.loanName}`)}
                    className="bg-white p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                            <HandCoins className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-blue-600 uppercase mb-1">{t('advisor.sections.loan')}</div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{advice.loanName}</h4>
                            <p className="text-xs text-gray-500 mt-1">{t(advice.loanKey)}</p>
                            <button className="mt-2 text-xs text-blue-600 font-medium hover:underline">{t('advisor.buttons.apply')}</button>
                        </div>
                    </div>
                </div>

                {/* Benefits Card */}
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg shrink-0">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-green-600 uppercase mb-1">{t('advisor.sections.benefit')}</div>
                            <p className="text-xs text-gray-500 mt-1">{t(advice.benefitKey)}</p>
                        </div>
                    </div>
                </div>

                {/* Schemes Card - Dynamic List */}
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                            <Building className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-orange-600 uppercase mb-1">{t('advisor.sections.scheme')}</div>
                            {advice.schemes && advice.schemes.length > 0 ? (
                                <ul className="space-y-2 mt-1">
                                    {advice.schemes.map((s, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 border-b border-gray-50 pb-1 last:border-0">
                                            <span className="font-bold text-gray-800">{s.name}</span>
                                            {/* Display score if available for transparency? Maybe too technical. */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1">{t(advice.schemeKey)}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-3 relative z-10">
                <button
                    onClick={announceAdvice}
                    className="btn-secondary text-sm py-2"
                >
                    <Volume2 className="w-4 h-4" />
                    Read Aloud
                </button>
            </div>
        </div>
    );
};

export default AIAdvisor;
