const checkSafetyElement = document.getElementById("checkSafety");
const tajukElement = document.getElementById("tajuk");
const containerElement = document.querySelector(".container");
const imageElement = document.getElementById("logo"); 
const loadingContainer = document.getElementById("loadingContainer"); // Added for the loading container
const loadingBar = document.getElementById("loadingBar");

const showLoadingBar = () => {
  loadingContainer.style.display = 'block'; // Show the loading bar container
  loadingBar.style.width = '0%'; // Reset the width before starting
};

const updateLoadingBar = (progress) => {
  loadingBar.style.width = `${progress}%`; // Update the loading bar width
};

const hideLoadingBar = () => {
  loadingContainer.style.display = 'none'; // Hide the loading bar when done
};

const hideElement = (elem) => {
  elem.style.display = 'none'; // Hide the element
};

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
    const url = await getURL(); // Get current tab URL
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
              const result = response.data;
              imageElement.style.width = "100px";
              imageElement.style.height = "100px";

              const reportMessage = typeof result.report_result === "string" 
                ? result.report_result 
                : result.report_result.message;
              tajukElement.innerHTML = `
                  <p><strong>Our Prediction</p></strong>
                  <p><strong>URL Prediction:</strong> ${result.url_prediction}</p>
                  <p><strong>Text Prediction:</strong> ${result.text_prediction}</p>
                  <p><strong>VirusTotal Report:</strong> ${reportMessage}</p>
              `;
              // Replace logo based on the result
              if (result.url_prediction === "Safe" && result.text_prediction === "Safe") {
                imageElement.src = "../images/safe.png"; // Safe logo image
              } else if (result.url_prediction === "Harmful" && result.text_prediction === "Safe") { 
                imageElement.src = "../images/cautios.png"; // Safe logo image
              } else if (result.url_prediction === "Safe" && result.text_prediction === "Harmful") { 
                imageElement.src = "../images/cautios.png"; // Safe logo image
              }
              else {
                imageElement.src = "../images/harmful.png"; // Unsafe logo image
              }
            }
            // Re-enable the button after response
            checkSafetyElement.disabled = false;
            checkSafetyElement.innerText = "Check Again";
            showElement(checkSafetyElement);
            showElement(containerElement);

            // Hide the loading bar when done
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
