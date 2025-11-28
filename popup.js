/**
 * Duck Hunter Popup Script
 * Handles the popup UI for the extension
 */

// DOM Elements
const elements = {
    ducksSpotted: document.getElementById('ducksSpotted'),
    successfulCatches: document.getElementById('successfulCatches'),
    successRate: document.getElementById('successRate'),
    avgTime: document.getElementById('avgTime'),
    enableToggle: document.getElementById('enableToggle'),
    debugToggle: document.getElementById('debugToggle')
};

// Default settings
const defaultSettings = {
    enabled: true,
    debug: false
};

// Interval reference for cleanup
let statsInterval = null;

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['duckHunterSettings']);
        const settings = result.duckHunterSettings || defaultSettings;
        
        elements.enableToggle.checked = settings.enabled;
        elements.debugToggle.checked = settings.debug;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
    try {
        const settings = {
            enabled: elements.enableToggle.checked,
            debug: elements.debugToggle.checked
        };
        
        await chrome.storage.local.set({ duckHunterSettings: settings });
        
        // Send message to content script to update settings
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('duckdice.io')) {
            chrome.tabs.sendMessage(tab.id, { 
                type: 'UPDATE_SETTINGS', 
                settings: settings 
            }, (response) => {
                // Check for runtime errors (e.g., content script not ready)
                if (chrome.runtime.lastError) {
                    console.warn('Could not update content script:', chrome.runtime.lastError.message);
                }
            });
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/**
 * Request stats from content script
 */
async function requestStats() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('duckdice.io')) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_STATS' }, (response) => {
                // Check for runtime errors (e.g., content script not ready)
                if (chrome.runtime.lastError) {
                    console.warn('Could not get stats:', chrome.runtime.lastError.message);
                    return;
                }
                if (response && response.stats) {
                    updateStatsDisplay(response.stats);
                }
            });
        }
    } catch (error) {
        console.error('Failed to request stats:', error);
    }
}

/**
 * Update the stats display in the popup
 * @param {Object} stats - Statistics object
 */
function updateStatsDisplay(stats) {
    elements.ducksSpotted.textContent = stats.ducksSpotted || 0;
    elements.successfulCatches.textContent = stats.successfulCatches || 0;
    elements.successRate.textContent = stats.successRate || '0%';
    elements.avgTime.textContent = `${stats.averageReactionTime || 0}ms`;
}

// Event listeners
elements.enableToggle.addEventListener('change', saveSettings);
elements.debugToggle.addEventListener('change', saveSettings);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    requestStats();
    
    // Refresh stats every 2 seconds while popup is open
    statsInterval = setInterval(requestStats, 2000);
});

// Clean up interval when popup closes
window.addEventListener('unload', () => {
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
});
