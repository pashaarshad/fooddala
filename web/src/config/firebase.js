// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAW4Vd0lDylLbiNLm-y2U5QlvYjBPVlOw4",
    authDomain: "fooddala-for--oath.firebaseapp.com",
    projectId: "fooddala-for--oath",
    storageBucket: "fooddala-for--oath.firebasestorage.app",
    messagingSenderId: "536428139122",
    appId: "1:536428139122:web:0e61b7a93f71d8c8d2e8eb",
    measurementId: "G-GK3G9GHM7D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
