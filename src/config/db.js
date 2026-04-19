'use strict';

const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

// Strip sslmode from connection string so pg doesn't override our ssl config
const connectionString = DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
