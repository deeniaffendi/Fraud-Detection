// DOM Elements for UI interaction
const checkSafetyElement = document.getElementById("checkSafety");
const tajukElement = document.getElementById("tajuk");
const callToAction = document.getElementById("callToAction");
const loadingContainer = document.getElementById("loadingContainer"); 
const loadingBar = document.getElementById("loadingBar");
const analysedElement = document.getElementById("analysed");
const urlElement = document.getElementById("url");
const score = document.getElementById("score");
const statusElement = document.getElementById("status");
const analysis = document.getElementById("analysis");
const virustotal = document.getElementById("virustotal");
const report = document.getElementById("report");

const landingPage = document.getElementById("landingPage");
const processPage = document.getElementById("processPage");
const resultsPage = document.getElementById("resultsPage");

// Utility functions to show/hide elements
const hideElement = (elem) => {
  elem.style.display = 'none'; 
};

const showElement = (elem) => {
  elem.style.display = '';
};

// Initially hide process and results pages
hideElement(processPage);
hideElement(resultsPage);

// Display the loading bar and reset progress
const showLoadingBar = () => {
  loadingContainer.style.display = 'block'; 
  loadingBar.style.width = '0%';
};

// Update loading bar width
const updateLoadingBar = (progress) => {
  loadingBar.style.width = `${progress}%`; 
};

// Hide loading bar
const hideLoadingBar = () => {
  loadingContainer.style.display = 'none'; 
};

// Get the current tab's URL
const getURL = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        resolve(tabs[0].url);
      } else {
        reject(new Error("No active tab URL found."));
      }
    });
  });
};

// Main function to extract text and process website safety
const fetchAndProcessURL = async () => {
  try {
    const url = await getURL();
    console.log("URL fetched:", url);

    // Inject a script to extract the inner text of the webpage
    chrome.scripting.executeScript(
      {
        target: { tabId: (await getCurrentTab()).id },
        func: () => document.body.innerText,
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          tajukElement.innerText = "Error extracting text.";
          hideLoadingBar();
          return;
        }

        const pageText = injectionResults[0].result;
        console.log("Extracted text:", pageText);

        // Send the URL and extracted text to the background script for analysis
        chrome.runtime.sendMessage(
          { type: "checkSafety", url: url, pageText: pageText },
          (response) => {
            console.log("Response from background:", response);

            if (response.error) {
              tajukElement.innerText = "Error: " + response.error;
            } else {
              const result = response.data;

              // Weighted average to determine final prediction
              const textPredictionWeight = 0.7;
              const urlPredictionWeight = 0.3;
              const urlPredictionValue = result.url_prediction === "safe" ? 0 : 1;
              const textPredictionValue = result.text_prediction === "safe" ? 0 : 1;    
              const weightedScore = (urlPredictionValue * urlPredictionWeight) + (textPredictionValue * textPredictionWeight);              
              const finalPrediction = weightedScore >= 0.5 ? "harmful" : "safe" ;

              // Set score image size
              score.style.width = "100px";
              score.style.height = "100px";

              // Extract report message
              const reportMessage = typeof result.report_result === "string" 
                ? result.report_result 
                : result.report_result.message;

              // Populate result page with data
              urlElement.innerHTML =  `<p>${result.url}</p>`;
              analysis.innerHTML = `<p>Our Prediction: <strong>${finalPrediction.charAt(0).toUpperCase() + finalPrediction.slice(1)}</strong></p>`;
              virustotal.innerHTML = `<p>VirusTotal Report: <strong>${result.virustotal_result.charAt(0).toUpperCase() + result.virustotal_result.slice(1)}</strong></p>`;              

              // Display based on final prediction
              if (finalPrediction === "safe" && result.virustotal_result === "safe") {
                score.src = "../images/safe.png"; 
                statusElement.innerHTML = `<strong style="color: #00c897;">SAFE!</strong>`;
                callToAction.innerHTML = `<p style="color: #00c897;">No malicious activity detected</p>`;
                report.innerHTML = `<strong style="color: #00c897;">${reportMessage}</strong>`;
              } else if (finalPrediction === "harmful" && (result.virustotal_result === "unknown" || result.virustotal_result === "harmful")) {
                score.src = "../images/harmful.png";
                statusElement.innerHTML = `<strong style="color: #ea0000;">BEWARE!</strong>`;
                callToAction.innerHTML = `<p style="color: #ea0000;">This website contains suspicious activities!</p>`;
                report.innerHTML = `<strong style="color: #ea0000;">${reportMessage}</strong>`;
              } else {
                score.src = "../images/cautious.png"; 
                statusElement.innerHTML = `<strong style="color: #ff914d;">CAUTIOUS!</strong>`;
                callToAction.innerHTML = `<p style="color: #ff914d;">Be cautious of this website, it may contain malicious activity</p>`;
                report.innerHTML = `<strong style="color: #ff914d;">${reportMessage}</strong>`;
              }
            }

            // Switch to results page
            hideElement(processPage);
            showElement(resultsPage);
          }
        );
      }
    );
  } catch (err) {
    callToAction.innerText = "This website is private unable to analyse.";
    hideLoadingBar();
  }
};

// Helper function to get the current tab object
const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

// Function injected into tab to scrape webpage text
function scrapeContentFromPage() {
  let pageText = document.body.innerText;
  let currentURL = window.location.href;

  // Send scraped data to background script
  chrome.runtime.sendMessage({ type: "scrapedData", pageText, url: currentURL });
}

// Event handler for the "Check Safety" button
checkSafetyElement.onclick = async () => {
  hideElement(landingPage);
  showElement(processPage);
  showLoadingBar();

  // Simulate loading bar progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    updateLoadingBar(progress);
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 500);

  // Get current tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Begin processing
  fetchAndProcessURL();

  // Scrape text content directly
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeContentFromPage,
  });
};