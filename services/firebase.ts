
// Import the functions you need from the SDKs you need
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAnalytics } from "firebase/analytics";
import { getFirestore, setLogLevel } from "firebase/firestore";
// @ts-ignore
import { getAuth, signInAnonymously } from "firebase/auth";

// Suppress Firestore connection warnings
setLogLevel('silent');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPM6nramtY4liHF3uWS9EwxTCqFEnWzss",
  authDomain: "licell-studio-8d32a.firebaseapp.com",
  projectId: "licell-studio-8d32a",
  storageBucket: "licell-studio-8d32a.firebasestorage.app",
  messagingSenderId: "799216156978",
  appId: "1:799216156978:web:b0b4f85903490f2f01572b",
  measurementId: "G-YGKYESNV5M"
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
