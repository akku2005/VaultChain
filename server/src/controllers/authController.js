// Authentication logic
'use strict';
const httpRes = require('../utils/http');
const { SERVER_ERROR_MESSAGE, VERIFY_EMAIL_BEFORE_LOGIN } = require('../utils/messages');
const { prepareResponse } = require('../utils/response');
const { hashPassword } = require('../utils/Password');
const user = require('../services/authService');
const { getRawData } = require('../utils/function');

exports.Signup = async (req, res) => {
  try {
    let body = req.body;
    body.password = await hashPassword(body.password);
    let result = user.addData(body);
    result = getRawData(result);
    res
      .status(httpRes.CREATED)
      .json(prepareResponse('CREATED', VERIFY_EMAIL_BEFORE_LOGIN, result, null));
  } catch (error) {
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};
