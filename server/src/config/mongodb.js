'use strict';
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class MongoDBConnection {
  constructor() {
    this.connection = null;
    this.connectionAttempts = 0;
    this.MAX_CONNECTION_ATTEMPTS = 5;
    this.initializeConnection();
  }

  getConnectionString() {
    const {
      MONGODB_USERNAME,
      MONGODB_PASSWORD,
      MONGODB_HOST,
      MONGODB_PORT,
      MONGODB_DATABASE,
      MONGODB_REPLICA_SET,
      MONGODB_AUTH_SOURCE,
    } = process.env;

    // Support for both standalone and replica set connections
    const authPart = `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
    const hostPart = MONGODB_REPLICA_SET
      ? `${MONGODB_HOST}/${MONGODB_DATABASE}`
      : `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;

    const queryParams = new URLSearchParams({
      authSource: MONGODB_AUTH_SOURCE || 'admin',
      ...(MONGODB_REPLICA_SET && { replicaSet: MONGODB_REPLICA_SET }),
    });

    return `mongodb://${authPart}${hostPart}?${queryParams.toString()}`;
  }

  getConnectionOptions() {
    return {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_CONNECTION_LIMIT) || 10,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 30000,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
    };
  }

  initializeConnection() {
    const connectionString = this.getConnectionString();
    const connectionOptions = this.getConnectionOptions();

    mongoose
      .connect(connectionString, connectionOptions)
      .then(() => {
        this.connection = mongoose.connection;
        this.connectionAttempts = 0;

        logger.info('MongoDB Connection Established Successfully', {
          host: process.env.MONGODB_HOST,
          database: process.env.MONGODB_DATABASE,
        });

        this.setupConnectionListeners();
      })
      .catch(this.handleInitialConnectionError.bind(this));
  }

  handleInitialConnectionError(err) {
    this.connectionAttempts++;

    logger.error('MongoDB Initial Connection Error', {
      error: err.message,
      host: process.env.MONGODB_HOST,
      attempt: this.connectionAttempts,
    });

    if (this.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
      const delay = this.getExponentialBackoff(this.connectionAttempts);

      logger.info(`Retrying connection in ${delay}ms`);

      setTimeout(() => {
        this.initializeConnection();
      }, delay);
    } else {
      logger.error('Maximum connection attempts reached. Exiting...');
      process.exit(1);
    }
  }

  getExponentialBackoff(attempt) {
    return Math.min(30000, Math.pow(2, attempt) * 1000);
  }

  setupConnectionListeners() {
    if (!this.connection) return;

    this.connection.on('connected', () => {
      logger.info('MongoDB Connected');
    });

    this.connection.on('error', (err) => {
      logger.error('MongoDB Connection Error', {
        error: err.message,
        errorDetails: err.toString(),
      });
    });

    this.connection.on('disconnected', () => {
      logger.warn('MongoDB Disconnected');
      this.reconnect();
    });

    this.connection.on('reconnected', () => {
      logger.info('MongoDB Reconnected');
    });
  }

  reconnect() {
    if (this.connection.readyState !== mongoose.ConnectionStates.disconnected) {
      return;
    }

    logger.info('Attempting to reconnect to MongoDB');
    this.initializeConnection();
  }

  async withTransaction(operation) {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => await operation(session), {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      });
    } catch (err) {
      logger.error('MongoDB Transaction Error', {
        error: err.message,
      });
      throw err;
    } finally {
      session.endSession();
    }
  }

  async performQuery(model, queryType, queryParams = {}, options = {}) {
    try {
      switch (queryType) {
        case 'find':
          return await model.find(queryParams, null, options);
        case 'findOne':
          return await model.findOne(queryParams, options);
        case 'create':
          return await model.create(queryParams);
        case 'updateOne':
          return await model.updateOne(queryParams.filter, queryParams.update, options);
        case 'deleteOne':
          return await model.deleteOne(queryParams);
        default:
          throw new Error('Invalid query type');
      }
    } catch (err) {
      logger.error('MongoDB Query Error', {
        queryType,
        error: err.message,
      });
      throw err;
    }
  }

  async closeConnection() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB Connection Closed');
    } catch (err) {
      logger.error('Error Closing MongoDB Connection', {
        error: err.message,
      });
      throw err;
    }
  }
}

module.exports = new MongoDBConnection();
