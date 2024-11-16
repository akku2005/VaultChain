'use strict';

const logger = require('./logger');

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error Response Formatter
class ErrorHandler {
  // Generic error response method
  static sendErrorResponse(err, req, res, _next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error
    this.logError(err, req);

    // Prepare error response
    const errorResponse = {
      status: err.status,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    // Send error response
    res.status(err.statusCode).json(errorResponse);
  }

  // Error logging method
  static logError(err, req = {}) {
    const errorLog = {
      message: err.message,
      status: err.statusCode,
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      user: req.user ? req.user.id : 'Unauthenticated',
      timestamp: new Date().toISOString(),
    };

    // Log based on error type
    if (err.isOperational) {
      logger.warn('Operational Error', errorLog);
    } else {
      logger.error('Unhandled Error', {
        ...errorLog,
        stack: err.stack,
      });
    }
  }

  // Validation Error Handler
  static handleValidationError(err) {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
  }

  // Duplicate Key Error Handler (MongoDB)
  static handleDuplicateKeyError(err) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
  }

  // Cast Error Handler (Invalid MongoDB ID)
  static handleCastError(err) {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
  }

  // JWT Error Handlers
  static handleJWTError() {
    return new AppError('Invalid token. Please log in again!', 401);
  }

  static handleJWTExpiredError() {
    return new AppError('Your token has expired. Please log in again!', 401);
  }

  // Global Error Middleware
  static globalErrorMiddleware(err, req, res, _next) {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      error = this.handleValidationError(err);
    }
    if (err.code === 11000) {
      error = this.handleDuplicateKeyError(err);
    }
    if (err.name === 'CastError') {
      error = this.handleCastError(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = this.handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = this.handleJWTExpiredError();
    }

    // Send error response
    this.sendErrorResponse(error, req, res, _next);
  }

  // Async Error Wrapper
  static asyncErrorHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Not Found Handler
  static notFoundHandler(req, res, next) {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
  }

  // Rate Limiting Error Handler
  static handleRateLimitError(req, res, _next) {
    const err = new AppError('Too many requests, please try again later', 429);
    this.sendErrorResponse(err, req, res, _next);
  }
}

// Export Error Classes and Handler
module.exports = {
  AppError,
  ErrorHandler,
  asyncErrorHandler: ErrorHandler.asyncErrorHandler,
  globalErrorMiddleware: ErrorHandler.globalErrorMiddleware,
};
