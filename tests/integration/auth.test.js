'use strict';

const request = require('supertest');
const app = require('../../src/app');

// Mock the users DAL so tests run without a real DB
jest.mock('../../src/dal/users.dal');
const usersDal = require('../../src/dal/users.dal');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_USER = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: new Date().toISOString(),
};

// A pre-hashed version of "password123" (bcrypt, cost 10)
// We generate this once at module load so tests are deterministic.
let PASSWORD_HASH;

beforeAll(async () => {
  const { hashPassword } = require('../../src/utils/password');
  PASSWORD_HASH = await hashPassword('password123');
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  test('1. valid body → 201 with user object (no password_hash)', async () => {
    usersDal.findUserByEmail.mockResolvedValue(null);
    usersDal.createUser.mockResolvedValue(VALID_USER);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: VALID_USER.id,
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('2. duplicate email → 409', async () => {
    usersDal.findUserByEmail.mockResolvedValue({ ...VALID_USER, password_hash: PASSWORD_HASH });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ status: 409 });
    expect(typeof res.body.message).toBe('string');
  });

  test('3. missing name → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400 });
    expect(typeof res.body.message).toBe('string');
    // DAL should never be called
    expect(usersDal.findUserByEmail).not.toHaveBeenCalled();
  });

  test('4. invalid email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400 });
    expect(usersDal.findUserByEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  test('5. valid credentials → 200 with { token, user }', async () => {
    usersDal.findUserByEmail.mockResolvedValue({ ...VALID_USER, password_hash: PASSWORD_HASH });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      id: VALID_USER.id,
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('6. wrong password → 401', async () => {
    usersDal.findUserByEmail.mockResolvedValue({ ...VALID_USER, password_hash: PASSWORD_HASH });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401 });
  });

  test('7. unknown email → 401', async () => {
    usersDal.findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401 });
  });
});
