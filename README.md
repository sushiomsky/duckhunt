# DuckDice Duck Hunt Auto-Shooter

A Chrome extension that automatically detects and shoots ducks in the DuckDice Duck Hunt bonus game.

## Features

- Automatically detects ducks appearing on duckdice.io
- Auto-clicks ducks for instant rewards
- Fixed positioning issue where ducks would fly at the bottom of the page after scrolling
- Lightweight and efficient detection using MutationObserver
- Works with dynamic content loading

## Installation

### Installing from Source

1. Clone this repository or download the ZIP
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension should now be active on duckdice.io

## How It Works

The extension injects a content script into duckdice.io pages that:

1. Continuously scans for duck elements using multiple selectors
2. Calculates the absolute position of ducks accounting for page scroll
3. Automatically clicks on detected ducks
4. Uses MutationObserver to catch dynamically added ducks

## Bug Fix

### Issue: Ducks Flying at Bottom of Page

**Problem:** After scrolling the page, ducks would appear to fly at the bottom of the viewport instead of their correct positions.

**Root Cause:** The click coordinate calculation was using viewport-relative coordinates without accounting for scroll position.

**Solution:** The `getAbsolutePosition()` function now properly calculates both:
- Absolute coordinates (including scroll offset) for accurate positioning
- Viewport-relative coordinates for click events

This ensures ducks are detected and clicked correctly regardless of page scroll position.

## Usage

1. Navigate to https://duckdice.io/bonuses/duck-hunt
2. Ensure the chat window is open (ducks only appear when chat is visible)
3. The extension will automatically detect and shoot ducks
4. Check the browser console for activity logs

## Technical Details

- **Manifest Version:** 3
- **Permissions:** activeTab, duckdice.io host permissions
- **Detection Interval:** 100ms
- **Click Delay:** 50ms (to simulate human behavior)

## Notes

- This extension is for educational purposes
- Ducks on duckdice.io appear randomly when the chat is open
- Each successful duck shot awards approximately 0.00001 BTC

## License

MIT License - Feel free to modify and distribute
