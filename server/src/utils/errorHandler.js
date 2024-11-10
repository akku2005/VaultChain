// 'use strict';

// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message);
//     this.statusCode = statusCode;
//     this.isOperational = true;

//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// const handleError = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// };

// module.exports = {
//   AppError,
//   handleError,
// };
