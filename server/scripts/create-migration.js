'use strict';
const fs = require('fs');
const path = require('path');

// Get migration name from command line argument
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

// Generate timestamp
const timestamp = Date.now();
const filename = `${timestamp}-${migrationName}.js`;
const filepath = path.join(__dirname, '../database/migrations', filename);

// Migration template
const migrationTemplate = `
module.exports = {
  async up(db, mongoose) {
    // Migration up logic
    console.log('Running migration: ${migrationName}');
  },

  async down(db, mongoose) {
    // Migration rollback logic
    console.log('Rolling back migration: ${migrationName}');
  }
};
`;

// Write migration file
fs.writeFileSync(filepath, migrationTemplate);
console.log(`Migration created: ${filename}`);
