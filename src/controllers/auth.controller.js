'use strict';

const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 * Registers a new user and responds with 201 + user object.
 */
async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and responds with 200 + { token, user }.
 */
async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
