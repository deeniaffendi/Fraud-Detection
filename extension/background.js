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

let blinkInterval;
let blinkState = false;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    blinkState = false;  // Ensure initial state is off
    blinkInterval = setInterval(() => {
      chrome.action.setIcon({
        path: blinkState ? "images/1.png" : "images/2.png",
        tabId: tabId
      });
      blinkState = !blinkState;
    }, 500); // Blink every 500ms

    // Stop blinking after 10 seconds
    setTimeout(() => {
      clearInterval(blinkInterval);
      chrome.action.setIcon({ path: "images/logo.png" });  // Optionally reset the icon
    }, 10000); // 10 seconds
  }
});
