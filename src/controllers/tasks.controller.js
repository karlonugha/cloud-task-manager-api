'use strict';

const tasksService = require('../services/tasks.service');

/**
 * POST /api/tasks
 * Creates a new task for the authenticated user. Responds 201.
 */
async function createTask(req, res, next) {
  try {
    const task = await tasksService.createTask(req.user.userId, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks
 * Lists all tasks for the authenticated user. Responds 200.
 */
async function listTasks(req, res, next) {
  try {
    const tasks = await tasksService.listTasks(req.user.userId);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id
 * Returns a single task by id. Responds 200.
 */
async function getTask(req, res, next) {
  try {
    const task = await tasksService.getTask(req.user.userId, req.params.id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id
 * Updates a task. Responds 200.
 */
async function updateTask(req, res, next) {
  try {
    const task = await tasksService.updateTask(req.user.userId, req.params.id, req.body);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 * Deletes a task. Responds 200 with { message: 'Task deleted' }.
 */
async function deleteTask(req, res, next) {
  try {
    await tasksService.deleteTask(req.user.userId, req.params.id);
    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
