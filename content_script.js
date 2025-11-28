// content_script.js
// Inject code into page context to hook WebSocket (we need page context to intercept page's ws)
(function () {
  // This script will be injected at document_start by manifest so it runs before page WS created.

  const injectedCode = `

  (function() {
    // === WebSocket interception wrapper ===
    // Save original constructor
    const OriginalWebSocket = window.WebSocket;

    // Keep list of active sockets created by the page
    window.__duckhunt_sockets = window.__duckhunt_sockets || [];

    // Storage for the learned shoot message template (string or JSON)
    window.__duckhunt_learned_template = window.__duckhunt_learned_template || null;

    // Helper: try parse JSON
    function tryParseJSON(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    }

    // Helper: check if a server message is a duck event
    function isDuckEvent(msgObj) {
      // Defensive checks: game started with duck_hunt / multiple_duck_hunt or payload containing "duck_hunt"
      if (!msgObj) return false;
      // Known patterns discovered in mitm dump: {"type":"event","payload":["App\\\\Game\\\\Events\\\\GameStarted",... ,"type":"multiple_duck_hunt"]}
      try {
        if (msgObj.type && typeof msgObj.type === 'string') {
          const t = msgObj.type.toLowerCase();
          if (t.includes('game') && JSON.stringify(msgObj).toLowerCase().includes('duck_hunt')) return true;
          if (t.includes('multiple_duck_hunt') || t.includes('duck_hunt')) return true;
        }
        // sometimes events are nested in payload arrays
        if (Array.isArray(msgObj.payload)) {
          const p = JSON.stringify(msgObj.payload).toLowerCase();
          if (p.includes('duck_hunt')) return true;
          if (p.includes('gamestarted') && p.includes('duck_hunt')) return true;
        }
        // fallback: string contains duck or duck_hunt
        if (JSON.stringify(msgObj).toLowerCase().includes('duck')) return true;
      } catch(e){}
      return false;
    }

    // Helper: check if an outgoing message is a 'shoot' type
    function isShootOutgoing(msg) {
      if (!msg) return false;
      // Try parse JSON
      let obj = null;
      if (typeof msg === 'string') obj = tryParseJSON(msg);
      else obj = msg;

      if (!obj) {
        // fallback: textual check
        const s = (''+msg).toLowerCase();
        if (s.includes('shoot') || s.includes('duck') || s.includes('hit')) return true;
        return false;
      }

      // If object has type or action naming that looks like shoot/hit
      try {
        if ((obj.type && /shoot|hit|duck|hunt|fire/i.test(obj.type)) ) return true;
        if (obj.action && /shoot|hit|duck|hunt|fire/i.test(obj.action)) return true;
        // payloads may contain the actual command
        if (obj.payload && JSON.stringify(obj.payload).toLowerCase().includes('shoot')) return true;
        if (JSON.stringify(obj).toLowerCase().includes('shoot')) return true;
      } catch(e) {}
      return false;
    }

    // Wrap constructor
    function WrappedWebSocket(url, protocols) {
      const ws = (protocols !== undefined) ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

      try {
        // store metadata
        ws.__duckhunt_url = url;
        window.__duckhunt_sockets.push(ws);

        // Wrap send to intercept outgoing messages
        const origSend = ws.send.bind(ws);
        ws.send = function(data) {
          try {
            // if we detect an outgoing shoot message, save template
            if (!window.__duckhunt_learned_template && isShootOutgoing(data)) {
              // Save raw string if possible
              let raw = data;
              if (typeof data !== 'string') {
                try { raw = JSON.stringify(data); } catch(e) {}
              }
              window.__duckhunt_learned_template = raw;
              // publish event to page that template learned
              window.dispatchEvent(new CustomEvent('duckhunt-template-learned', {detail: {template: window.__duckhunt_learned_template}}));
              console.log('[DuckHunt] Learned shoot template:', window.__duckhunt_learned_template);
            }
          } catch(e){}

          // always forward
          return origSend(data);
        };

        // Wrap onmessage to detect duck events
        ws.addEventListener('message', function(ev) {
          let payload = ev.data;
          // Try parse JSON and inspect
          let parsed = null;
          try { parsed = JSON.parse(payload); } catch(e){ parsed = null; }
          if (isDuckEvent(parsed || payload)) {
            // we detected a duck event - fire page event
            window.dispatchEvent(new CustomEvent('duckhunt-duck-detected', { detail: { socketUrl: url, raw: payload, parsed: parsed } }));
            // If auto-shoot enabled, request background to perform shoot via DOM event (background cannot access page ws)
            window.dispatchEvent(new CustomEvent('duckhunt-request-autoshoot', { detail: { socketUrl: url, raw: payload, parsed: parsed } }));
          }
        });
      } catch(e) {
        console.error('[DuckHunt] WS wrap error', e);
      }
      return ws;
    }

    // Copy static props
    WrappedWebSocket.prototype = OriginalWebSocket.prototype;
    WrappedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    WrappedWebSocket.OPEN = OriginalWebSocket.OPEN;
    WrappedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    WrappedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

    // Replace global WebSocket
    window.WebSocket = WrappedWebSocket;

    // Provide API on window for manual control by extension popup
    window.__duckhunt_api = {
      getLearnedTemplate: function(){ return window.__duckhunt_learned_template; },
      setLearnedTemplate: function(t){ window.__duckhunt_learned_template = t; },
      listSockets: function(){ return window.__duckhunt_sockets.map(s => ({url: s.__duckhunt_url, readyState: s.readyState}) ); },
      attemptShootNow: function(extra) {
        // attempt to replay learned template on first available socket
        try {
          const template = window.__duckhunt_learned_template;
          const sockets = window.__duckhunt_sockets.filter(s => s.readyState === 1);
          if (!sockets.length) {
            console.warn('[DuckHunt] No open sockets to shoot.');
            return {ok:false,reason:'no-socket'};
          }
          if (!template) {
            console.warn('[DuckHunt] No learned template available.');
            return {ok:false,reason:'no-template'};
          }
          // For safety, clone the template. If it's JSON string, try parse then stringify to make sure it's string
          let payload = template;
          if (typeof payload !== 'string') payload = JSON.stringify(payload);
          // Optionally merge extras (if provided: replace placeholders like {{hash}})
          if (extra && typeof extra === 'object') {
            try {
              let obj = JSON.parse(payload);
              // shallow merge
              Object.assign(obj, extra);
              payload = JSON.stringify(obj);
            } catch(e) {
              // cannot merge into non-json
            }
          }
          sockets[0].send(payload);
          console.log('[DuckHunt] Sent learned template on socket', sockets[0].__duckhunt_url);
          return {ok:true};
        } catch(e) {
          console.error('[DuckHunt] attemptShootNow error', e);
          return {ok:false,reason:e.message};
        }
      }
    };

    // log readiness
    console.log('[DuckHunt] WebSocket hook injected.');

  })(); // end injected IIFE

  `;

  // Inject into page
  const script = document.createElement('script');
  script.textContent = injectedCode;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // === Bridge between page and extension (content script context) ===

  // Forward custom events from page to extension (via window.postMessage)
  window.addEventListener('duckhunt-duck-detected', function(ev) {
    window.postMessage({ duckhunt_event: 'duck_detected', detail: ev.detail }, '*');
  });

  window.addEventListener('duckhunt-template-learned', function(ev) {
    window.postMessage({ duckhunt_event: 'template_learned', detail: ev.detail }, '*');
  });

  window.addEventListener('duckhunt-request-autoshoot', function(ev) {
    window.postMessage({ duckhunt_event: 'request_autoshoot', detail: ev.detail }, '*');
  });

  // Listen to messages from extension (popup/background) to call page API
  window.addEventListener('message', function(ev) {
    if (!ev.data || !ev.data.duckhunt_cmd) return;
    const cmd = ev.data.duckhunt_cmd;
    try {
      if (cmd === 'get_template') {
        const resp = window.__duckhunt_api && window.__duckhunt_api.getLearnedTemplate ? window.__duckhunt_api.getLearnedTemplate() : null;
        window.postMessage({ duckhunt_resp: 'template', value: resp }, '*');
      } else if (cmd === 'shoot_now') {
        const extra = ev.data.extra || null;
        const result = window.__duckhunt_api && window.__duckhunt_api.attemptShootNow ? window.__duckhunt_api.attemptShootNow(extra) : {ok:false,reason:'no-api'};
        window.postMessage({ duckhunt_resp: 'shoot_result', value: result }, '*');
      } else if (cmd === 'set_template') {
        window.__duckhunt_api && window.__duckhunt_api.setLearnedTemplate && window.__duckhunt_api.setLearnedTemplate(ev.data.template);
        window.postMessage({ duckhunt_resp: 'set_template_ok' }, '*');
      } else if (cmd === 'list_sockets') {
        const list = window.__duckhunt_api && window.__duckhunt_api.listSockets ? window.__duckhunt_api.listSockets() : [];
        window.postMessage({ duckhunt_resp: 'list_sockets', value: list }, '*');
      }
    } catch (e) {
      window.postMessage({ duckhunt_resp: 'error', value: e.message }, '*');
    }
  });

  // Also forward page->extension events as window.postMessage already used above
})();
