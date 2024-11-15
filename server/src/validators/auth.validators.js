'use strict';
const Joi = require('joi');
const { validatorHandler } = require('../middlewares/validationMiddleware');

const signup = (req, res, next) => {
  const schema = Joi.object().keys({
    id: Joi.number().integer().optional(),
    email: Joi.string().trim().email().required(),
    phoneNumber: Joi.string().trim().required(),
    firstName: Joi.string().trim().required(),
    password: Joi.string()
      .trim()
      .pattern(
        new RegExp(
          '(?=[A-Za-z0-9@#$%^&+!=]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=])(?=.{8,}).*$',
        ),
      )
      .required(),
    middleName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    photo: Joi.string().trim().uri().optional(),
    referrer: Joi.string().trim().optional(),
    kycID: Joi.string().trim().optional(),
    falconId: Joi.string().trim().optional(),
    verifiedPhone: Joi.string().trim().optional(),
    verifiedEmail: Joi.string().trim().optional(),
    panDocNo: Joi.string().trim().optional(),
    bankId: Joi.string().trim().optional(),
    bankAccountNumber: Joi.string().trim().optional(),
    bankIFSC: Joi.string().trim().optional(),
    productId: Joi.string().trim().optional(),
    vpan: Joi.string().trim().optional(),
    inProfile: Joi.string().trim().optional(),
    instrumentId: Joi.string().trim().optional(),
    isMinor: Joi.string().trim().optional(),
    parentId: Joi.number().integer().optional(),
    roll: Joi.string().trim().valid('USER', 'ADMIN', 'SUPERADMIN').default('USER').required(),
    joinedAt: Joi.date()
      .default(() => new Date(), 'current date')
      .optional(),
    updatedAt: Joi.date()
      .default(() => new Date(), 'current date')
      .optional(),
  });

  validatorHandler(req, res, next, schema);
};

module.exports = { signup };
