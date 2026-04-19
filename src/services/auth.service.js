'use strict';

const { createUser, findUserByEmail } = require('../dal/users.dal');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/token');
const { ConflictError, UnauthorizedError } = require('../utils/errors');

/**
 * Registers a new user.
 * @param {{ name: string, email: string, password: string }} param0
 * @returns {Promise<{ id: string, name: string, email: string, created_at: string }>}
 * @throws {ConflictError} if the email is already registered
 */
async function registerUser({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });
  return user;
}

/**
 * Authenticates a user and returns a signed JWT with the user object.
 * @param {{ email: string, password: string }} param0
 * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, created_at: string } }>}
 * @throws {UnauthorizedError} if credentials are invalid
 */
async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    },
  };
}

module.exports = { registerUser, loginUser };
