// 'use strict';

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const dotenv = require('dotenv');

// // Load environment configurations
// dotenv.config({
//   path: `./config/.env.${process.env.NODE_ENV || 'development'}`,
// });

// const { PORT, MONGODB_URI } = require('./src/config/environment');

// const routes = require('./src/routes');
// const errorMiddleware = require('./src/middlewares/errorMiddleware');
// const logger = require('./src/utils/logger');

// class Server {
//   constructor() {
//     this.app = express();
//     this.initializeMiddlewares();
//     this.initializeRoutes();
//     this.handleUncaughtErrors();
//   }

//   initializeMiddlewares() {
//     this.app.use(helmet());
//     this.app.use(cors());
//     this.app.use(express.json());
//     this.app.use(express.urlencoded({ extended: true }));
//   }

//   // Static method to handle database connection
//   static async connectDatabase() {
//     try {
//       await mongoose.connect(MONGODB_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
//       logger.info('MongoDB connected successfully');
//     } catch (error) {
//       logger.error('MongoDB connection error:', error);
//       process.exit(1);
//     }
//   }

//   initializeRoutes() {
//     this.app.use('/api/v1', routes);
//     this.app.use(errorMiddleware);
//   }

//   // Static method for handling uncaught errors
//   static handleUncaughtErrors() {
//     process.on('uncaughtException', (error) => {
//       logger.error('Uncaught Exception:', error);
//       process.exit(1);
//     });

//     process.on('unhandledRejection', (reason, promise) => {
//       logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//       process.exit(1);
//     });
//   }

//   start() {
//     // Call the static method to connect database before starting server
//     Server.connectDatabase();

//     this.app.listen(PORT, () => {
//       logger.info(`Server running on port ${PORT}`);
//     });
//   }
// }

// const server = new Server();
// server.start();

// module.exports = server.app;

'use strict';
const express = require('express');
const app = express();
const PORT = 8080;

// Corrected route handler
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Corrected listen function with console log
app.listen(PORT, () => {
  console.log(`Server is running at Port ${PORT}`);
});
