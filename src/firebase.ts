import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApiKey = process.env.FIREBASE_API_KEY;

if (!firebaseApiKey || firebaseApiKey === 'REPLACED_BY_ENV_VAR') {
  console.warn('FIREBASE_API_KEY is not set in environment variables. Falling back to config value.');
}

const app = initializeApp({
  ...firebaseConfig,
  apiKey: firebaseApiKey || firebaseConfig.apiKey
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
