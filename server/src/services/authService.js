// 'use strict';

// const { Op } = require('sequelize');
// const User = require('../models/User'); // Ensure this is your Sequelize model

// // Add a new user to the database
// const addData = async (obj) => {
//   try {
//     return await User.create(obj);
//   } catch (error) {
//     console.error('Error adding data:', error.message);
//     throw error;
//   }
// };

// // Get one user based on conditions
// const getOneUserByCond = async (cond) => {
//   try {
//     return await User.findOne({
//       where: cond,
//     });
//   } catch (error) {
//     console.error('Error finding user by condition:', error.message);
//     throw error;
//   }
// };

// // Find user by email verification token
// const findByVerificationToken = async (token, userId) => {
//   try {
//     return await User.findOne({
//       where: {
//         id: userId,
//         emailVerificationToken: token,
//         emailVerificationTokenExpires: {
//           [Op.gt]: new Date(), // Ensure token is not expired
//         },
//         emailVerified: false, // Ensure email is not already verified
//       },
//     });
//   } catch (error) {
//     console.error('Error finding user by verification token:', error.message);
//     throw error;
//   }
// };

// // Verify user's email
// const verifyUserEmail = async (userId) => {
//   try {
//     return await User.update(
//       {
//         emailVerified: true,
//         emailVerificationToken: null,
//         emailVerificationTokenExpires: null,
//       },
//       {
//         where: { id: userId },
//       },
//     );
//   } catch (error) {
//     console.error('Error verifying user email:', error.message);
//     throw error;
//   }
// };

// // Find unverified user by email
// const findUnverifiedUserByEmail = async (email) => {
//   try {
//     return await User.findOne({
//       where: {
//         email: email.toLowerCase(),
//         emailVerified: false,
//       },
//     });
//   } catch (error) {
//     console.error('Error finding unverified user by email:', error.message);
//     throw error;
//   }
// };

// // Update email verification token and expiration
// const updateVerificationToken = async (userId, token, expires) => {
//   try {
//     return await User.update(
//       {
//         emailVerificationToken: token,
//         emailVerificationTokenExpires: expires,
//       },
//       {
//         where: { id: userId },
//       },
//     );
//   } catch (error) {
//     console.error('Error updating verification token:', error.message);
//     throw error;
//   }
// };

// // Check if user's email is verified
// const isEmailVerified = async (userId) => {
//   try {
//     const user = await User.findByPk(userId);
//     return user ? user.emailVerified : false;
//   } catch (error) {
//     console.error('Error checking if email is verified:', error.message);
//     throw error;
//   }
// };

// // Find user by email
// const findByEmail = async (email) => {
//   console.log('Finding user with email:', email.toLowerCase());
//   const user = await User.findOne({
//     where: { email: email.toLowerCase() },
//   });
//   console.log('Result:', user);
//   return user;
// };

// module.exports = {
//   addData,
//   getOneUserByCond,
//   findByVerificationToken,
//   verifyUserEmail,
//   findUnverifiedUserByEmail,
//   updateVerificationToken,
//   isEmailVerified,
//   findByEmail,
// };

'use strict';

const { Op } = require('sequelize');
const User = require('../models/User'); // Ensure this is your Sequelize model

// Add a new user to the database
const addData = async (obj) => {
  try {
    return await User.create(obj);
  } catch (error) {
    console.error('Error adding data:', error.message);
    throw error;
  }
};

// Get one user based on conditions
const getOneUserByCond = async (cond) => {
  try {
    return await User.findOne({
      where: cond,
    });
  } catch (error) {
    console.error('Error finding user by condition:', error.message);
    throw error;
  }
};

// Find user by email verification token
const findByVerificationToken = async (token, userId) => {
  try {
    return await User.findOne({
      where: {
        id: userId,
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          [Op.gt]: new Date(), // Ensure token is not expired
        },
        isEmailVerified: false, // Correct column name
      },
    });
  } catch (error) {
    console.error('Error finding user by verification token:', error.message);
    throw error;
  }
};

// Verify user's email
const verifyUserEmail = async (userId) => {
  try {
    return await User.update(
      {
        isEmailVerified: true, // Correct column name
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
      {
        where: { id: userId },
      },
    );
  } catch (error) {
    console.error('Error verifying user email:', error.message);
    throw error;
  }
};

// Find unverified user by email
const findUnverifiedUserByEmail = async (email) => {
  try {
    return await User.findOne({
      where: {
        email: email.toLowerCase(),
        isEmailVerified: false, // Correct column name
      },
    });
  } catch (error) {
    console.error('Error finding unverified user by email:', error.message);
    throw error;
  }
};

// Update email verification token and expiration
const updateVerificationToken = async (userId, token, expires) => {
  try {
    return await User.update(
      {
        emailVerificationToken: token,
        emailVerificationTokenExpires: expires,
      },
      {
        where: { id: userId },
      },
    );
  } catch (error) {
    console.error('Error updating verification token:', error.message);
    throw error;
  }
};

// Check if user's email is verified
const isEmailVerified = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user ? user.isEmailVerified : false; // Correct column name
  } catch (error) {
    console.error('Error checking if email is verified:', error.message);
    throw error;
  }
};

// Find user by email
const findByEmail = async (email) => {
  console.log('Finding user with email:', email.toLowerCase());
  const user = await User.findOne({
    where: { email: email.toLowerCase() },
  });
  console.log('Result:', user);
  return user;
};

module.exports = {
  addData,
  getOneUserByCond,
  findByVerificationToken,
  verifyUserEmail,
  findUnverifiedUserByEmail,
  updateVerificationToken,
  isEmailVerified,
  findByEmail,
};
