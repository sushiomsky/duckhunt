// DuckDice Duck Hunt Auto-Shooter
// Automatically clicks ducks that appear in the chat area

(function() {
  'use strict';

  console.log('[Duck Hunt] 🦆 Extension loaded and initializing...');

  // Configuration
  const CONFIG = {
    CHECK_INTERVAL: 100,        // Check every 100ms
    CLICK_COOLDOWN: 300,        // Minimum 300ms between clicks
    DEBUG_MODE: true            // Enable detailed logging
  };

  // State management
  const state = {
    clickedElements: new WeakSet(),
    lastClickTime: 0,
    totalClicks: 0,
    detectionLog: []
  };

  // Utility: Safe element check
  function isValidElement(el) {
    try {
      // Must not be a link
      if (el.tagName === 'A' || el.closest('a')) {
        return false;
      }

      // Must have valid bounding box
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }

      // Must be visible
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          parseFloat(style.opacity) < 0.1) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // Find all potential duck elements
  function findPotentialDucks() {
    const candidates = [];
    
    // Strategy 1: Find images with duck-related attributes
    document.querySelectorAll('img').forEach(img => {
      if (img.src && img.src.toLowerCase().includes('duck')) {
        candidates.push({ element: img, type: 'img-src-duck', priority: 10 });
      }
      if (img.alt && img.alt.toLowerCase().includes('duck')) {
        candidates.push({ element: img, type: 'img-alt-duck', priority: 9 });
      }
    });

    // Strategy 2: Find elements with duck-related classes or IDs
    ['duck', 'Duck', 'DUCK'].forEach(keyword => {
      document.querySelectorAll(`[class*="${keyword}"]:not(a)`).forEach(el => {
        candidates.push({ element: el, type: 'class-duck', priority: 8 });
      });
      document.querySelectorAll(`[id*="${keyword}"]:not(a)`).forEach(el => {
        candidates.push({ element: el, type: 'id-duck', priority: 8 });
      });
    });

    // Strategy 3: Find canvas elements (games often use canvas)
    document.querySelectorAll('canvas').forEach(canvas => {
      const style = window.getComputedStyle(canvas);
      // Look for positioned canvas elements (likely game elements)
      if (style.position === 'absolute' || style.position === 'fixed') {
        candidates.push({ element: canvas, type: 'canvas-positioned', priority: 7 });
      }
    });

    // Strategy 4: Find SVG elements with duck-like properties
    document.querySelectorAll('svg, svg *').forEach(svg => {
      const classes = svg.className.baseVal || svg.className || '';
      if (typeof classes === 'string' && classes.toLowerCase().includes('duck')) {
        candidates.push({ element: svg, type: 'svg-duck', priority: 9 });
      }
    });

    // Strategy 5: Find elements with data attributes
    document.querySelectorAll('[data-duck], [data-target], [data-clickable]').forEach(el => {
      candidates.push({ element: el, type: 'data-attribute', priority: 9 });
    });

    // Strategy 6: Look for clickable game elements (positioned divs/spans with cursor pointer)
    document.querySelectorAll('div, span').forEach(el => {
      const style = window.getComputedStyle(el);
      if ((style.position === 'absolute' || style.position === 'fixed') &&
          style.cursor === 'pointer' &&
          !el.querySelector('a')) {  // Don't contain links
        candidates.push({ element: el, type: 'positioned-clickable', priority: 6 });
      }
    });

    // Filter and validate
    const validCandidates = candidates.filter(c => {
      if (state.clickedElements.has(c.element)) {
        return false;
      }
      return isValidElement(c.element);
    });

    // Sort by priority (higher priority first)
    validCandidates.sort((a, b) => b.priority - a.priority);

    if (CONFIG.DEBUG_MODE && validCandidates.length > 0) {
      console.log(`[Duck Hunt] 🎯 Found ${validCandidates.length} potential targets:`, 
        validCandidates.map(c => `${c.type} (priority ${c.priority})`));
    }

    return validCandidates;
  }

  // Click on a duck element
  function shootDuck(candidate) {
    const { element, type } = candidate;
    const now = Date.now();

    // Enforce click cooldown
    if (now - state.lastClickTime < CONFIG.CLICK_COOLDOWN) {
      if (CONFIG.DEBUG_MODE) {
        console.log('[Duck Hunt] ⏳ Click cooldown active, waiting...');
      }
      return false;
    }

    try {
      // Mark as clicked
      state.clickedElements.add(element);
      state.lastClickTime = now;
      state.totalClicks++;

      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      console.log(`[Duck Hunt] 💥 SHOOTING! Click #${state.totalClicks}`);
      console.log(`[Duck Hunt] 📍 Type: ${type}, Tag: ${element.tagName}, Position: (${x.toFixed(0)}, ${y.toFixed(0)})`);
      console.log(`[Duck Hunt] 🏷️  Classes: "${element.className}", ID: "${element.id}"`);

      // Create comprehensive mouse events
      const eventOptions = {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      };

      // Dispatch full click sequence
      element.dispatchEvent(new MouseEvent('mouseenter', eventOptions));
      element.dispatchEvent(new MouseEvent('mouseover', eventOptions));
      element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
      element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
      element.dispatchEvent(new MouseEvent('click', eventOptions));

      // Also try direct click
      if (typeof element.click === 'function') {
        element.click();
      }

      // Try clicking on the point in the document
      const elementAtPoint = document.elementFromPoint(x, y);
      if (elementAtPoint && elementAtPoint !== element) {
        console.log('[Duck Hunt] 🎯 Also clicking element at point:', elementAtPoint.tagName);
        elementAtPoint.dispatchEvent(new MouseEvent('click', eventOptions));
      }

      console.log('[Duck Hunt] ✅ Shot fired successfully!');
      return true;

    } catch (error) {
      console.error('[Duck Hunt] ❌ Error shooting duck:', error);
      return false;
    }
  }

  // Main detection and shooting function
  function scanAndShoot() {
    const targets = findPotentialDucks();
    
    if (targets.length > 0) {
      // Shoot the highest priority target
      const target = targets[0];
      shootDuck(target);
    }
  }

  // Start the auto-shooter
  function start() {
    console.log('[Duck Hunt] 🚀 Starting auto-shooter with config:', CONFIG);
    
    // Periodic scanning
    const scanInterval = setInterval(scanAndShoot, CONFIG.CHECK_INTERVAL);

    // MutationObserver for immediate detection
    const observer = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasNewNodes) {
        scanAndShoot();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Status report
    setInterval(() => {
      console.log(`[Duck Hunt] 📊 Status - Total shots fired: ${state.totalClicks}`);
    }, 30000);

    // Cleanup
    window.addEventListener('beforeunload', () => {
      clearInterval(scanInterval);
      observer.disconnect();
      console.log('[Duck Hunt] 👋 Shutting down...');
    });

    console.log('[Duck Hunt] ✅ Auto-shooter is now ACTIVE!');
    console.log('[Duck Hunt] 👀 Watching for ducks in the chat area...');
  }

  // Wait a moment for page to load, then start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 500));
  } else {
    setTimeout(start, 500);
  }

})();
