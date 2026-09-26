# Smart Solar Microgrid Trading System — Web

Member 3's responsive microgrid node-management client. The React application is a UI layer only: it calls the ASP.NET Core API and never connects directly to MongoDB.

## Technology

- React 19 with JavaScript
- Vite 8
- Tailwind CSS 4 through `@tailwindcss/vite`
- Browser Fetch API
- React Router 7

Bootstrap, TypeScript, Axios, Redux, and client-side database access are not used.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Vite normally serves the app at `http://localhost:5173/`. The C# API development profile serves at `http://localhost:5278/`.

Set the API URL in a local `.env` file if needed:

```env
VITE_API_BASE_URL=http://localhost:5278
```

Only the public API base URL belongs in Vite variables. Never put MongoDB connection strings, database credentials, JWT secrets, or other secrets in this file; `VITE_` values are visible in browser code.

## Commands

```bash
npm run dev       # start Vite development server
npm run build     # create a production build
npm run lint      # run Oxlint
```

## Structure

```text
src/
├── components/
│   ├── common/              # reusable presentation helpers
│   └── stations/            # station list, form, schedule, modal, status badge
├── config/
│   ├── apiConfig.js         # one configured API base URL
│   └── appConfig.js         # compatibility config for shared foundation code
├── pages/
│   ├── HomePage.jsx
│   ├── StationsPage.jsx
│   └── NotFoundPage.jsx
├── services/
│   ├── apiClient.js         # Fetch wrapper and API error handling
│   └── stationService.js    # station endpoint functions
├── App.jsx
├── main.jsx
└── styles/index.css
```

There is intentionally no React DTO folder. The API response objects are plain JavaScript objects, and the form builds only the request payload fields that the C# DTO accepts.

## Routes and API calls

- `/` — project overview and link to node management
- `/stations` — Member 3 microgrid node management UI

The station service uses only:

- `GET /api/stations`
- `POST /api/stations`
- `PUT /api/stations/{id}`
- `PATCH /api/stations/{id}/status`

Create and update send `stationName`, `latitude`, `longitude`, `capacityKwPerHour`, `batteryStorageSlotCapacity`, and `operatingSchedule`. Status changes send only `{ "status": "Active" }` or `{ "status": "Inactive" }`. There is no DELETE button or DELETE service function because station lifecycle is Active/Inactive.

The schedule editor sends `dayOfWeek`, `openTime`, and `closeTime` using the API's expected `HH:mm` format. Client checks improve form feedback, but the ASP.NET Core API remains authoritative for validation and business rules.

## CORS and authentication boundary

The API must allow the Vite development origin `http://localhost:5173`. The existing server `Cors:DevelopmentOrigins` configuration already includes it, so no server change was required for this UI.

Member 1 still owns login, JWT issuance, role checks, and protected routes. `apiClient.js` accepts a future real bearer token in one place; it does not create or store a fake token. The `/stations` route should be protected when Member 1's authentication layer is integrated.

## Architecture

```text
Browser → React component → stationService → apiClient / Fetch
        → ASP.NET Core station controller/service → repository → MongoDB Atlas
```

React renders state and collects user input. Vite serves and bundles the frontend during development and build. Tailwind supplies the utility classes used for layout, spacing, typography, forms, tables, badges, and responsive behavior. Only the C# API accesses the database and applies authoritative station rules.
