# ProjectPilot – Project Management

A project management app for project managers: plan projects with start/end dates,
break them into tasks, track status and progress, and see which projects are at risk.

**Stack:** React 19 · Ant Design v6 · NestJS 11 · TypeORM · SQL Server 2022 · Nx monorepo

## Features

- **Dashboard** – project/task counts, overdue tasks, upcoming deadlines (next 14 days),
  projects needing attention and team workload.
- **Projects** – code, name, client, manager, start & end date, status, priority, budget.
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

## Project structure

```
apps/
  api/            NestJS REST API (TypeORM + mssql)
    src/app/
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
   | `PORT` | `3000` | API port |
   | `CORS_ORIGIN` | all | Comma-separated allowed origins |

4. **Run the API and the web app**

   ```bash
   npm run dev
   ```

   - Web app: http://localhost:4200 (proxies `/api` to the API)
   - API: http://localhost:3000/api
   - Swagger docs: http://localhost:3000/api/docs

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Serve API and web app together |
| `npm run dev:api` / `npm run dev:web` | Serve one app |
| `npm run build` | Production build of all projects (`apps/*/dist`) |
| `npm run typecheck` | Type-check all projects |
| `npm run db:up` / `npm run db:down` | Start/stop the SQL Server container |

## API overview

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/projects?search=&status=&priority=&health=&managerId=` | Projects with progress & health |
| GET / POST / PATCH / DELETE | `/api/projects/:id` | Project CRUD (delete cascades to tasks) |
| GET | `/api/tasks?projectId=&assigneeId=&status=&priority=&search=&overdue=true&dueWithinDays=` | Tasks |
| POST / PATCH / DELETE | `/api/tasks/:id` | Task CRUD |
| PATCH | `/api/tasks/:id/status` | Change only the status (Kanban) |
| GET / POST / PATCH / DELETE | `/api/members/:id` | Team members with workload |
| GET | `/api/health` | API + database health check |

Multi-value filters accept comma-separated values, e.g. `?status=IN_PROGRESS,ON_HOLD`.

## Database migrations

The schema is managed with TypeORM migrations in
`apps/api/src/app/database/migrations` and applied automatically on startup.
After changing an entity, add a new migration class there and register it in
`migrations/index.ts` (the API is bundled with webpack, so migrations are listed
explicitly rather than discovered by glob).
