import requests

url = "https://virustotaldimasv1.p.rapidapi.com/getURLscanReport"

# Replace with the URL you want to scan
url_to_scan = "https://github.com/Phishing-Database/Phishing.Database" 

payload = {
    "url": url_to_scan  # Add the URL you want to scan
}

headers = {
    "x-rapidapi-key": "e7c8e69752msh9e1ac71f152dff4p14bdecjsn273056a4478a",
    "x-rapidapi-host": "VirusTotaldimasV1.p.rapidapi.com",
    "Content-Type": "application/x-www-form-urlencoded"
}

response = requests.post(url, data=payload, headers=headers)

# Print the response
try:
    print(response.json())
except ValueError:
    print("Error: Could not parse JSON response.")
