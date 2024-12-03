'use strict';
const JWT = require('jsonwebtoken');
const { prepareResponse } = require('./response');
require('dotenv').config();
const { ACCESS_TOKEN_MISSING, INVALID_ACCESS_TOKEN, SERVER_ERROR_MESSAGE } = require('./messages');
const httpRes = require('./http');
const JWT_SECRET = process.env.JWT_SECRET;
const { randomBytes } = require('crypto'); // Import crypto for generating reset tokens

// Function to generate JWT token
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

// Function to verify JWT token
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

// Function to generate a reset token
const generateResetToken = () => {
  return randomBytes(32).toString('hex'); // 32 bytes = 64 character token
};

module.exports = {
  generateSign,
  verifySign,
  generateResetToken, // Export the new generateResetToken function
};
