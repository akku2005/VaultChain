'use strict';
const knex = require('knex');
const mongoose = require('mongoose');
const { postgresConfig, mongoConfig, featureFlagsConfig } = require('../config/database');
const logger = require('./logger');

class DatabaseConnection {
  constructor() {
    this.postgresConnection = null;
    this.mongoConnection = null;
    this.featureFlags = featureFlagsConfig;
  }

  async connectPostgres() {
    try {
      const env = process.env.NODE_ENV || 'development';
      const config = postgresConfig[env];

      this.postgresConnection = knex(config);

      // Test connection
      await this.postgresConnection.raw('SELECT 1');

      logger.info('PostgreSQL connected successfully');
      return this.postgresConnection;
    } catch (error) {
      logger.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  async connectMongoDB() {
    try {
      const env = process.env.NODE_ENV || 'development';
      const config = mongoConfig[env];

      this.mongoConnection = await mongoose.connect(config.uri, {
        ...config.options,
        dbName: config.dbName,
      });

      logger.info('MongoDB connected successfully');
      return this.mongoConnection;
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async connectAll() {
    try {
      await Promise.all([this.connectPostgres(), this.connectMongoDB()]);
    } catch (error) {
      logger.error('Database connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      // Postgres disconnect
      if (this.postgresConnection) {
        await this.postgresConnection.destroy();
        logger.info('PostgreSQL connection closed');
      }

      // MongoDB disconnect
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Database disconnection error:', error);
    }
  }

  // Feature Flag Management
  getFeatureFlags() {
    return this.featureFlags;
  }

  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] || false;
  }
}

module.exports = new DatabaseConnection();
