import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import json

def export_model():
    # Load dataset
    data_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\data\loan_training_data.csv'
    df = pd.read_csv(data_path)
    df = df.dropna()

    X = df.drop('Loan_Status', axis=1)
    y = df['Loan_Status']

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train
    model = LogisticRegression(max_iter=1000)
    model.fit(X_scaled, y)

    # Export
    model_data = {
        "coefficients": model.coef_[0].tolist(),
        "intercept": model.intercept_[0],
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "feature_names": X.columns.tolist()
    }

    output_path = r'c:\Users\hp\OneDrive\Desktop\workmate ai\server\ml\loan_model_params.json'
    with open(output_path, 'w') as f:
        json.dump(model_data, f, indent=4)
    
    print(f"Model params exported to {output_path}")

if __name__ == "__main__":
    export_model()
