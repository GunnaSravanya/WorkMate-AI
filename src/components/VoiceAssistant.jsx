import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mic, Volume2, X, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from './VoiceControls';

// DICTIONARY FOR LOCALIZATION
const prompts = {
    'en-US': {
        emailAsk: "Say your Gmail address.",
        emailConfirm: (email) => `You said ${email}. Is that correct?`,
        passAsk: "Say your password.",
        passConfirm: "Logging in...",
        dashboardWelcome: "Welcome. Say 'I need a job'.",
        jobFound: (job) => `Found job: ${job.title}. Pay ₹${job.pay}. Accept?`,
        jobAccepted: "Job accepted. Done.",
        error: "I didn't catch that. Tap to try again.", // Shortened
        confirmYes: ['yes', 'yeah', 'correct', 'right', 'accept'],
        confirmNo: ['no', 'nope', 'wrong']
    },
    'hi-IN': {
        emailAsk: "Gmail batayein.",
        emailConfirm: (email) => `Aapne kaha ${email}. Sahi hai?`,
        passAsk: "Password batayein.",
        passConfirm: "Login ho raha hai.",
        dashboardWelcome: "Swagat hai. 'Kaam chahiye' kahein.",
        jobFound: (job) => `Kaam mila: ${job.title}. Paise ₹${job.pay}. Lenge?`,
        jobAccepted: "Le liya. Ho gaya.",
        error: "Samajh nahi aaya. Button dabayein.",
        confirmYes: ['haan', 'yes', 'sahi', 'ji', 'accept'],
        confirmNo: ['nahi', 'no', 'galat']
    }
};

const VoiceAssistant = () => {
    const [active, setActive] = useState(false);
    const [step, setStep] = useState('IDLE');
    const [tempData, setTempData] = useState({ email: '', password: '' });
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Use the Hook!
    const { startListening, listening, transcript, lang, setLang } = useSpeechRecognition();

    // Ref to track if component is mounted/active for async operations
    const activeRef = useRef(active);
    useEffect(() => { activeRef.current = active; }, [active]);

    const { login, jobs, acceptJob } = useApp();
    const navigate = useNavigate();

    // PROMISE-BASED SPEAK HELPER
    const speakAsync = (text, language) => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                resolve();
                return;
            }
            window.speechSynthesis.cancel();
            setIsSpeaking(true);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language || lang;

            // Voice selection
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang === utterance.lang);
            if (voice) utterance.voice = voice;

            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };
            utterance.onerror = () => {
                setIsSpeaking(false);
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // PROCESS INPUT
    useEffect(() => {
        if (!active || !transcript) return;
        processInput(transcript);
    }, [transcript]);

    const processInput = async (inputData) => {
        const { raw, smart } = inputData;
        const inputLower = raw.toLowerCase();
        const currentPrompts = prompts[lang];

        console.log("Processing:", raw, "Step:", step);

        switch (step) {
            // LANG_SELECT Removed. Defaults to English.

            case 'LOGIN_EMAIL':
                if (smart.includes('@') || smart.includes('gmail')) {
                    setTempData(prev => ({ ...prev, email: smart }));
                    setStep('CONFIRM_EMAIL');
                    await speakAsync(currentPrompts.emailConfirm(smart), lang);
                    startListening();
                } else {
                    await speakAsync(currentPrompts.error, lang);
                    startListening();
                }
                break;

            case 'CONFIRM_EMAIL':
                if (currentPrompts.confirmYes.some(w => inputLower.includes(w))) {
                    setStep('LOGIN_PASS');
                    await speakAsync(currentPrompts.passAsk, lang);
                    startListening();
                } else {
                    setStep('LOGIN_EMAIL');
                    await speakAsync(currentPrompts.emailAsk, lang);
                    startListening();
                }
                break;

            case 'LOGIN_PASS':
                if (smart.length > 0) {
                    setTempData(prev => ({ ...prev, password: smart }));
                    await speakAsync(currentPrompts.passConfirm, lang); // No listen immediately

                    if (login(tempData.email, smart)) {
                        navigate('/worker-dashboard');
                        setStep('DASHBOARD');
                        await speakAsync(currentPrompts.dashboardWelcome, lang);
                        startListening();
                    } else {
                        await speakAsync("Login failed.", lang);
                        setStep('LOGIN_EMAIL');
                        startListening();
                    }
                }
                break;

            case 'DASHBOARD':
                if (inputLower.includes('job') || inputLower.includes('work') || inputLower.includes('kaam') || inputLower.includes('chahiye')) {
                    const job = jobs.find(j => j.status === 'open');
                    if (job) {
                        setTempData(prev => ({ ...prev, currentJob: job }));
                        setStep('JOB_DECISION');
                        await speakAsync(currentPrompts.jobFound(job), lang);
                        startListening();
                    } else {
                        await speakAsync("No jobs.", lang);
                        startListening();
                    }
                } else {
                    await speakAsync(currentPrompts.error, lang);
                    startListening();
                }
                break;

            case 'JOB_DECISION':
                if (currentPrompts.confirmYes.some(w => inputLower.includes(w))) {
                    acceptJob(tempData.currentJob.id);
                    await speakAsync(currentPrompts.jobAccepted, lang);
                    setStep('DASHBOARD');
                } else {
                    await speakAsync("Dashboard.", lang);
                    setStep('DASHBOARD');
                }
                break;

            default:
                break;
        }
    };

    const startAssistant = async () => {
        if (!active) {
            setActive(true);
            setLang('en-US'); // Default to English
            setStep('LOGIN_EMAIL');
            await speakAsync(prompts['en-US'].emailAsk, 'en-US');
            if (activeRef.current) startListening();
        } else {
            if (!listening && !isSpeaking) startListening();
        }
    };

    if (!active) {
        return (
            <button
                onClick={startAssistant}
                className="fixed bottom-8 left-8 bg-red-600 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce hover:animate-none transition-all border-4 border-white"
            >
                <Mic className="w-8 h-8" />
                <span className="font-bold">Assistant</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative text-center">
                <button
                    onClick={() => {
                        setActive(false);
                        window.speechSynthesis.cancel();
                        if (window.speechRecognition) window.speechRecognition.stop();
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                    title="Close Assistant"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Status Icon */}
                <div
                    onClick={() => !listening && !isSpeaking && startListening()}
                    className={`cursor-pointer w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${listening ? 'bg-red-600 scale-110 shadow-red-500/50 shadow-xl' :
                        isSpeaking ? 'bg-blue-500 scale-105 animate-pulse' :
                            'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    {listening ? <Mic className="w-10 h-10 text-white" /> :
                        isSpeaking ? <Volume2 className="w-10 h-10 text-white" /> :
                            <RefreshCw className="w-8 h-8 text-gray-400" />}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Assistant</h2>

                <div className="h-12 flex items-center justify-center">
                    <p className="text-lg font-medium text-gray-700">
                        {listening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap icon to speak"}
                    </p>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={() => {
                            setActive(false);
                            window.speechSynthesis.cancel();
                        }}
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        STOP / WRONG BUTTON
                    </button>
                    <p className="text-xs text-gray-400">
                        Current Mode: {step}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
