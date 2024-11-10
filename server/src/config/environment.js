'use strict';
const dotenv = require('dotenv');
const path = require('path');

// Determine the current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment-specific .env file
const envFile = `.env.${NODE_ENV}`;
dotenv.config({ path: path.resolve(process.cwd(), 'config', envFile) });

const environmentConfig = {
  // Application Configuration
  APP_NAME: process.env.APP_NAME || 'DeFi Management Platform',
  NODE_ENV,
  PORT: process.env.PORT || 3000,

  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',

  // Blockchain Configuration
  BLOCKCHAIN_PROVIDERS: {
    ETHEREUM: {
      NETWORK: process.env.ETHEREUM_NETWORK || 'mainnet',
      PROVIDER_URL: process.env.ETHEREUM_PROVIDER_URL,
    },
    POLYGON: {
      NETWORK: process.env.POLYGON_NETWORK || 'mainnet',
      PROVIDER_URL: process.env.POLYGON_PROVIDER_URL,
    },
  },

  // External Service Configuration
  EXTERNAL_SERVICES: {
    COINBASE: {
      API_KEY: process.env.COINBASE_API_KEY,
      API_SECRET: process.env.COINBASE_API_SECRET,
    },
    BINANCE: {
      API_KEY: process.env.BINANCE_API_KEY,
      API_SECRET: process.env.BINANCE_API_SECRET,
    },
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    MAX_FILES: process.env.LOG_MAX_FILES || '14d',
    MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  },

  // Cache Configuration
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT || 6379,
    PASSWORD: process.env.REDIS_PASSWORD,
  },

  // Feature Flags
  FEATURES: {
    ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
    ENABLE_PORTFOLIO_TRACKING: process.env.ENABLE_PORTFOLIO_TRACKING === 'true',
  },
};

module.exports = environmentConfig;
