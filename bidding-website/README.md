# BidStation - IPL Player & Item Bidding Platform

A comprehensive bidding platform supporting both IPL player auctions and general item bidding.

## Features

### 🏏 IPL Player Bidding
- Create IPL-style player auctions
- Team-based bidding system
- Player statistics and details
- Live bidding interface

### 🛍️ Item Auctions
- General item bidding
- Category-based organization
- Image upload support
- Real-time bid updates

### 👤 User Management
- User registration and authentication
- Role-based access (Admin, Auctioneer, Bidder)
- Profile management

### 🎨 UI/UX
- Dark/Light theme toggle
- Responsive design
- Modern CSS styling
- Smooth animations

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- Vite

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

### Database Setup

1. Create MySQL database:
```bash
mysql -u root -p < server/database.sql
```

2. Update database credentials in `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bidding_platform
JWT_SECRET=your_secret_key
```

### Server Setup

```bash
cd server
npm install
npm run dev
```

Server will run on `http://localhost:5000`

### Client Setup

```bash
cd client
npm install
npm run dev
```

Client will run on `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Auctions
- POST `/api/auction/create` - Create auction
- GET `/api/auction/all` - Get all auctions
- GET `/api/auction/:id` - Get auction by ID
- POST `/api/auction/start/:id` - Start auction
- POST `/api/auction/end/:id` - End auction

### Items
- POST `/api/auction/items/add` - Add item to auction
- GET `/api/auction/items/:auctionId` - Get auction items

### Bids
- POST `/api/auction/bid` - Place bid
- GET `/api/auction/bids/:itemId` - Get item bids

## Project Structure

```
bidding-website/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateAuction.jsx
│   │   │   ├── AuctionList.jsx
│   │   │   └── LiveAuction.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── auctionService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   └── auctionController.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── routes/
    │   ├── auth.routes.js
    │   └── auction.routes.js
    ├── database.sql
    ├── server.js
    ├── package.json
    └── .env
```

## Usage

### Creating an Auction

1. Register/Login as an auctioneer
2. Navigate to "Create Auction"
3. Select auction type (IPL Player or Item)
4. Fill in auction details
5. Add players/items
6. Start the auction

### Bidding

1. Browse available auctions
2. Join an auction
3. Select a player/item
4. Place your bid
5. Track bidding history

## Styling Theme

The application uses CSS custom properties for theming:

- Light Theme: Clean white background with gray accents
- Dark Theme: Black background with dark gray accents
- Accent Color: Red (#ef4444)
- Smooth hover effects and transitions
- Card-based UI with shadows

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- SQL injection prevention with parameterized queries

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support, email support@bidstation.com or create an issue in the repository.
