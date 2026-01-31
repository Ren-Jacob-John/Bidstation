import api from './api';

export const auctionService = {
  async createAuction(auctionData) {
    const response = await api.post('/auction/create', auctionData);
    return response.data;
  },

  async getAllAuctions() {
    const response = await api.get('/auction/all');
    // Handle both array response and {auctions: array} format
    return response.data.auctions || response.data;
  },

  async getAuctionById(id) {
    const response = await api.get(`/auction/${id}`);
    return response.data.auction;
  },

  async startAuction(id) {
    const response = await api.post(`/auction/start/${id}`);
    return response.data;
  },

  async endAuction(id) {
    const response = await api.post(`/auction/end/${id}`);
    return response.data;
  },

  async addAuctionItem(itemData) {
    const response = await api.post('/auction/items/add', itemData);
    return response.data;
  },

  async getAuctionItems(auctionId) {
    const response = await api.get(`/auction/items/${auctionId}`);
    return response.data.items;
  },

  async placeBid(bidData) {
    const response = await api.post('/auction/bid', bidData);
    return response.data;
  },

  async getItemBids(itemId) {
    const response = await api.get(`/auction/bids/${itemId}`);
    return response.data.bids;
  }
};
