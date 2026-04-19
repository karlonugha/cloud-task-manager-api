'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { UnauthorizedError } = require('./errors');

/**
 * Signs a JWT for the given user payload.
 * @param {{ userId: string, email: string }} payload
 * @returns {string} signed JWT
 */
function signToken(payload) {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verifies a JWT and returns the decoded payload.
 * @param {string} token
 * @returns {{ userId: string, email: string }}
 * @throws {UnauthorizedError} if the token is invalid or expired
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

module.exports = { signToken, verifyToken };
