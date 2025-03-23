const checkSafetyElement = document.getElementById("checkSafety");
const tajukElement = document.getElementById("tajuk");

const hideElement = (elem) => {
  elem.style.display = 'none';
};

const showElement = (elem) => {
  elem.style.display = '';
};

// Get current URL
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
              tajukElement.innerText = response.data.message || "Scan Completed!";
            }

            // Re-enable the button after response
            checkSafetyElement.disabled = false;
            checkSafetyElement.innerText = "Check Again";
            showElement(checkSafetyElement);
          }
        );
      }
    );
  } catch (err) {
    tajukElement.innerText = "Error fetching URL.";
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
  
  //Parse contents from the HTML page
  let pageText = document.body.innerText;
  let currentURL = window.location.href;

  // Send content
  chrome.runtime.sendMessage({type: "scrapedData", pageText, url: currentURL});
}

//Button event
checkSafetyElement.onclick = async() => {
  console.log("Button clicked");

  // Hide the button while loading
  hideElement(checkSafetyElement);

  // Call the function to fetch and process the URL
  fetchAndProcessURL();

  // Get current active tab
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true})

  // Execute script to parse emails on page
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: scrapeContentFromPage,
  })
};