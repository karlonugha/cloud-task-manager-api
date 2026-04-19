'use strict';

// Feature: cloud-task-manager-api, Property 4: Invalid status values are always rejected
// Feature: cloud-task-manager-api, Property 8: Input validation always runs before any DB operation
// Feature: cloud-task-manager-api, Property 9: Invalid or absent Auth_Token always produces 401 on protected endpoints
// Feature: cloud-task-manager-api, Property 11: Malformed request bodies are always rejected with 400

const fc = require('fast-check');
const Joi = require('joi');
const validate = require('../../../src/middleware/validate');
const authenticate = require('../../../src/middleware/authenticate');
const { ValidationError, UnauthorizedError } = require('../../../src/utils/errors');
const { signToken } = require('../../../src/utils/token');

// ---------------------------------------------------------------------------
// Schemas used in tests (mirrors what routes will use)
// ---------------------------------------------------------------------------

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

const taskCreateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string()
    .valid(...VALID_STATUSES)
    .optional(),
}).min(1);

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Runs the validate middleware synchronously and returns the thrown error,
 * or null if next() was called without error.
 */
function runValidate(schema, body) {
  const middleware = validate(schema);
  const req = { body };
  let thrown = null;
  let nextCalled = false;
  try {
    middleware(req, {}, () => {
      nextCalled = true;
    });
  } catch (err) {
    thrown = err;
  }
  return { thrown, nextCalled };
}

/**
 * Runs the authenticate middleware and returns the thrown error or null.
 */
function runAuthenticate(authHeader) {
  const req = { headers: {} };
  if (authHeader !== undefined) {
    req.headers['authorization'] = authHeader;
  }
  let thrown = null;
  let nextCalled = false;
  try {
    authenticate(req, {}, () => {
      nextCalled = true;
    });
  } catch (err) {
    thrown = err;
  }
  return { thrown, nextCalled, req };
}

// ---------------------------------------------------------------------------
// Property 4: Invalid status values are always rejected
// ---------------------------------------------------------------------------

describe('Property 4: Invalid status values are always rejected', () => {
  // Feature: cloud-task-manager-api, Property 4: Invalid status values are always rejected

  test('valid status values pass validation', () => {
    for (const status of VALID_STATUSES) {
      const { thrown, nextCalled } = runValidate(taskUpdateSchema, { status });
      expect(thrown).toBeNull();
      expect(nextCalled).toBe(true);
    }
  });

  test('arbitrary strings not in valid set are rejected with ValidationError', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_STATUSES.includes(s) && s.length > 0),
        (invalidStatus) => {
          const { thrown } = runValidate(taskUpdateSchema, { status: invalidStatus });
          expect(thrown).toBeInstanceOf(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty string status is rejected', () => {
    const { thrown } = runValidate(taskUpdateSchema, { status: '' });
    expect(thrown).toBeInstanceOf(ValidationError);
  });

  test('numeric status is rejected', () => {
    const { thrown } = runValidate(taskUpdateSchema, { status: 1 });
    expect(thrown).toBeInstanceOf(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// Property 8: Input validation always runs before any DB operation
// ---------------------------------------------------------------------------

describe('Property 8: Input validation always runs before any DB operation', () => {
  // Feature: cloud-task-manager-api, Property 8: Input validation always runs before any DB operation

  const mockDal = { called: false };

  beforeEach(() => {
    mockDal.called = false;
  });

  test('invalid task create body throws ValidationError before next() is called', () => {
    // Simulate: if next() were called, the controller would call the DAL
    fc.assert(
      fc.property(
        fc.record({
          // title is required — omit it or use non-string
          description: fc.string(),
        }),
        (body) => {
          // body has no title → should fail
          const { thrown, nextCalled } = runValidate(taskCreateSchema, body);
          expect(thrown).toBeInstanceOf(ValidationError);
          expect(nextCalled).toBe(false);
          // DAL mock was never called because next() was never invoked
          expect(mockDal.called).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('invalid register body throws ValidationError before next() is called', () => {
    fc.assert(
      fc.property(
        // Generate bodies missing at least one required field
        fc.oneof(
          fc.record({ email: fc.emailAddress(), password: fc.string({ minLength: 1 }) }), // missing name
          fc.record({ name: fc.string({ minLength: 1 }), password: fc.string({ minLength: 1 }) }), // missing email
          fc.record({ name: fc.string({ minLength: 1 }), email: fc.string({ minLength: 1 }).filter(s => !s.includes('@')), password: fc.string({ minLength: 1 }) }) // invalid email
        ),
        (body) => {
          const { thrown, nextCalled } = runValidate(registerSchema, body);
          expect(thrown).toBeInstanceOf(ValidationError);
          expect(nextCalled).toBe(false);
          expect(mockDal.called).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('valid task create body calls next() (DAL would be reached)', () => {
    const { thrown, nextCalled } = runValidate(taskCreateSchema, { title: 'My task' });
    expect(thrown).toBeNull();
    expect(nextCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 11: Malformed request bodies are always rejected with 400
// ---------------------------------------------------------------------------

describe('Property 11: Malformed request bodies are always rejected with 400', () => {
  // Feature: cloud-task-manager-api, Property 11: Malformed request bodies are always rejected with 400

  test('register: missing name → ValidationError', () => {
    const { thrown } = runValidate(registerSchema, { email: 'a@b.com', password: 'secret' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
    expect(thrown.message).toBeTruthy();
  });

  test('register: missing email → ValidationError', () => {
    const { thrown } = runValidate(registerSchema, { name: 'Alice', password: 'secret' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
  });

  test('register: missing password → ValidationError', () => {
    const { thrown } = runValidate(registerSchema, { name: 'Alice', email: 'a@b.com' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
  });

  test('register: invalid email format → ValidationError with descriptive message', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@') && s.length > 0),
        (invalidEmail) => {
          const { thrown } = runValidate(registerSchema, {
            name: 'Alice',
            email: invalidEmail,
            password: 'secret',
          });
          expect(thrown).toBeInstanceOf(ValidationError);
          expect(thrown.statusCode).toBe(400);
          expect(typeof thrown.message).toBe('string');
          expect(thrown.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('login: missing email → ValidationError', () => {
    const { thrown } = runValidate(loginSchema, { password: 'secret' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
  });

  test('login: missing password → ValidationError', () => {
    const { thrown } = runValidate(loginSchema, { email: 'a@b.com' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
  });

  test('task create: missing title → ValidationError', () => {
    const { thrown } = runValidate(taskCreateSchema, { description: 'some desc' });
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(400);
  });

  test('empty body → ValidationError for required-field schemas', () => {
    for (const schema of [registerSchema, loginSchema, taskCreateSchema]) {
      const { thrown } = runValidate(schema, {});
      expect(thrown).toBeInstanceOf(ValidationError);
      expect(thrown.statusCode).toBe(400);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 9: Invalid or absent Auth_Token always produces 401
// ---------------------------------------------------------------------------

describe('Property 9: Invalid or absent Auth_Token always produces 401 on protected endpoints', () => {
  // Feature: cloud-task-manager-api, Property 9: Invalid or absent Auth_Token always produces 401 on protected endpoints

  test('arbitrary strings as Bearer tokens → UnauthorizedError', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (randomToken) => {
          // Skip tokens that happen to be valid JWTs signed with the test secret
          // (extremely unlikely with random strings, but guard anyway)
          try {
            const { verifyToken } = require('../../../src/utils/token');
            verifyToken(randomToken);
            // If it somehow verifies, skip this sample
            return;
          } catch (_) {
            // Expected — proceed with assertion
          }

          const { thrown } = runAuthenticate(`Bearer ${randomToken}`);
          expect(thrown).toBeInstanceOf(UnauthorizedError);
          expect(thrown.statusCode).toBe(401);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('absent Authorization header → UnauthorizedError', () => {
    const { thrown } = runAuthenticate(undefined);
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect(thrown.statusCode).toBe(401);
  });

  test('malformed header (no Bearer prefix) → UnauthorizedError', () => {
    const { thrown } = runAuthenticate('Token abc123');
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect(thrown.statusCode).toBe(401);
  });

  test('empty Authorization header → UnauthorizedError', () => {
    const { thrown } = runAuthenticate('');
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect(thrown.statusCode).toBe(401);
  });

  test('valid token → attaches req.user and calls next()', () => {
    const token = signToken({ userId: 'user-123', email: 'test@example.com' });
    const { thrown, nextCalled, req } = runAuthenticate(`Bearer ${token}`);
    expect(thrown).toBeNull();
    expect(nextCalled).toBe(true);
    expect(req.user).toEqual({ userId: 'user-123', email: 'test@example.com' });
  });
});
