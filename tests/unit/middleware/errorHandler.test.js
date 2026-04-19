'use strict';

// Feature: cloud-task-manager-api, Property 5: Error responses always conform to the error contract and never expose internals

const fc = require('fast-check');
const errorHandler = require('../../../src/middleware/errorHandler');
const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../../src/utils/errors');

/**
 * Creates a minimal mock Express response object that captures the JSON body.
 */
function makeMockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

const APP_ERROR_CONSTRUCTORS = [
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
];

describe('errorHandler middleware', () => {
  // Suppress console.error noise during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Property 5: Error responses always conform to the error contract and
  // never expose internals
  // -------------------------------------------------------------------------
  test(
    'Property 5: AppError subclasses always produce { status: number, message: string } with no stack or file paths',
    () => {
      // Feature: cloud-task-manager-api, Property 5: Error responses always conform to the error contract and never expose internals
      fc.assert(
        fc.property(
          fc.constantFrom(...APP_ERROR_CONSTRUCTORS),
          fc.string({ minLength: 1 }),
          (ErrorClass, message) => {
            const err = new ErrorClass(message);
            const res = makeMockRes();
            const req = {};
            const next = () => {};

            errorHandler(err, req, res, next);

            const body = res._body;

            // status must be a number
            expect(typeof body.status).toBe('number');

            // message must be a non-empty string
            expect(typeof body.message).toBe('string');
            expect(body.message.length).toBeGreaterThan(0);

            // must NOT contain stack
            const bodyStr = JSON.stringify(body);
            expect(bodyStr).not.toContain('stack');

            // must NOT contain file path separators that would expose internals
            expect(bodyStr).not.toMatch(/[/\\].*\.(js|ts)/);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test('Property 5: status code in response matches AppError statusCode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...APP_ERROR_CONSTRUCTORS),
        fc.string({ minLength: 1 }),
        (ErrorClass, message) => {
          const err = new ErrorClass(message);
          const res = makeMockRes();
          errorHandler(err, {}, res, () => {});

          expect(res._status).toBe(err.statusCode);
          expect(res._body.status).toBe(err.statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unknown errors produce status 500 with generic message and no internals', () => {
    const err = new Error('something exploded at /home/user/app/src/server.js:42');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});

    expect(res._status).toBe(500);
    expect(res._body.status).toBe(500);
    expect(res._body.message).toBe('Internal server error');

    const bodyStr = JSON.stringify(res._body);
    expect(bodyStr).not.toContain('stack');
    expect(bodyStr).not.toContain('server.js');
  });

  test('ValidationError (400) response shape', () => {
    const err = new ValidationError('title is required');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ status: 400, message: 'title is required' });
  });

  test('UnauthorizedError (401) response shape', () => {
    const err = new UnauthorizedError('Invalid or expired token');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ status: 401, message: 'Invalid or expired token' });
  });

  test('ForbiddenError (403) response shape', () => {
    const err = new ForbiddenError('Access denied');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(403);
    expect(res._body).toEqual({ status: 403, message: 'Access denied' });
  });

  test('NotFoundError (404) response shape', () => {
    const err = new NotFoundError('Task not found');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(404);
    expect(res._body).toEqual({ status: 404, message: 'Task not found' });
  });

  test('ConflictError (409) response shape', () => {
    const err = new ConflictError('Email already registered');
    const res = makeMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res._status).toBe(409);
    expect(res._body).toEqual({ status: 409, message: 'Email already registered' });
  });
});
