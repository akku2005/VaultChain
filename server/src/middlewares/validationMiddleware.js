'use strict';
const Joi = require('joi');
const { prepareResponse } = require('../utils/response');
const httpRes = require('../utils/http');
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
const resetPasswordValidator = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().trim().required().messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required',
    }),

    token: Joi.string().trim().required().min(20).max(255).messages({
      'string.empty': 'Reset token is required',
      'any.required': 'Reset token is required',
      'string.min': 'Invalid reset token',
      'string.max': 'Reset token is too long',
    }),

    newPassword: Joi.string()
      .trim()
      .min(8)
      .max(255)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be less than 255 characters',
        'string.pattern.base':
          'Password must include uppercase, lowercase, number, and special character',
        'string.empty': 'Password cannot be empty',
        'any.required': 'Password is required',
      }),

    confirmPassword: Joi.string().trim().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required',
      'string.empty': 'Confirm password cannot be empty',
    }),
  });

  // Validate the request
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  // Handle validation errors
  if (error) {
    const validationErrors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));

    return res
      .status(httpRes.BAD_REQUEST)
      .json(prepareResponse('VALIDATION_ERROR', 'Validation failed', null, validationErrors));
  }

  next();
};

module.exports = {
  validatorHandler,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
