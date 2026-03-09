import express from 'express';
import schemesData from '../data/schemes.js';
import { getRecommendedSchemes } from '../ml/schemeRecommender.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const JAVA_BIN = '"C:\\Program Files\\Java\\jdk-25\\bin\\java.exe"';
const WORKSPACE_ROOT = 'c:\\Users\\hp\\OneDrive\\Desktop\\workmate ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemesLargePath = path.join(__dirname, '../data/schemes_large.json');
let schemesLarge = [];

try {
    const rawData = fs.readFileSync(schemesLargePath, 'utf8');
    schemesLarge = JSON.parse(rawData);
} catch (error) {
    console.error('Error loading large schemes dataset:', error);
}

// Convert schemesData (object) to similar format as schemesLarge (array) for uniform processing
const curatedSchemesArray = Object.entries(schemesData).map(([name, data]) => ({
    scheme_name: name,
    ...data
}));

const allSchemes = [...curatedSchemesArray, ...schemesLarge];

const router = express.Router();

// GET all schemes
router.get('/', (req, res) => {
    try {
        res.json(schemesData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schemes', error: error.message });
    }
});

// GET recommended schemes based on user profile
router.post('/recommend', async (req, res) => {
    try {
        const userProfile = req.body;
        const topN = req.query.limit ? parseInt(req.query.limit) : 5;
        const profileStr = JSON.stringify({ ...userProfile, limit: topN }).replace(/"/g, '\\"');

        const command = `${JAVA_BIN} -cp "${WORKSPACE_ROOT}" server.java.WorkMateMLCore recommend-schemes "{${profileStr.slice(1, -1)}}"`;

        const { stdout, stderr } = await execPromise(command, { cwd: WORKSPACE_ROOT });

        if (stderr) console.error('Java ML Core Stderr:', stderr);

        const recommendations = JSON.parse(stdout);

        res.json({
            recommendations,
            message: `Top ${recommendations.length} schemes recommended by Java ML Core`
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating recommendations', error: error.message });
    }
});

// GET financial recommendations (ML simulation)
router.post('/recommend-finance', (req, res) => {
    try {
        const { income } = req.body;
        const pay = Number(income) || 0;
        let recommendation = {};

        if (pay < 5000) {
            recommendation = {
                loanName: "Personal Micro-Credit",
                loanKey: "advisor.loans.micro",
                benefitKey: "advisor.benefits.transport",
                schemeKey: "advisor.schemes.basic"
            };
        } else if (pay < 15000) {
            recommendation = {
                loanName: "Skill-Up Loan",
                loanKey: "advisor.loans.skill",
                benefitKey: "advisor.benefits.tool_insurance",
                schemeKey: "advisor.schemes.artisan"
            };
        } else {
            recommendation = {
                loanName: "Business Expansion Loan",
                loanKey: "advisor.loans.business",
                benefitKey: "advisor.benefits.tax",
                schemeKey: "advisor.schemes.contractor"
            };
        }

        // Add ML-based scheme recommendations
        const schemesMap = allSchemes.reduce((map, scheme) => {
            map[scheme.scheme_name || scheme.name] = scheme;
            return map;
        }, {});

        const profile = {
            totalEarnings: pay * 30, // Estimate monthly to annual/total or just treat as earnings
            location: req.body.location,
            interest: req.body.role, // 'worker' or 'contractor' approx interest
            skills: [req.body.jobType || 'General']
        };

        const recommendedSchemes = getRecommendedSchemes(schemesMap, profile, 3);
        recommendation.schemes = recommendedSchemes;

        res.json(recommendation);
    } catch (error) {
        res.status(500).json({ message: 'Error generating finance recommendations', error: error.message });
    }
});

// Search schemes
router.get('/search', (req, res) => {
    try {
        const query = req.query.q ? req.query.q.toLowerCase() : '';
        if (!query) return res.json([]);

        const results = allSchemes.filter(s => {
            const name = (s.scheme_name || s.name || "").toLowerCase();
            const desc = (s.description || s.simple || "").toLowerCase();
            return name.includes(query) || desc.includes(query);
        }).slice(0, 20);

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error searching schemes', error: error.message });
    }
});

// GET specific scheme by name
router.get('/:name', (req, res) => {
    try {
        const schemeName = decodeURIComponent(req.params.name);
        let scheme = curatedSchemesArray.find(s => s.scheme_name === schemeName) ||
            schemesLarge.find(s => s.scheme_name === schemeName);

        if (!scheme) {
            return res.status(404).json({ message: 'Scheme not found' });
        }

        res.json(scheme);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching scheme', error: error.message });
    }
});

export default router;
