// 'use strict';
// const Joi = require('joi');
// const { validatorHandler } = require('../middlewares/validationMiddleware');
// const sendMail = require('../services/emailService'); // Import the email service
// const User = require('../models/User'); // Import your User model

// // Helper function to calculate age
// function calculateAge(birthDate) {
//   const today = new Date();
//   const dob = new Date(birthDate);
//   let age = today.getFullYear() - dob.getFullYear();
//   const monthDiff = today.getMonth() - dob.getMonth();

//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
//     age--;
//   }

//   return age;
// }

// // Signup function
// const signup = async (req, res, _next) => {
//   const schema = Joi.object().keys({
//     // Core User Information
//     email: Joi.string()
//       .trim()
//       .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } })
//       .required()
//       .messages({
//         'string.email': 'Invalid email format',
//         'string.empty': 'Email cannot be empty',
//         'any.required': 'Email is required',
//       }),

//     phoneNumber: Joi.string()
//       .trim()
//       .pattern(/^(\+91)?[6-9]\d{9}$/)
//       .required()
//       .messages({
//         'string.pattern.base': 'Invalid Indian mobile number',
//         'string.empty': 'Phone number cannot be empty',
//         'any.required': 'Phone number is required',
//       }),

//     password: Joi.string()
//       .trim()
//       .min(8)
//       .max(255)
//       .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
//       .required()
//       .messages({
//         'string.min': 'Password must be at least 8 characters long',
//         'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
//         'string.empty': 'Password cannot be empty',
//         'any.required': 'Password is required',
//       }),

//     // Personal Information
//     firstName: Joi.string().trim().min(2).max(100).required().messages({
//       'string.min': 'First name must be at least 2 characters',
//       'string.max': 'First name cannot exceed 100 characters',
//       'string.empty': 'First name cannot be empty',
//       'any.required': 'First name is required',
//     }),

//     middleName: Joi.string().trim().max(100).optional(),

//     lastName: Joi.string().trim().max(100).optional(),

//     dateOfBirth: Joi.date()
//       .iso()
//       .max('now')
//       .custom((value, helpers) => {
//         const age = calculateAge(value);
//         if (age < 18) {
//           return helpers.error('any.invalid');
//         }
//         return value;
//       })
//       .optional()
//       .messages({
//         'date.max': 'Birth date cannot be in the future',
//         'any.invalid': 'You must be at least 18 years old',
//       }),

//     // Optional Additional Fields
//     walletAddress: Joi.string()
//       .trim()
//       .pattern(/^0x[a-fA-F0-9]{40}$/)
//       .optional()
//       .messages({
//         'string.pattern.base': 'Invalid Ethereum wallet address',
//       }),

//     panNumber: Joi.string()
//       .trim()
//       .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
//       .optional()
//       .messages({
//         'string.pattern.base': 'Invalid PAN number format',
//       }),

//     aadhaarNumber: Joi.string()
//       .trim()
//       .pattern(/^\d{12}$/)
//       .optional()
//       .messages({
//         'string.pattern.base': 'Invalid Aadhaar number',
//       }),

//     // Referral and Profile
//     referredBy: Joi.string().trim().uuid().optional(),

//     referralCode: Joi.string().trim().optional(),

//     // Authentication & Role
//     role: Joi.string().valid('USER', 'INVESTOR', 'ADMIN', 'SUPER_ADMIN').default('USER').optional(),

//     // Financial Profile
//     investmentProfile: Joi.string()
//       .valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE')
//       .default('MODERATE')
//       .optional(),

//     annualIncome: Joi.number().min(0).optional().messages({
//       'number.min': 'Annual income cannot be negative',
//     }),

//     // Compliance
//     kycStatus: Joi.string()
//       .valid('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')
//       .default('NOT_VERIFIED')
//       .optional(),

//     riskProfile: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('LOW').optional(),
//   });

//   // Validate request body
//   const { error } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ status: 'error', message: error.details[0].message });
//   }

//   const { email, referralCode } = req.body;

//   try {
//     // Generate a verification code (you can use a random string generator)
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

//     // Send verification email
//     await sendMail(email, verificationCode);

//     // Create user data
//     const userData = {
//       email,
//       referralCode: referralCode || null, // Set to null if not provided
//       // ... include other user data as needed
//     };

//     // Proceed with user creation (assuming you have a User model)
//     const _user = await User.create(userData);

//     return res.status(201).json({
//       status: 'success',
//       message: 'Congratulations!! Your profile is created.',
//       data: 'CREATED',
//     });
//   } catch (error) {
//     console.error("Error during signup:", error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'An unexpected error occurred during signup.',
//       errorCode: 'SIGNUP_ERROR'
//     });
//   }
// };

// // Additional validator for login
// const login = (req, res, _next) => {
//   const schema = Joi.object().keys({
//     email: Joi.string().trim().email().required().messages({
//       'string.email': 'Invalid email format',
//       'any.required': 'Email is required',
//     }),
//     password: Joi.string().trim().required().messages({
//       'any.required': 'Password is required',
//     }),
//   });

//   validatorHandler(req, res, _next, schema);
// };

// // Additional validator for profile update
// const updateProfile = (req, res, _next) => {
//   const schema = Joi.object()
//     .keys({
//       firstName: Joi.string().trim().min(2).max(100).optional(),
//       lastName: Joi.string().trim().max(100).optional(),
//       middleName: Joi.string().trim().max(100).optional(),
//       dateOfBirth: Joi.date().iso().max('now').optional(),
//       annualIncome: Joi.number().min(0).optional(),
//       investmentProfile: Joi.string().valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE').optional(),
//       walletAddress: Joi.string()
//         .trim()
//         .pattern(/^0x[a-fA-F0-9]{40}$/)
//         .optional(),
//       riskProfile: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),})
//     .min(1); // Ensure at least one field is being updated

//   validatorHandler(req, res, _next, schema);
// };

// module.exports = {
//   signup,
//   login,
//   updateProfile,
// };

'use strict';
const Joi = require('joi');
const { validatorHandler } = require('../middlewares/validationMiddleware');
const sendMail = require('../services/emailService'); // Import the email service
const User = require('../models/User'); // Import your User model

// Helper function to calculate age
function calculateAge(birthDate) {
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

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

    dateOfBirth: Joi.date()
      .iso()
      .max('now')
      .custom((value, helpers) => {
        const age = calculateAge(value);
        if (age < 18) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .optional()
      .messages({
        'date.max': 'Birth date cannot be in the future',
        'any.invalid': 'You must be at least 18 years old',
      }),

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

  const { email, referralCode } = req.body;

  try {
    // Generate a verification code (you can use a random string generator)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

    // Send verification email
    await sendMail(email, verificationCode);

    // Create user data
    const userData = {
      email,
      referralCode: referralCode || null, // Set to null if not provided
      // ... include other user data as needed
    };

    // Proceed with user creation (assuming you have a User model)
    const _user = await User.create(userData);

    return res.status(201).json({
      status: 'success',
      message: 'Congratulations!! Your profile is created.',
      data: 'CREATED',
    });
  } catch (error) {
    console.error('Error during signup:', error);
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

module.exports = {
  signup,
  login,
  updateProfile,
};
