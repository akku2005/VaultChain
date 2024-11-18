'use strict';
const prepareBody = (req, res, next) => {
  req.body = Object.fromEntries(
    Object.entries(req.body).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
  next();
};

const successResponse = (message, data = null, meta = {}) => ({
  success: true,
  message,
  data,
  meta,
});

const errorResponse = (message, errors = []) => ({
  success: false,
  message,
  errors,
});

function prepareResponse(data, message = 'Success') {
  return {
    status: 'success',
    message: message,
    data: data,
  };
}

module.exports = {
  prepareBody,
  successResponse,
  errorResponse,
  prepareResponse,
};
