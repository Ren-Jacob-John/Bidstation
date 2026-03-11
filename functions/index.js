const admin = require('firebase-admin');

// Initialize admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------------------------------------------------------------------------
// Realtime-Database triggers and scheduled functions (notifications module)
// Must be exported at the TOP LEVEL so Firebase recognises them as triggers.
// Wrapping them under a namespace (exports.notifications = require(...))
// breaks database path triggers — they deploy but never fire.
// ---------------------------------------------------------------------------
const notifications = require('./notifications');
exports.onBidWrite        = notifications.onBidWrite;
exports.onAuctionWrite    = notifications.onAuctionWrite;
exports.onEndingSoonCheck = notifications.onEndingSoonCheck;
exports.onAutoLockCheck   = notifications.onAutoLockCheck;

// ---------------------------------------------------------------------------
// Callable Cloud Functions
// ---------------------------------------------------------------------------
const autobid   = require('./autobid');
exports.setAutoBid = autobid.setAutoBid;

const analytics = require('./analytics');
exports.getAdminAnalytics = analytics.getAdminAnalytics;

const recaptcha = require('./recaptcha');
exports.verifyRecaptcha = recaptcha.verifyRecaptcha;

