import React, { useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition, triggerSpeak } from './VoiceControls';
import { useApp } from '../context/AppContext';

const VoiceInput = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    className = "",
    contextHelp, // Text to speak when mic is clicked
    id
}) => {
    const { language, t } = useApp();
    const { listening, transcript, startListening, stopListening, setLang } = useSpeechRecognition();

    // Handle transcript result
    useEffect(() => {
        if (transcript && transcript.raw) {
            // If it's a number field, try to parse
            if (type === 'number') {
                const num = transcript.raw.replace(/[^0-9.]/g, '');
                onChange({ target: { value: num, name: id } });
            } else {
                onChange({ target: { value: transcript.raw, name: id } });
            }
        }
    }, [transcript, type, id]);

    const handleMicClick = () => {
        if (listening) {
            stopListening();
            return;
        }

        // 1. Speak context help in LOCAL language
        const textToSpeak = contextHelp || label || placeholder;

        // STT Language: ALWAYS English (for data entry)
        const sttLang = 'en-IN';

        // TTS Language: App Language (for guidance)
        const langMap = { 'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN' };
        const ttsLang = langMap[language] || 'en-US';

        if (textToSpeak) {
            // Updated to use callback: Only start listening AFTER speaking is done
            triggerSpeak(textToSpeak, ttsLang, () => {
                setLang(sttLang);
                // Tiny safety delay to ensure mic doesn't catch echo
                setTimeout(() => startListening(), 100);
            });
        } else {
            setLang(sttLang);
            startListening();
        }
    };

    // Wrapper to prioritize typing
    // If user types, we ABORT any active voice listening to prevent overwrites
    const handleManualChange = (e) => {
        if (listening && stopListening) {
            stopListening();
        }
        onChange(e);
    };

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    id={id}
                    name={id}
                    value={value}
                    onChange={handleManualChange}
                    placeholder={placeholder}
                    className={`block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm ${listening ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                />
                <button
                    type="button"
                    onClick={handleMicClick}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors ${listening ? 'text-red-600 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
                    title={listening ? "Stop Listening" : "Tap to Speak"}
                >
                    {listening ? (
                        <span className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </span>
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>
            </div>
            {listening && (
                <p className="text-xs text-red-500 animate-pulse font-medium">Listening...</p>
            )}
        </div>
    );
};

export default VoiceInput;
