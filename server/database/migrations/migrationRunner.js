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
