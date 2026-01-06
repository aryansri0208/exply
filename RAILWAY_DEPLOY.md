# Railway Deployment - Quick Fix

Railway is detecting the root directory. You need to tell it to deploy from the `backend` folder.

## Solution: Set Root Directory in Railway

### Option 1: Via Railway Dashboard (Easiest)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **"Root Directory"** section
5. Set it to: `backend`
6. Click **Save**
7. Railway will redeploy automatically

### Option 2: Via railway.json (Already Created)

I've created `backend/railway.json` which should help Railway detect it's a Node.js app.

### Option 3: Create Separate Repository

If Railway still has issues, you can:

1. Create a new GitHub repo just for the backend
2. Copy only the `backend/` folder contents
3. Push to the new repo
4. Deploy that repo to Railway

## After Setting Root Directory

1. **Add Environment Variable**:
   - Go to Variables tab
   - Add: `GEMINI_API_KEY` = `AIzaSyAnodtaOQWy0gU0oFx_G0hC8CHB9G7s284`
   - Add: `NODE_ENV` = `production`

2. **Wait for Deployment**:
   - Railway will automatically rebuild
   - Check the Deployments tab for status

3. **Get Your URL**:
   - Go to Settings → Domains
   - Copy your Railway URL (e.g., `https://exply-backend.up.railway.app`)

4. **Update Extension**:
   - Edit `api.js`
   - Change: `const BACKEND_URL = 'https://your-railway-url.up.railway.app';`

## Alternative: Use Render Instead

If Railway continues to have issues, Render is simpler:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. **Root Directory**: `backend`
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. Add environment variable: `GEMINI_API_KEY`
8. Deploy

Render handles the root directory setting more easily.

