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

The current foundation includes the health controller and service only. Assignment features are intentionally not implemented yet.

## Required software

- .NET 8 SDK (the project targets `net8.0`)
- A local MongoDB server is optional for the current health endpoint and will be required when repositories are added.

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

The application creates a standard `MongoClient`, exposes `IMongoDatabase`, and registers `MongoDbContext` through dependency injection. Creating these objects does not make the health endpoint depend on a live MongoDB connection.

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

## Initial API infrastructure

- `GET /api/health` returns HTTP 200 with the API status.
- MongoDB configuration and dependency injection registration are prepared.
- Development CORS and Development-only Swagger are configured.

Prosumer accounts, authentication, users, reservations, energy booking slots, QR verification, maps, Android functionality, and the Web UI are outside this phase.
