import React, { useState, useEffect, useRef } from 'react';
import { translations } from './data/translations';
import { Send, Bot, Mic, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
    const [lang, setLang] = useState('en');
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [userContext, setUserContext] = useState({}); // Track user info
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const t = translations[lang];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Initial greeting only
        addBotMessage(t.welcome);
        setTimeout(() => {
            addBotMessage(t.help);
        }, 1000);
    }, [lang]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            // Set language based on current selection
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
                if (event.error === 'no-speech') {
                    alert(lang === 'en' ? 'No speech detected. Please try again.' :
                        lang === 'hi' ? 'कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।' :
                            'ఏ మాటా వినబడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [lang]);

    const addBotMessage = (text, type = 'text', data = null) => {
        setMessages(prev => [...prev, { sender: 'bot', text, type, data }]);

        // Auto-speak if enabled
        if (autoSpeak && 'speechSynthesis' in window) {
            setTimeout(() => speak(text), 500);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
            const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
            utterance.lang = langMap[lang];
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to find a voice that matches the language
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice =>
                voice.lang.startsWith(lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en')
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                setIsSpeaking(false);
            };

            // Ensure voices are loaded before speaking
            if (voices.length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    const newVoices = window.speechSynthesis.getVoices();
                    const voice = newVoices.find(v =>
                        v.lang.startsWith(lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en')
                    );
                    if (voice) utterance.voice = voice;
                    window.speechSynthesis.speak(utterance);
                };
            } else {
                window.speechSynthesis.speak(utterance);
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

        // Eligibility keywords - English, Hindi, Telugu
        const eligibilityKeywords = [
            // English
            'eligible', 'eligibility', 'qualify', 'loan', 'credit', 'approve', 'approval', 'get loan', 'apply',
            // Hindi
            'पात्र', 'पात्रता', 'योग्य', 'ऋण', 'लोन', 'क्रेडिट', 'स्वीकृति', 'मिल सकता', 'आवेदन',
            // Telugu
            'అర్హత', 'రుణం', 'లోన్', 'క్రెడిట్', 'ఆమోదం', 'దరఖాస్తు', 'అర్హులు', 'పొందవచ్చు', 'దొరుకుతుంది'
        ];

        // Scheme keywords - English, Hindi, Telugu
        const schemeKeywords = [
            // English
            'scheme', 'yojana', 'program', 'mudra', 'svanidhi', 'stand up', 'government', 'benefit',
            // Hindi
            'योजना', 'कार्यक्रम', 'मुद्रा', 'स्वनिधि', 'सरकार', 'लाभ', 'सुविधा',
            // Telugu
            'పథకం', 'యోజన', 'కార్యక్రమం', 'ప్రభుత్వం', 'ప్రయోజనం', 'సౌకర్యం', 'స్కీమ్'
        ];

        // Document keywords - English, Hindi, Telugu
        const documentKeywords = [
            // English
            'document', 'paper', 'certificate', 'proof', 'required', 'need', 'necessary',
            // Hindi
            'दस्तावेज', 'कागजात', 'प्रमाण', 'आवश्यक', 'चाहिए', 'जरूरी',
            // Telugu
            'పత్రాలు', 'డాక్యుమెంట్', 'ప్రూఫ్', 'సర్టిఫికేట్', 'అవసరం', 'కావాలి', 'తప్పనిసరి'
        ];

        // Check for eligibility
        if (eligibilityKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'eligibility';
        }

        // Check for schemes
        if (schemeKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'schemes';
        }

        // Check for documents
        if (documentKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'documents';
        }

        return 'general';
    };

    const extractUserInfo = (query) => {
        const newContext = { ...userContext };

        // Extract salary/income (supports ₹, Rs, rupees, numbers)
        const salaryMatch = query.match(/(\d+)\s*(thousand|k|lakh|lakhs|rupees|₹|rs)?/i);
        if (salaryMatch) {
            let amount = parseInt(salaryMatch[1]);
            const unit = salaryMatch[2]?.toLowerCase();
            if (unit === 'thousand' || unit === 'k') amount *= 1000;
            if (unit === 'lakh' || unit === 'lakhs') amount *= 100000;
            newContext.salary = amount;
        }

        // Extract employment type
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

    const handleUserQuery = () => {
        if (!inputValue.trim()) return;

        setMessages(prev => [...prev, { sender: 'user', text: inputValue }]);
        const query = inputValue;
        setInputValue('');

        // Extract user info from query
        const updatedContext = extractUserInfo(query);

        const intent = detectIntent(query);

        setTimeout(() => {
            if (intent === 'eligibility') {
                handleEligibilityQuery(updatedContext);
            } else if (intent === 'schemes') {
                handleSchemesQuery();
            } else if (intent === 'documents') {
                handleDocumentsQuery();
            } else {
                // Check if user is providing additional info
                if (updatedContext.salary || updatedContext.employment) {
                    handleEligibilityQuery(updatedContext);
                } else {
                    addBotMessage(t.notUnderstood);
                    setTimeout(() => addBotMessage(t.help), 1000);
                }
            }
        }, 800);
    };

    const handleEligibilityQuery = (context = userContext) => {
        const { salary, employment } = context;

        // If we have enough info, provide specific answer
        if (salary) {
            let response = '';
            const isEligible = salary >= 15000;

            // Determine suitable loan types based on profile
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
            } else { // salaried or general
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
                response = `आपकी ${employment === 'daily_worker' ? 'दैनिक मजदूर' : employment === 'self_employed' ? 'स्व-नियोजित' : 'वेतनभोगी'} आय ₹${salary.toLocaleString()}/माह के आधार पर, आप ऋण के लिए **${isEligible ? 'पात्र हो सकते हैं' : 'चुनौतियों का सामना कर सकते हैं'}**।\n\n`;
                const hindiLoans = loanTypes.map(loan =>
                    loan.replace('Microfinance loans', 'सूक्ष्म वित्त ऋण')
                        .replace('Personal loans', 'व्यक्तिगत ऋण')
                        .replace('Business loans', 'व्यापार ऋण')
                        .replace('Home loans', 'गृह ऋण')
                        .replace('Car loans', 'कार ऋण')
                        .replace('Education loans', 'शिक्षा ऋण')
                        .replace('Gold loans', 'सोने पर ऋण')
                        .replace('Two-wheeler loans', 'दोपहिया ऋण')
                        .replace('Credit cards', 'क्रेडिट कार्ड')
                );
                response += `**आपके लिए उपयुक्त ऋण प्रकार:**\n`;
                hindiLoans.forEach(loan => response += `• ${loan}\n`);
                response += `\n${isEligible
                    ? 'अंतिम स्वीकृति क्रेडिट इतिहास, मौजूदा कर्ज और ऋणदाता पर निर्भर करती है। बेहतर दरों के लिए सरकारी योजनाओं के माध्यम से आवेदन करने पर विचार करें।'
                    : 'कम आय के लिए, सूक्ष्म वित्त और सरकारी योजनाएं बेहतर विकल्प प्रदान करती हैं। क्रेडिट इतिहास बनाने से भविष्य में मदद मिलेगी।'}`;
            } else {
                response = `మీ ${employment === 'daily_worker' ? 'రోజువారీ కూలీ' : employment === 'self_employed' ? 'స్వయం ఉపాధి' : 'జీతం పొందే'} ఆదాయం ₹${salary.toLocaleString()}/నెల ఆధారంగా, మీరు రుణాలకు **${isEligible ? 'అర్హులు కావచ్చు' : 'సవాళ్లను ఎదుర్కోవచ్చు'}**।\n\n`;
                const teluguLoans = loanTypes.map(loan =>
                    loan.replace('Microfinance loans', 'సూక్ష్మ ఆర్థిక రుణాలు')
                        .replace('Personal loans', 'వ్యక్తిగత రుణాలు')
                        .replace('Business loans', 'వ్యాపార రుణాలు')
                        .replace('Home loans', 'గృహ రుణాలు')
                        .replace('Car loans', 'కార్ రుణాలు')
                        .replace('Education loans', 'విద్యా రుణాలు')
                        .replace('Gold loans', 'బంగారం రుణాలు')
                        .replace('Two-wheeler loans', 'ద్విచక్ర వాహన రుణాలు')
                        .replace('Credit cards', 'క్రెడిట్ కార్డులు')
                );
                response += `**మీకు అనుకూలమైన రుణ రకాలు:**\n`;
                teluguLoans.forEach(loan => response += `• ${loan}\n`);
                response += `\n${isEligible
                    ? 'తుది ఆమోదం క్రెడిట్ చరిత్ర, ఇప్పటికే ఉన్న అప్పులు మరియు రుణదాతపై ఆధారపడి ఉంటుంది। మెరుగైన రేట్ల కోసం ప్రభుత్వ పథకాల ద్వారా దరఖాస్తు చేసుకోవడాన్ని పరిగణించండి।'
                    : 'తక్కువ ఆదాయానికి, సూక్ష్మ ఆర్థిక మరియు ప్రభుత్వ పథకాలు మెరుగైన ఎంపికలను అందిస్తాయి। క్రెడిట్ చరిత్రను నిర్మించడం భవిష్యత్తులో సహాయపడుతుంది।'}`;
            }

            addBotMessage(response);
        } else {
            // Ask for more info
            addBotMessage(t.understand);
        }
    };

    const handleSchemesQuery = () => {
        const schemes = [
            {
                name: "Pradhan Mantri Mudra Yojana (PMMY)",
                desc: lang === 'en'
                    ? "**Loan Amount:** Up to ₹10 Lakhs (3 categories: Shishu ₹50k, Kishor ₹5L, Tarun ₹10L)\n**Eligibility:** Non-corporate small/micro enterprises, traders, manufacturers, service providers\n**Benefits:** No collateral required, low interest rates, easy processing\n**How to Apply:** Visit any bank/NBFC with business plan and KYC documents"
                    : lang === 'hi'
                        ? "**ऋण राशि:** ₹10 लाख तक (3 श्रेणियां: शिशु ₹50k, किशोर ₹5L, तरुण ₹10L)\n**पात्रता:** गैर-कॉर्पोरेट लघु/सूक्ष्म उद्यम, व्यापारी, निर्माता, सेवा प्रदाता\n**लाभ:** कोई संपार्श्विक आवश्यक नहीं, कम ब्याज दरें, आसान प्रक्रिया\n**आवेदन:** व्यवसाय योजना और KYC दस्तावेजों के साथ किसी भी बैंक/NBFC में जाएं"
                        : "**రుణ మొత్తం:** ₹10 లక్షల వరకు (3 వర్గాలు: శిశు ₹50k, కిశోర్ ₹5L, తరుణ్ ₹10L)\n**అర్హత:** కార్పొరేట్ కాని చిన్న/సూక్ష్మ సంస్థలు, వ్యాపారులు, తయారీదారులు, సేవా ప్రదాతలు\n**ప్రయోజనాలు:** తాకట్టు అవసరం లేదు, తక్కువ వడ్డీ రేట్లు, సులభ ప్రాసెసింగ్\n**దరఖాస్తు:** వ్యాపార ప్రణాళిక మరియు KYC పత్రాలతో ఏదైనా బ్యాంక్/NBFC ను సందర్శించండి"
            },
            {
                name: "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
                desc: lang === 'en'
                    ? "**Loan Amount:** ₹10,000 (1st loan), ₹20,000 (2nd), ₹50,000 (3rd) - on timely repayment\n**Eligibility:** Street vendors, hawkers, thela/rehri walas selling goods/services\n**Benefits:** No collateral, 7% interest subsidy on timely repayment, digital transaction cashback\n**How to Apply:** Through ULB/Town Vending Committee or online portal pmsvanidhi.mohua.gov.in"
                    : lang === 'hi'
                        ? "**ऋण राशि:** ₹10,000 (पहला ऋण), ₹20,000 (दूसरा), ₹50,000 (तीसरा) - समय पर चुकौती पर\n**पात्रता:** रेहड़ी-पटरी वाले, फेरीवाले, थेला/रेहड़ी वाले जो सामान/सेवाएं बेचते हैं\n**लाभ:** कोई संपार्श्विक नहीं, समय पर चुकौती पर 7% ब्याज सब्सिडी, डिजिटल लेनदेन कैशबैक\n**आवेदन:** ULB/टाउन वेंडिंग कमेटी या ऑनलाइन पोर्टल pmsvanidhi.mohua.gov.in के माध्यम से"
                        : "**రుణ మొత్తం:** ₹10,000 (1వ రుణం), ₹20,000 (2వ), ₹50,000 (3వ) - సకాలంలో తిరిగి చెల్లించినప్పుడు\n**అర్హత:** వీధి వ్యాపారులు, హాకర్లు, థేలా/రెహ్రీ వాలాలు వస్తువులు/సేవలు విక్రయిస్తున్నవారు\n**ప్రయోజనాలు:** తాకట్టు లేదు, సకాలంలో తిరిగి చెల్లించినప్పుడు 7% వడ్డీ సబ్సిడీ, డిజిటల్ లావాదేవీ క్యాష్‌బ్యాక్\n**దరఖాస్తు:** ULB/టౌన్ వెండింగ్ కమిటీ లేదా ఆన్‌లైన్ పోర్టల్ pmsvanidhi.mohua.gov.in ద్వారా"
            },
            {
                name: "Stand-Up India Scheme",
                desc: lang === 'en'
                    ? "**Loan Amount:** ₹10 lakh to ₹1 Crore for greenfield enterprises\n**Eligibility:** SC/ST and/or Women entrepreneurs (18+ years) for manufacturing, services, or trading\n**Benefits:** Composite loan (term + working capital), margin money up to 25%, repayment up to 7 years\n**How to Apply:** Through bank branches with project report, identity & category proof"
                    : lang === 'hi'
                        ? "**ऋण राशि:** नए उद्यमों के लिए ₹10 लाख से ₹1 करोड़\n**पात्रता:** एससी/एसटी और/या महिला उद्यमी (18+ वर्ष) विनिर्माण, सेवाओं या व्यापार के लिए\n**लाभ:** समग्र ऋण (अवधि + कार्यशील पूंजी), 25% तक मार्जिन मनी, 7 साल तक चुकौती\n**आवेदन:** परियोजना रिपोर्ट, पहचान और श्रेणी प्रमाण के साथ बैंक शाखाओं के माध्यम से"
                        : "**రుణ మొత్తం:** కొత్త సంస్థలకు ₹10 లక్షల నుండి ₹1 కోటి\n**అర్హత:** SC/ST మరియు/లేదా మహిళా వ్యవసాయదారులు (18+ సంవత్సరాలు) తయారీ, సేవలు లేదా వ్యాపారం కోసం\n**ప్రయోజనాలు:** మిశ్రమ రుణం (టర్మ్ + వర్కింగ్ క్యాపిటల్), 25% వరకు మార్జిన్ మనీ, 7 సంవత్సరాల వరకు తిరిగి చెల్లింపు\n**దరఖాస్తు:** ప్రాజెక్ట్ రిపోర్ట్, గుర్తింపు & వర్గ ప్రూఫ్‌తో బ్యాంక్ శాఖల ద్వారా"
            }
        ];

        addBotMessage(t.results.suggestedSchemes);

        schemes.forEach((s, i) => {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    type: 'scheme',
                    name: s.name,
                    desc: s.desc
                }]);
            }, (i + 1) * 800);
        });
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
        <div className="chat-container">
            <div className="chat-header">
                <Bot size={32} color="#9b4dff" />
                <div>
                    <h1>BHARAT ASSIST</h1>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Multilingual Loan & Scheme Guide</p>
                </div>
                <div className="lang-selector">
                    <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                    <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हिन्दी</button>
                    <button className={`lang-btn ${lang === 'te' ? 'active' : ''}`} onClick={() => setLang('te')}>తెలుగు</button>
                    <button
                        className={`lang-btn ${autoSpeak ? 'active' : ''}`}
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        title="Toggle auto-speak"
                    >
                        {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                <AnimatePresence>
                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message ${m.sender}`}
                        >
                            {m.type === 'scheme' ? (
                                <div className="scheme-card">
                                    <h3>{m.name}</h3>
                                    <p>{m.desc}</p>
                                </div>
                            ) : m.type === 'docs' ? (
                                <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                                    {m.list.map((doc, di) => <li key={di}>{doc}</li>)}
                                </ul>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer">
                <div className="input-container">
                    <button
                        className={`mic-btn ${isListening ? 'listening' : ''}`}
                        onClick={toggleVoiceInput}
                        title="Voice input"
                    >
                        <Mic size={20} color={isListening ? '#ff4d4d' : '#fff'} />
                    </button>
                    <input
                        type="text"
                        className="text-input"
                        placeholder={lang === 'en' ? "Ask me anything..." : lang === 'hi' ? "मुझसे कुछ भी पूछें..." : "నన్ను ఏదైనా అడగండి..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserQuery()}
                    />
                    <button className="send-btn" onClick={handleUserQuery}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
