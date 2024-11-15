// Authentication service
'use strict';

const User = require('../models/User');

let addData = async (obj) => {
  return await User.create(obj);
};
let getOneUserByCond = async (cond) => {
  return await User.findOne({
    where: cond,
  });
};

module.exports = {
  addData,
  getOneUserByCond,
};
