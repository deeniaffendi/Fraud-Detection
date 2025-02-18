from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS

api_key = "f3d96da5d258d0b8f0c6e699e73e4268f626a5749fea1e8ea763612394fb71a7"

url_scan = "https://www.virustotal.com/api/v3/urls"
url_analysis = "https://www.virustotal.com/api/v3/analyses"

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

# Function to get analysis using the ID returned from the scan
def get_analysis(id):
    print(f"Fetching analysis for ID: {id}")  # Debugging log for fetching the analysis

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

@app.route('/scan', methods=['POST'])
def scan():
    try:
        data = request.json
        url = data.get("url")

        if not url:
            return jsonify({"error": "URL is required"}), 400

        print("Starting scan...")  # Debugging log before scanning

        # Step 1: Scan the URL and get the ID
        scan_result = scan_url(url)

        # Check if scanning failed due to 404 (URL not found in VirusTotal database)
        if scan_result.get("status_code") == 404:
            return jsonify({"message": "Unable to scan website. URL not found in VirusTotal database."}), 404

        if 'data' not in scan_result:
            return jsonify(scan_result), 400

        # Extract the ID from the scan result
        scan_id = "u-" + scan_result['data']['id'] + '-' + str(scan_result['data']['attributes']['last_analysis_date'])
        print(f"Scan ID extracted: {scan_id}")

        # Step 2: Get the analysis using the ID
        analysis_result = get_analysis(scan_id)
        # print(analysis_result)

        # Extract the 'results' from the analysis response
        analysis_results = analysis_result.get('data', {}).get('attributes', {}).get('results', {})

        # Initialize dictionaries to count occurrences of categories and results
        category_counts = {}
        result_counts = {}
        flagged_results = []
        flagged_engines = []

        # Loop through each engine's analysis result
        for engine, result in analysis_results.items():
            # Count results
            result_value = result.get('result')
            if result_value:
                result_counts[result_value] = result_counts.get(result_value, 0) + 1

            # Check if the result is phishing, malware, or malicious
            if result_value in ['phishing', 'malware'] or result.get('category') == 'malicious':
                flagged_results.append(result_value)
                flagged_engines.append(engine)

        # Format the response message
        message = f"The URL {url} was scanned on VirusTotal, analyzed by {len(analysis_results)} engines.\n"

        # Include details about flagged results
        if flagged_results:
            message += f"The URL was flagged as {', '.join(set(flagged_results))} by {len(flagged_results)} engines: {', '.join(flagged_engines)}.\n"
        else:
            message += "No phishing, malware, or malicious activity detected.\n"

        # Include result counts in the message
        if result_counts:
            message += "\nResult counts:\n"
            for result_value, count in result_counts.items():
                message += f"{result_value}: {count}\n"

        # Return the formatted message
        return jsonify({"message": message})

    except Exception as e:
        print(f"Error: {str(e)}")  # Debugging log for general exceptions
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
