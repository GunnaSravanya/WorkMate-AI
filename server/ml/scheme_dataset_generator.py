import pandas as pd
import numpy as np
import random
import os

# Define schemes and their logic (approximate from schemeRecommender.js)
schemes = [
    "e-Shram Card", "PM-Kisan", "Ayushman Bharat", "PM-Awas (Gramin)",
    "Atal Pension Yojana", "PM-SYM", "MGNREGA", "PM-VishwaKarma",
    "Stand-Up India", "MUDRA Loan", "PM-Jan Dhan Yojana", "PM-Fasal Bima Yojana",
    "PMAY (Gramin)", "PMAY (Urban)", "Ujjwala Yojana", "Skill India",
    "Startup India", "Swachh Bharat", "Namami Gange", "PM-WANI",
    "PM-MITRA", "PM-E-Bus Sewa", "PM-DevINE", "Vibrant Villages",
    "Gati Shakti", "PM-PRANAM", "Mission Life", "PM-Awas Yojana",
    "PM-Poshan", "Udaan"
]

def generate_data(num_samples=1000):
    data = []
    
    # Skills and Industries common in the app context
    skills_list = ["carpentry", "pottery", "farming", "tailoring", "construction", "driving", "delivery", "plumbing"]
    locations = ["Rural", "Urban"]
    states = ["Uttar Pradesh", "Bihar", "Telangana", "Maharashtra", "Tamil Nadu", "Gujarat", "Delhi"]

    for _ in range(num_samples):
        # User profile features
        earnings = random.randint(50000, 1500000)
        skills = random.sample(skills_list, random.randint(1, 3))
        location = random.choice(locations)
        state = random.choice(states)
        industry = random.choice(["Agriculture", "Unorganized", "Artisan", "Business", "Service"])
        
        # Determine labels (Multi-label)
        # Simplified logic for synthetic labeling
        labels = {scheme: 0 for scheme in schemes}
        
        # E-Shram: Unorganized workers
        if industry == "Unorganized" and earnings < 300000:
            labels["e-Shram Card"] = 1
            
        # PM-Kisan: Farmers
        if industry == "Agriculture" and earnings < 200000:
            labels["PM-Kisan"] = 1
            
        # Ayushman Bharat: Lower income
        if earnings < 250000:
            labels["Ayushman Bharat"] = 1
            
        # MGNREGA: Rural + low income
        if location == "Rural" and earnings < 100000:
            labels["MGNREGA"] = 1
            
        # PM-VishwaKarma: Artisans
        if industry == "Artisan" or any(s in ["carpentry", "pottery", "tailoring"] for s in skills):
            labels["PM-VishwaKarma"] = 1
            
        # MUDRA Loan: Business
        if industry == "Business":
            labels["MUDRA Loan"] = 1

        # PM-SYM: Unorganized + medium-low income
        if industry == "Unorganized" and 150000 < earnings < 300000:
            labels["PM-SYM"] = 1
            
        # PMAY Urban/Gramin
        if location == "Urban" and earnings < 600000:
            labels["PMAY (Urban)"] = 1
        elif location == "Rural" and earnings < 150000:
            labels["PM-Awas (Gramin)"] = 1

        # Skill India: Low income + needs training
        if earnings < 500000 and len(skills) < 2:
            labels["Skill India"] = 1
            
        # PM-MITRA: Tailoring
        if "tailoring" in skills:
            labels["PM-MITRA"] = 1

        # Randomness to avoid perfect correlation
        for s in schemes:
            if random.random() < 0.05:
                labels[s] = 1 - labels[s]

        # Combine features and labels
        row = {
            "Earnings": earnings,
            "Location": 0 if location == "Rural" else 1,
            "Industry_Agriculture": 1 if industry == "Agriculture" else 0,
            "Industry_Unorganized": 1 if industry == "Unorganized" else 0,
            "Industry_Artisan": 1 if industry == "Artisan" else 0,
            "Industry_Business": 1 if industry == "Business" else 0,
            "Num_Skills": len(skills),
        }
        row.update(labels)
        data.append(row)

    df = pd.DataFrame(data)
    output_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\data\scheme_training_data.csv'
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} samples and saved to {output_path}")

if __name__ == "__main__":
    generate_data()
