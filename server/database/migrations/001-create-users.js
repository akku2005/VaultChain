// 'use strict';
// const { Client } = require('pg'); // Assuming you're using PostgreSQL

// const up = async (client) => {
//   await client.query(`
//     CREATE TABLE users (
//       id SERIAL PRIMARY KEY,
//       username VARCHAR(50) NOT NULL UNIQUE,
//       email VARCHAR(100) NOT NULL UNIQUE,
//       password VARCHAR(100) NOT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `);
// };

// const down = async (client) => {
//   await client.query(`DROP TABLE IF EXISTS users`);
// };

// module.exports = { up, down };
