'use strict';

const dotenv = require('dotenv');

// Load environment-specific configurations
dotenv.config({
  path: `../../config/.env.${process.env.NODE_ENV || 'development'}`,
});

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',

  // Blockchain configurations
  ETHEREUM_PROVIDER: process.env.ETHEREUM_PROVIDER,
  POLYGON_PROVIDER: process.env.POLYGON_PROVIDER,

  // Exchange API Keys
  COINBASE_API_KEY: process.env.COINBASE_API_KEY,
  BINANCE_API_KEY: process.env.BINANCE_API_KEY,
};
