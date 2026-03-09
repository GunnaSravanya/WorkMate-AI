const loansData = {
    "Personal Micro-Credit": {
        purpose: "Small cash advance for daily expenses or emergency needs between jobs.",
        benefits: [
            "No collateral or security needed",
            "Instant approval based on banking partner history",
            "Very low interest rate (4%)",
            "6-month flexible repayment"
        ],
        loopholes: [
            "Late payment fees apply after 5-day grace period",
            "Limited to ₹5,000 initially",
            "Requires at least 1 verified paid job on the platform"
        ],
        docs: ["Aadhar Card Link", "Current Platform ID", "Active Bank Account"],
        threshold: 2000
    },
    "Skill-Up Loan": {
        purpose: "Funding specifically for purchasing advanced toolkits, equipment, or certification courses.",
        benefits: [
            "Up to ₹15,000 credit limit",
            "Direct payment to certified toolkit vendors",
            "0% interest for the first 3 months",
            "Boosts your profile ranking with new equipment"
        ],
        loopholes: [
            "Funds can only be spent on verified toolkits",
            "Defaulting affecting your internal profile ranking",
            "Requires ₹10,000 total lifetime earnings"
        ],
        docs: ["Aadhar Card", "Skill Certificate (Optional but helps)", "Verified Platform Earnings Statement"],
        threshold: 10000
    }
};

export default loansData;
