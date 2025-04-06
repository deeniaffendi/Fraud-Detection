const checkSafetyElement = document.getElementById("checkSafety");
const tajukElement = document.getElementById("tajuk");
const callToActionEelement = document.getElementById("callToAction");
const containerElement = document.querySelector(".container");
const imageElement = document.getElementById("logo"); 
const loadingContainer = document.getElementById("loadingContainer"); 
const loadingBar = document.getElementById("loadingBar");
const analysedElement = document.getElementById("analysed");

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

const hideElement = (elem) => {
  elem.style.display = 'none'; // Hide the element
};

hideElement(callToActionEelement)

const showElement = (elem) => {
  elem.style.display = ''; // Show the element
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
              showElement(imageElement)
              showElement(callToActionEelement)
              const result = response.data;
              analysedElement.innerHTML =  `<p>This ${result.url} was analysed</p>`
              const textPredictionWeight = 0.6;
              const urlPredictionWeight = 0.4;

              // Convert predictions to a numerical value (e.g., 1 for harmful, 0 for safe)
              const urlPredictionValue = result.url_prediction === "safe" ? 0 : 1;
              const textPredictionValue = result.text_prediction === "safe" ? 0 : 1;

              // Calculate the weighted average score for safety
              const weightedScore = (urlPredictionValue * urlPredictionWeight) + (textPredictionValue * textPredictionWeight);

              // Determine the final output based on weighted score
              const finalPrediction = weightedScore >= 0.5 ? "harmful" : "safe" ;

              imageElement.style.width = "100px";
              imageElement.style.height = "100px";

              const reportMessage = typeof result.report_result === "string" 
                ? result.report_result 
                : result.report_result.message;
              tajukElement.innerHTML = `
                  <p><strong>Our Prediction: ${finalPrediction}</p></strong>
                  <p><strong>VirusTotal Prediction: ${result.virustotal_result}</p></strong>
                  <p>Model Prediction</p>
                  <p><strong>URL Prediction:</strong>${result.url_prediction}</p>
                  <p><strong>Text Prediction:</strong> ${result.text_prediction}
                  <p><strong>VirusTotal Report:</strong> ${reportMessage}</p>
              `;
              // Replace logo based on the result
              if (finalPrediction === "safe" && result.virustotal_result === "safe") {
                imageElement.src = "../images/safe.png"; // Totally safe
                callToActionEelement.innerHTML = `<p>No malicious activity detected</p>`
              } else if (finalPrediction === "harmful" && result.virustotal_result === "harmful") {
                imageElement.src = "../images/harmful.png"; // Totally harmful
                callToActionEelement.innerHTML = `<p>We predict that this website is harmful be careful of clicking on any links</p>`
              } else {
                imageElement.src = "../images/cautios.png"; // Mixed result
                callToActionEelement.innerHTML = `<p>Be cautious of this website, it may contain malicous activity</p>`
              }
            }
            // // Re-enable the button after response
            // checkSafetyElement.disabled = false;
            // checkSafetyElement.innerText = "Check Again";
            // showElement(checkSafetyElement);
            showElement(containerElement);
            hideLoadingBar();
          }
        );
      }
    );
  } catch (err) {
    tajukElement.innerText = "Error fetching URL.";
    hideLoadingBar(); // Hide loading bar on error
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

  // Show the loading bar and start the progress
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

  hideElement(imageElement)
  hideElement(checkSafetyElement)
  tajukElement.innerText = "Processing...";

  // Get current active tab
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  fetchAndProcessURL();

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: scrapeContentFromPage,
  });
};

{/* <p><strong>Our Prediction</p></strong>
<p><strong>URL Prediction:</strong> ${result.url_prediction}</p>
<p><strong>Text Prediction:</strong> ${result.text_prediction}</p>
<p><strong>VirusTotal Report:</strong> ${reportMessage}</p> */}