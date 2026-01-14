# exply - Chrome Extension

A lightweight Chrome extension that provides context-aware explanations of highlighted text on any webpage using AI.

## Features

- **Context-aware explanations**: Understands text meaning in the specific context of the page
- **Low friction**: Simple highlight → click → explanation flow
- **Inline UI**: Explanation card appears near selected text
- **Optional follow-up**: One context-bound follow-up question per explanation
- **Privacy-first**: No data storage, no login required

## Setup

### 1. Create Extension Icons (Optional but Recommended)

The extension requires icon files. Create three PNG files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can:
- Use any image editor to create simple icons
- Use online tools like [Favicon Generator](https://realfavicongenerator.net/)
- Create solid color squares with "AI" text as placeholders

The extension will work without icons, but Chrome will show warnings.

### 2. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this directory (`BrowserAI`)

### 3. Configure API Key

The extension requires a Google Gemini API key to function.

**Option A: Set via Chrome Storage (Recommended)**

1. Right-click the extension icon → Options (or go to `chrome://extensions/` → click "Details" → "Extension options")
2. Enter your Google Gemini API key
3. Save

**Option B: Hardcode (Development only)**

Edit `content.js` and replace the API key loading logic (not recommended for production).

### 4. Get Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste it into the extension options

**Note**: API usage is free for reasonable usage, but Google may have rate limits. Monitor your usage on the Google AI Studio dashboard.

## Usage

1. **Highlight text** on any webpage (minimum 8 characters)
2. **Click the "Exply's Explanation" button** that appears
3. **Read the explanation** in the inline card
4. **(Optional) Ask a follow-up question** using the input field below

The explanation focuses on what the text means *in this specific context*, not dictionary definitions.

## Architecture

- `manifest.json`: Extension configuration
- `content.js`: Main logic for text selection, UI, and API calls
- `styles.css`: Styling for floating button and explanation card

## Constraints & Design Decisions

- **No chatbot**: One explanation + one optional follow-up only
- **No memory**: Each explanation is independent
- **Bounded context**: Only extracts text around selection (not full page scraping)
- **Inline UI**: No sidebar or popup window
- **Privacy-first**: No data storage, all processing is user-initiated

## Customization

### Change API Endpoint

Edit `content.js`:
```javascript
const GEMINI_MODEL = 'gemini-pro'; // Change model name here
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
```

### Adjust Model

Edit the model constant in `content.js`:
```javascript
const GEMINI_MODEL = 'gemini-pro'; // Change to gemini-pro-vision, etc.
```

### Modify Minimum Selection Length

Edit `content.js`:
```javascript
const MIN_SELECTION_LENGTH = 8; // Change to desired minimum
```

## Troubleshooting

**Button doesn't appear:**
- Ensure you've selected at least 8 characters
- Check browser console for errors (`F12` → Console)

**API errors:**
- Verify your API key is set correctly
- Check Google Gemini API status
- Ensure you have API quota (check Google AI Studio)

**Explanation card appears off-screen:**
- Scroll to see it, or close and try selecting text in a different area

## Development

The extension uses:
- Manifest V3
- Vanilla JavaScript (no frameworks)
- Chrome Storage API for API key
- Fetch API for HTTP requests

To test changes:
1. Make edits to files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

## License

MIT
