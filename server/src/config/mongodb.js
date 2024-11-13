// src/config/mongoConnection.js
'use strict';
const mongoose = require('mongoose');
const { MONGODB_URI, MONGODB_DB_NAME } = require('./environment');
const logger = require('../utils/logger');

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

module.exports = connectMongoDB;
