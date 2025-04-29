// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "checkSafety") {
    // Send POST request to your Flask server
    fetch("http://127.0.0.1:5000/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: message.url, pageText: message.pageText })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Flask Response:", data);
      sendResponse({ data: data }); // Respond to sender (popup.js)
    })
    .catch(error => {
      console.error("Error contacting Flask server:", error);
      sendResponse({ error: "Failed to fetch data from the server" });
    });

    return true; // Keeps the message channel open for sendResponse
  }
});

let blinkInterval;
let blinkState = false;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    blinkState = false;

    // Start icon blinking
    blinkInterval = setInterval(() => {
      chrome.action.setIcon({
        path: blinkState ? "images/1.png" : "images/2.png",
        tabId: tabId
      });
      blinkState = !blinkState;
    }, 500); // Toggle every 500ms

    // Stop blinking after 10 seconds and reset to default icon
    setTimeout(() => {
      clearInterval(blinkInterval);
      chrome.action.setIcon({
        path: "images/logo.png",
        tabId: tabId
      });
    }, 10000);
  }
});