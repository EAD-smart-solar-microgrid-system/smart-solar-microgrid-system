# Smart Solar Microgrid API

## Purpose

This ASP.NET Core Web API is the central service for the Smart Solar Microgrid Trading System. Web and native Android clients will communicate with it through REST calls. Business logic will remain in this service, and clients will not connect directly to MongoDB.

## Architecture

The intended request flow is:

`Controller -> Service -> Repository -> MongoDB`

- Controllers handle HTTP routes, request binding, and responses.
- Services contain business rules and coordinate application work.
- Repositories contain MongoDB queries and persistence operations.
- Models represent MongoDB/domain data.
- DTOs represent API input and output separately from database models.

The current foundation includes health, station management, and Prosumer account-control APIs. Authentication and client user interfaces remain separate assignment work.

## Required software

- .NET 8 SDK (the project targets `net8.0`)
- A MongoDB Atlas deployment for persistence

## Restore dependencies

From the `Server` directory, run:

```powershell
dotnet restore
```

## Run locally

From the `Server` directory, run:

```powershell
dotnet run --project .\SmartSolarMicrogrid.Api\SmartSolarMicrogrid.Api.csproj
```

The HTTP development profile is available at `http://localhost:5278`. The HTTPS profile is available at `https://localhost:7245` when the local ASP.NET Core development certificate is trusted. HTTPS redirection is enabled outside Development; this keeps the HTTP development profile directly testable.

## Swagger

In Development, open:

`http://localhost:5278/swagger` or `https://localhost:7245/swagger`

The exact port can differ if the launch profile selects another available port. Swagger is enabled only in Development.

## MongoDB configuration

MongoDB settings are in `SmartSolarMicrogrid.Api/appsettings.json` under the `MongoDb` section:

```json
"MongoDb": {
  "ConnectionString": "mongodb://localhost:27017",
  "DatabaseName": "SmartSolarMicrogridDb"
}
```

This is a non-secret fallback value. Development Atlas credentials belong only in the ignored `.env` file, which overrides it through normal environment-variable configuration. The application creates one standard `MongoClient`, exposes `IMongoDatabase`, and registers `MongoDbContext` through dependency injection. Creating these objects does not make the general health endpoint depend on a live MongoDB connection.

The general API probe remains available at `GET /api/health` and reports whether the API is running. The separate `GET /api/health/mongodb` probe sends a MongoDB `ping` and returns `503 Service Unavailable` when MongoDB cannot be reached; MongoDB availability does not make `/api/health` fail.

### Local development configuration

Copy `SmartSolarMicrogrid.Api/.env.example` to `SmartSolarMicrogrid.Api/.env` for local development. The real `.env` file is ignored by Git; `.env.example` is safe to commit. Set `MongoDb__ConnectionString` to the Atlas SRV URI and `MongoDb__DatabaseName` to `SmartSolarMicrogridDb`. Never commit Atlas credentials.

The API loads `.env` only when the environment is `Development`, before `WebApplication.CreateBuilder` builds the normal ASP.NET Core configuration. Double underscores map to configuration section separators, so `MongoDb__ConnectionString` becomes `MongoDb:ConnectionString` and binds to `MongoDbSettings` normally. Existing operating-system environment variables are not overwritten by `.env`; command-line and normal ASP.NET Core environment-variable configuration precedence remain in effect. Production/IIS should use real environment variables or secure deployment configuration instead of depending on a physical `.env` file. The `.env` file is not copied to build or publish output.

The Atlas cluster must be running, the development IP must be allowed in Atlas Network Access, and the database user must have sufficient read/write access for persistence tests.

The `SolarStationInfo` collection is obtained through the repository and is not manually created at application startup. MongoDB creates the `SmartSolarMicrogridDb` database and `SolarStationInfo` collection automatically when the first station document is successfully inserted. The API does not seed station data on startup.

Never commit database usernames, passwords, Atlas connection strings, or other secrets. Use local user secrets, environment variables, or an ignored local configuration file when credentials are needed.

## Member 3 - Microgrid Node Management

The Member 3 phase manages solar microgrid nodes in the `SolarStationInfo` MongoDB collection.

Station fields are:

- `Id` — server-controlled MongoDB ObjectId represented as a string in the API.
- `StationName`
- `Latitude`
- `Longitude`
- `CapacityKwPerHour`
- `BatteryStorageSlotCapacity`
- `OperatingSchedule`
- `Status` — the server-side `StationStatus` enum, which is `Active` or `Inactive`.
- `CreatedAt`
- `UpdatedAt`

The public endpoints are:

- `GET /api/stations`
- `POST /api/stations`
- `PUT /api/stations/{id}`
- `PATCH /api/stations/{id}/status`

There is intentionally no public `GET /api/stations/{id}` endpoint. The repository can still retrieve a station internally for update and status operations.

New stations default to `Active`. `Status`, `Id`, `CreatedAt`, and `UpdatedAt` are not accepted in create or details-update request DTOs. Status changes are available only through the status endpoint.

Operating schedules use a simple list of same-day entries containing `DayOfWeek`, `OpenTime`, and `CloseTime`. Times use strict `HH:mm` strings. This representation is easy for a web form to send, serializes cleanly as JSON and MongoDB strings, and does not need a custom serializer. Each entry must use a valid day and a closing time later than its opening time.

`BatteryStorageSlotCapacity` represents the configured capacity/count of battery storage slots at station definition time. It is not dynamic booking availability. Member 4 owns actual `EnergyBookingSlots` records, availability, and slot booking logic, so this API does not create or update those records.

Station validation is performed in `StationService`: station name, latitude, longitude, capacity, battery capacity, schedule days, schedule times, and status values are checked before repository calls. Station names are trimmed as required; invalid values are rejected rather than silently corrected.

Deactivation is also a service-layer rule. Before changing `Active` to `Inactive`, `StationService` asks the narrow `IActiveReservationChecker` dependency whether active reservations exist. If the checker reports active reservations, the API returns `409 Conflict` and does not update MongoDB. The current Member 2 reservation implementation is not connected, so the temporary `UnavailableActiveReservationChecker` returns an unavailable signal and the API fails closed with `503 Service Unavailable`; it never pretends that there are zero reservations. Member 2 can later replace this registration with the real checker.

Member 1's future authentication and role-based authorization must protect these management endpoints after that work is merged. JWT, login, users, and hard-coded temporary roles are intentionally not implemented here.

## Member 3 - Prosumer Account Control

Prosumer profiles are stored in the `UsersDetail` MongoDB collection. NIC is normalized by trimming whitespace and converting to uppercase, then stored as the MongoDB `_id`. This makes NIC the primary business identifier and gives the database uniqueness enforcement without a separate index.

The Prosumer model contains `Nic`, `FullName`, `Email`, optional `PhoneNumber`, optional `Address`, `AccountStatus`, `CreatedAt`, and `UpdatedAt`. It does not store passwords, JWTs, or session tokens.

The public registration endpoint is `POST /api/prosumers/register`. New profiles receive the server-controlled `PendingActivation` status and UTC timestamps. Duplicate NIC values return `409 Conflict`; the client cannot choose account status or timestamps.

Authenticated self-service routes are:

- `GET /api/prosumers/me`
- `PUT /api/prosumers/me`
- `POST /api/prosumers/me/deactivation-request`

The current implementation deliberately returns `401 Unauthorized` for these routes until Member 1 supplies the authenticated Prosumer NIC through `ICurrentProsumerAccessor`. It never trusts a NIC from a query string or request body.

Profile updates can change only full name, email, phone number, and address. NIC, account status, and timestamps remain server-controlled. A deactivation request changes `Active` to `DeactivationRequested`; it does not delete the document or immediately set `Deactivated`. Pending activation and already deactivated accounts cannot request deactivation. Future activation approval and reactivation are Backoffice responsibilities and are not implemented here.

## Initial API infrastructure

- `GET /api/health` returns HTTP 200 with the API status.
- MongoDB configuration and dependency injection registration are prepared.
- Development CORS and Development-only Swagger are configured.

Authentication, Backoffice activation/reactivation, reservations, energy booking slots, QR verification, maps, Android functionality, and the Web UI are outside this phase.
