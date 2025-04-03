chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "checkSafety") {
      // Make the fetch request to your Flask server here
      fetch("http://127.0.0.1:5000/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: message.url, pageText: message.pageText })
      })
      .then(response => response.json())
      .then(data => {
          console.log("Flask Response:", data);
          sendResponse({ data: data });
      })
      .catch(error => {
          console.error("Error:", error);
          sendResponse({ error: "Failed to fetch data from the server" });
      });

      return true; 
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        startBlinkingIcon();
    }
});

let isBlinking = false;
let blinkInterval;

function startBlinkingIcon() {
    if (isBlinking) return; // Prevent multiple intervals

    isBlinking = true;
    blinkInterval = setInterval(() => {
        let newIcon = isBlinking ? { path: "images/safe.png" } : { path: "images/1.png" }; // Alternate between two icons
        chrome.action.setIcon(newIcon);
        isBlinking = !isBlinking; // Toggle the blinking state
    }, 100); // Blink every 500ms
}

function stopBlinkingIcon() {
    clearInterval(blinkInterval);
    isBlinking = false;
    chrome.action.setIcon({ path: "images/2.png" }); // Reset to normal icon
}

// Stop blinking after some time or based on conditions
setTimeout(() => stopBlinkingIcon(), 5000); // Example: Stop after 5 seconds
