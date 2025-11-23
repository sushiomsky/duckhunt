// DuckDice Duck Hunt Auto-Shooter
// Automatically detects and clicks on ducks that appear on duckdice.io

(function() {
  'use strict';

  console.log('DuckDice Duck Hunt Auto-Shooter loaded');

  // Configuration
  const CHECK_INTERVAL = 100; // Check for ducks every 100ms
  const CLICK_DELAY = 50; // Small delay before clicking to simulate human behavior

  // Function to find duck elements
  function findDucks() {
    // Ducks on duckdice.io are typically canvas elements or divs with specific classes
    // We need to find elements that represent ducks
    const possibleSelectors = [
      '[class*="duck"]',
      '[id*="duck"]',
      'canvas[class*="duck"]',
      'div[class*="duck"]',
      'img[src*="duck"]',
      '[class*="bonus"]',
      '[class*="hunt"]'
    ];

    const ducks = [];
    
    for (const selector of possibleSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Check if element is visible and not already processed
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && 
              style.visibility !== 'hidden' && 
              style.opacity !== '0' &&
              !el.dataset.duckShot) {
            ducks.push(el);
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    }

    return ducks;
  }

  // Function to get element's absolute position
  // This fixes the issue where ducks appear at bottom of page
  function getAbsolutePosition(element) {
    const rect = element.getBoundingClientRect();
    
    // CRITICAL FIX: Add scroll position to get absolute coordinates
    // Previously this might have been using only viewport-relative coordinates
    // which would cause ducks to appear at wrong positions as page scrolls
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      bottom: rect.bottom + scrollTop,
      right: rect.right + scrollLeft,
      width: rect.width,
      height: rect.height,
      // Viewport-relative coordinates for click events
      viewportTop: rect.top,
      viewportLeft: rect.left,
      // Center point for clicking
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    };
  }

  // Function to click on a duck
  function shootDuck(duck) {
    try {
      const pos = getAbsolutePosition(duck);
      
      // Mark as shot to avoid double-clicking
      duck.dataset.duckShot = 'true';
      
      console.log(`Shooting duck at position: x=${pos.centerX}, y=${pos.centerY}`);
      
      // Create and dispatch click events at the center of the duck
      // Using viewport-relative coordinates for the click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: pos.centerX,
        clientY: pos.centerY,
        screenX: pos.centerX,
        screenY: pos.centerY
      });
      
      // Try multiple click approaches to ensure compatibility
      duck.click();
      duck.dispatchEvent(clickEvent);
      
      // Also try clicking on parent if duck is inside a clickable container
      if (duck.parentElement) {
        duck.parentElement.dispatchEvent(clickEvent);
      }
      
      console.log('Duck shot successfully!');
    } catch (error) {
      console.error('Error shooting duck:', error);
    }
  }

  // Main detection loop
  function checkForDucks() {
    const ducks = findDucks();
    
    if (ducks.length > 0) {
      console.log(`Found ${ducks.length} duck(s)!`);
      
      ducks.forEach(duck => {
        // Add a small delay to make it more natural
        setTimeout(() => {
          shootDuck(duck);
        }, CLICK_DELAY);
      });
    }
  }

  // Start checking for ducks
  const duckCheckInterval = setInterval(checkForDucks, CHECK_INTERVAL);

  // Also observe DOM changes for dynamically added ducks
  const observer = new MutationObserver((mutations) => {
    // Check for new ducks when relevant DOM changes occur
    // Filter to only check when nodes are added or attributes change
    const relevantChange = mutations.some(mutation => 
      mutation.type === 'childList' && mutation.addedNodes.length > 0 ||
      mutation.type === 'attributes'
    );
    
    if (relevantChange) {
      checkForDucks();
    }
  });

  // Start observing - observe body but filter mutations to reduce overhead
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(duckCheckInterval);
    observer.disconnect();
  });

  // Initial check
  checkForDucks();

  console.log('Duck Hunt Auto-Shooter is now active!');
})();
