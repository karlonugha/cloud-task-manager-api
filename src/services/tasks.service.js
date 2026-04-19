'use strict';

const dal = require('../dal/tasks.dal');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const RECOGNIZED_UPDATE_KEYS = ['title', 'description', 'status'];

/**
 * Creates a new task for the given user.
 * @param {string} userId
 * @param {{ title: string, description?: string }} param1
 * @returns {Promise<object>}
 */
async function createTask(userId, { title, description }) {
  return dal.createTask({ userId, title, description });
}

/**
 * Returns all tasks belonging to the given user.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function listTasks(userId) {
  return dal.getTasksByUserId(userId);
}

/**
 * Returns a single task, enforcing ownership.
 * @param {string} userId
 * @param {string} taskId
 * @returns {Promise<object>}
 * @throws {NotFoundError} if task does not exist
 * @throws {ForbiddenError} if task belongs to a different user
 */
async function getTask(userId, taskId) {
  const task = await dal.getTaskById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  if (task.user_id !== userId) {
    throw new ForbiddenError('Access denied');
  }
  return task;
}

/**
 * Updates a task, enforcing ownership and requiring at least one recognized field.
 * @param {string} userId
 * @param {string} taskId
 * @param {object} fields
 * @returns {Promise<object>}
 * @throws {NotFoundError} if task does not exist
 * @throws {ForbiddenError} if task belongs to a different user
 * @throws {ValidationError} if no recognized fields are provided
 */
async function updateTask(userId, taskId, fields) {
  // Ownership check
  await getTask(userId, taskId);

  // Require at least one recognized field
  const hasRecognizedField = RECOGNIZED_UPDATE_KEYS.some(
    (key) => Object.prototype.hasOwnProperty.call(fields, key)
  );
  if (!hasRecognizedField) {
    throw new ValidationError('At least one field (title, description, status) must be provided');
  }

  return dal.updateTask(taskId, fields);
}

/**
 * Deletes a task, enforcing ownership.
 * @param {string} userId
 * @param {string} taskId
 * @returns {Promise<object>}
 * @throws {NotFoundError} if task does not exist
 * @throws {ForbiddenError} if task belongs to a different user
 */
async function deleteTask(userId, taskId) {
  // Ownership check
  await getTask(userId, taskId);
  return dal.deleteTask(taskId);
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
