// DuckDice Duck Hunt Auto-Shooter
// Rapidly clicks empty spaces in the chat area to hit flying ducks

(function() {
  'use strict';

  console.log('[Duck Hunt] 🦆 Extension loaded and initializing...');

  // Configuration
  const CONFIG = {
    CLICK_INTERVAL: 50,          // Click every 50ms (very fast)
    POINTS_PER_CYCLE: 20,        // Generate 20 random points per cycle
    MIN_AREA_SIZE: 100,          // Minimum chat area size to start clicking
    DEBUG_MODE: true,            // Enable detailed logging
    DUCK_HUNT_CHECK_INTERVAL: 1000, // Check if duck hunt is active every 1000ms
    CHAT_SELECTORS: [            // Possible selectors for the chat container
      '[class*="chat"]',
      '[id*="chat"]',
      '[class*="Chat"]',
      '[id*="Chat"]',
      '[class*="message"]',
      '[class*="Message"]'
    ],
    DUCK_HUNT_SELECTORS: [       // Selectors to detect if duck hunt mode is active
      '[class*="duck"]',
      '[class*="Duck"]',
      '[id*="duck"]',
      '[id*="Duck"]',
      '[class*="hunt"]',
      '[class*="Hunt"]'
    ]
  };

  // State management
  const state = {
    totalClicks: 0,
    chatContainer: null,
    cachedChatRect: null,
    isActive: false,
    isDuckHuntActive: false,
    clickInterval: null,
    monitorInterval: null,
    statusInterval: null,
    lastMonitorCheck: 0
  };

  // Check if duck hunt mode is currently active
  function isDuckHuntModeActive() {
    // Strategy 1: Look for duck hunt specific elements
    for (const selector of CONFIG.DUCK_HUNT_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Check if any of these elements are visible and not just part of the UI
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (rect.width > 0 && rect.height > 0 &&
              style.display !== 'none' && 
              style.visibility !== 'hidden') {
            // Found a visible duck hunt element
            return true;
          }
        }
      }
    }

    // Strategy 2: Check for canvas elements that might be the game
    const canvases = document.querySelectorAll('canvas');
    for (const canvas of canvases) {
      const rect = canvas.getBoundingClientRect();
      const style = window.getComputedStyle(canvas);
      // Look for positioned canvas elements that might be ducks
      if ((style.position === 'absolute' || style.position === 'fixed') &&
          rect.width > 30 && rect.height > 30 &&
          style.display !== 'none') {
        return true;
      }
    }

    // Strategy 3: Look for images with duck in the src
    const images = document.querySelectorAll('img');
    for (const img of images) {
      if (img.src && img.src.toLowerCase().includes('duck')) {
        const rect = img.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }

    return false;
  }

  // Find the chat container on the page
  function findChatContainer() {
    // Try each selector
    for (const selector of CONFIG.CHAT_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Must be reasonably sized and visible
        if (rect.width >= CONFIG.MIN_AREA_SIZE && 
            rect.height >= CONFIG.MIN_AREA_SIZE &&
            rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            return el;
          }
        }
      }
    }
    
    // Fallback: find the largest visible container that might be chat
    const allDivs = document.querySelectorAll('div');
    let largestChat = null;
    let largestArea = 0;
    
    for (const div of allDivs) {
      const rect = div.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > largestArea && area > CONFIG.MIN_AREA_SIZE * CONFIG.MIN_AREA_SIZE) {
        const style = window.getComputedStyle(div);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          // Check if it looks like a chat (has overflow scroll/auto)
          if (style.overflow === 'auto' || style.overflow === 'scroll' ||
              style.overflowY === 'auto' || style.overflowY === 'scroll') {
            largestChat = div;
            largestArea = area;
          }
        }
      }
    }
    
    return largestChat;
  }

  // Check if an element at a point should be avoided
  function shouldAvoidElement(element) {
    if (!element) return true;

    try {
      const tagName = element.tagName.toLowerCase();
      
      // Avoid links
      if (tagName === 'a' || element.closest('a')) {
        return true;
      }

      // Avoid buttons
      if (tagName === 'button' || element.closest('button')) {
        return true;
      }

      // Avoid input elements
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
      }

      // Avoid images (avatars, hearts, etc.)
      if (tagName === 'img' || tagName === 'svg') {
        return true;
      }

      // Avoid elements with text content (to avoid clicking on messages)
      const textContent = element.textContent?.trim() || '';
      if (textContent.length > 0 && element.children.length === 0) {
        // This is a leaf element containing text (e.g., span with message text)
        return true;
      }

      // Avoid clickable elements (cursor pointer)
      const style = window.getComputedStyle(element);
      if (style.cursor === 'pointer' || style.cursor === 'grab') {
        // Unless it's absolutely positioned (could be the duck)
        if (style.position !== 'absolute' && style.position !== 'fixed') {
          return true;
        }
      }

      // Avoid elements with onclick handlers
      if (element.onclick || element.hasAttribute('onclick')) {
        return true;
      }

      return false;
    } catch (e) {
      return true;
    }
  }

  // Generate random points within the chat area
  function generateClickPoints(chatRect) {
    const points = [];
    const padding = 10; // Stay away from edges
    
    for (let i = 0; i < CONFIG.POINTS_PER_CYCLE; i++) {
      const x = chatRect.left + padding + Math.random() * (chatRect.width - 2 * padding);
      const y = chatRect.top + padding + Math.random() * (chatRect.height - 2 * padding);
      points.push({ x, y });
    }
    
    return points;
  }

  // Click at a specific point
  function clickAt(x, y) {
    try {
      // Check what's at this point
      const element = document.elementFromPoint(x, y);
      
      // Skip if we should avoid this element
      if (shouldAvoidElement(element)) {
        if (CONFIG.DEBUG_MODE && state.totalClicks % 100 === 0) {
          // Only format coordinates when actually logging
          console.log(`[Duck Hunt] ⏭️  Skipping click at (${x.toFixed(0)}, ${y.toFixed(0)}) - avoiding ${element?.tagName || 'unknown'}`);
        }
        return false;
      }

      state.totalClicks++;

      if (CONFIG.DEBUG_MODE && state.totalClicks % 100 === 0) {
        // Only format coordinates when actually logging
        console.log(`[Duck Hunt] 💥 Click #${state.totalClicks} at (${x.toFixed(0)}, ${y.toFixed(0)}) on ${element?.tagName || 'unknown'}`);
      }

      // Create mouse events
      const eventOptions = {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      };

      // Dispatch click events at the point
      if (element) {
        element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        element.dispatchEvent(new MouseEvent('click', eventOptions));
      }

      // Also dispatch at document level
      document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent('click', eventOptions));

      return true;
    } catch (error) {
      if (CONFIG.DEBUG_MODE) {
        console.error('[Duck Hunt] ❌ Error clicking at point:', error);
      }
      return false;
    }
  }

  // Main rapid clicking function
  function rapidClickCycle() {
    if (!state.isActive) return;

    // Find or verify chat container
    if (!state.chatContainer || !document.body.contains(state.chatContainer)) {
      state.chatContainer = findChatContainer();
      if (!state.chatContainer) {
        if (CONFIG.DEBUG_MODE && state.totalClicks === 0) {
          console.log('[Duck Hunt] ⚠️  Chat container not found yet, will retry...');
        }
        return;
      }
      console.log('[Duck Hunt] 📦 Chat container found:', state.chatContainer);
      // Cache the initial rect
      state.cachedChatRect = state.chatContainer.getBoundingClientRect();
    }

    // Use cached dimensions (will be updated on resize/container changes)
    const chatRect = state.cachedChatRect || state.chatContainer.getBoundingClientRect();
    
    // Verify chat is visible
    if (chatRect.width < CONFIG.MIN_AREA_SIZE || chatRect.height < CONFIG.MIN_AREA_SIZE) {
      if (CONFIG.DEBUG_MODE && state.totalClicks % 100 === 0) {
        console.log('[Duck Hunt] ⚠️  Chat area too small or hidden');
      }
      return;
    }

    // Generate random points
    const points = generateClickPoints(chatRect);
    
    // Click on each point
    for (const point of points) {
      clickAt(point.x, point.y);
    }
  }

  // Start the rapid clicker
  function startClicking() {
    if (state.isActive) return; // Already active
    
    console.log('[Duck Hunt] 🚀 Duck Hunt mode detected - Starting rapid clicker');
    
    state.isActive = true;

    // Find initial chat container
    state.chatContainer = findChatContainer();
    if (state.chatContainer) {
      console.log('[Duck Hunt] ✅ Chat container found');
    }

    // Start rapid clicking
    state.clickInterval = setInterval(rapidClickCycle, CONFIG.CLICK_INTERVAL);

    console.log('[Duck Hunt] ✅ Rapid clicker is now ACTIVE!');
    console.log('[Duck Hunt] 🔥 Clicking rapidly in empty chat spaces...');
  }

  // Stop the rapid clicker
  function stopClicking() {
    if (!state.isActive) return; // Already inactive
    
    console.log('[Duck Hunt] 🛑 Duck Hunt mode ended - Stopping rapid clicker');
    
    state.isActive = false;
    if (state.clickInterval) {
      clearInterval(state.clickInterval);
      state.clickInterval = null;
    }
    
    console.log('[Duck Hunt] ⏸️  Rapid clicker is now INACTIVE');
  }

  // Monitor duck hunt status
  function monitorDuckHuntStatus() {
    const isActive = isDuckHuntModeActive();
    
    if (isActive && !state.isDuckHuntActive) {
      // Duck hunt just became active
      state.isDuckHuntActive = true;
      startClicking();
    } else if (!isActive && state.isDuckHuntActive) {
      // Duck hunt just became inactive
      state.isDuckHuntActive = false;
      stopClicking();
    }
  }

  // Initialize the extension
  function initialize() {
    console.log('[Duck Hunt] 🦆 Extension loaded and monitoring...');
    console.log('[Duck Hunt] 🎯 Strategy: Click rapidly on empty spaces in chat to hit flying ducks');
    console.log('[Duck Hunt] 👀 Waiting for Duck Hunt mode to activate...');

    // Check duck hunt status periodically
    state.monitorInterval = setInterval(monitorDuckHuntStatus, CONFIG.DUCK_HUNT_CHECK_INTERVAL);

    // Also check on DOM changes for faster detection (throttled)
    const observer = new MutationObserver(() => {
      const now = Date.now();
      // Throttle to at most once per second to avoid excessive checks
      if (now - state.lastMonitorCheck >= 1000) {
        state.lastMonitorCheck = now;
        monitorDuckHuntStatus();
      }
      
      // Update chat container if needed
      if (state.isActive && (!state.chatContainer || !document.body.contains(state.chatContainer))) {
        state.chatContainer = findChatContainer();
        state.cachedChatRect = null; // Invalidate cache
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true // Watch for attribute changes too (classes might change)
    });

    // Update cache on window resize
    window.addEventListener('resize', () => {
      if (state.chatContainer) {
        state.cachedChatRect = state.chatContainer.getBoundingClientRect();
      }
    });

    // Status report
    state.statusInterval = setInterval(() => {
      if (state.isActive) {
        console.log(`[Duck Hunt] 📊 Status - Total clicks: ${state.totalClicks}`);
      } else {
        console.log('[Duck Hunt] 💤 Status - Waiting for Duck Hunt mode...');
      }
    }, 30000);

    // Cleanup
    window.addEventListener('beforeunload', () => {
      stopClicking();
      if (state.monitorInterval) clearInterval(state.monitorInterval);
      if (state.statusInterval) clearInterval(state.statusInterval);
      observer.disconnect();
      console.log('[Duck Hunt] 👋 Shutting down...');
    });

    // Do initial check
    monitorDuckHuntStatus();
  }

  // Wait a moment for page to load, then initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 1000));
  } else {
    setTimeout(initialize, 1000);
  }

})();
