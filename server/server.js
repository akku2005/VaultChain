'use strict';

require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? './config/.env.production'
      : './config/.env.development',
  debug: process.env.NODE_ENV !== 'production',
});

const express = require('express');
const mongoose = require('mongoose');
const sequilize = require('./src/config/mysql');
const logger = require('./src/utils/logger');
const cors = require('cors');
const helmet = require('helmet');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = null;
  }

  async initialize() {
    try {
      logger.info('Initializing server...');
      this.validateEnvironment();
      await this.connectDatabases();
      this.configureMiddlewares();
      this.configureRoutes();
      this.startServer();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  validateEnvironment() {
    const requiredVars = [
      'MONGODB_URI',
      'MONGODB_DB_NAME',
      'MYSQL_HOST',
      'MYSQL_USER',
      'MYSQL_PASSWORD',
      'MYSQL_DATABASE',
      'PORT',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        const maskedUri = this.maskSensitiveUri(process.env.MONGODB_URI || '');
        logger.error(`Environment variable ${varName} is not set`);
        console.error(
          `Current Environment: ${JSON.stringify({ ...process.env, MONGODB_URI: maskedUri })}`,
        );
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    logger.info('Environment variables validated successfully');
  }

  async connectDatabases() {
    await this.connectMongoDB();
    await this.connectMySQL();
  }

  async connectMongoDB() {
    try {
      const { MONGODB_URI, MONGODB_DB_NAME } = process.env;
      logger.info('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: MONGODB_DB_NAME,
      });
      logger.info(`MongoDB connected to database: ${MONGODB_DB_NAME}`);
    } catch (error) {
      logger.error('MongoDB connection failed', { error: error.message });
      throw error;
    }
  }

  async connectMySQL() {
    try {
      logger.info('Connecting to MySQL...');
      sequilize
        .authenticate()
        .then(() => {
          logger.info('Database Connected Successfully');
          sequilize
            .sync({ force: false, alter: true }) //its doing the table sync and
            .then(() => {
              logger.info('Database Synced Successfully');
            })
            .catch((syncErr) => {
              logger.error('Error Syncing Database: ' + syncErr.message);
              process.exit(1);
            });
        })
        .catch((err) => {
          logger.error('Error Connecting to Database', err);
          process.exit(1);
        });
      logger.info('MySQL connection pool initialized');
    } catch (error) {
      logger.error('MySQL connection failed', { error: error.message });
      throw error;
    }
  }

  maskSensitiveUri(uri) {
    return uri.replace(/:\/\/(.*):(.*)@/, '://****:****@');
  }

  configureMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    logger.info('Middlewares configured');
  }

  configureRoutes() {
    this.app.use('/api', require('./src/routes/index'));
    this.app.get('/', (req, res) => {
      res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
      logger.info('Health check route accessed');
    });

    this.app.get('/mysql-test', async (req, res) => {
      try {
        const [rows] = await sequilize.query('SELECT 1 + 1 AS solution');
        res.json({ solution: rows[0].solution });
        logger.info('MySQL test query executed successfully');
      } catch (error) {
        logger.error('MySQL query error', { error: error.message });
        res.status(500).json({ error: 'MySQL query failed' });
      }
    });

    logger.info('Routes configured');
  }

  startServer() {
    this.server = this.app.listen(this.port, () => {
      logger.info(
        `Server running on port ${this.port} in ${process.env.NODE_ENV || 'development'} mode`,
      );
    });
  }

  handleInitializationError(error) {
    logger.error('Server initialization failed', { message: error.message, stack: error.stack });
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

const server = new Server();
server.initialize();

module.exports = server;
