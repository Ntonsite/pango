# Demo / Test Accounts

These accounts are seeded automatically on backend startup when `ENVIRONMENT`
is anything other than `production` (see `backend/main.py:init_db`). The
Platform Admin belongs to no workspace; the Owner and Manager both belong to
the same demo workspace, **Tony Properties Ltd**.

| Role            | Email                        | Password      | Scope |
|------------------|------------------------------|---------------|-------|
| Platform Admin   | admin@platform.com           | Password123!  | Manages the whole SaaS platform: create/suspend/delete workspaces, view all users, reset passwords, analytics, feature flags, announcements, system logs. Not a member of any workspace. |
| Workspace Owner  | owner@tonyproperties.com     | Password123!  | Full control of **Tony Properties Ltd**: properties, units, tenants, payments, reports, and inviting/managing its Managers. |
| Workspace Manager| manager@tonyproperties.com   | Password123!  | Day-to-day operations in **Tony Properties Ltd**: units, tenants, payments, reports. Read-only on properties; no access to user management or workspace settings. |

The login page also has a **"Try a demo account"** picker that fills these in
for you.

## Onboarding new accounts (no email provider configured)

This environment has no SMTP provider wired up, so instead of emailing links,
the app shows them once in the UI for you to copy and share manually:

- **Platform Admin creates a workspace** → shown a one-time invite link for
  the new Owner to set their own password.
- **Owner invites a Manager** → shown a one-time invite link the same way.
- **Forgot password** → the reset link is logged server-side
  (`docker logs pango-api`) rather than emailed.

Wire a real email provider (e.g. via the `emails` dependency already in
`backend/requirements.txt`) before using this in production.

## In production

With `ENVIRONMENT=production`, no demo accounts are seeded — create the first
Platform Admin directly in the database, then have them onboard workspaces
through the admin console.
