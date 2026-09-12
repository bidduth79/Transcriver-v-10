
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";
import { getFirestore, setLogLevel } from "firebase/firestore";

import { getAuth, signInAnonymously } from "firebase/auth";

// Suppress Firestore connection warnings
setLogLevel('silent');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Automatically sign in anonymously to allow access to Firestore data protected by auth rules
export const authPromise = signInAnonymously(auth).catch((error: any) => {
  console.warn("Firebase Anonymous Auth Failed. Cloud features may be limited.", error.message);
});

export { app, db, auth };
