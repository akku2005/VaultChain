'use strict';
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.sequelize = new Sequelize(
      process.env.MYSQL_DATABASE,
      process.env.MYSQL_USER,
      process.env.MYSQL_PASSWORD,
      {
        host: process.env.MYSQL_HOST,
        dialect: 'mysql',
        port: process.env.MYSQL_PORT,
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          // Global model options
          timestamps: true, // Add createdAt and updatedAt
          underscored: true, // Use snake_case for automatically added attributes
          freezeTableName: true, // Use the model name as the table name
        },
      },
    );

    this.models = {};
  }

  async initialize() {
    try {
      // Authenticate connection
      await this.sequelize.authenticate();
      logger.info('✅ MySQL Connection Established Successfully');

      // Dynamically load models
      await this.loadModels();

      // Sync all models
      await this.syncModels();

      return this.sequelize;
    } catch (error) {
      logger.error('❌ MySQL Initialization Error:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async loadModels() {
    const modelPath = path.join(__dirname, './mysql');

    // Read all model files
    const modelFiles = fs
      .readdirSync(modelPath)
      .filter(
        (file) =>
          file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.slice(-3) === '.js',
      );

    // Import and initialize models
    for (const file of modelFiles) {
      const model = require(path.join(modelPath, file))(this.sequelize, Sequelize.DataTypes);
      this.models[model.name] = model;
    }

    // Setup associations if any
    Object.keys(this.models).forEach((modelName) => {
      if (this.models[modelName].associate) {
        this.models[modelName].associate(this.models);
      }
    });
  }

  async syncModels() {
    try {
      // Sync all models
      await this.sequelize.sync({
        // Use 'alter' in development to automatically add/change columns
        alter: process.env.NODE_ENV === 'development',

        // Use 'force' carefully - it will drop and recreate tables
        // force: process.env.NODE_ENV === 'development'
      });

      logger.info('✅ All MySQL Models Synchronized');
    } catch (error) {
      logger.error('❌ Model Synchronization Error:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Method to get a specific model
  getModel(modelName) {
    return this.models[modelName];
  }

  // Close connection
  async close() {
    await this.sequelize.close();
    logger.info('MySQL Connection Closed');
  }
}

module.exports = new DatabaseManager();
