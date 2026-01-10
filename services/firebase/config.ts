
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBqcS-rap5P5jRl7nhfdESKWEJtZb4Zy8c",
    authDomain: "salepilot-ae09f.firebaseapp.com",
    projectId: "salepilot-ae09f",
    storageBucket: "salepilot-ae09f.firebasestorage.app",
    messagingSenderId: "980903093215",
    appId: "1:980903093215:web:2c821c0758a9ec70335a6a",
    measurementId: "G-2885SSEE1Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
