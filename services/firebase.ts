
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

const isConfigValid = !!firebaseConfig.apiKey;

// Initialize Firebase
const app = isConfigValid ? initializeApp(firebaseConfig) : null as any;
const db = isConfigValid ? getFirestore(app) : null as any;
const auth = isConfigValid ? getAuth(app) : null as any;

// Automatically sign in anonymously to allow access to Firestore data protected by auth rules
export const authPromise = (isConfigValid && auth) 
  ? signInAnonymously(auth).catch((error: any) => {
      console.warn("Firebase Anonymous Auth Failed. Cloud features may be limited.", error.message);
    })
  : Promise.resolve().then(() => {
      console.warn("Firebase API key is missing. Cloud features will be disabled.");
    });

export { app, db, auth };
