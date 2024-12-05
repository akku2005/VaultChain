'use strict';
const Joi = require('joi');

// Request validation middleware
const validatorHandler = (req, res, next, schema) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message.replace('/[^a-zA-Z0-9 ]/g', ''),
    });
  }
  next();
};

// Verify Email Validation
const verifyEmailValidator = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required',
      'string.empty': 'Verification token cannot be empty',
    }),
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required',
      'string.empty': 'User ID cannot be empty',
    }),
  });

  // Validate request body
  const { error } = schema.validate(req.body);

  // If validation fails, return error
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }

  // Proceed to next middleware
  next();
};

// Resend Verification Email Validation
const resendVerificationValidator = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } })
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty',
      }),
  });

  // Validate request body
  const { error } = schema.validate(req.body);

  // If validation fails, return error
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }

  // Proceed to next middleware
  next();
};

// Forgot Password Validation
const forgotPasswordValidator = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } })
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty',
      }),
  });

  // Validate request body
  const { error } = schema.validate(req.body);

  // If validation fails, return error
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }

  // Proceed to next middleware
  next();
};
// Reset Password Validation
const resetPasswordValidator = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required().min(10).max(255).messages({
      'any.required': 'Password reset token is required',
      'string.empty': 'Password reset token cannot be empty',
      'string.min': 'Invalid token format',
      'string.max': 'Token is too long',
    }),

    password: Joi.string()
      .required()
      .min(8)
      .max(255)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 255 characters',
        'string.pattern.base':
          'Password must include uppercase, lowercase, number, and special character',
        'string.empty': 'Password cannot be empty',
        'any.required': 'Password is required',
      }),

    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required',
      'string.empty': 'Confirm password cannot be empty',
    }),
  });

  // Validate request body
  const { error } = schema.validate(req.body, { abortEarly: false });

  // If validation fails, return comprehensive error
  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors,
    });
  }

  // Proceed to next middleware
  next();
};
const errorHandler = (err, req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
module.exports = {
  errorHandler,
  validatorHandler,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
