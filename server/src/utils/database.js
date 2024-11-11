// 'use strict';
// const knex = require('knex');
// const mongoose = require('mongoose');
// const { postgresConfig, mongoConfig, featureFlagsConfig } = require('../config/database');
// const logger = require('./logger');

// class DatabaseConnection {
//   constructor() {
//     this.postgresConnection = null;
//     this.mongoConnection = null;
//     this.featureFlags = featureFlagsConfig;
//   }

//   async connectPostgres() {
//     try {
//       const env = process.env.NODE_ENV || 'development';
//       const config = postgresConfig[env];

//       this.postgresConnection = knex(config);

//       // Test connection
//       await this.postgresConnection.raw('SELECT 1');

//       logger.info('PostgreSQL connected successfully');
//       return this.postgresConnection;
//     } catch (error) {
//       logger.error('PostgreSQL connection error:', error);
//       throw error;
//     }
//   }

//   async connectMongoDB() {
//     try {
//       const env = process.env.NODE_ENV || 'development';
//       const config = mongoConfig[env];

//       this.mongoConnection = await mongoose.connect(config.uri, {
//         ...config.options,
//         dbName: config.dbName,
//       });

//       logger.info('MongoDB connected successfully');
//       return this.mongoConnection;
//     } catch (error) {
//       logger.error('MongoDB connection error:', error);
//       throw error;
//     }
//   }

//   async connectAll() {
//     try {
//       await Promise.all([this.connectPostgres(), this.connectMongoDB()]);
//     } catch (error) {
//       logger.error('Database connection error:', error);
//       throw error;
//     }
//   }

//   async disconnect() {
//     try {
//       // Postgres disconnect
//       if (this.postgresConnection) {
//         await this.postgresConnection.destroy();
//         logger.info('PostgreSQL connection closed');
//       }

//       // MongoDB disconnect
//       if (this.mongoConnection) {
//         await mongoose.disconnect();
//         logger.info('MongoDB connection closed');
//       }
//     } catch (error) {
//       logger.error('Database disconnection error:', error);
//     }
//   }

//   // Feature Flag Management
//   getFeatureFlags() {
//     return this.featureFlags;
//   }

//   isFeatureEnabled(featureName) {
//     return this.featureFlags[featureName] || false;
//   }
// }

// module.exports = new DatabaseConnection();

'use strict';

require('dotenv').config(); // Ensure environment variables are loaded
const mongoose = require('mongoose');
const { Pool } = require('pg');
const logger = require('../utils/logger');
const Constants = require('../config/constants');

class DatabaseConfig {
  constructor() {
    this.mongoConnection = null;
    this.postgresPool = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connections
   * @returns {Promise<void>}
   */
  async initializeDatabases() {
    try {
      // Validate required environment variables
      this.validateEnvironmentVariables();

      // Setup Mongoose plugins
      this.setupMongoosePlugins();

      // Parallel database connections
      await Promise.all([this.connectMongoDB(), this.connectPostgreSQL()]);

      this.isInitialized = true;

      logger.info('All Database Connections Established', {
        mongodb: !!this.mongoConnection,
        postgresql: !!this.postgresPool,
      });
    } catch (error) {
      logger.error('Database Initialization Failed', {
        error: error.message,
        errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
      throw error;
    }
  }

  /**
   * Validate required environment variables
   */
  validateEnvironmentVariables() {
    const requiredEnvs = {
      mongodb: ['MONGODB_URI'],
      postgresql: ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'],
    };

    // Check MongoDB environment variables
    requiredEnvs.mongodb.forEach((env) => {
      if (!process.env[env]) {
        throw new Error(`Missing MongoDB environment variable: ${env}`);
      }
    });

    // Check PostgreSQL environment variables
    requiredEnvs.postgresql.forEach((env) => {
      if (!process.env[env]) {
        throw new Error(`Missing PostgreSQL environment variable: ${env}`);
      }
    });
  }

  /**
   * Setup Mongoose global plugins
   */
  setupMongoosePlugins() {
    try {
      const mongooseTimestamp = require('mongoose-timestamp');
      mongoose.plugin(mongooseTimestamp, {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });
    } catch (error) {
      logger.warn('Mongoose Timestamp Plugin Setup Failed', { error: error.message });
    }
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<mongoose.Connection>}
   */
  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;

      this.mongoConnection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        socketTimeoutMS: 30000,
      });

      console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║               MongoDB Connection Established                ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Connection Details:                                         ║
      ║   • Host:         ${this.extractMongoHost(mongoUri)}        ║
      ║   • Pool Size:    10                                        ║
      ╚══════════════════════════════════════════════════════════════╝
      `);

      logger.info('MongoDB Connection Established', {
        type: 'database',
        host: this.extractMongoHost(mongoUri),
      });

      return this.mongoConnection;
    } catch (error) {
      console.error(`
      ╔══════════════════════════════════════════════════════════════╗
      ║               MongoDB Connection Failed                     ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Error Details:                                              ║
      ║   • Message:      ${error.message}                          ║
      ╚══════════════════════════════════════════════════════════════╝
      `);

      logger.error('MongoDB Connection Failed', {
        type: 'database',
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Extract host from MongoDB URI
   * @param {string} uri
   * @returns {string}
   */
  extractMongoHost(uri) {
    try {
      return new URL(uri).host;
    } catch {
      return 'Unknown Host';
    }
  }

  /**
   * Connect to PostgreSQL
   * @returns {Promise<Pool>}
   */
  async connectPostgreSQL() {
    try {
      this.postgresPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        max: 10,
        idleTimeoutMillis: 30000,
      });

      // Test connection
      const client = await this.postgresPool.connect();

      console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║             PostgreSQL Connection Established               ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Connection Details:                                         ║
      ║   • Host:         ${process.env.DB_HOST}                    ║
      ║   • Port:         ${process.env.DB_PORT}                    ║
      ║   • Database:     ${process.env.DB_NAME}                    ║
      ╚══════════════════════════════════════════════════════════════╝
      `);

      // Initialize schemas
      await this.initializePostgresSchemas(client);

      client.release();

      logger.info('PostgreSQL Connection Established', {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
      });

      return this.postgresPool;
    } catch (error) {
      console.error(`
      ╔══════════════════════════════════════════════════════════════╗
      ║             PostgreSQL Connection Failed                    ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Error Details:                                              ║
      ║   • Message:      ${error.message}                          ║
      ╚══════════════════════════════════════════════════════════════╝
      `);

      logger.error('PostgreSQL Connection Failed', {
        error: error.message,
        host: process.env.DB_HOST,
      });

      throw error;
    }
  }

  /**
   * Initialize PostgreSQL Schemas
   * @param {PoolClient} client
   */
  async initializePostgresSchemas(client) {
    try {
      // Create schemas
      await client.query(`
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE SCHEMA IF NOT EXISTS wallet;
      `);

      // Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth.users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'USER',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wallet.transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES auth.users(id),
          type VARCHAR(20) NOT NULL,
          amount NUMERIC(20,8) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      logger.info('PostgreSQL Schemas Initialized');
    } catch (error) {
      logger.error('PostgreSQL Schema Initialization Failed', { error: error.message });
    }
  }

  /**
   * Close database connections
   */
  async closeDatabaseConnections() {
    try {
      if (this.mongoConnection) {
        await mongoose.connection.close();
        logger.info('MongoDB Connection Closed');
      }

      if (this.postgresPool) {
        await this.postgresPool.end();
        logger.info('PostgreSQL Connection Pool Closed');
      }
    } catch (error) {
      logger.error('Database Closure Failed', {
        error: error.message,
        errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Get PostgreSQL client
   * @returns {Promise<PoolClient>}
   */
  async getPostgresClient() {
    if (!this.postgresPool) {
      await this.connectPostgreSQL();
    }
    return this.postgresPool.connect();
  }

  /**
   * Get Mongoose connection
   * @returns {mongoose.Connection}
   */
  getMongooseConnection() {
    if (!this.mongoConnection) {
      throw new Error('MongoDB connection not established');
    }
    return this.mongoConnection;
  }
}

module.exports = new DatabaseConfig();
