// Feature: cloud-task-manager-api, Property 1: Password hash/compare round-trip
'use strict';

const fc = require('fast-check');
const { hashPassword, comparePassword } = require('../../../src/utils/password');

// Validates: Requirements 1.5

describe('password utils — property-based tests', () => {
  // bcrypt is slow; keep iterations low but meaningful
  const NUM_RUNS = 10;

  test('Property 1: comparePassword(s, hashPassword(s)) is always true', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), async (s) => {
        const hash = await hashPassword(s);
        const result = await comparePassword(s, hash);
        return result === true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  test('Property 1b: comparePassword(other, hashPassword(s)) is always false when other !== s', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        fc.string({ minLength: 1, maxLength: 72 }),
        async (s, other) => {
          fc.pre(s !== other);
          const hash = await hashPassword(s);
          const result = await comparePassword(other, hash);
          return result === false;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
