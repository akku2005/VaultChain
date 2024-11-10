// 'use strict';
// const { Client } = require('pg');

// const up = async (client) => {
//   await client.query(`
//     CREATE TABLE wallets (
//       id SERIAL PRIMARY KEY,
//       user_id INTEGER REFERENCES users(id),
//       balance DECIMAL(10, 2) DEFAULT 0.00,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `);
// };

// const down = async (client) => {
//   await client.query(`DROP TABLE IF EXISTS wallets`);
// };

// module.exports = { up, down };
