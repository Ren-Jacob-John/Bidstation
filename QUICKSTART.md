# BidStation - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Extract the Project
```bash
tar -xzf bidding-website.tar.gz
cd bidding-website
```

### Step 2: Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Run the database script
mysql -u root -p < server/database.sql
```

### Step 3: Configure Environment
```bash
cd server
# Edit .env file with your database credentials
# Change DB_PASSWORD and JWT_SECRET
```

### Step 4: Install Dependencies & Start Server
```bash
# In server directory
npm install
npm start
# Server will run on http://localhost:5000
```

### Step 5: Install Dependencies & Start Client
```bash
# Open new terminal
cd client
npm install
npm run dev
# Client will run on http://localhost:3000
```

### Step 6: Access the Application
Open your browser and navigate to: `http://localhost:3000`

## 📋 Default Test Accounts

After running the app, register new accounts with these roles:

### Auctioneer Account
- Role: Select "Auctioneer" during registration
- Can create and manage auctions
- Can add players/items to auctions

### Bidder Account
- Role: Select "Bidder" (default)
- Can participate in auctions
- Can place bids on items

## 🎯 Key Features to Try

### 1. Create IPL Player Auction
1. Login as Auctioneer
2. Click "Create Auction"
3. Select "IPL Player" type
4. Add team names (e.g., Mumbai Indians, Chennai Super Kings)
5. Add players with details (name, role, base price, etc.)
6. Start the auction

### 2. Create Item Auction
1. Login as Auctioneer
2. Click "Create Auction"
3. Select "Item" type
4. Add items with images and descriptions
5. Set base prices
6. Start the auction

### 3. Place Bids
1. Login as Bidder
2. Browse available auctions
3. Join a live auction
4. Select a player/item
5. Place your bid (must be higher than current price)
6. Watch real-time updates

## 🎨 UI Features

### Theme Toggle
- Click the sun/moon icon in the navbar
- Switches between light and dark themes
- Preference is saved in localStorage

### Responsive Design
- Works on desktop, tablet, and mobile
- Optimized for all screen sizes

## 📊 Database Structure

### Tables
- **users**: Store user accounts and roles
- **auctions**: Store auction information
- **auction_items**: Store players/items for bidding
- **bids**: Store all bid history

### Relationships
- One auction has many items
- One item has many bids
- Items belong to an auction
- Bids belong to items and users

## 🔧 Customization

### Change Theme Colors
Edit `client/src/index.css`:
```css
:root {
  --accent-color: #yourcolor;
  --bg-color: #yourbackground;
}
```

### Modify API Endpoint
Edit `client/src/services/api.js`:
```javascript
const API_URL = 'http://your-api-url';
```

## 🐛 Troubleshooting

### Database Connection Error
- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `server/.env`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
Server (5000):
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

Client (3000):
```bash
# Change port in vite.config.js
server: { port: 3001 }
```

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## 📱 API Testing

Use tools like Postman or curl to test APIs:

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "bidder"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🎓 Learning Resources

### Technologies Used
- **React**: https://react.dev
- **Express**: https://expressjs.com
- **MySQL**: https://dev.mysql.com/doc
- **JWT**: https://jwt.io

### Project Structure
```
bidding-website/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app
│   └── package.json
│
└── server/          # Express backend
    ├── controllers/ # Business logic
    ├── routes/      # API routes
    ├── middleware/  # Auth middleware
    ├── config/      # Database config
    └── server.js    # Entry point
```

## 💡 Tips

1. **Use Developer Tools**: Press F12 in browser to see console logs
2. **Check Network Tab**: Monitor API calls in browser DevTools
3. **Database GUI**: Use phpMyAdmin or MySQL Workbench for easier database management
4. **Version Control**: Initialize git and commit regularly
5. **Environment Variables**: Never commit .env file to git

## 🤝 Need Help?

- Check the main README.md for detailed documentation
- Review server logs in terminal
- Check browser console for frontend errors
- Verify database connections

## 🎉 Happy Bidding!

Your BidStation platform is now ready to use. Create auctions, invite bidders, and enjoy the excitement of live bidding!
