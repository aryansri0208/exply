# How to Install exply Chrome Extension

## Option 1: Load as Unpacked Extension (For Development/Testing)

This is the easiest way to test your extension locally.

### Steps:

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Or: Menu (three dots) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to your extension folder: `/Users/aryansrivastava/Desktop/BrowserAI`
   - Click "Select" or "Open"

4. **Verify Installation**
   - You should see "exply" in your extensions list
   - The extension icon should appear in your Chrome toolbar

5. **Configure API Key**
   - Right-click the extension icon → Options
   - Enter your Google Gemini API key
   - Click "Save"

6. **Test the Extension**
   - Go to any webpage
   - Highlight some text (at least 8 characters)
   - Click the "💡 Exply's Explanation" button that appears
   - The explanation should appear in a card

## Option 2: Publish to Chrome Web Store (For Distribution)

If you want to share your extension with others, you can publish it to the Chrome Web Store.

### Prerequisites:
- Google account
- One-time $5 registration fee (for Chrome Web Store Developer account)
- ZIP file of your extension

### Steps:

1. **Prepare Your Extension**
   ```bash
   cd /Users/aryansrivastava/Desktop/BrowserAI
   zip -r exply-extension.zip . -x "*.git*" -x "*.DS_Store" -x "GITHUB_SETUP.md" -x "INSTALL_GUIDE.md"
   ```
   This creates a ZIP file excluding git files and documentation.

2. **Create Chrome Web Store Developer Account**
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay the one-time $5 registration fee
   - Accept the developer agreement

3. **Upload Your Extension**
   - Click "New Item" in the developer dashboard
   - Upload your `exply-extension.zip` file
   - Fill in the required information:
     - **Name**: exply
     - **Summary**: Get context-aware explanations of highlighted text using AI
     - **Description**: Detailed description of what your extension does
     - **Category**: Productivity or Education
     - **Language**: English
     - **Privacy Policy URL**: (Required) Create a privacy policy page
     - **Screenshots**: Take screenshots of your extension in action
     - **Icon**: Use your icon128.png

4. **Privacy Policy Requirements**
   Since your extension uses Chrome storage API, you need a privacy policy that explains:
   - What data is collected (API key stored locally)
   - How data is used (only sent to Google Gemini API)
   - Data storage (local only, not transmitted to third parties except Gemini)
   
   You can host a simple privacy policy on GitHub Pages or any free hosting service.

5. **Submit for Review**
   - Fill in all required fields
   - Click "Submit for review"
   - Review process typically takes 1-3 business days

6. **After Approval**
   - Your extension will be live on Chrome Web Store
   - Users can install it with one click
   - You can update it anytime by uploading a new ZIP file

## Important Notes for Chrome Web Store:

### Required Information:
- **Privacy Policy**: Must explain data collection and usage
- **Screenshots**: At least 1, recommended 5 (1280x800 or 640x400 pixels)
- **Detailed Description**: Explain features, how it works, use cases
- **Support URL**: Where users can get help (GitHub issues, email, etc.)

### Permissions Explanation:
Your `manifest.json` requests these permissions:
- `activeTab`: To access the current tab's content for text selection
- `storage`: To store API key and language preferences locally
- `host_permissions`: To make API calls to Google Gemini

You'll need to explain why each permission is needed in the store listing.

### Store Listing Best Practices:
- Clear, descriptive title and summary
- High-quality screenshots showing the extension in action
- Detailed description with use cases
- Support contact information
- Privacy policy URL

## Quick Test Checklist:

Before publishing, make sure:
- [ ] Extension works on multiple websites
- [ ] API key is properly stored and retrieved
- [ ] Error messages are user-friendly
- [ ] UI looks good and is responsive
- [ ] No console errors
- [ ] Works on both HTTP and HTTPS pages
- [ ] Privacy policy is created and accessible

## Troubleshooting:

**Extension doesn't load:**
- Check `manifest.json` for syntax errors
- Ensure all referenced files exist
- Check browser console for errors

**API key not saving:**
- Check Chrome storage permissions
- Verify options.js is working
- Check browser console for errors

**Extension not appearing:**
- Reload the extension in `chrome://extensions/`
- Check if extension is enabled
- Pin the extension to toolbar if needed

