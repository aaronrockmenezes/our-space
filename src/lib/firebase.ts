import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBbD-gf57Jyt0aONiCrELYKjUcn1n-lbtU",
  authDomain: "website-8c9a3.firebaseapp.com",
  projectId: "website-8c9a3",
  storageBucket: "website-8c9a3.firebasestorage.app",
  messagingSenderId: "103251154938",
  appId: "1:103251154938:web:aeeb0f551c527a50547643",
  measurementId: "G-8T8CXGPEJV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
