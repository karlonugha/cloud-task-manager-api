'use strict';

const { AppError } = require('../utils/errors');

/**
 * Global Express error handler.
 * Maps AppError subclasses to their statusCode.
 * Logs unknown errors server-side and returns 500.
 * Always responds with { status, message } — never exposes stack or file paths.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  }

  // Unknown / unhandled error — log server-side, never expose internals
  console.error(err);

  return res.status(500).json({
    status: 500,
    message: 'Internal server error',
  });
}

module.exports = errorHandler;
