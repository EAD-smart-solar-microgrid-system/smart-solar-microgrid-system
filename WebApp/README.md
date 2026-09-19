# Smart Solar Microgrid Trading System - Client-Server Application

**Module:** SE4040 - Enterprise Application Development  
**System Title:** Smart Solar Microgrid Trading System  
**Component:** Shared Web Application Foundation  

> [!IMPORTANT]
> **Foundation Status Notice:**  
> The current implementation contains **ONLY the shared common Web foundation**. Member-specific business logic, forms, authentication flows, CRUD operations, and reservation features have **NOT** been implemented and are strictly reserved for future individual assignment milestones.

---

## 1. Project Overview

The **Smart Solar Microgrid Trading System** is an enterprise-grade client-server application engineered to facilitate and manage peer-to-grid power trading between Solar Prosumers and solar microgrid distribution nodes.

The system serves three primary user groups:
1. **Backoffice Users**: Manage administrative users, Solar Prosumer profiles (activation, deactivation, reactivation), microgrid node configurations, operational schedules, and administrative governance.
2. **Grid Operators**: Oversee daily microgrid operations, monitor battery slot availability, observe reservations, and verify energy transfer completions.
3. **Solar Prosumers**: Find nearby microgrid nodes, reserve, modify, or cancel energy trading slots, track booking history, and present secure verification QR codes at microgrid nodes.

---

## 2. Complete Client-Server Architecture

The system strictly adheres to a multi-tier, client-server distributed architecture:

```
+--------------------------+          +--------------------------+
|     Web Application      |          | Native Android App       |
| (Responsive UI Client)   |          | (Solar Prosumer/Operator)|
+--------------------------+          +--------------------------+
             |                                      |
             | REST API (JSON / HTTP)               | REST API (JSON / HTTP)
             +------------------+-------------------+
                                |
                                v
               +----------------------------------+
               |           C# Web API             |
               |     (Hosted on Windows IIS)      |
               |     [Authoritative FAT Service]  |
               +----------------------------------+
                                |
                                | MongoDB Driver (.NET)
                                v
               +----------------------------------+
               |        MongoDB Database          |
               | (UsersDetail, SolarStationInfo,  |
               |  EnergyBookingSlots, EnergyRes)  |
               +----------------------------------+
```

### Architectural Rules:
- **Zero Direct Database Access**: Neither the Web client nor the Android client may ever connect directly to MongoDB.
- **Single Communication Channel**: Both client tiers communicate exclusively through the C# Web API using RESTful JSON endpoints.
- **FAT Service Pattern**: All authoritative business rules, domain validations, state transitions, and persistence reside inside the C# Web API.
- **Endpoint Reuse**: Web and Android clients reuse identical API endpoints for identical business actions.
- **Client Responsibilities**: The Web application is strictly a responsive presentation client. Client-side checks are limited to basic format/UX validation; authoritative validation is strictly executed by the API.

---

## 3. User Roles

The system supports three user roles across the platform:
- **Backoffice**: Administrative role with access to user management, prosumer verification/reactivation, node configurations, and global reporting.
- **Grid Operator**: Operational role with access to station monitoring, real-time slot availability, and transaction verification.
- **Solar Prosumer**: Energy provider/consumer role primarily interacting via the native Android application to reserve energy slots and exchange energy.

---

## 4. Exact Web Function Names

The Web application encompasses the following canonical functional areas:
1. **Login and role-based access**
2. **User Management**
3. **Prosumer Management**
4. **Microgrid Node Management**
5. **Energy Slot Reservation Management**

---

## 5. Mobile Function Context

The native Android mobile application operates in parallel with the Web application, delivering:
- **Prosumer Account Control**: Prosumer self-registration using National Identity Card (NIC) and profile maintenance.
- **Reservation & QR Dispatch**: Slot search, reservation booking, schedule modification, cancellation, and cryptographic QR code generation upon confirmation.
- **Dashboard & Maps**: Visual discovery of nearby microgrid stations and battery capacity.
- **Operator Mode**: Mobile QR scanning and on-site transfer validation for field grid operators.

*Note: Android code is isolated to the `Android/` project directory and is strictly forbidden inside the `WebApp/` codebase.*

---

## 6. Server Business Rules

The central C# Web API enforces the following authoritative domain rules:
- **Reservation Scheduling Window**: Reservations must be scheduled within a rolling seven-day forward window.
- **Modification Notice Period**: Reservation modifications require at least 12 hours of prior notice.
- **Cancellation Notice Period**: Reservation cancellations require at least 12 hours of prior notice.
- **Capacity & Conflict Validation**: Station capacity and slot overlap conflicts must be strictly validated by the API prior to slot confirmation.
- **Safe Deactivation**: A microgrid node cannot be deactivated while active or pending reservations are linked to it.
- **Prosumer Reactivation**: A deactivated prosumer profile can only be reactivated by an authorized Backoffice user.
- **QR Transaction Verification**: QR-driven transactions must be validated against authoritative server-side reservation records.
- **Role Authorization**: Protected operations require matching server-validated claims/roles.

---

## 7. FAT Service Pattern Explanation

In accordance with enterprise architecture principles, this project enforces the **FAT Service** architectural pattern:
- **Thin Client Philosophy**: The Web application is purely an interactive user interface layer. It does not calculate business rules, determine slot allocations, or decide status validity.
- **Authoritative Server**: The C# Web API hosts the domain layer, business entities, validation engine, and transaction boundaries.
- **Consistency Guarantee**: Because both Web and Android clients depend on the same C# Web API endpoints, all business logic and security policies are uniformly enforced across all client types.

---

## 8. Web Technology Stack

The Web application foundation is built with the approved lightweight modern web stack:

- **Framework**: React (v19)
- **Bundler & Dev Server**: Vite (v8)
- **Language**: JavaScript (ES Modules, JSX)
- **Styling**: Bootstrap 5 (`bootstrap@5.3.x`) & Custom CSS
- **Client Routing**: React Router (`react-router-dom@7.x`)
- **HTTP Client**: Native Browser Fetch API
- **Local State / Storage**: Browser `sessionStorage`
- **Linting & Code Quality**: Oxlint / ESLint
- **Runtime Environment**: Node.js (`>= v20.x`, tested on `v22.15.0`) & npm (`10.9.2`)

### Strictly Prohibited Technologies:
To guarantee architectural compliance and maintain university project guidelines, the following technologies are strictly **NOT** used:
- Next.js / Nuxt / Angular / Vue
- jQuery
- Axios
- Redux
- Tailwind CSS
- TypeScript (JavaScript used exclusively)
- Direct MongoDB Node.js drivers
- Client-side business logic engines

---

## 9. Web Project Folder Structure

```
WebApp/
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignore rules
├── index.html                       # HTML5 application shell
├── package.json                     # Dependency manifests & scripts
├── vite.config.js                   # Vite configuration
├── README.md                        # Web foundation documentation
├── public/                          # Static assets
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx                     # Application bootstrap and style imports
    ├── App.jsx                      # Router configuration and top-level route mapping
    ├── app/                         # Global application-level utilities
    │   └── .gitkeep
    ├── components/
    │   └── common/                  # Reusable presentation-only components
    │       ├── PageHeader.jsx       # Semantic page header
    │       ├── LoadingIndicator.jsx # Accessible status spinner
    │       ├── ErrorAlert.jsx       # Accessible error banner
    │       └── EmptyState.jsx       # Fallback empty state presenter
    ├── config/
    │   └── appConfig.js             # Environment reader & base URL sanitizer
    ├── constants/
    │   ├── roles.js                 # System roles (BACKOFFICE, GRID_OPERATOR)
    │   └── routes.js                # Canonical route path definitions
    ├── layouts/
    │   └── AppLayout.jsx            # Shared responsive navigation shell & footer
    ├── pages/
    │   ├── HomePage.jsx             # System status & module assignment landing page
    │   └── NotFoundPage.jsx         # Accessible 404 handler
    ├── services/
    │   ├── http/
    │   │   └── httpClient.js        # Generic fetch-based HTTP client
    │   └── storage/
    │       └── sessionStorage.js    # Browser sessionStorage utility
    ├── styles/
    │   └── index.css                # Global layout, variables, & Bootstrap integration
    ├── utils/                       # Generic helper functions
    │   └── .gitkeep
    └── features/                    # Feature domain boundaries (Future Work)
        ├── authentication/          # Member 1 boundary
        │   └── README.md
        ├── usermanagement/          # Member 1 boundary
        │   └── README.md
        ├── prosumermanagement/      # Member 2 boundary
        │   └── README.md
        ├── microgridnodes/          # Member 3 boundary
        │   └── README.md
        └── energyslotreservations/  # Member 4 boundary
            └── README.md
```

---

## 10. Purpose of Each Shared Folder

| Folder Path | Architectural Purpose |
|:---|:---|
| `src/app/` | Global app context providers and bootstrap initialization logic. |
| `src/components/common/` | Pure presentation components without business logic or API calls. |
| `src/config/` | Centralized environment variable consumption (`appConfig.js`). |
| `src/constants/` | System-wide immutable definitions: user roles (`roles.js`) and routes (`routes.js`). |
| `src/layouts/` | Structural page templates including the top navbar, container, and footer (`AppLayout.jsx`). |
| `src/pages/` | Primary routed view components (`HomePage.jsx`, `NotFoundPage.jsx`). |
| `src/services/http/` | Generic HTTP communication layer wrapping native `fetch` (`httpClient.js`). |
| `src/services/storage/` | Browser `sessionStorage` management utility for auth tokens and user IDs. |
| `src/styles/` | Global styles, CSS custom properties, and Bootstrap overrides (`index.css`). |
| `src/utils/` | General-purpose helper functions (date formatting, string helpers). |
| `src/features/` | Domain-isolated feature modules reserved for individual member assignments. |
| `public/` | Publicly accessible static assets served directly by Vite. |

---

## 11. Team Ownership

| Assignment Area | Exact Web Function Name | Assigned Member |
|:---|:---|:---|
| Security & Auth | **Login and role-based access** | Member 1 |
| Administration | **User Management** | Member 1 |
| Prosumer Domain | **Prosumer Management** | Member 2 |
| Grid Infrastructure | **Microgrid Node Management** | Member 3 |
| Power Trading | **Energy Slot Reservation Management** | Member 4 |

---

## 12. Implemented Foundation Features

The shared foundation includes:
- [x] **Safe Environment Configuration**: Vite-compatible `.env.example` and `appConfig.js` with trailing slash normalization and missing-variable detection.
- [x] **Role Constants**: Canonical role definitions (`BACKOFFICE`, `GRID_OPERATOR`) in `src/constants/roles.js`.
- [x] **Route Constants**: Canonical path constants in `src/constants/routes.js`.
- [x] **Generic HTTP Client**: Native fetch-based client in `src/services/http/httpClient.js` supporting GET, POST, PUT, PATCH, DELETE, Bearer tokens, JSON serialization, empty-response resilience, and error categorization (2xx, 400/422, 401, 403, network failures).
- [x] **Session Storage Utility**: Secure helper in `src/services/storage/sessionStorage.js` managing tokens, user ID, role, and login state without storing sensitive passwords.
- [x] **Common Presentation Components**: Semantic, accessible, Bootstrap-powered `PageHeader`, `LoadingIndicator`, `ErrorAlert`, and `EmptyState`.
- [x] **Shared Layout**: `AppLayout.jsx` with responsive header, title brand, container, `<Outlet />`, and footer.
- [x] **Foundation Landing Page**: `HomePage.jsx` displaying project identity, readiness status, and 5 non-functional feature cards.
- [x] **Not Found Page**: Accessible 404 page in `NotFoundPage.jsx` with return-to-home navigation.
- [x] **Application Routing**: React Router configuration in `App.jsx` activating `/` and `*`.
- [x] **Global Styling**: Bootstrap 5 and accessible layout styling in `src/styles/index.css`.
- [x] **Feature Architecture Boundaries**: Isolated feature folders with descriptive README boundary files.

---

## 13. Features Not Implemented Yet

To preserve academic integrity and individual member assignment scopes, the following are strictly **NOT** implemented in this foundation:
- Member 1: Login forms, JWT token requests, authentication guards, user CRUD tables, and account modals.
- Member 2: Solar Prosumer registration lists, profile review forms, and prosumer activation/deactivation triggers.
- Member 3: Microgrid node configuration forms, capacity status editors, and maintenance schedule calendars.
- Member 4: Energy slot booking wizards, schedule modification forms, cancellation requests, and reservation tracking grids.
- Direct MongoDB connections (forbidden in client tier).

---

## 14. Installation & Setup Instructions

### Prerequisites
- Node.js (`v20.x` or higher; tested on `v22.15.0`)
- npm (`v10.x` or higher; tested on `10.9.2`)

### 1. Navigate to Web Project Directory
```powershell
cd WebApp
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Environment Configuration
Create a local `.env` file based on `.env.example`:
```powershell
Copy-Item .env.example .env
```
Ensure `VITE_API_BASE_URL` points to your active C# Web API instance:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Run Development Server
```powershell
npm run dev
```
Open your browser at `http://localhost:5173` to view the running foundation.

### 5. Run Lint Check
```powershell
npm run lint
```

### 6. Build for Production
```powershell
npm run build
```

---

## 15. C# Web API Connection Instructions

1. Ensure the central C# Web API is running on Windows IIS (or `dotnet run` locally during development).
2. Configure CORS in the C# Web API (`Program.cs` / `Startup.cs`) to allow requests from the Web client origin (e.g., `http://localhost:5173`).
3. Verify that the `VITE_API_BASE_URL` in your `.env` matches the API route prefix (e.g., `http://localhost:5000/api`).
4. All feature modules should invoke endpoints via `httpClient.get('endpoint')` without repeating the base URL.

---

## 16. Security Guidelines

- **No Hardcoded Secrets**: Never commit passwords, API keys, JWT signing keys, or connection strings into source code.
- **Session Protection**: Only store the non-sensitive JWT token, user identifier, and role in `sessionStorage`. Never store credentials or plain passwords.
- **Sanitized Logging**: Never log tokens, passwords, NIC values, or personal prosumer information to the browser console.
- **No Direct DB Access**: Ensure client-side code never references or imports database drivers.

---

## 17. Git Workflow

- **Active Working Branch**: Common foundation work is tracked on branch:
  ```
  IT23293526
  ```
- **Feature Branches**: Individual members should coordinate their work using standard branch naming:
  - `feature/member1-login-and-user-management`
  - `feature/member2-prosumer-management`
  - `feature/member3-microgrid-node-management`
  - `feature/member4-energy-slot-reservations`
- **Clean Commits**: Do not make automated, bulk, or uncoordinated commits. Keep git history descriptive and structured.

---

## 18. Assignment Compliance Statement

This repository adheres to all specifications issued for module **SE4040 - Enterprise Application Development**. The architecture strictly isolates presentation logic from authoritative domain logic, establishes standardized REST communication contracts, respects user role divisions, and maintains strict individual feature boundaries.

---

## 19. Project Deliverable Placeholders

- **Repository URL**: `TODO - add final GitHub repository URL`
- **Demonstration Video URL**: `TODO - add final demonstration video URL`
