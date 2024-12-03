'use strict';
const httpRes = require('../utils/http');
const { v4: uuidv4 } = require('uuid');
const {
  SERVER_ERROR_MESSAGE,
  VERIFY_EMAIL_BEFORE_LOGIN,
  LOGIN_SUCCESS,
  // FORGOT_PASSWORD_SUCCESS,
  // RESET_PASSWORD_SUCCESS,
} = require('../utils/messages');

const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const { prepareResponse } = require('../utils/response');
const { hashPassword } = require('../utils/Password');
const user = require('../services/authService');
const { getRawData } = require('../utils/function');
const { randomBytes } = require('crypto');
const moment = require('moment');
const sendMail = require('../services/emailService'); // Assume you have this utility
const { generateSign } = require('../utils/token'); // Import generateSign and verifySign functions

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

exports.ForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate the email field
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Find the user by email using authService (assuming it's imported)
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    // Generate a password reset token (random string)
    let resetToken;
    if (crypto && crypto.randomBytes) {
      resetToken = crypto.randomBytes(20).toString('hex');
    } else {
      resetToken = uuidv4(); // Fallback to uuid if crypto is unavailable
    }

    // Set the expiration date (e.g., 1 hour)
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token and its expiration in the database
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = resetTokenExpires;

    await user.save();

    // Send a password reset email (make sure to replace with your own email service)
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Click the link below to reset your password: \n\n${resetUrl}`;

    // Send the email
    try {
      await sendMail({
        email: user.email,
        subject: 'Password Reset Request',
        message,
      });

      res.status(200).json({ message: 'Password reset link has been sent to your email.' });
    } catch (emailError) {
      // Rollback the reset token in case of email sending failure
      user.passwordResetToken = null;
      user.passwordResetTokenExpires = null;
      await user.save();

      console.error('Error sending email:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }
  } catch (err) {
    console.error(err);
    next(err); // Pass errors to the global error handler
  }
};
exports.ResetPassword = async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the reset token is valid and has not expired
    if (user.emailVerificationToken !== token) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear the reset token and expiration
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
