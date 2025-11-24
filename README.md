# DuckDice Duck Hunt Auto-Shooter v2.0

An intelligent Chrome extension that automatically detects and shoots ducks in the DuckDice Duck Hunt bonus game using advanced DOM monitoring and targeted clicking.

## Features

- **Intelligent Duck Detection** - Actively searches for and identifies duck elements in the DOM
- **Direct Duck Targeting** - Clicks directly on detected duck elements for higher accuracy
- **Automatic activation** - Only activates when Duck Hunt mode is active on the site
- **Dual Strategy Approach**:
  1. Primary: Detects duck elements (canvas, images) and clicks them directly
  2. Fallback: Rapid clicking on empty spaces when ducks not detected
- Intelligently avoids clicking on text, avatars, hearts, and other UI elements
- High-speed operation (checks for ducks every 100ms, clicks every 30ms)
- Real-time duck tracking and hit counting
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

The extension uses an intelligent dual-strategy approach:

### Primary Strategy: Direct Duck Detection
1. **Monitors for Duck Hunt mode** - Continuously checks if Duck Hunt is active (every 500ms)
2. **Active Duck Scanning** - Searches the DOM for duck elements every 100ms using multiple selectors:
   - Canvas elements with absolute/fixed positioning
   - Images with "duck" in src or alt text
   - Elements with "duck" in class names or IDs
3. **Duck Element Validation** - Verifies potential ducks by checking:
   - Visibility (not hidden, has dimensions)
   - Position (absolutely or fixed positioned)
   - Size (reasonable duck dimensions: 20-300px)
   - Viewport presence (within or near viewport)
4. **Direct Targeting** - Clicks detected duck elements at their center point
5. **Hit Tracking** - Tracks which ducks have been clicked to avoid duplicates

### Fallback Strategy: Rapid Area Clicking
If no duck elements are detected, the extension falls back to:
1. **Locates the chat area** - Finds the chat container using multiple detection strategies
2. **Generates random click points** - Creates 20 random coordinates within the chat area
3. **Filters safe click zones** - Avoids clicking on:
   - Text content and messages
   - Avatars and images (except potential ducks)
   - Hearts and reaction icons
   - Links and buttons
   - Other clickable UI elements
4. **Rapid clicking** - Clicks on safe empty spaces every 30ms

### Additional Features
- **Auto-activation** - Starts only when Duck Hunt mode is detected
- **Real-time statistics** - Tracks ducks hit and total clicks
- **Auto-deactivation** - Stops when Duck Hunt mode ends

This hybrid approach provides both precision (when ducks are detectable) and coverage (when they're not), making it more effective than pure rapid-clicking or pure detection approaches.

## Usage

1. Navigate to https://duckdice.io/bonuses/duck-hunt
2. Activate Duck Hunt mode on the site
3. The extension will automatically detect when Duck Hunt is active and start clicking
4. When Duck Hunt mode ends, the extension will automatically stop clicking
5. Check the browser console for activity logs (shows when it activates/deactivates)

## Technical Details

- **Version:** 2.0.0
- **Manifest Version:** 3
- **Permissions:** activeTab, duckdice.io host permissions
- **Duck Hunt Detection:** Checks every 500ms
- **Duck Element Scanning:** Every 100ms when active
- **Fallback Click Interval:** 30ms (very fast)
- **Points per Cycle (Fallback):** 20 random points
- **Duck Element Selectors:** Canvas, images, positioned elements with "duck" identifiers
- **Avoidance:** Smart filtering to prevent clicking on UI elements
- **Tracking:** Maintains hit count and prevents duplicate clicks on same duck

## Notes

- This extension is for educational purposes
- Ducks on duckdice.io appear randomly when the chat is open
- Each successful duck shot awards approximately 0.00001 BTC

## License

MIT License - Feel free to modify and distribute
