'use strict';
const Joi = require('joi');
const { validatorHandler } = require('../middlewares/validationMiddleware');
const sendMail = require('../services/emailService');
const User = require('../models/User');
const { randomBytes } = require('crypto');
const moment = require('moment');
const { Op } = require('sequelize');
const { prepareResponse } = require('../utils/response');
const httpRes = require('../utils/http');

// Helper function to calculate age (prefixed with underscore to satisfy lint rule)
const _calculateAge = (birthDate) => {
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

// Signup function
const signup = async (req, res, _next) => {
  const schema = Joi.object().keys({
    // Core User Information
    email: Joi.string()
      .trim()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } })
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required',
      }),

    phoneNumber: Joi.string()
      .trim()
      .pattern(/^(\+91)?[6-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Indian mobile number',
        'string.empty': 'Phone number cannot be empty',
        'any.required': 'Phone number is required',
      }),

    password: Joi.string()
      .trim()
      .min(8)
      .max(255)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must include uppercase, lowercase, number, and special character',
        'string.empty': 'Password cannot be empty',
        'any.required': 'Password is required',
      }),

    // Personal Information
    firstName: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 100 characters',
      'string.empty': 'First name cannot be empty',
      'any.required': 'First name is required',
    }),

    middleName: Joi.string().trim().max(100).optional(),

    lastName: Joi.string().trim().max(100).optional(),

    dateOfBirth: Joi.alternatives()
      .try(
        Joi.string()
          .trim()
          .custom((value, helpers) => {
            // Define acceptable date formats
            const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY/MM/DD'];
            let parsedDate = null;

            // Try parsing the date with each format
            for (const format of formats) {
              parsedDate = moment(value, format, true);
              if (parsedDate.isValid()) break;
            }

            // If date is invalid, throw an error
            if (!parsedDate || !parsedDate.isValid()) {
              return helpers.error('any.invalid', {
                message: 'Date must be valid and at least 18 years old',
              });
            }

            const age = moment().diff(parsedDate, 'years');
            if (age < 18) {
              return helpers.error('any.invalid', { message: 'You must be at least 18 years old' });
            }

            return parsedDate.format('YYYY-MM-DD');
          })
          .messages({
            'any.invalid': 'Date must be valid and you must be at least 18 years old',
          }),
        Joi.date().iso().max('now').messages({
          'date.max': 'Birth date cannot be in the future',
        }),
      )
      .optional(),

    // Optional Additional Fields
    walletAddress: Joi.string()
      .trim()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid Ethereum wallet address',
      }),

    panNumber: Joi.string()
      .trim()
      .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid PAN number format',
      }),

    aadhaarNumber: Joi.string()
      .trim()
      .pattern(/^\d{12}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid Aadhaar number',
      }),

    // Referral and Profile
    referredBy: Joi.string().trim().uuid().optional(),
    referralCode: Joi.string().trim().optional(),

    // Authentication & Role
    role: Joi.string().valid('USER', 'INVESTOR', 'ADMIN', 'SUPER_ADMIN').default('USER').optional(),

    // Financial Profile
    investmentProfile: Joi.string()
      .valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE')
      .default('MODERATE')
      .optional(),

    annualIncome: Joi.number().min(0).optional().messages({
      'number.min': 'Annual income cannot be negative',
    }),

    // Compliance
    kycStatus: Joi.string()
      .valid('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')
      .default('NOT_VERIFIED')
      .optional(),

    riskProfile: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('LOW').optional(),
  });

  // Validate request body
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 'error', message: error.details[0].message });
  }

  const { email, phoneNumber, password, firstName, lastName, middleName, referralCode } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user data
    const userData = {
      email: email.toLowerCase(),
      phoneNumber,
      password, // The User model's beforeCreate hook will hash the password
      firstName,
      lastName: lastName || null,
      middleName: middleName || null,
      referralCode: referralCode || null,
      emailVerificationToken,
      emailVerificationTokenExpires,
      emailVerified: false,
    };

    // Proceed with user creation
    const newUser = await User.create(userData);

    // Generate verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&userId=${newUser.id}`;

    // Send verification email
    await sendMail(email, verificationLink);

    return res.status(201).json({
      status: 'success',
      message: 'Congratulations!! Your profile is created. Please verify your email.',
      data: {
        userId: newUser.id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Error during signup:', error);

    // Handle specific Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred during signup.',
      errorCode: 'SIGNUP_ERROR',
    });
  }
};

// Additional validator for login
const login = (req, res, _next) => {
  const schema = Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
    password: Joi.string().trim().required().messages({
      'any.required': 'Password is required',
    }),
  });

  validatorHandler(req, res, _next, schema);
};

// Additional validator for profile update
const updateProfile = (req, res, _next) => {
  const schema = Joi.object()
    .keys({
      firstName: Joi.string().trim().min(2).max(100).optional(),
      lastName: Joi.string().trim().max(100).optional(),
      middleName: Joi.string().trim().max(100).optional(),
      dateOfBirth: Joi.date().iso().max('now').optional(),
      annualIncome: Joi.number().min(0).optional(),
      investmentProfile: Joi.string().valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE').optional(),
      walletAddress: Joi.string()
        .trim()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
      riskProfile: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
    })
    .min(1); // Ensure at least one field is being updated

  validatorHandler(req, res, _next, schema);
};

const verifyEmail = async (req, res) => {
  try {
    // Extract token and userId from request body
    const { token, userId } = req.body;

    // Validate input
    if (!token || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Token and User ID are required',
      });
    }

    // Find user with matching token and within expiration time
    const user = await User.findOne({
      where: {
        id: userId,
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          [Op.gt]: new Date(), // Check if token is not expired
        },
        emailVerified: false, // Ensure email is not already verified
      },
    });

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN',
      });
    }

    // Update user as verified
    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
      data: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred during email verification',
      errorCode: 'VERIFICATION_ERROR',
    });
  }
};

// Resend Verification Email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find unverified user
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        emailVerified: false,
      },
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No unverified account found with this email',
        code: 'USER_NOT_FOUND',
      });
    }

    // Generate new verification token
    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = moment().add(24, 'hours').toDate();

    // Update user with new token
    await user.update({
      emailVerificationToken: newToken,
      emailVerificationTokenExpires: newTokenExpires,
    });

    // Send new verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}&userId=${user.id}`;

    await sendMail(
      user.email,
      'Resend Email Verification',
      `Click to verify your email: ${verificationLink}`,
      `<h2>Verify Your Email</h2>
       <p>Click the link below to verify your email:</p>
       <a href="${verificationLink}">Verify Email</a>`,
    );

    return res.status(200).json({
      status: 'success',
      message: 'Verification email resent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to resend verification email',
      errorCode: 'RESEND_VERIFICATION_ERROR',
    });
  }
};
const forgotPassword = (req, res, _next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .trim()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } })
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required',
      }),
  });

  validatorHandler(req, res, _next, schema);
};
const resetPassword = (req, res, _next) => {
  const schema = Joi.object({
    token: Joi.string()
      .trim()
      .required()
      .min(20) // Minimum token length
      .max(255) // Maximum token length
      .messages({
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
  }).with('newPassword', 'confirmPassword'); // Ensure both passwords are provided together

  // Validate the request
  const { error } = schema.validate(req.body, {
    abortEarly: false, // Collect all validation errors
    allowUnknown: false, // Prevent unknown fields
  });

  // Handle validation errors
  if (error) {
    // Map validation errors to a more detailed format
    const validationErrors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));

    // Send a structured error response
    return res
      .status(httpRes.BAD_REQUEST)
      .json(prepareResponse('VALIDATION_ERROR', 'Validation failed', null, validationErrors));
  }

  // Remove confirmPassword from request body to prevent storing it
  delete req.body.confirmPassword;

  // Proceed to the next middleware
  _next();
};

module.exports = {
  signup,
  login,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
