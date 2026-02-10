// ---------------------------------------------------------------------------
// client/src/services/authService.js - Authentication with Realtime Database
// ---------------------------------------------------------------------------
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { fireAuth, database } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Register a new user
// ---------------------------------------------------------------------------
export const registerUser = async (email, password, username, role = 'bidder') => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(fireAuth, email, password);
    const user = userCredential.user;

    // Create user profile in Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      username: username,
      email: email,
      role: role,
      emailVerified: false,
      createdAt: Date.now(),
    });

    // Send verification email
    await sendEmailVerification(user);

    return {
      uid: user.uid,
      email: user.email,
      username: username,
      role: role,
      emailVerified: false,
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Login user
// ---------------------------------------------------------------------------
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(fireAuth, email, password);
    const user = userCredential.user;

    // Get user profile from Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...snapshot.val(),
      };
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Logout user
// ---------------------------------------------------------------------------
export const logoutUser = async () => {
  try {
    await signOut(fireAuth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get current user profile
// ---------------------------------------------------------------------------
export const getCurrentUser = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) return null;

    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...snapshot.val(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Resend verification email
// ---------------------------------------------------------------------------
export const resendVerification = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    console.error('Error resending verification:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Verify email with action code
// ---------------------------------------------------------------------------
export const verifyEmail = async (actionCode) => {
  try {
    // Apply the action code
    await applyActionCode(fireAuth, actionCode);

    // Reload the user to get updated emailVerified status
    await fireAuth.currentUser.reload();

    // Update emailVerified in Realtime Database
    const user = fireAuth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, {
        emailVerified: true,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Send password reset email
// ---------------------------------------------------------------------------
export const forgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(fireAuth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Reset password with action code
// ---------------------------------------------------------------------------
export const resetPassword = async (actionCode, newPassword) => {
  try {
    // Verify the action code is valid
    await applyActionCode(fireAuth, actionCode);

    // Get the user's email from the action code
    const email = fireAuth.currentUser?.email;

    // Update the password
    if (fireAuth.currentUser) {
      await updatePassword(fireAuth.currentUser, newPassword);
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Change password (requires re-authentication)
// ---------------------------------------------------------------------------
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = fireAuth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Update user profile
// ---------------------------------------------------------------------------
export const updateProfile = async (updates) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, updates);

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Listen to auth state changes
// ---------------------------------------------------------------------------
export const onAuthChange = (callback) => {
  return onAuthStateChanged(fireAuth, callback);
};


export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};