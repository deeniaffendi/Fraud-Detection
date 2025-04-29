from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import joblib
import os

from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

# Initialize Flask app and allow cross-origin requests
app = Flask(__name__)
CORS(app)

# Load your API key from environment variables
KEY  = os.environ["KEY"]

# Define VirusTotal API endpoints
url_scan = "https://www.virustotal.com/api/v3/urls"
url_analysis = "https://www.virustotal.com/api/v3/analyses"

# Load pre-trained machine learning components
clf = joblib.load("model/model1.pkl")                # Classifier model
vectorizer = joblib.load("model/vectorizer1.pkl")    # TF-IDF vectorizer
label_encoder = joblib.load("model/label_encoder1.pkl")  # Label encoder

# ---------------------- VirusTotal Interaction Functions ----------------------

# Function to check if a URL has been scanned by VirusTotal
def scan_url(url):
    print(f"Scanning URL: {url}")
    url_encoded = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    print(f"Encoded URL: {url_encoded}")

    headers = {
        "x-apikey": KEY
    }

    response = requests.get(f"{url_scan}/{url_encoded}", headers=headers)

    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return {"error": "Unable to scan website. URL not found in VirusTotal database.", "status_code": 404}
    else:
        return {"error": "Failed to fetch data from VirusTotal", "status_code": response.status_code}

# Function to fetch the detailed analysis report for a scanned URL
def get_analysis(id):
    print(f"Fetching analysis for ID: {id}") 

    headers = {
        "x-apikey": KEY
    }

    response = requests.get(f"{url_analysis}/{id}", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Failed to fetch analysis data", "status_code": response.status_code}

# Function to interpret the VirusTotal scan results
def report_result(scan_result, url):
    scan_id = "u-" + scan_result['data']['id'] + '-' + str(scan_result['data']['attributes']['last_analysis_date'])
    print(f"Scan ID extracted: {scan_id}")

    analysis_result = get_analysis(scan_id)
    analysis_results = analysis_result.get('data', {}).get('attributes', {}).get('results', {})

    harmful_flags = ['phishing', 'malware', 'malicious']
    total_engines = len(analysis_results)
    flagged_count = 0
    flagged_engines = []

    # Count how many antivirus engines flagged the site as harmful
    for engine, result in analysis_results.items():
        result_value = result.get('result')
        if result_value in harmful_flags or result.get('category') == 'malicious':
            flagged_count += 1
            flagged_engines.append(engine)

    # Decide overall safety status
    url_status = "harmful" if flagged_count > 0 else "safe"
    message = f"{flagged_count}/{total_engines} engines flagged this website as potentially harmful."

    return jsonify({"message": message, "status": url_status})

# ---------------------- Text Preprocessing and Prediction ----------------------

# Function to clean and limit the text input (first 50 words only)
def clean_text(text):
    first_fifty = " ".join(text.split()[:50])
    return first_fifty

# Function to make a prediction using the loaded ML model
def predict(content):
    text_transformed = vectorizer.transform([content])
    decision_prediction = clf.predict(text_transformed)
    decision_predicted_class = label_encoder.inverse_transform(decision_prediction)
    return decision_predicted_class[0]

# ---------------------- Flask API Endpoint ----------------------

@app.route('/scan', methods=['POST'])
def scan():
    try:
        data = request.json
        url = data.get("url")
        text = data.get("pageText")

        # Limit the input text to avoid model overload
        new_text = clean_text(text)

        if not url:
            return jsonify({"error": "URL is required"}), 400

        # Perform URL scan using VirusTotal
        scan_result = scan_url(url)

        # Get predictions from your model
        url_prediction = predict(url)
        text_prediction = predict(new_text)

        # Default result for unknown or unscanned URLs
        result = {
            "message": "URL does not exist in VirusTotal's database",
            "status": "unknown"
        }

        # If valid scan data returned, get detailed analysis report
        if "data" in scan_result:
            result = report_result(scan_result, url).get_json()

        # Return the final response
        return jsonify({
            "url": url,
            "text": new_text,
            "url_prediction": url_prediction,
            "text_prediction": text_prediction,
            "report_result": result,
            "virustotal_result": result["status"]
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ---------------------- Entry Point ----------------------

if __name__ == '__main__':
    app.run(debug=True)
