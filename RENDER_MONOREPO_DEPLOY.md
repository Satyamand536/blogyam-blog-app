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
| `CLOUDINARY_CLOUD_NAME` | `dxfojr7y8` |
| `CLOUDINARY_API_KEY` | `388566182328988` |
| `CLOUDINARY_API_SECRET` | `thqsggXGWH_C2WIgST9SdWyOYp8` |

---

## 🚀 **Manual Deployment Steps**

1. **GitHub Push**AB SAB KUCHH SET HAI! 🚀**
- **Root Directory**: KHALLI (EMPTY) CHHODO.
- **Build Command**: `npm install && npm run build` (Sabse safe rasta).
- **Start Command**: `npm start`
- **ENV Variables**: Bus MongoDB, JWT, OpenRouter aur Cloudinary ke keys dalo.

Ab tumhara project "Zero-Config" connect hoga aur pehli bar mein hi sahi chalega. Best of luck for the launch! 💎🔥
