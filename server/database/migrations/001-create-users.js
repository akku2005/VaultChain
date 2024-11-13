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
'use strict';

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    // Prefix Sequelize with an underscore
    await queryInterface.createTable('Users', {
      id: {
        type: _Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: _Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: _Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: _Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: _Sequelize.DATE,
        allowNull: false,
        defaultValue: _Sequelize.fn('now'),
      },
      updatedAt: {
        type: _Sequelize.DATE,
        allowNull: false,
        defaultValue: _Sequelize.fn('now'),
      },
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('Users');
  },
};
