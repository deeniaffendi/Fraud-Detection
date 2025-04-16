**Fraud Detection Tool**
Fraud Detection Tool is a Google Chrome Extension designed to detect the safety of websites and safeguard users from potential cyber attacks. It provides real-time analysis to help users identify red flags they may have overlooked while browsing.

**Prerequisites**
1. Flask (For running the backend server)
2. VirusTotal API (For third party check)

**Installation**
1. Download or clone the repository and compress the extension folder into a .zip file.
2. Open Google Chrome and go to chrome://extensions/.
3. Enable Developer mode (top right corner).
4. Click "Load unpacked" or "Upload zip" (depending on your setup) and select the extracted folder or upload the .zip.

**Usage**
1. Open your terminal or command prompt.
2. Navigate to the project directory: cd [project-directory]
3. Set API key: set KEY = [YOUR_API Key]
4. Run the Flask server: python app.py
5. Open any website in Chrome.
6. Click the blinking extension icon
7. Click on "Check Website's Safety" button
8. The safety analysis will be displayed in the extension popup.

**Features**
1. Predicts website safety using both the URL and text content of the page.
2. Compares model predictions with VirusTotal's analysis for a more reliable result.
3. Displays a risk score to guide the user on how to proceed.

**Risk Score**
1. Safe - No malicious activity detected
2. Cautious - Suspicious patterns detected — avoid clicking on links or downloading files.
3. Beware - High risk detected — do not proceed.

**Notes**
1. VirusTotal only works on publicly accessible websites.
2. If the website is private or inaccessible by VirusTotal, only the model's prediction will be shown.
3. In such cases, the system provides one prediction instead of two.

**Credits/Acknowledgements**
1. Anne Kayem
2. VirusTotal = https://www.virustotal.com/gui/home/upload
3. Sklearn Library = https://scikit-learn.org/stable/
4. MatPlotlib = https://matplotlib.org/

**Contact**
For any questions or collaboration inquiries, feel free to reach out:
ndb205@exeter.ac.uk
