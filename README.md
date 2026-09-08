# Multi-Tenant Dealership Inventory

## Structure
- `database/schema.sql` — Postgres DDL (tenants, admin_users, vehicles, vehicle_images), multi-tenant indexes.
- `backend/` — Express API (auth, VIN decode via NHTSA, vehicle CRUD, image upload via Supabase Storage). All tenant-scoped routes require a JWT and filter every query by the authenticated user's `tenant_id`.
- `frontend/` — React (Vite) app with an admin portal (`/admin/login`, `/admin/dashboard`) and public showroom (`/dealer/:tenantSlug`).

## Setup
1. Create a Supabase project. Run `database/schema.sql` in the SQL editor.
2. Create a public Storage bucket named `vehicle-images`.
3. Manually insert a tenant row and an admin_users row (bcrypt-hash the password) to create your first login.
4. `backend/.env` — copy `.env.example`, fill in `DATABASE_URL` (Supabase connection string), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a `JWT_SECRET`.
5. `frontend/.env` — copy `.env.example`, set `VITE_API_URL` to your backend URL.
6. `cd backend && npm install && npm run dev`
7. `cd frontend && npm install && npm run dev`

## Notes
- Public showroom URL: `/dealer/<tenant-slug>` — matches `tenants.slug`.
- Vehicles require 1–2 images before they can be saved (enforced client-side and by a DB trigger).
