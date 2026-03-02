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
 * Trigger on bid writes to send OUTBID notifications, drive auto-bid,
 * and update simple analytics.
 * Path: bids/{auctionId}/{bidId}
 */
exports.onBidWrite = functions.database
  .ref('bids/{auctionId}/{bidId}')
  .onWrite(async (change, context) => {
    const { auctionId, bidId } = context.params;

    const after = change.after.val();
    const before = change.before.val();

    // Only care about newly created active bids
    if (!after || !after.amount || after.status !== 'active' || before) {
      return null;
    }

    const bidderId = after.bidderId;
    const playerId = after.playerId;

    // --- Rate limiting: max N bids per user per time window ---
    try {
      if (bidderId) {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window
        const maxBids = 30;         // max 30 bids per minute

        const rlRef = db.ref(`rateLimits/bids/${bidderId}`);
        const rlSnap = await rlRef.get();
        let data = rlSnap.exists() ? rlSnap.val() : null;

        if (!data || typeof data.windowStart !== 'number' || now - data.windowStart > windowMs) {
          data = { windowStart: now, count: 0 };
        }

        data.count = (data.count || 0) + 1;
        await rlRef.set(data);

        if (data.count > maxBids) {
          // Delete the bid that exceeded the limit and bail out.
          await db.ref(`bids/${auctionId}/${bidId}`).remove();
          await createNotification(bidderId, {
            type: 'RATE_LIMIT',
            auctionId,
            itemId: playerId,
            message: 'You are bidding too frequently. Please slow down and try again in a moment.',
          });
          return null;
        }
      }
    } catch (rateErr) {
      console.error('Error applying bid rate limit:', rateErr);
    }

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
      const auctionRef = db.ref(`auctions/${auctionId}`);
      const auctionSnap = await auctionRef.get();
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
      // --- Anti-sniping: extend endDate if bid placed in final window ---
      try {
        const antiWindow = Number(auction.antiSnipingWindowMs) || 0;
        if (
          antiWindow > 0 &&
          auction.status === 'live' &&
          auction.endDate &&
          !auction.locked
        ) {
          const now = Date.now();
          const remaining = auction.endDate - now;
          // If within last 30 seconds, extend by antiSnipingWindowMs
          if (remaining > 0 && remaining <= 30000) {
            const newEnd = auction.endDate + antiWindow;
            await auctionRef.update({
              endDate: newEnd,
              antiSnipingExtendedAt: now,
            });
          }
        }
      } catch (extendErr) {
        console.error('Error applying anti-sniping extension:', extendErr);
      }
    } catch (e) {
      console.error('Error processing auto-bid logic:', e);
    }

    return null;
  });

/**
 * Trigger when auction document changes to send:
 * - AUCTION_START notification when status becomes 'live'
 * - WINNER notification when status becomes 'completed'
 *
 * Path: auctions/{auctionId}
 */
exports.onAuctionWrite = functions.database
  .ref('auctions/{auctionId}')
  .onWrite(async (change, context) => {
    const { auctionId } = context.params;
    const before = change.before.val();
    const after = change.after.val();

    if (!after) return null;

    const prevStatus = before && before.status;
    const newStatus = after.status;

    // Auction start: notify watchlist users
    if (newStatus === 'live' && prevStatus !== 'live') {
      try {
        const watchlistsSnap = await db.ref('watchlists').get();
        if (watchlistsSnap.exists()) {
          const tasks = [];
          watchlistsSnap.forEach((userSnap) => {
            const uid = userSnap.key;
            const userList = userSnap.val() || {};
            if (userList[auctionId]) {
              tasks.push(
                createNotification(uid, {
                  type: 'AUCTION_START',
                  auctionId,
                  message: `Auction "${after.title || 'Auction'}" is now live.`,
                })
              );
            }
          });
          await Promise.all(tasks);
        }
      } catch (e) {
        console.error('Error sending AUCTION_START notifications:', e);
      }
    }

    // Auction completed: winner announcement
    if (newStatus === 'completed' && prevStatus !== 'completed') {
      try {
        const bidsSnap = await db.ref(`bids/${auctionId}`).get();
        if (!bidsSnap.exists()) return null;

        let bestWon = null;
        bidsSnap.forEach((child) => {
          const bid = child.val();
          if (bid.status === 'won') {
            if (!bestWon || (bid.amount || 0) > (bestWon.amount || 0)) {
              bestWon = bid;
            }
          }
        });

        if (bestWon && bestWon.bidderId) {
          await createNotification(bestWon.bidderId, {
            type: 'WINNER',
            auctionId,
            itemId: bestWon.playerId,
            message: `You won "${bestWon.playerName || 'an item'}" in "${after.title || 'Auction'}".`,
          });
        }
      } catch (e) {
        console.error('Error sending WINNER notifications:', e);
      }
    }

    return null;
  });

/**
 * Scheduled function: every 5 minutes, scan live auctions and send
 * ENDING_SOON notifications to watchlist users when the auction is
 * within 10 minutes of ending (and not already flagged).
 */
exports.onEndingSoonCheck = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes

    try {
      const auctionsSnap = await db.ref('auctions').get();
      if (!auctionsSnap.exists()) return null;

      const watchlistsSnap = await db.ref('watchlists').get();
      const watchlists = watchlistsSnap.exists() ? watchlistsSnap.val() : {};

      const tasks = [];

      auctionsSnap.forEach((child) => {
        const auctionId = child.key;
        const auction = child.val();
        if (!auction || auction.status !== 'live') return;
        if (!auction.endDate) return;

        const remaining = auction.endDate - now;
        if (remaining <= 0) return;

        // Skip if already notified
        if (auction.endingSoonNotified) return;

        if (remaining <= windowMs) {
          // mark as notified
          tasks.push(
            db.ref(`auctions/${auctionId}/endingSoonNotified`).set(true)
          );

          // notify all watchlist users
          Object.entries(watchlists).forEach(([uid, list]) => {
            if (list && list[auctionId]) {
              tasks.push(
                createNotification(uid, {
                  type: 'ENDING_SOON',
                  auctionId,
                  message: `Auction "${auction.title || 'Auction'}" is ending soon. Place your final bids!`,
                })
              );
            }
          });
        }
      });

      await Promise.all(tasks);
    } catch (e) {
      console.error('Error in onEndingSoonCheck:', e);
    }

    return null;
  });

/**
 * Scheduled function: every minute, automatically lock live auctions
 * whose endDate has passed, preventing further bids.
 */
exports.onAutoLockCheck = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    const now = Date.now();
    try {
      const auctionsSnap = await db.ref('auctions').get();
      if (!auctionsSnap.exists()) return null;

      const tasks = [];

      auctionsSnap.forEach((child) => {
        const auctionId = child.key;
        const auction = child.val();
        if (!auction) return;
        if (auction.status !== 'live') return;
        if (auction.locked) return;
        if (!auction.endDate) return;

        if (auction.endDate <= now) {
          tasks.push(
            db.ref(`auctions/${auctionId}`).update({
              locked: true,
            })
          );
        }
      });

      await Promise.all(tasks);
    } catch (e) {
      console.error('Error in onAutoLockCheck:', e);
    }

    return null;
  });

module.exports = {
  onBidWrite: exports.onBidWrite,
  onAuctionWrite: exports.onAuctionWrite,
  onEndingSoonCheck: exports.onEndingSoonCheck,
  onAutoLockCheck: exports.onAutoLockCheck,
};

