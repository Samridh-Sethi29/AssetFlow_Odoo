<div align="center">

<!-- Animated capsule banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2E3192,100:1BFFFF&height=220&section=header&text=AssetFlow&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Full-Stack%20Organizational%20Asset%20Management%20System&descAlignY=58&descSize=18" width="100%"/>

<!-- Animated typing subtitle -->
<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=22&duration=3000&pause=1000&color=1BFFFF&center=true&vCenter=true&width=650&lines=Register.+Allocate.+Book.+Maintain.+Audit.;A+MERN-stack+ERP+for+every+asset+you+own.;Built+with+React+19+%2B+Express+5+%2B+MongoDB." alt="Typing SVG" />
</a>

<br/>

<!-- Badges -->
![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/status-active--development-orange?style=flat-square)

</div>

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:2E3192,100:1BFFFF&height=3&width=100%25" width="100%"/>

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [What Changed in This Pass](#what-changed-in-this-pass)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Production Notes](#production-notes--still-todo-before-a-real-launch)
- [Contributing](#contributing)
- [License](#license)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:2E3192,100:1BFFFF&height=3&width=100%25" width="100%"/>

## Overview

**AssetFlow** is a full-stack ERP module for tracking organizational assets from
registration through retirement — allocation to employees, resource booking,
maintenance scheduling, audits, and reporting — all wrapped in one clean
dashboard.

<div align="center">
<img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="380" alt="dashboard animation placeholder"/>
<br/>
<sub>Replace this GIF with a real screen recording of your dashboard once deployed</sub>
</div>

## Feature Highlights

<table>
<tr>
<td width="50%" valign="top">

### Auth & Access
- JWT-based authentication (7-day access token)
- Role-aware routing (Admin / Employee)
- Seeded admin account for instant first login

### Organization & Assets
- Full asset registry with image + document uploads
- Vendor management
- Allocation & return tracking with live activity logs

</td>
<td width="50%" valign="top">

### Booking & Maintenance
- Resource booking calendar
- Maintenance scheduling & history
- Audit trails for compliance

### Dashboard & Reports
- Live activity feed (login, create, allocate, return)
- Chart.js-powered analytics
- Notifications wired to real backend events

</td>
</tr>
</table>

## What Changed in This Pass

> This pass took the backend from ~50% stubbed to a **complete REST API**
> and connected the frontend to real data end-to-end.

| Area | Change |
|---|---|
| **Backend Controllers/Routes** | Filled in previously-empty **User, Vendor, Dashboard, Audit,** and **Activity** modules — API now complete for every schema-defined module |
| **Activity Logging** | New logging service wired into login, asset creation, and allocation/return — powers real Notifications & Dashboard feeds |
| **CSS Fix** | Fixed invisible PrimeReact button labels (`.p-button` had a black background with no explicit text color) |
| **App Hardening** | Added CORS origin allow-listing, a 5MB JSON body limit, and a 404 handler to `app.js` |
| **Frontend API Layer** | Built `src/api/` and `AuthContext`; rewired **every page** (Login, Dashboard, Organization, Assets, Allocation, Resource Booking, Maintenance, Audit, Reports, Notifications) from static mocks to live backend calls |
| **Dev Setup** | Added `backend/.env` with random dev-only secrets + `backend/scripts/seed.js` for an initial Admin user |

## Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---|
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · PrimeReact · Chart.js |
| **Backend** | Node.js · Express 5 · JWT Auth |
| **Database** | MongoDB · Mongoose |
| **Storage** | Local `backend/uploads` (S3-ready for production) |

</div>

## System Architecture

The diagram below shows how a request moves from the browser through the API
layer, into the Express controllers, and down to MongoDB — with the activity
logging service tapping in on every write operation.

```mermaid
flowchart TB

    %% ===== CLIENT LAYER =====
    subgraph CLIENT["FRONTEND — React 19 + Vite"]
        direction TB
        AUTH["Login Page / AuthContext"]
        APILAYER["src/api — centralized API layer"]
        PAGES["Pages: Dashboard, Organization, Assets,
Allocation, Resource Booking,
Maintenance, Audit, Reports, Notifications"]

        AUTH --> APILAYER
        PAGES --> APILAYER
    end

    %% ===== API GATEWAY =====
    subgraph GATEWAY["EXPRESS APP — app.js"]
        direction TB
        CORS["CORS allow-list + JSON body limit"]
        JWTMW["JWT Auth Middleware"]
        ROUTES["Route Layer
/api/auth  /api/users  /api/vendors
/api/assets  /api/allocations
/api/dashboard  /api/audit  /api/activity"]

        CORS --> JWTMW --> ROUTES
    end

    %% ===== SERVICE LAYER =====
    subgraph SERVICES["CONTROLLERS + SERVICES"]
        direction TB
        AUTHCTRL["Auth Controller"]
        USERCTRL["User / Vendor Controller"]
        ASSETCTRL["Asset / Allocation Controller"]
        DASHCTRL["Dashboard / Audit Controller"]
        LOGSVC["Activity Logging Service"]

        AUTHCTRL --> LOGSVC
        ASSETCTRL --> LOGSVC
    end

    %% ===== DATA LAYER =====
    subgraph DATA["MONGODB — Mongoose Models"]
        direction TB
        USERS[("Users")]
        VENDORS[("Vendors")]
        ASSETS[("Assets")]
        ALLOC[("Allocations")]
        LOGS[("Activity Logs")]
    end

    APILAYER -->|"HTTPS / JWT Bearer"| CORS
    ROUTES --> AUTHCTRL
    ROUTES --> USERCTRL
    ROUTES --> ASSETCTRL
    ROUTES --> DASHCTRL

    AUTHCTRL --> USERS
    USERCTRL --> USERS
    USERCTRL --> VENDORS
    ASSETCTRL --> ASSETS
    ASSETCTRL --> ALLOC
    DASHCTRL --> LOGS
    LOGSVC --> LOGS
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:2E3192,100:1BFFFF&height=3&width=100%25" width="100%"/>

## Getting Started

### 1. Backend

```bash
cd backend
npm install

# .env is already populated with a random JWT secret.
# Update MONGODB_URI to point at your MongoDB instance (Atlas or local).

npm run seed   # creates an Admin login: admin@assetflow.com / Admin@12345
npm run dev    # -> http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install

# .env already points VITE_API_URL at http://localhost:5001/api

npm run dev    # -> http://localhost:5173
```

<div align="center">

Sign in with the seeded admin account, or use **"Create account"** to register a new Employee.

</div>

## Environment Variables

<details>
<summary><b>backend/.env</b> (click to expand)</summary>

```env
PORT=5001
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=replace-before-deploying
CLIENT_URL=http://localhost:5173
```

</details>

<details>
<summary><b>frontend/.env</b> (click to expand)</summary>

```env
VITE_API_URL=http://localhost:5001/api
```

</details>

## Project Structure

```text
AssetFlow/
│
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── vendor.controller.js
│   │   ├── asset.controller.js
│   │   ├── allocation.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── audit.controller.js
│   │   └── activity.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vendor.routes.js
│   │   ├── asset.routes.js
│   │   ├── allocation.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── audit.routes.js
│   │   └── activity.routes.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   ├── Asset.js
│   │   ├── Allocation.js
│   │   └── ActivityLog.js
│   │
│   ├── services/
│   │   └── activityLogger.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── scripts/
│   │   └── seed.js
│   │
│   ├── uploads/                  # asset images & documents
│   ├── .env
│   ├── package.json
│   └── app.js
│
└── frontend/
    ├── src/
    │   ├── api/                  # centralized API layer (axios instance + endpoints)
    │   │   ├── client.js
    │   │   ├── auth.api.js
    │   │   ├── assets.api.js
    │   │   └── dashboard.api.js
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   │
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Organization.jsx
    │   │   ├── Assets.jsx
    │   │   ├── Allocation.jsx
    │   │   ├── ResourceBooking.jsx
    │   │   ├── Maintenance.jsx
    │   │   ├── Audit.jsx
    │   │   ├── Reports.jsx
    │   │   └── Notifications.jsx
    │   │
    │   ├── components/
    │   ├── index.css              # Tailwind + PrimeReact overrides
    │   └── main.jsx
    │
    ├── .env
    ├── package.json
    └── vite.config.js
```

## Production Notes — Still TODO Before a Real Launch

- [ ] Regenerate `JWT_SECRET` and set a real `MONGODB_URI` — never commit `.env`
- [ ] Put the API behind HTTPS and set `CLIENT_URL` to your real frontend origin
- [ ] Add rate limiting (e.g. `express-rate-limit`) to `/api/auth/login`
- [ ] Add server-side pagination to list endpoints once data volume grows
- [ ] Move asset images/documents to object storage (e.g. S3) before scaling
- [ ] Consider refresh tokens — current JWT is a single 7-day access token

## Contributing

Contributions, issues, and feature requests are welcome.
Feel free to check the [issues page](../../issues) or open a pull request.

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1BFFFF,100:2E3192&height=120&section=footer" width="100%"/>

<sub>AssetFlow &copy; 2026</sub>

</div>
