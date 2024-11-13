// src/config/mysql.js
'use strict';

const mysql = require('mysql2');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10,
  connectTimeout: process.env.MYSQL_CONNECT_TIMEOUT || 10000,
});

pool.getConnection((err, connection) => {
  if (err) {
    logger.error('❌ MySQL Connection Error:', { error: err.message });
    return;
  }
  logger.info('✅ MySQL Connected Successfully');
  connection.release();
});

module.exports = pool.promise(); // Enables async/await for queries
