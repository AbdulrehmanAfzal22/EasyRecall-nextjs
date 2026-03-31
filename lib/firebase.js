// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAj43z7T0ESNQeA4ecnULq9oAnvko-p4rg",
  authDomain: "easyrecall-736d4.firebaseapp.com",
  databaseURL: "https://easyrecall-736d4-default-rtdb.firebaseio.com",
  projectId: "easyrecall-736d4",
  storageBucket: "easyrecall-736d4.firebasestorage.app",
  messagingSenderId: "1097097916833",
  appId: "1:1097097916833:web:ba147c8383a8a830ed1be0",
  measurementId: "G-7PDP5C0T1P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;