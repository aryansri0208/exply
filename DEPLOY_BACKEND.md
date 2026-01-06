# Deploy Backend to Production

## Quick Deploy Options

### Option 1: Railway (Easiest - Recommended)

1. **Install Railway CLI** (optional, or use web interface):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy**:
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Set Environment Variable**:
   - Go to Railway dashboard
   - Select your project
   - Go to Variables tab
   - Add: `GEMINI_API_KEY` = your API key
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = (Railway sets this automatically, but you can override)

4. **Get Your URL**:
   - Railway provides a URL like: `https://your-project.up.railway.app`
   - Copy this URL

5. **Update Extension**:
   - Edit `api.js`
   - Change: `const BACKEND_URL = 'https://your-project.up.railway.app';`

### Option 2: Render (Free Tier Available)

1. **Connect GitHub**:
   - Go to https://render.com
   - Sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select the `backend` folder

2. **Configure**:
   - **Name**: exply-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid for better performance)

3. **Set Environment Variables**:
   - `GEMINI_API_KEY` = your API key
   - `NODE_ENV` = `production`
   - `PORT` = 10000 (Render default, or leave empty)

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Get URL: `https://exply-backend.onrender.com`

5. **Update Extension**:
   - Edit `api.js`
   - Change: `const BACKEND_URL = 'https://exply-backend.onrender.com';`

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   brew install heroku/brew/heroku
   heroku login
   ```

2. **Deploy**:
   ```bash
   cd backend
   heroku create exply-backend
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set GEMINI_API_KEY=your_api_key_here
   heroku config:set NODE_ENV=production
   ```

4. **Get URL**:
   - Your app will be at: `https://exply-backend.herokuapp.com`

5. **Update Extension**:
   - Edit `api.js`
   - Change: `const BACKEND_URL = 'https://exply-backend.herokuapp.com';`

### Option 4: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Initialize**:
   ```bash
   cd backend
   fly launch
   ```

3. **Set Secrets**:
   ```bash
   fly secrets set GEMINI_API_KEY=your_api_key_here
   fly secrets set NODE_ENV=production
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Get URL**:
   - Your app will be at: `https://exply-backend.fly.dev`

### Option 5: Vercel (Serverless)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`** in backend folder:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

4. **Set Environment Variables**:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `GEMINI_API_KEY`

5. **Update Extension**:
   - Use the Vercel URL provided

## After Deployment

### 1. Test Your Backend

```bash
# Health check
curl https://your-backend-url.com/health

# Test explain endpoint
curl -X POST https://your-backend-url.com/explain \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","mode":"explain"}'
```

### 2. Update Extension

Edit `api.js`:
```javascript
const BACKEND_URL = 'https://your-deployed-backend-url.com';
```

### 3. Reload Extension

- Go to `chrome://extensions/`
- Click reload on your extension
- Test on any webpage

## Environment Variables Needed

Make sure to set these on your hosting platform:

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `NODE_ENV` - Set to `production` (optional but recommended)
- `PORT` - Usually set automatically by hosting platform

## CORS Configuration

The backend is already configured to allow all origins (`origin: '*'`), so it will work with your extension from any domain.

## Monitoring

After deployment, you can:
- Check logs in your hosting platform's dashboard
- Monitor usage/requests
- Set up alerts for errors

## Cost Estimates

- **Railway**: Free tier available, then ~$5/month
- **Render**: Free tier available (spins down after inactivity), then ~$7/month
- **Heroku**: Free tier discontinued, ~$7/month
- **Fly.io**: Free tier available, then pay-as-you-go
- **Vercel**: Free tier available, then pay-as-you-go

## Recommended: Railway or Render

Both are easy to set up and have free tiers perfect for getting started.

