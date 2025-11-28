# DuckDice Auto Hunter 🦆🎯

A Chrome extension that automatically catches ducks on [DuckDice.io](https://duckdice.io) using real-time WebSocket monitoring.

## Features

- **🚀 Instant Detection**: Hooks into the WebSocket connection to detect duck spawn events in real-time
- **⚡ Fast Response**: Automatically sends catch requests with minimal latency
- **📊 Statistics Tracking**: Monitor your catches, success rate, and average reaction time
- **🔧 Configurable**: Enable/disable auto-hunting and debug mode via popup
- **🔍 Debug Mode**: Optional debug logging for troubleshooting

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. Navigate to [DuckDice.io](https://duckdice.io) and log in
6. The extension will automatically start catching ducks!

## Usage

### Popup Interface

Click the extension icon in your browser toolbar to:
- View your hunting statistics
- Toggle auto-hunting on/off
- Enable/disable debug mode

### Console API

For advanced users, you can access the Duck Hunter API in the browser console:

```javascript
// Get current statistics
DuckHunter.getStats();

// View current configuration
DuckHunter.getConfig();

// Enable/disable debug mode
DuckHunter.enableDebug();
DuckHunter.disableDebug();

// Enable/disable auto-hunting
DuckHunter.enable();
DuckHunter.disable();
```

## How It Works

1. **WebSocket Hooking**: The extension hooks into the browser's WebSocket API to intercept messages from DuckDice
2. **Event Detection**: It monitors the `Production.Common` channel for `GameStarted` events containing duck spawn data
3. **Auto-Catch**: When a duck is detected, it automatically sends a POST request to the catch API with the duck's hash
4. **Statistics**: All catches are tracked and statistics are updated in real-time

## Project Structure

```
duckhunt/
├── manifest.json      # Chrome extension manifest (v3)
├── content_script.js  # Main script - WebSocket hooking and duck catching
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── icon16.png         # 16x16 extension icon
├── icon48.png         # 48x48 extension icon
├── icon128.png        # 128x128 extension icon
└── README.md          # This file
```

## Requirements

- Google Chrome (or Chromium-based browser)
- Active DuckDice.io account
- Must be logged in for catches to count

## Privacy & Security

- This extension only runs on `duckdice.io`
- No data is collected or sent to third parties
- All communication is directly with DuckDice servers
- Source code is open and auditable

## Disclaimer

This extension is provided for educational purposes. Use at your own risk and in accordance with DuckDice's terms of service.

## License

MIT License - See LICENSE file for details
