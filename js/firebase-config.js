import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getDatabase, ref, set, push, get, child, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnCmjSzQxk_4qcHB79mGJ_i83GYrHUW6Q",
  authDomain: "khana-5a6cf.firebaseapp.com",
  databaseURL: "https://khana-5a6cf-default-rtdb.firebaseio.com",
  projectId: "khana-5a6cf",
  storageBucket: "khana-5a6cf.firebasestorage.app",
  messagingSenderId: "164289294824",
  appId: "1:164289294824:web:ba39ea434cd2d61b01745d"
};

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { 
  app, auth, db, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile,
  ref, set, push, get, child, update, onValue, remove 
};
