'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authController = require('../controllers/auth.controller');

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /register
router.post('/register', validate(registerSchema), authController.register);

// POST /login
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
