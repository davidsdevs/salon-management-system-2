import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration - Hardcoded for Render hosting
const firebaseConfig = {
  apiKey: "AIzaSyC-6AX8N96wuqEL-p0rQmJFiS-OZ9JEqGo",
  authDomain: "david-salon-fff6d.firebaseapp.com",
  projectId: "david-salon-fff6d",
  storageBucket: "david-salon-fff6d.firebasestorage.app",
  messagingSenderId: "248565145509",
  appId: "1:248565145509:web:a7861697801ebf3848524c",
  measurementId: "G-PB1LMRZD7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Initialize Analytics if supported (avoids SSR errors)
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export default app;
