'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const requestLogger = require('./src/utils/requestLogger');
const DatabaseConfig = require('./src/config/database');
const Constants = require('./src/config/constants');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = null;

    this.initializeServer();
  }

  async initializeServer() {
    try {
      // Initialize databases
      await DatabaseConfig.initializeDatabases();

      // Setup middlewares
      this.initializeMiddlewares();

      // Initialize routes
      this.initializeRoutes();

      // Start the server
      this.startServer();

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Server Initialization Failed', {
        error: error.message,
        errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
      process.exit(1);
    }
  }

  initializeMiddlewares() {
    this.app.use(requestLogger);

    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }),
    );

    this.app.use(compression());

    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );

    this.app.use(
      express.json({
        limit: '1mb',
      }),
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '1mb',
      }),
    );

    const limiter = rateLimit({
      windowMs: Constants.RATE_LIMIT_CONFIGS.WINDOW_MS,
      max: Constants.RATE_LIMIT_CONFIGS.MAX_REQUESTS,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    this.app.set('trust proxy', 1);
  }

  initializeRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      });
    });

    this.app.get('/', (req, res) => {
      res.json({
        message: 'DeFi Management Platform API',
        status: 'operational',
        version: process.env.npm_package_version,
      });
    });

    this.app.use((_req, res, _next) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        errorCode: Constants.ERROR_CODES.NOT_FOUND,
      });
    });

    this.app.use((err, _req, res, _next) => {
      logger.error('Unhandled Error', {
        error: err.message,
        stack: err.stack,
        errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  }

  startServer() {
    const startTime = process.hrtime();

    this.server = this.app.listen(this.port, () => {
      const duration = process.hrtime(startTime);
      const durationMs = duration[0] * 1000 + duration[1] / 1_000_000;

      // Detailed server startup log
      console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║                 DeFi Management Platform                     ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Server Details:                                             ║
      ║   • Port:         ${this.port}                              ║
      ║   • Environment:  ${process.env.NODE_ENV || 'development'}  ║
      ║   • PID:          ${process.pid}                            ║
      ║   • Startup Time: ${durationMs.toFixed(2)}ms                ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ Database Connections:                                       ║
      ║   • MongoDB:      ${process.env.MONGODB_URI ? '✓ Connected' : '✗ Not Configured'}  ║
      ║   • PostgreSQL:   ${process.env.DB_HOST ? '✓ Connected' : '✗ Not Configured'}      ║
      ╚══════════════════════════════════════════════════════════════╝
      `);

      logger.info(`Server running on port ${this.port}`, {
        environment: process.env.NODE_ENV,
        pid: process.pid,
      });

      logger.custom.performance('Server Startup', {
        duration: `${durationMs.toFixed(2)}ms`,
      });
    });
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.warn(`${signal} signal received. Initiating graceful shutdown.`);

        try {
          if (this.server) {
            await new Promise((resolve, reject) => {
              this.server.close((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }

          await DatabaseConfig.closeDatabaseConnections();

          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Graceful shutdown failed', {
            error: error.message,
            errorCode: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
          });
          process.exit(1);
        }
      });
    });
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

module.exports = new Server();
