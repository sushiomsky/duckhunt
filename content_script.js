// ===============================================
// === DUCK DICE AUTO HUNTER CONTENT SCRIPT    ===
// ===============================================

/**
 * DuckHunter - Automated duck catching for duckdice.io
 * 
 * This script hooks into the WebSocket connection to detect duck spawn events
 * and automatically sends catch requests to the API.
 */

(function() {
    'use strict';

    // ===============================================
    // === CONFIGURATION                          ===
    // ===============================================
    
    const CONFIG = {
        // Event name from WebSocket analysis
        DUCK_SPAWN_EVENT: 'App\\Game\\Events\\GameStarted',
        // API endpoint for catching ducks
        API_CATCH_URL: 'https://duckdice.io/api/duck-hunt/catch',
        // WebSocket channel to monitor
        CHANNEL: 'Production.Common',
        // Event types to handle
        EVENT_TYPES: {
            MULTIPLE_DUCK_HUNT: 'multiple_duck_hunt',
            SINGLE_DUCK_HUNT: 'duck_hunt'
        },
        // Logging prefix
        LOG_PREFIX: '[DUCK HUNTER]',
        // Enable debug logging
        DEBUG: false,
        // Enable auto-hunting
        ENABLED: true
    };

    // ===============================================
    // === STATISTICS TRACKING                    ===
    // ===============================================
    
    const stats = {
        ducksSpotted: 0,
        ducksShot: 0,
        successfulCatches: 0,
        failedCatches: 0,
        totalReactionTime: 0
    };

    // ===============================================
    // === LOGGING UTILITIES                      ===
    // ===============================================
    
    const Logger = {
        info: (message, ...args) => {
            console.log(`${CONFIG.LOG_PREFIX} ℹ️ ${message}`, ...args);
        },
        success: (message, ...args) => {
            console.log(`${CONFIG.LOG_PREFIX} ✅ ${message}`, ...args);
        },
        warn: (message, ...args) => {
            console.warn(`${CONFIG.LOG_PREFIX} ⚠️ ${message}`, ...args);
        },
        error: (message, ...args) => {
            console.error(`${CONFIG.LOG_PREFIX} ❌ ${message}`, ...args);
        },
        debug: (message, ...args) => {
            if (CONFIG.DEBUG) {
                console.debug(`${CONFIG.LOG_PREFIX} 🔍 ${message}`, ...args);
            }
        },
        duck: (message, ...args) => {
            console.log(`${CONFIG.LOG_PREFIX} 🦆 ${message}`, ...args);
        }
    };

    // ===============================================
    // === UTILITY FUNCTIONS                      ===
    // ===============================================
    
    /**
     * Validates a duck hash format
     * @param {string} hash - The hash to validate
     * @returns {boolean} Whether the hash is valid
     */
    function isValidHash(hash) {
        return typeof hash === 'string' && hash.length > 0;
    }

    /**
     * Safely parses JSON data
     * @param {string} data - JSON string to parse
     * @returns {Object|null} Parsed object or null on failure
     */
    function safeJsonParse(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    /**
     * Gets current statistics
     * @returns {Object} Statistics object
     */
    function getStats() {
        const avgReactionTime = stats.ducksShot > 0 
            ? (stats.totalReactionTime / stats.ducksShot).toFixed(2)
            : 0;
        
        return {
            ...stats,
            averageReactionTime: avgReactionTime,
            successRate: stats.ducksShot > 0 
                ? ((stats.successfulCatches / stats.ducksShot) * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    // ===============================================
    // === DUCK SHOOTING FUNCTION                 ===
    // ===============================================
    
    /**
     * Sends a POST request to catch a duck
     * @param {string} duckHash - The unique hash of the duck to catch
     * @returns {Promise<boolean>} Whether the catch was successful
     */
    async function shootDuck(duckHash) {
        if (!isValidHash(duckHash)) {
            Logger.error('Invalid duck hash provided');
            return false;
        }

        const startTime = performance.now();
        stats.ducksShot++;

        try {
            const response = await fetch(CONFIG.API_CATCH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Authentication headers (Cookie, x-fingerprint) are automatically
                    // sent by the browser since script runs in page context
                },
                body: JSON.stringify({ hash: duckHash }),
                credentials: 'include'
            });

            const endTime = performance.now();
            const reactionTime = (endTime - startTime).toFixed(2);
            stats.totalReactionTime += parseFloat(reactionTime);

            if (response.ok && response.status === 200) {
                const text = await response.text();
                
                if (text.trim() === '1') {
                    stats.successfulCatches++;
                    Logger.success(`SUCCESS! Hash: ${duckHash} | Time: ${reactionTime} ms`);
                    return true;
                } else {
                    stats.failedCatches++;
                    Logger.warn(`Sent, but unexpected response: ${text} | Time: ${reactionTime} ms`);
                    return false;
                }
            } else {
                stats.failedCatches++;
                Logger.error(`Failed to catch (Status: ${response.status}) | Time: ${reactionTime} ms`);
                return false;
            }
        } catch (error) {
            stats.failedCatches++;
            Logger.error(`POST request failed for ${duckHash}:`, error.message);
            return false;
        }
    }

    // ===============================================
    // === EVENT HANDLING                         ===
    // ===============================================
    
    /**
     * Processes a single duck from the event payload
     * @param {Object} duck - Duck object with hash property
     */
    function processSingleDuck(duck) {
        if (duck && duck.type === CONFIG.EVENT_TYPES.SINGLE_DUCK_HUNT && duck.hash) {
            stats.ducksSpotted++;
            Logger.duck(`Duck spotted! Hash: ${duck.hash}. Initiating catch...`);
            
            // Only shoot if enabled
            if (CONFIG.ENABLED) {
                shootDuck(duck.hash);
            } else {
                Logger.info('Auto-hunt disabled. Skipping catch.');
            }
        }
    }

    /**
     * Handles duck spawn events from WebSocket messages
     * @param {Object} messageData - The parsed WebSocket message
     */
    function handleDuckSpawn(messageData) {
        // Validate message structure
        if (!messageData || !messageData.payload || !Array.isArray(messageData.payload)) {
            Logger.debug('Invalid message structure');
            return;
        }

        // The actual payload is the third element in the 'payload' array
        const eventPayload = messageData.payload[2];

        if (!eventPayload) {
            Logger.debug('No event payload found');
            return;
        }

        // Handle multiple duck hunt event
        if (eventPayload.type === CONFIG.EVENT_TYPES.MULTIPLE_DUCK_HUNT && Array.isArray(eventPayload.children)) {
            const duckCount = eventPayload.children.length;
            
            if (duckCount > 0) {
                Logger.info(`Multiple ducks detected: ${duckCount}. Starting auto-catch...`);
                
                // Process all ducks in parallel
                eventPayload.children.forEach(processSingleDuck);
                
                Logger.debug('Current stats:', getStats());
            }
        }
        // Handle single duck hunt event
        else if (eventPayload.type === CONFIG.EVENT_TYPES.SINGLE_DUCK_HUNT) {
            processSingleDuck(eventPayload);
        }
    }

    /**
     * Processes incoming WebSocket messages
     * @param {MessageEvent} event - The WebSocket message event
     */
    function processWebSocketMessage(event) {
        const message = safeJsonParse(event.data);
        
        if (!message) {
            // Not a JSON message (e.g., ping)
            return;
        }

        // Check if it's a Pusher event on the correct channel
        if (message.type === 'event' && 
            message.channel === CONFIG.CHANNEL && 
            message.payload && 
            Array.isArray(message.payload) && 
            message.payload[0] === CONFIG.DUCK_SPAWN_EVENT) {
            
            Logger.debug('Duck spawn event detected');
            handleDuckSpawn(message);
        }
    }

    // ===============================================
    // === WEBSOCKET HOOKING                      ===
    // ===============================================
    
    /**
     * Hooks into the WebSocket connection to intercept messages
     */
    function hookWebSocket() {
        // Store the original WebSocket class
        const OriginalWebSocket = window.WebSocket;

        // Override the global WebSocket class
        window.WebSocket = function(url, protocols) {
            Logger.debug(`WebSocket connection initiated: ${url}`);
            
            // Create the actual WebSocket instance
            const ws = protocols !== undefined 
                ? new OriginalWebSocket(url, protocols)
                : new OriginalWebSocket(url);

            // Listen for incoming messages
            ws.addEventListener('message', processWebSocketMessage);

            // Log connection state changes in debug mode
            ws.addEventListener('open', () => {
                Logger.debug('WebSocket connection opened');
            });

            ws.addEventListener('close', (event) => {
                Logger.debug(`WebSocket connection closed: ${event.code} - ${event.reason}`);
            });

            ws.addEventListener('error', (error) => {
                Logger.debug('WebSocket error:', error);
            });

            return ws;
        };

        // Preserve WebSocket constants and prototype
        window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
        window.WebSocket.OPEN = OriginalWebSocket.OPEN;
        window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
        window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
        window.WebSocket.prototype = OriginalWebSocket.prototype;
    }

    // ===============================================
    // === CHROME MESSAGE HANDLING                ===
    // ===============================================
    
    /**
     * Handle messages from the popup
     */
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'GET_STATS') {
                sendResponse({ stats: getStats() });
            } else if (request.type === 'UPDATE_SETTINGS') {
                if (request.settings) {
                    CONFIG.ENABLED = request.settings.enabled !== false;
                    CONFIG.DEBUG = request.settings.debug === true;
                    Logger.info(`Settings updated - Enabled: ${CONFIG.ENABLED}, Debug: ${CONFIG.DEBUG}`);
                }
                sendResponse({ success: true });
            }
            return true; // Keep message channel open for async response
        });
    }

    // ===============================================
    // === GLOBAL API FOR DEBUGGING               ===
    // ===============================================
    
    // Expose API for debugging in console
    window.DuckHunter = {
        getStats,
        getConfig: () => ({ ...CONFIG }),
        enableDebug: () => { CONFIG.DEBUG = true; Logger.info('Debug mode enabled'); },
        disableDebug: () => { CONFIG.DEBUG = false; Logger.info('Debug mode disabled'); },
        enable: () => { CONFIG.ENABLED = true; Logger.info('Duck Hunter enabled'); },
        disable: () => { CONFIG.ENABLED = false; Logger.info('Duck Hunter disabled'); }
    };

    // ===============================================
    // === INITIALIZATION                         ===
    // ===============================================
    
    Logger.info('Script loaded. Hooking WebSocket connection...');
    hookWebSocket();
    Logger.success('Duck Hunter initialized. Happy hunting! 🎯');

})();