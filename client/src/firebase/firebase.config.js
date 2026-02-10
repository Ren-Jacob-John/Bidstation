// ---------------------------------------------------------------------------
// client/src/firebase/firebase.config.js
//
// Replace every "YOUR_…" placeholder with the real values from:
//   Firebase Console  →  Project Settings  →  General  →  Your apps  →  Web
// ---------------------------------------------------------------------------

import { initializeApp }  from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getDatabase }    from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBEk6gtz8OlftPrsRvzYGn0KyoYWYjLGLc",
  authDomain: "bidstation-c3582.firebaseapp.com",
  projectId: "bidstation-c3582",
  storageBucket: "bidstation-c3582.firebasestorage.app",
  messagingSenderId: "505275679910",
  appId: "1:505275679910:web:7d93ec0cc738b074d12067",
  measurementId: "G-ZQBG3PSZEX"
};

const app       = initializeApp(firebaseConfig);
const fireAuth  = getAuth(app);
const database = getDatabase(app);

export { fireAuth, database };
export default app;
