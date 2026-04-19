'use strict';

require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

const missing = [];
if (!DATABASE_URL) missing.push('DATABASE_URL');
if (!JWT_SECRET) missing.push('JWT_SECRET');

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Please set them in your .env file or environment.'
  );
}

module.exports = {
  DATABASE_URL,
  JWT_SECRET,
  PORT: Number(PORT),
};
