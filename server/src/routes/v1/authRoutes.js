'use strict';
const express = require('express');
const router = express.Router();

// Middleware and Utility Imports
const { prepareBody } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const checkMail = require('../../middlewares/checkMail');
const rateLimiter = require('../../config/rateLimiterConfig');

// Validator Imports
const {
  signup: signupValidator,
  login: loginValidator,
  updateProfile: updateProfileValidator,
  resetPassword,
} = require('../../validators/auth.validators');

// Controller Imports
const authController = require('../../controllers/authController'); // Destructuring might cause issues
const {
  Signup,
  Login,
  UpdateProfile,
  ResendVerification,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
} = authController;

// Middleware Imports
const { authenticate, authorize } = require('../../middlewares/authMiddleware');

// Registration Route
router
  .route('/register')
  .post(
    prepareBody,
    signupValidator,
    asyncHandler('user', checkMail),
    asyncHandler('user', Signup),
  );

// Login Route
router
  .route('/login')
  .post(rateLimiter.middleware('login'), prepareBody, loginValidator, asyncHandler('Login', Login));

// Profile Update Route (Protected)
router
  .route('/profile')
  .put(authenticate, prepareBody, updateProfileValidator, asyncHandler('user', UpdateProfile));

// Email Verification Routes
router.route('/verify-email').get(rateLimiter.middleware(), asyncHandler('user', VerifyEmail));

// Resend Verification Link Route
router.route('/resend-verification').post(prepareBody, asyncHandler('user', ResendVerification));

// Password Management Routes
router
  .route('/forgot-password')
  .post(
    rateLimiter.middleware('passwordReset'),
    prepareBody,
    asyncHandler('ForgotPassword Controller', ForgotPassword),
  );

router.route('/reset-password').post(
  rateLimiter.middleware('passwordReset'),
  prepareBody,
  resetPassword, // Validation middleware
  asyncHandler('Reset Password', ResetPassword), // Use the imported ResetPassword
);

// Additional Protected Routes Example
router.route('/dashboard').get(
  authenticate,
  authorize(['USER', 'INVESTOR']),
  asyncHandler('user', (req, res) => {
    // Dashboard logic
    res.status(200).json({
      message: 'Dashboard accessed successfully',
      user: req.user,
    });
  }),
);

module.exports = router;
