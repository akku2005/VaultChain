// // Authentication logic
// 'use strict';
// const httpRes = require('../utils/http');
// const { SERVER_ERROR_MESSAGE, VERIFY_EMAIL_BEFORE_LOGIN } = require('../utils/messages');
// const { prepareResponse } = require('../utils/response');
// const { hashPassword } = require('../utils/Password');
// const user = require('../services/authService');
// const { getRawData } = require('../utils/function');

// exports.Signup = async (req, res) => {
//   try {
//     let body = req.body;
//     body.password = await hashPassword(body.password);
//     let result = user.addData(body);
//     result = getRawData(result);
//     res
//       .status(httpRes.CREATED)
//       .json(prepareResponse('CREATED', VERIFY_EMAIL_BEFORE_LOGIN, result, null));
//   } catch (error) {
//     res
//       .status(httpRes.SERVER_ERROR)
//       .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
//   }
// };

'use strict';
const httpRes = require('../utils/http');
const {
  SERVER_ERROR_MESSAGE,
  VERIFY_EMAIL_BEFORE_LOGIN,
  VERIFY_SUCCESS,
} = require('../utils/messages');
const { prepareResponse } = require('../utils/response');
const { hashPassword } = require('../utils/Password');
const user = require('../services/authService');
const { getRawData } = require('../utils/function');
const { randomBytes } = require('crypto');
const moment = require('moment');
const { sendMail } = require('../services/emailService'); // Assume you have this utility

exports.Signup = async (req, res) => {
  try {
    let body = req.body;

    // Hash password
    body.password = await hashPassword(body.password);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    body.emailVerificationToken = emailVerificationToken;
    body.emailVerificationTokenExpires = moment().add(24, 'hours').toDate();
    body.emailVerified = false;

    // Add user
    let result = user.addData(body);
    result = getRawData(result);

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&userId=${result.id}`;

    await sendMail({
      to: result.email,
      subject: 'Verify Your Email',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res
      .status(httpRes.CREATED)
      .json(prepareResponse('CREATED', VERIFY_EMAIL_BEFORE_LOGIN, result, null));
  } catch (error) {
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.VerifyEmail = async (req, res) => {
  try {
    const { token, userId } = req.body;

    // Find user with matching token
    const userData = await user.findByVerificationToken(token, userId);

    if (!userData) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Invalid or expired verification token', null, null));
    }

    // Update user as verified
    await user.verifyUserEmail(userId);

    res.status(httpRes.OK).json(prepareResponse('SUCCESS', VERIFY_SUCCESS, { userId }, null));
  } catch (error) {
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.ResendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Find unverified user
    const userData = await user.findUnverifiedUserByEmail(email);

    if (!userData) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('ERROR', 'No unverified account found', null, null));
    }

    // Generate new verification token
    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = moment().add(24, 'hours').toDate();

    // Update user with new token
    await user.updateVerificationToken(userData.id, newToken, newTokenExpires);

    // Send new verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}&userId=${userData.id}`;

    await sendMail({
      to: email,
      subject: 'Resend Email Verification',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res
      .status(httpRes.OK)
      .json(prepareResponse('SUCCESS', 'Verification email resent', null, null));
  } catch (error) {
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};
