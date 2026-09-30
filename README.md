# SolarGrid — Smart Solar Microgrid Trading System

> A decentralized clean energy exchange, battery slot reservation, and QR dispatch platform connecting prosumers, grid operators, and station administrators across community microgrids.

---

## ⚡ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Backend API** | ASP.NET Core 8, MongoDB, JWT Authentication, Swagger/OpenAPI |
| **Web Portal** | React 19, Vite, Tailwind CSS v4, Context API |
| **Mobile App** | Native Android (Kotlin), Material 3, SQLite Cache, Google Maps API, CameraX QR Scanner |

---

## 📁 Repository Structure

```
smart-solar-microgrid-system/
├── Android/         # Native Android application (Prosumer & Operator modes)
├── Server/          # ASP.NET Core 8 Web API & MongoDB persistence layer
└── WebApp/          # React 19 web management & trading portal
```

---

## ✨ Key Features

- **Energy Trading & Slot Reservation**: Prosumers reserve charging/drop-off slots within a rolling 7-day window.
- **Secure QR Dispatch**: Time-stamped dynamic QR tokens generated for approved reservations, validated by station operators.
- **Geospatial Station Discovery**: Real-time nearby grid station search with status, capacity, and route distance.
- **Role-Based Access Control**:
  - **Backoffice Admin**: Station management, slot configuration, and prosumer account lifecycle.
  - **Grid Operator**: On-site QR scanning, energy transfer verification, and physical dispatch completion.
  - **Solar Prosumer**: Self-registration, profile management, slot booking, and QR token wallet.

---

## 🚀 Getting Started

### 1. Backend API (`Server/`)

**Prerequisites**: [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) and [MongoDB](https://www.mongodb.com/try/download/community)

```bash
cd Server/SmartSolarMicrogrid.Api
dotnet restore
dotnet run
```
- API Base URL: `http://localhost:5278`
- Swagger Documentation: `http://localhost:5278/swagger`

### 2. Web Portal (`WebApp/`)

**Prerequisites**: [Node.js 18+](https://nodejs.org/)

```bash
cd WebApp
npm install
npm run dev
```
- Web Portal URL: `http://localhost:5173`

### 3. Android Application (`Android/`)

**Prerequisites**: Android Studio (Ladybug or newer), JDK 17+, Android SDK 34+

```bash
cd Android
./gradlew assembleDebug
```
- Open `Android/` in Android Studio, configure `secrets.properties` with your Google Maps API key, and deploy to an emulator or physical device.

---

## 🔐 Sample Credentials (Local Dev)

| Role | Username / Identifier | Password | Access Level & Privileges |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | Web Portal (`/login`) — Full Governance, Prosumer Activation, Station Config, and **New Admin/Operator Creation** via **Admin Settings** (`/admin-settings` or `/user-management`) |
| **Grid Operator** | `operator` (or `operator1`) | `operator123` | Web Portal & Mobile Operator Mode — Station Operations, Slot Management & QR Token Verification |
| **Solar Prosumer** | Registered NIC (e.g., `200012345678`) | N/A (NIC-based auth) | Mobile Prosumer Account (requires Admin activation via `/prosumer-management`) |

> **Note:** Any logged-in Administrator can create additional Administrator accounts with full privileges via the Web Portal under **Admin Settings** (`/admin-settings` or `/user-management`).

---

## 📄 License & Academic Context

Developed as an Enterprise Application Development (EAD) project for the Smart Solar Microgrid Trading System.