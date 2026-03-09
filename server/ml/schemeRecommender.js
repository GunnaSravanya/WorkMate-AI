// ML-based Government Scheme Recommender
// Uses user profile data to recommend relevant schemes

/**
 * Calculate recommendation score for a scheme based on user profile
 * @param {Object} scheme - Scheme data with threshold and benefits
 * @param {Object} userProfile - User profile with earnings, skills, location, etc.
 * @returns {number} - Recommendation score (0-100)
 */
function calculateSchemeScore(scheme, userProfile) {
    let score = 0;

    // Use name if scheme_name is present (large dataset uses scheme_name)
    const schemeName = scheme.name || scheme.scheme_name;
    const description = scheme.description || scheme.short_description || "";
    const eligibility = scheme.eligibility || "";

    // Base score: 30 points for all schemes
    score += 30;

    // Earnings-based matching (30 points max)
    if (userProfile.totalEarnings !== undefined) {
        // Large dataset usually doesn't have numeric threshold, so we look for income keywords
        const incomeMatch = eligibility.match(/₹\s?(\d+[,.]?\d*)/) || eligibility.match(/Rs\.\s?(\d+[,.]?\d*)/);
        const threshold = scheme.threshold || (incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : 500000); // Default threshold if not found

        const earningsRatio = userProfile.totalEarnings / threshold;
        if (earningsRatio < 1) {
            score += 30 * (1 - earningsRatio);
        } else if (earningsRatio < 1.2) {
            score += 10;
        }
    }

    // Skill & Industry matching (20 points max)
    if (userProfile.skills && Array.isArray(userProfile.skills)) {
        userProfile.skills.forEach(skill => {
            if (schemeName.toLowerCase().includes(skill.toLowerCase()) ||
                description.toLowerCase().includes(skill.toLowerCase())) {
                score += 10;
            }
        });
    }

    // Category-based matching
    if (scheme.category && userProfile.interest) {
        if (scheme.category.toLowerCase().includes(userProfile.interest.toLowerCase())) {
            score += 20;
        }
    }

    // Location-based matching (10 points max)
    if (userProfile.location || scheme.state) {
        const userLoc = (userProfile.location || "").toLowerCase();
        const schemeState = (scheme.state || "").toLowerCase();

        if (schemeState && userLoc.includes(schemeState)) {
            score += 20; // High match for state-specific schemes
        }

        const ruralSchemes = ['gramin', 'rural', 'mgnrega', 'awas'];
        const urbanSchemes = ['urban', 'city', 'bus', 'smart'];

        const isRural = /village|rural|gram/i.test(userLoc);
        const isUrban = /city|urban|metro/i.test(userLoc);

        if (isRural && ruralSchemes.some(s => schemeName.toLowerCase().includes(s))) {
            score += 10;
        } else if (isUrban && urbanSchemes.some(s => schemeName.toLowerCase().includes(s))) {
            score += 10;
        }
    }

    return Math.min(100, Math.round(score));
}

/**
 * Get recommended schemes for a user
 * @param {Object} schemesData - All available schemes
 * @param {Object} userProfile - User profile data
 * @param {number} topN - Number of top recommendations to return
 * @returns {Array} - Array of recommended schemes with scores
 */
function getRecommendedSchemes(schemesData, userProfile, topN = 5) {
    const recommendations = [];

    for (const [schemeName, schemeData] of Object.entries(schemesData)) {
        const score = calculateSchemeScore(
            { name: schemeName, ...schemeData },
            userProfile
        );

        recommendations.push({
            name: schemeName,
            score: score,
            data: schemeData
        });
    }

    // Sort by score (highest first) and return top N
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

export {
    calculateSchemeScore,
    getRecommendedSchemes
};
