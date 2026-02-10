# BidStation - Final Project Structure

Complete Firebase-based sports auction platform with React frontend.

---

## Directory Structure

```
bidstation/
│
├── client/                          # React Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Navbar.css
│   │   │   ├── PlayerCard.jsx
│   │   │   ├── PlayerCard.css
│   │   │   ├── AuctionCard.jsx
│   │   │   ├── AuctionCard.css
│   │   │   ├── BidHistory.jsx
│   │   │   └── BidHistory.css
│   │   │
│   │   ├── context/                 # React Context Providers
│   │   │   └── AuthContext.jsx      # Firebase Auth state management
│   │   │
│   │   ├── firebase/                # Firebase Configuration
│   │   │   └── firebase.config.js   # Firebase initialization & exports
│   │   │
│   │   ├── pages/                   # Page Components (11 total)
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Home.css
│   │   │   ├── Login.jsx            # Firebase login
│   │   │   ├── Login.css
│   │   │   ├── Register.jsx         # Firebase registration
│   │   │   ├── Register.css
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Dashboard.css
│   │   │   ├── CreateAuction.jsx    # 4-step auction wizard
│   │   │   ├── CreateAuction.css
│   │   │   ├── LiveAuction.jsx      # Real-time bidding interface
│   │   │   ├── LiveAuction.css
│   │   │   ├── AuctionDetails.jsx   # Auction information page
│   │   │   ├── AuctionDetails.css
│   │   │   ├── AuctionList.jsx      # Browse all auctions
│   │   │   ├── AuctionList.css
│   │   │   ├── MyBids.jsx           # User's bid history
│   │   │   ├── MyBids.css
│   │   │   ├── MyAuctions.jsx       # Auctioneer's auction list
│   │   │   ├── MyAuctions.css
│   │   │   ├── Profile.jsx          # User profile settings
│   │   │   ├── Profile.css
│   │   │   ├── VerifyEmail.jsx      # Email verification handler
│   │   │   ├── VerifyEmail.css
│   │   │   ├── ForgotPassword.jsx   # Password reset request
│   │   │   ├── ForgotPassword.css
│   │   │   ├── ResetPassword.jsx    # Password reset form
│   │   │   └── ResetPassword.css
│   │   │
│   │   ├── services/                # API & Service Layer
│   │   │   └── authService.js       # Firebase Auth operations
│   │   │
│   │   ├── App.jsx                  # Main app component with routing
│   │   ├── App.css                  # Global styles
│   │   ├── index.css                # Reset & base styles
│   │   └── main.jsx                 # React entry point
│   │
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── firebase/                        # Firebase Backend Configuration
│   ├── firestore.rules              # Security rules for Firestore
│   ├── firestore.indexes.json       # Database indexes (auto-generated)
│   ├── firebase.json                # Firebase project config
│   └── .firebaserc                  # Firebase project aliases
│
├── docs/                            # Documentation
│   ├── FIREBASE_MIGRATION_GUIDE.md  # Migration from MySQL to Firebase
│   ├── PROJECT_OVERVIEW.md          # High-level project description
│   ├── PAGES_DOCUMENTATION.md       # All pages & features
│   ├── SETUP_GUIDE.md               # Installation & setup
│   └── API_DOCUMENTATION.md         # Firebase service methods
│
├── .gitignore
├── README.md                        # Project readme (you are here)
└── LICENSE

```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Vite** - Build tool & dev server
- **CSS3** - Styling (no frameworks - custom design)

### Backend (Firebase)
- **Firebase Authentication** - Email/password auth with verification
- **Cloud Firestore** - NoSQL database for users, auctions, bids
- **Firebase Hosting** (optional) - Static site hosting
- **Firebase Functions** (future) - Serverless backend logic

### Development Tools
- **ESLint** - Code linting
- **Firebase CLI** - Deployment & management

---

## Data Schema (Firestore)

### Collections

**users/{uid}**
```javascript
{
  uid: string,              // Firebase Auth UID
  username: string,
  email: string,
  role: 'bidder' | 'auctioneer',
  emailVerified: boolean,
  createdAt: timestamp
}
```

**auctions/{auctionId}**
```javascript
{
  id: string,
  title: string,
  sport: string,            // IPL, PKL, ISL, etc.
  startDate: timestamp,
  endDate: timestamp,
  status: 'upcoming' | 'live' | 'completed',
  totalBudget: number,
  createdBy: string,        // User UID
  createdAt: timestamp,
  playerCount: number,
  description: string
}
```

**auctions/{auctionId}/bids/{bidId}**
```javascript
{
  id: string,
  auctionId: string,
  playerId: string,
  bidderId: string,         // User UID
  bidderName: string,
  amount: number,
  timestamp: timestamp,
  status: 'active' | 'outbid' | 'won'
}
```

**players/{playerId}**
```javascript
{
  id: string,
  name: string,
  sport: string,
  role: string,             // Batsman, Bowler, Defender, etc.
  basePrice: number,
  imageUrl: string,
  stats: object,            // Sport-specific statistics
  nationality: string
}
```

---

## Features by Page

### Public Pages
1. **Home** - Landing page with hero section & features
2. **Login** - Firebase email/password authentication
3. **Register** - Account creation with email verification
4. **Forgot Password** - Password reset flow
5. **Reset Password** - New password entry
6. **Verify Email** - Email verification handler

### Protected Pages (Require Login)
7. **Dashboard** - User overview, stats, quick actions
8. **Create Auction** - 4-step wizard (Details → Sport → Budget → Players)
9. **Live Auction** - Real-time bidding interface with WebSocket-style updates
10. **Auction Details** - View auction info, player list, bid history
11. **Auction List** - Browse all available auctions
12. **My Bids** - User's bidding history & wins
13. **My Auctions** - Auctioneer's created auctions
14. **Profile** - Edit username, change password, view stats

---

## User Roles

### Bidder
- Browse auctions
- Place bids on players
- View bid history
- Track wins & losses

### Auctioneer
- Create auctions
- Set budgets & rules
- Manage player lists
- Monitor bidding activity

---

## Authentication Flow

### Registration
1. User fills registration form
2. Firebase creates account
3. Firestore `users/{uid}` document created
4. Verification email sent automatically
5. User can login immediately (unverified)
6. Email verification enables full features

### Login
1. User enters email/password
2. Firebase validates credentials
3. `AuthContext` updates with user data
4. Protected routes become accessible
5. Token refresh handled automatically

### Password Reset
1. User clicks "Forgot Password"
2. Enters email address
3. Firebase sends reset link
4. Link opens `/reset-password` page
5. User enters new password
6. Firebase updates password
7. Confirmation email sent

### Email Verification
1. Firebase sends verification link on registration
2. Link opens `/verify-email` page
3. Firebase validates token
4. `emailVerified` flag set to `true`
5. Full platform access granted

---

## Security

### Firestore Rules
- Users can only read/write their own profile
- Auctioneers can create/update their own auctions
- Anyone can read auctions & bids
- Only bidder can create their own bid
- Bids are immutable once placed

### Firebase Auth
- Email verification required for sensitive actions
- Password reset tokens expire in 1 hour
- Verification tokens expire in 24 hours
- Account lockout after multiple failed logins
- Secure password hashing (handled by Firebase)

---

## Supported Sports

1. **IPL** - Indian Premier League (Cricket)
2. **PKL** - Pro Kabaddi League
3. **ISL** - Indian Super League (Football)
4. **HIL** - Hockey India League
5. **PBL** - Premier Badminton League
6. **UTT** - Ultimate Table Tennis
7. **PVL** - Pro Volleyball League
8. **IBL** - Indian Basketball League
9. **PWL** - Pro Wrestling League

Each sport has specific player roles and statistics.

---

## Design System

### Color Palette
- **Primary Gradient**: Red (#ef4444) to Orange (#f59e0b)
- **Background**: White (#ffffff)
- **Cards**: Light gray (#f9fafb)
- **Text**: Dark gray (#1f2937)
- **Success**: Green (#22c55e)
- **Error**: Red (#ef4444)
- **Warning**: Yellow (#f59e0b)

### Typography
- **Font Family**: System fonts (sans-serif)
- **Headings**: Bold, larger sizes
- **Body**: Regular weight, readable size
- **Buttons**: Medium weight, uppercase

### Layout
- **Max Width**: 1200px centered containers
- **Spacing**: Consistent 8px grid system
- **Border Radius**: 8px for cards, 4px for inputs
- **Shadows**: Subtle elevation for cards

---

## Environment Variables

### Client (.env)
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Deployment

### Frontend (Firebase Hosting)
```bash
cd client
npm run build
firebase deploy --only hosting
```

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Complete Deployment
```bash
firebase deploy
```

---

## Development Workflow

1. **Local Development**
   ```bash
   cd client
   npm run dev          # Runs on http://localhost:3000
   ```

2. **Testing**
   - Manual testing in development mode
   - Use Firebase Emulator Suite for offline development

3. **Building**
   ```bash
   npm run build        # Creates production build in dist/
   ```

4. **Deployment**
   ```bash
   firebase deploy      # Deploys to Firebase Hosting
   ```

---

## Performance Optimizations

- **Code Splitting**: React.lazy() for route-based splitting
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Components loaded on-demand
- **Caching**: Firebase caches auth state & Firestore data
- **Minification**: Vite minifies JS/CSS for production
- **Compression**: Firebase Hosting serves gzip/brotli

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

---

## Future Enhancements

### Phase 2
- Real-time bidding with Firestore realtime listeners
- Push notifications for bid updates
- Team formation after auction ends
- Budget tracking & spending analytics

### Phase 3
- Admin dashboard for platform management
- Player statistics & performance tracking
- Auction scheduling & reminders
- Payment integration for premium features

### Phase 4
- Mobile app (React Native)
- Social features (comments, sharing)
- AI-powered player recommendations
- Historical data & trend analysis

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: support@bidstation.com
- Documentation: docs.bidstation.com

---

**BidStation** - The Ultimate Sports Player Auction Platform 🏏🏀⚽
