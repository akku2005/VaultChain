'use strict';
const { DataTypes } = require('sequelize');
const sequelizeConfig = require('../config/mysql');

const User = sequelizeConfig.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referrer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kycID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    falconId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verifiedPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verifiedEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    panDocNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankIFSC: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vpan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    inProfile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrumentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isMinor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    roll: {
      type: DataTypes.STRING(20),
      allowNull: false,
      default: 'USER', //user,admin,superadmin
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['phoneNumber'],
      },
      {
        fields: ['parentId'],
      },
      {
        fields: ['kycID'],
      },
      {
        fields: ['falconId'],
      },
      {
        fields: ['productId'],
      },
    ],
  },
);

// Defining the self-referential relationship for parent-child association
User.hasMany(User, { as: 'children', foreignKey: 'parentId' });
User.belongsTo(User, { as: 'parent', foreignKey: 'parentId' });

module.exports = User;
