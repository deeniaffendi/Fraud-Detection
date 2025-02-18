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

// Check button event
checkSafetyElement.onclick = async () => {
  console.log("Button clicked");

  // Hide the button while loading
  hideElement(checkSafetyElement);

  try {
    const url = await getURL(); // Get current tab URL
    console.log("URL fetched:", url);

    // Send the URL to the background script
    chrome.runtime.sendMessage({ type: 'checkSafety', url: url }, (response) => {
      console.log("Response from background:", response);

      if (response.error) {
        tajukElement.innerText = "Error: " + response.error;
      } else {
        // Display the message from the response
        tajukElement.innerText = response.data.message || "Scan Completed!";
      }

      // Re-enable the button after the response
      checkSafetyElement.disabled = false;
      checkSafetyElement.innerText = "Check Again";  // Optionally change button text
      showElement(checkSafetyElement);  // Show the button again
    });
  } catch (err) {
    tajukElement.innerText = "Error fetching URL.";
  }
};
