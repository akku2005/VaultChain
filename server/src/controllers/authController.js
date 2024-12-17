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
const userService = require('../services/authService');

exports.Signup = async (req, res) => {
  try {
    const body = req.body;

    body.password = await hashPassword(body.password);

    const emailVerificationToken = randomBytes(32).toString('hex');
    body.emailVerificationToken = emailVerificationToken;
    body.emailVerificationTokenExpires = moment().add(24, 'hours').toDate();
    body.isEmailVerified = false;

    let user = await User.create(body);
    user = user.get({ plain: true });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&userId=${user.id}`;

    await sendMail({
      to: user.email,
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
      .json(prepareResponse('CREATED', VERIFY_EMAIL_BEFORE_LOGIN, user, null));
  } catch (error) {
    console.error('Signup Error:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};

exports.VerifyEmail = async (req, res) => {
  try {
    const { token, userId } = req.query;
    console.log('Verifying email for user:', userId);

    const userData = await User.findOne({
      where: {
        id: userId,
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          [Op.gt]: new Date(),
        },
        isEmailVerified: false,
      },
    });

    if (!userData) {
      console.log('Token invalid or expired');
      return res.status(400).json(prepareResponse(null, 'Invalid or expired token'));
    }

    await userData.update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    });

    // Send verification success email
    await sendMail(userData.email, 'Your email has been successfully verified!', 'success');

    res.status(200).json(prepareResponse({ userId }, 'Email verified successfully'));
  } catch (error) {
    console.error('Error verifying email:', error);
    res
      .status(500)
      .json(prepareResponse(null, 'There is Server error Please try after some time!'));
  }
};
exports.ResendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Resending verification link to:', email);

    const userData = await userService.findUnverifiedUserByEmail(email);

    if (!userData) {
      console.log('No unverified user found for email:', email);
      return res.status(404).json(prepareResponse(null, 'No unverified account found'));
    }

    if (userData.isEmailVerified) {
      console.log('User email is already verified:', email);
      return res.status(400).json(prepareResponse(null, 'Email already verified'));
    }

    const newToken = randomBytes(32).toString('hex');
    const newTokenExpires = moment().add(24, 'hours').toDate();

    await userService.updateVerificationToken(userData.id, newToken, newTokenExpires);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}&userId=${userData.id}`;
    console.log('Sending new verification link:', verificationLink);

    // Corrected call to sendMail
    await sendMail(userData.email, verificationLink, 'link');

    res.status(200).json(prepareResponse(null, 'Verification email resent'));
  } catch (error) {
    console.error('Error resending verification link:', error);
    res
      .status(500)
      .json(prepareResponse(null, 'There is Server error Please try after some time!', error));
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

    // Send reset password email using the new 'forgotPassword' type
    await sendMail(userRecord.email, resetPasswordLink, 'forgotPassword');

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
exports.ResetPassword = async (req, res) => {
  try {
    const { userId, token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!userId || !token || !newPassword || !confirmPassword) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('BAD_REQUEST', 'All fields are required', null, null));
    }

    // Additional validation
    if (newPassword !== confirmPassword) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Passwords do not match', null, null));
    }

    // Hash the token using CryptoJS
    const hashedToken = CryptoJS.SHA256(token).toString();

    // Find the user with the hashed token and user ID
    const userData = await User.findOne({
      where: {
        id: userId,
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: {
          [Op.gt]: moment().toDate(), // Ensure token is not expired
        },
      },
    });

    // Check if user exists and token is valid
    if (!userData) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(prepareResponse('ERROR', 'Invalid or expired reset token', null, null));
    }

    // Verify that the user ID matches the token's owner
    if (userData.id.toString() !== userId) {
      return res
        .status(httpRes.FORBIDDEN)
        .json(prepareResponse('ERROR', 'Unauthorized password reset attempt', null, null));
    }

    // Validate password strength (optional, but recommended)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res
        .status(httpRes.BAD_REQUEST)
        .json(
          prepareResponse('ERROR', 'Password does not meet complexity requirements', null, null),
        );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Reset password and clear reset token
    await User.update(
      {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
      {
        where: { id: userId },
      },
    );

    // Send confirmation email
    await sendMail(userData.email, userData, 'passwordResetSuccess');

    // Respond with success
    res
      .status(httpRes.OK)
      .json(
        prepareResponse(
          'SUCCESS',
          'Password reset successful. You can now log in with your new password.',
          null,
          null,
        ),
      );
  } catch (error) {
    console.error('Error resetting password:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(
        prepareResponse('SERVER_ERROR', 'An error occurred while resetting password', null, error),
      );
  }
};

exports.Logout = async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is sent in the request body

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res
        .status(httpRes.NOT_FOUND)
        .json(prepareResponse('ERROR', 'User not found', null, null));
    }

    // Update the user's login status
    await user.update({ isLoggedIn: false });

    // Log the logout event
    console.log(`User with ID ${userId} has logged out at ${new Date().toISOString()}`);

    // Respond with success
    res.status(httpRes.OK).json(prepareResponse('SUCCESS', 'Logout successful', null, null));
  } catch (error) {
    console.error('Error logging out:', error);
    res
      .status(httpRes.SERVER_ERROR)
      .json(prepareResponse('SERVER_ERROR', SERVER_ERROR_MESSAGE, null, error));
  }
};
