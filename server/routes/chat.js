import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/', async (req, res) => {
    const { message, language, userContext } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyB3IWsVPjUgqBd1fxnPAg5N_rj0OwqycnI';
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[chat] GEMINI_API_KEY not found in env; using fallback');
        }

        console.log(`[chat] Using API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        // use 1.5-flash-latest for better compatibility
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const langMap = {
            en: "English",
            hi: "Hindi",
            te: "Telugu"
        };

        const targetLang = langMap[language] || "English";

        const systemPrompt = `You are WORKMATE AI, a helpful assistant for the WorkMate AI platform. 
        The platform connects workers (plumbers, electricians, laborers) with contractors.
        Key features include:
        - Job opportunities and attendance tracking.
        - Government schemes (PM Mudra Yojana, PM SVANidhi, etc.).
        - Loan eligibility and application support.
        - Multilingual support in English, Hindi, and Telugu.

        Rules:
        1. Always respond in ${targetLang}.
        2. Be concise, polite, and practical.
        3. If you don't know something, suggest checking the dedicated 'Schemes' or 'Loans' tabs in the dashboard.
        4. Focus on helping workers improve their lives through better work and financial support.
        
        User Context (Current Profile): ${JSON.stringify(userContext || {})}
        
        Question: ${message}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        if (error.response) {
            console.error('Error Response Details:', JSON.stringify(error.response, null, 2));
        }
        res.status(error.status || 500).json({
            error: "Failed to get response from AI",
            details: error.message,
            status: error.status
        });
    }
});

export default router;
