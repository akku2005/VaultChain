'use strict';
// config/rateLimiterConfig.js
const moment = require('moment');
const logger = require('../utils/logger');

class AdvancedRateLimiter {
  constructor() {
    // In-memory storage for rate limit tracking
    this.limitStore = new Map();
  }

  /**
   * Generate a unique key for rate limiting
   * @param {Object} req - Express request object
   * @returns {string} Unique rate limit key
   */
  generateRateLimitKey(req) {
    // Prioritize authenticated user ID, fallback to IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}:${req.path}`;
    }
    return `ip:${this.getClientIp(req)}:${req.path}`;
  }

  /**
   * Get client IP address
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIp(req) {
    return (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * Create a rate limiter middleware
   * @param {Object} _options - Rate limiter configuration
   * @returns {Function} Express middleware
   */
  limitRequest(_options = {}) {
    // Default configuration
    const config = {
      points: 100, // Number of allowed requests
      duration: 60, // Duration in seconds
      blockDuration: 900, // Block duration in seconds (15 minutes)
      ..._options,
    };

    return async (req, res, next) => {
      try {
        // Generate unique key
        const key = this.generateRateLimitKey(req);

        // Get or create request tracking
        const requestTracker = this.getOrCreateTracker(key, config);

        // Check if currently blocked
        if (this.isCurrentlyBlocked(requestTracker, config)) {
          return this.handleRateLimitExceeded(req, res, requestTracker);
        }

        // Track the request
        this.trackRequest(requestTracker, config);

        // Attach rate limit headers
        this.attachRateLimitHeaders(res, requestTracker, config);

        next();
      } catch (error) {
        this.handleError(req, res, error);
      }
    };
  }

  /**
   * Get or create a request tracker
   * @param {string} key - Unique rate limit key
   * @param {Object} _config - Rate limiter configuration
   * @returns {Object} Request tracker
   */
  getOrCreateTracker(key, _config) {
    if (!this.limitStore.has(key)) {
      this.limitStore.set(key, {
        requests: [],
        blockedUntil: null,
        totalBlocks: 0,
      });
    }
    return this.limitStore.get(key);
  }

  /**
   * Check if the request is currently blocked
   * @param {Object} tracker - Request tracker
   * @param {Object} _config - Rate limiter configuration
   * @returns {boolean} Whether the request is blocked
   */
  isCurrentlyBlocked(tracker, _config) {
    if (tracker.blockedUntil) {
      // Check if block is still active
      if (moment().isBefore(tracker.blockedUntil)) {
        return true;
      }
      // Reset block status if block duration has passed
      tracker.blockedUntil = null;
    }
    return false;
  }

  /**
   * Track incoming request
   * @param {Object} tracker - Request tracker
   * @param {Object} config - Rate limiter configuration
   */
  trackRequest(tracker, config) {
    const now = moment();

    // Remove expired requests
    tracker.requests = tracker.requests.filter((req) => now.diff(req, 'seconds') < config.duration);

    // Add current request
    tracker.requests.push(now);

    // Check if limit exceeded
    if (tracker.requests.length > config.points) {
      // Block the request
      tracker.blockedUntil = moment().add(config.blockDuration, 'seconds');
      tracker.totalBlocks++;

      // Log block event
      logger.warn('Rate Limit Exceeded', {
        totalBlocks: tracker.totalBlocks,
        blockedUntil: tracker.blockedUntil.toISOString(),
      });
    }
  }

  /**
   * Attach rate limit headers
   * @param {Object} res - Express response object
   * @param {Object} tracker - Request tracker
   * @param {Object} config - Rate limiter configuration
   */
  attachRateLimitHeaders(res, tracker, config) {
    res.set({
      'X-RateLimit-Limit': config.points,
      'X-RateLimit-Remaining': Math.max(0, config.points - tracker.requests.length),
      'X-RateLimit-Reset': moment().add(config.duration, 'seconds').valueOf(),
    });
  }

  /**
   * Handle rate limit exceeded scenario
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} tracker - Request tracker
   */
  handleRateLimitExceeded(req, res, tracker) {
    const blockRemaining = moment.duration(moment(tracker.blockedUntil).diff(moment())).asSeconds();

    logger.warn('Rate Limit Blocked Request', {
      ip: this.getClientIp(req),
      path: req.path,
      blockRemaining: blockRemaining,
    });

    res.status(429).json({
      status: 'ERROR',
      message: 'Too many requests, please try again later.',
      retryAfter: blockRemaining,
      totalBlocks: tracker.totalBlocks,
    });
  }

  /**
   * Handle unexpected errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   */
  handleError(req, res, error) {
    logger.error('Rate Limiter Error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: 'ERROR',
      message: 'An unexpected error occurred',
    });
  }

  /**
   * Middleware generator for specific use cases
   * @param {string} type - Type of rate limiter
   * @returns {Function} Rate limit middleware
   */
  middleware(type = 'default') {
    const limiters = {
      default: this.limitRequest(),
      login: this.limitRequest({
        points: 5,
        duration: 900, // 15 minutes
        blockDuration: 3600, // 1 hour
      }),
      passwordReset: this.limitRequest({
        points: 3,
        duration: 3600, // 1 hour
        blockDuration: 86400, // 24 hours
      }),
      apiAccess: this.limitRequest({
        points: 100,
        duration: 3600, // Per hour
      }),
    };

    return limiters[type] || limiters.default;
  }

  /**
   * Periodic cleanup of expired trackers
   */
  startCleanupJob() {
    setInterval(
      () => {
        const now = moment();
        for (const [key, tracker] of this.limitStore.entries()) {
          // Remove trackers with no recent activity
          if (
            tracker.requests.length === 0 &&
            (!tracker.blockedUntil || now.isAfter(tracker.blockedUntil))
          ) {
            this.limitStore.delete(key);
          }
        }
      },
      60 * 60 * 1000,
    ); // Run every hour
  }
}

// Export singleton instance
module.exports = new AdvancedRateLimiter();
