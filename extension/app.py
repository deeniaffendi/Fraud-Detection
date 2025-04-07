from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import joblib
import re
import string
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)  # Enable CORS

api_key = "f3d96da5d258d0b8f0c6e699e73e4268f626a5749fea1e8ea763612394fb71a7"

url_scan = "https://www.virustotal.com/api/v3/urls"
url_analysis = "https://www.virustotal.com/api/v3/analyses"

clf = joblib.load("model/model.pkl")
vectorizer = joblib.load("model/vectorizer.pkl")
label_encoder = joblib.load("model/label_encoder.pkl")

# Function to scan a URL using VirusTotal API
def scan_url(url):
    print(f"Scanning URL: {url}")  # Debugging log for scanning the URL
    url_encoded = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    print(f"Encoded URL: {url_encoded}")  # Debugging log to check URL encoding

    headers = {
        "x-apikey": api_key
    }

    response = requests.get(f"{url_scan}/{url_encoded}", headers=headers)

    if response.status_code == 200:
        print("Scan successful, received data:")
        return response.json()
    elif response.status_code == 404:
        print(f"URL not found in VirusTotal database: {url}")
        return {"error": "Unable to scan website. URL not found in VirusTotal database.", "status_code": 404}
    else:
        print(f"Error scanning URL: {response.status_code}")
        print(response.text)
        return {"error": "Failed to fetch data from VirusTotal", "status_code": response.status_code}
    
def report_result(scan_result, url):
    scan_id = "u-" + scan_result['data']['id'] + '-' + str(scan_result['data']['attributes']['last_analysis_date'])
    print(f"Scan ID extracted: {scan_id}")

    analysis_result = get_analysis(scan_id)
    analysis_results = analysis_result.get('data', {}).get('attributes', {}).get('results', {})

    harmful_flags = ['phishing', 'malware', 'malicious']

    total_engines = len(analysis_results)
    flagged_count = 0
    flagged_engines = []

    # Check each engine's result
    for engine, result in analysis_results.items():
        result_value = result.get('result')
        if result_value in harmful_flags or result.get('category') == 'malicious':
            flagged_count += 1
            flagged_engines.append(engine)

    # Determine the final status
    url_status = "harmful" if flagged_count > 0 else "safe"

    # Build the message
    message = f"{flagged_count}/{total_engines} engines flagged this website as potentially harmful."

    return jsonify({"message": message, "status": url_status})


# Function to get analysis using the ID returned from the scan
def get_analysis(id):
    print(f"Fetching analysis for ID: {id}") 

    headers = {
        "x-apikey": api_key
    }

    response = requests.get(f"{url_analysis}/{id}", headers=headers)

    if response.status_code == 200:
        print("Analysis fetched successfully:")
        return response.json()
    else:
        print(f"Error fetching analysis: {response.status_code}")
        print(response.text)
        return {"error": "Failed to fetch analysis data", "status_code": response.status_code}
    
def clean_text(text):

    first_fifty = " ".join(text.split()[:50])
    return first_fifty

def predict(content):

    text_transformed = vectorizer.transform([content]) 

    decision_prediction = clf.predict(text_transformed)

    decision_predicted_class = label_encoder.inverse_transform(decision_prediction)

    # probability = clf.predict_proba(text_transformed)

    return decision_predicted_class[0]

@app.route('/scan', methods=['POST'])
def scan():
    try:
        data = request.json
        url = data.get("url")
        text = data.get("pageText")

        new_text = clean_text(text)

        if not url:
            return jsonify({"error": "URL is required"}), 400

        scan_result = scan_url(url)

        url_prediction = predict(url)
        text_prediction = predict(new_text)

        # Default report_result message in case of 404
        result = "URL does not exist in VirusTotal's database"

        # If scan_result contains 'data', process it
        if "data" in scan_result:
            result = report_result(scan_result, url).get_json()

        return jsonify({
            "url" : url,
            "text" : new_text,
            "url_prediction": url_prediction,
            "text_prediction": text_prediction,
            "report_result": result,
            "virustotal_result": result["status"]
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
