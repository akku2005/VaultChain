// src/config/environment.js
'use strict';
const dotenv = require('dotenv');

// Load environment variables based on NODE_ENV
dotenv.config({
  path: `./config/.env.${process.env.NODE_ENV || 'development'}`,
});

module.exports = {
  // App Config
  APP_NAME: process.env.APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3000,

  // MySQL Config
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_PORT: process.env.MYSQL_PORT,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT: process.env.MYSQL_CONNECTION_LIMIT,
  MYSQL_CONNECT_TIMEOUT: process.env.MYSQL_CONNECT_TIMEOUT,

  // MongoDB Config
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,

  // JWT Config
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,

  // Redis Config
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,

  // Feature Flags
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
  ENABLE_PORTFOLIO_TRACKING: process.env.ENABLE_PORTFOLIO_TRACKING === 'true',
};
