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

'use strict';

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    // Prefix Sequelize with an underscore
    await queryInterface.createTable('Wallets', {
      id: {
        type: _Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: _Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Referencing Users table
          key: 'id',
        },
        onDelete: 'CASCADE', // When the user is deleted, delete their wallets as well
      },
      balance: {
        type: _Sequelize.DECIMAL,
        defaultValue: 0.0,
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
    await queryInterface.dropTable('Wallets');
  },
};
