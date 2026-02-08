# Render Monorepo Deployment - Single Service

## 🎯 **EK SAATH DEPLOY KARO - SIMPLE!**
Dono frontend aur backend ek hi web service mein run honge.

---

## 📋 **RENDER DASHBOARD SETTINGS**

### **Step 1: Create Web Service**
1. Connect GitHub repo.
2. Form mein niche di gayi values bhariye:

| Setting | Value |
|---------|-------|
| **Name** | `blogyam` |
| **Environment** | `Node` |
| **Region** | `Singapore` (Best for India) |
| **Branch** | `main` |
| **Root Directory** | **KHALLI (EMPTY) CHHODO** |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

---

## 🔧 **Step 2: Environment Variables**
Render dashboard ke **"Environment"** tab mein niche diye gaye variables add karo:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URL` | *(Aapki MongoDB URI)* |
| `JWT_SECRET` | *(Koi bhi random string)* |
| `OPENROUTER_API_KEY` | *(Aapki OpenRouter Key)* |
| `CLOUDINARY_CLOUD_NAME` | `dxfqlr7y8` |
| `CLOUDINARY_API_KEY` | `388566182328988` |
| `CLOUDINARY_API_SECRET` | `thqsggXGWH_C2WIgST9SdWyOYp8` |

---

## 🚀 **Manual Deployment Steps**

1. **GitHub Push**: Sabse pehle code push karo.
   ```bash
   git add .
   git commit -m "Admin and Navigation fixed for Render"
   git push origin main
   ```
2. **Render Create**: Web Service banalo upar di gayi settings ke sath.
3. **Wait**: Build hone mein 5-10 minute lag sakte hain.

---

## ✅ **Verification Checklist:**
- [ ] Homepage loading as default (frontend).
- [ ] `/api/health` status checked (backend).
- [ ] AI features verified.
- [ ] Admin Dashboard checked on mobile.

**AB SAB KUCHH SET HAI! 🚀**
- Build command: frontend build karega aur backend install karega.
- Start command: backend start karega jo khud ki API aur frontend files dono handle karega.
