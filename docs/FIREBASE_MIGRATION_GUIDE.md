# BidStation — Firebase Migration Guide

Everything you need to switch from Express + MySQL + nodemailer to Firebase Auth + Firestore.

---

## What changes (and what stays)

| Layer | Before (MySQL stack) | After (Firebase) |
|---|---|---|
| Auth (register / login / logout) | Express `authController` + `bcrypt` + `JWT` | Firebase Authentication (Email / Password) |
| Token management | `localStorage` JWT + axios interceptor | Firebase manages tokens internally |
| User profile storage | MySQL `users` table | Firestore `users/{uid}` document |
| Email verification | Custom tokens + nodemailer | Firebase built-in `sendVerificationEmail` |
| Password reset | Custom tokens + nodemailer | Firebase built-in `sendPasswordResetEmail` |
| Auction / bid data | MySQL tables | Firestore collections (`auctions`, `bids`, `players`) |
| Frontend routing | Same React Router setup | One extra route: `/auth/action` |
| CSS / UI | Unchanged | Unchanged |

**You can delete** once the migration is done: `server/` directory entirely (Express app, controllers, routes, middleware, db config, nodemailer, database.sql). The client no longer talks to a custom backend for auth.

---

## Step 1 — Create a Firebase project

1. Go to <https://console.firebase.google.com>
2. Click **Create a project** → give it a name (e.g. `bidstation`)
3. Disable Google Analytics when prompted (optional, keeps things simple)
4. Inside the project dashboard click **Add app → Web (</>)**
5. Give the web app a nickname (`BidStation Web`)
6. Copy the config object that appears — you'll need it in Step 3

---

## Step 2 — Enable the services you need

Inside the Firebase Console:

**Authentication**
1. Left sidebar → **Authentication** → **Get started**
2. Under *Sign-in method* enable **Email / Password**
3. (Optional) Enable *Email verification required* if you want Firebase to block login until verified

**Firestore Database**
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose a region (pick one close to your users)
3. Start in **test mode** for now (you'll deploy real rules later)

---

## Step 3 — Install packages in the React client

```bash
cd client
npm install firebase
```

That single package gives you Auth, Firestore, and everything else.

---

## Step 4 — Place the new files

Copy the files from the outputs folder into your `client/src` tree exactly like this:

```
client/src/
├── firebase/
│   └── firebase.config.js        ← NEW  (create the folder)
├── context/
│   └── AuthContext.jsx            ← REPLACE
├── services/
│   └── authService.js            ← REPLACE
├── pages/
│   ├── VerifyEmail.jsx           ← REPLACE
│   ├── ForgotPassword.jsx        ← REPLACE
│   └── ResetPassword.jsx         ← REPLACE
└── App.jsx                       ← REPLACE
```

> The CSS files (`VerifyEmail.css`, `ForgotPassword.css`, `ResetPassword.css`) stay exactly the same — no changes needed.

---

## Step 5 — Fill in firebase.config.js

Open `client/src/firebase/firebase.config.js` and replace every `YOUR_…` placeholder with the values you copied in Step 1.

```js
const firebaseConfig = {
  apiKey:             'AIzaSy…',             // ← paste here
  authDomain:         'bidstation.firebaseapp.com',
  projectId:          'bidstation',
  storageBucket:      'bidstation.firebasestorage.app',
  messagingSenderId:  '1234567890',
  appId:              '1:123…',
};
```

---

## Step 6 — Configure the email-action URL

Firebase sends verification and password-reset emails with links that point back to your app. You need to tell Firebase where.

1. Firebase Console → **Authentication** → **Templates** (gear icon)
2. Click the pencil ✏️ next to the **Email Verification** template
3. Under **Action URL** enter:  
   `http://localhost:3000/auth/action`   (for development)  
   or your production domain later
4. Do the same for the **Password Reset** template

> **Why `/auth/action`?**  
> Firebase appends `?mode=verifyEmail&oobCode=…` (or `mode=resetPassword`) to whatever URL you give it. The `FirebaseActionRouter` component inside `App.jsx` reads those params and redirects to the right page (`/verify-email` or `/reset-password`).

---

## Step 7 — (Optional) Deploy Firestore security rules

A `firestore.rules` file is included in the outputs. To deploy it:

```bash
# One-time global install (if you haven't already)
npm install -g firebase-tools

# Log in
firebase login

# In your project root (not client/)
firebase init firestore

# Copy firestore.rules into the project root, then
firebase deploy --only firestore:rules
```

For local development you can leave Firestore in **test mode** and skip this step entirely.

---

## Step 8 — Remove the old backend (optional but recommended)

Once you've confirmed everything works you no longer need:

* `server/` — the entire Express application
* `client/src/services/api.js` — the axios wrapper (nothing imports it any more)
* Any `.env` variables that were only used by the server (`DB_HOST`, `DB_USER`, `JWT_SECRET`, `EMAIL_USER`, etc.)

---

## Step 9 — Start and test

```bash
cd client
npm run dev          # Vite dev server on http://localhost:3000
```

### Quick smoke-test checklist

| Action | What to verify |
|---|---|
| Open `/` | Home page loads, Navbar shows "Login" |
| Register a new user | Account appears in Firebase Console → Auth → Users |
| Check inbox | Verification email arrives (from `noreply@…firebaseapp.com`) |
| Click the verify link | Lands on `/verify-email`, shows success, redirects to dashboard |
| Log out → Forgot password | Enter email → check inbox for reset link |
| Click reset link | Lands on `/reset-password`, enter new password, success screen |
| Log in with new password | Works, profile page shows correct data |
| Open Firestore Console | `users/{uid}` document exists with username, role, etc. |

---

## Common gotchas

**"Firebase: Error (auth/operation-not-allowed)"**  
You haven't enabled Email/Password sign-in in the Authentication console. Go back to Step 2.

**Verification email never arrives**  
Check Firebase Console → Authentication → Users → click the user → there's a "Send verification email" button you can use manually. Also check spam.

**Reset link goes to `firebaseapp.com` instead of localhost**  
You haven't set the Action URL (Step 6). Go back and set it to `http://localhost:3000/auth/action`.

**"auth/too-many-requests"**  
Firebase rate-limits failed logins. Wait a few minutes or check the Google Cloud Console for the reCAPTCHA settings.

**Firestore permission denied**  
You're still in test mode with an expiry date, or you deployed rules that are too restrictive. Check the Firestore Console → Rules tab for the exact error.

---

## Production checklist (when you're ready to deploy)

- [ ] Replace `http://localhost:3000` in Firebase Action URLs with your real domain
- [ ] Deploy `firestore.rules` with tightened permissions
- [ ] Set Firestore to **production mode**
- [ ] Add your production domain to the Firebase **Authorised domains** list (Authentication → Sign-in method → scroll down)
- [ ] Remove any leftover `server/` code from your repo
- [ ] Set up a CI/CD pipeline that runs `firebase deploy`
