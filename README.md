# Cloud Task Manager API

A RESTful task management API built with Node.js and Express, deployed on AWS EC2 with a PostgreSQL database on RDS.

> **Live:** [http://3.249.216.92:3000](http://3.249.216.92:3000)

---

## Architecture

```
┌─────────────┐        HTTP         ┌──────────────────┐
│   Client     │ ──────────────────▶│    AWS EC2        │
│  (Postman /  │                    │  (Node.js API)    │
│   Frontend)  │                    └────────┬──────────┘
└─────────────┘                              │
                                             │  SSL connection
                                             ▼
                                      ┌─────────────┐
                                      │  Amazon RDS  │
                                      │ (PostgreSQL) │
                                      └─────────────┘
```

### Why Each AWS Service

| Service | Role | Why |
|---------|------|-----|
| **AWS EC2** | Hosts the Node.js/Express API server | Full control over the runtime environment — can SSH in, install dependencies, configure security groups, and manage the process directly. Good for learning core cloud infrastructure. |
| **Amazon RDS (PostgreSQL)** | Managed relational database for users and tasks | Tasks have structured fields (title, description, status) with foreign-key relationships to users. RDS handles automated backups, patching, and SSL connections. |
| **Security Groups** | Network-level access control | EC2 security group allows inbound on port 3000 only. RDS security group allows PostgreSQL connections only from the EC2 instance — no public database access. |

### How It Fits Together

1. Client sends HTTP requests to the EC2 public IP on port 3000
2. Express API authenticates via JWT, validates input with Joi, and routes to the appropriate handler
3. The service layer enforces business rules (task ownership, required fields)
4. The data access layer executes parameterized SQL queries against RDS over an SSL connection
5. Responses return as consistent JSON with proper HTTP status codes

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Runtime |
| Express 4 | HTTP framework |
| PostgreSQL 14+ (AWS RDS) | Relational database |
| JWT (jsonwebtoken) | Stateless authentication |
| bcrypt | Secure password hashing |
| Joi | Request validation |
| pg (node-postgres) | Database driver with SSL |
| Jest + Supertest | Unit and integration testing |

---

## Data Model

```
users
  └── tasks (user_id → users.id, ON DELETE CASCADE)
```

### Users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Required, unique |
| password_hash | TEXT | bcrypt hash |
| created_at | TIMESTAMPTZ | Auto-set |

### Tasks
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| user_id | UUID | Foreign key → users.id |
| title | VARCHAR(255) | Required |
| description | TEXT | Optional |
| status | ENUM | `pending`, `in_progress`, `completed` |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-set |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and receive a JWT |
| POST | `/api/tasks` | ✓ | Create a task |
| GET | `/api/tasks` | ✓ | List all tasks for the authenticated user |
| GET | `/api/tasks/:id` | ✓ | Get a single task by ID |
| PUT | `/api/tasks/:id` | ✓ | Update a task |
| DELETE | `/api/tasks/:id` | ✓ | Delete a task |

All authenticated endpoints require a `Bearer <token>` header. Tasks are scoped to the authenticated user — you can only access your own tasks.

---

## Project Structure

```
├── db/
│   ├── migrate.js              # Migration runner
│   └── migrations/
│       ├── 001_create_users.sql
│       └── 002_create_tasks.sql
│
├── src/
│   ├── app.js                  # Express app factory
│   ├── server.js               # Entry point (listens on PORT)
│   ├── config/
│   │   ├── db.js               # PostgreSQL pool with SSL
│   │   └── env.js              # Environment validation (fails fast)
│   ├── controllers/
│   │   ├── auth.controller.js  # Register + login handlers
│   │   └── tasks.controller.js # CRUD handlers
│   ├── dal/
│   │   ├── users.dal.js        # User SQL queries
│   │   └── tasks.dal.js        # Task SQL queries
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validate.js         # Joi schema validation
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── tasks.routes.js
│   ├── services/
│   │   ├── auth.service.js     # Registration + login logic
│   │   └── tasks.service.js    # Task CRUD with ownership checks
│   └── utils/
│       ├── errors.js           # Custom error classes
│       ├── password.js         # bcrypt hash + compare
│       └── token.js            # JWT sign + verify
│
└── tests/
    ├── setup.js                # Test environment config
    ├── integration/            # API-level tests (Supertest)
    └── unit/                   # Service, middleware, utility tests
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| EC2 over Elastic Beanstalk | Hands-on infrastructure experience — managing security groups, SSH access, and process management directly |
| Layered architecture (routes → controllers → services → DAL) | Separation of concerns; each layer is independently testable |
| Parameterized SQL queries | Prevents SQL injection — no string concatenation in queries |
| JWT-based stateless auth | No session storage needed; scales horizontally |
| Task ownership enforcement in service layer | Every task operation verifies `user_id` matches the authenticated user before proceeding |
| Fail-fast env validation | Server refuses to start if `DATABASE_URL` or `JWT_SECRET` are missing — no silent failures |
| SSL database connections | RDS connections encrypted in transit; `rejectUnauthorized: false` for Amazon-signed certificates |

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env          # Edit with your local DB credentials

# Run database migrations
psql $DATABASE_URL -f db/migrations/001_create_users.sql
psql $DATABASE_URL -f db/migrations/002_create_tasks.sql

# Start development server (with auto-reload)
npm run dev

# Or start production server
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | HTTP port (default: `3000`) |

### Running Tests

```bash
npm test                      # All tests
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests (requires PostgreSQL)
```

---

## Potential Improvements

1. **HTTPS + Domain** — Add a reverse proxy (Nginx) or an Application Load Balancer with an ACM certificate to serve over HTTPS instead of plain HTTP on port 3000.

2. **CI/CD Pipeline** — Add a GitHub Actions workflow to run tests on PR and auto-deploy to EC2 on merge (using SSH or AWS CodeDeploy).

3. **Process Manager** — Use PM2 or systemd to keep the Node.js process running, auto-restart on crash, and manage logs — instead of relying on a manual `node` process.

4. **Monitoring** — Add CloudWatch agent on EC2 for CPU/memory metrics and application-level logging. Set up alarms for high error rates.

5. **Rate Limiting** — Add express-rate-limit to protect auth endpoints from brute-force attacks.

6. **Pagination** — The `GET /api/tasks` endpoint returns all tasks at once. Add `limit`/`offset` query params for large task lists.

7. **Infrastructure as Code** — Define the EC2 instance, security groups, and RDS database in CloudFormation or Terraform for reproducible deployments.

---

## Interview-Ready Talking Points

**"Explain your architecture"**
> The API runs on an EC2 instance and connects to a PostgreSQL database on RDS over SSL. Security groups restrict access — only port 3000 is open on EC2, and the RDS instance only accepts connections from the EC2 security group. The app follows a layered architecture: routes define endpoints, controllers handle HTTP concerns, services enforce business logic like task ownership, and the DAL executes parameterized SQL queries.

**"Why EC2 instead of Elastic Beanstalk or Lambda?"**
> I chose EC2 for this project to get hands-on experience with core infrastructure — configuring security groups, managing SSH access, and running the process directly. For my food delivery app (KaliscoRush), I used Elastic Beanstalk because it needed auto-scaling and managed deployments. Choosing the right service for the context is the point.

**"How would you scale this?"**
> Short term: add an Application Load Balancer in front of multiple EC2 instances with auto-scaling based on CPU. Medium term: migrate to Elastic Beanstalk or ECS for managed scaling. Long term: since the API is stateless (JWT auth, no sessions), it could move to Lambda + API Gateway for pay-per-request pricing.

**"What would you improve?"**
> Three things: (1) Add HTTPS — right now it's plain HTTP which isn't production-ready. (2) Add a CI/CD pipeline with GitHub Actions so deployments are automated instead of manual SSH. (3) Add CloudWatch monitoring so I know when something breaks before users report it.

---

## Author

Karl Onugha — [GitHub](https://github.com/karlonugha) · [LinkedIn](https://linkedin.com/in/karl-onugha-28217b98)
