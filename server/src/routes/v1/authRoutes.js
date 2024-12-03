'use strict';
const express = require('express');
const router = express.Router();

// Middleware and Utility Imports
const { prepareBody } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const checkMail = require('../../middlewares/checkMail');

// Validator Imports
const {
  signup: signupValidator,
  login: loginValidator,
  updateProfile: updateProfileValidator,
} = require('../../validators/auth.validators');

// Controller Imports
const {
  Signup,
  Login,
  UpdateProfile,
  ResendVerification,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
} = require('../../controllers/authController');

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
router.route('/login').post(prepareBody, loginValidator, asyncHandler('Login', Login));

// Profile Update Route (Protected)
router
  .route('/profile')
  .put(authenticate, prepareBody, updateProfileValidator, asyncHandler('user', UpdateProfile));

// Email Verification Routes
router.route('/verify-email').get(asyncHandler('user', VerifyEmail));

// Resend Verification Link Route
router.route('/resend-verification').post(prepareBody, asyncHandler('user', ResendVerification));

// Password Management Routes
router.route('/forgot-password').post(prepareBody, asyncHandler('user', ForgotPassword));

router.route('/reset-password').post(prepareBody, asyncHandler('user', ResetPassword));

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
