// Blockchain network model
'use strict';

const mongoose = require('mongoose');

const blockchainNetworkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  networkType: {
    type: String,
    enum: ['mainnet', 'testnet'],
    default: 'mainnet',
  },
  apiEndpoint: {
    type: String,
    required: true,
  },
  chainId: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BlockchainNetwork', blockchainNetworkSchema);
