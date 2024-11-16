'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(db, mongoose) {
    // Create users collection
    const userSchema = new mongoose.Schema(
      {
        username: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          lowercase: true,
        },
        email: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          lowercase: true,
        },
        password: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['user', 'admin', 'moderator'],
          default: 'user',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        profile: {
          firstName: String,
          lastName: String,
          avatarUrl: String,
        },
      },
      {
        timestamps: true,
      },
    );

    // Create the model
    const User = db.model('User', userSchema);

    // Optional: Create initial admin user
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
      },
    });
  },

  async down(db) {
    // Rollback migration - drop users collection
    await db.dropCollection('users');
  },
};
