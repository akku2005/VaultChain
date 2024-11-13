'use strict';

const logger = require('../utils/logger');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Generate structured error response
   * @returns {Object} Formatted error details
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Error Type Categorization Utility
 * @param {Error} err - Error object to categorize
 * @returns {Object} Error category details
 */
const categorizeError = (err) => {
  const errorCategories = {
    ValidationError: {
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
    },
    CastError: {
      statusCode: 400,
      errorCode: 'INVALID_DATA',
    },
    JsonWebTokenError: {
      statusCode: 401,
      errorCode: 'AUTHENTICATION_ERROR',
    },
    TokenExpiredError: {
      statusCode: 401,
      errorCode: 'TOKEN_EXPIRED',
    },
    MongoError: {
      statusCode: 409,
      errorCode: 'DATABASE_CONFLICT',
    },
  };

  return (
    errorCategories[err.name] || {
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
    }
  );
};

/**
 * Global Error Handler Middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next middleware function
 */
const errorHandler = (err, req, res, _next) => {
  // Determine error details
  const { statusCode, errorCode } = categorizeError(err);

  // Enhanced error logging
  logger.error('Application Error', {
    message: err.message,
    status: statusCode,
    errorCode,
    stack: err.stack,
    requestDetails: {
      method: req.method,
      path: req.originalUrl,
      body: req.body,
      query: req.query,
      user: req.user?.id || 'Unauthenticated',
    },
  });

  // Prepare error response
  const errorResponse = new AppError(err.message || 'Internal Server Error', statusCode, errorCode);

  // Send error response
  res.status(statusCode).json(errorResponse.toJSON());
};

/**
 * Not Found Handler Middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404,
    'ROUTE_NOT_FOUND',
  );
  next(error);
};

/**
 * Validation Error Handler
 * @param {Error} err - Validation error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));

    const validationError = new AppError('Validation Failed', 400, 'VALIDATION_ERROR');

    return res.status(400).json({
      ...validationError.toJSON(),
      errors,
    });
  }
  next(err);
};

/**
 * Async Route Handler Wrapper
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped async handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate Limit Error Handler
 * @param {Error} err - Rate limit error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next middleware function (unused)
 */
const rateLimitHandler = (err, req, res, _next) => {
  const rateLimitError = new AppError(
    'Too many requests, please try again later',
    429,
    'RATE_LIMIT_EXCEEDED',
  );

  // Log rate limit error details
  logger.warn('Rate Limit Exceeded', {
    ip: req.ip,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(429).json(rateLimitError.toJSON());
};

/**
 * Database Connection Error Handler
 * @param {Error} err - Database connection error
 * @returns {AppError} Formatted database error
 */
const handleDatabaseConnectionError = (err) => {
  logger.error('Database Connection Error', {
    message: err.message,
    stack: err.stack,
  });

  return new AppError('Database connection failed', 500, 'DATABASE_CONNECTION_ERROR');
};

/**
 * Unhandled Rejection Handler
 * @param {Error} err - Unhandled promise rejection error
 */
const unhandledRejectionHandler = (err) => {
  logger.error('Unhandled Rejection', {
    message: err.message,
    stack: err.stack,
  });

  // Remove unused variable warning by using underscore prefix
  const _unhandledError = new AppError('Unhandled promise rejection', 500, 'UNHANDLED_REJECTION');

  process.exit(1);
};

/**
 * Uncaught Exception Handler
 * @param {Error} err - Uncaught exception error
 */
const uncaughtExceptionHandler = (err) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack,
  });

  // Remove unused variable warning by using underscore prefix
  const _uncaughtError = new AppError('Uncaught exception occurred', 500, 'UNCAUGHT_EXCEPTION');

  process.exit(1);
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  asyncHandler,
  rateLimitHandler,
  categorizeError,
  handleDatabaseConnectionError,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
};
