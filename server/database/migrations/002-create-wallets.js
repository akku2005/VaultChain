'use strict';
module.exports = {
  async up(db, mongoose) {
    // Create wallets collection
    const walletSchema = new mongoose.Schema(
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User ',
          required: true,
        },
        address: {
          type: String,
          required: true,
          unique: true,
        },
        networkType: {
          type: String,
          enum: ['ethereum', 'polygon', 'binance'],
          required: true,
        },
        balance: {
          type: Number,
          default: 0,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      {
        timestamps: true,
      },
    );

    // Create the model
    db.model('Wallet', walletSchema);
  },

  async down(db) {
    // Rollback migration - drop wallets collection
    await db.dropCollection('wallets');
  },
};
