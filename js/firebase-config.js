/**
 * Firebase Configuration and Initialization
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBuMKw7UxGfNEF5QXN-uMRvwVy5q09n0ck",
  authDomain: "amma-8a0f7.firebaseapp.com",
  projectId: "amma-8a0f7",
  storageBucket: "amma-8a0f7.firebasestorage.app",
  messagingSenderId: "931636499774",
  appId: "1:931636499774:web:38143384c785f5cad1486f",
  measurementId: "G-FDEHN7FPD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
