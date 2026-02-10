# BidStation 🏏

**The Ultimate Sports Player Auction Platform**

A complete web application for conducting live player auctions across 9 different sports leagues (IPL, PKL, ISL, and more). Built with React and Firebase for real-time bidding, secure authentication, and scalable data storage.

---

## 🚀 Features

### Core Functionality
- ✅ **Multi-Sport Support** - 9 different sports leagues (Cricket, Kabaddi, Football, etc.)
- ✅ **User Authentication** - Firebase Auth with email verification
- ✅ **Role-Based Access** - Bidder and Auctioneer roles
- ✅ **Live Auctions** - Real-time bidding interface
- ✅ **Auction Creation** - 4-step wizard for auctioneers
- ✅ **Bid Tracking** - Complete history of all bids
- ✅ **Profile Management** - User settings and statistics
- ✅ **Password Reset** - Secure forgot password flow
- ✅ **Email Verification** - Account verification system

### User Experience
- 🎨 **Beautiful UI** - Red/orange gradient design system
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Vite build system with code splitting
- 🔒 **Secure** - Firebase security rules and auth protection
- 🌐 **Real-time Updates** - Firestore real-time listeners
- 💾 **Offline Support** - Firebase caching for offline access

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/bidstation.git
cd bidstation

# 2. Install dependencies
cd client
npm install

# 3. Set up Firebase
# - Create a Firebase project at https://console.firebase.google.com
# - Enable Authentication (Email/Password)
# - Create Firestore Database
# - Copy your config values

# 4. Configure environment
cp .env.example .env
# Edit .env with your Firebase config values

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

---

## 🔧 Installation

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Firebase Account** (free tier works fine)
- **Git** for version control

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bidstation.git
cd bidstation
```

#### 2. Install Client Dependencies

```bash
cd client
npm install
```

#### 3. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name (e.g., "bidstation")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

#### 4. Enable Firebase Services

**Authentication:**
1. Left sidebar → **Authentication** → **Get started**
2. Click **"Email/Password"** → Enable → Save

**Firestore Database:**
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose region closest to your users
3. Start in **Test mode** (we'll add rules later)
4. Click **"Create"**

#### 5. Get Firebase Configuration

1. In Firebase Console, click gear icon ⚙️ → **Project settings**
2. Scroll to **"Your apps"** → Click **Web** icon (`</>`)
3. Register app with nickname "BidStation Web"
4. Copy the `firebaseConfig` object

#### 6. Configure Environment Variables

```bash
cd client
cp .env.example .env
```

Edit `.env` and paste your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### 7. Configure Email Action URLs

1. Firebase Console → **Authentication** → **Templates** (top-right gear icon)
2. Click pencil ✏️ next to **Email address verification**
3. Set Action URL to: `http://localhost:3000/auth/action`
4. Do the same for **Password reset**

#### 8. Deploy Firestore Security Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (in project root)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## ⚙️ Configuration

### Firebase Configuration

Create `client/src/firebase/firebase.config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const fireAuth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
```

### Firestore Security Rules

Located in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{default}/documents {
    // Users can read/write only their own document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    
    // Anyone can read auctions, only creators can write
    match /auctions/{auctionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.createdBy == request.auth.uid;
      allow update, delete: if request.auth != null 
                          && resource.data.createdBy == request.auth.uid;
    }
    
    // Anyone can read bids, only bidder can create their own
    match /auctions/{auctionId}/bids/{bidId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.bidderId == request.auth.uid;
    }
  }
}
```

---

## 🎯 Usage

### Creating an Account

1. Navigate to **Register** page
2. Enter username, email, password
3. Select role: **Bidder** or **Auctioneer**
4. Click **"Create Account"**
5. Check email for verification link
6. Click verification link
7. Login with your credentials

### Creating an Auction (Auctioneer)

1. Login as Auctioneer
2. Click **"Create Auction"** in Dashboard
3. **Step 1:** Enter auction details (title, dates)
4. **Step 2:** Select sport (IPL, PKL, ISL, etc.)
5. **Step 3:** Set budget and rules
6. **Step 4:** Add players to auction
7. Click **"Create Auction"**

### Placing Bids (Bidder)

1. Login as Bidder
2. Navigate to **Auctions** page
3. Click on a live auction
4. Browse available players
5. Click **"Place Bid"** on a player
6. Enter bid amount
7. Confirm bid
8. Track in **"My Bids"** page

### Managing Profile

1. Click profile icon → **Profile**
2. Update username
3. Change password
4. View account statistics
5. Manage notification preferences

---

## 📁 Project Structure

```
bidstation/
├── client/                      # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PlayerCard.jsx
│   │   │   └── AuctionCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── firebase/
│   │   │   └── firebase.config.js
│   │   ├── pages/               # 14 page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateAuction.jsx
│   │   │   ├── LiveAuction.jsx
│   │   │   ├── AuctionDetails.jsx
│   │   │   ├── AuctionList.jsx
│   │   │   ├── MyBids.jsx
│   │   │   ├── MyAuctions.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── services/
│   │   │   └── authService.js   # Firebase Auth API
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── firebase/
│   ├── firestore.rules
│   └── firebase.json
├── docs/
│   ├── FIREBASE_MIGRATION_GUIDE.md
│   ├── PROJECT_STRUCTURE.md
│   └── SETUP_GUIDE.md
└── README.md
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **React Router** | Client-side routing | 6.x |
| **Vite** | Build tool & dev server | 5.x |
| **CSS3** | Styling | - |

### Backend (Firebase)
| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | User auth with email/password |
| **Cloud Firestore** | NoSQL database for data storage |
| **Firebase Hosting** | Static site hosting |
| **Firebase Functions** | Serverless backend (future) |

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Firebase CLI** | Deployment & management |
| **Git** | Version control |

---

## 📜 Available Scripts

### Development

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# View deployment history
firebase hosting:channel:list

# Open Firebase console
firebase open
```

---

## 🚀 Deployment

### Deploy to Firebase Hosting

1. **Build the application:**
   ```bash
   cd client
   npm run build
   ```

2. **Initialize Firebase (first time only):**
   ```bash
   firebase init hosting
   # Choose: Use existing project
   # Public directory: dist
   # Single-page app: Yes
   # Automatic builds: No
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Your app is now live!**
   ```
   https://your-project-id.web.app
   ```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Production Checklist

Before deploying to production:

- [ ] Update Firebase Action URLs to production domain
- [ ] Deploy Firestore security rules
- [ ] Set up custom domain (optional)
- [ ] Enable Firebase Analytics (optional)
- [ ] Set up error monitoring
- [ ] Configure CORS if using Cloud Functions
- [ ] Add your domain to Firebase Authorized Domains
- [ ] Test all auth flows in production
- [ ] Update environment variables for production

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [FIREBASE_MIGRATION_GUIDE.md](docs/FIREBASE_MIGRATION_GUIDE.md) | Guide for migrating from MySQL to Firebase |
| [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Complete project structure & architecture |
| [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | Detailed setup instructions |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Firebase service methods & usage |

---

## 🎨 Design System

### Colors
```css
--primary-red: #ef4444;
--primary-orange: #f59e0b;
--background: #ffffff;
--card-bg: #f9fafb;
--text-primary: #1f2937;
--success: #22c55e;
--error: #ef4444;
```

### Typography
- Font Family: System fonts (sans-serif)
- Headings: 24px - 48px, bold
- Body: 16px, regular
- Small: 14px

### Components
- Border Radius: 8px (cards), 4px (inputs)
- Shadows: `0 1px 3px rgba(0,0,0,0.1)`
- Spacing: 8px grid system

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User can register
- [ ] User receives verification email
- [ ] User can verify email
- [ ] User can login
- [ ] User can logout
- [ ] User can reset password
- [ ] Invalid credentials show error

**Auctions:**
- [ ] Auctioneer can create auction
- [ ] Bidder can view auctions
- [ ] Bidder can place bid
- [ ] Bid history displays correctly
- [ ] Auction status updates

**Profile:**
- [ ] User can update username
- [ ] User can change password
- [ ] Statistics display correctly

---

## 🐛 Troubleshooting

### Common Issues

**"Firebase: Error (auth/operation-not-allowed)"**
- Enable Email/Password authentication in Firebase Console

**Verification email not arriving**
- Check spam folder
- Verify email templates in Firebase Console
- Check Action URL is set correctly

**"Permission denied" in Firestore**
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify UID matches document path

**Build errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`

**Port 3000 already in use**
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or use different port: `npm run dev -- --port 3001`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Use functional components with hooks
- Follow existing file structure
- Write meaningful commit messages
- Add comments for complex logic
- Test before submitting PR

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 BidStation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Team & Support

### Project Maintainers
- **Lead Developer** - [Your Name](https://github.com/yourusername)

### Support Channels
- 📧 Email: support@bidstation.com
- 💬 Discord: [Join our server](https://discord.gg/bidstation)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/bidstation/issues)
- 📖 Docs: [Documentation Site](https://docs.bidstation.com)

### Acknowledgments
- Firebase team for excellent documentation
- React community for helpful resources
- All contributors who have helped improve this project

---

## 🗺️ Roadmap

### Version 1.0 (Current) ✅
- User authentication & authorization
- Multi-sport auction support
- Real-time bidding interface
- Profile management
- Email verification

### Version 1.1 (Next) 🚧
- [ ] Real-time updates with Firestore listeners
- [ ] Push notifications
- [ ] Team formation post-auction
- [ ] Budget tracking dashboard

### Version 2.0 (Future) 📋
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Payment integration
- [ ] Social features (comments, sharing)
- [ ] AI-powered player recommendations

### Version 3.0 (Long-term) 🔮
- [ ] Live video streaming
- [ ] Chat system
- [ ] Analytics & insights
- [ ] Multi-language support
- [ ] WhatsApp integration

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/bidstation?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/bidstation?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/bidstation)
![GitHub license](https://img.shields.io/github/license/yourusername/bidstation)

---

## 🌟 Show Your Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation
- 🔀 Contributing code

---

<div align="center">

**Built with ❤️ using React & Firebase**

[Website](https://bidstation.com) • [Documentation](https://docs.bidstation.com) • [Report Bug](https://github.com/yourusername/bidstation/issues) • [Request Feature](https://github.com/yourusername/bidstation/issues)

</div>
