const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.database();

/**
 * Simple callable to return aggregate admin analytics.
 * This is intentionally basic and can be extended later.
 */
exports.getAdminAnalytics = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  // Check admin role
  const userSnap = await db.ref(`users/${uid}`).get();
  if (!userSnap.exists() || userSnap.val().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  const statsSnap = await db.ref('analytics/stats').get();
  const stats = statsSnap.exists() ? statsSnap.val() : {};

  return stats;
});

module.exports = {
  getAdminAnalytics: exports.getAdminAnalytics,
};

