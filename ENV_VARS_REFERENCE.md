# Environment Variables Configuration

## Backend (.env)
```env
MONGODB_URL=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
OPENROUTER_API_KEY=<your_openrouter_key>
CLOUDINARY_CLOUD_NAME=dxfojr7y8
CLOUDINARY_API_KEY=388566182328988
CLOUDINARY_API_SECRET=thqsggXGWH_C2WIgST9SdWyOYp8
CLIENT_URL=http://localhost:5173
PORT=8000
```

## Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

## For Production (Vercel Dashboard)

### Backend Environment Variables
- MONGODB_URL
- JWT_SECRET
- OPENROUTER_API_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLIENT_URL (set to frontend URL after deployment)

### Frontend Environment Variables
- VITE_API_URL (set to backend URL after deployment)
