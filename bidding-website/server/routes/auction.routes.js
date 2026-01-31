const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Auction CRUD
router.post('/create', auctionController.createAuction);
router.get('/all', auctionController.getAllAuctions);
router.get('/:id', auctionController.getAuctionById);
router.post('/start/:id', auctionController.startAuction);
router.post('/end/:id', auctionController.endAuction);

// Item management
router.post('/items/add', auctionController.addItem);
router.get('/items/:auctionId', auctionController.getAuctionItems);

// Bidding
router.post('/bid', auctionController.placeBid);
router.get('/bids/:itemId', auctionController.getItemBids);

// User-specific routes
router.get('/my-bids', auctionController.getMyBids);
router.get('/my-auctions', auctionController.getMyAuctions);

module.exports = router;
