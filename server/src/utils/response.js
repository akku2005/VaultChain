'use strict';
const httpRES = require('./http');
require('dotenv').config();
const cryptoJS = require('crypto-js');

const prepareResponse = (status_code, msg, data, error) => {
  console.log(error);
  return {
    status_code: httpRES[status_code],
    msg: msg,
    data: cryptoJS.createSign.encrypt(JSON.stringify(data), process.env.CYS).toString(),
    error: error,
  };
};

const prepareBody = (req, res, next) => {
  if (req.get('Referrer') !== 'http://localhost:4000/api-docs/') {
    req.body = JSON.parse(
      cryptoJS.AES.decrypt(req.body.cypher, process.env.CYS).toString(cryptoJS.enc.Utf8),
    );
  }
  next();
};

module.exports = {
  prepareResponse,
  prepareBody,
};
