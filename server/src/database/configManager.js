'use strict';
const path = require('path');
const dotenv = require('dotenv');

class ConfigManager {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.loadEnvironmentVariables();
  }

  loadEnvironmentVariables() {
    const envFile = `.env.${this.environment}`;
    const envPath = path.resolve(process.cwd(), 'config', envFile);

    dotenv.config({
      path: envPath,
      debug: this.environment === 'development',
    });
  }

  get(key, defaultValue = null) {
    switch (key) {
      case 'env':
        return this.environment;
      case 'port':
        return process.env.PORT || defaultValue;
      case 'appName':
        return process.env.APP_NAME || 'VaultChain API';
      case 'version':
        return process.env.APP_VERSION || '1.0.0';
      case 'corsOrigin':
        return process.env.CORS_ORIGIN || '*';
      case 'payloadLimit':
        return process.env.PAYLOAD_LIMIT || '1mb';
      case 'apiPrefix':
        return process.env.API_PREFIX || '/api/v1';
      case 'mongodb':
        return {
          uri: process.env.MONGODB_URI,
          dbName: process.env.MONGODB_DB_NAME,
          options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          },
        };
      case 'postgres':
        return {
          client: 'pg',
          connection: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          },
        };
      default:
        return process.env[key.toUpperCase()] || defaultValue;
    }
  }
}

module.exports = ConfigManager;
