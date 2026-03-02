const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.database();

/**
 * Callable to set or update an auto-bid configuration.
 * Payload: { auctionId, playerId, maxAmount }
 */
exports.setAutoBid = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { auctionId, playerId, maxAmount } = data || {};
  const max = Number(maxAmount);
  if (!auctionId || !playerId || !Number.isFinite(max) || max <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid autobid payload.');
  }

  const ref = db.ref(`autoBids/${auctionId}/${playerId}/${uid}`);
  await ref.set({
    maxAmount: max,
    active: true,
    createdAt: Date.now(),
  });

  return { success: true };
});

module.exports = {
  setAutoBid: exports.setAutoBid,
};

