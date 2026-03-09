import express from 'express';
import twilio from 'twilio';
import mongoose from 'mongoose';
import VerificationCall from '../models/VerificationCall.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Language configurations
const LANGUAGES = {
    en: {
        name: 'English',
        voice: 'Polly.Joanna',
        welcome: 'Welcome. Press 1 for English. Press 2 for Hindi. Press 3 for Telugu.',
        verification: (name, workerId, start, end, jobRole, wage) =>
            `Hello, this is a verification call. A worker named ${name}, with worker I D ${workerId}, says he worked as a ${jobRole} for you from ${start} to ${end} for a wage of ${wage} rupees. If this is correct, press 1. If this is not correct, press 2. Thank you.`,
        confirmed: 'Thank you. The employment details have been confirmed. Goodbye.',
        denied: 'Thank you. The employment details have been marked as incorrect. Goodbye.',
        noInput: 'We did not receive your response. Goodbye.',
        invalid: 'Invalid input. Please press 1 to confirm or 2 to deny.'
    },
    hi: {
        name: 'Hindi',
        voice: 'Polly.Aditi',
        welcome: 'स्वागत है। अंग्रेज़ी के लिए 1 दबाएं। हिंदी के लिए 2 दबाएं। तेलुगु के लिए 3 दबाएं।',
        verification: (name, workerId, start, end, jobRole, wage) =>
            `नमस्ते, यह एक सत्यापन कॉल है। ${name} नामक एक कर्मचारी, जिसकी कर्मचारी आई डी ${workerId} है, का कहना है कि उसने ${start} से ${end} तक ${jobRole} के रूप में ${wage} रुपये की मजदूरी पर आपके अधीन काम किया। अगर यह सही है, तो 1 दबाएं। अगर यह गलत है, तो 2 दबाएं। धन्यवाद।`,
        confirmed: 'धन्यवाद। रोजगार विवरण की पुष्टि हो गई है। अलविदा।',
        denied: 'धन्यवाद। रोजगार विवरण गलत के रूप में चिह्नित किया गया है। अलविदा।',
        noInput: 'हमें आपका जवाब नहीं मिला। अलविदा।',
        invalid: 'अमान्य इनपुट। पुष्टि करने के लिए 1 या अस्वीकार करने के लिए 2 दबाएं।'
    },
    te: {
        name: 'Telugu',
        voice: 'Polly.Aditi', // Using Hindi voice as fallback for Telugu
        welcome: 'స్వాగతం. ఇంగ్లీష్ కోసం 1 నొక్కండి. హిందీ కోసం 2 నొక్కండి. తెలుగు కోసం 3 నొక్కండి.',
        verification: (name, workerId, start, end, jobRole, wage) =>
            `నమస్కారం, ఇది ధృవీకరణ కాల్. ${name} అనే కార్మికుడు, వర్కర్ ఐడి ${workerId}, ${start} నుండి ${end} వరకు ${jobRole} గా ${wage} రూపాయల వేతనంతో మీ క్రింద పని చేశానని చెప్పారు. ఇది సరైనదైతే, 1 నొక్కండి. ఇది సరైనది కాకపోతే, 2 నొక్కండి. ధన్యవాదాలు.`,
        confirmed: 'ధన్యవాదాలు. ఉద్యోగ వివరాలు నిర్ధారించబడ్డాయి. వీడ్కోలు.',
        denied: 'ధన్యవాదాలు. ఉద్యోగ వివరాలు తప్పుగా గుర్తించబడ్డాయి. వీడ్కోలు.',
        noInput: 'మేము మీ ప్రతిస్పందన అందుకోలేదు. వీడ్కోలు.',
        invalid: 'చెల్లని ఇన్‌పుట్. నిర్ధారించడానికి 1 లేదా తిరస్కరించడానికి 2 నొక్కండి.'
    }
};

// Twilio client initialization
const getTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
    }

    return twilio(accountSid, authToken);
};

// ================== IN-MEMORY FALLBACK (If MongoDB fails) ==================
const mockDb = new Map();

const getVerification = async (id) => {
    try {
        const doc = await VerificationCall.findById(id);
        if (doc) return doc;
    } catch (err) {
        // Fallback to mock
    }
    return mockDb.get(id?.toString());
};

const saveVerification = async (verification) => {
    try {
        // Try saving to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            return await verification.save();
        }
    } catch (err) {
        console.error('MongoDB save failed, using fallback:', err.message);
    }

    // Fallback: Save to in-memory mock DB
    if (!verification._id) {
        verification._id = 'mock_' + Math.random().toString(36).substr(2, 9);
    }

    // Convert Mongoose doc to plain object for mock storage if needed
    const data = verification.toObject ? verification.toObject() : verification;
    if (!data._id) data._id = verification._id;

    // Add mock save methods so it behaves like a Mongoose doc
    data.save = async function () {
        mockDb.set(this._id.toString(), this);
        return this;
    };

    mockDb.set(data._id.toString(), data);
    return data;
};

// ================== API ENDPOINTS ==================

/**
 * POST /api/verification/initiate
 * Initiate a verification call to a contractor
 */
router.post('/initiate', async (req, res) => {
    try {
        const { workerName, workerId, jobRole, contractorPhone, startDate, endDate, wageAmount } = req.body;

        // Validate required fields
        if (!workerName || !workerId || !jobRole || !contractorPhone || !startDate || !endDate || !wageAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: workerName, workerId, jobRole, contractorPhone, startDate, endDate, wageAmount'
            });
        }

        // Create verification record
        const verification = new VerificationCall({
            workerName,
            workerId,
            jobRole,
            contractorPhone,
            startDate,
            endDate,
            wageAmount,
            status: 'pending'
        });

        await saveVerification(verification);

        // Initiate Twilio call
        try {
            // Check for mock mode if credentials are missing or are placeholders
            const sid = process.env.TWILIO_ACCOUNT_SID;
            const token = process.env.TWILIO_AUTH_TOKEN;
            const isPlaceholder = sid === 'your_twilio_account_sid' || token === 'your_twilio_auth_token';
            const isForcedMock = process.env.TWILIO_MOCK_MODE === 'true';

            if (!sid || !token || isPlaceholder || isForcedMock) {
                console.log('Twilio credentials missing or invalid. Using MOCK MODE.');

                // Simulate call initiation
                verification.callSid = 'mock_call_' + Date.now();
                verification.status = 'in-progress';
                verification.callStartedAt = new Date();
                verification.errorMessage = 'Mock Mode: No real call made';
                await saveVerification(verification);

                // Simulate contractor response after 5 seconds
                setTimeout(async () => {
                    verification.status = 'completed';
                    // Randomly decide outcome for demo purposes, or default to confirmed
                    verification.response = 1; // 1 = Confirmed
                    verification.callEndedAt = new Date();
                    verification.callDuration = 30;
                    await saveVerification(verification);
                    console.log('Mock Call Completed: Verified');
                }, 10000);

                return res.status(200).json({
                    success: true,
                    message: 'Verification call initiated (Mock Mode)',
                    data: {
                        id: verification._id,
                        callSid: verification.callSid,
                        status: verification.status
                    }
                });
            }

            const client = getTwilioClient();
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

            const call = await client.calls.create({
                to: contractorPhone,
                from: process.env.TWILIO_PHONE_NUMBER,
                url: `${baseUrl}/api/verification/twiml/welcome?callId=${verification._id}`,
                statusCallback: `${baseUrl}/api/verification/status?callId=${verification._id}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallbackMethod: 'POST'
            });

            // Update with call SID
            verification.callSid = call.sid;
            verification.status = 'in-progress';
            verification.callStartedAt = new Date();
            await saveVerification(verification);

            res.status(200).json({
                success: true,
                message: 'Verification call initiated',
                data: {
                    id: verification._id,
                    callSid: call.sid,
                    status: verification.status
                }
            });

        } catch (twilioError) {
            console.error('Twilio Error:', twilioError);
            verification.status = 'failed';
            verification.errorMessage = twilioError.message;
            await saveVerification(verification);

            res.status(500).json({
                success: false,
                message: 'Failed to initiate call',
                error: twilioError.message
            });
        }
    } catch (error) {
        console.error('Error initiating verification call:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/verification/:id
 * Get verification call details
 */
router.get('/:id', async (req, res) => {
    try {
        const verification = await getVerification(req.params.id);

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification call not found'
            });
        }

        res.status(200).json({
            success: true,
            data: verification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching verification call',
            error: error.message
        });
    }
});

/**
 * GET /api/verification
 * List all verification calls
 */
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let verifications = [];
        let total = 0;

        try {
            if (mongoose.connection.readyState === 1) {
                const query = status ? { status } : {};
                const skip = (parseInt(page) - 1) * parseInt(limit);
                verifications = await VerificationCall.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit));
                total = await VerificationCall.countDocuments(query);
            } else {
                throw new Error('Fallback');
            }
        } catch (err) {
            // Mock fallback
            verifications = Array.from(mockDb.values())
                .filter(v => !status || v.status === status)
                .slice((page - 1) * limit, page * limit);
            total = mockDb.size;
        }

        res.status(200).json({
            success: true,
            data: verifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching verification calls',
            error: error.message
        });
    }
});

// ================== TWIML ENDPOINTS ==================

/**
 * POST /api/verification/twiml/welcome
 * Initial TwiML - Language selection
 */
router.post('/twiml/welcome', async (req, res) => {
    const callId = req.query.callId;
    const response = new VoiceResponse();

    const gather = response.gather({
        numDigits: 1,
        action: `/api/verification/twiml/language-selected?callId=${callId}`,
        method: 'POST',
        timeout: 10
    });

    // Play language options in all three languages
    gather.say({ voice: 'Polly.Joanna' }, LANGUAGES.en.welcome);
    gather.pause({ length: 1 });
    gather.say({ voice: 'Polly.Aditi', language: 'hi-IN' }, LANGUAGES.hi.welcome);
    gather.pause({ length: 1 });
    gather.say({ voice: 'Polly.Aditi', language: 'te-IN' }, LANGUAGES.te.welcome);

    // If no input, default to English
    response.redirect(`/api/verification/twiml/language-selected?callId=${callId}&Digits=1`);

    res.type('text/xml');
    res.send(response.toString());
});

/**
 * POST /api/verification/twiml/language-selected
 * Handle language selection and play verification message
 */
router.post('/twiml/language-selected', async (req, res) => {
    const callId = req.query.callId;
    const digits = req.body.Digits || req.query.Digits || '1';
    const response = new VoiceResponse();

    try {
        const verification = await getVerification(callId);

        if (!verification) {
            response.say('Verification record not found. Goodbye.');
            response.hangup();
            res.type('text/xml');
            return res.send(response.toString());
        }

        // Map digit to language
        const langMap = { '1': 'en', '2': 'hi', '3': 'te' };
        const selectedLang = langMap[digits] || 'en';
        const lang = LANGUAGES[selectedLang];

        // Update language preference
        verification.language = selectedLang;
        await saveVerification(verification);

        // Gather response to verification message
        const gather = response.gather({
            numDigits: 1,
            action: `/api/verification/twiml/response?callId=${callId}`,
            method: 'POST',
            timeout: 15
        });

        // Play verification message
        const voiceConfig = selectedLang === 'en'
            ? { voice: 'Polly.Joanna' }
            : { voice: 'Polly.Aditi', language: selectedLang === 'hi' ? 'hi-IN' : 'te-IN' };

        gather.say(
            voiceConfig,
            lang.verification(
                verification.workerName,
                verification.workerId,
                verification.startDate,
                verification.endDate,
                verification.jobRole,
                verification.wageAmount
            )
        );

        // If no response, update and end call
        response.redirect(`/api/verification/twiml/response?callId=${callId}&Digits=0`);

    } catch (error) {
        console.error('TwiML language-selected error:', error);
        response.say('An error occurred. Goodbye.');
        response.hangup();
    }

    res.type('text/xml');
    res.send(response.toString());
});

/**
 * POST /api/verification/twiml/response
 * Handle DTMF response (1=confirm, 2=deny)
 */
router.post('/twiml/response', async (req, res) => {
    const callId = req.query.callId;
    const digits = req.body.Digits || req.query.Digits;
    const response = new VoiceResponse();

    try {
        const verification = await getVerification(callId);

        if (!verification) {
            response.say('Verification record not found. Goodbye.');
            response.hangup();
            res.type('text/xml');
            return res.send(response.toString());
        }

        const lang = LANGUAGES[verification.language || 'en'];
        const voiceConfig = verification.language === 'en'
            ? { voice: 'Polly.Joanna' }
            : { voice: 'Polly.Aditi', language: verification.language === 'hi' ? 'hi-IN' : 'te-IN' };

        if (digits === '1') {
            // Confirmed
            verification.response = 1;
            verification.status = 'completed';
            await saveVerification(verification);

            response.say(voiceConfig, lang.confirmed);

        } else if (digits === '2') {
            // Denied
            verification.response = 2;
            verification.status = 'completed';
            await saveVerification(verification);

            response.say(voiceConfig, lang.denied);

        } else if (digits === '0' || !digits) {
            // No response
            verification.status = 'completed';
            await saveVerification(verification);

            response.say(voiceConfig, lang.noInput);

        } else {
            // Invalid input - ask again
            const gather = response.gather({
                numDigits: 1,
                action: `/api/verification/twiml/response?callId=${callId}`,
                method: 'POST',
                timeout: 10
            });
            gather.say(voiceConfig, lang.invalid);

            res.type('text/xml');
            return res.send(response.toString());
        }

        response.hangup();

    } catch (error) {
        console.error('TwiML response error:', error);
        response.say('An error occurred. Goodbye.');
        response.hangup();
    }

    res.type('text/xml');
    res.send(response.toString());
});

/**
 * POST /api/verification/status
 * Twilio status callback webhook
 */
router.post('/status', async (req, res) => {
    const callId = req.query.callId;
    const { CallStatus, CallDuration } = req.body;

    try {
        const verification = await getVerification(callId);

        if (verification) {
            // Update based on call status
            if (CallStatus === 'completed') {
                verification.callEndedAt = new Date();
                verification.callDuration = parseInt(CallDuration) || 0;
                if (verification.response === null) {
                    verification.status = 'no-answer';
                }
            } else if (CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'failed') {
                verification.status = 'failed';
                verification.errorMessage = `Call ${CallStatus}`;
                verification.callEndedAt = new Date();
            }

            await saveVerification(verification);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('Status callback error:', error);
        res.status(500).send('Error');
    }
});

export default router;
