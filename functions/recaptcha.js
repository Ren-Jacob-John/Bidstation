const functions = require('firebase-functions');
const fetch = require('node-fetch');

const RECAPTCHA_SECRET = functions.config().recaptcha && functions.config().recaptcha.secret;

exports.verifyRecaptcha = functions.https.onCall(async (data, context) => {
  const token = data && data.token;
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing reCAPTCHA token.');
  }
  if (!RECAPTCHA_SECRET) {
    throw new functions.https.HttpsError('failed-precondition', 'reCAPTCHA secret not configured.');
  }

  const params = new URLSearchParams();
  params.append('secret', RECAPTCHA_SECRET);
  params.append('response', token);

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const json = await res.json();
  if (!json.success) {
    throw new functions.https.HttpsError('permission-denied', 'reCAPTCHA verification failed.');
  }

  return { success: true, score: json.score || null };
});

module.exports = {
  verifyRecaptcha: exports.verifyRecaptcha,
};

