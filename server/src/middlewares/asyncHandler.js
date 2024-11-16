'use strict';
const httpRes = require('../utils/http');
const { prepareResponse } = require('../utils/response');
const { SERVER_ERROR_MESSAGE } = require('../utils/messages');

const asyncHandler = (tableName, cb) => async (req, res, next) => {
  try {
    req.tableName = tableName;
    if (tableName === '') {
      req.tableName = req.params.tableName;
      delete req.params.tableName;
    }
    await cb(req, res, next);
  } catch (error) {
    return res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
  return true;
};

module.exports = { asyncHandler };
