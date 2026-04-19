'use strict';

// Set required environment variables for unit tests before any module loads
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';
process.env.PORT = process.env.PORT || '3000';
