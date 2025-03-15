import joblib
import xgboost as xgb
import numpy as np

# Load the models (XGBoost Booster models)
url_model = xgb.Booster()  # Create a Booster object
url_model.load_model("url_model.json")

text_model = xgb.Booster()  # Create a Booster object
text_model.load_model("text_model.json")


url = "https://uoe.com"
text = "Nur Deeni Binti Deti aFFENDI"

def classify_website(url, text):
    """
    Takes a URL and website text, gets predictions from both models,
    and combines the outputs.
    """
    # Reshape URL into 2D format for XGBoost
    url_dmatrix = xgb.DMatrix(np.array([url]).reshape(1, -1))  # Reshape to (1, 1)
    url_prediction = url_model.predict(url_dmatrix)[0]  # Predict URL category

    # Reshape Text into 2D format for XGBoost
    text_dmatrix = xgb.DMatrix(np.array([text]).reshape(1, -1))  # Reshape to (1, 1)
    text_prediction = text_model.predict(text_dmatrix)[0]  # Predict text category

    # Print results based on predictions
    if url_prediction in [0, 1]:  # Replace with correct class values (e.g., 0 = phishing, 1 = malware)
        print("Unsafe")
    if url_prediction in [2, 3] and text_prediction == 1:  # Replace with correct class values
        print("Unsafe")
    
    return print("Safe")

# Example usage
classify_website(url, text)  # Call function
