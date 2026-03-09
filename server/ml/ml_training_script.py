import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import json
import os

def train_and_evaluate():
    # Load dataset
    data_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\data\loan_training_data.csv'
    df = pd.read_csv(data_path)

    # Preprocessing
    # Check for missing values (simplified for this script, though the CSV seemed complete)
    df = df.dropna()

    # Split features and target
    X = df.drop('Loan_Status', axis=1)
    y = df['Loan_Status']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Define models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "SVM": SVC(probability=True, random_state=42)
    }

    results = {}

    print(f"{'Model':<20} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1':<10}")
    print("-" * 75)

    for name, model in models.items():
        # Train
        model.fit(X_train_scaled, y_train)
        
        # Predict
        y_pred = model.predict(X_test_scaled)
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        results[name] = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1
        }
        
        print(f"{name:<20} | {acc:<10.4f} | {prec:<10.4f} | {rec:<10.4f} | {f1:<10.4f}")

    # Identify best model based on F1 Score (harmonic mean of precision and recall)
    best_model_name = max(results, key=lambda k: results[k]['f1_score'])
    print(f"\nBest Model for Loan Prediction: {best_model_name}")

    # Save results to a report file
    report_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\ml\loan_model_report.json'
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=4)
    
    print(f"Report saved to {report_path}")

if __name__ == "__main__":
    train_and_evaluate()
