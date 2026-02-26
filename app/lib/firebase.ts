// app/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPeT70jwQVDx_ZTTNQHTYqZFUejauRgqo",
  authDomain: "bormex-a6859.firebaseapp.com",
  projectId: "bormex-a6859",
  storageBucket: "bormex-a6859.firebasestorage.app",
  messagingSenderId: "436440397144",
  appId: "1:436440397144:web:5082441eba52ee886ea12d",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
