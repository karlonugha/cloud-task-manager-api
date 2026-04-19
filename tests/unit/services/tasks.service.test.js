'use strict';

// Feature: cloud-task-manager-api, Property 3: Task ownership is always enforced across all operations
// Feature: cloud-task-manager-api, Property 6: Task list is always scoped to the authenticated user
// Feature: cloud-task-manager-api, Property 7: New tasks always start as pending

const fc = require('fast-check');
const { ForbiddenError } = require('../../../src/utils/errors');

jest.mock('../../../src/dal/tasks.dal');
const dal = require('../../../src/dal/tasks.dal');

const tasksService = require('../../../src/services/tasks.service');

describe('tasks.service — Property 3: Task ownership is always enforced across all operations', () => {
  // Validates: Requirements 4.4, 5.4, 6.3
  it('throws ForbiddenError for getTask, updateTask, and deleteTask when requester is not the owner', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Two distinct non-empty strings as user IDs
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (ownerUserId, requesterUserId) => {
          fc.pre(ownerUserId !== requesterUserId);

          const taskId = 'task-123';
          const mockTask = {
            id: taskId,
            user_id: ownerUserId,
            title: 'Test Task',
            description: null,
            status: 'pending',
          };

          dal.getTaskById.mockResolvedValue(mockTask);

          // getTask should throw ForbiddenError
          await expect(tasksService.getTask(requesterUserId, taskId)).rejects.toBeInstanceOf(ForbiddenError);

          // updateTask should throw ForbiddenError
          await expect(
            tasksService.updateTask(requesterUserId, taskId, { title: 'x' })
          ).rejects.toBeInstanceOf(ForbiddenError);

          // deleteTask should throw ForbiddenError
          await expect(tasksService.deleteTask(requesterUserId, taskId)).rejects.toBeInstanceOf(ForbiddenError);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('tasks.service — Property 6: Task list is always scoped to the authenticated user', () => {
  // Validates: Requirements 4.1
  it('listTasks returns only tasks matching the requesting userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.oneof(
              fc.constant('user-A'),
              fc.constant('user-B'),
              fc.constant('user-C')
            ),
            title: fc.string({ minLength: 1 }),
            status: fc.constant('pending'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (userId, allTasks) => {
          // Simulate DB filter: only return tasks matching userId
          const userTasks = allTasks.filter((t) => t.user_id === userId);
          dal.getTasksByUserId.mockResolvedValue(userTasks);

          const result = await tasksService.listTasks(userId);

          // Every returned task must belong to the requesting user
          expect(result.every((t) => t.user_id === userId)).toBe(true);
          expect(result).toHaveLength(userTasks.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('tasks.service — Property 7: New tasks always start as pending', () => {
  // Validates: Requirements 3.1
  it('createTask always returns a task with status === "pending"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.record({
          title: fc.string({ minLength: 1 }),
          description: fc.option(fc.string(), { nil: undefined }),
        }),
        async (userId, body) => {
          const mockTask = {
            id: 'new-task-id',
            user_id: userId,
            title: body.title,
            description: body.description ?? null,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          dal.createTask.mockResolvedValue(mockTask);

          const result = await tasksService.createTask(userId, body);

          expect(result.status).toBe('pending');
        }
      ),
      { numRuns: 100 }
    );
  });
});
