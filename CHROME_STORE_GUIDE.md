# Publishing exply to Chrome Web Store - Complete Guide

## Prerequisites

1. **Google Account** (Gmail account)
2. **$5 One-time Registration Fee** (paid via Google Pay)
3. **Privacy Policy URL** (required - can be hosted on GitHub Pages for free)
4. **Screenshots** (at least 1, recommended 5)

## Step 1: Prepare Your Extension Package

### Create ZIP File (Exclude unnecessary files)

```bash
cd /Users/aryansrivastava/Desktop/BrowserAI

# Create ZIP excluding backend, git files, and docs
zip -r exply-extension.zip . \
  -x "*.git*" \
  -x "backend/*" \
  -x "node_modules/*" \
  -x "*.DS_Store" \
  -x "*.md" \
  -x "*.log" \
  -x ".env*"
```

**Files to include:**
- ✅ `manifest.json`
- ✅ `api.js`
- ✅ `content.js`
- ✅ `options.html`
- ✅ `options.js`
- ✅ `styles.css`
- ✅ `icon16.png`, `icon48.png`, `icon128.png`
- ✅ `logo.png` (if used)

**Files to exclude:**
- ❌ `backend/` folder (not needed in extension)
- ❌ `.git/` folder
- ❌ Documentation files (`.md`)
- ❌ `.env` files
- ❌ `node_modules/`

## Step 2: Create Privacy Policy

Since your extension uses `chrome.storage` API, you **must** provide a privacy policy.

### Option A: GitHub Pages (Free & Easy)

1. **Create a new file** `PRIVACY_POLICY.md` in your GitHub repo
2. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Select branch: `main`
   - Select folder: `/root`
   - Save
3. **Your privacy policy URL**: `https://yourusername.github.io/BrowserAI/PRIVACY_POLICY.md`

### Option B: Simple HTML Page

Create a simple HTML page and host it anywhere (GitHub Pages, Netlify, etc.)

### Privacy Policy Template

```markdown
# exply Privacy Policy

**Last Updated:** [Date]

## Data Collection

exply does NOT collect, store, or transmit any personal data.

## Local Storage

exply uses Chrome's local storage API to store:
- Your selected UI language preference
- This data is stored locally on your device only
- This data is never transmitted to any server

## API Usage

When you use exply to explain text:
- The highlighted text and surrounding context are sent to our backend server
- Our backend server processes the request using Google's Gemini API
- No data is stored or logged
- No personal information is collected

## Third-Party Services

exply uses:
- **Google Gemini API**: For generating explanations (via our backend)
- No other third-party services are used

## Data Sharing

We do NOT share, sell, or distribute any user data.

## Contact

For privacy concerns, contact: [your-email@example.com]
```

## Step 3: Take Screenshots

You need at least **1 screenshot**, but **5 is recommended** (1280x800 or 640x400 pixels).

**Screenshot ideas:**
1. Extension icon in toolbar
2. Text highlighted with floating button visible
3. Explanation card showing "Explain" mode
4. Explanation card showing "Simplify" mode
5. Explanation card showing "Implication" mode
6. Options page

**How to take screenshots:**
- Use Chrome's built-in screenshot tool or a screen capture app
- Make sure screenshots are clear and show the extension working
- Crop to recommended dimensions

## Step 4: Register as Chrome Web Store Developer

1. **Go to Developer Dashboard**:
   - Visit: https://chrome.google.com/webstore/devconsole
   - Sign in with your Google account

2. **Pay Registration Fee**:
   - Click "Pay Registration Fee" ($5 one-time)
   - Complete payment via Google Pay
   - Accept Developer Agreement

3. **Verify Account**:
   - You may need to verify your identity
   - Follow the prompts

## Step 5: Upload Your Extension

1. **Click "New Item"** in the developer dashboard

2. **Upload ZIP File**:
   - Click "Choose file"
   - Select `exply-extension.zip`
   - Wait for upload to complete

3. **Fill in Store Listing**:

   **Basic Information:**
   - **Name**: `exply`
   - **Summary** (132 chars max): 
     ```
     Get instant AI-powered explanations of any highlighted text on any webpage. Understand complex content with context-aware insights.
     ```
   
   **Detailed Description** (recommended 2000+ chars):
   ```
   exply is an intelligent browser extension that helps you understand any text you encounter online. Simply highlight text on any webpage, and exply provides instant, context-aware explanations powered by AI.

   Features:
   • Instant Explanations: Highlight any text (8+ characters) and get AI-powered explanations
   • Context-Aware: Understands text in the context of the webpage, not just dictionary definitions
   • Multiple Modes:
     - Explain: Detailed explanations of what the text means in context
     - Simplify: Plain-language explanations for easy understanding
     - Implication: Understand why the text matters and what it suggests
   • Multi-Language Support: Get explanations in 12 languages (English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Russian, Arabic, Hindi)
   • Follow-up Questions: Ask clarifying questions to deepen your understanding
   • Privacy-First: No data storage, no login required, user-initiated only
   • Works Everywhere: Compatible with all websites, PDFs, Google Docs, and more

   How It Works:
   1. Highlight any text on any webpage
   2. Click the "💡 Exply's Explanation" button that appears
   3. Get instant, context-aware explanations
   4. Switch between Explain, Simplify, and Implication modes
   5. Ask follow-up questions for deeper understanding

   Perfect For:
   • Students reading academic papers
   • Professionals understanding technical documents
   • Language learners reading foreign content
   • Anyone who wants to understand complex text quickly

   Privacy & Security:
   • No user data is collected or stored
   • No login or account required
   • All processing happens securely via our backend
   • Your highlighted text is only used for generating explanations

   Get started instantly - no setup required!
   ```

   **Category**: Select **Productivity** or **Education**

   **Language**: English (and any others you support)

   **Privacy Policy URL**: `https://your-privacy-policy-url.com`

   **Support URL** (optional but recommended): Your GitHub repo issues page

4. **Upload Assets**:
   - **Icon**: Upload `icon128.png`
   - **Screenshots**: Upload 1-5 screenshots (1280x800 or 640x400)
   - **Promotional Images** (optional): For featured placement

5. **Permissions Justification**:
   Explain why you need each permission:
   - **activeTab**: "To access the current webpage's content for text selection and context extraction"
   - **storage**: "To store user's language preference locally on their device"
   - **host_permissions**: "To make API calls to our backend server for generating explanations"

## Step 6: Submit for Review

1. **Review Checklist**:
   - ✅ All required fields filled
   - ✅ Privacy policy URL is accessible
   - ✅ Screenshots uploaded
   - ✅ ZIP file uploaded successfully
   - ✅ Permissions explained

2. **Click "Submit for Review"**

3. **Wait for Review**:
   - Initial review: **1-3 business days**
   - You'll receive email notifications about status
   - Check dashboard for updates

## Step 7: After Approval

1. **Extension Goes Live**:
   - Your extension will be available on Chrome Web Store
   - Users can install with one click
   - You'll get a public store URL

2. **Share Your Extension**:
   - Share the Chrome Web Store link
   - Users can install directly from the store

3. **Monitor & Update**:
   - Check user reviews and ratings
   - Fix bugs and release updates
   - Upload new ZIP files to update the extension

## Updating Your Extension

1. **Make Changes**:
   - Update version in `manifest.json`: `"version": "1.0.1"`
   - Create new ZIP file
   - Test thoroughly

2. **Upload Update**:
   - Go to developer dashboard
   - Click on your extension
   - Click "Upload new package"
   - Upload new ZIP
   - Submit for review (updates review faster, usually same day)

## Common Issues & Solutions

**Rejection Reasons:**
- ❌ Missing privacy policy → Create and link one
- ❌ Permissions not justified → Add detailed explanations
- ❌ Poor screenshots → Use clear, high-quality images
- ❌ Vague description → Be specific about features
- ❌ Extension doesn't work → Test thoroughly before submitting

**Review Delays:**
- First submission takes longest (1-3 days)
- Updates are usually faster (same day)
- Complex extensions may take longer

## Tips for Success

1. **Clear Description**: Be specific about what your extension does
2. **Good Screenshots**: Show the extension in action
3. **Privacy Policy**: Make it clear and accessible
4. **Test Thoroughly**: Test on multiple websites before submitting
5. **Respond to Reviews**: Engage with users who leave feedback

## Store Listing Checklist

Before submitting, ensure:
- [ ] ZIP file created (excluding backend, git, docs)
- [ ] Privacy policy created and accessible
- [ ] Screenshots taken (at least 1, recommended 5)
- [ ] Name, summary, and description filled
- [ ] Category selected
- [ ] Icon uploaded
- [ ] Permissions explained
- [ ] Extension tested on multiple websites
- [ ] Version number set in manifest.json
- [ ] All required fields completed

## Support

If you encounter issues:
- Check Chrome Web Store Developer Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Review rejection emails for specific issues
- Test extension in a clean Chrome profile before submitting

Good luck with your submission! 🚀

