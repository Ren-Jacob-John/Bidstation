# BidStation - Project Overview

## 📁 Complete File Structure

```
bidding-website/
├── README.md
├── .gitignore
│
├── client/                          # React Frontend Application
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js              # Vite configuration
│   │
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # Main App component
│       ├── index.css                # Global styles with theme variables
│       │
│       ├── components/              # Reusable Components
│       │   ├── Navbar.jsx          # Navigation bar with theme toggle
│       │   └── Navbar.css          # Navbar styles
│       │
│       ├── context/                 # React Context for State Management
│       │   ├── AuthContext.jsx     # Authentication state
│       │   └── ThemeContext.jsx    # Theme (dark/light) state
│       │
│       ├── pages/                   # Page Components
│       │   ├── Home.jsx            # Landing page
│       │   ├── Home.css            # Home page styles
│       │   ├── Login.jsx           # Login page (to be created)
│       │   ├── Register.jsx        # Registration page (to be created)
│       │   ├── Dashboard.jsx       # User dashboard (to be created)
│       │   ├── CreateAuction.jsx   # Create auction form (to be created)
│       │   ├── AuctionList.jsx     # List all auctions (to be created)
│       │   └── LiveAuction.jsx     # Live bidding interface (to be created)
│       │
│       └── services/                # API Service Layer
│           ├── api.js              # Axios configuration with interceptors
│           ├── authService.js      # Authentication API calls
│           └── auctionService.js   # Auction API calls
│
└── server/                          # Express Backend Application
    ├── server.js                    # Server entry point
    ├── package.json                 # Backend dependencies
    ├── .env                         # Environment variables (DB, JWT secret)
    ├── database.sql                 # MySQL database schema
    │
    ├── config/
    │   └── db.js                    # MySQL connection pool setup
    │
    ├── controllers/                 # Business Logic
    │   ├── authController.js       # Auth operations (register, login)
    │   └── auctionController.js    # Auction operations (CRUD, bidding)
    │
    ├── middleware/
    │   └── authMiddleware.js       # JWT token verification
    │
    └── routes/                      # API Routes
        ├── auth.routes.js          # Authentication routes
        └── auction.routes.js       # Auction routes
```

## 🎨 Design System

### Color Palette

#### Light Theme
- Background: `#ffffff` (White)
- Text: `#213547` (Dark blue-gray)
- Card Background: `#f3f4f6` (Light gray)
- Input Background: `#e5e7eb` (Medium gray)
- Accent: `#ef4444` (Red)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Orange)

#### Dark Theme
- Background: `#000000` (Black)
- Text: `#ffffff` (White)
- Card Background: `#111827` (Dark gray)
- Input Background: `#1f2933` (Darker gray)
- Accent: `#ef4444` (Red - same)

### Typography
- Font Family: System fonts (Segoe UI, Roboto, etc.)
- Headings: Font-weight 700 (Bold)
- Body: Font-weight 400 (Regular)
- Line Height: 1.5

### Components Styling

#### Buttons
- Border Radius: `0.5rem` (8px)
- Padding: `0.5rem 1.5rem`
- Hover Effect: Moves up 4px with enhanced shadow
- Transition: `0.2s ease`

#### Cards
- Border Radius: `1rem` (16px)
- Padding: `1.5rem`
- Shadow: Subtle on normal, enhanced on hover
- Hover Effect: Moves up 4px

#### Inputs
- Border Radius: `0.375rem` (6px)
- Padding: `0.75rem`
- Focus: Red outline (accent color)
- No border, uses background color

## 🔐 Authentication Flow

```
1. User Registration
   ├─> Frontend: Fill registration form
   ├─> Backend: POST /api/auth/register
   ├─> Validate input
   ├─> Hash password with bcrypt
   ├─> Insert user into database
   ├─> Generate JWT token
   └─> Return token + user data

2. User Login
   ├─> Frontend: Enter credentials
   ├─> Backend: POST /api/auth/login
   ├─> Verify email exists
   ├─> Compare password hash
   ├─> Generate JWT token
   └─> Return token + user data

3. Protected Routes
   ├─> Frontend: Include token in Authorization header
   ├─> Backend: authMiddleware validates token
   ├─> Decode JWT to get user info
   └─> Allow or deny access
```

## 🏏 IPL Auction Flow

```
1. Create Auction
   ├─> Auctioneer creates auction
   ├─> Set auction type: "ipl_player"
   ├─> Add team names (e.g., MI, CSK, RCB)
   ├─> Set start/end time
   └─> Status: "pending"

2. Add Players
   ├─> Add player details:
   │   ├─> Name
   │   ├─> Role (Batsman, Bowler, All-rounder)
   │   ├─> Base price
   │   ├─> Image
   │   └─> Stats (optional)
   └─> Players added to auction_items table

3. Start Auction
   ├─> Auctioneer starts auction
   ├─> Status changes to "live"
   ├─> Bidders can now place bids
   └─> Current player displayed

4. Bidding Process
   ├─> Bidder selects team
   ├─> Places bid > current price
   ├─> Backend validates bid
   ├─> Update current_price
   ├─> Record bid in bids table
   └─> Notify other bidders (future: WebSocket)

5. Complete Auction
   ├─> Auctioneer ends auction
   ├─> Status: "completed"
   ├─> Players marked as "sold" or "unsold"
   └─> Generate results report
```

## 🛍️ Item Auction Flow

```
1. Create Auction
   ├─> Set auction type: "item"
   ├─> Add auction details
   └─> Status: "pending"

2. Add Items
   ├─> Item name
   ├─> Description
   ├─> Category
   ├─> Base price
   ├─> Image
   └─> Add to auction

3. Bidding
   ├─> Similar to IPL auction
   ├─> No team selection required
   ├─> Highest bidder wins
   └─> Track bid history

4. Winner Determination
   ├─> Auction ends
   ├─> Highest bidder wins item
   └─> Mark as "sold"
```

## 🗄️ Database Schema Details

### Users Table
```sql
- id (PK, Auto-increment)
- username (VARCHAR 100, NOT NULL)
- email (VARCHAR 100, UNIQUE, NOT NULL)
- password (VARCHAR 255, NOT NULL) - bcrypt hashed
- role (ENUM: admin, auctioneer, bidder)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Auctions Table
```sql
- id (PK)
- title (VARCHAR 255)
- description (TEXT)
- auction_type (ENUM: ipl_player, item)
- start_time (DATETIME)
- end_time (DATETIME)
- creator_id (FK -> users.id)
- teams (JSON) - for IPL auctions
- status (ENUM: pending, live, completed, cancelled)
- created_at (TIMESTAMP)
```

### Auction Items Table
```sql
- id (PK)
- auction_id (FK -> auctions.id)
- name (VARCHAR 255)
- description (TEXT)
- base_price (DECIMAL 15,2)
- current_price (DECIMAL 15,2)
- current_bidder_id (FK -> users.id)
- category (VARCHAR 100)
- image_url (VARCHAR 500)
- player_details (JSON) - role, stats, etc.
- status (ENUM: available, sold, unsold)
- created_at (TIMESTAMP)
```

### Bids Table
```sql
- id (PK)
- item_id (FK -> auction_items.id)
- bidder_id (FK -> users.id)
- bid_amount (DECIMAL 15,2)
- team_name (VARCHAR 100) - for IPL auctions
- created_at (TIMESTAMP)
```

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "bidder"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "bidder"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { ... }
}
```

### Auction Endpoints

#### Create Auction
```http
POST /api/auction/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "IPL 2024 Mega Auction",
  "description": "Annual IPL player auction",
  "auctionType": "ipl_player",
  "startTime": "2024-02-01T10:00:00",
  "endTime": "2024-02-01T18:00:00",
  "teams": ["Mumbai Indians", "Chennai Super Kings", "Royal Challengers Bangalore"]
}

Response: 201 Created
{
  "message": "Auction created successfully",
  "auctionId": 1
}
```

#### Place Bid
```http
POST /api/auction/bid
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": 5,
  "bidAmount": 5000000,
  "teamName": "Mumbai Indians"
}

Response: 201 Created
{
  "message": "Bid placed successfully",
  "bidId": 123
}
```

## 🚀 Deployment Options

### Option 1: Traditional Hosting
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: AWS RDS, DigitalOcean Managed MySQL

### Option 2: Docker Containers
```dockerfile
# Dockerfile for backend
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Option 3: Full Stack Platform
- Render.com
- Railway.app
- Fly.io

## 📈 Future Enhancements

### Phase 2 Features
- [ ] WebSocket for real-time bidding updates
- [ ] Email notifications
- [ ] Payment integration
- [ ] Auction analytics and reports
- [ ] User ratings and reviews
- [ ] Admin dashboard
- [ ] Mobile app (React Native)

### Phase 3 Features
- [ ] Video streaming for live auctions
- [ ] AI-based price predictions
- [ ] Multi-currency support
- [ ] Escrow system
- [ ] Blockchain integration for transparency

## 🎯 Key Features Summary

✅ **Completed**
- User authentication with JWT
- Role-based access control
- Dark/Light theme toggle
- Create IPL and Item auctions
- Add players/items to auctions
- Place bids
- Track bid history
- Responsive design
- RESTful API
- MySQL database with proper relationships

🔄 **To Be Implemented** (Template provided, needs frontend pages)
- Login/Register pages
- Dashboard
- Live auction interface
- Admin panel
- Real-time updates
- Image upload
- Search and filter

---

This project provides a solid foundation for a full-featured bidding platform. The architecture is scalable, the code is well-organized, and the styling matches your reference design.
