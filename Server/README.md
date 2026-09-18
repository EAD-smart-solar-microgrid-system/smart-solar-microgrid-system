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

## Current functionality

Only the initial API infrastructure and health endpoint are implemented:

- `GET /api/health` returns HTTP 200 with the API status.
- MongoDB configuration and dependency injection registration are prepared.
- Development CORS and Development-only Swagger are configured.

Authentication, users, prosumers, stations, slots, reservations, QR verification, maps, and booking logic are not implemented.
