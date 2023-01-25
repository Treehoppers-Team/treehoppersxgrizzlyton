// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirebase, getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "treehoppers-mynt.firebaseapp.com",
    projectId: "treehoppers-mynt",
    storageBucket: "treehoppers-mynt.appspot.com",
    messagingSenderId: "751257459683",
    appId: "1:751257459683:web:10c7f44cd9684098205ed6"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);

// Initialise Storage bucket
export const storage = getStorage(app);