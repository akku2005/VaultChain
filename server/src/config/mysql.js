'use strict';
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.initializeConnection();
  }

  initializeConnection() {
    try {
      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: parseInt(process.env.MYSQL_CONNECT_TIMEOUT) || 10000,
        authPlugin: 'mysql_native_password',
      });

      logger.info('MySQL Connection Pool Initialized', {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
      });
    } catch (error) {
      logger.error('MySQL Connection Pool Initialization Failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async getConnection() {
    try {
      const connection = await this.pool.getConnection();
      return connection;
    } catch (error) {
      logger.error('Failed to Get MySQL Connection', {
        error: error.message,
      });
      throw error;
    }
  }

  async query(sql, params = []) {
    let connection;
    try {
      connection = await this.getConnection();
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('MySQL Query Error', {
        sql,
        params,
        error: error.message,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async closeConnection() {
    try {
      await this.pool.end();
      logger.info('MySQL Connection Pool Closed');
    } catch (error) {
      logger.error('Error Closing MySQL Connection Pool', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new MySQLDatabase();
