// // database/seeds/seedRunner.js
// const { Client } = require('pg'); // Adjust based on your database
// const seedUsers = require('./userSeeder');
// const seedNetworks = require('./networkSeeder');

// const runSeeds = async () => {
//   const client = new Client({
//     connectionString: process.env.DATABASE_URL, // Your database connection string
//   });

//   try {
//     await client.connect();
//     console.log('Seeding users...');
//     await seedUsers(client);
//     console.log('Users seeded successfully.');

//     console.log('Seeding networks...');
//     await seedNetworks(client);
//     console.log('Networks seeded successfully.');

//     console.log('Seeding completed successfully.');
//   } catch (error) {
//     console.error('Error running seeds:', error);
//   } finally {
//     await client.end();
//   }
// };

// runSeeds();
