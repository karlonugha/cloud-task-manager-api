'use strict';

// Load and validate environment variables first
const { PORT } = require('./config/env');

const app = require('./app');

app.listen(PORT, () => {
  console.log(`Cloud Task Manager API listening on port ${PORT}`);
});
