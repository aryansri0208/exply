# GitHub Setup Instructions

## Step 1: Initialize Git (if not already done)

```bash
cd /Users/aryansrivastava/Desktop/BrowserAI
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: exply Chrome extension"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `exply` (or any name you prefer)
3. Description: "Chrome extension for AI-powered text explanations"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 5: Connect and Push

After creating the repo, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/exply.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/exply.git
git branch -M main
git push -u origin main
```

## Files Included

The repository includes:
- Extension code (api.js, content.js, styles.css)
- Configuration (manifest.json, options.html, options.js)
- Icons (icon16.png, icon48.png, icon128.png, logo.png)
- Documentation (README.md, QUICKSTART.md)
- .gitignore (excludes .DS_Store, node_modules, etc.)

## Note

The `.gitignore` file excludes:
- OS files (.DS_Store)
- Editor files (.vscode, .idea)
- Environment files (.env)
- Node modules
- Log files

Your API key in Chrome storage is NOT included (it's stored locally in the browser, not in files).

