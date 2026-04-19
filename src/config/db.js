'use strict';

const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(isProduction && {
    ssl: { rejectUnauthorized: false },
  }),
});

module.exports = pool;
