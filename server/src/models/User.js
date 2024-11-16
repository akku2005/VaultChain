// 'use strict';
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const validator = require('validator');

// // Enum Definitions
// const SEGMENTS = {
//   MINOR: 'MINOR',
//   MAJOR: 'MAJOR',
// };

// const KYC_STATUS = {
//   PENDING: 'PENDING',
//   VERIFIED: 'VERIFIED',
//   REJECTED: 'REJECTED',
// };

// const UserSchema = new mongoose.Schema(
//   {
//     // Basic Information
//     firstName: {
//       type: String,
//       required: [true, 'First name is required'],
//       trim: true,
//       minlength: [2, 'First name must be at least 2 characters'],
//     },
//     middleName: {
//       type: String,
//       trim: true,
//     },
//     lastName: {
//       type: String,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       validate: {
//         validator: validator.isEmail,
//         message: 'Please provide a valid email',
//       },
//     },
//     phoneNumber: {
//       type: String,
//       required: [true, 'Phone number is required'],
//       unique: true,
//       validate: {
//         validator: function (v) {
//           return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
//         },
//         message: (props) => `${props.value} is not a valid phone number!`,
//       },
//     },
//     password: {
//       type: String,
//       required: [true, 'Password is required'],
//       minlength: [8, 'Password must be at least 8 characters'],
//       select: false,
//     },

//     // Additional Details
//     photo: {
//       type: String,
//       default: null,
//     },
//     referrer: {
//       type: String,
//       default: null,
//     },

//     // KYC and Verification
//     kycID: {
//       type: String,
//       default: null,
//     },
//     kycStatus: {
//       type: String,
//       enum: Object.values(KYC_STATUS),
//       default: KYC_STATUS.PENDING,
//     },
//     verifiedPhone: {
//       type: String,
//       default: null,
//     },
//     verifiedEmail: {
//       type: String,
//       default: null,
//     },

//     // Financial Details
//     panDocNo: {
//       type: String,
//       default: null,
//     },
//     bankId: {
//       type: String,
//       default: null,
//     },
//     bankAccountNumber: {
//       type: String,
//       default: null,
//     },
//     bankIFSC: {
//       type: String,
//       default: null,
//     },

//     // Additional Identifiers
//     productId: {
//       type: String,
//       default: null,
//     },
//     vpan: {
//       type: String,
//       default: null,
//     },
//     inProfile: {
//       type: String,
//       default: null,
//     },
//     instrumentId: {
//       type: String,
//       default: null,
//     },

//     // Family Relationship
//     isMinor: {
//       type: Boolean,
//       default: false,
//     },
//     parentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       default: null,
//     },
//     segment: {
//       type: String,
//       enum: Object.values(SEGMENTS),
//       default: SEGMENTS.MAJOR,
//     },

//     // Timestamps
//     joinedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     updatedAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   },
// );

// // Virtual for full name
// UserSchema.virtual('fullName').get(function () {
//   return `${this.firstName} ${this.middleName || ''} ${this.lastName || ''}`.trim();
// });

// // Password hashing middleware
// UserSchema.pre('save', async function (next) {
//   // Only hash the password if it has been modified
//   if (!this.isModified('password')) return next();

//   try {
//     // Hash password with cost of 12
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to check password
// UserSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Static method to check if email exists
// UserSchema.statics.isEmailTaken = async function (email) {
//   const user = await this.findOne({ email });
//   return !!user;
// };

// // Static method to check if phone number exists
// UserSchema.statics.isPhoneNumberTaken = async function (phoneNumber) {
//   const user = await this.findOne({ phoneNumber });
//   return !!user;
// };

// // Create indexes for performance
// UserSchema.index({ email: 1 }, { unique: true });
// UserSchema.index({ phoneNumber: 1 }, { unique: true });

// const User = mongoose.model('User', UserSchema);

// module.exports = {
//   User,
//   SEGMENTS,
//   KYC_STATUS,
// };

'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
});

module.exports = mongoose.model('User', userSchema);
