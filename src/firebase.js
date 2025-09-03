import { initializeApp } from "firebase/app";
import { getAuth, sendEmailVerification, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdMkVAFftRJ2iWoFN3-oIOPn0qVriUNHI",
  authDomain: "davidsalon-d18ca.firebaseapp.com",
  projectId: "davidsalon-d18ca",
  storageBucket: "davidsalon-d18ca.firebasestorage.app",
  messagingSenderId: "707816713602",
  appId: "1:707816713602:web:f369e9ccaeaa6da6b7339b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
