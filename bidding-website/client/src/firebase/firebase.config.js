import { initializeApp }  from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBEk6gtz8OlftPrsRvzYGn0KyoYWYjLGLc",
  authDomain: "bidstation-c3582.firebaseapp.com",
  projectId: "bidstation-c3582",
  storageBucket: "bidstation-c3582.firebasestorage.app",
  messagingSenderId: "505275679910",
  appId: "1:505275679910:web:7d93ec0cc738b074d12067",
  measurementId: "G-ZQBG3PSZEX"
};

const app = initializeApp(firebaseConfig);
const fireAuth  = getAuth(app);
const firestore = getFirestore(app);

export { fireAuth, firestore };
export default app;