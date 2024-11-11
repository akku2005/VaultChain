'use strict';
const mongoose = require('mongoose');
const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.mongoConnection = null;
    this.postgresPool = null;
  }

  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME;

      this.mongoConnection = await mongoose.connect(mongoUri, {
        dbName: dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.custom.database('MongoDB Connected Successfully', {
        uri: mongoUri,
        database: dbName,
      });

      return this.mongoConnection;
    } catch (error) {
      logger.custom.database('MongoDB Connection Failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async connectPostgreSQL() {
    try {
      this.postgresPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 2000, // How long to wait when connecting
      });

      // Test the connection
      const client = await this.postgresPool.connect();
      client.release();

      logger.custom.database('PostgreSQL Connection Pool Created Successfully', {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
      });

      return this.postgresPool;
    } catch (error) {
      logger.custom.database('PostgreSQL Connection Failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async initializeDatabases() {
    try {
      await Promise.all([this.connectMongoDB(), this.connectPostgreSQL()]);
    } catch (error) {
      logger.error('Database Initialization Failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async closeDatabaseConnections() {
    try {
      // Close MongoDB connection
      if (this.mongoConnection) {
        await mongoose.connection.close();
        logger.custom.database('MongoDB Connection Closed');
      }

      // Close PostgreSQL connection pool
      if (this.postgresPool) {
        await this.postgresPool.end();
        logger.custom.database('PostgreSQL Connection Pool Closed');
      }
    } catch (error) {
      logger.error('Database Closure Failed', {
        error: error.message,
      });
    }
  }

  // Utility method to get PostgreSQL client
  async getPostgresClient() {
    if (!this.postgresPool) {
      await this.connectPostgreSQL();
    }
    return this.postgresPool.connect();
  }

  // Utility method to get Mongoose connection
  getMongooseConnection() {
    if (!this.mongoConnection) {
      throw new Error('MongoDB connection not established');
    }
    return this.mongoConnection;
  }
}

module.exports = new DatabaseConfig();
