# Pango

A multi-tenant SaaS platform for apartment rental management in Tanzania —
properties, units, tenants, rent payments, and reporting, with a Platform
Admin console for onboarding and managing customer workspaces.

## Stack

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL, JWT auth
- **Frontend**: React 19 + Vite, plain CSS (no UI kit/Tailwind)
- **Infra**: Docker Compose (Postgres, Redis, backend, frontend, HAProxy)

## Roles & tenancy

| Role | Scope |
|---|---|
| **Platform Admin** | Outside every workspace. Onboards/suspends/deletes workspaces, views all users, resets passwords, manages feature flags, announcements, and the audit log. |
| **Workspace Owner** | Full control of their own workspace: properties, units, tenants, payments, reports, and inviting/managing Managers. Exactly one per workspace. |
| **Workspace Manager** | Day-to-day operations within a workspace: units, tenants, payments, reports. Read-only on properties; no access to user management or workspace settings. |

Every Property, Unit, Tenant, Payment, and User belongs to exactly one
Workspace, and Owners/Managers can only ever see their own workspace's data.

## Getting started

```bash
./start.sh   # build + up -d + tail logs, all in one
# or step by step:
./build.sh   # docker compose build
./run.sh     # docker compose up -d
```

The app is served on **port 80** (via HAProxy, which fronts both the
frontend and the `/api/*` backend routes) — e.g. `http://localhost` locally,
or `http://your-server-ip` in production. HAProxy's stats page is on
**8404**. Set `CORS_ORIGINS` (see `backend/.env.example`) to your real
origin(s) before deploying anywhere other than localhost.

New users are created via invite link (Owner invites a Manager, Platform
Admin onboards a workspace Owner) rather than a shared password — see
[TEST_USERS.md](TEST_USERS.md) for seeded demo accounts and how that flow
works without a configured email provider.

## Configuration

Copy `backend/.env.example` to `.env` (or set the equivalent environment
variables in `docker-compose.yml`) before deploying anywhere real:

- `ENVIRONMENT=production` disables demo-account seeding and requires a
  non-default `SECRET_KEY`.
- `CORS_ORIGINS` must list your real frontend origin(s).
- Wire a real SMTP/email provider before relying on invite or
  password-reset links in production — this environment logs them
  server-side (`docker logs pango-api`) instead of emailing them.

## Project structure

```
backend/    FastAPI app (main.py, admin.py router, models/schemas/deps/auth)
frontend/   React app (src/pages, src/pages/admin, src/components, src/context)
haproxy/    Reverse proxy config fronting frontend + backend
```
