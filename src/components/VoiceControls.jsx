import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Globe } from 'lucide-react';

// Dictionary for system feedback
const dictionary = {
    'en-US': {
        listening: "Listening...",
        selected: "English selected",
        processed: "I heard: "
    },
    'hi-IN': {
        listening: "sun raha hoon...",
        selected: "Hindi chuna gaya hai",
        processed: "Maine suna: "
    }
};

// Global Speak Helper
// Global Speak Helper
export const triggerSpeak = (text, language = 'en-US', onEnd = null) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === language);
        if (voice) utterance.voice = voice;

        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        if (onEnd) onEnd(); // Fallback if no TTS support
    }
};

// --- CORE HOOK: Handles Speech-to-Text Logic ---
export const useSpeechRecognition = () => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lang, setLang] = useState('en-US');

    // Store recognition instance to allow stopping
    const recognitionRef = React.useRef(null);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                setListening(false);
            } catch (e) {
                console.warn("Could not stop recognition:", e);
            }
        }
    }, []);

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Voice recognition not supported.");
            return;
        }

        try {
            // Abort previous instance if exists
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition; // Store ref

            recognition.lang = lang;
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setListening(true);
            };

            recognition.onend = () => {
                setListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setListening(false);
            };

            recognition.onresult = (event) => {
                const raw = event.results[0][0].transcript;

                // Smart Parsing
                let smart = raw.toLowerCase()
                    .replace(/at the rate|at rate/g, '@')
                    .replace(/dot/g, '.')
                    .replace(/ /g, '');

                setTranscript({ raw, smart, lang });
            };

            recognition.start();
        } catch (e) {
            console.error("Speech recognition start failed:", e);
            setListening(false);
        }
    }, [lang]);

    return { listening, transcript, startListening, stopListening, lang, setLang };
};

// --- COMPONENT: Headless output handler + Optional legacy UI ---
const VoiceControls = ({ showUI = false }) => {
    const [lang, setLang] = useState('en-US');

    // Listen for global speak events (legacy support for other components)
    useEffect(() => {
        const handleSpeak = (e) => triggerSpeak(e.detail.text, e.detail.language);
        window.addEventListener('speak-text', handleSpeak);
        return () => window.removeEventListener('speak-text', handleSpeak);
    }, []);

    if (!showUI) return null; // Hidden by default now

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Simple visual indicator if needed, but we rely on Assistant now */}
        </div>
    );
};

// Legacy hook wrapper for components not updated yet
export const useVoiceInput = (callback) => {
    // This is a shim. Ideally components should use useSpeechRecognition directly.
};

export default VoiceControls;
