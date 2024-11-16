'use strict';
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class MongoMigrationManager {
  constructor(options = {}) {
    this.migrationsPath = options.migrationsPath || path.join(__dirname);
    this.migrationCollection = options.migrationCollection || 'migrations';
  }

  async connect() {
    const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    return mongoose.connection.db;
  }

  async runMigrations() {
    const db = await this.connect();

    // Ensure migrations collection exists
    const migrationCollection = db.collection(this.migrationCollection);

    // Get list of migration files
    const migrationFiles = await this.getMigrationFiles();

    // Track applied migrations
    for (const migrationFile of migrationFiles) {
      const migrationName = path.basename(migrationFile);

      // Check if migration has already been applied
      const existingMigration = await migrationCollection.findOne({ name: migrationName });

      if (!existingMigration) {
        try {
          // Import and run migration
          const migration = require(migrationFile);

          if (typeof migration.up === 'function') {
            await migration.up(db, mongoose);

            // Record successful migration
            await migrationCollection.insertOne({
              name: migrationName,
              appliedAt: new Date(),
            });

            console.log(`Migration ${migrationName} applied successfully`);
          }
        } catch (error) {
          console.error(`Migration ${migrationName} failed:`, error);
          throw error;
        }
      }
    }
  }

  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationsPath);
    return files
      .filter(
        (file) => file.endsWith('.js') && file !== 'migrationRunner.js' && !file.includes('seed'),
      )
      .sort()
      .map((file) => path.join(this.migrationsPath, file));
  }

  async rollbackLastMigration() {
    const db = await this.connect();
    const migrationCollection = db.collection(this.migrationCollection);

    // Find the last applied migration
    const lastMigration = await migrationCollection
      .find()
      .sort({ appliedAt: -1 })
      .limit(1)
      .toArray();

    if (lastMigration.length > 0) {
      const migrationName = lastMigration[0].name;
      const migrationPath = path.join(this.migrationsPath, migrationName);

      try {
        const migration = require(migrationPath);

        if (typeof migration.down === 'function') {
          await migration.down(db, mongoose);

          // Remove migration record
          await migrationCollection.deleteOne({ name: migrationName });

          console.log(`Rollback of ${migrationName} successful`);
        }
      } catch (error) {
        console.error(`Rollback of ${migrationName} failed:`, error);
        throw error;
      }
    }
  }
}

module.exports = MongoMigrationManager;
