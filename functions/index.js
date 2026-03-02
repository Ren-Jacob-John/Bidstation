const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export grouped function modules
exports.notifications = require('./notifications');
exports.autobid = require('./autobid');
exports.analytics = require('./analytics');
exports.recaptcha = require('./recaptcha');

