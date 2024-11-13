// 'use strict';
// const { Client } = require('pg'); // Change this based on your DB
// const fs = require('fs');
// const path = require('path');

// const runMigrations = async () => {
//   const client = new Client({
//     connectionString: process.env.DATABASE_URL, // Your database connection string
//   });

//   try {
//     await client.connect();
//     const migrationFiles = fs
//       .readdirSync(__dirname)
//       .filter((file) => file.endsWith('.js') && file !== 'migrationRunner.js');

//     for (const file of migrationFiles) {
//       const migration = require(path.join(__dirname, file));
//       console.log(`Running migration: ${file}`);
//       await migration.up(client);
//     }

//     console.log('All migrations completed successfully.');
//   } catch (error) {
//     console.error('Error running migrations:', error);
//   } finally {
//     await client.end();
//   }
// };

// runMigrations();
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../src/config/database'); // Import your database config
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const migrationsPath = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsPath).filter((file) => file.endsWith('.js'));

const runMigrations = async () => {
  for (const file of migrationFiles) {
    const migration = require(path.join(migrationsPath, file));
    try {
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      console.log(`Migration ${file} applied successfully.`);
    } catch (error) {
      console.error(`Failed to apply migration ${file}: ${error.message}`);
    }
  }
};

runMigrations()
  .then(() => {
    console.log('All migrations completed.');
    sequelize.close();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    sequelize.close();
  });
