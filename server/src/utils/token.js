'use strict';
const JWT = require('jsonwebtoken');
const { prepareResponse } = require('./response');
require('dotenv').config();
const { ACCESS_TOKEN_MISSING, INVALID_ACCESS_TOKEN, SERVER_ERROR_MESSAGE } = require('./messages');
const httpRes = require('./http');
const JWT_SECRET = process.env.JWT_SECRET;

let generateSign = (email, name, user_status, id, roll) => {
  let payload = {
    email: email,
    name: name,
    user_status: user_status,
    id: id,
    roll: roll,
  };
  let token = JWT.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
  });
  return token;
};

let verifySign = (req, res, next) => {
  const bearerToken = req.get('Authorization') || req.headers['x-access-token'];
  if (!bearerToken)
    return res
      .status(httpRes.UNAUTHORIZED)
      .json(prepareResponse('UNAUTHORIZED', ACCESS_TOKEN_MISSING, null, null));
  try {
    JWT.verify(bearerToken, JWT_SECRET, function (error, decoded) {
      if (error) {
        return res
          .status(httpRes.UNAUTHORIZED)
          .json(prepareResponse('FORBIDDEN', INVALID_ACCESS_TOKEN, null, error));
      }
      req.decoded = decoded;
      next();
    });
  } catch (error) {
    return res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

module.exports = {
  generateSign,
  verifySign,
};
