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

const landingPage = document.getElementById("landingPage")
const processPage = document.getElementById("processPage")
const resultsPage = document.getElementById("resultsPage")

const hideElement = (elem) => {
  elem.style.display = 'none'; // Hide the element
};

const showElement = (elem) => {
  elem.style.display = ''; // Show the element
};

hideElement(processPage)
hideElement(resultsPage)

const showLoadingBar = () => {
  loadingContainer.style.display = 'block'; 
  loadingBar.style.width = '0%';
};

const updateLoadingBar = (progress) => {
  loadingBar.style.width = `${progress}%`; 
};

const hideLoadingBar = () => {
  loadingContainer.style.display = 'none'; 
};

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

const fetchAndProcessURL = async () => {
  try {
    const url = await getURL()
    console.log("URL fetched:", url);

    // Inject script into the active tab to extract text
    chrome.scripting.executeScript(
      {
        target: { tabId: (await getCurrentTab()).id },
        func: () => document.body.innerText, // Fetch webpage text
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          tajukElement.innerText = "Error extracting text.";
          hideLoadingBar();
          return;
        }

        const pageText = injectionResults[0].result; // Extract text content
        console.log("Extracted text:", pageText);

        // Send URL and page text to the background script
        chrome.runtime.sendMessage(
          { type: "checkSafety", url: url, pageText: pageText },
          (response) => {
            console.log("Response from background:", response);

            if (response.error) {
              tajukElement.innerText = "Error: " + response.error;
            } else {
              const result = response.data;
              const textPredictionWeight = 0.6;
              const urlPredictionWeight = 0.4;
              const urlPredictionValue = result.url_prediction === "safe" ? 0 : 1;
              const textPredictionValue = result.text_prediction === "safe" ? 0 : 1;    
              const weightedScore = (urlPredictionValue * urlPredictionWeight) + (textPredictionValue * textPredictionWeight);              
              const finalPrediction = weightedScore >= 0.5 ? "harmful" : "safe" ;

              score.style.width = "100px";
              score.style.height = "100px";
              
              const reportMessage = typeof result.report_result === "string" 
                ? result.report_result 
                : result.report_result.message;

              urlElement.innerHTML =  `<p>${result.url}</p>`
              analysis.innerHTML = `<p>Our Prediction: <strong>${finalPrediction.charAt(0).toUpperCase() + finalPrediction.slice(1)}</strong></p>`;
              virustotal.innerHTML = `<p>VirusTotal Report: <strong>${result.virustotal_result.charAt(0).toUpperCase() + result.virustotal_result.slice(1)}</strong></p>`;              

              if (finalPrediction === "safe" && result.virustotal_result === "safe") {
                score.src = "../images/safe.png"; 
                statusElement.innerHTML = `<strong style="color: #00c897;">SAFE!</strong>`;
                callToAction.innerHTML = `<p style="color: #00c897;">No malicious activity detected</p>`;
                report.innerHTML = `<strong style="color: #00c897;">${reportMessage}</strong> `
              } else if (finalPrediction === "harmful" && result.virustotal_result === "unknown" ||finalPrediction === "harmful" && result.virustotal_result === "harmful") {
                score.src = "../images/harmful.png";
                statusElement.innerHTML = `<strong style="color: #ea0000;">BEWARE!</strong>`;
                callToAction.innerHTML = `<p style="color: #ea0000;">This website contains suspicious activities!</p>`;
                report.innerHTML = `<strong style="color: #ea0000;">${reportMessage}</strong> `
              } else {
                score.src = "../images/cautious.png"; 
                statusElement.innerHTML = `<strong style="color: #ff914d;">CAUTIOUS!</strong>`;
                callToAction.innerHTML = `<p style="color: #ff914d;">Be cautious of this website, it may contain malicious activity</p>`;
                report.innerHTML = `<strong style="color: #ff914d;">${reportMessage}</strong> `
              }
            }
            hideElement(processPage)
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

// Helper function to get current tab
const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

// Function to scrape content from page
function scrapeContentFromPage(){
  
  // Parse contents from the HTML page
  let pageText = document.body.innerText;
  let currentURL = window.location.href;

  // Send content
  chrome.runtime.sendMessage({type: "scrapedData", pageText, url: currentURL});
}

// Button event
checkSafetyElement.onclick = async() => {

  hideElement(landingPage)
  showElement(processPage)
  showLoadingBar(); 

  // Simulate a long process with setInterval to update the progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    updateLoadingBar(progress);
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 500);

  // Get current active tab
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  fetchAndProcessURL();

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: scrapeContentFromPage,
  });
};