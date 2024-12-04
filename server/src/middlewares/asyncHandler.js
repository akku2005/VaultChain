'use strict';
const { errorResponse } = require('../utils/response');

const asyncHandler = (entityName, handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error(`${entityName} Error:`, error);

      // Handle different error types
      if (error.name === 'ValidationError') {
        return res.status(400).json(
          errorResponse(
            'Validation Error',
            error.details.map((detail) => detail.message),
          ),
        );
      }

      if (error.name === 'UniqueConstraintError') {
        return res.status(409).json(
          errorResponse(
            'Duplicate Entry',
            error.errors.map((err) => err.message),
          ),
        );
      }

      // Generic error response, falls back to 500 if no status is defined
      const statusCode = error.status || 500;
      const message = error.message || 'Internal Server Error';

      return res.status(statusCode).json(errorResponse(message, error.stack || error));
    }
  };
};

module.exports = { asyncHandler };
