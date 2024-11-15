'use strict';
const express = require('express');
const router = express.Router();

const authRoutes = require('./v1/authRoutes');
// const userRoutes = require('./userRoutes');
// const walletRoutes = require('./walletRoutes');
// const transactionRoutes = require('./transactionRoutes');
// const strategyRoutes = require('./strategyRoutes');

// Centralized route management
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/wallets', walletRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/strategies', strategyRoutes);

module.exports = router;
