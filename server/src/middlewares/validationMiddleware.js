// Request validation
'use strict';
const Joi = require('joi');

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

// const attributeHandler = (req, res) => {
//     return res.status(400).json({
//         status: 'error',
//         message: 'There is some connection issue with db instance'
//     });
// };

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
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })
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

module.exports = { validatorHandler, verifyEmailValidator, resendVerificationValidator };
