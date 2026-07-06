# Test / Demo Accounts

These accounts are seeded automatically on backend startup when `ENVIRONMENT`
is anything other than `production` (see `backend/main.py:init_db`). They all
belong to the same demo workspace, "Tony Properties Ltd", so you can log in
as any of them to see the same data from a different permission level.

| Role            | Email                  | Password      | Can do |
|-----------------|------------------------|---------------|--------|
| Platform Admin  | admin@pango.co.tz      | Password123!  | Everything: manage properties, units, tenants, payments, reports, and workspace users |
| Owner           | owner@pango.co.tz      | Password123!  | Same as Admin within their workspace: full property/tenant/payment management and user management |
| Manager         | manager@pango.co.tz    | Password123!  | Day-to-day operations (units, tenants, payments, reports) but cannot create properties or manage users |

In production (`ENVIRONMENT=production`), no demo accounts are created —
create real users via the `/users` endpoint (Admin/Owner only) or directly in
the database.
