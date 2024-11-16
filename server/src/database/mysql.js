// src/config/mysql.js
'use strict';

// const mysql = require('mysql2');
const Sequlize = require('sequelize');
// const logger = require('../utils/logger');

// const pool = mysql.createPool({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE,
//   port: process.env.MYSQL_PORT,
//   waitForConnections: true,
//   connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10,
//   connectTimeout: process.env.MYSQL_CONNECT_TIMEOUT || 10000,
// });

// pool.getConnection((err, connection) => {
//   if (err) {
//     logger.error('❌ MySQL Connection Error:', { error: err.message });
//     return;
//   }
//   logger.info('✅ MySQL Connected Successfully');
//   connection.release();
// });

const sequlize = new Sequlize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: process.env.MYSQL_PORT,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  },
);

module.exports = sequlize; // Enables async/await for queries
