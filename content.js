// Duckdice Auto Duck Hunter
// Automatically clicks on ducks that fly through the chat

(function() {
  'use strict';

  console.log('Duck Hunter: Extension loaded');

  // Function to check if an element is a duck
  function isDuckElement(element) {
    // Check for duck-related classes, IDs, or attributes
    // Common patterns: duck, duckhunt, flying-duck, etc.
    if (!element || !element.classList) return false;
    
    const classList = Array.from(element.classList).join(' ').toLowerCase();
    const id = (element.id || '').toLowerCase();
    const className = (element.className || '').toString().toLowerCase();
    
    return classList.includes('duck') || 
           id.includes('duck') || 
           className.includes('duck') ||
           element.tagName === 'DUCK' ||
           (element.hasAttribute && (
             element.hasAttribute('data-duck') ||
             element.hasAttribute('duck')
           ));
  }

  // Function to click on a duck
  function clickDuck(duckElement) {
    console.log('Duck Hunter: Duck detected, attempting to click!', duckElement);
    
    try {
      // Try various click methods
      if (duckElement.click) {
        duckElement.click();
      }
      
      // Also dispatch mouse events to ensure proper handling
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      duckElement.dispatchEvent(clickEvent);
      
      console.log('Duck Hunter: Duck clicked successfully!');
    } catch (error) {
      console.error('Duck Hunter: Error clicking duck:', error);
    }
  }

  // Function to scan for existing ducks
  function scanForDucks() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (isDuckElement(element)) {
        clickDuck(element);
      }
    });
  }

  // Set up MutationObserver to watch for new ducks
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node itself is a duck
          if (isDuckElement(node)) {
            clickDuck(node);
          }
          
          // Check if any child elements are ducks
          if (node.querySelectorAll) {
            const ducks = Array.from(node.querySelectorAll('*')).filter(isDuckElement);
            ducks.forEach(duck => clickDuck(duck));
          }
        }
      });
      
      // Check if any existing elements became ducks (class changes)
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'class' || 
           mutation.attributeName === 'id' ||
           mutation.attributeName.includes('duck'))) {
        if (isDuckElement(mutation.target)) {
          clickDuck(mutation.target);
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'data-duck', 'duck']
  });

  // Initial scan for ducks that might already be present
  console.log('Duck Hunter: Starting initial scan...');
  scanForDucks();

  // Periodic scan as backup (every 500ms)
  setInterval(scanForDucks, 500);

  console.log('Duck Hunter: Monitoring for ducks...');
})();
