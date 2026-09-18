/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: HealthResponse.cs
 * Purpose: Define the response returned by the API health endpoint.
 */

namespace SmartSolarMicrogrid.Api.DTOs;

public sealed record HealthResponse(string Status, string Service);
