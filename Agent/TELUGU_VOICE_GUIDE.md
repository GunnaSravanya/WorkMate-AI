# Telugu Voice Support - Troubleshooting Guide

## What I Fixed

### Text-to-Speech (TTS) Improvements
1. **Voice Selection**: The app now actively searches for Telugu voices installed on your system
2. **Fallback Mechanism**: If voices aren't loaded initially, it waits for them to load
3. **Better Error Handling**: Logs errors to console for debugging

### Speech Recognition (STT) Improvements
1. **Error Messages**: Now shows helpful alerts in Telugu when no speech is detected
2. **Language Code**: Uses `te-IN` for Telugu India

## Important Notes

### Telugu TTS May Not Work If:
- **No Telugu voice installed**: Windows/Chrome may not have Telugu voices by default
- **Browser limitation**: Some browsers have limited language support

### How to Check Available Voices
Open browser console (F12) and run:
```javascript
window.speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang));
```

### Solutions:
1. **For Windows**: Install Telugu language pack from Settings → Time & Language → Language
2. **For Chrome**: Telugu voices should work after language pack installation
3. **Alternative**: Use Google Cloud Text-to-Speech API for guaranteed Telugu support (requires API key)

### Telugu STT May Not Work If:
- **Microphone permissions denied**: Allow microphone access
- **Browser doesn't support `te-IN`**: Try Chrome/Edge (best support)
- **Network issues**: Speech recognition requires internet connection

## Testing
1. Switch to Telugu (తెలుగు button)
2. Click microphone and say: "నాకు రుణం అర్హత ఉందా?" (Am I eligible for a loan?)
3. Toggle speaker icon and check if responses are spoken

If Telugu voice still doesn't work, it's likely a system/browser limitation. The text responses will still work correctly.
