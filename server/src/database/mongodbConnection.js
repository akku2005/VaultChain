// 'use strict';
// const mongoose = require('mongoose');
// const logger = require('../utils/logger');

// class MongoDBConfig {
//   constructor() {
//     this.connection = null;
//   }

//   async connect() {
//     try {
//       const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/defiplatform';

//       this.connection = await mongoose.connect(mongoUri, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });

//       mongoose.connection.on('connected', () => {
//         logger.info('MongoDB connected successfully');
//       });

//       mongoose.connection.on('error', (err) => {
//         logger.error('MongoDB connection error', {
//           errorMessage: err.message,
//           errorStack: err.stack,
//         });
//       });

//       return this.connection;
//     } catch (error) {
//       logger.error('Failed to connect to MongoDB', {
//         errorMessage: error.message,
//         errorStack: error.stack,
//       });
//       throw error;
//     }
//   }

//   async closeConnection() {
//     try {
//       if (this.connection) {
//         await mongoose.connection.close();
//         logger.info('MongoDB connection closed');
//       }
//     } catch (error) {
//       logger.error('Error closing MongoDB connection', {
//         errorMessage: error.message,
//         errorStack: error.stack,
//       });
//     }
//   }
// }

// module.exports = new MongoDBConfig();
