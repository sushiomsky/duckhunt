# Installation Guide

## Quick Start

### 1. Install the Chrome Extension

1. Download or clone this repository
2. Open Google Chrome
3. Navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in the top right corner)
5. Click **Load unpacked**
6. Select the folder containing this extension (the folder with `manifest.json`)
7. The "DuckDice Duck Hunt Auto-Shooter" extension should now appear in your extensions list

### 2. Use the Extension

1. Navigate to [https://duckdice.io/bonuses/duck-hunt](https://duckdice.io/bonuses/duck-hunt)
2. Make sure the chat window is open (ducks only appear when chat is visible)
3. The extension will automatically detect and shoot ducks
4. Open the browser console (F12) to see activity logs

## Testing Locally

### Test Page

This repository includes a test page (`test-rapid-clicking.html`) to verify the extension works correctly:

1. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser and go to:
   ```
   http://localhost:8000/test-rapid-clicking.html
   ```

3. Click the "Spawn Duck" button to create test ducks
4. Watch the extension rapidly click in empty spaces within the chat area
5. Verify that ducks are being hit
6. Verify that chat elements (messages, avatars, hearts) are NOT being clicked
7. Check the console for logs

### Expected Behavior

The extension should:
- Find the chat container automatically
- Click rapidly (20 random points every 50ms) in empty spaces
- Avoid clicking on text, avatars, hearts, buttons, and links
- Successfully hit flying ducks without clicking on UI elements

### Expected Console Output

```
[Duck Hunt] 🦆 Extension loaded and initializing...
[Duck Hunt] 🚀 Starting rapid clicker with config: ...
[Duck Hunt] 📦 Chat container found: <div class="chat-container">
[Duck Hunt] ✅ Rapid clicker is now ACTIVE!
[Duck Hunt] 🔥 Clicking rapidly in empty chat spaces...
[Duck Hunt] 💥 Click #100 at (245, 387) on DIV
[Duck Hunt] 📊 Status - Total clicks: 1000
```

## Troubleshooting

### Extension Not Working

1. **Check if the extension is enabled**: Go to `chrome://extensions/` and make sure the extension is enabled
2. **Check permissions**: Ensure the extension has permission to access duckdice.io
3. **Check console**: Open browser console (F12) and look for any errors
4. **Reload the extension**: On `chrome://extensions/`, click the reload button for this extension
5. **Reload the page**: Refresh the duckdice.io page

### Ducks Not Being Hit

1. **Check if ducks are visible**: Ducks on duckdice.io only appear when the chat window is open
2. **Check console logs**: The extension logs its activity every 30 seconds
3. **Verify chat detection**: Check console for "Chat container found" message
4. **Test with test-rapid-clicking.html**: Use the included test page to verify basic functionality
5. **Check click rate**: The extension should be clicking very rapidly in the chat area

### Chat Elements Being Clicked

If the extension is clicking on unwanted elements:

1. **Check console warnings**: Look for "Chat element clicked" messages
2. **Verify avoidance logic**: The extension should skip text, images, buttons, and links
3. **Test with test page**: The test page tracks if chat elements are being clicked
4. **Report the issue**: Note which specific elements are being clicked for debugging

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "DuckDice Duck Hunt Auto-Shooter"
3. Click **Remove**
4. Confirm removal

## Notes

- This extension only works on duckdice.io
- Ducks appear randomly when the chat window is open
- Each successful duck shot awards approximately 0.00001 BTC
- The extension is for educational purposes only
- The extension clicks very rapidly (20 points every 50ms) in empty spaces
- Avoids clicking on text, avatars, hearts, buttons, and other UI elements

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Try the test page to verify basic functionality
3. Review the code in `content.js` to understand how detection works
4. Ensure you're using a recent version of Chrome (supports Manifest V3)

## Technical Details

- **Approach**: Rapid clicking on empty spaces in chat area
- **Click Interval**: 50ms (very fast)
- **Points per Cycle**: 20 random points
- **Chat Detection**: Multiple selector strategies with MutationObserver
- **Avoidance**: Smart filtering to prevent clicking on UI elements
- **Browser Support**: Chrome with Manifest V3 support
