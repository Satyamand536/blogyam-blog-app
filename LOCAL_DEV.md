# Local Development Instructions

## Running the Backend Locally

Since we've restructured for Vercel serverless, the backend is now in `/api` folder with routes mounted at `/` instead of `/api`.

### Option 1: Run from /api folder (Recommended)
```bash
cd api
npm install  # Install dependencies in /api folder
npm start    # Runs app.js directly
```

Access routes at: `http://localhost:8000/signin`, `http://localhost:8000/blogs`, etc.

**Frontend Update Needed:**
Change `VITE_API_URL` in `/client/.env.local` to:
```
VITE_API_URL=http://localhost:8000
```
(Remove the `/api` suffix for local dev)

### Option 2: Use a dev wrapper script

Create `/api/dev.js`:
```javascript
const app = require('./app');
const express = require('express');

const devApp = express();
devApp.use('/api', app); // Add /api prefix for local dev
devApp.listen(8000, () => console.log('Dev server on :8000'));
```

Run: `node api/dev.js`

This way frontend can still call `localhost:8000/api/*` routes.

## Production

No changes needed - Vercel automatically serves `/api` folder as serverless functions.
