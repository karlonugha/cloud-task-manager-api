// Feature: cloud-task-manager-api, Property 2: JWT sign/verify round-trip preserves payload and expiry
'use strict';

const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../../../src/utils/token');
const { UnauthorizedError } = require('../../../src/utils/errors');

// Validates: Requirements 2.1, 2.4

describe('token utils — property-based tests', () => {
  const NUM_RUNS = 100;

  test('Property 2: verifyToken(signToken(payload)) returns matching userId and email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (payload) => {
          const token = signToken(payload);
          const decoded = verifyToken(token);
          return decoded.userId === payload.userId && decoded.email === payload.email;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  test('Property 2b: exp claim equals iat + 86400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async (payload) => {
          const token = signToken(payload);
          // Use jwt.decode to inspect all claims including iat/exp
          const raw = jwt.decode(token);
          return raw.exp === raw.iat + 86400;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  test('verifyToken throws UnauthorizedError for arbitrary non-JWT strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate strings that are clearly not valid JWTs
        fc.string({ minLength: 1, maxLength: 200 }).filter(
          (s) => !s.match(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
        ),
        async (badToken) => {
          try {
            verifyToken(badToken);
            return false; // should have thrown
          } catch (err) {
            return err instanceof UnauthorizedError;
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
