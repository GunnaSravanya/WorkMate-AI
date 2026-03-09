import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Calculator, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import VoiceInput from './VoiceInput';

const LoanEligibilityForm = ({ translations, lang, onClose, currentUser, totalIncome }) => {
    const t = translations.loanPredictor;
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        Gender: '1',
        Married: '1',
        Dependents: '0',
        Education: '1',
        Self_Employed: currentUser?.role === 'contractor' ? '1' : '0',
        ApplicantIncome: totalIncome ? String(totalIncome) : '',
        CoapplicantIncome: '0',
        LoanAmount: '100000',
        Loan_Amount_Term: '360',
        Credit_History: '1',
        Property_Area: '1' // 0: Rural, 1: Semiurban, 2: Urban
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const steps = [
        { id: 'personal', fields: ['Gender', 'Married', 'Dependents'] },
        { id: 'education', fields: ['Education', 'Self_Employed'] },
        { id: 'financial', fields: ['ApplicantIncome', 'CoapplicantIncome', 'Credit_History'] },
        { id: 'loan', fields: ['LoanAmount', 'Property_Area'] }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/loans/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error predicting loan eligibility:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (name) => {
        const label = t.form[name.charAt(0).toLowerCase() + name.slice(1)];

        if (['Gender', 'Married', 'Education', 'Self_Employed', 'Credit_History', 'Property_Area'].includes(name)) {
            let options = [];
            if (name === 'Gender') options = [{ v: '1', l: t.options.male }, { v: '0', l: t.options.female }];
            if (name === 'Married') options = [{ v: '1', l: t.options.yes }, { v: '0', l: t.options.no }];
            if (name === 'Education') options = [{ v: '1', l: t.options.graduate }, { v: '0', l: t.options.notGraduate }];
            if (name === 'Self_Employed') options = [{ v: '1', l: t.options.yes }, { v: '0', l: t.options.no }];
            if (name === 'Credit_History') options = [{ v: '1', l: t.options.yes }, { v: '0', l: t.options.no }];
            if (name === 'Property_Area') options = [{ v: '0', l: t.options.rural }, { v: '1', l: t.options.semiUrban }, { v: '2', l: t.options.urban }];

            return (
                <div key={name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <div className="flex gap-2">
                        {options.map(opt => (
                            <button
                                key={opt.v}
                                onClick={() => setFormData(p => ({ ...p, [name]: opt.v }))}
                                className={`flex-1 py-2 px-4 rounded-lg border transition-all ${formData[name] === opt.v
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
                                    }`}
                            >
                                {opt.l}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <VoiceInput
                key={name}
                id={name}
                type="number"
                label={label}
                value={formData[name]}
                onChange={handleInputChange}
                contextHelp={`Please say your ${label}`}
                className="mb-4"
                placeholder="0"
            />
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
                <div className="bg-red-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">{t.title}</h2>
                            <p className="text-red-100 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
                </div>

                <div className="p-8">
                    {!result ? (
                        <>
                            <div className="flex justify-between mb-8">
                                {steps.map((s, i) => (
                                    <div key={s.id} className="flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= i ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {i + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {steps[step].fields.map(f => renderInput(f))}
                                    {step === 0 && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.form.dependents}</label>
                                            <select
                                                name="Dependents"
                                                value={formData.Dependents}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                            >
                                                <option value="0">0</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3+</option>
                                            </select>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handleBack}
                                    disabled={step === 0}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${step === 0 ? 'opacity-0' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {lang === 'en' ? 'Back' : lang === 'hi' ? 'पीछे' : 'వెనుక'}
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-red-600 text-white px-8 py-2 rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === steps.length - 1 ? t.startBtn : t.nextStep}
                                    {!loading && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            {/* Probability Graph */}
                            <div className="relative w-48 h-48 mx-auto mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-gray-100"
                                    />
                                    <motion.circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={552.92}
                                        initial={{ strokeDashoffset: 552.92 }}
                                        animate={{ strokeDashoffset: 552.92 * (1 - result.probability) }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`${result.probability > 0.6 ? 'text-green-500' : result.probability > 0.4 ? 'text-yellow-500' : 'text-red-500'}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-gray-900">{(result.probability * 100).toFixed(0)}%</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.probability}</span>
                                </div>
                            </div>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm ${result.probability > 0.5 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {result.probability > 0.5 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {result.probability > 0.5 ? t.likely : t.unlikely}
                            </div>

                            {/* Required Documents Section */}
                            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="p-1.5 bg-red-100 text-red-600 rounded-lg text-xs leading-none">📄</span>
                                    {lang === 'en' ? 'Required Documents for You' : lang === 'hi' ? 'आपके लिए आवश्यक दस्तावेज़' : 'మీ కోసం అవసరమైన పత్రాలు'}
                                </h4>
                                <div className="grid gap-3">
                                    {(result.documents || []).map((doc, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            className="flex items-center gap-3 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                            {doc}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-8 flex items-start gap-3 text-left border border-blue-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{t.disclaimer}</p>
                            </div>

                            <button
                                onClick={() => { setResult(null); setStep(0); }}
                                className="flex items-center gap-2 mx-auto text-red-600 font-bold hover:underline transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {lang === 'en' ? 'Check Again' : lang === 'hi' ? 'फिर से जाँचें' : 'మళ్లీ తనిఖీ చేయండి'}
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LoanEligibilityForm;
