# Duckdice Auto Duck Hunter

A Chrome extension that automatically clicks on ducks in the Duckdice chat duckhunt feature.

## Features

- 🦆 Automatically detects ducks flying through the Duckdice chat
- ⚡ Instantly clicks on ducks when they appear
- 🔍 Uses MutationObserver for real-time detection
- 🎯 Multiple detection methods for reliability

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the directory containing this extension
6. Navigate to duckdice.io and the extension will automatically hunt ducks!

## How it Works

The extension uses a content script that:
- Monitors the page for elements with duck-related classes or IDs
- Watches for DOM changes using MutationObserver
- Automatically clicks detected duck elements
- Runs periodic scans as a backup detection method

## Files

- `manifest.json` - Chrome extension configuration
- `content.js` - Main script that detects and clicks ducks
- `icon*.png` - Extension icons

## Usage

Once installed, the extension will automatically activate on duckdice.io. Open the browser console (F12) to see duck hunting activity logs.
