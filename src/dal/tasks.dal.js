'use strict';

const pool = require('../config/db');

/**
 * Inserts a new task and returns the full row.
 * @param {{ userId: string, title: string, description?: string }} param0
 * @returns {Promise<object>}
 */
async function createTask({ userId, title, description }) {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, title, description ?? null]
  );
  return result.rows[0];
}

/**
 * Returns all tasks for a user ordered by created_at DESC.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function getTasksByUserId(userId) {
  const result = await pool.query(
    `SELECT * FROM tasks
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Returns a single task by id, or null if not found.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getTaskById(id) {
  const result = await pool.query(
    `SELECT * FROM tasks WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/**
 * Updates only the provided fields on a task, always setting updated_at = NOW().
 * @param {string} id
 * @param {{ title?: string, description?: string, status?: string }} fields
 * @returns {Promise<object>}
 */
async function updateTask(id, fields) {
  const allowed = ['title', 'description', 'status'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(fields[key]);
      paramIndex++;
    }
  }

  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);

  values.push(id); // last param for WHERE clause

  const result = await pool.query(
    `UPDATE tasks
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  return result.rows[0];
}

/**
 * Deletes a task by id and returns the deleted row.
 * @param {string} id
 * @returns {Promise<object>}
 */
async function deleteTask(id) {
  const result = await pool.query(
    `DELETE FROM tasks WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

module.exports = { createTask, getTasksByUserId, getTaskById, updateTask, deleteTask };
