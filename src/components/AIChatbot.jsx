import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Mic, Volume2, VolumeX, X, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

// Internal translations for chatbot-specific UI
const chatbotTranslations = {
    en: {
        welcome: "Hello! I am WORKMATE AI - your assistant for loan eligibility, government schemes, and job opportunities.",
        help: "How can I help you today? You can ask me about WorkMate AI, loan eligibility, government schemes, or required documents.",
        understand: "I understand. To help you better, could you please provide more details about your income, education, or employment?",
        notUnderstood: "I'm sorry, I didn't quite get that. Could you please rephrase your question?",
        workmateInfo: "WorkMate AI is a comprehensive platform connecting workers with contractors.",
        results: {
            suggestedSchemes: "Here are some relevant government schemes for you:",
            requiredDocs: "Commonly required documents:",
            docsList: ["Aadhaar Card (for identity)", "PAN Card", "Income Proof (Salary slips/ITR)", "Bank Statements", "Address Proof"],
        }
    },
    hi: {
        welcome: "नमस्ते! मैं WORKMATE AI हूँ - ऋण पात्रता, सरकारी योजनाओं और नौकरी के अवसरों के लिए आपका सहायक।",
        help: "आज मैं आपकी किस प्रकार सहायता कर सकता हूँ? आप मुझसे WorkMate AI, ऋण पात्रता, सरकारी योजनाओं या आवश्यक दस्तावेजों के बारे में पूछ सकते हैं।",
        understand: "मैं समझ गया। आपकी बेहतर सहायता के लिए, क्या आप कृपया अपनी आय, शिक्षा या रोजगार के बारे में अधिक जानकारी दे सकते हैं?",
        notUnderstood: "क्षमा करें, मुझे वह बिल्कुल समझ नहीं आया। क्या आप अपना प्रश्न दोहरा सकते हैं?",
        workmateInfo: "WorkMate AI एक व्यापक मंच है जो श्रमिकों को ठेकेदारों से जोड़ता है।",
        results: {
            suggestedSchemes: "यहाँ आपके लिए कुछ प्रासंगिक सरकारी योजनाएं हैं:",
            requiredDocs: "सामान्यतः आवश्यक दस्तावेज:",
            docsList: ["आधार कार्ड (पहचान के लिए)", "पैन कार्ड", "आय का प्रमाण (वेतन पर्ची/ITR)", "बैंक विवरण", "पते का प्रमाण"],
        }
    },
    te: {
        welcome: "నమస్కారం! నేను WORKMATE AI - రుణ అర్హత, ప్రభుత్వ పథకాలు మరియు ఉద్యోగ అవకాశాల కోసం మీ సహాయకుడిని.",
        help: "ఈ రోజు నేను మీకు ఎలా సహాయపడగలను? మీరు WorkMate AI, రుణ అర్హత, ప్రభుత్వ పథకాలు లేదా అవసరమైన పత్రాల గురించి నన్ను అడగవచ్చు.",
        understand: "నాకు అర్థమైంది। మీకు మెరుగ్గా సహాయం చేయడానికి, దయచేసి మీ ఆదాయం, విద్య లేదా ఉపాధి గురించి మరిన్ని వివరాలను అందించగలరా?",
        notUnderstood: "క్షమించండి, నాకు అది సరిగ్గా అర్థం కాలేదు. దయచేసి మీ ప్రశ్నను మళ్లీ అడగండి.",
        workmateInfo: "WorkMate AI అనేది కార్మికులను కాంట్రాక్టర్లతో కనెక్ట్ చేసే సమగ్ర వేదిక.",
        results: {
            suggestedSchemes: "మీ కోసం కొన్ని సంబంధిత ప్రభుత్వ పథకాలు ఇక్కడ ఉన్నాయి:",
            requiredDocs: "సాధారణంగా అవసరమైన పత్రాలు:",
            docsList: ["ఆధార్ కార్డ్ (గుర్తింపు కోసం)", "పాన్ కార్డ్", "ఆదాయ నిరూపణ (జీతం స్లిప్పులు/ITR)", "బ్యాంక్ స్టేట్‌మెంట్స్", "చిరునామా నిరూపణ"],
        }
    }
};

const AIChatbot = () => {
    const { language, t: globalT, getRecommendedSchemes, searchSchemes, currentUser } = useApp();
    const [lang, setLang] = useState(language);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [userContext, setUserContext] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const t = chatbotTranslations[lang];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            // Initial greeting
            addBotMessage(t.welcome);
            setTimeout(() => {
                addBotMessage(t.help);
            }, 1000);
        }
    }, [lang, isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
            recognitionRef.current.lang = langMap[lang];

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [lang]);

    const addBotMessage = (text, type = 'text', data = null) => {
        setMessages(prev => [...prev, { sender: 'bot', text, type, data }]);

        if (autoSpeak && 'speechSynthesis' in window) {
            setTimeout(() => speak(text), 500);
        }
    };

    const speak = (text) => {
        if (!text || !text.trim()) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            // Clean text for speech
            let cleanText = text
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/#{1,6}\s/g, '')
                .replace(/\n+/g, '. ')
                .replace(/•/g, '')
                .replace(/₹/g, 'rupees ')
                .replace(/\[!TIP\]/g, 'Tip: ')
                .replace(/\[!WARNING\]/g, 'Note: ')
                .replace(/\[!CAUTION\]/g, 'Important: ')
                .replace(/>/g, '')
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);
            const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
            utterance.lang = langMap[lang];
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();

            // Try to find the best voice
            const findVoice = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                // Priority 1: Exact language match (e.g., hi-IN)
                let voice = availableVoices.find(v => v.lang === langMap[lang]);
                // Priority 2: Starts with language code (e.g., hi)
                if (!voice) voice = availableVoices.find(v => v.lang.startsWith(lang));
                // Priority 3: Fallback for Indian voices for English
                if (!voice && lang === 'en') voice = availableVoices.find(v => v.lang.includes('IN'));
                return voice;
            };

            const executeSpeak = () => {
                const voice = findVoice();
                if (voice) utterance.voice = voice;

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = (e) => {
                    console.error('Speech synthesis error:', e);
                    setIsSpeaking(false);
                };

                window.speechSynthesis.speak(utterance);
            };

            if (voices.length === 0) {
                window.speechSynthesis.onvoiceschanged = executeSpeak;
            } else {
                executeSpeak();
            }
        }
    };

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const detectIntent = (query) => {
        const lowerQuery = query.toLowerCase();

        // Check for specific intents in priority order
        // 1. Documents (most specific)
        const documentKeywords = [
            'document', 'paper', 'certificate', 'proof', 'required', 'need', 'necessary',
            'दस्तावेज', 'कागजात', 'प्रमाण', 'आवश्यक', 'चाहिए', 'जरूरी',
            'పత్రాలు', 'డాక్యుమెంట్', 'ప్రూఫ్', 'సర్టిఫికేట్', 'అవసరం', 'కావాలి', 'తప్పనిసరి'
        ];

        // 2. Government Schemes (check before WorkMate) - Added plural forms
        const schemeKeywords = [
            'scheme', 'schemes', 'yojana', 'yojanas', 'program', 'programmes', 'mudra', 'svanidhi', 'stand up',
            'government scheme', 'सरकारी योजना', 'ప్రభుత్వ పథకం',
            'योजना', 'योजनाओं', 'कार्यक्रम', 'मुद्रा', 'स्वनिधि', 'सरकार', 'सरकारी', 'लाभ', 'सुविधा',
            'పథకం', 'పథకాలు', 'యోజన', 'కార్యక్రమం', 'ప్రభుత్వం', 'ప్రభుత్వ', 'ప్రయోజనం', 'సౌకర్యం', 'స్కీమ్', 'స్కీమ్స్'
        ];

        // 3. Loan Eligibility
        const eligibilityKeywords = [
            'eligible', 'eligibility', 'qualify', 'loan', 'credit', 'approve', 'approval', 'get loan', 'apply',
            'पात्र', 'पात्रता', 'योग्य', 'ऋण', 'लोन', 'क्रेडिट', 'स्वीकृति', 'मिल सकता', 'आवेदन',
            'అర్హత', 'రుణం', 'లోన్', 'క్రెడిట్', 'ఆమోదం', 'దరఖాస్తు', 'అర్హులు', 'పొందవచ్చు', 'దొరుకుతుంది'
        ];

        // 4. WorkMate AI (only very specific platform queries - removed short ambiguous words)
        const workmateKeywords = [
            'workmate ai', 'workmate', 'work mate ai',
            'वर्कमेट एआई', 'वर्कमेट',
            'వర్క్‌మేట్ ఏఐ', 'వర్క్‌మేట్'
        ];

        // Check in priority order
        if (documentKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'documents';
        }

        if (schemeKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'schemes';
        }

        if (eligibilityKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'eligibility';
        }

        if (workmateKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'workmate';
        }

        return 'general';
    };

    const extractUserInfo = (query) => {
        const newContext = { ...userContext };

        // Remove commas from query for easier number matching
        const cleanQuery = query.replace(/,/g, '');
        const salaryMatch = cleanQuery.match(/(\d+)\s*(thousand|k|lakh|lakhs|rupees|₹|rs|వేలు|లక్ష|హజార్|रुपये|हजार|लाख)?/i);
        if (salaryMatch) {
            let amount = parseInt(salaryMatch[1]);
            const unit = salaryMatch[2]?.toLowerCase();
            if (unit === 'thousand' || unit === 'k' || unit === 'వేలు' || unit === 'हजार' || unit === 'హజార్') amount *= 1000;
            if (unit === 'lakh' || unit === 'lakhs' || unit === 'లక్ష' || unit === 'लाख') amount *= 100000;
            newContext.salary = amount;
        }

        if (query.match(/daily\s*worker|labour|labor|मजदूर|కూలీ|రోజువారీ/i)) {
            newContext.employment = 'daily_worker';
        } else if (query.match(/self.*employ|business|వ్యాపారం|व्यापार/i)) {
            newContext.employment = 'self_employed';
        } else if (query.match(/salaried|job|employee|ఉద్యోగం|नौकरी/i)) {
            newContext.employment = 'salaried';
        }

        setUserContext(newContext);
        return newContext;
    };

    const handleUserQuery = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInputValue('');
        setIsSearching(true);

        const updatedContext = extractUserInfo(userMsg);
        const intent = detectIntent(userMsg);

        try {
            // Priority 1: Instant local responses for common intents
            if (intent === 'workmate') {
                addBotMessage(t.workmateInfo);
                setIsSearching(false);
                return;
            }

            if (intent === 'eligibility' && (updatedContext.salary || updatedContext.employment)) {
                handleEligibilityQuery(updatedContext);
                setIsSearching(false);
                return;
            }

            if (intent === 'documents') {
                handleDocumentsQuery();
                setIsSearching(false);
                return;
            }

            // Priority 2: Gemini API for everything else
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    language: lang,
                    userContext: {
                        ...updatedContext,
                        profile: currentUser
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to fetch from AI');

            const data = await response.json();
            if (data.text) {
                addBotMessage(data.text);
            } else {
                addBotMessage(t.notUnderstood);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // Fallback to local logic if server fails
            if (intent === 'schemes') {
                handleSchemesQuery(userMsg);
            } else {
                addBotMessage(t.notUnderstood);
                setTimeout(() => addBotMessage(t.help), 1000);
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleEligibilityQuery = (context = userContext) => {
        const { salary, employment } = context;

        if (salary) {
            let response = '';
            const isEligible = salary >= 15000;

            let loanTypes = [];
            if (employment === 'daily_worker') {
                if (salary < 10000) {
                    loanTypes = ['Microfinance loans', 'PM SVANidhi (₹10,000)', 'Self-Help Group loans'];
                } else {
                    loanTypes = ['PM Mudra Yojana - Shishu (up to ₹50,000)', 'Microfinance loans', 'Personal loans from cooperative banks'];
                }
            } else if (employment === 'self_employed') {
                if (salary < 25000) {
                    loanTypes = ['PM Mudra Yojana - Shishu/Kishor (₹50,000-₹5 lakh)', 'Business loans', 'Stand-Up India'];
                } else {
                    loanTypes = ['PM Mudra Yojana - Tarun (up to ₹10 lakh)', 'Business loans', 'MSME loans', 'Personal loans'];
                }
            } else {
                if (salary < 20000) {
                    loanTypes = ['Personal loans (₹50,000-₹2 lakh)', 'Gold loans', 'Two-wheeler loans'];
                } else if (salary < 40000) {
                    loanTypes = ['Personal loans (₹2-5 lakh)', 'Home loans (with co-applicant)', 'Car loans', 'Education loans'];
                } else {
                    loanTypes = ['Personal loans (₹5+ lakh)', 'Home loans', 'Car loans', 'Education loans', 'Credit cards'];
                }
            }

            if (lang === 'en') {
                response = `Based on your ${employment === 'daily_worker' ? 'daily worker' : employment === 'self_employed' ? 'self-employed' : 'salaried'} income of ₹${salary.toLocaleString()}/month, you **${isEligible ? 'may be eligible' : 'might face challenges'}** for loans.\n\n`;
                response += `**Suitable loan types for you:**\n`;
                loanTypes.forEach(loan => response += `• ${loan}\n`);
                response += `\n${isEligible
                    ? 'Final approval depends on credit history, existing debts, and the lender. Consider applying through government schemes for better rates.'
                    : 'For lower incomes, microfinance and government schemes offer better options. Building a credit history will help in the future.'}`;
            } else if (lang === 'hi') {
                response = `आपकी ${employment === 'daily_worker' ? 'दैनिक मजदूर' : employment === 'self_employed' ? 'स्वरोजगार' : 'वेतनभोगी'} आय ₹${salary.toLocaleString()}/माह के आधार पर, आप ऋण के लिए **${isEligible ? 'पात्र हो सकते हैं' : 'चुनौतियों का सामना कर सकते हैं'}**।\n\n`;
                response += `**आपके लिए उपयुक्त ऋण प्रकार:**\n`;
                loanTypes.forEach(loan => response += `• ${loan}\n`);
                response += `\n${isEligible
                    ? 'अंतिम स्वीकृति क्रेडिट इतिहास, मौजूदा ऋण और ऋणदाता पर निर्भर करती है। बेहतर दरों के लिए सरकारी योजनाओं के माध्यम से आवेदन करने पर विचार करें।'
                    : 'कम आय के लिए, माइक्रोफाइनेंस और सरकारी योजनाएं बेहतर विकल्प प्रदान करती हैं। भविष्य में क्रेडिट इतिहास बनाने से मदद मिलेगी।'}`;
            } else if (lang === 'te') {
                response = `మీ ${employment === 'daily_worker' ? 'రోజువారీ కూలీ' : employment === 'self_employed' ? 'స్వయం ఉపాధి' : 'ఉద్యోగి'} ఆదాయం నెలకు ₹${salary.toLocaleString()} ఆధారంగా, మీరు రుణాల కోసం **${isEligible ? 'అర్హులు కావచ్చు' : 'కొన్ని ఇబ్బందులు ఎదుర్కోవచ్చు'}**.\n\n`;
                response += `**మీకు సరిపోయే రుణ రకాలు:**\n`;
                loanTypes.forEach(loan => response += `• ${loan}\n`);
                response += `\n${isEligible
                    ? 'తుది ఆమోదం క్రెడిట్ చరిత్ర, ఇప్పటికే ఉన్న అప్పులు మరియు రుణదాతపై ఆధారపడి ఉంటుంది. మెరుగైన వడ్డీ రేట్ల కోసం ప్రభుత్వ పథకాల ద్వారా దరఖాస్తు చేసుకోవడాన్ని పరిశీలించండి.'
                    : 'తక్కువ ఆదాయం ఉన్నవారికి, మైక్రోఫైనాన్స్ మరియు ప్రభుత్వ పథకాలు మెరుగైన ఎంపికలను అందిస్తాయి. క్రెడిట్ హిస్టరీని నిర్మించుకోవడం భవిష్యత్తులో సహాయపడుతుంది.'}`;
            }

            addBotMessage(response);
        } else {
            addBotMessage(t.understand);
        }
    };

    const handleSchemesQuery = async (query = "") => {
        setIsSearching(true);
        addBotMessage(t.results.suggestedSchemes);

        try {
            let recommended = [];
            if (query && query.length > 3) {
                // If specific query, search first
                recommended = await searchSchemes(query);
            }

            if (recommended.length === 0) {
                // Otherwise use recommendation engine based on profile
                const profile = {
                    totalEarnings: currentUser?.totalEarnings || userContext.salary || 0,
                    skills: currentUser?.skills || [],
                    location: currentUser?.location || ""
                };
                recommended = await getRecommendedSchemes(profile, 5);
            }

            if (recommended.length > 0) {
                recommended.forEach((s, i) => {
                    // Normalize data structure (server might return {name, data} or {scheme_name, ...})
                    const schemeData = s.data || s;
                    const name = s.name || s.scheme_name || schemeData.scheme_name;
                    const desc = schemeData.simple || schemeData.description || schemeData.short_description || "Details not available.";

                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            sender: 'bot',
                            type: 'scheme',
                            name: name,
                            desc: desc
                        }]);

                        if (autoSpeak && 'speechSynthesis' in window) {
                            setTimeout(() => speak(`${name}. ${desc}`), 300);
                        }
                    }, (i + 1) * 800);
                });
            } else {
                addBotMessage(lang === 'en' ? "I couldn't find any specific schemes for you at the moment." :
                    lang === 'hi' ? "मुझे अभी आपके लिए कोई विशिष्ट योजना नहीं मिली।" :
                        "ప్రస్తుతానికి మీ కోసం ఎటువంటి పథకాలు కనుగొనబడలేదు.");
            }
        } catch (error) {
            console.error('Error fetching schemes:', error);
            addBotMessage("Sorry, I encountered an error while searching for schemes.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDocumentsQuery = () => {
        addBotMessage(t.results.requiredDocs);
        setTimeout(() => {
            setMessages(prev => [...prev, {
                sender: 'bot',
                type: 'docs',
                list: t.results.docsList
            }]);
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative p-[2px] rounded-full bg-gradient-to-r from-red-500 via-gray-400 to-red-500 shadow-xl hover:scale-105 transition-transform"
                    >
                        <div className="bg-white p-4 rounded-full flex items-center gap-2 relative">
                            <Sparkles className="w-6 h-6 text-red-600 animate-pulse" />
                            <span className="font-bold bg-gradient-to-r from-red-600 to-gray-600 bg-clip-text text-transparent hidden sm:inline">
                                WORKMATE AI
                            </span>
                        </div>
                    </button>
                )}

                {isOpen && (
                    <div className="mb-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[350px] sm:w-[400px] flex flex-col border border-white/50 animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-black/5">
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-gray-50 rounded-t-2xl flex justify-between items-center border-b border-white/50 sticky top-0 z-20">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                                <span className="font-bold text-gray-800 text-xs sm:text-sm truncate">WORKMATE AI</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="flex gap-1">
                                    <button className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`} onClick={() => setLang('en')}>EN</button>
                                    <button className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'hi' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`} onClick={() => setLang('hi')}>हिं</button>
                                    <button className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'te' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`} onClick={() => setLang('te')}>తె</button>
                                    <button
                                        className={`px-2 py-1 rounded ${autoSpeak || isSpeaking ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                        onClick={() => {
                                            // Stop speech if currently speaking
                                            if (isSpeaking || window.speechSynthesis.speaking) {
                                                window.speechSynthesis.cancel();
                                                setIsSpeaking(false);
                                            }
                                            // Toggle auto-speak
                                            setAutoSpeak(!autoSpeak);
                                        }}
                                        title={isSpeaking ? "Stop speaking" : "Toggle auto-speak"}
                                    >
                                        {(autoSpeak || isSpeaking) ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div
                            className="h-[400px] overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            <AnimatePresence>
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.sender === 'user' ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-red-50 to-gray-100 border-red-100'}`}>
                                            {m.sender === 'user' ? <User className="w-4 h-4 text-gray-500" /> : <Sparkles className="w-4 h-4 text-red-600" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm ${m.sender === 'user' ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
                                            {m.type === 'scheme' ? (
                                                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                                                    <h3 className="font-bold text-red-700 mb-2">{m.name}</h3>
                                                    <p className="text-xs text-gray-600 whitespace-pre-line">{m.desc}</p>
                                                </div>
                                            ) : m.type === 'docs' ? (
                                                <ul className="pl-5 space-y-1">
                                                    {m.list.map((doc, di) => <li key={di} className="text-gray-600">{doc}</li>)}
                                                </ul>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <AnimatePresence>
                                {isSearching && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-gradient-to-br from-red-50 to-gray-100 border-red-100">
                                            <Sparkles className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white/50 border-t border-gray-100 rounded-b-2xl">
                            <div className="relative flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-red-100 focus-within:border-red-300 transition-all">
                                <button
                                    onClick={toggleVoiceInput}
                                    className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                <input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleUserQuery()}
                                    placeholder={lang === 'en' ? "Ask me anything..." : lang === 'hi' ? "मुझसे कुछ भी पूछें..." : "నన్ను ఏదైనా అడగండి..."}
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                />
                                <button
                                    onClick={handleUserQuery}
                                    disabled={!inputValue.trim()}
                                    className="p-2 bg-gradient-to-r from-red-600 to-gray-600 text-white rounded-full hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIChatbot;
