'use strict';
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.mysqlConnection = null;
    this.mongoConnection = null;
  }

  async connectToMongoDB() {
    try {
      this.mongoConnection = await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB_NAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.custom.database('MongoDB Connected Successfully', {
        database: process.env.MONGODB_DB_NAME,
      });

      // Optional: Setup Mongoose connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB Connection Error', { error: err });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB Disconnected');
      });

      return this.mongoConnection;
    } catch (error) {
      logger.error('MongoDB Connection Failed', {
        error: error.message,
        uri: this.maskConnectionString(process.env.MONGODB_URI),
      });
      throw error;
    }
  }

  async connectToMySQL() {
    try {
      this.mysqlConnection = await mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000, // 10 seconds
      });

      logger.custom.database('MySQL Connected Successfully', {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
      });

      return this.mysqlConnection;
    } catch (error) {
      logger.error('MySQL Connection Failed', {
        error: error.message,
        host: process.env.DB_HOST,
      });
      throw error;
    }
  }

  async initializeDatabases() {
    try {
      // Parallel database connections
      await Promise.all([this.connectToMongoDB(), this.connectToMySQL()]);
    } catch (error) {
      logger.error('Database Initialization Failed', { error: error.message });
      process.exit(1);
    }
  }

  // MySQL Query Execution Utility
  async executeQuery(query, params = []) {
    if (!this.mysqlConnection) {
      throw new Error('MySQL Connection Not Established');
    }

    try {
      const [results] = await this.mysqlConnection.execute(query, params);
      return results;
    } catch (error) {
      logger.error('MySQL Query Execution Failed', {
        query,
        error: error.message,
      });
      throw error;
    }
  }

  // Mongoose Model Registration Utility
  registerModel(modelName, schema) {
    return mongoose.model(modelName, schema);
  }

  // Mask sensitive parts of connection string
  maskConnectionString(uri) {
    try {
      const urlParts = new URL(uri);
      urlParts.password = '****';
      return urlParts.toString();
    } catch {
      return uri.replace(/:(.*?)@/g, ':****@');
    }
  }

  // Graceful Shutdown
  async disconnect() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      logger.info('MySQL Connection Closed');
    }

    if (this.mongoConnection) {
      await mongoose.connection.close();
      logger.info('MongoDB Connection Closed');
    }
  }
}

// Singleton Instance
const databaseManager = new DatabaseManager();

// Graceful Shutdown Handlers
process.on('SIGINT', async () => {
  await databaseManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await databaseManager.disconnect();
  process.exit(0);
});

module.exports = databaseManager;
