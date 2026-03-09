import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const VoiceInteractionLayer = () => {
    const location = useLocation();
    const { language } = useApp();

    // 1. Context Awareness: Stop speech on navigation
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, [location.pathname]);

    // 2. Language Synchronization: Ensure voice uses UI language
    // This is mostly handled by the individual VoiceInput components reading the context,
    // but we can set a global default if needed.
    useEffect(() => {
        // Optional: Could announce "Language changed to Hindi" etc if desired.
        // For now, silently sync preference.
    }, [language]);

    return null; // Headless component
};

export default VoiceInteractionLayer;
