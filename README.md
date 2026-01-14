# exply - Chrome Extension

A lightweight Chrome extension that provides context-aware explanations of highlighted text on any webpage using AI.

## Features

- **Context-aware explanations**: Understands text meaning in the specific context of the page
- **Low friction**: Simple highlight → click → explanation flow
- **Inline UI**: Explanation card appears near selected text
- **Optional follow-up**: One context-bound follow-up question per explanation
- **Privacy-first**: No data storage, no login required

## How It Works

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin: 2rem 0;">
  <div>
    <img src="logo.png" alt="Step 1: Highlight Text" style="width: 100%; max-width: 400px; border-radius: 8px;">
  </div>
  <div>
    <h3>1. Highlight Text</h3>
    <p>Select any text on any webpage (minimum 8 characters). The extension detects your selection automatically.</p>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin: 2rem 0;">
  <div>
    <h3>2. Click the Button</h3>
    <p>A floating "💡 Exply's Explanation" button appears near your selection. Click it to get an AI-powered explanation.</p>
  </div>
  <div>
    <img src="logo.png" alt="Step 2: Click Button" style="width: 100%; max-width: 400px; border-radius: 8px;">
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin: 2rem 0;">
  <div>
    <img src="logo.png" alt="Step 3: Get Explanation" style="width: 100%; max-width: 400px; border-radius: 8px;">
  </div>
  <div>
    <h3>3. Get Context-Aware Explanation</h3>
    <p>An inline explanation card appears with bullet points explaining what the text means in this specific context. Switch between "Explain", "Simplify", and "Implication" modes.</p>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin: 2rem 0;">
  <div>
    <h3>4. Ask Follow-Up (Optional)</h3>
    <p>Use the follow-up input to ask one clarifying question about the highlighted text. The response stays within the original context.</p>
  </div>
  <div>
    <img src="logo.png" alt="Step 4: Follow-Up" style="width: 100%; max-width: 400px; border-radius: 8px;">
  </div>
</div>

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

### 3. Configure Language (Optional)

The extension works out of the box, but you can customize your preferred language:

1. Right-click the extension icon → Options (or go to `chrome://extensions/` → click "Details" → "Extension options")
2. Select your preferred language from the dropdown
3. Save

This sets the language for both UI elements and AI responses.

**Note**: The API key is handled server-side by the backend. Users don't need to configure it.

## Usage

1. **Highlight text** on any webpage (minimum 8 characters)
2. **Click the "Exply's Explanation" button** that appears
3. **Read the explanation** in the inline card
4. **(Optional) Ask a follow-up question** using the input field below

The explanation focuses on what the text means *in this specific context*, not dictionary definitions.

## Technology Stack

### Extension (Frontend)
- **Chrome Extension Manifest V3** - Extension configuration and permissions
- **Vanilla JavaScript** - No frameworks, lightweight and fast
- **CSS3** - Custom styling for UI components
- **HTML5** - Options page interface
- **Chrome Storage API** - Local storage for user preferences (language selection)
- **Fetch API** - HTTP requests to backend
- **Content Scripts** - Injected into web pages for text selection and UI overlay

### Backend
- **Node.js** (>=18.0.0) - JavaScript runtime
- **Express.js** - Web framework for API server
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management
- **Google Gemini API** - AI model for text explanations
  - Model: `gemini-2.5-flash`
  - Endpoint: `v1beta/models/gemini-2.5-flash:generateContent`

### Deployment
- **Vercel** - Serverless backend hosting
- **GitHub** - Version control and repository

### APIs & Services
- **Google Gemini API** - AI text explanation service
- **Chrome Extensions API** - Browser extension platform

## Architecture

- `manifest.json`: Extension configuration
- `content.js`: Main logic for text selection, UI, and API calls
- `api.js`: Backend API communication module
- `options.html/js`: Extension settings page
- `styles.css`: Styling for floating button and explanation card
- `backend/server.js`: Express server handling Gemini API calls

## Constraints & Design Decisions

- **No chatbot**: One explanation + one optional follow-up only
- **No memory**: Each explanation is independent
- **Bounded context**: Only extracts text around selection (not full page scraping)
- **Inline UI**: No sidebar or popup window
- **Privacy-first**: No data storage, all processing is user-initiated

## Customization

### Change Backend URL

Edit `api.js`:
```javascript
const BACKEND_URL = 'https://exply.vercel.app'; // Change to your backend URL
```

### Adjust AI Model

Edit `backend/server.js`:
```javascript
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // Change model name
```

Or set the `GEMINI_MODEL` environment variable in your deployment platform (Vercel, Railway, etc.).

### Modify Minimum Selection Length

Edit `content.js`:
```javascript
const MIN_SELECTION_LENGTH = 8; // Change to desired minimum
```

## Troubleshooting

**Button doesn't appear:**
- Ensure you've selected at least 8 characters
- Check browser console for errors (`F12` → Console)

**API errors (500 Internal Server Error):**
- The backend server may be down or misconfigured
- Check backend health endpoint: `https://exply.vercel.app/health`
- Verify backend has `GEMINI_API_KEY` environment variable set
- Check Google Gemini API status and quota

**Explanation card appears off-screen:**
- Scroll to see it, or close and try selecting text in a different area

**Network errors:**
- Check your internet connection
- Verify backend URL in `api.js` is correct
- Check browser console for CORS or network errors

## Development

### Extension Development

The extension uses:
- Manifest V3
- Vanilla JavaScript (no frameworks)
- Chrome Storage API for user preferences
- Fetch API for HTTP requests to backend

To test extension changes:
1. Make edits to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

### Backend Development

The backend is a simple Express.js server that proxies requests to Google Gemini API.

To run backend locally:
```bash
cd backend
npm install
npm start  # or npm run dev for nodemon
```

Environment variables required:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `PORT` (optional, defaults to 3000)
- `GEMINI_MODEL` (optional, defaults to 'gemini-2.5-flash')

### Project Structure

```
BrowserAI/
├── manifest.json          # Extension configuration
├── content.js             # Main extension logic
├── api.js                 # Backend API client
├── options.html/js        # Extension settings page
├── styles.css             # UI styling
├── icons/                 # Extension icons
└── backend/
    ├── server.js          # Express backend server
    ├── package.json       # Backend dependencies
    └── vercel.json        # Vercel deployment config
```

## License

MIT
