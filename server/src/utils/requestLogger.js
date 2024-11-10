'use strict';

const morgan = require('morgan');
const logger = require('./logger');
const { colorize } = require('colorette');

// Custom Morgan token for status code with color
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return colorize('red', status.toString());
  if (status >= 400) return colorize('yellow', status.toString());
  if (status >= 300) return colorize('cyan', status.toString());
  return colorize('green', status.toString());
});

// Create Morgan middleware
const requestLogger = morgan((tokens, req, res) => {
  const logMessage = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens['status-color'](req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');

  // Log different levels based on status code
  if (res.statusCode >= 500) {
    logger.error(logMessage);
  } else if (res.statusCode >= 400) {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }

  return logMessage;
});

module.exports = requestLogger;
