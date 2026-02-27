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
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set, get, update, remove } from 'firebase/database';
import { fireAuth, database } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Register a new user
// ---------------------------------------------------------------------------
export const registerUser = async (email, password, username, role = 'bidder', contactDetails = null) => {
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

    // Store contact details under users/{userId}/contactDetails
    if (contactDetails) {
      const contactRef = ref(database, `users/${user.uid}/contactDetails`);
      await set(contactRef, {
        email: contactDetails.email || email,
        phone: contactDetails.phone || '',
        address: contactDetails.address || '',
        createdAt: Date.now(),
      });
    }

    // Send verification email
    await sendEmailVerification(user);

    return {
      uid: user.uid,
      email: user.email,
      username: username,
      role: role,
      emailVerified: false,
      contactDetails: contactDetails || null,
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
      const userData = snapshot.val();
      
      // Check if user is banned
      if (userData.banned === true) {
        await signOut(fireAuth);
        throw new Error('Your account has been banned. Please contact support.');
      }
      
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...userData,
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

// ---------------------------------------------------------------------------
// Delete account (requires current password for re-authentication)
// ---------------------------------------------------------------------------
export const deleteAccount = async (currentPassword) => {
  const user = fireAuth.currentUser;
  if (!user || !user.email) throw new Error('No user logged in');

  // Re-authenticate (required by Firebase before deleteUser)
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Remove user profile from Realtime Database
  const userRef = ref(database, `users/${user.uid}`);
  await remove(userRef);

  // Delete Firebase Auth user (also signs out)
  await deleteUser(user);
};

// ---------------------------------------------------------------------------
// Admin functions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Check if current user is admin
// ---------------------------------------------------------------------------
export const isAdmin = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) return false;

    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.role === 'admin';
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Get all users (admin only)
// ---------------------------------------------------------------------------
export const getAllUsers = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Check if user is admin
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists() || userSnapshot.val().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get all users
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const users = [];
    snapshot.forEach((childSnapshot) => {
      users.push({
        uid: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    // Sort by creation date (newest first)
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Ban a user (admin only)
// ---------------------------------------------------------------------------
export const banUser = async (userId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Check if user is admin
    const adminRef = ref(database, `users/${user.uid}`);
    const adminSnapshot = await get(adminRef);
    
    if (!adminSnapshot.exists() || adminSnapshot.val().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Prevent banning yourself
    if (userId === user.uid) {
      throw new Error('Cannot ban yourself');
    }

    // Prevent banning other admins
    const targetUserRef = ref(database, `users/${userId}`);
    const targetUserSnapshot = await get(targetUserRef);
    
    if (targetUserSnapshot.exists() && targetUserSnapshot.val().role === 'admin') {
      throw new Error('Cannot ban another admin');
    }

    // Update user's banned status
    await update(targetUserRef, {
      banned: true,
      bannedAt: Date.now(),
      bannedBy: user.uid,
    });

    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Unban a user (admin only)
// ---------------------------------------------------------------------------
export const unbanUser = async (userId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Check if user is admin
    const adminRef = ref(database, `users/${user.uid}`);
    const adminSnapshot = await get(adminRef);
    
    if (!adminSnapshot.exists() || adminSnapshot.val().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Update user's banned status
    const targetUserRef = ref(database, `users/${userId}`);
    await update(targetUserRef, {
      banned: false,
      bannedAt: null,
      bannedBy: null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
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
  deleteAccount,
  isAdmin,
  getAllUsers,
  banUser,
  unbanUser,
};