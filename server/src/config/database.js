'use strict';
require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? './config/.env.production'
      : './config/.env.development',
});

module.exports = {
  development: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2'), // Explicitly require mysql2
    dialectOptions: {
      // Remove authPlugin if causing issues
      connectTimeout: 10000,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: console.log,
  },
  test: {
    // Similar configuration
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
  },
  production: {
    // Similar configuration
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
  },
};
