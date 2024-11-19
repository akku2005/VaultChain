'use strict';
const { DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sequelizeConfig = require('../database/mysql');

const User = sequelizeConfig.define(
  'User',
  {
    // Unique Identifier
    // id: {
    //   type: DataTypes.UUID,
    //   primaryKey: true,
    //   defaultValue: DataTypes.UUIDV4,
    //   allowNull: false,
    // },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Authentication Credentials
    email: {
      type: DataTypes.STRING(255),
      unique: {
        name: 'unique_email',
        msg: 'Email address is already in use',
      },
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
        notEmpty: {
          msg: 'Email cannot be empty',
        },
      },
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    phoneNumber: {
      type: DataTypes.STRING(15),
      unique: {
        name: 'unique_phone_number',
        msg: 'Phone number is already in use',
      },
      allowNull: false,
      validate: {
        is: {
          args: /^(\+91)?[6-9]\d{9}$/,
          msg: 'Invalid Indian mobile number',
        },
        async isUnique(value) {
          const existingUser = await User.findOne({
            where: {
              phoneNumber: value,
              id: {
                [Op.ne]: this.id, // Exclude current user when updating
              },
            },
          });
          if (existingUser) {
            throw new Error('Phone number is already in use');
          }
        },
      },
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: 'Password must be at least 8 characters long',
        },
        passwordStrength(value) {
          // Only validate the original password, not the hashed one
          if (!value.startsWith('$2a$')) {
            const passwordRegex =
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(value)) {
              throw new Error(
                'Password must include uppercase, lowercase, number, and special character',
              );
            }
          }
        },
      },
    },

    // Personal Information
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'First name must be between 2 and 100 characters',
        },
      },
    },

    middleName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isAdult(value) {
          if (value) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            if (age < 18) {
              throw new Error('User must be at least 18 years old');
            }
          }
        },
      },
    },

    // Compliance and Verification
    kycStatus: {
      type: DataTypes.ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'NOT_VERIFIED',
      allowNull: false,
    },

    panNumber: {
      type: DataTypes.STRING(10),
      unique: {
        name: 'unique_pan_number',
        msg: 'PAN number is already in use',
      },
      allowNull: true,
      validate: {
        is: {
          args: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
          msg: 'Invalid PAN number format',
        },
        async isUnique(value) {
          if (value) {
            const existingUser = await User.findOne({
              where: {
                panNumber: value,
                id: {
                  [Op.ne]: this.id, // Exclude current user when updating
                },
              },
            });
            if (existingUser) {
              throw new Error('PAN number is already in use');
            }
          }
        },
      },
    },

    aadhaarNumber: {
      type: DataTypes.STRING(12),
      unique: {
        name: 'unique_aadhaar_number',
        msg: 'Aadhaar number is already in use',
      },
      allowNull: true,
      validate: {
        is: {
          args: /^\d{12}$/,
          msg: 'Invalid Aadhaar number',
        },
        async isUnique(value) {
          if (value) {
            const existingUser = await User.findOne({
              where: {
                aadhaarNumber: value,
                id: {
                  [Op.ne]: this.id, // Exclude current user when updating
                },
              },
            });
            if (existingUser) {
              throw new Error('Aadhaar number is already in use');
            }
          }
        },
      },
    },

    // Authentication & Security
    role: {
      type: DataTypes.ENUM('USER', 'INVESTOR', 'ADMIN', 'SUPER_ADMIN'),
      defaultValue: 'USER',
      allowNull: false,
    },

    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    accountLockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Financial Profile
    investmentProfile: {
      type: DataTypes.ENUM('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'),
      defaultValue: 'MODERATE',
      allowNull: false,
    },

    annualIncome: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Annual income cannot be negative',
        },
      },
    },

    // DeFi Specific Fields
    walletAddress: {
      type: DataTypes.STRING(42),
      unique: {
        name: 'unique_wallet_address',
        msg: 'Wallet address is already in use',
      },
      allowNull: true,
      validate: {
        isEthereumAddress(value) {
          if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
            throw new Error('Invalid Ethereum wallet address');
          }
        },
        async isUnique(value) {
          if (value) {
            const existingUser = await User.findOne({
              where: {
                walletAddress: value,
                id: {
                  [Op.ne]: this.id, // Exclude current user when updating
                },
              },
            });
            if (existingUser) {
              throw new Error('Wallet address is already in use');
            }
          }
        },
      },
    },

    referralCode: {
      type: DataTypes.STRING(50),
      unique: {
        name: 'unique_referral_code',
        msg: 'Referral code is already in use',
      },
      defaultValue: () => uuidv4().substr(0, 8).toUpperCase(),
    },

    referredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      validate: {
        async isValidReferrer(value) {
          if (value) {
            const referrer = await User.findByPk(value);
            if (!referrer) {
              throw new Error('Invalid referrer');
            }
          }
        },
      },
    },

    // Regulatory Compliance
    riskProfile: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      defaultValue: 'LOW',
    },

    taxResidency: {
      type: DataTypes.STRING(50),
      defaultValue: 'INDIA',
    },

    // Profile Metadata
    profileCompletionStatus: {
      type: DataTypes.ENUM('INCOMPLETE', 'PARTIAL', 'COMPLETE'),
      defaultValue: 'INCOMPLETE',
    },

    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    coverPhoto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
    timestamps: true,
  },
);

// Instance Methods
User.prototype.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    const lockDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.accountLockUntil = new Date(Date.now() + lockDuration);
  }
  await this.save();
};

User.prototype.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.accountLockUntil = null;
  await this.save();
};

module.exports = User;
