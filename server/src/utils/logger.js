// Enhanced logger.js
'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });

// Custom log levels with colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

// Create logger
const createLogger = () => {
  const logger = winston.createLogger({
    levels: logLevels.levels,
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        const colorMap = {
          error: chalk.red,
          warn: chalk.yellow,
          info: chalk.green,
          debug: chalk.blue,
        };

        const coloredLevel = colorMap[level] ? colorMap[level](level) : level;
        let formattedMessage = `${timestamp} ${coloredLevel}: ${message}`;

        if (Object.keys(metadata).length > 0) {
          formattedMessage += ` ${JSON.stringify(metadata)}`;
        }

        if (stack) {
          formattedMessage += `\n${stack}`;
        }

        return formattedMessage;
      }),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ],
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
      }),
    ],
    exitOnError: false,
  });

  // Extend logger with custom methods
  logger.custom = {
    performance(message, startTime = null) {
      if (!startTime) {
        logger.info(`Performance: ${message}`);
        return;
      }

      try {
        const endTime = process.hrtime(startTime);
        const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
        logger.info(`Performance: ${message}`, { duration: `${duration}ms` });
      } catch (error) {
        logger.warn(`Performance logging failed: ${message}`, { error: error.message });
      }
    },

    security(message, metadata = {}) {
      logger.warn(`SECURITY: ${message}`, metadata);
    },

    database(message, metadata = {}) {
      logger.info(`DATABASE: ${message}`, metadata);
    },

    blockchain(message, metadata = {}) {
      logger.info(`BLOCKCHAIN: ${message}`, metadata);
    },

    errorWithContext(message, error, context = {}) {
      logger.error(message, {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      });
    },
  };

  return logger;
};

// Create logger instance
const logger = createLogger();

// Global error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    errorMessage: error.message,
    errorStack: error.stack,
  });

  // Graceful shutdown
  setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

module.exports = logger;
