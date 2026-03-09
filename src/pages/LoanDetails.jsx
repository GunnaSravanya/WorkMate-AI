import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { triggerSpeak } from '../components/VoiceControls';

const LoanDetails = () => {
    const { name } = useParams();
    const navigate = useNavigate();
    const { financeData, currentUser, jobs, t } = useApp();

    const loan = financeData[name];

    // Calculate eligibility based on income
    const myJobs = jobs.filter(j => j.workerId === currentUser?.id && j.status === 'paid');
    const earnings = myJobs.reduce((sum, j) => sum + (parseFloat(String(j.pay).replace(/[^\d.]/g, '')) || 0), 0);
    const isEligible = earnings >= (loan?.threshold || 0);

    // Auto-read details on load
    useEffect(() => {
        if (loan) {
            const translatedTitle = t(`finance.${name}.title`) !== `finance.${name}.title` ? t(`finance.${name}.title`) : name;
            const translatedPurpose = t(`finance.${name}.purpose`) !== `finance.${name}.purpose` ? t(`finance.${name}.purpose`) : loan.purpose;
            const translatedBenefits = t(`finance.${name}.benefits`) !== `finance.${name}.benefits` ? t(`finance.${name}.benefits`) : loan.benefits;

            const eligibilityText = isEligible ? t('loanDetails.eligibleMsg') : t('loanDetails.notEligibleMsg');
            const textToSpeak = `${translatedTitle}. ${translatedPurpose}. ${eligibilityText}. ${t('loanDetails.programBenefits')}: ${Array.isArray(translatedBenefits) ? translatedBenefits.join(", ") : translatedBenefits}.`;
            triggerSpeak(textToSpeak);
        }
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [name, loan, isEligible, t]);

    const handleBack = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        navigate(-1);
    };

    if (!loan) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800">Loan Not Found</h2>
                <button
                    onClick={handleBack}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full font-bold"
                >
                    {t('loanDetails.goBack')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Hero Section */}
            <div className="relative bg-gradient-to-br from-red-900 via-gray-900 to-red-800 pt-16 pb-32 px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-[120px] -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gray-500 rounded-full blur-[100px] -ml-40 -mb-40" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{t('loanDetails.backToDashboard')}</span>
                    </button>


                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-red-200 text-xs font-bold uppercase tracking-widest mb-4">
                                <Sparkles className="w-3 h-3" />
                                {t('loanDetails.verifiedPartner')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                {t(`finance.${name}.title`) !== `finance.${name}.title` ? t(`finance.${name}.title`) : name}
                            </h1>
                            <p className="mt-4 text-xl text-gray-200 max-w-2xl leading-relaxed">
                                {t(`finance.${name}.purpose`) !== `finance.${name}.purpose` ? t(`finance.${name}.purpose`) : loan.purpose}
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl min-w-[240px]">
                            <p className="text-red-200 text-xs font-bold uppercase tracking-wider mb-2">{t('loanDetails.maxCredit')}</p>
                            <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
                                <span className="text-xl font-medium text-red-300 tracking-tighter">₹</span>
                                {loan.threshold === 2000 ? '5,000' : '15,000'}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${isEligible ? 'bg-green-400' : 'bg-amber-400'}`} />
                                <span className="text-white font-medium">
                                    {isEligible ? t('loanDetails.eligibleToApply') : t('loanDetails.boostIncome')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Benefits Card */}
                    <div className="md:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-8">
                            <TrendingUp className="w-6 h-6 text-red-600" />
                            {t('loanDetails.programBenefits')}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(t(`finance.${name}.benefits`) !== `finance.${name}.benefits` ? t(`finance.${name}.benefits`) : loan.benefits).map((benefit, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-red-300 transition-colors">
                                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-gray-800 font-semibold text-sm leading-snug">
                                        {benefit}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 h-px bg-gray-100" />

                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-10 mb-6">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                            {t('loanDetails.finePrint')}
                        </h2>

                        <div className="space-y-4">
                            {loan.loopholes.map((l, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                                    <p className="text-amber-900 text-sm font-medium">
                                        {l}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar / Requirements */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <FileText className="w-5 h-5 text-red-600" />
                                {t('loanDetails.requirements')}
                            </h3>
                            <div className="space-y-4">
                                {(t(`finance.${name}.docs`) !== `finance.${name}.docs` ? t(`finance.${name}.docs`) : loan.docs).map((doc, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-[10px] font-bold">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium">{doc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-600 to-gray-800 rounded-3xl p-8 text-white shadow-xl shadow-red-200">
                            <ShieldCheck className="w-10 h-10 mb-4 opacity-80" />
                            <h3 className="text-xl font-bold mb-2">{t('loanDetails.safeBorrowing')}</h3>
                            <p className="text-gray-100 text-sm leading-relaxed mb-6">
                                {t('loanDetails.safeBorrowingText')}
                            </p>
                            <button
                                disabled={!isEligible}
                                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all ${isEligible
                                    ? 'bg-white text-red-700 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                {isEligible ? t('loanDetails.applyInstantly') : t('loanDetails.increaseEarnings')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanDetails;
