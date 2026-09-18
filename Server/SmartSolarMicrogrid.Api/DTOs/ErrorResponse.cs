/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ErrorResponse.cs
 * Purpose: Provide a small consistent error response for API failures.
 */

namespace SmartSolarMicrogrid.Api.DTOs;

public sealed record ErrorResponse(string Message);
