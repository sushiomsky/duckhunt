# DuckDice Duck Hunt Auto-Shooter

A Chrome extension that automatically shoots ducks in the DuckDice Duck Hunt bonus game by rapidly clicking on empty spaces in the chat area.

## Features

- **Automatic activation** - Only clicks when Duck Hunt mode is active on the site
- Rapidly clicks empty spaces in the chat area to hit flying ducks
- Intelligently avoids clicking on text, avatars, hearts, and other UI elements
- High-speed clicking (20 clicks per cycle, every 50ms)
- Automatically detects and adapts to the chat container
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

The extension uses a rapid-clicking approach to catch flying ducks:

1. **Monitors for Duck Hunt mode** - Continuously checks if Duck Hunt is active on the site
2. **Auto-activates** - Starts clicking only when Duck Hunt mode is detected
3. **Locates the chat area** - Finds the chat container on duckdice.io using multiple detection strategies
4. **Generates random click points** - Creates 20 random coordinates within the chat area
5. **Filters safe click zones** - Avoids clicking on:
   - Text content and messages
   - Avatars and images
   - Hearts and reaction icons
   - Links and buttons
   - Other clickable UI elements
6. **Rapid clicking** - Clicks on safe empty spaces every 50ms
7. **Hits the duck** - Eventually hits the flying duck as it moves through the click zone
8. **Auto-deactivates** - Stops clicking when Duck Hunt mode ends

This approach is more reliable than trying to detect the duck element directly, as it doesn't depend on specific HTML structure or class names.

## Usage

1. Navigate to https://duckdice.io/bonuses/duck-hunt
2. Activate Duck Hunt mode on the site
3. The extension will automatically detect when Duck Hunt is active and start clicking
4. When Duck Hunt mode ends, the extension will automatically stop clicking
5. Check the browser console for activity logs (shows when it activates/deactivates)

## Technical Details

- **Manifest Version:** 3
- **Permissions:** activeTab, duckdice.io host permissions
- **Activation:** Automatic detection of Duck Hunt mode (checks every 1 second)
- **Click Interval:** 50ms (very fast clicking when active)
- **Points per Cycle:** 20 random points
- **Avoidance:** Smart filtering to prevent clicking on UI elements

## Notes

- This extension is for educational purposes
- Ducks on duckdice.io appear randomly when the chat is open
- Each successful duck shot awards approximately 0.00001 BTC

## License

MIT License - Feel free to modify and distribute
