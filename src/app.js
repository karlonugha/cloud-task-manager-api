'use strict';

const express = require('express');
const authRouter = require('./routes/auth.routes');
const tasksRouter = require('./routes/tasks.routes');
const errorHandler = require('./middleware/errorHandler');

/**
 * Express app factory.
 * Does NOT call app.listen — keeps the app testable.
 */
function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json());

  // Simple request logger
  app.use((req, _res, next) => {
    console.log(req.method, req.url);
    next();
  });

  // Routers
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', tasksRouter);

  // 404 catch-all
  app.use((_req, res) => {
    res.status(404).json({ status: 404, message: 'Route not found' });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
