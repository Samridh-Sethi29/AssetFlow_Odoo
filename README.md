# AssetFlow — Full-Stack Asset Management System

A MERN-stack ERP for tracking organizational assets: registration, allocation,
resource booking, maintenance, audits, and reporting.

## Stack
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth
- **Frontend:** React 19, Vite, Tailwind CSS v4, PrimeReact, Chart.js

## What changed in this pass
- Filled in the previously-empty **User, Vendor, Dashboard, Audit, and Activity**
  controllers/routes (the backend was ~50% stubbed out) — the REST API is now
  complete for every module described in the schema.
- Added an **activity logging service**, wired into login, asset creation, and
  allocation/return, so the Notifications and Dashboard activity feeds are real.
- Fixed a CSS bug where PrimeReact buttons had a black background with no
  explicit text color, making the label invisible (`.p-button` in `index.css`).
- Added CORS origin allow-listing, a 5MB JSON body limit, and a 404 handler
  to `app.js`.
- Built a full frontend **API layer** (`src/api/`) and **AuthContext**, and
  rewired every page (Login, Dashboard, Organization, Assets, Allocation,
  Resource Booking, Maintenance, Audit, Reports, Notifications) from static
  mock data to live backend calls, including create/update dialogs.
- Added `backend/.env` with randomly generated secrets (dev-only — replace
  before deploying) and a `backend/scripts/seed.js` to create an initial
  Admin user.

## Getting started

### 1. Backend
```bash
cd backend
npm install
# .env is already populated with a random JWT secret. Update MONGODB_URI
# to point at your MongoDB instance (Atlas or local).
npm run seed   # creates additive demo data and an Admin login: admin@assetflow.com / Admin@12345
npm run dev    # http://localhost:5001
```

### 2. Frontend
```bash
cd frontend
npm install
# .env already points VITE_API_URL at http://localhost:5001/api
npm run dev    # http://localhost:5173
```

Sign in with the seeded admin account, or use "Create account" to register
a new Employee.

## Production notes (still TODO before a real launch)
- Regenerate `JWT_SECRET` and set a real `MONGODB_URI` — never commit `.env`.
- Put the API behind HTTPS and set `CLIENT_URL` to your real frontend origin.
- Add rate limiting (e.g. `express-rate-limit`) to `/api/auth/login`.
- Add server-side pagination to list endpoints once data volume grows.
- Asset images (JPEG, PNG, WebP) and documents (PDF, DOC, DOCX) can be
  uploaded with multipart asset create/update requests. Files are stored under
  `backend/uploads`; use object storage such as S3 before deploying at scale.
- Consider refresh tokens; the current JWT is a single 7-day access token.
