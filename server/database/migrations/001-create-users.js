// database/migrations/001-create-users.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: _Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: _Sequelize.STRING,
        allowNull: false,
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
        defaultValue: _Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: _Sequelize.DATE,
        allowNull: false,
        defaultValue: _Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
