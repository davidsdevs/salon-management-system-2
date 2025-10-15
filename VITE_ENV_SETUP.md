# 🔧 Vite Environment Variables Setup

## 📝 Create .env file

Create a `.env` file in the root directory with your Firebase configuration:

```bash
# Firebase Configuration for Vite
VITE_FIREBASE_API_KEY=AIzaSyC-6AX8N96wuqEL-p0rQmJFiS-OZ9JEqGo
VITE_FIREBASE_AUTH_DOMAIN=david-salon-fff6d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=david-salon-fff6d
VITE_FIREBASE_STORAGE_BUCKET=david-salon-fff6d.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=248565145509
VITE_FIREBASE_APP_ID=1:248565145509:web:a7861697801ebf3848524c
VITE_FIREBASE_MEASUREMENT_ID=G-PB1LMRZD7J
```

## 🎯 Key Points

- **Vite uses `VITE_` prefix** for environment variables (not `REACT_APP_`)
- **Variables are available as `import.meta.env.VITE_*`**
- **The `.env` file should be in the root directory**
- **Restart the dev server after creating `.env`**

## ✅ Current Status

The Firebase configuration now has the actual values as fallbacks, so the app should work even without the `.env` file. However, creating the `.env` file is recommended for proper environment variable management.

## 🚀 Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

