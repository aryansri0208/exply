# Deploy to Vercel - Step by Step

## Prerequisites

1. GitHub account
2. Vercel account (free at https://vercel.com)

## Step 1: Push Code to GitHub

Make sure your code is on GitHub:
```bash
cd /Users/aryansrivastava/Desktop/BrowserAI
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** (can use GitHub account)
3. **Click "Add New..." → "Project"**
4. **Import your GitHub repository**
   - Select your `exply` repository
   - Click "Import"

5. **Configure Project**:
   - **Root Directory**: Click "Edit" → Set to `backend`
   - **Framework Preset**: Leave as "Other" (or "Node.js")
   - **Build Command**: Leave empty (or `npm install`)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`
   - **Development Command**: Leave empty

6. **Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `GEMINI_API_KEY` = `AIzaSyAnodtaOQWy0gU0oFx_G0hC8CHB9G7s284`
     - `NODE_ENV` = `production` (optional)

7. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for deployment

8. **Get Your URL**:
   - After deployment, you'll see a URL like: `https://exply-backend.vercel.app`
   - Copy this URL

### Option B: Via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add GEMINI_API_KEY
   # Paste your API key when prompted
   
   vercel env add NODE_ENV
   # Enter: production
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 3: Update Extension

After deployment, edit `api.js`:

```javascript
const BACKEND_URL = 'https://your-project.vercel.app'; // Your Vercel URL
```

## Step 4: Test

1. **Test Backend**:
   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Reload your extension
   - Test on any webpage

## Important Notes

- **Root Directory**: Make sure to set it to `backend` in Vercel dashboard
- **Environment Variables**: Must be set in Vercel dashboard (not in `.env` file)
- **Free Tier**: Vercel free tier is generous and should be enough for testing
- **HTTPS**: Vercel provides HTTPS automatically
- **Custom Domain**: You can add a custom domain later if needed

## Troubleshooting

**Build fails:**
- Check that Root Directory is set to `backend`
- Verify `package.json` exists in backend folder
- Check build logs in Vercel dashboard

**API returns 500:**
- Verify `GEMINI_API_KEY` environment variable is set
- Check function logs in Vercel dashboard

**CORS errors:**
- Backend is already configured with `origin: '*'` so this shouldn't happen
- If it does, check Vercel function logs

## Vercel Advantages

- ✅ Free tier with generous limits
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ✅ Automatic deployments on git push
- ✅ Serverless (scales automatically)
- ✅ Global CDN

