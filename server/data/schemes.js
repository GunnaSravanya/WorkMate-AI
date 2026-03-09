const schemesData = {
    "e-Shram Card": {
        simple: "A digital card for unorganized workers to get social security benefits and accident insurance.",
        docs: ["Aadhar Card", "Bank Account Details", "Mobile Number"],
        threshold: 300000,
        benefits: ["₹2 Lakh Accident Insurance", "Direct Benefit Transfers (Cash)", "Social Security Scheme access"]
    },
    "PM-Kisan": {
        simple: "Financial help of ₹6,000 every year for farmers to buy seeds and tools for farming.",
        docs: ["Land Papers", "Aadhar Card", "Bank Account"],
        threshold: 200000,
        benefits: ["₹6,000 Yearly Cash (3 installments)", "Direct Bank Transfer", "Credit Support for agriculture"]
    },
    "Ayushman Bharat": {
        simple: "A health insurance scheme that gives free medical treatment up to ₹5 Lakhs in big hospitals.",
        docs: ["Ration Card", "Aadhar Card"],
        threshold: 250000,
        benefits: ["₹5 Lakh Free Hospitalization", "Cashless treatment", "Covers pre-existing diseases"]
    },
    "PM-Awas (Gramin)": {
        simple: "Money from the government to build your own strong house if you live in a village.",
        docs: ["Aadhar Card", "BPL Card", "Bank Account"],
        threshold: 150000,
        benefits: ["₹1.2 Lakh to ₹1.3 Lakh Cash for house", "90 days of work wages", "Toilet construction support"]
    },
    "Atal Pension Yojana": {
        simple: "A savings plan that gives you a fixed monthly pension after you turn 60 years old.",
        docs: ["Savings Bank Account", "Mobile Number"],
        threshold: 500000,
        benefits: ["₹1,000 to ₹5,000 Monthly Pension", "Govt. co-contribution", "Death benefit for spouse"]
    },
    "PM-SYM": {
        simple: "A pension scheme for workers like housemaids and drivers, giving ₹3,000 monthly pension.",
        docs: ["Aadhar Card", "Savings Bank Account"],
        threshold: 180000,
        benefits: ["₹3,000 Guaranteed Monthly Pension", "Equal Govt. contribution", "Family pension if subscriber dies"]
    },
    "MGNREGA": {
        simple: "A law that guarantees 100 days of manual work to every rural household that needs it.",
        docs: ["Job Card", "Aadhar Card"],
        threshold: 100000,
        benefits: ["100 Days Paid Work Guaranteed", "Unemployment Allowance", "Work near home (within 5km)"]
    },
    "PM-VishwaKarma": {
        simple: "Supports traditional artisans like carpenters and potters with training, toolkits, and low-interest loans.",
        docs: ["Skill Certificate", "Aadhar Card", "Caste Certificate (if any)"],
        threshold: 250000,
        benefits: ["₹15,000 Toolkit Incentive", "₹500/day Stipend during training", "₹3 Lakh Loan at 5% Interest"]
    },
    "Stand-Up India": {
        simple: "Helping SC/ST and women entrepreneurs to set up their own business with bank loans up to ₹1 Crore.",
        docs: ["Business Plan", "Aadhar Card", "Bank Statement"],
        threshold: 1000000,
        benefits: ["Bank Loans up to ₹1 Crore", "Credit Guarantee Scheme coverage", "Special handholding for startups"]
    },
    "MUDRA Loan": {
        simple: "Easy loans up to ₹10 Lakhs for small business shopkeepers and repair shops without any security.",
        docs: ["ID Proof", "Address Proof", "Business Identity"],
        threshold: 500000,
        benefits: ["No Collateral required", "Funding for Shishu, Kishore, Tarun", "Lowest bank interest rates"]
    },
    "PM-Jan Dhan Yojana": {
        simple: "Provides zero-balance bank accounts with insurance and overdraft facilities for every household.",
        docs: ["Aadhar Card", "Passport size photo"],
        threshold: 1000000,
        benefits: ["Zero Balance Savings Account", "Free RuPay Debit Card", "₹10,000 Overdraft Facility"]
    },
    "PM-Fasal Bima Yojana": {
        simple: "Crop insurance to protect farmers from financial loss due to weather and crop disease.",
        docs: ["Land Papers", "Bank Account", "Sowing Certificate"],
        threshold: 300000,
        benefits: ["Comprehensive Crop Risk payout", "Very low premium (1.5-2%)", "Tech-based fast claim settling"]
    },
    "PMAY (Gramin)": {
        simple: "Government assistance to help rural families build their own strong, permanent house.",
        docs: ["Aadhar Card", "BPL Card", "Khasra/Land Doc"],
        threshold: 120000,
        benefits: ["₹1.2 - 1.3 Lakhs Cash Assistance", "90 days of MGNREGA wages included", "₹12,000 for toilet building"]
    },
    "PMAY (Urban)": {
        simple: "Affordable housing for poor and middle-class people living in cities through interest subsidies.",
        docs: ["Aadhar Card", "Income Certificate", "Affidavit of no house"],
        threshold: 600000,
        benefits: ["₹2.67 Lakhs House Subsidy", "Cheaper Bank Loans", "Modern basic amenities included"]
    },
    "Ujjwala Yojana": {
        simple: "Free gas connections for women from poor families to promote clean cooking in every kitchen.",
        docs: ["Aadhar Card", "BPL Card", "Ration Card"],
        threshold: 150000,
        benefits: ["Free LPG Gas Connection", "First Refill Free of cost", "Subsidized yearly refills"]
    },
    "Skill India": {
        simple: "Free vocational training in various trades like plumbing, tailoring, and computer skills for youth.",
        docs: ["Aadhar Card", "Education Certificate"],
        threshold: 1000000,
        benefits: ["Free Certified Training", "Job Placement support", "Placement rewards up to ₹8,000"]
    },
    "Startup India": {
        simple: "Benefits like tax tax exemptions and easy patent filing to encourage new startup businesses.",
        docs: ["Incorporation Certificate", "DIPP Number"],
        threshold: 10000000,
        benefits: ["3 Years Tax Holiday", "Funding from ₹10k Cr Fund", "80% reduction in patent fees"]
    },
    "Swachh Bharat": {
        simple: "Assistance for building toilets in homes to ensure health and hygiene in every village.",
        docs: ["Aadhar Card", "Bank Account", "Photo of site"],
        threshold: 200000,
        benefits: ["₹12,000 for Home Toilet", "Village Sanitation improvement", "Cleaner healthy environment"]
    },
    "Namami Gange": {
        simple: "Supporting cleaner rivers and providing employment in river protection and sanitation works.",
        docs: ["Aadhar Card", "Residence Certificate"],
        threshold: 1000000,
        benefits: ["Local employment in projects", "Better river access", "Heritage area development"]
    },
    "PM-WANI": {
        simple: "Promoting public Wi-Fi hotspots so every citizen can access high-speed internet anywhere.",
        docs: ["Mobile Number", "Identity Proof"],
        threshold: 1000000,
        benefits: ["Affordable High-Speed Data", "Easy login across hotspots", "Digital India empowerment"]
    },
    "PM-MITRA": {
        simple: "Setting up large textile parks to create jobs in stitching, weaving, and textile design.",
        docs: ["Work ID", "Aadhar Card"],
        threshold: 400000,
        benefits: ["Modern workspace for Tailors", "Bulk order access", "Social security for workers"]
    },
    "PM-E-Bus Sewa": {
        simple: "Deploying thousands of electric buses in cities to make transport cheaper and cleaner.",
        docs: ["Bus Pass", "Identity Proof"],
        threshold: 1000000,
        benefits: ["Cheaper daily city commute", "Less noise & air pollution", "Better bus frequencies"]
    },
    "PM-DevINE": {
        simple: "Special development projects for the North Eastern states to improve infrastructure and jobs.",
        docs: ["Residence Certificate", "Aadhar Card"],
        threshold: 500000,
        benefits: ["Better local infrastructure", "Job opportunities in NE", "Skill building for youth"]
    },
    "Vibrant Villages": {
        simple: "Focuses on developing border villages with better roads, water, and tourism facilities.",
        docs: ["Domicile Certificate", "Aadhar Card"],
        threshold: 300000,
        benefits: ["Road & Water connectivity", "Tourism Income programs", "Self-employment support"]
    },
    "Gati Shakti": {
        simple: "A massive plan to connect India with better railways, roads, and ports for faster growth.",
        docs: ["Project ID (for workers)", "Aadhar Card"],
        threshold: 800000,
        benefits: ["High-speed connectivity", "Logistic cost reduction", "Job creation in Infra"]
    },
    "PM-PRANAM": {
        simple: "Incentives for states and farmers to use organic fertilizers and protect the environment.",
        docs: ["Farmer ID", "Land Papers"],
        threshold: 200000,
        benefits: ["Incentive for Organic farming", "Reduced input costs", "Healthier farm soil"]
    },
    "Mission Life": {
        simple: "Encouraging a lifestyle that protects the environment through small daily actions and habits.",
        docs: ["None - Public Awareness"],
        threshold: 1000000,
        benefits: ["Healthier planet rewards", "Community participation", "Resource saving hacks"]
    },
    "PM-Awas Yojana": {
        simple: "A unified housing scheme helping every Indian family own their dream home by 2024.",
        docs: ["Aadhar Card", "Income Proof", "Property Tax Receipt"],
        threshold: 600000,
        benefits: ["Subsidized Home Loans", "Interest relief of up to 6.5%", "Property in woman's name bonus"]
    },
    "PM-Poshan": {
        simple: "Providing nutritious hot meals to children in schools to improve their health and learning.",
        docs: ["School ID Card", "Ration Card"],
        threshold: 200000,
        benefits: ["Daily Hot Nutritious Meal", "Improved health of children", "Direct school enrollment boost"]
    },
    "Udaan": {
        simple: "Making air travel affordable for the common man with regional airport connectivity.",
        docs: ["Photo ID Proof"],
        threshold: 1200000,
        benefits: ["Flights at ₹2,500/hour", "Reach cities faster", "Regional economic growth"]
    }
};

export default schemesData;
