'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Factory function that returns Express middleware validating req.body
 * against the provided Joi schema.
 *
 * On validation failure: throws ValidationError with the first detail message.
 * On success: calls next().
 *
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return function validationMiddleware(req, res, next) {
    const { error } = schema.validate(req.body, { abortEarly: true });
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    next();
  };
}

module.exports = validate;
