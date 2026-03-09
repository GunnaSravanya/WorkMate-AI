import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.ensemble import GradientBoostingClassifier
import json
import os

def train_and_evaluate_schemes():
    # Load dataset
    data_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\data\scheme_training_data.csv'
    df = pd.read_csv(data_path)

    # Features and Labels
    # Features are the first 7 columns (Earnings to Num_Skills)
    X = df.iloc[:, :7]
    # Labels are the rest (30 schemes)
    y = df.iloc[:, 7:]

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Define models
    models = {
        "Random Forest (Multi-Label)": MultiOutputClassifier(RandomForestClassifier(n_estimators=100, random_state=42)),
        "Gradient Boosting (Multi-Label)": MultiOutputClassifier(GradientBoostingClassifier(n_estimators=100, random_state=42))
    }

    results = {}

    print(f"{'Model':<35} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1':<10}")
    print("-" * 85)

    for name, model in models.items():
        # Train
        model.fit(X_train, y_train)
        
        # Predict
        y_pred = model.predict(X_test)
        
        # Metrics (using 'macro' average for multi-label)
        acc = accuracy_score(y_test, y_pred)
        # Handle zero division for precision/recall if some labels are never predicted
        prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
        
        results[name] = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1
        }
        
        print(f"{name:<35} | {acc:<10.4f} | {prec:<10.4f} | {rec:<10.4f} | {f1:<10.4f}")

    # Identify best model
    best_model_name = max(results, key=lambda k: results[k]['f1_score'])
    print(f"\nBest Model for Scheme Recommendation: {best_model_name}")

    # Save results
    report_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\ml\scheme_model_report.json'
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=4)
    
    print(f"Report saved to {report_path}")

if __name__ == "__main__":
    train_and_evaluate_schemes()
