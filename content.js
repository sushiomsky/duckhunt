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
    CHAT_SELECTORS: [            // Possible selectors for the chat container
      '[class*="chat"]',
      '[id*="chat"]',
      '[class*="Chat"]',
      '[id*="Chat"]',
      '[class*="message"]',
      '[class*="Message"]'
    ]
  };

  // State management
  const state = {
    totalClicks: 0,
    chatContainer: null,
    cachedChatRect: null,
    isActive: false
  };

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
  function start() {
    console.log('[Duck Hunt] 🚀 Starting rapid clicker with config:', CONFIG);
    console.log('[Duck Hunt] 🎯 Strategy: Click rapidly on empty spaces in chat to hit flying ducks');
    
    state.isActive = true;

    // Find initial chat container
    state.chatContainer = findChatContainer();
    if (state.chatContainer) {
      console.log('[Duck Hunt] ✅ Initial chat container found');
    }

    // Start rapid clicking
    const clickInterval = setInterval(rapidClickCycle, CONFIG.CLICK_INTERVAL);

    // Monitor for chat container changes
    const observer = new MutationObserver(() => {
      if (!state.chatContainer || !document.body.contains(state.chatContainer)) {
        state.chatContainer = findChatContainer();
        state.cachedChatRect = null; // Invalidate cache
      }
    });

    // Update cache on window resize
    window.addEventListener('resize', () => {
      if (state.chatContainer) {
        state.cachedChatRect = state.chatContainer.getBoundingClientRect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Status report
    setInterval(() => {
      console.log(`[Duck Hunt] 📊 Status - Total clicks: ${state.totalClicks}`);
    }, 30000);

    // Cleanup
    window.addEventListener('beforeunload', () => {
      state.isActive = false;
      clearInterval(clickInterval);
      observer.disconnect();
      console.log('[Duck Hunt] 👋 Shutting down...');
    });

    console.log('[Duck Hunt] ✅ Rapid clicker is now ACTIVE!');
    console.log('[Duck Hunt] 🔥 Clicking rapidly in empty chat spaces...');
  }

  // Wait a moment for page to load, then start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 1000));
  } else {
    setTimeout(start, 1000);
  }

})();
