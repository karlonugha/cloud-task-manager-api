'use strict';

const bcrypt = require('bcrypt');

const COST_FACTOR = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} plaintext
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, COST_FACTOR);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param {string} plaintext
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = { hashPassword, comparePassword };
