import joblib
import re
import string
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

clf = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")
label_encoder = joblib.load("label_encoder.pkl")

def predict(text):

    text_transformed = vectorizer.transform([text]) 

    # Predict using the trained RandomForest model
    decision_prediction = clf.predict(text_transformed)

    decision_predicted_class = label_encoder.inverse_transform(decision_prediction)

    print(f"Prediction for: '{text}' -> {decision_predicted_class[0]}")


text = "App Disabled The requested domain could not be served at this time, as it was disabled by the Trust & Safety team. If you believe this is a mistake please contact abuse@wasmer.io"
textq = "http://dl.tevipshoo.shop"
predict(text)
predict(textq)