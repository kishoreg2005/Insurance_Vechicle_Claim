// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5w8rx1wFnzf4SRk20etdgggudQzKoU3o",
  authDomain: "project-final-62be8.firebaseapp.com",
  databaseURL: "https://project-final-62be8-default-rtdb.firebaseio.com",
  projectId: "project-final-62be8",
  storageBucket: "project-final-62be8.firebasestorage.app",
  messagingSenderId: "629073746935",
  appId: "1:629073746935:web:ef7d3ca311f8057002ecf2",
  measurementId: "G-2CGTJ2J50J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Analytics conditionally (only in supported environments)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, analytics };
export default app;
