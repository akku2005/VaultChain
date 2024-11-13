// 'use strict';

// const winston = require('winston');
// const path = require('path');
// const fs = require('fs');
// const chalk = require('chalk');

// const logDir = path.join(process.cwd(), 'logs');
// fs.mkdirSync(logDir, { recursive: true });

// const logLevels = {
//   levels: {
//     error: 0,
//     warn: 1,
//     info: 2,
//     debug: 3,
//   },
//   colors: {
//     error: 'red',
//     warn: 'yellow',
//     info: 'green',
//     debug: 'blue',
//   },
// };

// const createLogger = () => {
//   const logger = winston.createLogger({
//     levels: logLevels.levels,
//     level: process.env.LOG_LEVEL || 'info',
//     format: winston.format.combine(
//       winston.format.timestamp({
//         format: 'YYYY-MM-DD HH:mm:ss.SSS',
//       }),
//       winston.format.errors({ stack: true }),
//       winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
//         const colorMap = {
//           error: chalk.red,
//           warn: chalk.yellow,
//           info: chalk.green,
//           debug: chalk.blue,
//         };

//         const coloredLevel = colorMap[level] ? colorMap[level](level) : level;
//         let formattedMessage = `${timestamp} ${coloredLevel}: ${message}`;

//         if (Object.keys(metadata).length > 0) {
//           formattedMessage += ` ${JSON.stringify(metadata)}`;
//         }

//         if (stack) {
//           formattedMessage += `\n${stack}`;
//         }

//         return formattedMessage;
//       }),
//     ),
//     transports: [
//       new winston.transports.Console(),
//       new winston.transports.File({
//         filename: path.join(logDir, 'error.log'),
//         level: 'error',
//         maxsize: 5242880,
//         maxFiles: 5,
//       }),
//       new winston.transports.File({
//         filename: path.join(logDir, 'combined.log'),
//         maxsize: 5242880,
//         maxFiles: 5,
//       }),
//     ],
//     exceptionHandlers: [
//       new winston.transports.File({
//         filename: path.join(logDir, 'exceptions.log'),
//       }),
//     ],
//     rejectionHandlers: [
//       new winston.transports.File({
//         filename: path.join(logDir, 'rejections.log'),
//       }),
//     ],
//     exitOnError: false,
//   });

//   // Extend logger with custom methods
//   logger.custom = {
//     performance(message, startTime = null) {
//       if (!startTime) {
//         logger.info(`Performance: ${message}`);
//         return;
//       }

//       try {
//         const endTime = process.hrtime(startTime);
//         const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
//         logger.info(`Performance: ${message}`, { duration: `${duration}ms` });
//       } catch (error) {
//         logger.warn(`Performance logging failed: ${message}`, { error: error.message });
//       }
//     },

//     security(message, metadata = {}) {
//       logger.warn(`SECURITY: ${message}`, metadata);
//     },

//     database(message, metadata = {}) {
//       logger.info(`DATABASE: ${message}`, metadata);
//     },

//     blockchain(message, metadata = {}) {
//       logger.info(`BLOCKCHAIN: ${message}`, metadata);
//     },

//     errorWithContext(message, error, context = {}) {
//       logger.error(message, {
//         errorMessage: error.message,
//         errorStack: error.stack,
//         ...context,
//       });
//     },
//   };

//   return logger;
// };

// // Create logger instance
// const logger = createLogger();

// // Global error handling
// process.on('uncaughtException', (error) => {
//   logger.error('Uncaught Exception', {
//     errorMessage: error.message,
//     errorStack: error.stack,
//   });

//   // Graceful shutdown
//   setTimeout(() => process.exit(1), 100);
// });

// process.on('unhandledRejection', (reason, _promise) => {
//   logger.error('Unhandled Rejection', {
//     reason: reason instanceof Error ? reason.message : reason,
//   });
// });

// module.exports = logger;

'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

class Logger {
  constructor() {
    // Ensure logs directory exists or create it
    this.logDir = this.createLogDirectory();

    // Define log levels and colors
    this.logLevels = {
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
        trace: 5,
      },
      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue',
        trace: 'white',
      },
    };

    // Create logger instance
    this.logger = this.createWinstonLogger();

    // Setup global error handlers
    this.setupGlobalErrorHandlers();
  }

  // Ensure the logs directory exists
  createLogDirectory() {
    const logDir = path.join(process.cwd(), 'logs');
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      return logDir;
    } catch (error) {
      console.error(chalk.red('Failed to create log directory:'), error);
      return process.cwd(); // Default to current working directory if failed
    }
  }

  // Create winston logger instance
  createWinstonLogger() {
    winston.addColors(this.logLevels.colors);

    const logger = winston.createLogger({
      levels: this.logLevels.levels,
      level: process.env.LOG_LEVEL || 'info', // Default to 'info' if no env variable
      format: this.createLogFormat(),
      transports: this.createLogTransports(),
      exceptionHandlers: this.createExceptionHandlers(),
      rejectionHandlers: this.createRejectionHandlers(),
      exitOnError: false, // Don't exit on handled exceptions
    });

    // Attach custom methods
    this.attachCustomMethods(logger);

    return logger;
  }

  // Define the log format
  createLogFormat() {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        const colorMap = {
          error: chalk.red,
          warn: chalk.yellow,
          info: chalk.green,
          http: chalk.magenta,
          debug: chalk.blue,
          trace: chalk.white,
        };

        const coloredLevel = colorMap[level] ? colorMap[level](level.toUpperCase()) : level;
        let formattedMessage = `${chalk.gray(timestamp)} ${coloredLevel}: ${message}`;

        if (Object.keys(metadata).length > 0) {
          formattedMessage += ` ${chalk.cyan(JSON.stringify(metadata))}`;
        }

        if (stack) {
          formattedMessage += `\n${chalk.gray(stack)}`;
        }

        return formattedMessage;
      }),
    );
  }

  // Create log transports
  createLogTransports() {
    return [
      new winston.transports.Console({
        format: this.createLogFormat(),
        handleExceptions: true,
      }),
      new winston.transports.File({
        filename: path.join(this.logDir, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        handleExceptions: true,
      }),
      new winston.transports.File({
        filename: path.join(this.logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      }),
    ];
  }

  // Create exception handlers for uncaught exceptions
  createExceptionHandlers() {
    return [
      new winston.transports.File({
        filename: path.join(this.logDir, 'exceptions.log'),
        handleExceptions: true,
      }),
    ];
  }

  // Create rejection handlers for unhandled promise rejections
  createRejectionHandlers() {
    return [
      new winston.transports.File({
        filename: path.join(this.logDir, 'rejections.log'),
        handleRejections: true,
      }),
    ];
  }

  // Attach custom logging methods (performance, security, etc.)
  attachCustomMethods(logger) {
    logger.custom = {
      performance: (message, startTime = null) => {
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
      security: (message, metadata = {}) => {
        logger.warn(`SECURITY: ${message}`, { type: 'security', ...metadata });
      },
      database: (message, metadata = {}) => {
        logger.info(`DATABASE: ${message}`, { type: 'database', ...metadata });
      },
      blockchain: (message, metadata = {}) => {
        logger.info(`BLOCKCHAIN: ${message}`, { type: 'blockchain', ...metadata });
      },
    };
  }

  // Set up global error handlers (uncaught exceptions and unhandled rejections)
  setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        processInfo: { pid: process.pid, platform: process.platform },
      });

      console.error(chalk.bgRed('Uncaught Exception occurred. Shutting down gracefully...'));

      // Graceful shutdown
      setTimeout(() => process.exit(1), 500);
    });

    process.on('unhandledRejection', (reason, _promise) => {
      this.logger.error('Unhandled Rejection', {
        reason:
          reason instanceof Error
            ? { name: reason.name, message: reason.message, stack: reason.stack }
            : reason,
      });

      console.warn(chalk.bgYellow('Unhandled Rejection detected. Logging for review...'));
    });
  }
}

module.exports = new Logger().logger;
