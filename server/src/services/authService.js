'use strict';
const { User, KYC_STATUS } = require('../models/User');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');

class AuthService {
  // Generate JWT Token
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );
  }

  // User Registration
  static async register(userData) {
    try {
      // Check if email or phone number already exists
      const [emailTaken, phoneTaken] = await Promise.all([
        User.isEmailTaken(userData.email),
        User.isPhoneNumberTaken(userData.phoneNumber),
      ]);

      if (emailTaken) {
        throw new AppError('Email is already in use', 400);
      }

      if (phoneTaken) {
        throw new AppError('Phone number is already in use', 400);
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate verification token
      const verificationToken = this.generateVerificationToken(user);

      // Optional: Send verification email or SMS
      // await this.sendVerificationNotification(user, verificationToken);

      return { user, verificationToken }; // Return user and token
    } catch (error) {
      throw new AppError(error.message || 'User  registration failed', 500);
    }
  }

  // Generate Verification Token
  static generateVerificationToken(user) {
    return jwt.sign(
      {
        id: user._id,
        type: 'verification',
      },
      process.env.VERIFICATION_SECRET,
      {
        expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY || '1h', // Make expiry configurable
      },
    );
  }

  // Verify User
  static async verifyUser(token) {
    try {
      const decoded = jwt.verify(token, process.env.VERIFICATION_SECRET);

      if (decoded.type !== 'verification') {
        throw new AppError('Invalid verification token', 400);
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        throw new AppError('User  not found', 404);
      }

      // Check if the user is already verified
      if (user.kycStatus === KYC_STATUS.VERIFIED) {
        throw new AppError('User  is already verified', 400);
      }

      user.kycStatus = KYC_STATUS.VERIFIED;
      await user.save();

      return user; // Return the updated user
    } catch (error) {
      // Handle specific errors
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Verification token is invalid', 400);
      }
      throw new AppError('Verification failed: ' + (error.message || 'Unknown error'), 400);
    }
  }
}

module.exports = AuthService;
