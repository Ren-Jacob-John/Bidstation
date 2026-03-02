const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.database();

/**
 * Helper to write a notification for a user.
 */
async function createNotification(userId, payload) {
  if (!userId) return;
  const ref = db.ref(`notifications/${userId}`).push();
  await ref.set({
    ...payload,
    createdAt: Date.now(),
    read: false,
  });
}

/**
 * Trigger on bid writes to send OUTBID notifications and basic analytics.
 * Path: bids/{auctionId}/{bidId}
 */
exports.onBidWrite = functions.database
  .ref('bids/{auctionId}/{bidId}')
  .onWrite(async (change, context) => {
    const { auctionId, bidId } = context.params;

    const after = change.after.val();
    const before = change.before.val();

    // Only care about newly created active bids
    if (!after || !after.amount || after.status !== 'active') {
      return null;
    }

    const bidderId = after.bidderId;
    const playerId = after.playerId;

    // Find previous active bid for this player to mark OUTBID
    const bidsSnap = await db.ref(`bids/${auctionId}`).get();
    if (!bidsSnap.exists()) return null;

    let previousHighest = null;
    bidsSnap.forEach((child) => {
      const b = child.val();
      if (
        child.key !== bidId &&
        b.playerId === playerId &&
        b.status === 'active'
      ) {
        if (!previousHighest || (b.amount || 0) > (previousHighest.amount || 0)) {
          previousHighest = { id: child.key, ...b };
        }
      }
    });

    if (previousHighest && previousHighest.bidderId && previousHighest.bidderId !== bidderId) {
      // Mark previous as outbid
      await db.ref(`bids/${auctionId}/${previousHighest.id}`).update({
        status: 'outbid',
      });

      // Notification to previous highest bidder
      await createNotification(previousHighest.bidderId, {
        type: 'OUTBID',
        auctionId,
        itemId: playerId,
        message: `You have been outbid on ${after.playerName || 'an item'}.`,
      });
    }

    // --- Basic auto-bid handling ---
    // Skip if this bid was already placed by auto-bid logic to avoid loops
    if (after.autoBid === true) {
      return null;
    }

    try {
      const auctionSnap = await db.ref(`auctions/${auctionId}`).get();
      const auction = auctionSnap.exists() ? auctionSnap.val() : {};
      const minIncrement = auction.minIncrement || 100000;

      const autoBidsSnap = await db
        .ref(`autoBids/${auctionId}/${playerId}`)
        .get();
      if (!autoBidsSnap.exists()) {
        return null;
      }

      let best = null;
      autoBidsSnap.forEach((child) => {
        const cfg = child.val();
        const uid = child.key;
        if (!cfg || cfg.active === false) return;
        if (uid === bidderId) return; // don't auto-bid against own manual bid
        const maxAmount = Number(cfg.maxAmount || 0);
        if (!Number.isFinite(maxAmount)) return;
        if (maxAmount < after.amount + minIncrement) return;
        if (!best || maxAmount > best.maxAmount) {
          best = { uid, maxAmount };
        }
      });

      if (!best) {
        return null;
      }

      const nextAmount = after.amount + minIncrement;
      if (nextAmount > best.maxAmount) {
        return null;
      }

      const newBidRef = db.ref(`bids/${auctionId}`).push();
      await newBidRef.set({
        id: newBidRef.key,
        auctionId,
        playerId,
        playerName: after.playerName || null,
        bidderId: best.uid,
        bidderName: 'Auto-bidder',
        amount: nextAmount,
        timestamp: Date.now(),
        status: 'active',
        autoBid: true,
      });
    } catch (e) {
      console.error('Error processing auto-bid logic:', e);
    }

    return null;
  });

module.exports = {
  onBidWrite: exports.onBidWrite,
};

