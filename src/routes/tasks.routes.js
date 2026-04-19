'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const tasksController = require('../controllers/tasks.controller');

const router = Router();

// Inline Joi schemas
const taskCreateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
}).min(1);

// All task routes require authentication
router.use(authenticate);

// POST / — create a task
router.post('/', validate(taskCreateSchema), tasksController.createTask);

// GET / — list all tasks for the authenticated user
router.get('/', tasksController.listTasks);

// GET /:id — get a single task
router.get('/:id', tasksController.getTask);

// PUT /:id — update a task
router.put('/:id', validate(taskUpdateSchema), tasksController.updateTask);

// DELETE /:id — delete a task
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
