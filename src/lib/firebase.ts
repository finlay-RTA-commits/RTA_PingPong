
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "rta-pingpong",
  "appId": "1:984710269214:web:3bd69f7e3c1d1d7d5fa10f",
  "storageBucket": "rta-pingpong.firebasestorage.app",
  "apiKey": "AIzaSyAL2qjoDm6_im98TGbUor7CZfXwcZ_19l4",
  "authDomain": "rta-pingpong.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "984710269214"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
