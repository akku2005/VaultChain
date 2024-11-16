'use strict';
const bcryptJS = require('bcryptjs');

const hashPassword = (password) => bcryptJS.hash(password, 10);
const comparePassword = (password, hashedPassword) => bcryptJS.compare(password, hashedPassword);

module.exports = {
  hashPassword,
  comparePassword,
};
