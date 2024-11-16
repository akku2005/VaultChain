'use strict';
const morgan = require('morgan');
const { colorize } = require('colorette');
const logger = require('./logger');

class RequestLogger {
  constructor() {
    // Custom color mapping for status codes
    this.statusColorMap = {
      200: 'green',
      201: 'green',
      204: 'green',
      301: 'cyan',
      302: 'cyan',
      304: 'cyan',
      400: 'yellow',
      401: 'yellow',
      403: 'yellow',
      404: 'yellow',
      422: 'yellow',
      500: 'red',
      502: 'red',
      503: 'red',
      504: 'red',
    };

    // Custom Morgan tokens
    this.registerCustomTokens();
  }

  registerCustomTokens() {
    // Status code with color
    morgan.token('status-color', (req, _res) => {
      const status = _res.statusCode;
      const color = this.statusColorMap[status] || 'white';
      return colorize(color, status.toString());
    });

    // HTTP method with color
    morgan.token('method-color', (req, _res) => {
      const methodColors = {
        GET: 'green',
        POST: 'blue',
        PUT: 'yellow',
        DELETE: 'red',
        PATCH: 'magenta',
      };
      const method = req.method.toUpperCase();
      return colorize(methodColors[method] || 'white', method);
    });
  }

  createLogFormat() {
    return [
      ':method-color',
      ':url',
      ':status-color',
      ':res[content-length]',
      '-',
      ':response-time ms',
    ].join(' ');
  }

  createMorganMiddleware() {
    return morgan((tokens, req, _res) => {
      const logMessage = this.createLogFormat()
        .replace(':method-color', tokens['method-color'](req, _res))
        .replace(':url', tokens.url(req, _res))
        .replace(':status-color', tokens['status-color'](req, _res))
        .replace(':res[content-length]', tokens.res(req, _res, 'content-length') || '-')
        .replace(':response-time ms', `${tokens['response-time'](req, _res)} ms`);

      // Log based on status code severity
      this.logByStatusCode(_res.statusCode, logMessage, req);

      return logMessage;
    });
  }

  logByStatusCode(statusCode, logMessage, req) {
    const logContext = {
      method: req.method,
      path: req.path,
      ip: req.ip,
    };

    if (statusCode >= 500) {
      logger.error(logMessage, logContext);
    } else if (statusCode >= 400) {
      logger.warn(logMessage, logContext);
    } else if (statusCode >= 300) {
      logger.info(logMessage, logContext);
    } else {
      logger.http(logMessage, logContext);
    }
  }

  // Middleware to skip logging for specific routes
  skipLogging(options = {}) {
    const defaultSkipRoutes = ['/health', '/favicon.ico'];
    const skipRoutes = [...defaultSkipRoutes, ...(options.skipRoutes || [])];

    return morgan((tokens, req, _res) => {
      // Skip logging for specified routes
      if (skipRoutes.some((route) => req.url.includes(route))) {
        return null;
      }

      return this.createMorganMiddleware()(tokens, req, _res);
    });
  }
}

// Create and export middleware
const requestLoggerInstance = new RequestLogger();
const requestLogger = requestLoggerInstance.createMorganMiddleware();

// Expose additional methods
requestLogger.skip = (options) => requestLoggerInstance.skipLogging(options);

module.exports = requestLogger;
