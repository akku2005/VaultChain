// Authentication middleware
'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Check for token in headers
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No authentication token, authorization denied.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token is not valid',
      details: error.message,
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
