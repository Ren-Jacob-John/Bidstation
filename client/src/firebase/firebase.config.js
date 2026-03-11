import { initializeApp }  from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getDatabase }    from 'firebase/database';
import { getFunctions }   from 'firebase/functions';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app       = initializeApp(firebaseConfig);
const fireAuth  = getAuth(app);
const database  = getDatabase(app);
const functions = getFunctions(app);

export { fireAuth, database, functions };
export default app;
