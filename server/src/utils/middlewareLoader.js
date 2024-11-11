'use strict';
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class MiddlewareLoader {
  constructor(app, options = {}) {
    this.app = app;
    this.middlewarePath = options.middlewarePath || path.join(__dirname, '../middleware');
  }

  loadMiddlewares() {
    try {
      // Ensure middleware directory exists
      if (!fs.existsSync(this.middlewarePath)) {
        logger.warn('Middleware directory does not exist', { path: this.middlewarePath });
        return;
      }

      // Read middleware files
      const middlewareFiles = fs
        .readdirSync(this.middlewarePath)
        .filter((file) => file.endsWith('.js'));

      // Load and register middlewares
      middlewareFiles.forEach((file) => {
        try {
          const middlewarePath = path.join(this.middlewarePath, file);
          const middleware = require(middlewarePath);

          // Check if middleware is a function
          if (typeof middleware === 'function') {
            this.app.use(middleware);
            logger.info(`Loaded middleware: ${file}`);
          }
        } catch (error) {
          logger.error(`Error loading middleware file: ${file}`, {
            error: error.message,
            stack: error.stack,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to load middlewares', {
        error: error.message,
        stack: error.stack,
        middlewarePath: this.middlewarePath,
      });
    }
  }
}

module.exports = MiddlewareLoader;
