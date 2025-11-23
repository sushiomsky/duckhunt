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

This repository includes a test page (`test.html`) to verify the extension works correctly:

1. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser and go to:
   ```
   http://localhost:8000/test.html
   ```

3. Click the "Spawn Duck" buttons to create test ducks
4. Scroll the page and spawn ducks at different positions
5. Verify the extension detects and shoots ducks correctly
6. Check the console for logs

## Verifying the Bug Fix

The original issue was that ducks would appear to fly at the bottom of the page after scrolling. To verify this is fixed:

1. Open the test page (`test.html`)
2. Scroll down the page significantly
3. Click "Spawn Duck at Top", "Middle", or "Bottom"
4. Check the browser console logs
5. Verify the duck position is calculated correctly with scroll offset
6. The duck should be clicked successfully regardless of scroll position

### Expected Console Output

```
Duck Hunt Auto-Shooter loaded
Duck Hunt Auto-Shooter is now active!
Spawned duck #1 at position: top=100px, left=938px, scroll=500px
Found 1 duck(s)!
Shooting duck at position: x=938, y=100
Duck shot successfully!
```

## Troubleshooting

### Extension Not Working

1. **Check if the extension is enabled**: Go to `chrome://extensions/` and make sure the extension is enabled
2. **Check permissions**: Ensure the extension has permission to access duckdice.io
3. **Check console**: Open browser console (F12) and look for any errors
4. **Reload the extension**: On `chrome://extensions/`, click the reload button for this extension
5. **Reload the page**: Refresh the duckdice.io page

### Ducks Not Being Detected

1. **Check if ducks are visible**: Ducks on duckdice.io only appear when the chat window is open
2. **Check console logs**: The extension logs when it detects ducks
3. **Verify selectors**: The extension looks for elements with "duck" in their class/id names
4. **Test with test.html**: Use the included test page to verify basic functionality

### Position Issues

If ducks still appear at wrong positions:

1. **Clear browser cache**: Old cached JavaScript might interfere
2. **Check scroll position**: Open console and verify `window.scrollY` is being calculated correctly
3. **Test on test page**: The test page shows exact positions and scroll offsets
4. **Check console logs**: Look for position calculations in the logs

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
- Extension automatically clicks ducks within 100ms of detection

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Try the test page to verify basic functionality
3. Review the code in `content.js` to understand how detection works
4. Ensure you're using a recent version of Chrome (supports Manifest V3)

## Technical Details

- **Detection Method**: CSS selectors + MutationObserver
- **Detection Interval**: 100ms
- **Click Delay**: 50ms
- **Scroll Calculation**: Uses `window.scrollY/scrollX` with fallbacks
- **Browser Support**: Chrome with Manifest V3 support
