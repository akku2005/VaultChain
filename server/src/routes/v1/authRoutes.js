// Authentication routes
'use strict';
const { prepareBody } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const { Signup } = require('../../controllers/authController');
const router = require('express').Router();
const { signup: signupValidator } = require('../../validators/auth.validators');
const checkMail = require('../../middlewares/checkMail');

router
  .route('/register')
  .post(
    prepareBody,
    signupValidator,
    asyncHandler('user', checkMail),
    asyncHandler('user', Signup),
  );

module.exports = router;
