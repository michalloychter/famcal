// src/firebase-emulator.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your Firebase config (use dummy values for emulator)
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'demo-famcal',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to the local Auth emulator only if running locally
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  // You can add more emulator connections here (Firestore, etc.)
}

export { app, auth };