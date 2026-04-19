'use strict';

const pool = require('../config/db');

/**
 * Inserts a new user and returns the row without password_hash.
 * @param {{ name: string, email: string, passwordHash: string }} param0
 * @returns {Promise<{ id: string, name: string, email: string, created_at: string }>}
 */
async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

/**
 * Finds a user by email, including password_hash (for auth).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, name, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
}

/**
 * Finds a user by id, excluding password_hash.
 * @param {string} id
 * @returns {Promise<{ id: string, name: string, email: string, created_at: string }|null>}
 */
async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

module.exports = { createUser, findUserByEmail, findUserById };
