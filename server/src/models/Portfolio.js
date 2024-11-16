// Portfolio model
'use strict';
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assets: [
    {
      assetSymbol: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
