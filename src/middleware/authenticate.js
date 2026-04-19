'use strict';

const { verifyToken } = require('../utils/token');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Express middleware that authenticates requests via a Bearer JWT.
 *
 * Reads the Authorization header, extracts the Bearer token,
 * verifies it, and attaches req.user = { userId, email }.
 *
 * Throws UnauthorizedError if the header is absent or the token is invalid/expired.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or malformed');
  }

  const token = authHeader.slice(7); // strip "Bearer "

  // verifyToken throws UnauthorizedError on invalid/expired token
  const payload = verifyToken(token);
  req.user = { userId: payload.userId, email: payload.email };

  next();
}

module.exports = authenticate;
