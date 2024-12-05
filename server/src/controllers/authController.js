'use strict';
const httpRes = require('../utils/http');
// const logger = require('../utils/logger');
const { Op } = require('sequelize');
const CryptoJS = require('crypto-js');
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

    // Validate email
    if (!email) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('BAD_REQUEST', 'Email is required', null, null));
    }

    // Find user by email
    const userRecord = await User.findOne({ where: { email } });
    if (!userRecord) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('NOT_FOUND', 'No user found with this email', null, null));
    }

    // Generate a random reset token
    const resetToken = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

    // Hash the reset token
    const resetTokenHash = CryptoJS.SHA256(resetToken).toString();

    // Set reset token and expiration (1 hour from now)
    userRecord.passwordResetToken = resetTokenHash;
    userRecord.passwordResetTokenExpires = moment().add(1, 'hour').toDate();

    // Save updated user record
    await userRecord.save();

    // Generate the reset password link
    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userId=${userRecord.id}`;

    // Send reset password email
    const subject = 'Password Reset Request';
    const emailType = 'reset'; // Adjust template type in your email service if needed
    await sendMail(userRecord.email, resetPasswordLink, subject, emailType);

    // Respond to the client
    res
      .status(httpRes.OK)
      .json(prepareResponse('OK', 'Password reset link sent successfully', null, null));
  } catch (error) {
    console.error('Error during password reset:', error);
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
    // Extract token and new password
    const { token, password } = req.body;

    // Validate if token and password are provided
    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Token and new password are required.',
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with the hashed token and ensure the token is still valid
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: {
          [Op.gt]: new Date(), // Ensure token expiration is in the future
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with the new password and clear reset token fields
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    next(error); // Pass the error to the global error handler
  }
};
