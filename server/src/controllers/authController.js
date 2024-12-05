'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { randomBytes } = require('crypto');
const CryptoJS = require('crypto-js');

const httpRes = require('../utils/http');
const {
  SERVER_ERROR_MESSAGE,
  VERIFY_EMAIL_BEFORE_LOGIN,
  LOGIN_SUCCESS,
} = require('../utils/messages');
const { prepareResponse } = require('../utils/response');
const { hashPassword } = require('../utils/Password');
const { getRawData } = require('../utils/function');
const { generateSign } = require('../utils/token');
const sendMail = require('../services/emailService');
const userService = require('../services/authService');
const User = require('../models/User');

/**
 * User Signup
 */
exports.Signup = async (req, res) => {
  try {
    const body = req.body;

    // Hash password
    body.password = await hashPassword(body.password);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    body.emailVerificationToken = emailVerificationToken;
    body.emailVerificationTokenExpires = moment().add(24, 'hours').toDate();
    body.emailVerified = false;

    // Add user to the database
    let result = await userService.addData(body);
    result = getRawData(result);

    // Send email verification link
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
    console.error('Signup Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

/**
 * Verify Email
 */
exports.VerifyEmail = async (req, res) => {
  try {
    const { token, userId } = req.query;

    const userData = await userService.findByVerificationToken(token, userId);
    if (!userData) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Invalid or expired token', null, null));
    }

    await userService.verifyUserEmail(userId);

    // Send verification success email
    await sendMail({
      to: userData.email,
      subject: 'Email Verified Successfully',
      html: `<p>Your email has been successfully verified!</p>`,
    });

    res
      .status(httpRes.OK)
      .json(prepareResponse('SUCCESS', 'Email verified successfully', { userId }, null));
  } catch (error) {
    console.error('Verify Email Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

/**
 * Resend Verification Email
 */
exports.ResendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const userData = await userService.findUnverifiedUserByEmail(email);
    if (!userData) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('ERROR', 'No unverified account found', null, null));
    }

    if (userData.emailVerified) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Email already verified', null, null));
    }

    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = moment().add(24, 'hours').toDate();

    await userService.updateVerificationToken(userData.id, newToken, newTokenExpires);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}&userId=${userData.id}`;
    await sendMail({
      to: userData.email,
      subject: 'Resend Verification Email',
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
    console.error('Resend Verification Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

/**
 * Login User
 */
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await userService.findByEmail(email);
    if (!userData) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('ERROR', 'User not found', null, null));
    }

    if (!userData.emailVerified) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Please verify your email before logging in', null, null));
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res
        .status(httpRes.UNAUTHORIZED)
        .json(prepareResponse('ERROR', 'Invalid credentials', null, null));
    }

    const token = generateSign(userData.email, userData.name, userData.role, userData.id);

    res.status(httpRes.OK).json(
      prepareResponse('SUCCESS', LOGIN_SUCCESS, {
        token,
        user: getRawData(userData),
      }),
    );
  } catch (error) {
    console.error('Login Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

/**
 * Forgot Password
 */
exports.ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Email is required', null, null));
    }

    const userRecord = await User.findOne({ where: { email } });
    if (!userRecord) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('ERROR', 'No user found with this email', null, null));
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = CryptoJS.SHA256(resetToken).toString();

    userRecord.passwordResetToken = resetTokenHash;
    userRecord.passwordResetTokenExpires = moment().add(1, 'hour').toDate();
    await userRecord.save();

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&userId=${userRecord.id}`;
    await sendMail({
      to: userRecord.email,
      subject: 'Reset Your Password',
      html: `
        <h2>Reset Password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetPasswordLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res
      .status(httpRes.OK)
      .json(prepareResponse('SUCCESS', 'Password reset link sent successfully', null, null));
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('BAD_REQUEST', 'Token and new password are required', null, null));
    }

    const hashedToken = CryptoJS.SHA256(token).toString();

    const userRecord = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!userRecord) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Invalid or expired reset token', null, null));
    }

    const hashedPassword = await hashPassword(password);

    userRecord.password = hashedPassword;
    userRecord.passwordResetToken = null;
    userRecord.passwordResetTokenExpires = null;
    await userRecord.save();

    res
      .status(httpRes.OK)
      .json(prepareResponse('SUCCESS', 'Password reset successfully', null, null));
  } catch (error) {
    console.error('Reset Password Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};
