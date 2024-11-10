// // database/seeds/networkSeeder.js
// const { Client } = require('pg'); // Adjust based on your database

// const seedNetworks = async (client) => {
//   const networks = [
//     { name: 'Ethereum', symbol: 'ETH' },
//     { name: 'Binance Smart Chain', symbol: 'BNB' },
//     { name: 'Polygon', symbol: 'MATIC' },
//   ];

//   for (const network of networks) {
//     await client.query(
//       `
//       INSERT INTO networks (name, symbol)
//       VALUES ($1, $2)
//       ON CONFLICT (name) DO NOTHING
//     `,
//       [network.name, network.symbol],
//     );
//   }
// };

// module.exports = seedNetworks;
