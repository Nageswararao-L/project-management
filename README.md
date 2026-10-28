# ProjectPilot – Project Management

A project management app for project managers: plan projects with start/end dates,
break them into tasks, track status and progress, and see which projects are at risk.

**Stack:** React 19 · Ant Design v6 · NestJS 11 · TypeORM · SQL Server 2022 · Nx monorepo

## Features

- **Sign-in with two access levels**
  - **Manager** – sees and manages everything: all projects, all tasks, the team.
  - **User** – sees only the tasks assigned to them (and the projects those tasks
    belong to) and can update the status and progress of those tasks.

- **Dashboard** – project/task counts, overdue tasks, upcoming deadlines (next 14 days),
  projects needing attention and team workload.
- **Projects** – code, name, client, manager, start & end date, status and priority.
  Filter by status, priority, schedule health and manager; switch between a list and a
  portfolio **timeline (Gantt)** view.
- **Project page** – details, progress vs. time elapsed, and its tasks as a
  drag-and-drop **Kanban board**, a sortable list, or a timeline.
- **Tasks** – all tasks across projects with filters (project, assignee, status,
  priority, overdue only); change status inline or by dragging cards.
- **Team** – team members with open/overdue task counts and managed projects.
- Light and dark theme.

### Business rules

| Rule | Where |
| --- | --- |
| End/due date can't be before start date | API + forms |
| Task dates must lie within the project's schedule | API + date picker |
| A project's dates can't shrink past existing tasks | API |
| `Done` ⇒ progress 100% and `completedAt` set; reopening clears `completedAt` | API |
| Project progress = average of its tasks' progress | API |
| **Health**: `Closed` (completed/cancelled) · `Overdue` (end date passed) · `At risk` (on hold, has overdue tasks, or progress > 15 points behind time elapsed) · otherwise `On track` | `libs/shared` |
| Removing a team member unassigns their tasks/projects | API |
| Users only ever receive their own tasks; other tasks/projects return 404 | API |
| Only managers can create/edit/delete projects, tasks and team members | API + UI |
| A manager can't demote, deactivate or delete their own account | API + UI |

## Project structure

```
apps/
  api/            NestJS REST API (TypeORM + mssql)
    src/app/
      auth/       sign-in (JWT), global auth guard, @ManagerOnly()
      members/    team members
      projects/   projects + per-project task statistics
      tasks/      tasks
      dashboard/  aggregated summary
      database/   connection config, migrations, demo seed
  web/            React + Ant Design v6 (Vite)
    src/
      api/        axios client + TanStack Query hooks
      components/ forms, Kanban board, Gantt chart, tables, tags
      pages/      Dashboard, Projects, Project detail, Tasks, Team
libs/
  shared/         enums, API types and health calculation shared by api and web
```

## Getting started

Prerequisites: Node.js 20+ and a SQL Server 2022 instance.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start SQL Server** (skip if you already have one) – starts SQL Server 2022 in Docker:

   ```bash
   npm run db:up
   ```

3. **Configure the API** – copy the example env file and adjust the connection settings:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   | Variable | Default | Description |
   | --- | --- | --- |
   | `DB_HOST` / `DB_PORT` | `localhost` / `1433` | SQL Server address |
   | `DB_USER` / `DB_PASSWORD` | `sa` / – | SQL login |
   | `DB_NAME` | `ProjectManagement` | Database name |
   | `DB_ENCRYPT` / `DB_TRUST_SERVER_CERTIFICATE` | `false` / `true` | TLS options (Azure SQL: `true` / `false`) |
   | `DB_CREATE_DATABASE` | `true` | Create the database on startup if missing |
   | `DB_MIGRATIONS_RUN` | `true` | Apply pending migrations on startup |
   | `DB_SYNCHRONIZE` | `false` | Auto-sync schema from entities (dev only) |
   | `SEED_DEMO_DATA` | `true` in example | Insert sample projects, tasks and team into an empty database |
   | `JWT_SECRET` | dev secret | Secret used to sign sign-in tokens (**required in production**) |
   | `JWT_EXPIRES_IN` | `12h` | How long a sign-in lasts |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | – | Creates the first manager account on startup if no manager can sign in |
   | `PORT` | `3000` | API port |
   | `CORS_ORIGIN` | all | Comma-separated allowed origins |

4. **Run the API and the web app**

   ```bash
   npm run dev
   ```

   - Web app: http://localhost:4200 (proxies `/api` to the API)
   - API: http://localhost:3000/api
   - Swagger docs: http://localhost:3000/api/docs

### Signing in

With `SEED_DEMO_DATA=true` every demo account uses the password `Password@123`:

| Email | Access |
| --- | --- |
| `aarav.patel@example.com`, `anita.desai@example.com` | Manager |
| `priya.sharma@example.com`, `rahul.verma@example.com`, `sneha.reddy@example.com`, `kiran.rao@example.com` | User |

For a real database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start;
that manager then adds the team under **Team** and sets each person's password and access.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Serve API and web app together |
| `npm run dev:api` / `npm run dev:web` | Serve one app |
| `npm run build` | Production build of all projects (`apps/*/dist`) |
| `npm run typecheck` | Type-check all projects |
| `npm run db:up` / `npm run db:down` | Start/stop the SQL Server container |

## API overview

All endpoints except login and health need an `Authorization: Bearer <token>` header.
Endpoints marked *manager* return 403 for users; list endpoints return only the
user's own data.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in with email + password, returns a token |
| GET | `/api/auth/me` | The signed-in member |
| GET | `/api/dashboard` | Dashboard summary (users: their own tasks) |
| GET | `/api/projects?search=&status=&priority=&health=&managerId=` | Projects with progress & health |
| GET / POST / PATCH / DELETE | `/api/projects/:id` | Project CRUD (delete cascades to tasks); writes *manager* |
| GET | `/api/tasks?projectId=&assigneeId=&status=&priority=&search=&overdue=true&dueWithinDays=` | Tasks |
| POST / DELETE | `/api/tasks/:id` | Create / delete a task (*manager*) |
| PATCH | `/api/tasks/:id` | Update a task (users: only `status` and `progress` of their own tasks) |
| PATCH | `/api/tasks/:id/status` | Change only the status (Kanban) |
| GET / POST / PATCH / DELETE | `/api/members/:id` | Team members with workload, access and password (*manager*) |
| GET | `/api/health` | API + database health check |

Multi-value filters accept comma-separated values, e.g. `?status=IN_PROGRESS,ON_HOLD`.

## Database migrations

The schema is managed with TypeORM migrations in
`apps/api/src/app/database/migrations` and applied automatically on startup.
After changing an entity, add a new migration class there and register it in
`migrations/index.ts` (the API is bundled with webpack, so migrations are listed
explicitly rather than discovered by glob).
