// popup.js
// Controls UI and communicates with content script via tabs and window.postMessage bridge.

function log(msg) {
  const p = document.getElementById('log');
  p.textContent = (p.textContent ? p.textContent + "\\n" : "") + msg;
}

// read/save settings
document.addEventListener('DOMContentLoaded', async () => {
  const enabledEl = document.getElementById('enabled');
  const dmin = document.getElementById('delay_min');
  const drand = document.getElementById('delay_rand');
  const templateEl = document.getElementById('template');

  // load saved settings
  chrome.storage.local.get(['enabled','delay_ms_min','delay_ms_random_add','learned_template'], (res) => {
    enabledEl.checked = !!res.enabled;
    dmin.value = res.delay_ms_min || 40;
    drand.value = res.delay_ms_random_add || 20;
    templateEl.value = res.learned_template || '';
  });

  enabledEl.addEventListener('change', () => {
    chrome.storage.local.set({enabled: enabledEl.checked});
    log('enabled=' + enabledEl.checked);
  });

  dmin.addEventListener('change', () => chrome.storage.local.set({delay_ms_min: Number(dmin.value)}));
  drand.addEventListener('change', () => chrome.storage.local.set({delay_ms_random_add: Number(drand.value)}));

  // helper to send a postMessage to the page via the content script
  async function sendCmdToActiveTab(cmd, payload = {}) {
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (!tab) { log('no active tab'); return null; }
    // execute a small script in the page that posts a message to the page context front (bridge via content script already present)
    // We use chrome.scripting.executeScript to run a script in the page that will forward window.postMessage.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (c,p) => { window.postMessage({ duckhunt_cmd: c, ...p }, '*'); },
      args: [cmd, payload]
    });
    // listen for response via runtime messages - but easier is to add a temporary listener in page and content script posts message back via window.postMessage
    return true;
  }

  document.getElementById('teach').addEventListener('click', async () => {
    // Ask page for template (it responds by posting window.postMessage back)
    await sendCmdToActiveTab('get_template');
    // Now we need to listen for the response in the tab by injecting a one-time listener and pulling it into the popup.
    // We'll execute script that sets up a one-time postMessage bridge from page->extension via window.postMessage -> content script already forwards to extension through message.
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (!tab) return;
    // add a temporary listener via chrome.tabs.onUpdated? Simpler: poll the page API by asking list_sockets and template via executeScript reading window.__duckhunt_api.getLearnedTemplate()
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          const t = window.__duckhunt_api && window.__duckhunt_api.getLearnedTemplate ? window.__duckhunt_api.getLearnedTemplate() : null;
          return {ok:true, template: t};
        } catch(e){ return {ok:false, error: e.message}; }
      }
    });
    if (result && result[0] && result[0].result) {
      const tpl = result[0].result.template;
      if (tpl) {
        templateEl.value = tpl;
        chrome.storage.local.set({learned_template: tpl});
        log('Template fetched from page.');
      } else {
        log('No template learned yet. Perform one manual shoot in the page to teach the extension.');
      }
    } else {
      log('Failed to fetch template.');
    }
  });

  document.getElementById('save_template').addEventListener('click', async () => {
    const tpl = templateEl.value;
    chrome.storage.local.set({learned_template: tpl});
    // also push to page
    await sendCmdToActiveTab('set_template', {template: tpl});
    log('Template saved.');
  });

  document.getElementById('shootnow').addEventListener('click', async () => {
    // read template from storage
    const s = await new Promise(r => chrome.storage.local.get(['learned_template'], r));
    const tpl = s.learned_template;
    if (!tpl) { log('No template saved.'); return; }
    // send shoot_now command to page
    await sendCmdToActiveTab('shoot_now', {});
    // we don't get direct success; but call the API in page that attempts to send on first WS
    // also log
    log('Shoot requested. (If template valid and socket open it should have been sent.)');
  });

  document.getElementById('list_sockets').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (!tab) return;
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          return window.__duckhunt_api && window.__duckhunt_api.listSockets ? window.__duckhunt_api.listSockets() : [];
        } catch(e) { return {error: e.message}; }
      }
    });
    log('Sockets: ' + JSON.stringify(result[0].result || result[0].result));
  });

});
