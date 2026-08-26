import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, 'drills'));
  console.log(`Total drills: ${snap.size}`);
  const uids = new Set();
  snap.forEach(doc => {
    uids.add(doc.data().uid || 'NO_UID');
  });
  console.log('UIDs found:', Array.from(uids));
  process.exit(0);
}
check();
