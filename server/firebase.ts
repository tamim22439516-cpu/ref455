import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Suppress internal Firestore gRPC and quota logging spam
setLogLevel('silent');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '..', 'firebase-applet-config.json');

export let firebaseConfig: any = null;
if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (err) {
    console.error('Failed to parse FIREBASE_CONFIG environment variable:', err);
  }
} else if (fs.existsSync(CONFIG_PATH)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse firebase-applet-config.json:', err);
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-tawzoonnexus-557a2c6c-f5c5-48eb-9872-f80349e14033'
  };
} else {
  firebaseConfig = {
    projectId: "steady-dryad-6vxch",
    appId: "1:122861861884:web:c13ddbd453c965860c1079",
    apiKey: "AIzaSyADvDq0gUPIc5DtGtTyhRToqDGSv7Ry2vU",
    authDomain: "steady-dryad-6vxch.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-tawzoonnexus-557a2c6c-f5c5-48eb-9872-f80349e14033",
    storageBucket: "steady-dryad-6vxch.firebasestorage.app",
    messagingSenderId: "122861861884"
  };
}

export const app = getApps().length === 0 && firebaseConfig
  ? initializeApp(firebaseConfig)
  : getApps().length > 0
  ? getApp()
  : null;

export const firestore = app
  ? (firebaseConfig?.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app))
  : null;

export const storage = app && firebaseConfig?.storageBucket
  ? getStorage(app, `gs://${firebaseConfig.storageBucket}`)
  : null;

export async function uploadBufferToCloudStorage(
  buffer: Buffer,
  destinationPath: string,
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  if (!storage) return null;
  try {
    const storageRef = ref(storage, destinationPath);
    await uploadBytes(storageRef, buffer, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    // Fall back silently to local storage
    return null;
  }
}

export async function testFirestoreConnection() {
  if (!firestore) {
    return false;
  }
  try {
    const probeDocRef = doc(firestore, 'brand_settings', 'default');
    const probePromise = getDoc(probeDocRef);
    await Promise.race([
      probePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);
    return true;
  } catch (error) {
    return false;
  }
}
