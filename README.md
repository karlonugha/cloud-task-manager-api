# Cloud Task Manager API

A RESTful backend service built with **Node.js (Express)** and **PostgreSQL**, designed for deployment on AWS EC2 with a database hosted on AWS RDS.

## Features

- User registration and authentication (JWT-based)
- Full CRUD operations on tasks scoped to the authenticated user
- Secure password hashing with bcrypt
- Parameterized SQL queries to prevent SQL injection
- Consistent JSON error responses

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

3. Run database migrations against your PostgreSQL instance:

```bash
psql $DATABASE_URL -f db/migrations/001_create_users.sql
psql $DATABASE_URL -f db/migrations/002_create_tasks.sql
```

4. Start the server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | HTTP port (default: `3000`) |

The server will **refuse to start** if `DATABASE_URL` or `JWT_SECRET` are not set, printing a clear error listing the missing variables. Use `.env.example` as a template.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive a JWT |
| POST | `/api/tasks` | Yes | Create a task |
| GET | `/api/tasks` | Yes | List all tasks for the authenticated user |
| GET | `/api/tasks/:id` | Yes | Get a single task by ID |
| PUT | `/api/tasks/:id` | Yes | Update a task |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

Integration tests require a running PostgreSQL instance. Set `DATABASE_URL` to a dedicated test database before running them.
