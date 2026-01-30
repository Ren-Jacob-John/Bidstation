const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const authMiddleware = require('../middleware/authMiddleware');

// All auction routes require authentication
router.use(authMiddleware);

// Auction routes
router.post('/create', auctionController.createAuction);
router.get('/all', auctionController.getAllAuctions);
router.get('/:id', auctionController.getAuctionById);
router.post('/start/:id', auctionController.startAuction);
router.post('/end/:id', auctionController.endAuction);

// Item routes
router.post('/items/add', auctionController.addAuctionItem);
router.get('/items/:auctionId', auctionController.getAuctionItems);

// Bid routes
router.post('/bid', auctionController.placeBid);
router.get('/bids/:itemId', auctionController.getItemBids);

module.exports = router;
