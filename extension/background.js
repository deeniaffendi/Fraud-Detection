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
          console.log("VirusTotal Response:", data);
          sendResponse({ data: data });
      })
      .catch(error => {
          console.error("Error:", error);
          sendResponse({ error: "Failed to fetch data from the server" });
      });

      return true; 
  }
});