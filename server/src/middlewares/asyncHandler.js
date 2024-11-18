'use strict';
const { errorResponse } = require('../utils/response');

const asyncHandler = (entityName, handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error(`${entityName} Error:`, error);

      // Differentiate error responses
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

      // Generic error response
      res
        .status(error.status || 500)
        .json(errorResponse(error.message || 'Internal Server Error', error));
    }
  };
};

module.exports = { asyncHandler };
