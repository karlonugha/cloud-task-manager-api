'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { signToken } = require('../../src/utils/token');

// Mock both DALs so tests run without a real DB
jest.mock('../../src/dal/users.dal');
jest.mock('../../src/dal/tasks.dal');

const usersDal = require('../../src/dal/users.dal');
const tasksDal = require('../../src/dal/tasks.dal');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_A = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Alice',
  email: 'alice@example.com',
  created_at: new Date().toISOString(),
};

const USER_B = {
  id: 'bbbbbbbb-0000-0000-0000-000000000002',
  name: 'Bob',
  email: 'bob@example.com',
  created_at: new Date().toISOString(),
};

const TASK_A = {
  id: 'tttttttt-0000-0000-0000-000000000001',
  user_id: USER_A.id,
  title: 'Test task',
  description: null,
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Tokens
const tokenA = signToken({ userId: USER_A.id, email: USER_A.email });
const tokenB = signToken({ userId: USER_B.id, email: USER_B.email });

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------

describe('POST /api/tasks', () => {
  test('1. valid body and auth → 201 with task (status: pending)', async () => {
    tasksDal.createTask.mockResolvedValue(TASK_A);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Test task' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Test task', status: 'pending' });
  });

  test('2. no auth → 401', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    expect(res.status).toBe(401);
    expect(tasksDal.createTask).not.toHaveBeenCalled();
  });

  test('3. missing title → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
    expect(tasksDal.createTask).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------

describe('GET /api/tasks', () => {
  test('4. authenticated → 200 with array of tasks', async () => {
    tasksDal.getTasksByUserId.mockResolvedValue([TASK_A]);

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: TASK_A.id });
  });

  test('12. user has no tasks → 200 with []', async () => {
    tasksDal.getTasksByUserId.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:id
// ---------------------------------------------------------------------------

describe('GET /api/tasks/:id', () => {
  test('5. existing task owned by user → 200 with task', async () => {
    tasksDal.getTaskById.mockResolvedValue(TASK_A);

    const res = await request(app)
      .get(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: TASK_A.id, title: TASK_A.title });
  });

  test('6. non-existent task → 404', async () => {
    tasksDal.getTaskById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404 });
  });

  test("7. another user's task → 403", async () => {
    // TASK_A belongs to USER_A; request comes from USER_B
    tasksDal.getTaskById.mockResolvedValue(TASK_A);

    const res = await request(app)
      .get(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403 });
  });
});

// ---------------------------------------------------------------------------
// PUT /api/tasks/:id
// ---------------------------------------------------------------------------

describe('PUT /api/tasks/:id', () => {
  test('8. valid fields → 200 with updated task', async () => {
    const updated = { ...TASK_A, title: 'Updated title', status: 'in_progress' };
    tasksDal.getTaskById.mockResolvedValue(TASK_A);
    tasksDal.updateTask.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated title', status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Updated title', status: 'in_progress' });
  });

  test('9. invalid status → 400', async () => {
    const res = await request(app)
      .put(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
    expect(tasksDal.updateTask).not.toHaveBeenCalled();
  });

  test('10. empty body → 400', async () => {
    const res = await request(app)
      .put(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});

    expect(res.status).toBe(400);
    expect(tasksDal.updateTask).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/tasks/:id', () => {
  test('11. existing owned task → 200 with { message: "Task deleted" }', async () => {
    tasksDal.getTaskById.mockResolvedValue(TASK_A);
    tasksDal.deleteTask.mockResolvedValue(TASK_A);

    const res = await request(app)
      .delete(`/api/tasks/${TASK_A.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Task deleted' });
  });
});

// ---------------------------------------------------------------------------
// Unknown route
// ---------------------------------------------------------------------------

describe('Unknown route', () => {
  test('13. unknown route → 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, message: 'Route not found' });
  });
});
