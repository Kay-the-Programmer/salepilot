# SalePilot POS & Inventory — Quick Pilot Deployment Guide

This guide shows the fastest way to get both the backend (API) and the frontend (Vite React app) running for a pilot, locally and in the cloud.

If you follow the "Quick Local Pilot" you can be running in under 10 minutes.

---

## What’s in this repo
- Frontend (Vite + React) — root folder
  - Dev: `npm run dev` (Vite on port 5173 by default)
  - Build: `npm run build` → static files in `dist/`
- Backend (Node + Express + PostgreSQL) — `backend/`
  - Dev: `npm run dev` (ts-node-dev)
  - Build: `npm run build` then `npm start` (from `dist/`)
  - Auto-migrations: `backend/src/init_db.ts` runs automatically on boot to create/alter required tables
- Database: PostgreSQL (one env var: `DATABASE_URL`)

Key URLs/endpoints:
- Backend health: `GET /api/health` (responds with `{ status: 'OK' }`)
- Uploads (images/files): served from `GET /uploads/...`

Frontend API base URL is controlled at build/runtime via `VITE_API_URL` (defaults to `http://localhost:5000/api` if not provided).

---

## Quick Local Pilot (fastest)

Prereqs:
- Node.js LTS (v18+ recommended)
- PostgreSQL connection (Docker or a managed/free instance like Railway/Neon/Supabase)

1) Create a PostgreSQL database
- Option A – Docker (local):
  - `docker run --name salepilot-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=salepilot -p 5432:5432 -d postgres:16`
  - Your `DATABASE_URL`: `postgres://postgres:postgres@localhost:5432/salepilot`
- Option B – Managed (Railway/Neon/Supabase):
  - Create a Postgres database and copy the connection string (use SSL if required by the provider).

2) Start the backend
- From project root:
  - `cd backend`
  - Create `backend/.env`:
    - DATABASE_URL=postgres://USER:PASS@HOST:5432/DBNAME
    - PORT=5000
    - JWT_SECRET=any-long-random-string
    - GEMINI_API_KEY=optional-if-using-AI-features
  - Install and run:
    - `npm ci` (or `npm install`)
    - Dev (auto-reload): `npm run dev`
    - Or production build: `npm run build` then `npm start`
- On first boot, the backend will run minimal idempotent migrations (init_db.ts) to create/adjust tables.
- Verify: open http://localhost:5000/api/health → should return OK.

3) Start the frontend
- From project root:
  - Create `.env.local` (root):
    - VITE_API_URL=http://localhost:5000/api
  - Install and run:
    - `npm ci` (or `npm install`)
    - Dev: `npm run dev` (shows local URL like http://localhost:5173)
    - Production preview (after build): `npm run build` then `npm run preview`

You should now be able to log in and use the app. The frontend will call the backend at `VITE_API_URL`.

---

## Quick Cloud Pilot (zero DevOps)

Below are copy-paste steps for popular hosts. Pick one Backend option and one Frontend option.

### Backend — Render (step-by-step, backend first)

This section walks you through deploying ONLY the backend API to Render. You can hook up the frontend later by pointing VITE_API_URL to your Render URL.

Prerequisites:
- A GitHub repo with this code pushed
- A Render account (free tier works)

Step 1 — Create the Web Service
- In the Render dashboard → New → Web Service
- Connect your GitHub and select this repository
- Name: salepilot-backend (or any name)
- Root Directory: backend
- Runtime: Node 18+ (default is fine)
- Build Command: npm ci && npm run build
- Start Command: npm start
- Auto Deploy: Yes (recommended)
- Click Create Web Service (this will fail if DATABASE_URL isn’t set yet; we’ll add it next)

Step 2 — Provision PostgreSQL on Render
- In another tab of Render: New → PostgreSQL → Create Database
- After creation, open the DB and copy the Internal Connection String (recommended on Render). It typically looks like:
  postgres://USER:PASSWORD@HOST:PORT/DBNAME
  - Some providers require SSL. If yours does, you can add ?sslmode=require to the end, e.g., postgres://.../DBNAME?sslmode=require

Step 3 — Configure environment variables on the Web Service
- Open your Web Service → Settings → Environment → Add Environment Variable:
  - DATABASE_URL = <paste your Postgres connection string>
  - JWT_SECRET = a-long-random-string
  - GEMINI_API_KEY = <optional, only if using AI features>
  - Note: Render injects PORT automatically; the app uses process.env.PORT so no need to set it manually.
- Save Changes

Step 4 — Redeploy
- Go to the Web Service → Deploys → Trigger Deploy (or allow auto-deploy on push)
- Watch Logs → you should see:
  - Compiling TypeScript during build
  - On start: "Server is running" and database initialization logs from src/init_db.ts

Step 5 — Verify the API is live
- The service URL will look like: https://<your-service-name>.onrender.com
- Open the health check in your browser:
  https://<your-service-name>.onrender.com/api/health
  You should see: { "status": "OK", "timestamp": "..." }
- Or test with curl:
  curl -s https://<your-service-name>.onrender.com/api/health

Step 6 — Notes and operational tips
- CORS: The backend currently allows all origins (origin: '*'). Fine for pilots; you can lock it down later in backend/src/index.ts.
- Uploads: Files under /uploads are served by the server but Render’s disk is ephemeral. For production, use S3 or similar. For pilots, this is usually acceptable.
- Cold starts: Free tier may sleep; the first request after inactivity can take a few seconds.

Troubleshooting (Render)
- Build fails (tsc not found): It’s a devDependency and will install during npm ci. Ensure Build Command is exactly: npm ci && npm run build
- Port errors: Don’t hardcode PORT. The app already reads process.env.PORT so it will bind to Render’s provided port.
- DB auth/connection errors: Verify DATABASE_URL. If your DB requires SSL, add ?sslmode=require to the URL. Some providers also need ssl=true; consult your DB provider docs.
- Init DB errors: The initializer is idempotent and runs inside a transaction. Check logs for the first failing statement to identify a mismatch.
- 404/500 on health: Confirm that the service deployed successfully and that your route is /api/health.

Next: connect the frontend
- When you deploy the frontend (e.g., Vercel), set VITE_API_URL to:
  https://<your-service-name>.onrender.com/api
- Locally, to test against Render backend, create .env.local at the project root with:
  VITE_API_URL=https://<your-service-name>.onrender.com/api

### Backend — Railway (very quick)
1) Create a new Railway project → Provision a PostgreSQL plugin.
2) Add a new “Service” from GitHub pointing to this repo.
   - Service root directory: `backend`
   - Build: `npm ci && npm run build`
   - Start: `npm start`
3) Add environment variables:
   - DATABASE_URL (Railway provides a Postgres URL)
   - JWT_SECRET
   - GEMINI_API_KEY (optional)
4) Deploy and test `GET /api/health`.

### Frontend — Vercel (recommended for Vite)
This repo includes a `vercel.json`, so Vercel will auto-detect the static build and SPA rewrites.
1) Create a new Vercel project from this repo.
   - Root Directory: project root
   - Framework Preset: Vite (or Auto-detected)
   - Build Command: `npm ci && npm run build`
   - Output Directory: `dist`
2) Set Environment Variable in Vercel Project Settings (Production and Preview):
   - VITE_API_URL=https://<your-backend-domain>/api
3) Deploy. Open the Vercel URL and log in.

### Frontend — Netlify
1) New Site from Git → choose this repo.
   - Base directory: root
   - Build command: `npm run build`
   - Publish directory: `dist`
2) Add environment variables:
   - VITE_API_URL=https://<your-backend-domain>/api
3) Deploy and test.

### Frontend — Render (Static Site)
1) Render Dashboard → New → Static Site
   - Connect GitHub and select this repo.
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
2) Environment Variables (on the Static Site):
   - VITE_API_URL=https://<your-backend-domain>/api
3) Optional: SPA fallback rule in Render → Your Static Site → Redirects/Rewrites
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
   This ensures client-side routing works on refresh and deep links.
4) Deploy. Open the URL and log in.

Tip: You can also inject API URL at runtime without rebuild by adding a tag to index.html:

  <meta name="app:apiUrl" content="https://<your-backend-domain>/api">

The app will prefer this over VITE_API_URL if present.

---

## Environment variables reference

Backend (`backend/.env`):
- DATABASE_URL=postgres://USER:PASS@HOST:5432/DBNAME
- PORT=5000 (locally; cloud platforms often inject PORT)
- JWT_SECRET=your-secret
- SUPERADMIN_EMAIL=superadmin@sale-pilot.com (override in production)
- SUPERADMIN_PASSWORD=your-secure-password (override in production)
- GEMINI_API_KEY=optional for AI features

Frontend (root `.env.local` or platform env):
- VITE_API_URL=http://localhost:5000/api (or your live backend `/api` URL)

---

## Database and migrations
- The backend runs an idempotent initializer on boot (`src/init_db.ts`) that ensures required tables/columns exist.
- No manual migration step is required for pilots.

If you need seed data:
- There is a `backend/src/seed.ts` script (where present) with npm script `npm run db:seed` that uses your current `DATABASE_URL`.

---

## Security and production notes
- CORS currently allows all origins for speed. In `backend/src/index.ts` you can restrict `origin` to your frontend URL later.
- For production, use persistent object storage for uploads and set your `uploads` path to cloud storage or proxy it via the backend.
- Always use long random `JWT_SECRET` and a managed Postgres with SSL enabled.

---

## Superadmin (System-wide Administration)

The system includes a built-in Superadmin role with a dedicated interface and API endpoints.

What you get:
- A seeded Superadmin account on first backend boot.
- Superadmin-only API endpoints under `/api/superadmin` (e.g., manage all stores system-wide).
- A Superadmin UI page in the frontend for store oversight and subscription/status management.

Default credentials (for pilots/dev):
- Email: `superadmin@sale-pilot.com`
- Password: `password`

These can and should be overridden in production using environment variables on the backend:
- SUPERADMIN_EMAIL
- SUPERADMIN_PASSWORD

Behavior:
- On backend start, `backend/src/init_db.ts` ensures the users table supports role = `superadmin` and seeds a superadmin user if none exists for `SUPERADMIN_EMAIL` (default above).
- The frontend automatically routes a logged-in superadmin to the Superadmin page and shows a "Superadmin" item in the sidebar.

How to access:
1) Start backend and frontend as described above.
2) Log in using the superadmin credentials.
3) You will land on the Superadmin dashboard (or select it from the sidebar) to manage stores (activate/deactivate, set subscription status, etc.).

API:
- GET `/api/superadmin/stores` — list all stores (protected: superadmin only)
- PATCH `/api/superadmin/stores/:id` — update store status/subscription (protected: superadmin only)

Note: Superadmin users are not restricted by a store context and can access all tenants.

---

## Troubleshooting
- Backend boots but DB errors: verify `DATABASE_URL`, check that the DB is reachable and allows your IP (managed services may require IP allowlists).
- 404s from frontend API calls: ensure `VITE_API_URL` points to `<backend>/api` exactly, no trailing slashes.
- CORS errors in browser console: for a pilot, backend is already `origin: '*'`. If you customized it, add your frontend origin (e.g., `https://your-frontend.vercel.app`).
- Images not showing: ensure the image URLs are built with the helper that maps to `/uploads` and that the backend is reachable publicly.

---

## Local all-in-one with Docker (optional snippet)
If you prefer Docker locally and already have an image registry, here’s a quick outline (not required for pilot):
- Build backend: `cd backend && npm ci && npm run build`
- Run Postgres as shown above
- Use a simple Node container to run `node dist/index.js` with `DATABASE_URL` env.
- Build frontend: root `npm ci && npm run build` and serve `dist/` with any static host (e.g., `npx serve dist`).

---

## Multi-tenant Model & Store Registration

### Multi-tenant Performance Enhancements
- Composite indexes added for common tenant-scoped filters to speed up queries significantly on large datasets:
  - sales(store_id, "timestamp")
  - products(store_id, status)
  - customers(store_id, created_at)
  - payments(store_id, date)
  - sale_items(store_id, sale_id)
  - purchase_orders(store_id, created_at)
  - stock_takes(store_id, status)
  - stock_take_items(store_id, stock_take_id)
  - Plus related child tables for PO receptions/items
- Optimized reporting queries to avoid broad subqueries and leverage these indexes.
- Added a small in-memory cache for auth user lookups (configurable TTL) to reduce per-request database hits.

Environment variable:
- AUTH_USER_CACHE_TTL_MS: default 60000 (60s). Set to 0 to disable caching if needed.

SalePilot now supports multi-tenancy with per-store data isolation.

How it works:
- Each user may have a current_store_id (automatically set when they register a store).
- Requests from authenticated users include a tenant context derived from their current store.
- All reads/writes for core entities are scoped to the tenant’s store_id.

Key endpoints:
- POST /api/auth/register
  - Registers a user account. Default role: "staff". Returns JWT.
- POST /api/auth/login
  - Logs in and returns JWT along with `currentStoreId` (if set).
- POST /api/stores/register (auth required)
  - Creates a new store owned by the current user.
  - Grants the user admin role and sets their current_store_id to the new store.
  - Response contains the created store object.

Tenant-aware controllers (initial set):
- Products: all CRUD is filtered by store_id and writes include store_id.
- Categories: all CRUD is filtered by store_id and writes include store_id.
- Customers: all CRUD is filtered by store_id and writes include store_id.
- Suppliers: all CRUD is filtered by store_id and writes include store_id.

Using the flow (example):
1) Register a user — POST /api/auth/register with `{ name, email, password }`.
2) Login — POST /api/auth/login → copy `token` from response.
3) Register your store — POST /api/stores/register with header `Authorization: Bearer <token>` and body `{ "name": "My Store" }`.
   - You’ll be promoted to admin and your currentStoreId is set.
4) Perform tenant-scoped operations (e.g., products, categories, customers, suppliers); requests will be automatically scoped to your store.

Notes:
- If a request lacks store context, tenant-aware endpoints will return `400 Store context required`.
- Never pass a store_id from the client; the server derives it from the authenticated user.

Security:
- The backend enforces store_id checks in SELECT/UPDATE/DELETE and includes store_id on INSERT, preventing cross-tenant access.
