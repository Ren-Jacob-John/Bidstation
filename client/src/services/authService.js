// ---------------------------------------------------------------------------
// client/src/services/authService.js   (Firebase version)
// ---------------------------------------------------------------------------
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { fireAuth, firestore } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const usersCol = (uid) => doc(firestore, 'users', uid);

// ---------------------------------------------------------------------------
// REGISTER  –  creates Firebase Auth user + writes profile to Firestore
// ---------------------------------------------------------------------------
export const registerUser = async ({ username, email, password, role }) => {
  // 1. Create the Auth account (Firebase sends a verification email
  //    automatically if we call sendVerificationEmail right after)
  const { user } = await createUserWithEmailAndPassword(fireAuth, email, password);

  // 2. Write the extra profile fields into Firestore  users/{uid}
  await setDoc(usersCol(user.uid), {
    uid:           user.uid,
    username,
    email,
    role:          role || 'bidder',
    emailVerified: false,
    createdAt:     new Date(),
  });

  // 3. Kick off verification email (non-blocking – never crashes registration)
  sendEmailVerification(user).catch(() => {});

  return {
    user: {
      id:            user.uid,
      username,
      email,
      role:          role || 'bidder',
      emailVerified: user.emailVerified,
    },
  };
};

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const loginUser = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(fireAuth, email, password);

  // Pull the extra profile data from Firestore
  const snap = await getDoc(usersCol(user.uid));
  const profile = snap.exists() ? snap.data() : {};

  // Keep Firestore's emailVerified in sync with Firebase Auth
  if (user.emailVerified && !profile.emailVerified) {
    await updateDoc(usersCol(user.uid), { emailVerified: true });
  }

  return {
    user: {
      id:            user.uid,
      username:      profile.username || '',
      email:         user.email,
      role:          profile.role || 'bidder',
      emailVerified: user.emailVerified,
    },
  };
};

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export const logoutUser = () => signOut(fireAuth);

// ---------------------------------------------------------------------------
// GET CURRENT USER  –  reads Firestore profile for the signed-in user
// ---------------------------------------------------------------------------
export const getCurrentUser = async () => {
  const user = fireAuth.currentUser;
  if (!user) return null;

  const snap = await getDoc(usersCol(user.uid));
  const profile = snap.exists() ? snap.data() : {};

  return {
    id:            user.uid,
    username:      profile.username || '',
    email:         user.email,
    role:          profile.role || 'bidder',
    emailVerified: user.emailVerified,
  };
};

// ---------------------------------------------------------------------------
// LISTEN to auth-state changes  (used by AuthContext)
// ---------------------------------------------------------------------------
export const onAuthChange = (callback) => onAuthStateChanged(fireAuth, callback);

// ---------------------------------------------------------------------------
// SEND verification email  (resend)
// ---------------------------------------------------------------------------
export const resendVerification = async () => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('Not logged in');
  if (user.emailVerified) throw new Error('Email already verified');
  await sendEmailVerification(user);
};

// ---------------------------------------------------------------------------
// VERIFY email via action code  (the ?oobCode= from the link)
// ---------------------------------------------------------------------------
export const verifyEmail = async (actionCode) => {
  await applyActionCode(fireAuth, actionCode);

  // Refresh the token so .emailVerified updates immediately
  const user = fireAuth.currentUser;
  if (user) {
    await user.reload();
    // Sync flag to Firestore
    await updateDoc(usersCol(user.uid), { emailVerified: true });
  }
};

// ---------------------------------------------------------------------------
// FORGOT PASSWORD  –  Firebase sends the reset email for us
// ---------------------------------------------------------------------------
export const forgotPassword = (email) => sendPasswordResetEmail(fireAuth, email);

// ---------------------------------------------------------------------------
// RESET PASSWORD via action code  (the ?oobCode= from the reset link)
// ---------------------------------------------------------------------------
export const resetPassword = async (actionCode, newPassword) => {
  // 1. Apply the action code to authorise the reset
  await applyActionCode(fireAuth, actionCode);

  // 2. Re-sign in so we have an active session to call updatePassword
  //    (Firebase requires a recent auth – applyActionCode gives us that)
  const user = fireAuth.currentUser;
  if (user) {
    await updatePassword(user, newPassword);
  } else {
    // Edge-case: user session expired; tell them to log in and change pw there
    throw new Error(
      'Session expired. Please log in with your new password directly.'
    );
  }
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD  (from profile page – requires recent login)
// ---------------------------------------------------------------------------
export const changePassword = async (currentPassword, newPassword) => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('Not logged in');

  // Re-authenticate first (Firebase security requirement)
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Then update
  await updatePassword(user, newPassword);
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE (username / role)
// ---------------------------------------------------------------------------
export const updateProfile = async (updates) => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('Not logged in');
  await updateDoc(usersCol(user.uid), updates);
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthChange,
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};
