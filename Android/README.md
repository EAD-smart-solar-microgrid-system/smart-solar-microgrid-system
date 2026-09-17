# Smart Solar Microgrid Trading System

## Module
**SE4040 - Enterprise Application Development**  
Assignment Type: Four-member group assignment  
Sub-project: Pure Native Android Mobile Client

---

## Project Overview
The **Smart Solar Microgrid Trading System** is an enterprise distributed platform designed to streamline, balance, and govern peer-to-grid renewable energy trading between residential/commercial Solar Prosumers and localized solar microgrid nodes.

Solar Prosumers generate electrical energy via rooftop solar photovoltaic (PV) arrays and trade surplus power with localized microgrid infrastructure. The mobile client enables Prosumers to register and manage their accounts, locate nearby microgrid nodes, reserve energy drop-off or charging slots, receive secure digitally verifiable QR transaction credentials upon administrative approval, monitor real-time dashboards, and track historical bookings.

Simultaneously, Grid Operators utilize the mobile app in a dedicated Operator Mode to inspect node status, scan prosumer QR credentials, verify transactions against the central authority, and finalize physical energy transfers.

---

## Complete System Components
The full end-to-end enterprise solution comprises the following five core components:
1. **Pure Native Android Application**: The mobile client utilized by Solar Prosumers for self-service account management and booking dispatch, and by Grid Operators for on-site QR scanning and transfer finalization.
2. **Web Application**: The backoffice administrative portal used for user management, prosumer account lifecycle governance, microgrid node maintenance, and overall system configuration.
3. **Central C# Web API**: The authoritative central application service hosted on Windows IIS that implements all enterprise business rules, authentication, and transaction orchestration (following the FAT Service architectural pattern).
4. **MongoDB Server-side Database**: The enterprise document database accessed exclusively by the C# Web API to persist authoritative system entities across collections (`UsersDetail`, `SolarStationInfo`, `EnergyBookingSlots`, `EnergyReservation`).
5. **SQLite Local Database**: Embedded relational persistence within the Android application managing lightweight offline session caching and device-specific state.

---

## Architecture
```
+-----------------------------+           +-----------------------------+
|     Android Application     |           |       Web Application       |
|    (Native Kotlin/Views)    |           |    (Backoffice Dashboard)   |
+--------------+--------------+           +--------------+--------------+
               |                                         |
               | REST API (JSON)                         | REST API (JSON)
               |                                         |
               +--------------------+--------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |         Central C# Web API        |
                  |     (FAT Service Architecture)    |
                  |        Hosted on Windows IIS      |
                  +-----------------+-----------------+
                                    |
                                    | MongoDB Driver
                                    v
                  +-----------------------------------+
                  |          MongoDB Database         |
                  |   (Authoritative Server Storage)  |
                  +-----------------------------------+
```

### Strict Architectural Principles:
- **Android client never connects directly to MongoDB**: All mobile data exchange is routed through the C# Web API over HTTP/REST with JSON.
- **Web application never connects directly to MongoDB**: The web portal similarly communicates only with the central C# Web API.
- **FAT Web Service Pattern**: Authoritative business rules, capacity calculation, timing restrictions, credential validation, and state transitions reside strictly within the C# Web API. The Android client operates purely as a UI, local persistence, and hardware-integration tier.
- **Shared API Surface**: Both Android and Web platforms consume identical REST endpoints for shared operational tasks.
- **Local SQLite Isolation**: The SQLite database on Android is strictly reserved for client-side persistence and does not substitute for server authority.

---

## User Roles

### 1. Backoffice
- Administrative users operating the Web application.
- Manage user lifecycles: create Backoffice and Grid Operator accounts.
- Inspect, activate, deactivate, and reactivate Solar Prosumer accounts.
- Register, configure, and maintain microgrid physical nodes and operational schedules.

### 2. Grid Operator
- Field personnel using both the Web portal and the Android application.
- Monitor node battery slot capacity and booking schedules.
- Log into Android **Operator Mode**.
- Scan secure transaction QR codes presented by prosumers at charging/drop-off stations.
- Verify scanned data against the central C# Web API in real time.
- Finalize and record completed energy transfers.

### 3. Solar Prosumer
- Residential or commercial solar array owners primarily using the Android application.
- Register with National Identity Card (NIC) verification.
- Manage user profiles and submit deactivation requests.
- Discover nearby microgrid nodes using map interfaces.
- Reserve energy drop-off or charging slots within permitted scheduling windows.
- Modify or cancel reservations adhering to policy notice windows.
- View pending, approved, and historical bookings and dashboard metrics.
- Present server-approved digital QR tokens to station operators.

---

## Web Application Functions
The Web Application implements the following official assignment modules:
1. **Login and role-based access**
2. **User Management**
3. **Prosumer Management**
4. **Microgrid Node Management**
5. **Energy Slot Reservation Management**

*(Note: Web application source code is maintained separately from this Android repository).*

---

## Mobile Application Functions
The Android Application encompasses four core functional modules:
1. **Prosumer Account Control**
2. **Reservation & QR Dispatch**
3. **Dashboard & Maps**
4. **Operator Mode**

---

## Business Rules
The following enterprise business rules are enforced authoritatively by the **C# Web API**:
1. **Seven-day reservation rule**: Slot reservations must be scheduled within a rolling seven-day forward window.
2. **12-hour modification rule**: Modifications to existing reservations require a minimum of 12 hours advance notice before scheduled slot commencement.
3. **12-hour cancellation rule**: Cancellations require a minimum of 12 hours advance notice before scheduled slot commencement.
4. **Capacity/conflict validation**: Slot capacity and concurrency limits must be validated against microgrid node limits on the server before booking confirmation.
5. **Node-deactivation restriction**: A microgrid node cannot be deactivated while active, uncompleted reservations remain assigned to it.
6. **Prosumer-reactivation restriction**: A deactivated prosumer account cannot reactivate itself; reactivation requires authorized Backoffice intervention.
7. **Server-side QR verification**: QR tokens presented at physical nodes must be validated and verified against authoritative database records before transfer execution.
8. **Role-based authorization**: Restricted endpoints and operational states must be validated strictly against authenticated roles (Backoffice, Grid Operator, Solar Prosumer).

*The Android client displays validation errors returned by the API but does not act as the authoritative source of these business rules.*

---

## Android Technology Stack
- **Language**: Kotlin 2.0.21
- **Target Platform**: Android SDK API 36 (Minimum SDK API 24 - Android 7.0 Nougat)
- **UI Architecture**: Android Views with traditional XML layouts and Material Design 3
- **Local Persistence**: Pure Android `SQLiteOpenHelper` with SQLite database contracts
- **Networking**: Pure native `HttpURLConnection` with UTF-8 stream handling
- **JSON Parsing**: Android standard `org.json` (`JSONObject`, `JSONArray`)
- **Session Storage**: Encapsulated private `SharedPreferences`
- **Concurrency**: Reusable `ExecutorService` thread pool with main thread `Handler(Looper.getMainLooper())`
- **Build System**: Gradle 8.13 with Kotlin DSL (`build.gradle.kts`)

*Strict Compliance Notice: No forbidden third-party frameworks (Retrofit, Room, Gson, Volley, Hilt, Dagger, Koin, Jetpack Compose, Flutter, React Native) are introduced.*

---

## Android Package Structure
The Android application codebase is organized into clean architectural layers and clear module boundaries:

```
app/src/main/java/com/example/smartsolarmicrogridtradingsystem/
│
├── core/
│   ├── config/
│   │   └── AppConfig.kt              # API base URL, timeout constants, networking guidelines
│   ├── network/
│   │   ├── ApiCallback.kt            # Generic UI-marshaled callback interface
│   │   ├── ApiClient.kt              # Native HttpURLConnection REST client
│   │   ├── HttpMethod.kt             # HTTP method enum (GET, POST, PUT, PATCH, DELETE)
│   │   └── NetworkResult.kt          # Sealed result hierarchy (Success, HttpError, NetworkError, Unauthorized)
│   ├── session/
│   │   └── SessionManager.kt         # Private SharedPreferences wrapper (tokens, NIC, role)
│   ├── threading/
│   │   └── AppExecutors.kt           # Centralized thread pool & main thread dispatching
│   └── utils/
│       └── ConnectivityUtil.kt       # API 24+ network state inspection utility
│
├── data/
│   ├── local/
│   │   ├── model/
│   │   │   └── LocalSession.kt       # SQLite session entity model
│   │   └── sqlite/
│   │       ├── AppDatabaseHelper.kt  # Thread-safe SQLiteOpenHelper singleton & migration framework
│   │       └── DatabaseContract.kt   # SQLite table schemas, column keys, and DDL scripts
│   ├── remote/
│   │   └── dto/
│   │       ├── request/              # [Boundary] Feature request DTO models
│   │       └── response/             # [Boundary] Feature response DTO models
│   └── repository/                   # [Boundary] Repository implementations
│
├── domain/
│   └── model/                        # [Boundary] Business domain entity definitions
│
├── feature/
│   ├── prosumeraccount/
│   │   ├── ui/                       # [Boundary] Member 3: Prosumer Account screens
│   │   └── viewmodel/                # [Boundary] Member 3: Account ViewModels
│   ├── reservationqr/
│   │   ├── ui/                       # [Boundary] Member 2: Reservation & QR screens
│   │   └── viewmodel/                # [Boundary] Member 2: Reservation ViewModels
│   ├── dashboardmaps/
│   │   ├── ui/                       # [Boundary] Member 4: Dashboard & Maps screens
│   │   └── viewmodel/                # [Boundary] Member 4: Dashboard ViewModels
│   └── operatormode/
│       ├── ui/                       # [Boundary] Member 1: Operator Mode screens
│       └── viewmodel/                # [Boundary] Member 1: Operator ViewModels
│
├── shared/
│   ├── adapter/                      # [Boundary] Shared RecyclerView adapters
│   └── component/
│       └── BaseActivity.kt           # Reusable edge-to-edge system-bar inset Activity base
│
└── MainActivity.kt                   # Initial foundation confirmation launcher Activity
```

---

## Team Ownership
Feature development responsibilities are distributed among the four team members as follows:
- **Member 1**: Operator Mode (QR Scanning, server verification, energy transfer finalization)
- **Member 2**: Reservation & QR Dispatch (Slot booking, modification, cancellation, QR generation upon approval)
- **Member 3**: Prosumer Account Control (NIC registration, login, profile management, deactivation requests)
- **Member 4**: Dashboard & Maps (Google Maps station locator, booking filters, summary metrics)

---

## Current Implementation Status

### Implemented:
- [x] Verified build environment and detected project namespace (`com.example.smartsolarmicrogridtradingsystem`).
- [x] Standardized package hierarchy adhering strictly to clean architecture boundaries.
- [x] Native `ApiClient` utilizing `HttpURLConnection` supporting `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- [x] Central `AppExecutors` thread management with background pool and UI looper dispatch.
- [x] Generic `NetworkResult` and main-thread `ApiCallback` interfaces.
- [x] `SessionManager` providing secure `SharedPreferences` session state persistence without password retention.
- [x] `AppDatabaseHelper` SQLiteOpenHelper singleton with migration structure and `local_session` contract.
- [x] `ConnectivityUtil` supporting runtime network checking from API 24 through API 36.
- [x] `BaseActivity` providing system-bar edge-to-edge insets handling.
- [x] `MainActivity` and `activity_main.xml` presenting system identity and four disabled feature module cards.
- [x] Android Manifest configured with `INTERNET`, `ACCESS_NETWORK_STATE`, and development cleartext HTTP traffic.
- [x] Git configuration updated with ignore rules for build files, IDE settings, and credential files.
- [x] Unit test suite verifying foundation classes, network URL resolvers, and database contracts.

### Not Implemented Yet (Reserved for Individual Member Tasks):
- [ ] Prosumer Account Control (Member 3 feature)
- [ ] Reservation & QR Dispatch (Member 2 feature)
- [ ] Dashboard & Maps (Member 4 feature)
- [ ] Operator Mode (Member 1 feature)
- [ ] Google Maps integration and API keys
- [ ] Camera hardware integration and QR scanner libraries
- [ ] Feature-specific API endpoints and DTO serialization
- [ ] Feature-specific SQLite tables and repositories

---

## API Configuration

### Locating Configuration
The API connection configuration is managed in:
`app/src/main/java/com/example/smartsolarmicrogridtradingsystem/core/config/AppConfig.kt`

### Configuring the Development Server URL:
```kotlin
object AppConfig {
    const val BASE_URL: String = "http://YOUR_PC_LAN_IP:PORT/api/"
    // ...
}
```

### Physical Phone Testing Instructions:
1. **Never use `localhost` or `127.0.0.1`**: On Android devices, `localhost` points to the physical phone itself, not the development PC.
2. **Connect to the same Wi-Fi / Local Network**: Ensure both your development computer and your Android smartphone are connected to the same local area network.
3. **Find the Computer's LAN IP**:
   - On Windows: Open Command Prompt / PowerShell and execute `ipconfig`. Locate your active Wi-Fi or Ethernet adapter's **IPv4 Address** (e.g. `192.168.1.150`).
4. **Update `AppConfig.kt`**: Replace `YOUR_PC_LAN_IP:PORT` with your LAN IP and port where IIS or Kestrel is serving the C# Web API (e.g., `http://192.168.1.150:5000/api/`).
5. **Cleartext HTTP Note**: Cleartext HTTP (`usesCleartextTraffic="true"`) is enabled in `AndroidManifest.xml` specifically to support local IP testing. Production deployments must switch `BASE_URL` to an HTTPS domain.

---

## Build and Run Instructions
Follow these steps to build and run the Android client on a physical phone:
1. **Install Android Studio**: Download and install the latest stable version of Android Studio (e.g. Ladybug / Iguana / Hedgehog).
2. **Install Android SDK**: Open the SDK Manager and ensure Android SDK Platform 36 (and minimum SDK API 24) is installed with Android SDK Build-Tools.
3. **Clone the Repository**: Clone the project source code to your local machine using Git.
4. **Open the Android Project**: Launch Android Studio, select **Open**, and navigate to the `Android` directory containing `settings.gradle.kts`.
5. **Allow Gradle Synchronization**: Wait for Android Studio to download dependencies and sync the Gradle Kotlin DSL configuration.
6. **Connect a Physical Android Phone**: Connect your Android testing phone to the development computer using a high-quality USB data cable.
7. **Enable Developer Options**: On your phone, navigate to **Settings > About Phone** and tap **Build Number** 7 consecutive times until Developer Mode is activated.
8. **Enable USB Debugging**: In **Settings > Developer Options**, enable **USB Debugging** and accept the host computer's RSA key fingerprint prompt.
9. **Select the Phone**: In Android Studio's top toolbar device selector, select your physical phone model.
10. **Run the Application**: Click the green **Run (Shift + F10)** button or execute `./gradlew assembleDebug` in the terminal to build and deploy the APK to your phone.

---

## Security
- **No Secrets in Source Control**: Passwords, JWT signing keys, MongoDB connection strings, Google Maps API keys, and keystores must never be committed to Git.
- **Credential Storage**: Passwords are never saved in local storage (`SharedPreferences` or `SQLite`). Authentication relies on short-lived Bearer tokens.
- **Log Sanitation**: `ApiClient` strictly avoids printing passwords, tokens, NICs, and personal identity data into Logcat.

---

## Repository Link
Repository URL: TODO - add final GitHub repository URL

---

## Demonstration Video
Video URL: TODO - add final demonstration video URL

---

## Contribution Evidence
Each member must develop their designated feature within a dedicated Git branch (e.g. `feature/prosumer-account-control`, `feature/reservation-qr-dispatch`, `feature/dashboard-maps`, `feature/operator-mode`). All code merges into `main` must occur via reviewed Pull Requests accompanied by descriptive commit messages demonstrating individual contribution.

---

## Assignment Compliance
- **Pure Native Android**: Built with 100% native Android Views, Kotlin, XML layouts, and standard Android SDK components.
- **Zero Forbidden Libraries**: No Jetpack Compose, Flutter, React Native, Room, Retrofit, Gson, or third-party dependency injection frameworks.
- **Local SQLite Persistence**: Implemented via native `SQLiteOpenHelper`.
- **REST Communication**: All remote exchanges use standard JSON payloads via `HttpURLConnection` targeting the central C# Web API.
- **Database Boundary**: MongoDB is completely segregated from the client, communicating exclusively with the C# Web API.
- **FAT Service Architecture**: Authoritative business rules, capacity algorithms, and timing validations are located in the central Web API.
