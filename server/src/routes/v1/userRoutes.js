// User-related routes
'use strict';
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

module.exports = {
  path: '/users',
  router: router
    .get('/', UserController.listUsers)
    .post('/', UserController.createUser)
    .get('/:id', UserController.getUserById)
    .put('/:id', UserController.updateUser)
    .delete('/:id', UserController.deleteUser),
};
