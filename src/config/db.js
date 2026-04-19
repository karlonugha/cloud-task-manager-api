'use strict';

const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

// Parse the connection string manually to allow SSL override
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  },
});

module.exports = pool;
