# Render Monorepo Deployment - Single Service

## 🎯 **EK SAATH DEPLOY KARO - SIMPLE!**

Dono frontend aur backend ek hi web service mein run honge!

---

## 📋 **RENDER SETTINGS** (Copy-Paste Ready)

### **Create Web Service:**

| Setting | Value |
|---------|-------|
| **Name** | `blogyam` |
| **Environment** | `Node` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Root Directory** | **LEAVE EMPTY** (root hi hai) |
| **Build Command** | `npm run build && cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |

---

## 🔧 **Environment Variables** (Render Dashboard mein add karo)

```
NODE_ENV=production
MONGODB_URL=<your_mongodb_url>
JWT_SECRET=<generate_random_32_char_string>
OPENROUTER_API_KEY=<your_openrouter_key>
CLOUDINARY_CLOUD_NAME=dxfqlr7y8
CLOUDINARY_API_KEY=388566182328988
CLOUDINARY_API_SECRET=thqsggXGWH_C2WIgST9SdWyOYp8
```

**Note:** `CLIENT_URL` ki zaroorat NAHI hai kyunki same domain pe hoga!

---

## 🚀 **Kaise Kaam Karega:**

1. **Build Process:**
   - Frontend build hoga (`client/dist` mein)
   - Backend dependencies install hongi
   
2. **Runtime:**
   - Backend server start hoga
   - Backend frontend files serve karega
   - API routes: `your-app.onrender.com/api/*`
   - Frontend: `your-app.onrender.com/`

---

## 🚀 Manual Deployment Settings (If not using Blueprint)

If you are creating the **Web Service** manually on Render dashboard, use these exact settings:

| Field | Value |
|-------|-------|
| **Name** | `blogyam-fullstack` |
| **Root Directory** | *(Leave Empty)* |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

## 🔑 Required Environment Variables

Add these in the **Environment** tab:

| Key | Value/Source |
|-----|--------------|
| `NODE_ENV` | `production` |
| `MONGODB_URL` | *(Aapka MongoDB Cluster URL)* |
| `JWT_SECRET` | *(Random String)* |
| `CLIENT_URL` | `https://blogyam-fullstack.onrender.com` |
| `VITE_API_URL` | `https://blogyam-fullstack.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | `dxfqlr7y8` |
| `CLOUDINARY_API_KEY` | `388566182328988` |
| `CLOUDINARY_API_SECRET` | `thqsggXGWH_C2WIgST9SdWyOYp8` |

## ✅ Final Steps Before Deployment

1. **Commit & Push**: Make sure all changes are pushed to your GitHub repository.
2. **Connect Repo**: Select your repository on Render.
3. **Set Env Vars**: Copy-paste the variables from the table above.
4. **Deploy**: Render will automatically start the build process.

---
**Note:** Deployment ke baad pehla load slow ho sakta hai (Render Free Tier "Cold Start"), par 30s timeout settings usko handle kar lengi! ✅

---

## ✅ **EXACT STEPS:**

### Step 1: Git Push
```bash
git add .
git commit -m "Monorepo Render deployment ready"
git push origin main
```

### Step 2: Render Dashboard
1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo

### Step 3: Fill Form (COPY THESE VALUES)

```
Name: blogyam

Environment: Node

Region: Singapore

Branch: main

Root Directory: [LEAVE EMPTY - DELETE IF AUTO-FILLED]

Build Command: npm run build && cd backend && npm install

Start Command: cd backend && npm start

Plan: Free
```

### Step 4: Environment Tab
Add all environment variables listed above

### Step 5: Deploy
Click **"Create Web Service"**

Wait 5-10 minutes for build

---

## 🧪 **Testing After Deployment:**

Your app URL: `https://blogyam.onrender.com`

- Frontend: `https://blogyam.onrender.com/`
- API: `https://blogyam.onrender.com/api/health`

Test checklist:
- [ ] Homepage loads
- [ ] Login works
- [ ] Create blog
- [ ] Upload image
- [ ] Quotes page
- [ ] Memes page

---

## ⚡ **Advantages of Monorepo Deployment:**

✅ Single URL (no CORS issues)
✅ Simpler configuration
✅ One deployment to manage
✅ Lower latency (no cross-domain calls)
✅ Perfect for cookie-based auth

---

## 🎯 **Summary:**

**EK LINE MEIN:**
Root directory EMPTY rakho, build command frontend build + backend install karega, start command backend start karega jo frontend bhi serve karega!

**SIMPLE HAI! 🚀**
