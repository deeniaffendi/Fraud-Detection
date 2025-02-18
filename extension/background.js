chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "checkSafety") {
      console.log("Received URL:", message.url);

      // Make the fetch request to your Flask server here
      fetch("http://127.0.0.1:5000/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: message.url })
      })
      .then(response => response.json())
      .then(data => {
          console.log("VirusTotal Response:", data);
          sendResponse({ data: data });  // Send the response back to popup.js
      })
      .catch(error => {
          console.error("Error:", error);
          sendResponse({ error: "Failed to fetch data from the server" });
      });

      return true;  // Keep the sendResponse callback open for asynchronous response
  }
});