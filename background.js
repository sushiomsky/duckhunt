// background.js
// Handles popup commands and stores config in chrome.storage; receives events via content script messaging (runtime messaging)
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: false,
    delay_ms_min: 40,
    delay_ms_random_add: 20
  });
});

// Receive messages from content script (via window.postMessage forwarded through content script)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // This background currently not used for direct WS sending - content script does actual WS send in page context.
  sendResponse({ok:true});
});

// We will use chrome.scripting to execute small snippets from popup to the page via content script where necessary.
