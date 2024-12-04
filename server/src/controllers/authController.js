'use strict';
const httpRes = require('../utils/http');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const {
  SERVER_ERROR_MESSAGE,
  VERIFY_EMAIL_BEFORE_LOGIN,
  LOGIN_SUCCESS,
  // FORGOT_PASSWORD_SUCCESS,
  // RESET_PASSWORD_SUCCESS,
} = require('../utils/messages');

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { prepareResponse } = require('../utils/response');
const { hashPassword } = require('../utils/Password');
const user = require('../services/authService');
const { getRawData } = require('../utils/function');
const { randomBytes } = require('crypto');
const moment = require('moment');
const sendMail = require('../services/emailService'); // Assume you have this utility
const { generateSign } = require('../utils/token');

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
    let result = await user.addData(body);
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
    const { token, userId } = req.query; // Use `req.query` to get the parameters
    console.log('Verifying email for user:', userId);

    const userData = await user.findByVerificationToken(token, userId);
    if (!userData) {
      console.log('Token invalid or expired');
      return res.status(400).json(prepareResponse('ERROR', 'Invalid or expired token', null, null));
    }

    await user.verifyUserEmail(userId);

    // Send verification success email
    await sendMail(userData.email, 'Your email has been successfully verified!', 'success');

    res
      .status(200)
      .json(prepareResponse('SUCCESS', 'Email verified successfully', { userId }, null));
  } catch (error) {
    console.error('Error verifying email:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.ResendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Resending verification link to:', email);

    const userData = await user.findUnverifiedUserByEmail(email);

    if (!userData) {
      console.log('No unverified user found for email:', email);
      return res
        .status(404)
        .json(prepareResponse('ERROR', 'No unverified account found', null, null));
    }

    if (userData.emailVerified) {
      console.log('User email is already verified:', email);
      return res.status(400).json(prepareResponse('ERROR', 'Email already verified', null, null));
    }

    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = moment().add(24, 'hours').toDate();

    await user.updateVerificationToken(userData.id, newToken, newTokenExpires);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}&userId=${userData.id}`;
    console.log('Sending new verification link:', verificationLink);

    // Ensure that sendMail is being called correctly
    await sendMail(userData.email, verificationLink, 'link');

    res.status(200).json(prepareResponse('SUCCESS', 'Verification email resent', null, null));
  } catch (error) {
    console.error('Error resending verification link:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userData = await user.findByEmail(email);
    if (!userData) {
      return res.status(404).json(prepareResponse('ERROR', 'User not found', null, null));
    }

    console.log('User data:', userData); // Debugging line to inspect user data

    // Check if email is verified
    if (!userData.emailVerified) {
      return res
        .status(400)
        .json(prepareResponse('ERROR', 'Please verify your email before logging in', null, null));
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json(prepareResponse('ERROR', 'Invalid credentials', null, null));
    }

    // Generate JWT token using the utility function from token.js
    const token = generateSign(
      userData.email,
      `${userData.firstName} ${userData.lastName}`,
      userData.role,
      userData.id,
      userData.role,
    );

    // Send success response with token
    const response = {
      message: LOGIN_SUCCESS,
      token,
      user: getRawData(userData),
    };

    res.status(httpRes.OK).json(prepareResponse('SUCCESS', LOGIN_SUCCESS, response, null));
  } catch (error) {
    console.error('Error logging in:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    let userRecord = await User.findOne({ where: { email } });
    if (!userRecord) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('NOT_FOUND', 'User not found with this email', null, null));
    }

    // Generate a password reset token (32 bytes in hex format)
    const resetToken = crypto.randomBytes(32).toString('hex'); // Using crypto.randomBytes directly

    // Create hash of the reset token and save it to the user's record
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration time (1 hour from now)
    userRecord.passwordResetToken = resetTokenHash;
    userRecord.passwordResetTokenExpires = moment().add(1, 'hours').toDate();

    await userRecord.save();

    // Create reset password link with the token (expiration 1 hour)
    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userId=${userRecord.id}`;

    // Send email with reset password link
    await sendMail({
      to: userRecord.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetPasswordLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    // Respond to client
    res
      .status(httpRes.OK)
      .json(prepareResponse('OK', 'Password reset link sent successfully', null, null));
  } catch (error) {
    console.error('Error while processing forgot password request:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(
        prepareResponse(
          'SERVER_ERROR',
          'An error occurred while processing your request',
          null,
          error,
        ),
      );
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // 1. Validate the new password
    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a new password.',
      });
    }

    // 2. Hash the token and find the user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: {
          [Op.gt]: new Date(), // Token is still valid
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token.',
      });
    }

    // 3. Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update the user's password and clear the reset token and expiry
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Your password has been reset successfully.',
    });
  } catch (error) {
    logger.error('Reset Password Error:', error);
    next(error); // Pass the error to the global error handler
  }
};
