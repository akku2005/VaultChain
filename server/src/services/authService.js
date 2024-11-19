'use strict';

const { Op } = require('sequelize');
const User = require('../models/User');

// Existing methods
let addData = async (obj) => {
  return await User.create(obj);
};

let getOneUserByCond = async (cond) => {
  return await User.findOne({
    where: cond,
  });
};

// New methods for email verification
let findByVerificationToken = async (token, userId) => {
  return await User.findOne({
    where: {
      id: userId,
      emailVerificationToken: token,
      emailVerificationTokenExpires: {
        [Op.gt]: new Date(), // Token not expired
      },
      emailVerified: false,
    },
  });
};

let verifyUserEmail = async (userId) => {
  return await User.update(
    {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
    {
      where: { id: userId },
    },
  );
};

let findUnverifiedUserByEmail = async (email) => {
  return await User.findOne({
    where: {
      email: email.toLowerCase(),
      emailVerified: false,
    },
  });
};

let updateVerificationToken = async (userId, token, expires) => {
  return await User.update(
    {
      emailVerificationToken: token,
      emailVerificationTokenExpires: expires,
    },
    {
      where: { id: userId },
    },
  );
};

// Optional: Method to check if email is verified
let isEmailVerified = async (userId) => {
  const user = await User.findByPk(userId);
  return user ? user.emailVerified : false;
};

module.exports = {
  addData,
  getOneUserByCond,
  findByVerificationToken,
  verifyUserEmail,
  findUnverifiedUserByEmail,
  updateVerificationToken,
  isEmailVerified,
};
