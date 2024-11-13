// // database/seeds/userSeeder.js
// const { Client } = require('pg'); // Adjust based on your database
// const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt

// const seedUsers = async (client) => {
//   const users = [
//     { username: 'user1', email: 'user1@example.com', password: 'password1' },
//     { username: 'user2', email: 'user2@example.com', password: 'password2' },
//     { username: 'user3', email: 'user3@example.com', password: 'password3' },
//   ];

//   for (const user of users) {
//     const hashedPassword = await bcrypt.hash(user.password, 10); // Hash the password
//     await client.query(
//       `
//       INSERT INTO users (username, email, password)
//       VALUES ($1, $2, $3)
//       ON CONFLICT (email) DO NOTHING
//     `,
//       [user.username, user.email, hashedPassword],
//     );
//   }
// };

// module.exports = seedUsers;

'use strict';

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          username: 'john_doe',
          email: 'john.doe@example.com',
          password: 'hashed_password', // Use hashed passwords in production
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: 'jane_doe',
          email: 'jane.doe@example.com',
          password: 'hashed_password', // Use hashed passwords in production
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
